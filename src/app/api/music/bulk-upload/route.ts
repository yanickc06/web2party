import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import * as mm from "music-metadata";
import {
  estimateMood,
  estimateBPMFromGenre,
  guessGenreFromArtist,
} from "@/lib/bpm-detector";
import { quickBPMAnalysis, quickKeyAnalysis } from "@/lib/audio-analyzer";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Keine Dateien hochgeladen" },
        { status: 400 },
      );
    }

    const uploadDir = join(process.cwd(), "public", "uploads", "music");
    await mkdir(uploadDir, { recursive: true });

    const results: Array<{
      filename: string;
      success: boolean;
      song?: {
        id: string;
        title: string;
        artist: string | null;
      };
      error?: string;
    }> = [];

    for (const file of files) {
      try {
        // Datei als Buffer lesen
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Metadaten auslesen
        const metadata = await mm.parseBuffer(buffer, file.type);

        // Eindeutiger Dateiname
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${timestamp}-${safeName}`;
        const filePath = join(uploadDir, fileName);

        // Datei speichern
        await writeFile(filePath, buffer);

        // Song in DB erstellen
        const title =
          metadata.common.title ||
          file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        const artist = metadata.common.artist || null;
        const album = metadata.common.album || null;
        const year = metadata.common.year || null;

        // Genre kann an verschiedenen Stellen sein
        let genre =
          metadata.common.genre?.[0] ||
          (metadata.native?.["ID3v2.3"]?.find(
            (t: { id: string; value: unknown }) => t.id === "TCON",
          )?.value as string) ||
          (metadata.native?.["ID3v2.4"]?.find(
            (t: { id: string; value: unknown }) => t.id === "TCON",
          )?.value as string) ||
          null;

        // Wenn kein Genre in Tags, versuche aus Künstler zu erraten
        if (!genre && artist) {
          genre = guessGenreFromArtist(artist);
          if (genre) {
            console.log(
              `[Bulk Upload] Genre "${genre}" aus Künstler "${artist}" geschätzt`,
            );
          }
        }

        const durationSeconds = metadata.format.duration
          ? Math.round(metadata.format.duration)
          : null;

        // BPM kann an verschiedenen Stellen sein (TBPM Tag oder als common.bpm)
        let bpm: number | null = null;
        let bpmSource = "none";

        if (metadata.common.bpm) {
          bpm = Math.round(metadata.common.bpm);
          bpmSource = "id3-common";
        } else {
          // Versuche native ID3 Tags
          const tbpmTag =
            metadata.native?.["ID3v2.3"]?.find(
              (t: { id: string; value: unknown }) => t.id === "TBPM",
            ) ||
            metadata.native?.["ID3v2.4"]?.find(
              (t: { id: string; value: unknown }) => t.id === "TBPM",
            );
          if (tbpmTag?.value) {
            const parsedBpm = parseInt(String(tbpmTag.value), 10);
            if (!isNaN(parsedBpm) && parsedBpm > 0) {
              bpm = parsedBpm;
              bpmSource = "id3-native";
            }
          }
        }

        // Wenn kein BPM in Tags, führe echte Audio-Analyse durch
        if (!bpm) {
          try {
            console.log(
              `[Bulk Upload] Starte Audio-Analyse für ${file.name}...`,
            );
            const analyzedBpm = await quickBPMAnalysis(buffer);
            if (analyzedBpm && analyzedBpm > 50 && analyzedBpm < 250) {
              bpm = analyzedBpm;
              bpmSource = "audio-analysis";
              console.log(`[Bulk Upload] Audio-Analyse: ${bpm} BPM erkannt`);
            }
          } catch (analyzeError) {
            console.error(
              `[Bulk Upload] Audio-Analyse fehlgeschlagen:`,
              analyzeError,
            );
          }
        }

        // Fallback: Schätze aus Genre (nur wenn Analyse auch fehlschlägt)
        if (!bpm && genre) {
          bpm = estimateBPMFromGenre(genre);
          if (bpm) bpmSource = "genre-estimate";
        }

        // Tonart ist oft nicht in den Metadaten, aber manchmal als "key" oder TKEY
        let key: string | null = metadata.common.key || null;
        let keySource = "none";

        if (key) {
          keySource = "id3-common";
        } else {
          const tkeyTag =
            metadata.native?.["ID3v2.3"]?.find(
              (t: { id: string; value: unknown }) => t.id === "TKEY",
            ) ||
            metadata.native?.["ID3v2.4"]?.find(
              (t: { id: string; value: unknown }) => t.id === "TKEY",
            );
          if (tkeyTag?.value) {
            key = String(tkeyTag.value);
            keySource = "id3-native";
          }
        }

        // Wenn kein Key in Tags, führe echte Audio-Analyse durch
        if (!key) {
          try {
            console.log(`[Bulk Upload] Starte Key-Analyse für ${file.name}...`);
            const analyzedKey = await quickKeyAnalysis(buffer);
            if (analyzedKey) {
              key = analyzedKey;
              keySource = "audio-analysis";
              console.log(`[Bulk Upload] Key-Analyse: ${key} erkannt`);
            }
          } catch (keyError) {
            console.error(
              `[Bulk Upload] Key-Analyse fehlgeschlagen:`,
              keyError,
            );
          }
        }

        // Stimmung schätzen basierend auf Genre und BPM
        const mood = estimateMood(genre, bpm);

        // Debug logging
        console.log(`[Bulk Upload] ${file.name}:`, {
          title,
          artist,
          genre,
          bpm,
          bpmSource,
          key,
          keySource,
          mood,
        });

        const song = await prisma.song.create({
          data: {
            title,
            artist: artist || "Unbekannt",
            album,
            year,
            genre,
            duration: durationSeconds,
            bpm,
            key,
            mood,
            mp3Path: `/uploads/music/${fileName}`,
            hasMp3: true,
          },
        });

        results.push({
          filename: file.name,
          success: true,
          song: {
            id: song.id,
            title: song.title,
            artist: song.artist,
          },
        });
      } catch (fileError) {
        console.error(`Error processing ${file.name}:`, fileError);
        results.push({
          filename: file.name,
          success: false,
          error:
            fileError instanceof Error
              ? fileError.message
              : "Unbekannter Fehler",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `${successCount} von ${files.length} Songs erfolgreich importiert`,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      { error: "Fehler beim Bulk-Upload" },
      { status: 500 },
    );
  }
}

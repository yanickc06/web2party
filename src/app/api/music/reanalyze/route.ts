import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as mm from "music-metadata";
import { readFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Keine Song-IDs angegeben" },
        { status: 400 },
      );
    }

    const results: Array<{
      id: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const id of ids) {
      try {
        // Song mit MP3-Pfad laden
        const song = await prisma.song.findUnique({
          where: { id },
          select: { id: true, mp3Path: true },
        });

        if (!song) {
          results.push({ id, success: false, error: "Song nicht gefunden" });
          continue;
        }

        if (!song.mp3Path) {
          results.push({
            id,
            success: false,
            error: "Keine MP3-Datei vorhanden",
          });
          continue;
        }

        // MP3-Datei lesen
        const filePath = join(process.cwd(), "public", song.mp3Path);
        const buffer = await readFile(filePath);

        // Metadaten neu auslesen
        const metadata = await mm.parseBuffer(buffer);

        // Daten extrahieren
        const title = metadata.common.title || undefined;
        const artist = metadata.common.artist || undefined;
        const album = metadata.common.album || undefined;
        const year = metadata.common.year || undefined;

        // Genre aus verschiedenen Quellen
        const genre =
          metadata.common.genre?.[0] ||
          (metadata.native?.["ID3v2.3"]?.find(
            (t: { id: string; value: unknown }) => t.id === "TCON",
          )?.value as string) ||
          (metadata.native?.["ID3v2.4"]?.find(
            (t: { id: string; value: unknown }) => t.id === "TCON",
          )?.value as string) ||
          undefined;

        const durationSeconds = metadata.format.duration
          ? Math.round(metadata.format.duration)
          : undefined;

        // BPM aus verschiedenen Quellen
        let bpm: number | undefined;
        if (metadata.common.bpm) {
          bpm = Math.round(metadata.common.bpm);
        } else {
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
            }
          }
        }

        // Tonart
        let key: string | undefined = metadata.common.key || undefined;
        if (!key) {
          const tkeyTag =
            metadata.native?.["ID3v2.3"]?.find(
              (t: { id: string; value: unknown }) => t.id === "TKEY",
            ) ||
            metadata.native?.["ID3v2.4"]?.find(
              (t: { id: string; value: unknown }) => t.id === "TKEY",
            );
          if (tkeyTag?.value) {
            key = String(tkeyTag.value);
          }
        }

        // Song aktualisieren (nur Felder die gefunden wurden)
        const updateData: Record<string, unknown> = {};
        if (title) updateData.title = title;
        if (artist) updateData.artist = artist;
        if (album) updateData.album = album;
        if (year) updateData.year = year;
        if (genre) updateData.genre = genre;
        if (durationSeconds) updateData.duration = durationSeconds;
        if (bpm) updateData.bpm = bpm;
        if (key) updateData.key = key;

        if (Object.keys(updateData).length > 0) {
          await prisma.song.update({
            where: { id },
            data: updateData,
          });
        }

        results.push({ id, success: true });
      } catch (err) {
        console.error(`Error reanalyzing song ${id}:`, err);
        results.push({
          id,
          success: false,
          error: err instanceof Error ? err.message : "Unbekannter Fehler",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `${successCount} Songs analysiert, ${failCount} Fehler`,
      results,
    });
  } catch (error) {
    console.error("Error in reanalyze:", error);
    return NextResponse.json(
      { error: "Fehler bei der Analyse" },
      { status: 500 },
    );
  }
}

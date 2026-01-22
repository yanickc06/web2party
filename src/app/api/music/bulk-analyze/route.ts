import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { readFile } from "fs/promises";
import { join } from "path";
import {
  estimateMood,
  estimateBPMFromGenre,
  guessGenreFromArtist,
} from "@/lib/bpm-detector";
import { quickBPMAnalysis, quickKeyAnalysis } from "@/lib/audio-analyzer";

// POST: Analysiere mehrere Songs
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { songIds } = body;

    if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
      return NextResponse.json(
        { error: "Song-IDs erforderlich" },
        { status: 400 },
      );
    }

    const results: Array<{
      songId: string;
      title: string;
      success: boolean;
      analysis?: {
        bpm: number | null;
        genre: string | null;
        key: string | null;
        mood: string | null;
      };
      error?: string;
    }> = [];

    // Analysiere jeden Song
    for (const songId of songIds) {
      try {
        // Song laden
        const song = await prisma.song.findUnique({
          where: { id: songId },
        });

        if (!song) {
          results.push({
            songId,
            title: "Unbekannt",
            success: false,
            error: "Song nicht gefunden",
          });
          continue;
        }

        let detectedBpm: number | null = null;
        let detectedGenre: string | null = null;
        let detectedKey: string | null = null;

        // Nur analysieren wenn MP3 vorhanden
        if (song.mp3Path) {
          try {
            const fullPath = join(process.cwd(), "public", song.mp3Path);
            const audioBuffer = await readFile(fullPath);

            const mm = await import("music-metadata");
            const metadata = await mm.parseBuffer(audioBuffer, "audio/mpeg");

            // BPM aus Tags
            if (metadata.common.bpm) {
              detectedBpm = Math.round(metadata.common.bpm);
            } else {
              const tbpmTag =
                metadata.native?.["ID3v2.3"]?.find(
                  (t: { id: string; value: unknown }) => t.id === "TBPM",
                ) ||
                metadata.native?.["ID3v2.4"]?.find(
                  (t: { id: string; value: unknown }) => t.id === "TBPM",
                );
              if (tbpmTag?.value) {
                const parsed = parseInt(String(tbpmTag.value), 10);
                if (!isNaN(parsed) && parsed > 0 && parsed < 300) {
                  detectedBpm = parsed;
                }
              }
            }

            // Genre aus Tags
            detectedGenre = metadata.common.genre?.[0] || null;
            if (!detectedGenre) {
              const tconTag =
                metadata.native?.["ID3v2.3"]?.find(
                  (t: { id: string; value: unknown }) => t.id === "TCON",
                ) ||
                metadata.native?.["ID3v2.4"]?.find(
                  (t: { id: string; value: unknown }) => t.id === "TCON",
                );
              if (tconTag?.value) {
                detectedGenre = String(tconTag.value);
              }
            }

            // Key aus Tags
            detectedKey = metadata.common.key || null;
            if (!detectedKey) {
              const tkeyTag =
                metadata.native?.["ID3v2.3"]?.find(
                  (t: { id: string; value: unknown }) => t.id === "TKEY",
                ) ||
                metadata.native?.["ID3v2.4"]?.find(
                  (t: { id: string; value: unknown }) => t.id === "TKEY",
                );
              if (tkeyTag?.value) {
                detectedKey = String(tkeyTag.value);
              }
            }

            // Wenn kein BPM in Tags, führe echte Audio-Analyse durch
            if (!detectedBpm) {
              try {
                console.log(
                  `[Bulk Analyze] Starte Audio-Analyse für ${song.title}...`,
                );
                const analyzedBpm = await quickBPMAnalysis(audioBuffer);
                if (analyzedBpm && analyzedBpm > 50 && analyzedBpm < 250) {
                  detectedBpm = analyzedBpm;
                  console.log(
                    `[Bulk Analyze] Audio-Analyse: ${detectedBpm} BPM erkannt für ${song.title}`,
                  );
                }
              } catch (analyzeError) {
                console.error(
                  `[Bulk Analyze] Audio-Analyse fehlgeschlagen für ${song.title}:`,
                  analyzeError,
                );
              }
            }

            // Wenn kein Key in Tags, führe echte Audio-Key-Analyse durch
            if (!detectedKey) {
              try {
                console.log(
                  `[Bulk Analyze] Starte Key-Analyse für ${song.title}...`,
                );
                const analyzedKey = await quickKeyAnalysis(audioBuffer);
                if (analyzedKey) {
                  detectedKey = analyzedKey;
                  console.log(
                    `[Bulk Analyze] Key-Analyse: ${detectedKey} erkannt für ${song.title}`,
                  );
                }
              } catch (keyError) {
                console.error(
                  `[Bulk Analyze] Key-Analyse fehlgeschlagen für ${song.title}:`,
                  keyError,
                );
              }
            }
          } catch (fileError) {
            console.error(`Error reading MP3 for ${song.title}:`, fileError);
          }
        }

        // Wenn kein Genre in Tags, versuche aus Künstlernamen zu raten
        if (!detectedGenre && song.artist) {
          detectedGenre = guessGenreFromArtist(song.artist);
          if (detectedGenre) {
            console.log(
              `[Bulk Analyze] ${song.title}: Genre "${detectedGenre}" aus Künstler "${song.artist}" geschätzt`,
            );
          }
        }

        // BPM aus Genre schätzen nur als letzter Fallback
        if (!detectedBpm && detectedGenre) {
          detectedBpm = estimateBPMFromGenre(detectedGenre);
          if (detectedBpm) {
            console.log(
              `[Bulk Analyze] ${song.title}: BPM ${detectedBpm} aus Genre "${detectedGenre}" geschätzt (Fallback)`,
            );
          }
        }

        // Stimmung schätzen
        const estimatedMood = estimateMood(detectedGenre, detectedBpm);

        // Song aktualisieren
        await prisma.song.update({
          where: { id: songId },
          data: {
            bpm: detectedBpm,
            genre: detectedGenre,
            key: detectedKey,
            mood: estimatedMood,
          },
        });

        console.log(`[Bulk Analyze] ${song.title}:`, {
          bpm: detectedBpm,
          genre: detectedGenre,
          key: detectedKey,
          mood: estimatedMood,
        });

        results.push({
          songId,
          title: song.title,
          success: true,
          analysis: {
            bpm: detectedBpm,
            genre: detectedGenre,
            key: detectedKey,
            mood: estimatedMood,
          },
        });
      } catch (error) {
        console.error(`Error analyzing song ${songId}:`, error);
        results.push({
          songId,
          title: "Unbekannt",
          success: false,
          error: error instanceof Error ? error.message : "Unbekannter Fehler",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `${successCount} von ${songIds.length} Songs analysiert`,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error("Bulk analyze error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Bulk-Analyse" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { readFile } from "fs/promises";
import { join } from "path";
import { estimateMood, estimateBPMFromGenre } from "@/lib/bpm-detector";

// POST: Analysiere einen Song
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { songId } = body;

    if (!songId) {
      return NextResponse.json(
        { error: "Song-ID erforderlich" },
        { status: 400 },
      );
    }

    // Song laden
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return NextResponse.json(
        { error: "Song nicht gefunden" },
        { status: 404 },
      );
    }

    if (!song.mp3Path) {
      return NextResponse.json(
        { error: "Keine MP3-Datei vorhanden" },
        { status: 400 },
      );
    }

    // MP3-Datei lesen
    const fullPath = join(process.cwd(), "public", song.mp3Path);
    let audioBuffer: Buffer;

    try {
      audioBuffer = await readFile(fullPath);
    } catch {
      return NextResponse.json(
        { error: "MP3-Datei nicht gefunden" },
        { status: 404 },
      );
    }

    // Versuche ID3-Tags erneut zu lesen mit music-metadata
    const mm = await import("music-metadata");
    const metadata = await mm.parseBuffer(audioBuffer, "audio/mpeg");

    // BPM aus verschiedenen Quellen
    let detectedBpm: number | null = null;

    // 1. Prüfe common.bpm
    if (metadata.common.bpm) {
      detectedBpm = Math.round(metadata.common.bpm);
    }

    // 2. Prüfe native TBPM Tag
    if (!detectedBpm) {
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
    let detectedGenre: string | null = song.genre;
    if (!detectedGenre) {
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
    }

    // Key/Tonart
    let detectedKey: string | null = song.key;
    if (!detectedKey) {
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
    }

    // 3. Falls kein BPM gefunden, schätze aus Genre
    if (!detectedBpm && detectedGenre) {
      detectedBpm = estimateBPMFromGenre(detectedGenre);
    }

    // Stimmung schätzen
    const estimatedMood = estimateMood(detectedGenre, detectedBpm);

    // Song aktualisieren
    const updatedSong = await prisma.song.update({
      where: { id: songId },
      data: {
        bpm: detectedBpm || song.bpm,
        genre: detectedGenre || song.genre,
        key: detectedKey || song.key,
        mood: estimatedMood || song.mood,
      },
    });

    console.log(`[Analyze] ${song.title}:`, {
      bpm: detectedBpm,
      genre: detectedGenre,
      key: detectedKey,
      mood: estimatedMood,
    });

    return NextResponse.json({
      success: true,
      song: updatedSong,
      analysis: {
        bpm: detectedBpm,
        genre: detectedGenre,
        key: detectedKey,
        mood: estimatedMood,
      },
    });
  } catch (error) {
    console.error("Error analyzing song:", error);
    return NextResponse.json(
      { error: "Fehler bei der Analyse" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  getCompatibleCamelotCodes,
  keyToCamelot,
  getKeyCompatibilityScore,
} from "@/lib/harmonic-mixing";

interface SongWithKey {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  bpm: number | null;
  genre: string | null;
  mood: string | null;
  duration: number | null;
  mp3Path: string | null;
}

interface ScoredSong extends SongWithKey {
  camelot: string;
  keyScore: number;
  bpmScore: number;
  totalScore: number;
  bpmDiff: number | null;
}

// GET - Finde kompatible Songs für Harmonic Mixing
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const songId = searchParams.get("songId");
  const key = searchParams.get("key");
  const bpmRange = searchParams.get("bpmRange") || "8"; // ± BPM Toleranz
  const limit = parseInt(searchParams.get("limit") || "20");

  // Entweder songId oder key muss angegeben werden
  if (!songId && !key) {
    return NextResponse.json(
      { error: "songId oder key Parameter erforderlich" },
      { status: 400 },
    );
  }

  try {
    let referenceKey: string | null = key;
    let referenceBpm: number | null = null;
    let referenceSongId: string | null = songId;

    // Wenn songId angegeben, hole Key und BPM vom Song
    if (songId) {
      const song = await prisma.song.findUnique({
        where: { id: songId },
        select: { key: true, bpm: true },
      });

      if (!song) {
        return NextResponse.json(
          { error: "Song nicht gefunden" },
          { status: 404 },
        );
      }

      referenceKey = song.key;
      referenceBpm = song.bpm;
    }

    if (!referenceKey) {
      return NextResponse.json(
        { error: "Song hat keine Tonart (Key) definiert" },
        { status: 400 },
      );
    }

    // Konvertiere Key zu Camelot-Code
    const camelotCode = keyToCamelot(referenceKey);
    if (!camelotCode) {
      return NextResponse.json(
        { error: `Tonart "${referenceKey}" konnte nicht erkannt werden` },
        { status: 400 },
      );
    }

    // Finde kompatible Camelot-Codes
    const compatibleCodes = getCompatibleCamelotCodes(camelotCode);

    // Hole alle Songs mit Key
    const allSongsWithKey = await prisma.song.findMany({
      where: {
        key: { not: null },
        ...(referenceSongId && { id: { not: referenceSongId } }), // Exclude reference song
      },
      select: {
        id: true,
        title: true,
        artist: true,
        key: true,
        bpm: true,
        genre: true,
        mood: true,
        duration: true,
        mp3Path: true,
      },
    });

    // Filtere nach kompatiblen Keys und berechne Scores
    const compatibleSongs: ScoredSong[] = allSongsWithKey
      .map((song: SongWithKey): ScoredSong | null => {
        const songCamelot = keyToCamelot(song.key);
        if (!songCamelot || !compatibleCodes.includes(songCamelot)) {
          return null;
        }

        const keyScore = getKeyCompatibilityScore(referenceKey, song.key);

        // BPM Score (0-3 Punkte basierend auf Nähe)
        let bpmScore = 0;
        if (referenceBpm && song.bpm) {
          const bpmDiff = Math.abs(referenceBpm - song.bpm);
          const maxBpmDiff = parseInt(bpmRange);
          if (bpmDiff === 0) bpmScore = 3;
          else if (bpmDiff <= maxBpmDiff / 3) bpmScore = 2;
          else if (bpmDiff <= maxBpmDiff) bpmScore = 1;
        }

        const totalScore = keyScore + bpmScore;

        return {
          ...song,
          camelot: songCamelot,
          keyScore,
          bpmScore,
          totalScore,
          bpmDiff:
            referenceBpm && song.bpm ? Math.abs(referenceBpm - song.bpm) : null,
        };
      })
      .filter((song: ScoredSong | null): song is ScoredSong => song !== null)
      .sort((a: ScoredSong, b: ScoredSong) => {
        // Sortiere nach Gesamt-Score (absteigend), dann nach BPM-Differenz (aufsteigend)
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        if (a.bpmDiff !== null && b.bpmDiff !== null) {
          return a.bpmDiff - b.bpmDiff;
        }
        return 0;
      })
      .slice(0, limit);

    return NextResponse.json({
      referenceKey,
      referenceCamelot: camelotCode,
      referenceBpm,
      compatibleCodes,
      suggestions: compatibleSongs,
      totalCompatible: compatibleSongs.length,
    });
  } catch (error) {
    console.error("Error finding compatible songs:", error);
    return NextResponse.json(
      { error: "Fehler beim Suchen kompatibler Songs" },
      { status: 500 },
    );
  }
}

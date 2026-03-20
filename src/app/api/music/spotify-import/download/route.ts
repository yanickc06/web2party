import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { spawn } from "child_process";
import * as mm from "music-metadata";
import {
  estimateMood,
  estimateBPMFromGenre,
  guessGenreFromArtist,
} from "@/lib/bpm-detector";
import { quickBPMAnalysis, quickKeyAnalysis } from "@/lib/audio-analyzer";
import ytdl from "@distube/ytdl-core";
import yts from "yt-search";

// Vercel Pro: bis 300s, Hobby: bis 60s
export const maxDuration = 120;

function getFfmpegPath(): string {
  try {
    // Versuche ffmpeg-static (für Vercel/Serverless)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const staticPath = require("ffmpeg-static");
    if (staticPath) return staticPath;
  } catch {
    // Fallback auf System-ffmpeg
  }
  return "ffmpeg";
}

async function searchYouTube(query: string): Promise<string | null> {
  try {
    const results = await yts(query);
    if (results.videos.length > 0) {
      return results.videos[0].url;
    }
    return null;
  } catch {
    return null;
  }
}

async function downloadAsMP3(videoUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const ffmpegPath = getFfmpegPath();

    const audioStream = ytdl(videoUrl, {
      filter: "audioonly",
      quality: "highestaudio",
    });

    const ffmpeg = spawn(
      ffmpegPath,
      [
        "-i",
        "pipe:0",
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "192k",
        "-f",
        "mp3",
        "pipe:1",
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );

    audioStream.pipe(ffmpeg.stdin);

    ffmpeg.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    ffmpeg.stderr.on("data", () => {
      /* ffmpeg Logs unterdrücken */
    });

    ffmpeg.on("close", (code: number | null) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`ffmpeg beendet mit Code ${code}`));
      }
    });

    ffmpeg.on("error", reject);

    audioStream.on("error", (err: Error) => {
      ffmpeg.stdin.end();
      reject(err);
    });
  });
}

// POST - Einzelnen Song herunterladen & importieren
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const { title, artist, album, duration } = await request.json();

    if (!title || !artist) {
      return NextResponse.json(
        { error: "Titel und Künstler erforderlich" },
        { status: 400 },
      );
    }

    // Duplikat-Prüfung
    const existing = await prisma.song.findFirst({
      where: {
        title: { equals: title },
        artist: { equals: artist },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        skipped: true,
        error: `Duplikat: existiert bereits (ID: ${existing.id})`,
      });
    }

    // YouTube suchen
    const searchQuery = `${artist} - ${title}`;
    console.log(`[Spotify Download] Suche YouTube: "${searchQuery}"`);
    const videoUrl = await searchYouTube(searchQuery);

    if (!videoUrl) {
      return NextResponse.json({
        success: false,
        error: "Kein YouTube-Video gefunden",
      });
    }

    // Herunterladen & zu MP3 konvertieren
    console.log(`[Spotify Download] Lade herunter: ${videoUrl}`);
    const mp3Buffer = await downloadAsMP3(videoUrl);

    // Datei speichern
    const uploadDir = join(process.cwd(), "public", "uploads", "music");
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = `${artist} - ${title}`
      .replace(/[^a-zA-Z0-9.\-\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 100);
    const fileName = `${timestamp}-${safeName}.mp3`;
    const destPath = join(uploadDir, fileName);

    await writeFile(destPath, mp3Buffer);

    // Metadaten aus der heruntergeladenen Datei lesen
    let metadata;
    try {
      metadata = await mm.parseBuffer(mp3Buffer, "audio/mpeg");
    } catch {
      metadata = null;
    }

    // Genre erkennen
    let genre = metadata?.common.genre?.[0] || null;
    if (!genre && artist) {
      genre = guessGenreFromArtist(artist);
    }

    // BPM erkennen
    let bpm: number | null = metadata?.common.bpm
      ? Math.round(metadata.common.bpm)
      : null;
    if (!bpm) {
      try {
        const analyzed = await quickBPMAnalysis(mp3Buffer);
        if (analyzed && analyzed > 50 && analyzed < 250) bpm = analyzed;
      } catch {
        /* ignore */
      }
    }
    if (!bpm && genre) bpm = estimateBPMFromGenre(genre);

    // Tonart erkennen
    let key: string | null = metadata?.common.key || null;
    if (!key) {
      try {
        const analyzed = await quickKeyAnalysis(mp3Buffer);
        if (analyzed) key = analyzed;
      } catch {
        /* ignore */
      }
    }

    const mood = estimateMood(genre, bpm);
    const durationSeconds =
      duration ||
      (metadata?.format.duration
        ? Math.round(metadata.format.duration)
        : null);

    const song = await prisma.song.create({
      data: {
        title,
        artist,
        album: album || metadata?.common.album || null,
        year: metadata?.common.year || null,
        genre,
        duration: durationSeconds,
        bpm,
        key,
        mood,
        mp3Path: `/uploads/music/${fileName}`,
        hasMp3: true,
      },
    });

    console.log(`[Spotify Download] Importiert: "${title}" (${song.id})`);

    return NextResponse.json({
      success: true,
      songId: song.id,
    });
  } catch (error) {
    console.error("[Spotify Download] Error:", error);
    return NextResponse.json({
      success: false,
      error:
        error instanceof Error ? error.message : "Download fehlgeschlagen",
    });
  }
}

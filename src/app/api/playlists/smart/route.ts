import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface SmartPlaylistCriteria {
  name: string;
  minBpm?: number;
  maxBpm?: number;
  genres?: string[];
  moods?: string[];
  tags?: string[];
  keys?: string[];
  minDuration?: number; // in Sekunden
  maxDuration?: number;
  limit?: number;
  sortBy?: "bpm" | "title" | "artist" | "duration" | "random";
  sortOrder?: "asc" | "desc";
}

// POST - Generiere Smart-Playlist basierend auf Kriterien
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const criteria: SmartPlaylistCriteria = await request.json();

    if (!criteria.name) {
      return NextResponse.json(
        { error: "Playlist-Name erforderlich" },
        { status: 400 },
      );
    }

    // Baue die WHERE-Bedingungen auf
    interface WhereClause {
      bpm?: { gte?: number; lte?: number };
      genre?: { in: string[] };
      mood?: { in: string[] };
      duration?: { gte?: number; lte?: number };
      OR?: Array<{ tags: { contains: string } }>;
      key?: { in: string[] };
    }

    const where: WhereClause = {};

    // BPM-Range Filter
    if (criteria.minBpm || criteria.maxBpm) {
      where.bpm = {};
      if (criteria.minBpm) where.bpm.gte = criteria.minBpm;
      if (criteria.maxBpm) where.bpm.lte = criteria.maxBpm;
    }

    // Genre Filter
    if (criteria.genres && criteria.genres.length > 0) {
      where.genre = { in: criteria.genres };
    }

    // Mood Filter
    if (criteria.moods && criteria.moods.length > 0) {
      where.mood = { in: criteria.moods };
    }

    // Duration Filter
    if (criteria.minDuration || criteria.maxDuration) {
      where.duration = {};
      if (criteria.minDuration) where.duration.gte = criteria.minDuration;
      if (criteria.maxDuration) where.duration.lte = criteria.maxDuration;
    }

    // Tags Filter (OR-Verknüpfung - mindestens ein Tag muss enthalten sein)
    if (criteria.tags && criteria.tags.length > 0) {
      where.OR = criteria.tags.map((tag) => ({
        tags: { contains: tag },
      }));
    }

    // Key Filter
    if (criteria.keys && criteria.keys.length > 0) {
      where.key = { in: criteria.keys };
    }

    // Bestimme die Sortierung
    type SortField = "bpm" | "title" | "artist" | "duration";
    type SortOrder = "asc" | "desc";

    let orderBy: { [key in SortField]?: SortOrder } | undefined = undefined;
    const sortBy = criteria.sortBy || "bpm";
    const sortOrder = criteria.sortOrder || "asc";

    if (sortBy !== "random") {
      orderBy = { [sortBy]: sortOrder };
    }

    // Hole passende Songs
    let songs = await prisma.song.findMany({
      where,
      orderBy,
      take: criteria.limit || 50,
      select: {
        id: true,
        title: true,
        artist: true,
        bpm: true,
        key: true,
        genre: true,
        mood: true,
        duration: true,
        tags: true,
        mp3Path: true,
      },
    });

    // Bei Random-Sortierung: Mische die Ergebnisse
    if (sortBy === "random") {
      songs = songs.sort(() => Math.random() - 0.5);
    }

    // Erstelle die Playlist in der Datenbank
    const playlist = await prisma.playlist.create({
      data: {
        name: criteria.name,
        description: `Smart-Playlist: ${buildDescription(criteria)}`,
        isSmartPlaylist: true,
        smartCriteria: JSON.stringify(criteria),
      },
    });

    // Füge Songs zur Playlist hinzu
    if (songs.length > 0) {
      await prisma.playlistSong.createMany({
        data: songs.map((song: { id: string }, index: number) => ({
          playlistId: playlist.id,
          songId: song.id,
          position: index,
        })),
      });
    }

    return NextResponse.json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
      },
      songCount: songs.length,
      songs: songs,
      criteria: criteria,
    });
  } catch (error) {
    console.error("Error creating smart playlist:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Smart-Playlist" },
      { status: 500 },
    );
  }
}

// Hilfsfunktion: Generiere lesbare Beschreibung
function buildDescription(criteria: SmartPlaylistCriteria): string {
  const parts: string[] = [];

  if (criteria.minBpm || criteria.maxBpm) {
    if (criteria.minBpm && criteria.maxBpm) {
      parts.push(`${criteria.minBpm}-${criteria.maxBpm} BPM`);
    } else if (criteria.minBpm) {
      parts.push(`ab ${criteria.minBpm} BPM`);
    } else {
      parts.push(`bis ${criteria.maxBpm} BPM`);
    }
  }

  if (criteria.genres && criteria.genres.length > 0) {
    parts.push(`Genres: ${criteria.genres.join(", ")}`);
  }

  if (criteria.moods && criteria.moods.length > 0) {
    parts.push(`Stimmung: ${criteria.moods.join(", ")}`);
  }

  if (criteria.tags && criteria.tags.length > 0) {
    parts.push(`Tags: ${criteria.tags.join(", ")}`);
  }

  return parts.length > 0 ? parts.join(" | ") : "Alle Songs";
}

// GET - Vorschau einer Smart-Playlist ohne zu speichern
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // Parse Kriterien aus Query-Parametern
  const minBpm = searchParams.get("minBpm");
  const maxBpm = searchParams.get("maxBpm");
  const genres = searchParams.get("genres")?.split(",").filter(Boolean);
  const moods = searchParams.get("moods")?.split(",").filter(Boolean);
  const tags = searchParams.get("tags")?.split(",").filter(Boolean);
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    interface PreviewWhereClause {
      bpm?: { gte?: number; lte?: number };
      genre?: { in: string[] };
      mood?: { in: string[] };
      OR?: Array<{ tags: { contains: string } }>;
    }

    const where: PreviewWhereClause = {};

    if (minBpm || maxBpm) {
      where.bpm = {};
      if (minBpm) where.bpm.gte = parseInt(minBpm);
      if (maxBpm) where.bpm.lte = parseInt(maxBpm);
    }

    if (genres && genres.length > 0) {
      where.genre = { in: genres };
    }

    if (moods && moods.length > 0) {
      where.mood = { in: moods };
    }

    if (tags && tags.length > 0) {
      where.OR = tags.map((tag) => ({
        tags: { contains: tag },
      }));
    }

    const songs = await prisma.song.findMany({
      where,
      take: limit,
      orderBy: { bpm: "asc" },
      select: {
        id: true,
        title: true,
        artist: true,
        bpm: true,
        key: true,
        genre: true,
        mood: true,
        duration: true,
        tags: true,
      },
    });

    // Zähle Gesamtanzahl passender Songs
    const totalCount = await prisma.song.count({ where });

    return NextResponse.json({
      preview: true,
      totalMatching: totalCount,
      showing: songs.length,
      songs,
    });
  } catch (error) {
    console.error("Error previewing smart playlist:", error);
    return NextResponse.json(
      { error: "Fehler bei der Vorschau" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Alle Songs abrufen
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const genre = searchParams.get("genre");
  const mood = searchParams.get("mood");
  const search = searchParams.get("search");

  try {
    const songs = await prisma.song.findMany({
      where: {
        ...(genre && { genre }),
        ...(mood && { mood }),
        ...(search && {
          OR: [
            { title: { contains: search } },
            { artist: { contains: search } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { playlistSongs: true },
        },
      },
    });

    return NextResponse.json(songs);
  } catch (error) {
    console.error("Error fetching songs:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Songs" },
      { status: 500 },
    );
  }
}

// POST - Neuen Song erstellen
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const song = await prisma.song.create({
      data: {
        title: body.title,
        artist: body.artist,
        album: body.album || null,
        bpm: body.bpm || null,
        key: body.key || null,
        genre: body.genre || null,
        mood: body.mood || null,
        duration: body.duration || null,
        year: body.year || null,
        notes: body.notes || null,
        hasMp3: false,
      },
    });

    return NextResponse.json(song, { status: 201 });
  } catch (error) {
    console.error("Error creating song:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Songs" },
      { status: 500 },
    );
  }
}

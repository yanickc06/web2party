import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

// GET - Einzelnen Song abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const song = await prisma.song.findUnique({
      where: { id },
      include: {
        playlistSongs: {
          include: {
            playlist: true,
          },
        },
      },
    });

    if (!song) {
      return NextResponse.json(
        { error: "Song nicht gefunden" },
        { status: 404 },
      );
    }

    return NextResponse.json(song);
  } catch (error) {
    console.error("Error fetching song:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden des Songs" },
      { status: 500 },
    );
  }
}

// PUT - Song aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    const song = await prisma.song.update({
      where: { id },
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
        tags: body.tags || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(song);
  } catch (error) {
    console.error("Error updating song:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Songs" },
      { status: 500 },
    );
  }
}

// DELETE - Song löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Song mit MP3-Pfad holen
    const song = await prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      return NextResponse.json(
        { error: "Song nicht gefunden" },
        { status: 404 },
      );
    }

    // MP3-Datei löschen falls vorhanden
    if (song.mp3Path) {
      const filePath = path.join(process.cwd(), "public", song.mp3Path);
      try {
        await unlink(filePath);
      } catch {
        // Datei existiert nicht mehr, ignorieren
      }
    }

    // Song aus DB löschen
    await prisma.song.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting song:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Songs" },
      { status: 500 },
    );
  }
}

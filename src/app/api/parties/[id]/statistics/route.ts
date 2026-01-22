import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Gespielte Songs einer Party abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: partyId } = await params;

    const playedSongs = await prisma.playedSong.findMany({
      where: { partyId },
      orderBy: { playedAt: "asc" },
    });

    return NextResponse.json(playedSongs);
  } catch (error) {
    console.error("Error fetching played songs:", error);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

// POST - Gespielten Song hinzufügen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: partyId } = await params;
    const body = await request.json();

    // Prüfen ob Party existiert
    const party = await prisma.party.findUnique({
      where: { id: partyId },
    });

    if (!party) {
      return NextResponse.json(
        { error: "Party nicht gefunden" },
        { status: 404 },
      );
    }

    const playedSong = await prisma.playedSong.create({
      data: {
        partyId,
        title: body.title,
        artist: body.artist || null,
        songId: body.songId || null,
        reaction: body.reaction || null,
        notes: body.notes || null,
        playedAt: body.playedAt ? new Date(body.playedAt) : new Date(),
      },
    });

    return NextResponse.json(playedSong, { status: 201 });
  } catch (error) {
    console.error("Error adding played song:", error);
    return NextResponse.json(
      { error: "Fehler beim Hinzufügen" },
      { status: 500 },
    );
  }
}

// PUT - Gespielten Song aktualisieren (z.B. Reaktion setzen)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await params;
    const body = await request.json();

    if (!body.songId) {
      return NextResponse.json(
        { error: "Song-ID erforderlich" },
        { status: 400 },
      );
    }

    const playedSong = await prisma.playedSong.update({
      where: { id: body.songId },
      data: {
        reaction: body.reaction !== undefined ? body.reaction : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });

    return NextResponse.json(playedSong);
  } catch (error) {
    console.error("Error updating played song:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 },
    );
  }
}

// DELETE - Gespielten Song entfernen
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get("songId");

    if (!songId) {
      return NextResponse.json(
        { error: "Song-ID erforderlich" },
        { status: 400 },
      );
    }

    await prisma.playedSong.delete({
      where: { id: songId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting played song:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}

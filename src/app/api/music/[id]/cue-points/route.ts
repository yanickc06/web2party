import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Alle Cue-Points für einen Song abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id: songId } = await params;

  try {
    const cuePoints = await prisma.cuePoint.findMany({
      where: { songId },
      orderBy: { time: "asc" },
    });

    return NextResponse.json(cuePoints);
  } catch (error) {
    console.error("Error fetching cue points:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Cue-Points" },
      { status: 500 },
    );
  }
}

// POST - Neuen Cue-Point erstellen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id: songId } = await params;

  try {
    const body = await request.json();

    // Validierung
    if (typeof body.time !== "number" || body.time < 0) {
      return NextResponse.json(
        { error: "Ungültige Zeit angegeben" },
        { status: 400 },
      );
    }

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Name ist erforderlich" },
        { status: 400 },
      );
    }

    // Prüfe ob Song existiert
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return NextResponse.json(
        { error: "Song nicht gefunden" },
        { status: 404 },
      );
    }

    const cuePoint = await prisma.cuePoint.create({
      data: {
        songId,
        name: body.name,
        time: body.time,
        color: body.color || null,
      },
    });

    return NextResponse.json(cuePoint, { status: 201 });
  } catch (error) {
    console.error("Error creating cue point:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Cue-Points" },
      { status: 500 },
    );
  }
}

// DELETE - Cue-Point löschen
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cuePointId = searchParams.get("cuePointId");

  if (!cuePointId) {
    return NextResponse.json(
      { error: "cuePointId Parameter erforderlich" },
      { status: 400 },
    );
  }

  try {
    await prisma.cuePoint.delete({
      where: { id: cuePointId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cue point:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Cue-Points" },
      { status: 500 },
    );
  }
}

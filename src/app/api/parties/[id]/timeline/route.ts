import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Timeline-Einträge für eine Party abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id: partyId } = await params;

  try {
    const entries = await prisma.partyTimelineEntry.findMany({
      where: { partyId },
      orderBy: [{ order: "asc" }, { time: "asc" }],
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Timeline" },
      { status: 500 },
    );
  }
}

// POST - Neuen Timeline-Eintrag erstellen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id: partyId } = await params;

  try {
    const body = await request.json();

    // Hole höchste Order für diese Party
    const maxOrder = await prisma.partyTimelineEntry.findFirst({
      where: { partyId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const entry = await prisma.partyTimelineEntry.create({
      data: {
        partyId,
        time: body.time,
        description: body.description,
        songId: body.songId || null,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating timeline entry:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Eintrags" },
      { status: 500 },
    );
  }
}

// PUT - Timeline-Eintrag aktualisieren
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { entryId, ...data } = body;

    if (!entryId) {
      return NextResponse.json(
        { error: "entryId erforderlich" },
        { status: 400 },
      );
    }

    const entry = await prisma.partyTimelineEntry.update({
      where: { id: entryId },
      data: {
        time: data.time,
        description: data.description,
        songId: data.songId,
        completed: data.completed,
        order: data.order,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error updating timeline entry:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 },
    );
  }
}

// DELETE - Timeline-Eintrag löschen
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entryId = searchParams.get("entryId");

  if (!entryId) {
    return NextResponse.json(
      { error: "entryId Parameter erforderlich" },
      { status: 400 },
    );
  }

  try {
    await prisma.partyTimelineEntry.delete({
      where: { id: entryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting timeline entry:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}

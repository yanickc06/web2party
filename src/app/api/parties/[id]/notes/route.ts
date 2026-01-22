import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Notizen für eine Party abrufen
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
    const notes = await prisma.partyNote.findMany({
      where: { partyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Notizen" },
      { status: 500 },
    );
  }
}

// POST - Neue Notiz erstellen
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

    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { error: "Notiz-Inhalt erforderlich" },
        { status: 400 },
      );
    }

    const note = await prisma.partyNote.create({
      data: {
        partyId,
        content: body.content,
        category: body.category || "GENERAL",
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Notiz" },
      { status: 500 },
    );
  }
}

// PUT - Notiz aktualisieren
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { noteId, ...data } = body;

    if (!noteId) {
      return NextResponse.json(
        { error: "noteId erforderlich" },
        { status: 400 },
      );
    }

    const note = await prisma.partyNote.update({
      where: { id: noteId },
      data: {
        content: data.content,
        category: data.category,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 },
    );
  }
}

// DELETE - Notiz löschen
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get("noteId");

  if (!noteId) {
    return NextResponse.json(
      { error: "noteId Parameter erforderlich" },
      { status: 400 },
    );
  }

  try {
    await prisma.partyNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}

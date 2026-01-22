import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Vordefinierte Checklisten-Vorlagen
const CHECKLIST_TEMPLATES = {
  standard: [
    { title: "Vertrag unterschrieben", category: "Vorbereitung" },
    { title: "Anzahlung erhalten", category: "Vorbereitung" },
    { title: "Location besichtigt", category: "Vorbereitung" },
    { title: "Playlist erstellt", category: "Musik" },
    { title: "Musikwünsche eingeholt", category: "Musik" },
    { title: "Verbotene Songs notiert", category: "Musik" },
    { title: "Equipment geprüft", category: "Equipment" },
    { title: "Kabel & Adapter komplett", category: "Equipment" },
    { title: "Backup-USB dabei", category: "Equipment" },
    { title: "Anfahrt geplant", category: "Logistik" },
    { title: "Aufbauzeit vereinbart", category: "Logistik" },
    { title: "Rechnung erstellt", category: "Nachbereitung" },
    { title: "Feedback eingeholt", category: "Nachbereitung" },
  ],
};

// GET - Checkliste für eine Party abrufen
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
    const items = await prisma.partyChecklistItem.findMany({
      where: { partyId },
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching checklist:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Checkliste" },
      { status: 500 },
    );
  }
}

// POST - Neues Checklisten-Item oder Vorlage anwenden
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

    // Vorlage anwenden
    if (body.applyTemplate) {
      const template =
        CHECKLIST_TEMPLATES[
          body.applyTemplate as keyof typeof CHECKLIST_TEMPLATES
        ];
      if (!template) {
        return NextResponse.json(
          { error: "Vorlage nicht gefunden" },
          { status: 400 },
        );
      }

      // Bestehende Items löschen wenn gewünscht
      if (body.clearExisting) {
        await prisma.partyChecklistItem.deleteMany({
          where: { partyId },
        });
      }

      // Template-Items erstellen
      const items = await prisma.partyChecklistItem.createMany({
        data: template.map((item, index) => ({
          partyId,
          title: item.title,
          category: item.category,
          order: index,
        })),
      });

      return NextResponse.json({ created: items.count });
    }

    // Einzelnes Item erstellen
    const maxOrder = await prisma.partyChecklistItem.findFirst({
      where: { partyId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const item = await prisma.partyChecklistItem.create({
      data: {
        partyId,
        title: body.title,
        category: body.category || null,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating checklist item:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen" },
      { status: 500 },
    );
  }
}

// PUT - Checklisten-Item aktualisieren (toggle checked)
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { itemId, ...data } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId erforderlich" },
        { status: 400 },
      );
    }

    const item = await prisma.partyChecklistItem.update({
      where: { id: itemId },
      data: {
        title: data.title,
        category: data.category,
        checked: data.checked,
        order: data.order,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating checklist item:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 },
    );
  }
}

// DELETE - Checklisten-Item löschen
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json(
      { error: "itemId Parameter erforderlich" },
      { status: 400 },
    );
  }

  try {
    await prisma.partyChecklistItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}

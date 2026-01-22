import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { rentalPartner: true },
    });
    if (!equipment) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

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
    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        name: body.name,
        category: body.category,
        brand: body.brand || null,
        model: body.model || null,
        serialNumber: body.serialNumber || null,
        location: body.location || null,
        isOwned: body.isOwned ?? true,
        rentalPrice: body.rentalPrice || null,
        purchasePrice: body.purchasePrice || null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        specs: body.specs || null,
        notes: body.notes || null,
        rentalPartnerId: body.rentalPartnerId || null,
      },
    });
    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 },
    );
  }
}

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
    await prisma.equipment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}

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
    const party = await prisma.party.findUnique({
      where: { id },
      include: {
        customer: true,
        location: true,
        playlist: { include: { songs: { include: { song: true } } } },
        equipment: { include: { equipment: true } },
      },
    });
    if (!party) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json(party);
  } catch (error) {
    console.error("Error fetching party:", error);
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
    const party = await prisma.party.update({
      where: { id },
      data: {
        name: body.name,
        date: new Date(body.date),
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        status: body.status,
        guestCount: body.guestCount || null,
        price: body.price || null,
        deposit: body.deposit || null,
        depositPaid: body.depositPaid || false,
        notes: body.notes || null,
        customerId: body.customerId || null,
        locationId: body.locationId || null,
        playlistId: body.playlistId || null,
      },
    });
    return NextResponse.json(party);
  } catch (error) {
    console.error("Error updating party:", error);
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
    // Delete related equipment first
    await prisma.partyEquipment.deleteMany({ where: { partyId: id } });
    await prisma.party.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting party:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}

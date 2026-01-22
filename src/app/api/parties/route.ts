import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const parties = await prisma.party.findMany({
      orderBy: { date: "desc" },
      include: {
        customer: true,
        location: true,
        playlist: true,
      },
    });
    return NextResponse.json(parties);
  } catch (error) {
    console.error("Error fetching parties:", error);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const party = await prisma.party.create({
      data: {
        name: body.name,
        date: new Date(body.date),
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        status: body.status || "INQUIRY",
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
    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error("Error creating party:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen" },
      { status: 500 },
    );
  }
}

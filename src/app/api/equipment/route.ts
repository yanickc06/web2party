import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const equipment = await prisma.equipment.findMany({
      orderBy: { createdAt: "desc" },
      include: { rentalPartner: true },
    });
    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error fetching equipment:", error);
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
    const equipment = await prisma.equipment.create({
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
    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error("Error creating equipment:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen" },
      { status: 500 },
    );
  }
}

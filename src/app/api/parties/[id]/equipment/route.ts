import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
}

// GET - Liste der Equipment für eine Party
export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;

  try {
    const partyEquipment = await prisma.partyEquipment.findMany({
      where: { partyId: id },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            category: true,
            serialNumber: true,
          },
        },
      },
      orderBy: [
        { packed: "asc" },
        { equipment: { category: "asc" } },
        { equipment: { name: "asc" } },
      ],
    });

    return NextResponse.json(partyEquipment);
  } catch (error) {
    console.error("Error fetching party equipment:", error);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

// POST - Equipment zur Party hinzufügen
export async function POST(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const data = await request.json();

  try {
    const partyEquipment = await prisma.partyEquipment.create({
      data: {
        partyId: id,
        equipmentId: data.equipmentId,
        quantity: data.quantity || 1,
        notes: data.notes || null,
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            category: true,
            serialNumber: true,
          },
        },
      },
    });

    return NextResponse.json(partyEquipment, { status: 201 });
  } catch (error) {
    console.error("Error adding equipment to party:", error);
    return NextResponse.json(
      { error: "Equipment bereits hinzugefügt oder Fehler" },
      { status: 400 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string; equipmentId: string }>;
}

// PATCH - Equipment aktualisieren (packed status, quantity, notes)
export async function PATCH(request: NextRequest, { params }: Props) {
  const { id, equipmentId } = await params;
  const data = await request.json();

  try {
    const partyEquipment = await prisma.partyEquipment.update({
      where: {
        partyId_equipmentId: {
          partyId: id,
          equipmentId: equipmentId,
        },
      },
      data: {
        packed: data.packed,
        quantity: data.quantity,
        notes: data.notes,
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

    return NextResponse.json(partyEquipment);
  } catch (error) {
    console.error("Error updating party equipment:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 },
    );
  }
}

// DELETE - Equipment von Party entfernen
export async function DELETE(request: NextRequest, { params }: Props) {
  const { id, equipmentId } = await params;

  try {
    await prisma.partyEquipment.delete({
      where: {
        partyId_equipmentId: {
          partyId: id,
          equipmentId: equipmentId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing equipment from party:", error);
    return NextResponse.json(
      { error: "Fehler beim Entfernen" },
      { status: 500 },
    );
  }
}

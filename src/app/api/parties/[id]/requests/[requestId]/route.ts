import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string; requestId: string }>;
}

// PATCH - Musikwunsch-Status aktualisieren
export async function PATCH(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { requestId } = await params;
  const body = await request.json();

  try {
    const musicRequest = await prisma.musicRequest.update({
      where: { id: requestId },
      data: { status: body.status },
    });

    return NextResponse.json(musicRequest);
  } catch (error) {
    console.error("Error updating music request:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 },
    );
  }
}

// DELETE - Musikwunsch löschen
export async function DELETE(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { requestId } = await params;

  try {
    await prisma.musicRequest.delete({ where: { id: requestId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting music request:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}

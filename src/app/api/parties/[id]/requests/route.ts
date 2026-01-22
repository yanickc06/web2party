import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
}

// GET - Musikwünsche für eine Party
export async function GET(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const requests = await prisma.musicRequest.findMany({
      where: { partyId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching music requests:", error);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

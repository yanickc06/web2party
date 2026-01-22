import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface Props {
  params: Promise<{ code: string }>;
}

// GET - Party-Info für Musikwunsch-Seite
export async function GET(request: NextRequest, { params }: Props) {
  const { code } = await params;

  try {
    const party = await prisma.party.findUnique({
      where: { requestCode: code },
      select: {
        id: true,
        name: true,
        date: true,
        musicRequests: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!party) {
      return NextResponse.json(
        { error: "Party nicht gefunden" },
        { status: 404 },
      );
    }

    return NextResponse.json(party);
  } catch (error) {
    console.error("Error fetching party for request:", error);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

// POST - Neuen Musikwunsch einreichen
export async function POST(request: NextRequest, { params }: Props) {
  const { code } = await params;
  const body = await request.json();

  if (!body.songTitle) {
    return NextResponse.json(
      { error: "Bitte Songtitel angeben" },
      { status: 400 },
    );
  }

  try {
    const party = await prisma.party.findUnique({
      where: { requestCode: code },
    });

    if (!party) {
      return NextResponse.json(
        { error: "Party nicht gefunden" },
        { status: 404 },
      );
    }

    const musicRequest = await prisma.musicRequest.create({
      data: {
        songTitle: body.songTitle,
        artist: body.artist || null,
        guestName: body.guestName || null,
        partyId: party.id,
      },
    });

    return NextResponse.json(musicRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating music request:", error);
    return NextResponse.json(
      { error: "Fehler beim Speichern" },
      { status: 500 },
    );
  }
}

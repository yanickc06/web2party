import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const playlists = await prisma.playlist.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        songs: { include: { song: true } },
        _count: { select: { songs: true, parties: true } },
      },
    });
    return NextResponse.json(playlists);
  } catch (error) {
    console.error("Error fetching playlists:", error);
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
    const playlist = await prisma.playlist.create({
      data: {
        name: body.name,
        description: body.description || null,
        songs: {
          create: (body.songs || []).map((songId: string, index: number) => ({
            songId,
            order: index,
          })),
        },
      },
      include: { songs: { include: { song: true } } },
    });
    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error("Error creating playlist:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen" },
      { status: 500 },
    );
  }
}

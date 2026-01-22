import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface PlaylistSongWithSong {
  song: {
    title: string;
    artist: string;
    filePath: string | null;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download");

  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        songs: {
          include: { song: true },
          orderBy: { order: "asc" },
        },
        parties: true,
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }

    // If download is requested, create a ZIP of all MP3 files
    if (download === "mp3") {
      const songsWithFiles = playlist.songs.filter(
        (ps: PlaylistSongWithSong) => ps.song.filePath,
      );

      if (songsWithFiles.length === 0) {
        return NextResponse.json(
          { error: "Keine MP3-Dateien in dieser Playlist" },
          { status: 400 },
        );
      }

      // Return list of files for client-side download
      const files = songsWithFiles.map((ps: PlaylistSongWithSong) => ({
        title: ps.song.title,
        artist: ps.song.artist,
        path: ps.song.filePath,
      }));

      return NextResponse.json({ files });
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("Error fetching playlist:", error);
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

    // First delete existing song associations
    await prisma.playlistSong.deleteMany({ where: { playlistId: id } });

    // Update playlist with new songs
    const playlist = await prisma.playlist.update({
      where: { id },
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

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("Error updating playlist:", error);
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
    // Delete song associations first
    await prisma.playlistSong.deleteMany({ where: { playlistId: id } });
    await prisma.playlist.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}

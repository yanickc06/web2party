import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import archiver from "archiver";
import { createReadStream, existsSync } from "fs";
import { join } from "path";

interface PlaylistSongWithSong {
  position: number;
  song: {
    title: string;
    artist: string | null;
    mp3Path: string | null;
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

  try {
    // Playlist mit Songs laden
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        songs: {
          include: { song: true },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist nicht gefunden" },
        { status: 404 },
      );
    }

    // Nur Songs mit MP3-Dateien
    const songsWithMp3 = playlist.songs.filter(
      (ps: PlaylistSongWithSong) => ps.song.mp3Path,
    );

    if (songsWithMp3.length === 0) {
      return NextResponse.json(
        { error: "Keine MP3-Dateien in dieser Playlist" },
        { status: 400 },
      );
    }

    // ZIP erstellen
    const archive = archiver("zip", { zlib: { level: 5 } });

    // Chunks sammeln
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Dateien hinzufügen
    let addedFiles = 0;
    for (const ps of songsWithMp3) {
      const song = ps.song;
      if (!song.mp3Path) continue;

      const filePath = join(process.cwd(), "public", song.mp3Path);

      if (existsSync(filePath)) {
        // Dateiname formatieren: 01 - Artist - Title.mp3
        const trackNumber = String(addedFiles + 1).padStart(2, "0");
        const artist = song.artist || "Unbekannt";
        const title = song.title;
        const safeName = `${trackNumber} - ${artist} - ${title}.mp3`.replace(
          /[<>:"/\\|?*]/g,
          "_",
        ); // Ungültige Zeichen entfernen

        archive.append(createReadStream(filePath), { name: safeName });
        addedFiles++;
      }
    }

    if (addedFiles === 0) {
      return NextResponse.json(
        { error: "Keine MP3-Dateien gefunden" },
        { status: 400 },
      );
    }

    // Finalisieren und auf Completion warten
    await new Promise<void>((resolve, reject) => {
      archive.on("end", resolve);
      archive.on("error", reject);
      archive.finalize();
    });

    // Buffer kombinieren
    const zipBuffer = Buffer.concat(chunks);

    // Safe Filename für Download
    const safePlaylistName = playlist.name.replace(/[<>:"/\\|?*]/g, "_");

    // Response mit ZIP senden
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safePlaylistName}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error creating ZIP:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des ZIP-Archivs" },
      { status: 500 },
    );
  }
}

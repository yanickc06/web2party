import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const songId = formData.get("songId") as string;

    if (!file || !songId) {
      return NextResponse.json(
        { error: "Datei und Song-ID erforderlich" },
        { status: 400 },
      );
    }

    // Prüfen ob Song existiert
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return NextResponse.json(
        { error: "Song nicht gefunden" },
        { status: 404 },
      );
    }

    // Datei speichern
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sicheren Dateinamen erstellen
    const safeFilename = `${songId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "music");
    const filePath = path.join(uploadDir, safeFilename);

    // Ordner erstellen falls nicht vorhanden
    await mkdir(uploadDir, { recursive: true });

    // Datei schreiben
    await writeFile(filePath, buffer);

    // Song in DB aktualisieren
    const updatedSong = await prisma.song.update({
      where: { id: songId },
      data: {
        mp3Path: `/uploads/music/${safeFilename}`,
        hasMp3: true,
      },
    });

    return NextResponse.json({
      success: true,
      path: updatedSong.mp3Path,
    });
  } catch (error) {
    console.error("Error uploading MP3:", error);
    return NextResponse.json(
      { error: "Fehler beim Hochladen der Datei" },
      { status: 500 },
    );
  }
}

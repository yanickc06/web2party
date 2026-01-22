import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { songIds, tag, action } = body;

    if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
      return NextResponse.json(
        { error: "Song-IDs erforderlich" },
        { status: 400 },
      );
    }

    if (!tag) {
      return NextResponse.json({ error: "Tag erforderlich" }, { status: 400 });
    }

    const results: Array<{
      songId: string;
      success: boolean;
      tags?: string;
    }> = [];

    for (const songId of songIds) {
      try {
        const song = await prisma.song.findUnique({
          where: { id: songId },
          select: { id: true, tags: true },
        });

        if (!song) continue;

        let currentTags: string[] = (song.tags || "")
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);

        if (action === "add") {
          // Tag hinzufügen wenn nicht vorhanden
          if (!currentTags.includes(tag)) {
            currentTags.push(tag);
          }
        } else if (action === "remove") {
          // Tag entfernen
          currentTags = currentTags.filter((t: string) => t !== tag);
        }

        const newTags = currentTags.join(",") || null;

        await prisma.song.update({
          where: { id: songId },
          data: { tags: newTags },
        });

        results.push({
          songId,
          success: true,
          tags: newTags || undefined,
        });
      } catch (error) {
        console.error(`Error updating tags for ${songId}:`, error);
        results.push({
          songId,
          success: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.filter((r) => r.success).length,
      results,
    });
  } catch (error) {
    console.error("Error in bulk-tag:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Tags" },
      { status: 500 },
    );
  }
}

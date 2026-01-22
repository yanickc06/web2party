import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory
    const uploadDir = join(process.cwd(), "public", "uploads", "files");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "";
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);
    const filename = `${timestamp}-${safeName}`;
    const filePath = join(uploadDir, filename);

    await writeFile(filePath, buffer);

    // Determine mime type
    const mimeType = file.type || "application/octet-stream";

    // Save to database
    const dbFile = await prisma.file.create({
      data: {
        name: safeName,
        originalName: file.name,
        path: `/uploads/files/${filename}`,
        size: file.size,
        mimeType: mimeType,
        folderId: folderId || null,
      },
    });

    return NextResponse.json(dbFile, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Fehler beim Upload" }, { status: 500 });
  }
}

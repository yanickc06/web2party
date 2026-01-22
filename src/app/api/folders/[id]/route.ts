import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
    const folder = await prisma.folder.update({
      where: { id },
      data: { name: body.name },
    });
    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error updating folder:", error);
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
    // Delete all files in folder first
    await prisma.file.deleteMany({ where: { folderId: id } });
    // Delete all subfolders recursively
    await deleteSubfolders(id);
    // Delete folder
    await prisma.folder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}

async function deleteSubfolders(parentId: string) {
  const subfolders = await prisma.folder.findMany({
    where: { parentId },
  });
  for (const subfolder of subfolders) {
    await prisma.file.deleteMany({ where: { folderId: subfolder.id } });
    await deleteSubfolders(subfolder.id);
    await prisma.folder.delete({ where: { id: subfolder.id } });
  }
}

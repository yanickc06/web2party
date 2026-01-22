import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { rentalPartner: true },
    });
    if (!equipment) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error fetching equipment:", error);
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
    const formData = await request.formData();

    // Textfelder auslesen
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const brand = formData.get("brand") as string | null;
    const model = formData.get("model") as string | null;
    const serialNumber = formData.get("serialNumber") as string | null;
    const location = formData.get("location") as string | null;
    const isOwned = formData.get("isOwned") === "true";
    const rentalPrice = formData.get("rentalPrice") as string | null;
    const purchasePrice = formData.get("purchasePrice") as string | null;
    const purchaseDate = formData.get("purchaseDate") as string | null;
    const specs = formData.get("specs") as string | null;
    const notes = formData.get("notes") as string | null;
    const rentalPartnerId = formData.get("rentalPartnerId") as string | null;

    // Bild-Upload verarbeiten
    let imageUrl: string | undefined;
    const image = formData.get("image") as File | null;

    if (image && image.size > 0) {
      const uploadDir = join(process.cwd(), "public", "uploads", "equipment");
      await mkdir(uploadDir, { recursive: true });

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = image.name.split(".").pop() || "jpg";
      const fileName = `${id}-${Date.now()}.${ext}`;
      const filePath = join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      imageUrl = `/uploads/equipment/${fileName}`;
    }

    const updateData: Record<string, unknown> = {
      name,
      category,
      brand: brand || null,
      model: model || null,
      serialNumber: serialNumber || null,
      location: location || null,
      isOwned,
      rentalPrice: rentalPrice ? parseFloat(rentalPrice) : null,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      specs: specs || null,
      notes: notes || null,
      rentalPartnerId: rentalPartnerId || null,
    };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    const equipment = await prisma.equipment.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error updating equipment:", error);
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
    await prisma.equipment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}

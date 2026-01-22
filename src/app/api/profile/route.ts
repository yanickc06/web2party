import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        djName: true,
        photoUrl: true,
        phone: true,
        website: true,
        musicStyles: true,
        experience: true,
        equipment: true,
        socialMedia: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User nicht gefunden" },
        { status: 404 },
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    // Textfelder
    const name = formData.get("name") as string;
    const djName = formData.get("djName") as string | null;
    const phone = formData.get("phone") as string | null;
    const website = formData.get("website") as string | null;
    const musicStyles = formData.get("musicStyles") as string | null;
    const experience = formData.get("experience") as string | null;
    const equipment = formData.get("equipment") as string | null;
    const socialMedia = formData.get("socialMedia") as string | null;

    // Foto-Upload
    let photoUrl: string | undefined;
    const photo = formData.get("photo") as File | null;

    if (photo && photo.size > 0) {
      const uploadDir = join(process.cwd(), "public", "uploads", "profiles");
      await mkdir(uploadDir, { recursive: true });

      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = photo.name.split(".").pop() || "jpg";
      const fileName = `${session.user.id}-${Date.now()}.${ext}`;
      const filePath = join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      photoUrl = `/uploads/profiles/${fileName}`;
    }

    const updateData: Record<string, unknown> = {
      name,
      djName: djName || null,
      phone: phone || null,
      website: website || null,
      musicStyles: musicStyles || null,
      experience: experience || null,
      equipment: equipment || null,
      socialMedia: socialMedia || null,
    };

    if (photoUrl) {
      updateData.photoUrl = photoUrl;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        djName: true,
        photoUrl: true,
        phone: true,
        website: true,
        musicStyles: true,
        experience: true,
        equipment: true,
        socialMedia: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Fehler beim Speichern" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";

interface Props {
  params: Promise<{ id: string }>;
}

// Generiert einen zufälligen Code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST - QR-Code für Party generieren
export async function POST(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Prüfen ob Party existiert
    const party = await prisma.party.findUnique({
      where: { id },
      select: { id: true, requestCode: true },
    });

    if (!party) {
      return NextResponse.json(
        { error: "Party nicht gefunden" },
        { status: 404 },
      );
    }

    // Falls noch kein Code, einen generieren
    let code = party.requestCode;
    if (!code) {
      code = generateCode();
      await prisma.party.update({
        where: { id },
        data: { requestCode: code },
      });
    }

    // QR-Code generieren
    const url = `${process.env.NEXTAUTH_URL || "http://web2party.vercel.app:3000"}/wunsch/${code}`;
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: "#9333ea",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      code,
      url,
      qrCode: qrCodeDataUrl,
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Fehler beim Generieren" },
      { status: 500 },
    );
  }
}

// DELETE - QR-Code / Request-Code entfernen
export async function DELETE(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.party.update({
      where: { id },
      data: { requestCode: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing QR code:", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

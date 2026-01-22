import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Alle Felder sind erforderlich" },
        { status: 400 },
      );
    }

    // Prüfen ob E-Mail bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits registriert" },
        { status: 400 },
      );
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 12);

    // Ersten User als Admin und aktiv setzen
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // User erstellen
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: isFirstUser ? "ADMIN" : "USER",
        isActive: isFirstUser, // Erster User ist automatisch aktiv
      },
    });

    return NextResponse.json(
      {
        message: isFirstUser
          ? "Admin-Account erfolgreich erstellt! Du kannst dich jetzt anmelden."
          : "Registrierung erfolgreich! Bitte warte auf die Aktivierung durch einen Administrator.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 },
    );
  }
}

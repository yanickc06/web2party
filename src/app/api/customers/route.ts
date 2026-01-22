import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Alle Kunden abrufen
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { parties: true, invoices: true, locations: true },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Kunden" },
      { status: 500 },
    );
  }
}

// POST - Neuen Kunden erstellen
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const customer = await prisma.customer.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        street: body.street || null,
        city: body.city || null,
        postalCode: body.postalCode || null,
        country: body.country || "Deutschland",
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        bankName: body.bankName || null,
        iban: body.iban || null,
        bic: body.bic || null,
        musicTaste: body.musicTaste || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Kunden" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Einzelnen Kunden abrufen
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
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        locations: true,
        parties: {
          include: { location: true },
          orderBy: { date: "desc" },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Kunde nicht gefunden" },
        { status: 404 },
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden des Kunden" },
      { status: 500 },
    );
  }
}

// PUT - Kunden aktualisieren
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

    const customer = await prisma.customer.update({
      where: { id },
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

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Kunden" },
      { status: 500 },
    );
  }
}

// DELETE - Kunden löschen
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
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Kunden" },
      { status: 500 },
    );
  }
}

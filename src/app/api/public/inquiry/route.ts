import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST - Öffentliche Party-Anfrage (kein Auth erforderlich)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validierung
    if (
      !body.firstName ||
      !body.lastName ||
      !body.email ||
      !body.date ||
      !body.eventName
    ) {
      return NextResponse.json(
        { error: "Bitte alle Pflichtfelder ausfüllen" },
        { status: 400 },
      );
    }

    // Prüfen ob Kunde mit dieser E-Mail bereits existiert
    let customer = await prisma.customer.findFirst({
      where: { email: body.email },
    });

    // Falls nicht, neuen Kunden anlegen
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone || null,
          notes: "Via öffentliches Anfrageformular erstellt",
        },
      });
    }

    // Party als Anfrage erstellen
    const party = await prisma.party.create({
      data: {
        name: body.eventName,
        date: new Date(body.date),
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        guestCount: body.guestCount ? parseInt(body.guestCount) : null,
        status: "INQUIRY",
        notes: `Anfrage über öffentliches Formular:
        
Art der Veranstaltung: ${body.eventType || "Nicht angegeben"}
Musikrichtung: ${body.musicStyle || "Nicht angegeben"}
Location: ${body.locationName || "Nicht angegeben"}
Adresse: ${body.locationAddress || "Nicht angegeben"}

Nachricht:
${body.message || "Keine Nachricht"}`,
        customerId: customer.id,
      },
    });

    return NextResponse.json(
      { success: true, partyId: party.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating public inquiry:", error);
    return NextResponse.json(
      { error: "Fehler beim Senden der Anfrage" },
      { status: 500 },
    );
  }
}

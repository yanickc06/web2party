import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const locations = await prisma.location.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: true, _count: { select: { parties: true } } },
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const location = await prisma.location.create({
      data: {
        name: body.name,
        street: body.street || null,
        city: body.city || null,
        postalCode: body.postalCode || null,
        country: body.country || "Deutschland",
        contactPerson: body.contactPerson || null,
        phone: body.phone || null,
        email: body.email || null,
        capacity: body.capacity || null,
        notes: body.notes || null,
        customerId: body.customerId || null,
      },
    });
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen" },
      { status: 500 },
    );
  }
}

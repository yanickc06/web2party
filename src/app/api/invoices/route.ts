import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true },
        },
        party: {
          select: { id: true, name: true, date: true },
        },
      },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

// Generiert eine neue Rechnungsnummer
async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `RE-${year}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
  });

  if (lastInvoice) {
    const lastNum = parseInt(lastInvoice.invoiceNumber.split("-").pop() || "0");
    return `${prefix}${String(lastNum + 1).padStart(4, "0")}`;
  }

  return `${prefix}0001`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Automatische Rechnungsnummer
    const invoiceNumber = await generateInvoiceNumber();

    // Berechne Steuer und Gesamtbetrag
    const amount = parseFloat(body.amount) || 0;
    // taxRate kann 0 sein, daher explizit auf undefined/null prüfen
    const taxRate =
      body.taxRate !== undefined && body.taxRate !== null
        ? parseFloat(body.taxRate)
        : 19;
    const tax = amount * (taxRate / 100);
    const totalAmount = amount + tax;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        amount,
        tax,
        totalAmount,
        status: body.status || "DRAFT",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes || null,
        customerId: body.customerId,
        partyId: body.partyId || null,
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true },
        },
        party: {
          select: { id: true, name: true, date: true },
        },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen" },
      { status: 500 },
    );
  }
}

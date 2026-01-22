"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  paidDate: string | null;
  notes: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    street: string | null;
    zip: string | null;
    city: string | null;
  };
  party: {
    id: string;
    name: string;
    date: string;
    location: { name: string; city: string | null } | null;
  } | null;
}

interface DJProfile {
  name: string;
  djName: string | null;
  phone: string | null;
  website: string | null;
  socialMedia: string | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "📝 Entwurf", color: "bg-gray-600/20 text-gray-400" },
  SENT: { label: "📤 Gesendet", color: "bg-blue-600/20 text-blue-400" },
  PAID: { label: "✅ Bezahlt", color: "bg-green-600/20 text-green-400" },
  OVERDUE: { label: "⚠️ Überfällig", color: "bg-red-600/20 text-red-400" },
  CANCELLED: { label: "❌ Storniert", color: "bg-gray-600/20 text-gray-500" },
};

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [djProfile, setDjProfile] = useState<DJProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ])
      .then(([inv, profile]) => {
        setInvoice(inv);
        setDjProfile(profile);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    const paidDate = newStatus === "PAID" ? new Date().toISOString() : null;
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, paidDate }),
    });
    const res = await fetch(`/api/invoices/${id}`);
    setInvoice(await res.json());
  };

  const handleDelete = async () => {
    if (!confirm("Rechnung wirklich löschen?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/dashboard/invoices");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading)
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  if (!invoice)
    return (
      <div className="text-center py-12 text-gray-400">Nicht gefunden</div>
    );

  const status = statusLabels[invoice.status] || {
    label: invoice.status,
    color: "bg-gray-600/20 text-gray-400",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/invoices"
            className="p-2 hover:bg-gray-800 rounded-lg transition">
            ← Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-gray-400">
              Erstellt am{" "}
              {new Date(invoice.createdAt).toLocaleDateString("de-DE")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
            🖨️ Drucken
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
            Löschen
          </button>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center justify-between print:hidden">
        <span className={`px-4 py-2 rounded-full font-medium ${status.color}`}>
          {status.label}
        </span>
        <div className="flex gap-2">
          {invoice.status === "DRAFT" && (
            <button
              onClick={() => updateStatus("SENT")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              📤 Als gesendet markieren
            </button>
          )}
          {["DRAFT", "SENT", "OVERDUE"].includes(invoice.status) && (
            <button
              onClick={() => updateStatus("PAID")}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
              ✅ Als bezahlt markieren
            </button>
          )}
          {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
            <button
              onClick={() => updateStatus("CANCELLED")}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition">
              ❌ Stornieren
            </button>
          )}
        </div>
      </div>

      {/* Rechnungsinhalt (druckbar) */}
      <div className="bg-white text-black rounded-xl p-8 print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">RECHNUNG</h2>
            <p className="text-gray-600">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">
              {djProfile?.djName || djProfile?.name || "DJ"}
            </p>
            {djProfile?.website && (
              <p className="text-gray-600 text-sm">{djProfile.website}</p>
            )}
            {djProfile?.socialMedia &&
              (() => {
                try {
                  const social = JSON.parse(djProfile.socialMedia);
                  return (
                    <div className="text-gray-600 text-sm">
                      {social.instagram && <span>📸 {social.instagram}</span>}
                      {social.facebook && (
                        <span className="ml-2">👍 {social.facebook}</span>
                      )}
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
            {djProfile?.phone && (
              <p className="text-gray-600 text-sm">📞 {djProfile.phone}</p>
            )}
          </div>
        </div>

        {/* Kunde */}
        <div className="mb-8">
          <p className="text-gray-500 text-sm mb-1">Rechnungsempfänger:</p>
          <p className="font-bold">
            {invoice.customer.firstName} {invoice.customer.lastName}
          </p>
          {invoice.customer.street && <p>{invoice.customer.street}</p>}
          {(invoice.customer.zip || invoice.customer.city) && (
            <p>
              {invoice.customer.zip} {invoice.customer.city}
            </p>
          )}
          {invoice.customer.email && (
            <p className="text-gray-600">{invoice.customer.email}</p>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div>
            <p className="text-gray-500">Rechnungsdatum:</p>
            <p>{new Date(invoice.createdAt).toLocaleDateString("de-DE")}</p>
          </div>
          {invoice.dueDate && (
            <div>
              <p className="text-gray-500">Fällig bis:</p>
              <p>{new Date(invoice.dueDate).toLocaleDateString("de-DE")}</p>
            </div>
          )}
          {invoice.party && (
            <div className="col-span-2">
              <p className="text-gray-500">Veranstaltung:</p>
              <p>
                {invoice.party.name} -{" "}
                {new Date(invoice.party.date).toLocaleDateString("de-DE")}
                {invoice.party.location && ` (${invoice.party.location.name})`}
              </p>
            </div>
          )}
        </div>

        {/* Positionen */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2">Beschreibung</th>
              <th className="text-right py-2">Betrag</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-3">
                {invoice.party
                  ? `DJ-Dienstleistung für ${invoice.party.name}`
                  : "DJ-Dienstleistung"}
              </td>
              <td className="text-right py-3">
                {Number(invoice.amount).toFixed(2)} €
              </td>
            </tr>
          </tbody>
        </table>

        {/* Summen */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span>Netto:</span>
              <span>{Number(invoice.amount).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>MwSt.:</span>
              <span>{Number(invoice.tax).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t-2 border-gray-300 pt-2">
              <span>Gesamt:</span>
              <span>{Number(invoice.totalAmount).toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Notizen */}
        {invoice.notes && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-gray-500 text-sm">Notizen:</p>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Bezahlt Badge */}
        {invoice.status === "PAID" && invoice.paidDate && (
          <div className="mt-8 text-center">
            <span className="inline-block px-6 py-2 bg-green-100 text-green-700 rounded-full font-bold">
              ✅ BEZAHLT am{" "}
              {new Date(invoice.paidDate).toLocaleDateString("de-DE")}
            </span>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white,
          .bg-white * {
            visibility: visible;
          }
          .bg-white {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

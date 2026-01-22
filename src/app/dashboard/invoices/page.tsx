"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  paidDate: string | null;
  createdAt: string;
  customer: { id: string; firstName: string; lastName: string };
  party: { id: string; name: string; date: string } | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Entwurf", color: "bg-gray-600/20 text-gray-400" },
  SENT: { label: "Gesendet", color: "bg-blue-600/20 text-blue-400" },
  PAID: { label: "Bezahlt", color: "bg-green-600/20 text-green-400" },
  OVERDUE: { label: "Überfällig", color: "bg-red-600/20 text-red-400" },
  CANCELLED: { label: "Storniert", color: "bg-gray-600/20 text-gray-500" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => setInvoices(data))
      .finally(() => setLoading(false));
  }, []);

  const filteredInvoices =
    filter === "ALL" ? invoices : invoices.filter((i) => i.status === filter);

  const stats = {
    total: invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0),
    open: invoices
      .filter((i) => ["DRAFT", "SENT", "OVERDUE"].includes(i.status))
      .reduce((sum, i) => sum + Number(i.totalAmount), 0),
    paid: invoices
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + Number(i.totalAmount), 0),
  };

  if (loading)
    return <div className="text-center py-12 text-gray-400">Laden...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">💰 Rechnungen</h1>
          <p className="text-gray-400">{invoices.length} Rechnungen</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
          + Neue Rechnung
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Gesamt</p>
          <p className="text-2xl font-bold text-white">
            {stats.total.toFixed(2)} €
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Offen</p>
          <p className="text-2xl font-bold text-yellow-400">
            {stats.open.toFixed(2)} €
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Bezahlt</p>
          <p className="text-2xl font-bold text-green-400">
            {stats.paid.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              filter === s
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}>
            {s === "ALL" ? "Alle" : statusLabels[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Keine Rechnungen gefunden
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700/30">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Nr.
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Kunde
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Party
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Betrag
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredInvoices.map((invoice) => {
                const status = statusLabels[invoice.status] || {
                  label: invoice.status,
                  color: "bg-gray-600/20 text-gray-400",
                };
                return (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="text-purple-400 hover:underline font-mono">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-white">
                      {invoice.customer.firstName} {invoice.customer.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {invoice.party?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {Number(invoice.totalAmount).toFixed(2)} €
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(invoice.createdAt).toLocaleDateString("de-DE")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

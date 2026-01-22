"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
}

interface Party {
  id: string;
  name: string;
  date: string;
  price: number | null;
  customer: { id: string; firstName: string; lastName: string } | null;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [amount, setAmount] = useState("");
  const [taxRate, setTaxRate] = useState("19");

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/parties").then((r) => r.json()),
    ]).then(([c, p]) => {
      setCustomers(c);
      setParties(p);
    });
  }, []);

  // Wenn Party ausgewählt wird, Kunde und Preis setzen
  const handlePartyChange = (partyId: string) => {
    setSelectedParty(partyId);
    const party = parties.find((p) => p.id === partyId);
    if (party) {
      if (party.customer) {
        setSelectedCustomer(party.customer.id);
      }
      if (party.price) {
        setAmount(String(party.price));
      }
    }
  };

  const netAmount = parseFloat(amount) || 0;
  const tax = netAmount * (parseFloat(taxRate) / 100);
  const total = netAmount + tax;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setError("Bitte Kunde auswählen");
      return;
    }
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      customerId: selectedCustomer,
      partyId: selectedParty || null,
      amount: netAmount,
      taxRate: parseFloat(taxRate),
      dueDate: formData.get("dueDate") || null,
      notes: formData.get("notes") || null,
      status: "DRAFT",
    };

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Fehler beim Speichern");
      }

      const invoice = await response.json();
      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/invoices"
          className="p-2 hover:bg-gray-800 rounded-lg transition">
          ← Zurück
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Neue Rechnung</h1>
          <p className="text-gray-400">Rechnung erstellen</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">
            📋 Rechnungsdaten
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Party (optional)
            </label>
            <select
              value={selectedParty}
              onChange={(e) => handlePartyChange(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">Keine Party verknüpfen</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {new Date(p.date).toLocaleDateString("de-DE")}
                  {p.price && ` (${Number(p.price).toFixed(2)} €)`}
                </option>
              ))}
            </select>
            <p className="text-gray-500 text-sm mt-1">
              Bei Auswahl werden Kunde und Preis automatisch übernommen
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Kunde *
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">Bitte wählen...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nettobetrag (€) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                required
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                MwSt. (%)
              </label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="0">0%</option>
                <option value="7">7%</option>
                <option value="19">19%</option>
              </select>
            </div>
          </div>

          {/* Berechnungsvorschau */}
          <div className="bg-gray-700/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Netto:</span>
              <span>{netAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>MwSt. ({taxRate}%):</span>
              <span>{tax.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-white font-bold text-lg border-t border-gray-600 pt-2">
              <span>Gesamt:</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fälligkeitsdatum
            </label>
            <input
              type="date"
              name="dueDate"
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notizen
            </label>
            <textarea
              name="notes"
              rows={3}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50">
            {loading ? "Wird erstellt..." : "Rechnung erstellen"}
          </button>
          <Link
            href="/dashboard/invoices"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}

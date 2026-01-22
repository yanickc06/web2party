"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
}

export default function NewLocationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      street: formData.get("street") || null,
      city: formData.get("city") || null,
      postalCode: formData.get("postalCode") || null,
      country: formData.get("country") || "Deutschland",
      contactPerson: formData.get("contactPerson") || null,
      phone: formData.get("phone") || null,
      email: formData.get("email") || null,
      capacity: formData.get("capacity")
        ? parseInt(formData.get("capacity") as string)
        : null,
      notes: formData.get("notes") || null,
      customerId: formData.get("customerId") || null,
    };

    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Fehler beim Speichern");
      }

      router.push("/dashboard/locations");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/locations"
          className="p-2 hover:bg-gray-800 rounded-lg transition">
          ← Zurück
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Neue Location</h1>
          <p className="text-gray-400">
            Füge eine neue Veranstaltungslocation hinzu
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            📍 Location-Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="z.B. Festsaal Goldener Hirsch"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Straße
              </label>
              <input
                type="text"
                name="street"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PLZ
              </label>
              <input
                type="text"
                name="postalCode"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stadt
              </label>
              <input
                type="text"
                name="city"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Land
              </label>
              <input
                type="text"
                name="country"
                defaultValue="Deutschland"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kapazität (Personen)
              </label>
              <input
                type="number"
                name="capacity"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📞 Kontakt</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ansprechpartner
              </label>
              <input
                type="text"
                name="contactPerson"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                name="phone"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                E-Mail
              </label>
              <input
                type="email"
                name="email"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🔗 Verknüpfung
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Zugehöriger Kunde (optional)
            </label>
            <select
              name="customerId"
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">Keine Verknüpfung</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notizen
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Parkmöglichkeiten, Aufbauhinweise, etc."
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50">
            {loading ? "Speichern..." : "Location speichern"}
          </button>
          <Link
            href="/dashboard/locations"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}

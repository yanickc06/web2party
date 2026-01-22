"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
}

interface Location {
  id: string;
  name: string;
}

interface Playlist {
  id: string;
  name: string;
}

export default function NewPartyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/locations").then((r) => r.json()),
      fetch("/api/playlists").then((r) => r.json()),
    ])
      .then(([c, l, p]) => {
        setCustomers(c);
        setLocations(l);
        setPlaylists(p);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      date: formData.get("date"),
      startTime: formData.get("startTime") || null,
      endTime: formData.get("endTime") || null,
      status: formData.get("status"),
      guestCount: formData.get("guestCount")
        ? parseInt(formData.get("guestCount") as string)
        : null,
      price: formData.get("price")
        ? parseFloat(formData.get("price") as string)
        : null,
      deposit: formData.get("deposit")
        ? parseFloat(formData.get("deposit") as string)
        : null,
      depositPaid: formData.get("depositPaid") === "on",
      notes: formData.get("notes") || null,
      customerId: formData.get("customerId") || null,
      locationId: formData.get("locationId") || null,
      playlistId: formData.get("playlistId") || null,
    };

    try {
      const response = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Fehler beim Speichern");
      }

      router.push("/dashboard/parties");
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
          href="/dashboard/parties"
          className="p-2 hover:bg-gray-800 rounded-lg transition">
          ← Zurück
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Neue Party</h1>
          <p className="text-gray-400">Plane ein neues Event</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Basis-Info */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🎉 Event-Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Party-Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="z.B. Hochzeit Familie Müller"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Datum *
              </label>
              <input
                type="date"
                name="date"
                required
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                name="status"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="INQUIRY">📩 Anfrage</option>
                <option value="CONFIRMED">✅ Bestätigt</option>
                <option value="COMPLETED">🎊 Abgeschlossen</option>
                <option value="CANCELLED">❌ Abgesagt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Beginn
              </label>
              <input
                type="time"
                name="startTime"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ende
              </label>
              <input
                type="time"
                name="endTime"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gästeanzahl
              </label>
              <input
                type="number"
                name="guestCount"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Verknüpfungen */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🔗 Verknüpfungen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kunde
              </label>
              <select
                name="customerId"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Auswählen...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <select
                name="locationId"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Auswählen...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Playlist
              </label>
              <select
                name="playlistId"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Auswählen...</option>
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Finanzen */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">💰 Finanzen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preis (€)
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Anzahlung (€)
              </label>
              <input
                type="number"
                name="deposit"
                step="0.01"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  name="depositPaid"
                  className="rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                Anzahlung bezahlt
              </label>
            </div>
          </div>
        </div>

        {/* Notizen */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📝 Notizen</h2>
          <textarea
            name="notes"
            rows={4}
            placeholder="Besondere Wünsche, Musikwünsche, etc."
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50">
            {loading ? "Speichern..." : "Party speichern"}
          </button>
          <Link
            href="/dashboard/parties"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}

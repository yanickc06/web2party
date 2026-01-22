"use client";

import { useState, useEffect, use } from "react";
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

interface Party {
  id: string;
  name: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  status: string;
  guestCount: number | null;
  price: number | null;
  deposit: number | null;
  depositPaid: boolean;
  notes: string | null;
  customerId: string | null;
  locationId: string | null;
  playlistId: string | null;
}

export default function EditPartyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [party, setParty] = useState<Party | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/parties/${id}`).then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/locations").then((r) => r.json()),
      fetch("/api/playlists").then((r) => r.json()),
    ])
      .then(([p, c, l, pl]) => {
        setParty(p);
        setCustomers(c);
        setLocations(l);
        setPlaylists(pl);
      })
      .finally(() => setLoadingData(false));
  }, [id]);

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
      const response = await fetch(`/api/parties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Fehler beim Speichern");
      }

      router.push(`/dashboard/parties/${id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData)
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  if (!party)
    return (
      <div className="text-center py-12 text-gray-400">Nicht gefunden</div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/parties/${id}`}
          className="p-2 hover:bg-gray-800 rounded-lg transition">
          ← Zurück
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Party bearbeiten</h1>
          <p className="text-gray-400">{party.name}</p>
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
                defaultValue={party.name}
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
                defaultValue={party.date.split("T")[0]}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                name="status"
                defaultValue={party.status}
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
                defaultValue={party.startTime || ""}
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
                defaultValue={party.endTime || ""}
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
                defaultValue={party.guestCount || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

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
                defaultValue={party.customerId || ""}
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
                defaultValue={party.locationId || ""}
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
                defaultValue={party.playlistId || ""}
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
                defaultValue={party.price || ""}
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
                defaultValue={party.deposit || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  name="depositPaid"
                  defaultChecked={party.depositPaid}
                  className="rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                Anzahlung bezahlt
              </label>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📝 Notizen</h2>
          <textarea
            name="notes"
            rows={4}
            defaultValue={party.notes || ""}
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50">
            {loading ? "Speichern..." : "Änderungen speichern"}
          </button>
          <Link
            href={`/dashboard/parties/${id}`}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}

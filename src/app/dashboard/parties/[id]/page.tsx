"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  customer: { id: string; firstName: string; lastName: string } | null;
  location: { id: string; name: string; city: string | null } | null;
  playlist: {
    id: string;
    name: string;
    songs: { song: { title: string; artist: string | null } }[];
  } | null;
  equipment: { equipment: { id: string; name: string; category: string } }[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  INQUIRY: { label: "📩 Anfrage", color: "bg-yellow-600/20 text-yellow-400" },
  CONFIRMED: { label: "✅ Bestätigt", color: "bg-green-600/20 text-green-400" },
  COMPLETED: {
    label: "🎊 Abgeschlossen",
    color: "bg-blue-600/20 text-blue-400",
  },
  CANCELLED: { label: "❌ Abgesagt", color: "bg-red-600/20 text-red-400" },
};

export default function PartyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/parties/${id}`)
      .then((r) => r.json())
      .then(setParty)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Party wirklich löschen?")) return;
    await fetch(`/api/parties/${id}`, { method: "DELETE" });
    router.push("/dashboard/parties");
  };

  if (loading)
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  if (!party)
    return (
      <div className="text-center py-12 text-gray-400">Nicht gefunden</div>
    );

  const status = statusLabels[party.status] || {
    label: party.status,
    color: "bg-gray-600/20 text-gray-400",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/parties"
            className="p-2 hover:bg-gray-800 rounded-lg transition">
            ← Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{party.name}</h1>
            <p className="text-gray-400">
              {new Date(party.date).toLocaleDateString("de-DE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/parties/${id}/wuensche`}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
            🎵 Musikwünsche
          </Link>
          <Link
            href={`/dashboard/parties/${id}/packliste`}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
            📦 Packliste
          </Link>
          <Link
            href={`/dashboard/parties/${id}/edit`}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
            Bearbeiten
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
            Löschen
          </button>
        </div>
      </div>

      <div
        className={`inline-block px-4 py-2 rounded-full font-medium ${status.color}`}>
        {status.label}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🎉 Event-Details
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-gray-400 text-sm">Zeit</dt>
              <dd className="text-white">
                {party.startTime || "-"} - {party.endTime || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">Gäste</dt>
              <dd className="text-white">{party.guestCount || "-"}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">💰 Finanzen</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-gray-400 text-sm">Preis</dt>
              <dd className="text-white text-xl font-bold">
                {party.price ? `${Number(party.price).toFixed(2)} €` : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">Anzahlung</dt>
              <dd className="text-white">
                {party.deposit ? `${Number(party.deposit).toFixed(2)} €` : "-"}{" "}
                {party.depositPaid && (
                  <span className="text-green-400 text-sm">✓ bezahlt</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {party.customer && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">👤 Kunde</h2>
            <Link
              href={`/dashboard/customers/${party.customer.id}`}
              className="text-purple-400 hover:underline text-lg">
              {party.customer.firstName} {party.customer.lastName}
            </Link>
          </div>
        )}

        {party.location && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              📍 Location
            </h2>
            <Link
              href={`/dashboard/locations/${party.location.id}`}
              className="text-purple-400 hover:underline text-lg">
              {party.location.name}
            </Link>
            {party.location.city && (
              <p className="text-gray-400">{party.location.city}</p>
            )}
          </div>
        )}
      </div>

      {party.playlist && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              🎵 Playlist: {party.playlist.name}
            </h2>
            <Link
              href={`/dashboard/playlists/${party.playlist.id}`}
              className="text-purple-400 hover:underline text-sm">
              Zur Playlist →
            </Link>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {party.playlist.songs.slice(0, 10).map((ps, idx) => (
              <div key={idx} className="p-2 bg-gray-700/30 rounded text-sm">
                <span className="text-white">{ps.song.title}</span>
                {ps.song.artist && (
                  <span className="text-gray-400"> - {ps.song.artist}</span>
                )}
              </div>
            ))}
            {party.playlist.songs.length > 10 && (
              <p className="text-gray-400 text-sm text-center">
                ... und {party.playlist.songs.length - 10} weitere Songs
              </p>
            )}
          </div>
        </div>
      )}

      {party.notes && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📝 Notizen</h2>
          <p className="text-white whitespace-pre-wrap">{party.notes}</p>
        </div>
      )}
    </div>
  );
}

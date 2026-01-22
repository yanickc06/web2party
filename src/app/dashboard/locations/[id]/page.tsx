"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Location {
  id: string;
  name: string;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  capacity: number | null;
  notes: string | null;
  customer: { id: string; firstName: string; lastName: string } | null;
  parties: { id: string; name: string; date: string }[];
}

export default function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/locations/${id}`)
      .then((r) => r.json())
      .then(setLocation)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Location wirklich löschen?")) return;
    await fetch(`/api/locations/${id}`, { method: "DELETE" });
    router.push("/dashboard/locations");
  };

  if (loading)
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  if (!location)
    return (
      <div className="text-center py-12 text-gray-400">Nicht gefunden</div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/locations"
            className="p-2 hover:bg-gray-800 rounded-lg transition">
            ← Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{location.name}</h1>
            {location.city && <p className="text-gray-400">{location.city}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/locations/${id}/edit`}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📍 Adresse</h2>
          <address className="text-white not-italic">
            {location.street && <p>{location.street}</p>}
            <p>
              {location.postalCode} {location.city}
            </p>
            {location.country && <p>{location.country}</p>}
          </address>
          {location.capacity && (
            <p className="mt-4 text-gray-400">
              Kapazität:{" "}
              <span className="text-white">{location.capacity} Personen</span>
            </p>
          )}
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📞 Kontakt</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-gray-400 text-sm">Ansprechpartner</dt>
              <dd className="text-white">{location.contactPerson || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">Telefon</dt>
              <dd className="text-white">{location.phone || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">E-Mail</dt>
              <dd className="text-white">
                {location.email ? (
                  <a
                    href={`mailto:${location.email}`}
                    className="text-purple-400 hover:underline">
                    {location.email}
                  </a>
                ) : (
                  "-"
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {location.customer && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            👤 Verknüpfter Kunde
          </h2>
          <Link
            href={`/dashboard/customers/${location.customer.id}`}
            className="text-purple-400 hover:underline text-lg">
            {location.customer.firstName} {location.customer.lastName}
          </Link>
        </div>
      )}

      {location.parties.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🎉 Parties an dieser Location
          </h2>
          <div className="space-y-2">
            {location.parties.map((party) => (
              <Link
                key={party.id}
                href={`/dashboard/parties/${party.id}`}
                className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition">
                <span className="text-white">{party.name}</span>
                <span className="text-gray-400 text-sm ml-2">
                  {new Date(party.date).toLocaleDateString("de-DE")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {location.notes && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📝 Notizen</h2>
          <p className="text-white whitespace-pre-wrap">{location.notes}</p>
        </div>
      )}
    </div>
  );
}

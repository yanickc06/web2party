"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Partner {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  benefits: string | null;
  notes: string | null;
  equipment: { id: string; name: string }[];
}

export default function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/partners/${id}`)
      .then((r) => r.json())
      .then(setPartner)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Partner wirklich löschen?")) return;
    await fetch(`/api/partners/${id}`, { method: "DELETE" });
    router.push("/dashboard/partners");
  };

  if (loading)
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  if (!partner)
    return (
      <div className="text-center py-12 text-gray-400">Nicht gefunden</div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/partners"
            className="p-2 hover:bg-gray-800 rounded-lg transition">
            ← Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{partner.name}</h1>
            {partner.contactPerson && (
              <p className="text-gray-400">{partner.contactPerson}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/partners/${id}/edit`}
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
          <h2 className="text-lg font-semibold text-white mb-4">📞 Kontakt</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-gray-400 text-sm">E-Mail</dt>
              <dd className="text-white">
                {partner.email ? (
                  <a
                    href={`mailto:${partner.email}`}
                    className="text-purple-400 hover:underline">
                    {partner.email}
                  </a>
                ) : (
                  "-"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">Telefon</dt>
              <dd className="text-white">{partner.phone || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">Website</dt>
              <dd className="text-white">
                {partner.website ? (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:underline">
                    {partner.website}
                  </a>
                ) : (
                  "-"
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">⭐ Vorteile</h2>
          <p className="text-white whitespace-pre-wrap">
            {partner.benefits || "Keine Vorteile hinterlegt"}
          </p>
        </div>
      </div>

      {partner.equipment.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🔊 Miet-Equipment von diesem Partner
          </h2>
          <div className="space-y-2">
            {partner.equipment.map((eq) => (
              <Link
                key={eq.id}
                href={`/dashboard/equipment/${eq.id}`}
                className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition">
                {eq.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {partner.notes && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📝 Notizen</h2>
          <p className="text-white whitespace-pre-wrap">{partner.notes}</p>
        </div>
      )}
    </div>
  );
}

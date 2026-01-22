"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Equipment {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  isOwned: boolean;
  rentalPrice: number | null;
  purchasePrice: number | null;
  purchaseDate: string | null;
  specs: string | null;
  notes: string | null;
  rentalPartner: { id: string; name: string } | null;
}

const categoryLabels: Record<string, string> = {
  SPEAKER: "🔊 Lautsprecher",
  MIXER: "🎛️ Mixer",
  CONTROLLER: "🎮 Controller",
  LIGHTS: "💡 Licht",
  MICROPHONE: "🎤 Mikrofon",
  CABLES: "🔌 Kabel",
  STAND: "📐 Stativ",
  EFFECTS: "✨ Effekte",
  OTHER: "📦 Sonstiges",
};

export default function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/equipment/${id}`)
      .then((r) => r.json())
      .then(setEquipment)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Gerät wirklich löschen?")) return;
    await fetch(`/api/equipment/${id}`, { method: "DELETE" });
    router.push("/dashboard/equipment");
  };

  if (loading)
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  if (!equipment)
    return (
      <div className="text-center py-12 text-gray-400">Nicht gefunden</div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/equipment"
            className="p-2 hover:bg-gray-800 rounded-lg transition">
            ← Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{equipment.name}</h1>
            <p className="text-gray-400">
              {categoryLabels[equipment.category]}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/equipment/${id}/edit`}
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
          <h2 className="text-lg font-semibold text-white mb-4">
            🔊 Gerätedaten
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-gray-400 text-sm">Marke</dt>
              <dd className="text-white">{equipment.brand || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">Modell</dt>
              <dd className="text-white">{equipment.model || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">Seriennummer</dt>
              <dd className="text-white">{equipment.serialNumber || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">Standort</dt>
              <dd className="text-white">{equipment.location || "-"}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            💰 Eigentum / Miete
          </h2>
          <div
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${equipment.isOwned ? "bg-green-600/20 text-green-400" : "bg-orange-600/20 text-orange-400"}`}>
            {equipment.isOwned ? "✓ Eigentum" : "🔄 Miete"}
          </div>
          <dl className="space-y-3">
            {equipment.isOwned ? (
              <>
                <div>
                  <dt className="text-gray-400 text-sm">Kaufpreis</dt>
                  <dd className="text-white">
                    {equipment.purchasePrice
                      ? `${Number(equipment.purchasePrice).toFixed(2)} €`
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-sm">Kaufdatum</dt>
                  <dd className="text-white">
                    {equipment.purchaseDate
                      ? new Date(equipment.purchaseDate).toLocaleDateString(
                          "de-DE",
                        )
                      : "-"}
                  </dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt className="text-gray-400 text-sm">Mietpreis/Tag</dt>
                  <dd className="text-white">
                    {equipment.rentalPrice
                      ? `${Number(equipment.rentalPrice).toFixed(2)} €`
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-sm">Miet-Partner</dt>
                  <dd className="text-white">
                    {equipment.rentalPartner?.name || "-"}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </div>

      {(equipment.specs || equipment.notes) && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📝 Details</h2>
          {equipment.specs && (
            <div className="mb-4">
              <h3 className="text-gray-400 text-sm mb-1">Technische Daten</h3>
              <p className="text-white whitespace-pre-wrap">
                {equipment.specs}
              </p>
            </div>
          )}
          {equipment.notes && (
            <div>
              <h3 className="text-gray-400 text-sm mb-1">Notizen</h3>
              <p className="text-white whitespace-pre-wrap">
                {equipment.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

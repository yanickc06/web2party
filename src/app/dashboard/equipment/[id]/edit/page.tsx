"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Partner {
  id: string;
  name: string;
}

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
  rentalPartnerId: string | null;
}

export default function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isOwned, setIsOwned] = useState(true);
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/equipment/${id}`).then((r) => r.json()),
      fetch("/api/partners").then((r) => r.json()),
    ])
      .then(([eq, p]) => {
        setEquipment(eq);
        setIsOwned(eq.isOwned);
        setPartners(p);
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
      category: formData.get("category"),
      brand: formData.get("brand") || null,
      model: formData.get("model") || null,
      serialNumber: formData.get("serialNumber") || null,
      location: formData.get("location") || null,
      isOwned: isOwned,
      rentalPrice: formData.get("rentalPrice")
        ? parseFloat(formData.get("rentalPrice") as string)
        : null,
      purchasePrice: formData.get("purchasePrice")
        ? parseFloat(formData.get("purchasePrice") as string)
        : null,
      purchaseDate: formData.get("purchaseDate") || null,
      specs: formData.get("specs") || null,
      notes: formData.get("notes") || null,
      rentalPartnerId: formData.get("rentalPartnerId") || null,
    };

    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Fehler beim Speichern");
      }

      router.push(`/dashboard/equipment/${id}`);
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
  if (!equipment)
    return (
      <div className="text-center py-12 text-gray-400">Nicht gefunden</div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/equipment/${id}`}
          className="p-2 hover:bg-gray-800 rounded-lg transition">
          ← Zurück
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Gerät bearbeiten</h1>
          <p className="text-gray-400">{equipment.name}</p>
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
            🔊 Gerätedaten
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={equipment.name}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kategorie *
              </label>
              <select
                name="category"
                required
                defaultValue={equipment.category}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="SPEAKER">🔊 Lautsprecher</option>
                <option value="MIXER">🎛️ Mixer</option>
                <option value="CONTROLLER">🎮 Controller</option>
                <option value="LIGHTS">💡 Licht</option>
                <option value="MICROPHONE">🎤 Mikrofon</option>
                <option value="CABLES">🔌 Kabel</option>
                <option value="STAND">📐 Stativ</option>
                <option value="EFFECTS">✨ Effekte</option>
                <option value="OTHER">📦 Sonstiges</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Marke
              </label>
              <input
                type="text"
                name="brand"
                defaultValue={equipment.brand || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Modell
              </label>
              <input
                type="text"
                name="model"
                defaultValue={equipment.model || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seriennummer
              </label>
              <input
                type="text"
                name="serialNumber"
                defaultValue={equipment.serialNumber || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Standort
              </label>
              <input
                type="text"
                name="location"
                defaultValue={equipment.location || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            💰 Eigentum / Miete
          </h2>
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setIsOwned(true)}
              className={`px-4 py-2 rounded-lg font-medium transition ${isOwned ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"}`}>
              ✓ Eigentum
            </button>
            <button
              type="button"
              onClick={() => setIsOwned(false)}
              className={`px-4 py-2 rounded-lg font-medium transition ${!isOwned ? "bg-orange-600 text-white" : "bg-gray-700 text-gray-300"}`}>
              🔄 Miete
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isOwned ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kaufpreis (€)
                  </label>
                  <input
                    type="number"
                    name="purchasePrice"
                    step="0.01"
                    defaultValue={equipment.purchasePrice || ""}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kaufdatum
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    defaultValue={equipment.purchaseDate?.split("T")[0] || ""}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mietpreis/Tag (€)
                  </label>
                  <input
                    type="number"
                    name="rentalPrice"
                    step="0.01"
                    defaultValue={equipment.rentalPrice || ""}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Miet-Partner
                  </label>
                  <select
                    name="rentalPartnerId"
                    defaultValue={equipment.rentalPartnerId || ""}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Auswählen...</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📝 Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Technische Daten
              </label>
              <textarea
                name="specs"
                rows={3}
                defaultValue={equipment.specs || ""}
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
                defaultValue={equipment.notes || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50">
            {loading ? "Speichern..." : "Änderungen speichern"}
          </button>
          <Link
            href={`/dashboard/equipment/${id}`}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}

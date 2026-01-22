import Link from "next/link";
import prisma from "@/lib/prisma";

interface EquipmentWithPartner {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  location: string | null;
  isOwned: boolean;
  rentalPrice: number | null;
  purchasePrice: number | null;
  rentalPartner: { name: string } | null;
}

async function getEquipment() {
  return prisma.equipment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      rentalPartner: true,
    },
  });
}

const categoryLabels: Record<string, { label: string; icon: string }> = {
  SPEAKER: { label: "Lautsprecher", icon: "🔊" },
  MIXER: { label: "Mixer", icon: "🎛️" },
  CONTROLLER: { label: "Controller", icon: "🎮" },
  LIGHTS: { label: "Licht", icon: "💡" },
  MICROPHONE: { label: "Mikrofon", icon: "🎤" },
  CABLES: { label: "Kabel", icon: "🔌" },
  STAND: { label: "Stativ", icon: "📐" },
  EFFECTS: { label: "Effekte", icon: "✨" },
  OTHER: { label: "Sonstiges", icon: "📦" },
};

export default async function EquipmentPage() {
  const equipment = await getEquipment();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            🔊 Technikverwaltung
          </h1>
          <p className="text-gray-400 mt-1">
            {equipment.length} Geräte erfasst
          </p>
        </div>
        <Link
          href="/dashboard/equipment/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2">
          <span>+</span> Neues Gerät
        </Link>
      </div>

      {/* Equipment Grid */}
      {equipment.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
          <span className="text-6xl">🔊</span>
          <p className="text-gray-400 mt-4">Noch keine Technik erfasst</p>
          <Link
            href="/dashboard/equipment/new"
            className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
            Erstes Gerät hinzufügen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((item: EquipmentWithPartner) => (
            <Link
              key={item.id}
              href={`/dashboard/equipment/${item.id}`}
              className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 hover:border-purple-500/50 transition group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {categoryLabels[item.category]?.icon || "📦"}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-purple-300 transition">
                      {item.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {categoryLabels[item.category]?.label || item.category}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    item.isOwned
                      ? "bg-green-500/20 text-green-400"
                      : "bg-orange-500/20 text-orange-400"
                  }`}>
                  {item.isOwned ? "Eigentum" : "Miete"}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {item.brand && (
                  <p className="text-gray-400">
                    <span className="text-gray-500">Marke:</span> {item.brand}{" "}
                    {item.model}
                  </p>
                )}
                {item.location && (
                  <p className="text-gray-400">
                    <span className="text-gray-500">Standort:</span>{" "}
                    {item.location}
                  </p>
                )}
                {!item.isOwned && item.rentalPartner && (
                  <p className="text-gray-400">
                    <span className="text-gray-500">Miete von:</span>{" "}
                    {item.rentalPartner.name}
                  </p>
                )}
              </div>

              {(item.rentalPrice || item.purchasePrice) && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  {item.rentalPrice && (
                    <p className="text-orange-400">
                      €{Number(item.rentalPrice).toFixed(2)} / Tag Miete
                    </p>
                  )}
                  {item.purchasePrice && (
                    <p className="text-gray-400 text-sm">
                      Kaufpreis: €{Number(item.purchasePrice).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

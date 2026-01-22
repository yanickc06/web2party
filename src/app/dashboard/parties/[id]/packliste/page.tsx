"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";

interface Equipment {
  id: string;
  name: string;
  category: string;
  serialNumber: string | null;
}

interface PartyEquipment {
  id: string;
  equipmentId: string;
  quantity: number;
  packed: boolean;
  notes: string | null;
  equipment: Equipment;
}

interface Party {
  id: string;
  name: string;
  date: string;
  customer: { firstName: string; lastName: string } | null;
  location: { name: string; city: string | null } | null;
}

const categoryIcons: Record<string, string> = {
  speaker: "🔊",
  lighting: "💡",
  mixer: "🎛️",
  microphone: "🎤",
  cable: "🔌",
  stand: "📍",
  effect: "✨",
  other: "📦",
};

export default function PacklistePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [party, setParty] = useState<Party | null>(null);
  const [packList, setPackList] = useState<PartyEquipment[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [quantity, setQuantity] = useState(1);

  const loadPackList = useCallback(async () => {
    const res = await fetch(`/api/parties/${id}/equipment`);
    const data = await res.json();
    setPackList(data);
  }, [id]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/parties/${id}`).then((r) => r.json()),
      fetch(`/api/parties/${id}/equipment`).then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json()),
    ]).then(([partyData, packData, equipData]) => {
      setParty(partyData);
      setPackList(packData);
      setAllEquipment(equipData);
      setLoading(false);
    });
  }, [id]);

  const togglePacked = async (equipmentId: string, currentPacked: boolean) => {
    await fetch(`/api/parties/${id}/equipment/${equipmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packed: !currentPacked }),
    });
    loadPackList();
  };

  const addEquipment = async () => {
    if (!selectedEquipment) return;
    await fetch(`/api/parties/${id}/equipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipmentId: selectedEquipment, quantity }),
    });
    setShowAddModal(false);
    setSelectedEquipment("");
    setQuantity(1);
    loadPackList();
  };

  const removeEquipment = async (equipmentId: string) => {
    if (!confirm("Equipment wirklich entfernen?")) return;
    await fetch(`/api/parties/${id}/equipment/${equipmentId}`, {
      method: "DELETE",
    });
    loadPackList();
  };

  const packedCount = packList.filter((p) => p.packed).length;
  const totalCount = packList.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  // Gruppiere nach Kategorie
  const groupedByCategory = packList.reduce(
    (acc, item) => {
      const cat = item.equipment.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, PartyEquipment[]>,
  );

  // Finde Equipment das noch nicht hinzugefügt wurde
  const availableEquipment = allEquipment.filter(
    (e) => !packList.some((p) => p.equipmentId === e.id),
  );

  if (loading)
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  if (!party)
    return (
      <div className="text-center py-12 text-gray-400">
        Party nicht gefunden
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/parties/${id}`}
            className="p-2 hover:bg-gray-800 rounded-lg transition">
            ← Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">📦 Packliste</h1>
            <p className="text-gray-400">{party.name}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
          + Equipment hinzufügen
        </button>
      </div>

      {/* Party Info */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-gray-400">Datum: </span>
            <span className="text-white">
              {new Date(party.date).toLocaleDateString("de-DE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          {party.customer && (
            <div>
              <span className="text-gray-400">Kunde: </span>
              <span className="text-white">
                {party.customer.firstName} {party.customer.lastName}
              </span>
            </div>
          )}
          {party.location && (
            <div>
              <span className="text-gray-400">Location: </span>
              <span className="text-white">
                {party.location.name}
                {party.location.city && `, ${party.location.city}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">Fortschritt</span>
          <span className="text-gray-400">
            {packedCount} / {totalCount} eingepackt
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progress === 100
                ? "bg-green-500"
                : progress > 50
                  ? "bg-yellow-500"
                  : "bg-purple-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 && (
          <p className="text-green-400 text-center mt-2 font-medium">
            ✅ Alles eingepackt!
          </p>
        )}
      </div>

      {/* Packliste nach Kategorie */}
      {totalCount === 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
          <p className="text-gray-400 text-lg">
            Noch kein Equipment hinzugefügt
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
            Equipment hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByCategory).map(([category, items]) => (
            <div
              key={category}
              className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 bg-gray-700/30 border-b border-gray-700">
                <h3 className="text-white font-medium">
                  {categoryIcons[category] || "📦"}{" "}
                  {category.charAt(0).toUpperCase() + category.slice(1)} (
                  {items.filter((i) => i.packed).length}/{items.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-700">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 flex items-center gap-4 transition ${
                      item.packed ? "bg-green-900/10" : ""
                    }`}>
                    <button
                      onClick={() =>
                        togglePacked(item.equipmentId, item.packed)
                      }
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xl transition ${
                        item.packed
                          ? "bg-green-600 text-white"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}>
                      {item.packed ? "✓" : ""}
                    </button>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          item.packed
                            ? "text-gray-400 line-through"
                            : "text-white"
                        }`}>
                        {item.equipment.name}
                        {item.quantity > 1 && (
                          <span className="ml-2 text-purple-400">
                            ×{item.quantity}
                          </span>
                        )}
                      </p>
                      {item.equipment.serialNumber && (
                        <p className="text-gray-500 text-sm">
                          S/N: {item.equipment.serialNumber}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-yellow-400 text-sm mt-1">
                          📝 {item.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeEquipment(item.equipmentId)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition">
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Druckansicht Button */}
      {totalCount > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
            🖨️ Packliste drucken
          </button>
        </div>
      )}

      {/* Modal zum Hinzufügen */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              Equipment hinzufügen
            </h2>
            {availableEquipment.length === 0 ? (
              <p className="text-gray-400">
                Alle Equipment-Teile wurden bereits hinzugefügt.
              </p>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Equipment auswählen
                    </label>
                    <select
                      value={selectedEquipment}
                      onChange={(e) => setSelectedEquipment(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                      <option value="">Bitte wählen...</option>
                      {availableEquipment.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} ({eq.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Anzahl
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(parseInt(e.target.value) || 1)
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
                    Abbrechen
                  </button>
                  <button
                    onClick={addEquipment}
                    disabled={!selectedEquipment}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                    Hinzufügen
                  </button>
                </div>
              </>
            )}
            {availableEquipment.length === 0 && (
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
                Schließen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-4xl,
          .max-w-4xl * {
            visibility: visible;
          }
          .max-w-4xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button,
          a {
            display: none !important;
          }
          .bg-gray-800\/50 {
            background: white !important;
            border: 1px solid #ccc !important;
          }
          * {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}

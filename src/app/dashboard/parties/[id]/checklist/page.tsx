"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  notes: string | null;
  order: number;
}

const CATEGORIES = [
  { value: "Vorbereitung", emoji: "📋" },
  { value: "Musik", emoji: "🎵" },
  { value: "Equipment", emoji: "🎛️" },
  { value: "Logistik", emoji: "🚗" },
  { value: "Nachbereitung", emoji: "✅" },
];

export default function PartyChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: partyId } = use(params);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Vorbereitung");
  const [partyName, setPartyName] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [partyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [checklistRes, partyRes] = await Promise.all([
        fetch(`/api/parties/${partyId}/checklist`),
        fetch(`/api/parties/${partyId}`),
      ]);

      if (checklistRes.ok) {
        const data = await checklistRes.json();
        setItems(data);
      }

      if (partyRes.ok) {
        const party = await partyRes.json();
        setPartyName(party.name);
      }
    } catch (error) {
      console.error("Error loading checklist:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async () => {
    if (
      !confirm(
        "Standard-Checkliste anwenden? Vorhandene Einträge bleiben erhalten.",
      )
    )
      return;

    try {
      const response = await fetch(`/api/parties/${partyId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applyTemplate: "standard" }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error("Error applying template:", error);
    }
  };

  const addItem = async () => {
    if (!newTitle.trim()) return;

    try {
      const response = await fetch(`/api/parties/${partyId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
        }),
      });

      if (response.ok) {
        setNewTitle("");
        loadData();
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const toggleCompleted = async (item: ChecklistItem) => {
    try {
      await fetch(`/api/parties/${partyId}/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          completed: !item.completed,
        }),
      });
      loadData();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm("Eintrag wirklich löschen?")) return;

    try {
      await fetch(`/api/parties/${partyId}/checklist?itemId=${itemId}`, {
        method: "DELETE",
      });
      loadData();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, ChecklistItem[]>,
  );

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed).length;
  const progress =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  }

  const filteredCategories = filter
    ? CATEGORIES.filter((c) => c.value === filter)
    : CATEGORIES;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/parties/${partyId}`}
            className="p-2 hover:bg-gray-800 rounded-lg transition">
            ← Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">✅ Checkliste</h1>
            <p className="text-gray-400">{partyName}</p>
          </div>
        </div>

        <button
          onClick={applyTemplate}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
          📋 Vorlage anwenden
        </button>
      </div>

      {/* Fortschritt */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-semibold">Fortschritt</span>
          <span className="text-purple-400 font-bold">
            {completedItems}/{totalItems} ({progress}%)
          </span>
        </div>
        <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Neuer Eintrag */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Neuer Eintrag</h2>
        <div className="flex gap-4">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.emoji} {cat.value}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="z.B. Backup USB-Stick einpacken"
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <button
            onClick={addItem}
            disabled={!newTitle.trim()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition">
            Hinzufügen
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded text-sm transition ${
            filter === null
              ? "bg-purple-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}>
          Alle
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-3 py-1.5 rounded text-sm transition ${
              filter === cat.value
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}>
            {cat.emoji} {cat.value}
          </button>
        ))}
      </div>

      {/* Checkliste nach Kategorien */}
      {items.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
          <span className="text-5xl">📋</span>
          <p className="text-gray-400 mt-4">Noch keine Einträge</p>
          <p className="text-gray-500 text-sm">
            Klicke auf "Vorlage anwenden" oder füge eigene Einträge hinzu
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map((cat) => {
            const categoryItems = groupedItems[cat.value] || [];
            if (categoryItems.length === 0) return null;

            const categoryCompleted = categoryItems.filter(
              (i) => i.completed,
            ).length;

            return (
              <div
                key={cat.value}
                className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-white font-semibold">
                    {cat.emoji} {cat.value}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {categoryCompleted}/{categoryItems.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-700/50">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-4 transition ${
                        item.completed ? "bg-green-900/10" : ""
                      }`}>
                      <button
                        onClick={() => toggleCompleted(item)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                          item.completed
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-gray-600 hover:border-purple-500"
                        }`}>
                        {item.completed && "✓"}
                      </button>

                      <span
                        className={`flex-1 ${
                          item.completed
                            ? "text-gray-500 line-through"
                            : "text-white"
                        }`}>
                        {item.title}
                      </span>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface TimelineEntry {
  id: string;
  time: string;
  description: string;
  songId: string | null;
  completed: boolean;
  order: number;
}

export default function PartyTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: partyId } = use(params);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTime, setNewTime] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [partyName, setPartyName] = useState("");

  useEffect(() => {
    loadData();
  }, [partyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [timelineRes, partyRes] = await Promise.all([
        fetch(`/api/parties/${partyId}/timeline`),
        fetch(`/api/parties/${partyId}`),
      ]);

      if (timelineRes.ok) {
        const data = await timelineRes.json();
        setEntries(data);
      }

      if (partyRes.ok) {
        const party = await partyRes.json();
        setPartyName(party.name);
      }
    } catch (error) {
      console.error("Error loading timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async () => {
    if (!newTime || !newDescription.trim()) return;

    try {
      const response = await fetch(`/api/parties/${partyId}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time: newTime,
          description: newDescription.trim(),
        }),
      });

      if (response.ok) {
        setNewTime("");
        setNewDescription("");
        loadData();
      }
    } catch (error) {
      console.error("Error adding entry:", error);
    }
  };

  const toggleCompleted = async (entry: TimelineEntry) => {
    try {
      await fetch(`/api/parties/${partyId}/timeline`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: entry.id,
          completed: !entry.completed,
        }),
      });
      loadData();
    } catch (error) {
      console.error("Error updating entry:", error);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!confirm("Eintrag wirklich löschen?")) return;

    try {
      await fetch(`/api/parties/${partyId}/timeline?entryId=${entryId}`, {
        method: "DELETE",
      });
      loadData();
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/parties/${partyId}`}
          className="p-2 hover:bg-gray-800 rounded-lg transition">
          ← Zurück
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">🕐 Timeline</h1>
          <p className="text-gray-400">{partyName}</p>
        </div>
      </div>

      {/* Neuer Eintrag */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Neuer Eintrag</h2>
        <div className="flex gap-4">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
          />
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="z.B. Opening Set starten"
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && addEntry()}
          />
          <button
            onClick={addEntry}
            disabled={!newTime || !newDescription.trim()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition">
            Hinzufügen
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-5xl">🕐</span>
            <p className="text-gray-400 mt-4">Noch keine Einträge</p>
            <p className="text-gray-500 text-sm">
              Füge Zeitpunkte für dein DJ-Set hinzu
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-4 transition ${
                  entry.completed ? "bg-green-900/10" : ""
                }`}>
                <button
                  onClick={() => toggleCompleted(entry)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
                    entry.completed
                      ? "bg-green-600 border-green-600 text-white"
                      : "border-gray-600 hover:border-purple-500"
                  }`}>
                  {entry.completed && "✓"}
                </button>

                <div className="w-20 text-center">
                  <span className="text-2xl font-bold text-purple-400">
                    {entry.time}
                  </span>
                </div>

                <div className="flex-1">
                  <p
                    className={`text-white ${entry.completed ? "line-through opacity-60" : ""}`}>
                    {entry.description}
                  </p>
                </div>

                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition">
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schnellvorlagen */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-white font-semibold mb-3">💡 Schnell hinzufügen</h3>
        <div className="flex flex-wrap gap-2">
          {[
            "Aufbau beginnen",
            "Soundcheck",
            "Opening Set",
            "Warm-Up Phase",
            "Peak Time",
            "Torte / Highlights",
            "Closing Set",
            "Abbau beginnen",
          ].map((template) => (
            <button
              key={template}
              onClick={() => setNewDescription(template)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition">
              {template}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface PartyNote {
  id: string;
  category: "GENERAL" | "WISHES" | "FORBIDDEN" | "HIGHLIGHTS" | "FEEDBACK";
  content: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  {
    value: "GENERAL" as const,
    label: "Allgemein",
    emoji: "📝",
    color: "bg-blue-500",
  },
  {
    value: "WISHES" as const,
    label: "Wünsche",
    emoji: "⭐",
    color: "bg-yellow-500",
  },
  {
    value: "FORBIDDEN" as const,
    label: "Verboten",
    emoji: "🚫",
    color: "bg-red-500",
  },
  {
    value: "HIGHLIGHTS" as const,
    label: "Highlights",
    emoji: "🎉",
    color: "bg-green-500",
  },
  {
    value: "FEEDBACK" as const,
    label: "Feedback",
    emoji: "💬",
    color: "bg-purple-500",
  },
];

export default function PartyNotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: partyId } = use(params);
  const [notes, setNotes] = useState<PartyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] =
    useState<PartyNote["category"]>("GENERAL");
  const [partyName, setPartyName] = useState("");
  const [filter, setFilter] = useState<PartyNote["category"] | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    loadData();
  }, [partyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notesRes, partyRes] = await Promise.all([
        fetch(`/api/parties/${partyId}/notes`),
        fetch(`/api/parties/${partyId}`),
      ]);

      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotes(data);
      }

      if (partyRes.ok) {
        const party = await partyRes.json();
        setPartyName(party.name);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newContent.trim()) return;

    try {
      const response = await fetch(`/api/parties/${partyId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent.trim(),
          category: newCategory,
        }),
      });

      if (response.ok) {
        setNewContent("");
        loadData();
      }
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const updateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      await fetch(`/api/parties/${partyId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId,
          content: editContent.trim(),
        }),
      });
      setEditingNote(null);
      loadData();
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm("Notiz wirklich löschen?")) return;

    try {
      await fetch(`/api/parties/${partyId}/notes?noteId=${noteId}`, {
        method: "DELETE",
      });
      loadData();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const getCategoryInfo = (category: PartyNote["category"]) =>
    CATEGORIES.find((c) => c.value === category)!;

  const filteredNotes = filter
    ? notes.filter((n) => n.category === filter)
    : notes;

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
          <h1 className="text-2xl font-bold text-white">📝 Notizen</h1>
          <p className="text-gray-400">{partyName}</p>
        </div>
      </div>

      {/* Neue Notiz */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Neue Notiz</h2>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setNewCategory(cat.value)}
                className={`px-3 py-1.5 rounded text-sm transition flex items-center gap-2 ${
                  newCategory === cat.value
                    ? `${cat.color} text-white`
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Notiz eingeben..."
            rows={3}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={addNote}
              disabled={!newContent.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition">
              Speichern
            </button>
          </div>
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
          Alle ({notes.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = notes.filter((n) => n.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`px-3 py-1.5 rounded text-sm transition ${
                filter === cat.value
                  ? `${cat.color} text-white`
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}>
              {cat.emoji} {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Notizen-Liste */}
      {filteredNotes.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
          <span className="text-5xl">📝</span>
          <p className="text-gray-400 mt-4">Keine Notizen</p>
          <p className="text-gray-500 text-sm">
            Halte wichtige Infos zur Party fest
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => {
            const cat = getCategoryInfo(note.category);
            const isEditing = editingNote === note.id;

            return (
              <div
                key={note.id}
                className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className={`h-1 ${cat.color}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${cat.color} text-white`}>
                      {cat.emoji} {cat.label}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(note.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingNote(null)}
                          className="px-4 py-1.5 text-gray-400 hover:text-white transition">
                          Abbrechen
                        </button>
                        <button
                          onClick={() => updateNote(note.id)}
                          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded transition">
                          Speichern
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-white whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="flex gap-2 mt-3 justify-end">
                        <button
                          onClick={() => {
                            setEditingNote(note.id);
                            setEditContent(note.content);
                          }}
                          className="p-1.5 text-gray-400 hover:text-purple-400 transition">
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 transition">
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Kategorien-Übersicht */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-white font-semibold mb-4">📊 Übersicht</h3>
        <div className="grid grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => {
            const count = notes.filter((n) => n.category === cat.value).length;
            return (
              <div
                key={cat.value}
                className="text-center p-3 bg-gray-900/50 rounded-lg">
                <span className="text-2xl">{cat.emoji}</span>
                <p className="text-2xl font-bold text-white mt-1">{count}</p>
                <p className="text-xs text-gray-500">{cat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

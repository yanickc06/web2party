"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface PlayedSong {
  id: string;
  title: string;
  artist: string | null;
  playedAt: string;
  reaction: "AMAZING" | "GOOD" | "NEUTRAL" | "BAD" | null;
  notes: string | null;
  songId: string | null;
}

interface LibrarySong {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  key: string | null;
  genre: string | null;
}

const REACTIONS = [
  {
    value: "AMAZING",
    emoji: "🔥",
    label: "Tanzfläche voll",
    color: "bg-orange-500",
  },
  { value: "GOOD", emoji: "👍", label: "Gut", color: "bg-green-500" },
  { value: "NEUTRAL", emoji: "😐", label: "Normal", color: "bg-gray-500" },
  { value: "BAD", emoji: "👎", label: "Wenig Resonanz", color: "bg-red-500" },
];

export default function PartyStatisticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: partyId } = use(params);
  const [playedSongs, setPlayedSongs] = useState<PlayedSong[]>([]);
  const [librarySongs, setLibrarySongs] = useState<LibrarySong[]>([]);
  const [loading, setLoading] = useState(true);
  const [partyName, setPartyName] = useState("");
  const [partyDate, setPartyDate] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
    loadLibrarySongs();
  }, [partyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, partyRes] = await Promise.all([
        fetch(`/api/parties/${partyId}/statistics`),
        fetch(`/api/parties/${partyId}`),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setPlayedSongs(data);
      }

      if (partyRes.ok) {
        const party = await partyRes.json();
        setPartyName(party.name);
        setPartyDate(party.date);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLibrarySongs = async () => {
    try {
      const response = await fetch("/api/music");
      if (response.ok) {
        const data = await response.json();
        setLibrarySongs(data);
      }
    } catch (error) {
      console.error("Error loading library:", error);
    }
  };

  const addPlayedSong = async (songData: {
    title: string;
    artist: string;
    songId?: string;
  }) => {
    try {
      const response = await fetch(`/api/parties/${partyId}/statistics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(songData),
      });

      if (response.ok) {
        setNewTitle("");
        setNewArtist("");
        setShowLibrary(false);
        loadData();
      }
    } catch (error) {
      console.error("Error adding played song:", error);
    }
  };

  const addManualSong = () => {
    if (!newTitle.trim()) return;
    addPlayedSong({ title: newTitle.trim(), artist: newArtist.trim() });
  };

  const addFromLibrary = (song: LibrarySong) => {
    addPlayedSong({ title: song.title, artist: song.artist, songId: song.id });
  };

  const setReaction = async (songId: string, reaction: string) => {
    try {
      await fetch(`/api/parties/${partyId}/statistics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId, reaction }),
      });
      loadData();
    } catch (error) {
      console.error("Error setting reaction:", error);
    }
  };

  const deletePlayedSong = async (songId: string) => {
    if (!confirm("Song wirklich aus Statistik entfernen?")) return;

    try {
      await fetch(`/api/parties/${partyId}/statistics?songId=${songId}`, {
        method: "DELETE",
      });
      loadData();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  // Statistiken berechnen
  const stats = {
    total: playedSongs.length,
    amazing: playedSongs.filter((s) => s.reaction === "AMAZING").length,
    good: playedSongs.filter((s) => s.reaction === "GOOD").length,
    neutral: playedSongs.filter((s) => s.reaction === "NEUTRAL").length,
    bad: playedSongs.filter((s) => s.reaction === "BAD").length,
    unrated: playedSongs.filter((s) => !s.reaction).length,
  };

  const filteredLibrary = librarySongs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
          <h1 className="text-2xl font-bold text-white">📊 Statistiken</h1>
          <p className="text-gray-400">
            {partyName} -{" "}
            {partyDate && new Date(partyDate).toLocaleDateString("de-DE")}
          </p>
        </div>
      </div>

      {/* Übersicht */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-400">Gespielt</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-3xl font-bold text-orange-400">{stats.amazing}</p>
          <p className="text-xs text-gray-400">🔥 Amazing</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{stats.good}</p>
          <p className="text-xs text-gray-400">👍 Gut</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-3xl font-bold text-gray-400">{stats.neutral}</p>
          <p className="text-xs text-gray-400">😐 Normal</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{stats.bad}</p>
          <p className="text-xs text-gray-400">👎 Schlecht</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">{stats.unrated}</p>
          <p className="text-xs text-gray-400">Unbewert.</p>
        </div>
      </div>

      {/* Erfolgsquote */}
      {stats.total > 0 && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-white font-semibold mb-3">🎯 Erfolgsquote</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden flex">
              {stats.amazing > 0 && (
                <div
                  className="h-full bg-orange-500"
                  style={{ width: `${(stats.amazing / stats.total) * 100}%` }}
                />
              )}
              {stats.good > 0 && (
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(stats.good / stats.total) * 100}%` }}
                />
              )}
              {stats.neutral > 0 && (
                <div
                  className="h-full bg-gray-500"
                  style={{ width: `${(stats.neutral / stats.total) * 100}%` }}
                />
              )}
              {stats.bad > 0 && (
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${(stats.bad / stats.total) * 100}%` }}
                />
              )}
            </div>
            <span className="text-white font-bold">
              {stats.total > 0
                ? Math.round(
                    ((stats.amazing + stats.good) /
                      (stats.total - stats.unrated)) *
                      100,
                  ) || 0
                : 0}
              % positiv
            </span>
          </div>
        </div>
      )}

      {/* Song hinzufügen */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Song hinzufügen</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLibrary(false)}
              className={`px-3 py-1 rounded text-sm ${
                !showLibrary
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}>
              Manuell
            </button>
            <button
              onClick={() => setShowLibrary(true)}
              className={`px-3 py-1 rounded text-sm ${
                showLibrary
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}>
              Aus Bibliothek
            </button>
          </div>
        </div>

        {showLibrary ? (
          <div className="space-y-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Song suchen..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredLibrary.slice(0, 20).map((song) => (
                <button
                  key={song.id}
                  onClick={() => addFromLibrary(song)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-900/50 hover:bg-gray-700 rounded-lg transition text-left">
                  <span className="text-2xl">🎵</span>
                  <div className="flex-1">
                    <p className="text-white">{song.title}</p>
                    <p className="text-sm text-gray-400">{song.artist}</p>
                  </div>
                  {song.bpm && (
                    <span className="text-xs text-gray-500">
                      {song.bpm} BPM
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Titel"
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            />
            <input
              type="text"
              value={newArtist}
              onChange={(e) => setNewArtist(e.target.value)}
              placeholder="Künstler"
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && addManualSong()}
            />
            <button
              onClick={addManualSong}
              disabled={!newTitle.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition">
              Hinzufügen
            </button>
          </div>
        )}
      </div>

      {/* Gespielte Songs */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">
            🎵 Gespielte Songs ({playedSongs.length})
          </h3>
        </div>

        {playedSongs.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-5xl">🎧</span>
            <p className="text-gray-400 mt-4">Noch keine Songs gespielt</p>
            <p className="text-gray-500 text-sm">
              Füge während der Party gespielte Songs hinzu
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {playedSongs.map((song, index) => (
              <div
                key={song.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-700/30 transition">
                <span className="w-8 text-center text-gray-500 font-mono">
                  #{index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-white">{song.title}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    {song.artist && <span>{song.artist}</span>}
                    <span>
                      {new Date(song.playedAt).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  {REACTIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReaction(song.id, r.value)}
                      title={r.label}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                        song.reaction === r.value
                          ? `${r.color} text-white`
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}>
                      {r.emoji}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => deletePlayedSong(song.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition">
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

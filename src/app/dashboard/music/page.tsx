"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Song {
  id: string;
  title: string;
  artist: string | null;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  mp3Path: string | null;
  _count: { playlistSongs: number };
}

export default function MusicPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [bulkAction, setBulkAction] = useState<string | null>(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  async function fetchSongs() {
    try {
      const res = await fetch("/api/music");
      const data = await res.json();
      setSongs(data);
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filtern
  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.artist || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !genreFilter || song.genre === genreFilter;
    const matchesMood = !moodFilter || song.mood === moodFilter;
    return matchesSearch && matchesGenre && matchesMood;
  });

  // Alle auswählen/abwählen
  function toggleSelectAll() {
    if (selectedIds.size === filteredSongs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSongs.map((s) => s.id)));
    }
  }

  // Einzelne Auswahl
  function toggleSelect(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }

  // Bulk Löschen
  async function handleBulkDelete() {
    if (!confirm(`${selectedIds.size} Songs wirklich löschen?`)) return;
    setBulkAction("delete");

    try {
      for (const id of selectedIds) {
        await fetch(`/api/music/${id}`, { method: "DELETE" });
      }
      setSelectedIds(new Set());
      await fetchSongs();
    } catch (error) {
      console.error("Error deleting songs:", error);
    } finally {
      setBulkAction(null);
    }
  }

  // Bulk Neu Analysieren (ID3 Tags neu lesen)
  async function handleBulkReanalyze() {
    setBulkAction("reanalyze");

    try {
      const res = await fetch("/api/music/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        await fetchSongs();
        alert("Analyse abgeschlossen!");
      }
    } catch (error) {
      console.error("Error reanalyzing songs:", error);
    } finally {
      setBulkAction(null);
    }
  }

  // Genres aus Songs extrahieren
  const uniqueGenres = [...new Set(songs.map((s) => s.genre).filter(Boolean))];
  const uniqueMoods = [...new Set(songs.map((s) => s.mood).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🎵 Musikverwaltung</h1>
          <p className="text-gray-400 mt-1">
            {songs.length} Songs in der Bibliothek
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/music/bulk-upload"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition flex items-center gap-2">
            📦 Bulk Upload
          </Link>
          <Link
            href="/dashboard/music/new"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2">
            <span>+</span> Song hinzufügen
          </Link>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4 flex items-center justify-between">
          <span className="text-purple-300 font-medium">
            {selectedIds.size} Song(s) ausgewählt
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkReanalyze}
              disabled={bulkAction !== null}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg transition flex items-center gap-2">
              {bulkAction === "reanalyze" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analysiere...
                </>
              ) : (
                <>🔄 Neu analysieren</>
              )}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkAction !== null}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white rounded-lg transition flex items-center gap-2">
              {bulkAction === "delete" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Lösche...
                </>
              ) : (
                <>🗑️ Löschen</>
              )}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition">
              ✕ Auswahl aufheben
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="search"
          placeholder="Songs suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="">Alle Genres</option>
          {uniqueGenres.map((g) => (
            <option key={g} value={g!}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={moodFilter}
          onChange={(e) => setMoodFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="">Alle Stimmungen</option>
          {uniqueMoods.map((m) => (
            <option key={m} value={m!}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Songs Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        {filteredSongs.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-6xl">🎵</span>
            <p className="text-gray-400 mt-4">
              {songs.length === 0
                ? "Noch keine Songs vorhanden"
                : "Keine Songs gefunden"}
            </p>
            {songs.length === 0 && (
              <Link
                href="/dashboard/music/new"
                className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
                Ersten Song hinzufügen
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === filteredSongs.length &&
                      filteredSongs.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Titel / Künstler
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Genre / Stimmung
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  BPM
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  MP3
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Playlists
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredSongs.map((song) => (
                <tr
                  key={song.id}
                  className={`hover:bg-gray-800/50 transition ${
                    selectedIds.has(song.id) ? "bg-purple-600/10" : ""
                  }`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(song.id)}
                      onChange={() => toggleSelect(song.id)}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{song.title}</p>
                    <p className="text-sm text-gray-400">
                      {song.artist || "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {song.genre && (
                      <span className="inline-block px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded mr-2">
                        {song.genre}
                      </span>
                    )}
                    {song.mood && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded">
                        {song.mood}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{song.bpm || "-"}</td>
                  <td className="px-6 py-4">
                    {song.mp3Path ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-purple-400">
                    {song._count.playlistSongs}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/music/${song.id}`}
                      className="text-purple-400 hover:text-purple-300 font-medium">
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

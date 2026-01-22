"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Song {
  id: string;
  title: string;
  artist: string | null;
}

export default function NewPlaylistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/music")
      .then((r) => r.json())
      .then(setSongs)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description") || null,
      songs: selectedSongs,
    };

    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Fehler beim Speichern");
      }

      router.push("/dashboard/playlists");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSong = (id: string) => {
    setSelectedSongs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.artist && s.artist.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/playlists"
          className="p-2 hover:bg-gray-800 rounded-lg transition">
          ← Zurück
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Neue Playlist</h1>
          <p className="text-gray-400">
            Erstelle eine Playlist für deine Party
          </p>
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
            🎵 Playlist-Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="z.B. Hochzeit 2024 Mix"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Beschreibung
              </label>
              <textarea
                name="description"
                rows={2}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              🎶 Songs auswählen
            </h2>
            <span className="text-sm text-gray-400">
              {selectedSongs.length} ausgewählt
            </span>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Songs suchen..."
            className="w-full px-4 py-2 mb-4 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredSongs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {songs.length === 0
                  ? "Keine Songs vorhanden. Füge zuerst Songs hinzu."
                  : "Keine Songs gefunden."}
              </p>
            ) : (
              filteredSongs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => toggleSong(song.id)}
                  className={`p-3 rounded-lg cursor-pointer transition flex items-center gap-3 ${
                    selectedSongs.includes(song.id)
                      ? "bg-purple-600/30 border border-purple-500"
                      : "bg-gray-700/30 border border-gray-600 hover:border-gray-500"
                  }`}>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedSongs.includes(song.id)
                        ? "bg-purple-600 border-purple-600"
                        : "border-gray-500"
                    }`}>
                    {selectedSongs.includes(song.id) && (
                      <span className="text-white text-sm">✓</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{song.title}</p>
                    <p className="text-gray-400 text-sm">
                      {song.artist || "Unbekannt"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50">
            {loading ? "Speichern..." : "Playlist speichern"}
          </button>
          <Link
            href="/dashboard/playlists"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}

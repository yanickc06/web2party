"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Vordefinierte Optionen
const GENRES = [
  "House",
  "Techno",
  "EDM",
  "Hip-Hop",
  "R&B",
  "Pop",
  "Rock",
  "80er",
  "90er",
  "Charts",
  "Latin",
  "Schlager",
  "Disco",
  "Funk",
  "Soul",
  "Jazz",
  "Reggaeton",
];

const MOODS = [
  "Energiegeladen",
  "Ruhig",
  "Party",
  "Chill",
  "Romantisch",
  "Melancholisch",
];

const DJ_TAGS = [
  "Opener",
  "Warm-Up",
  "Peak Time",
  "Closing",
  "Crowd Favorite",
  "Klassiker",
  "Neu",
  "Selten spielen",
  "Hochzeit",
  "Geburtstag",
  "Club",
  "Lounge",
];

interface PreviewSong {
  id: string;
  title: string;
  artist: string | null;
  bpm: number | null;
  key: string | null;
  genre: string | null;
  mood: string | null;
  duration: number | null;
  tags: string | null;
}

interface SmartCriteria {
  name: string;
  minBpm: number | null;
  maxBpm: number | null;
  genres: string[];
  moods: string[];
  tags: string[];
  limit: number;
  sortBy: "bpm" | "title" | "artist" | "duration" | "random";
  sortOrder: "asc" | "desc";
}

export default function SmartPlaylistPage() {
  const router = useRouter();
  const [criteria, setCriteria] = useState<SmartCriteria>({
    name: "",
    minBpm: null,
    maxBpm: null,
    genres: [],
    moods: [],
    tags: [],
    limit: 30,
    sortBy: "bpm",
    sortOrder: "asc",
  });

  const [previewSongs, setPreviewSongs] = useState<PreviewSong[]>([]);
  const [totalMatching, setTotalMatching] = useState(0);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Lade Vorschau wenn Kriterien sich ändern
  useEffect(() => {
    const loadPreview = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (criteria.minBpm) params.set("minBpm", String(criteria.minBpm));
        if (criteria.maxBpm) params.set("maxBpm", String(criteria.maxBpm));
        if (criteria.genres.length > 0)
          params.set("genres", criteria.genres.join(","));
        if (criteria.moods.length > 0)
          params.set("moods", criteria.moods.join(","));
        if (criteria.tags.length > 0)
          params.set("tags", criteria.tags.join(","));
        params.set("limit", "10"); // Nur 10 für Vorschau

        const response = await fetch(
          `/api/playlists/smart?${params.toString()}`,
        );
        if (response.ok) {
          const data = await response.json();
          setPreviewSongs(data.songs);
          setTotalMatching(data.totalMatching);
        }
      } catch (err) {
        console.error("Preview error:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(loadPreview, 300);
    return () => clearTimeout(debounce);
  }, [
    criteria.minBpm,
    criteria.maxBpm,
    criteria.genres,
    criteria.moods,
    criteria.tags,
  ]);

  const handleToggleGenre = (genre: string) => {
    setCriteria((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleToggleMood = (mood: string) => {
    setCriteria((prev) => ({
      ...prev,
      moods: prev.moods.includes(mood)
        ? prev.moods.filter((m) => m !== mood)
        : [...prev.moods, mood],
    }));
  };

  const handleToggleTag = (tag: string) => {
    setCriteria((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleCreate = async () => {
    if (!criteria.name.trim()) {
      setError("Bitte gib einen Namen für die Playlist ein");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/playlists/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fehler beim Erstellen");
      }

      const data = await response.json();
      router.push(`/dashboard/playlists/${data.playlist.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/playlists"
          className="p-2 hover:bg-gray-800 rounded-lg transition">
          ← Zurück
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">
            🎯 Smart-Playlist erstellen
          </h1>
          <p className="text-gray-400">
            Automatisch Songs basierend auf Kriterien zusammenstellen
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kriterien-Bereich */}
        <div className="space-y-6">
          {/* Name */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              📝 Playlist-Name
            </h2>
            <input
              type="text"
              value={criteria.name}
              onChange={(e) =>
                setCriteria((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="z.B. Party-Hits 120-130 BPM"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* BPM-Range */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              🎵 BPM-Range
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-gray-400 text-sm">Min BPM</label>
                <input
                  type="number"
                  value={criteria.minBpm || ""}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      minBpm: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder="80"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <span className="text-gray-500 mt-6">bis</span>
              <div className="flex-1">
                <label className="text-gray-400 text-sm">Max BPM</label>
                <input
                  type="number"
                  value={criteria.maxBpm || ""}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      maxBpm: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder="140"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            {/* Schnellauswahl */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { label: "Warm-Up (90-110)", min: 90, max: 110 },
                { label: "Mid-Energy (110-125)", min: 110, max: 125 },
                { label: "Peak (125-135)", min: 125, max: 135 },
                { label: "High Energy (135+)", min: 135, max: 180 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() =>
                    setCriteria((prev) => ({
                      ...prev,
                      minBpm: preset.min,
                      maxBpm: preset.max,
                    }))
                  }
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition">
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genres */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">🎸 Genres</h2>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleToggleGenre(genre)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    criteria.genres.includes(genre)
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}>
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Stimmungen */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              😊 Stimmung
            </h2>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleToggleMood(mood)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    criteria.moods.includes(mood)
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}>
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">🏷️ Tags</h2>
            <div className="flex flex-wrap gap-2">
              {DJ_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    criteria.tags.includes(tag)
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Sortierung & Limit */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              ⚙️ Optionen
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-gray-400 text-sm">Sortieren nach</label>
                <select
                  value={criteria.sortBy}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      sortBy: e.target.value as typeof criteria.sortBy,
                    }))
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                  <option value="bpm">BPM</option>
                  <option value="title">Titel</option>
                  <option value="artist">Künstler</option>
                  <option value="duration">Dauer</option>
                  <option value="random">Zufällig</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Reihenfolge</label>
                <select
                  value={criteria.sortOrder}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      sortOrder: e.target.value as "asc" | "desc",
                    }))
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                  <option value="asc">Aufsteigend</option>
                  <option value="desc">Absteigend</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Max. Songs</label>
                <input
                  type="number"
                  value={criteria.limit}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      limit: parseInt(e.target.value) || 30,
                    }))
                  }
                  min={1}
                  max={200}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vorschau-Bereich */}
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">👁️ Vorschau</h2>
              <span className="text-purple-400 font-bold">
                {loading ? "Laden..." : `${totalMatching} Songs gefunden`}
              </span>
            </div>

            {previewSongs.length > 0 ? (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {previewSongs.map((song, index) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 p-2 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-500 text-sm w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{song.title}</p>
                      <p className="text-gray-400 text-sm truncate">
                        {song.artist}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      {song.bpm && (
                        <span className="text-purple-400">{song.bpm} BPM</span>
                      )}
                      {song.key && (
                        <span className="text-gray-500 ml-2">{song.key}</span>
                      )}
                    </div>
                  </div>
                ))}
                {totalMatching > 10 && (
                  <p className="text-gray-500 text-sm text-center py-2">
                    + {totalMatching - 10} weitere Songs
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {loading
                  ? "Lade Vorschau..."
                  : "Wähle Kriterien aus, um Songs zu finden"}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={
                creating || !criteria.name.trim() || totalMatching === 0
              }
              className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition">
              {creating
                ? "Erstelle..."
                : `🎯 Smart-Playlist erstellen (${totalMatching} Songs)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

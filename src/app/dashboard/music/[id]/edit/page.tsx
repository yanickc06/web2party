"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Vordefinierte DJ-Tags
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

interface Song {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  year: number | null;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  mood: string | null;
  tags: string | null;
  mp3Path: string | null;
  notes: string | null;
}

export default function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [song, setSong] = useState<Song | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/music/${id}`)
      .then((r) => r.json())
      .then((s) => {
        setSong(s);
        setCurrentFile(s.mp3Path);
        setSelectedTags(
          (s.tags || "")
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean),
        );
      })
      .finally(() => setLoadingData(false));
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/music/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.path) {
        setCurrentFile(data.path);
      }
    } catch {
      setError("Fehler beim Upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      artist: formData.get("artist") || null,
      album: formData.get("album") || null,
      year: formData.get("year")
        ? parseInt(formData.get("year") as string)
        : null,
      genre: formData.get("genre") || null,
      bpm: formData.get("bpm") ? parseInt(formData.get("bpm") as string) : null,
      key: formData.get("key") || null,
      mood: formData.get("mood") || null,
      tags: selectedTags.join(",") || null,
      notes: formData.get("notes") || null,
      mp3Path: currentFile,
    };

    try {
      const response = await fetch(`/api/music/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Fehler beim Speichern");
      }

      router.push(`/dashboard/music/${id}`);
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
  if (!song)
    return (
      <div className="text-center py-12 text-gray-400">Nicht gefunden</div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/music/${id}`}
          className="p-2 hover:bg-gray-800 rounded-lg transition">
          ← Zurück
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Song bearbeiten</h1>
          <p className="text-gray-400">{song.title}</p>
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
            🎵 Song-Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Titel *
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={song.title}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Künstler
              </label>
              <input
                type="text"
                name="artist"
                defaultValue={song.artist || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Album
              </label>
              <input
                type="text"
                name="album"
                defaultValue={song.album || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Jahr
              </label>
              <input
                type="number"
                name="year"
                defaultValue={song.year || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genre
              </label>
              <input
                type="text"
                name="genre"
                defaultValue={song.genre || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🎧 DJ-Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                BPM
              </label>
              <input
                type="number"
                name="bpm"
                defaultValue={song.bpm || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Key (Tonart)
              </label>
              <input
                type="text"
                name="key"
                defaultValue={song.key || ""}
                placeholder="z.B. Am, C, F#m"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stimmung
              </label>
              <select
                name="mood"
                defaultValue={song.mood || ""}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Auswählen...</option>
                <option value="Party">🎉 Party</option>
                <option value="Chill">😎 Chill</option>
                <option value="Romantisch">💕 Romantisch</option>
                <option value="Energetisch">⚡ Energetisch</option>
                <option value="Melancholisch">😢 Melancholisch</option>
                <option value="Happy">😊 Happy</option>
              </select>
            </div>
          </div>

          {/* Tags Section */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              🏷️ Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {DJ_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter((t) => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    selectedTags.includes(tag)
                      ? "bg-yellow-500 text-gray-900 font-medium"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="mt-3 text-sm text-gray-400">
                Ausgewählt: {selectedTags.join(", ")}
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            📁 MP3-Datei
          </h2>
          {currentFile && (
            <div className="mb-4 p-3 bg-green-600/20 border border-green-600 rounded-lg">
              <p className="text-green-400">✓ MP3-Datei vorhanden</p>
              <audio controls className="mt-2 w-full">
                <source src={currentFile} type="audio/mpeg" />
              </audio>
            </div>
          )}
          <input
            type="file"
            accept="audio/mpeg,audio/mp3"
            onChange={handleFileUpload}
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer"
          />
          {uploading && <p className="text-purple-400 mt-2">Uploading...</p>}
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📝 Notizen</h2>
          <textarea
            name="notes"
            rows={3}
            defaultValue={song.notes || ""}
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50">
            {loading ? "Speichern..." : "Änderungen speichern"}
          </button>
          <Link
            href={`/dashboard/music/${id}`}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewSongPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mp3File, setMp3File] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    // Song-Daten
    const songData = {
      title: formData.get("title"),
      artist: formData.get("artist"),
      album: formData.get("album") || null,
      bpm: formData.get("bpm") ? parseInt(formData.get("bpm") as string) : null,
      key: formData.get("key") || null,
      genre: formData.get("genre") || null,
      mood: formData.get("mood") || null,
      year: formData.get("year")
        ? parseInt(formData.get("year") as string)
        : null,
      duration: formData.get("duration")
        ? parseInt(formData.get("duration") as string) * 60
        : null,
      notes: formData.get("notes") || null,
    };

    try {
      // Erst Song erstellen
      const response = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(songData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Fehler beim Speichern");
      }

      const song = await response.json();

      // Wenn MP3-Datei vorhanden, hochladen
      if (mp3File) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", mp3File);
        uploadFormData.append("songId", song.id);

        const uploadResponse = await fetch("/api/music/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          console.error("MP3 Upload fehlgeschlagen");
        }
      }

      router.push("/dashboard/music");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/music"
          className="p-2 hover:bg-gray-800 rounded-lg transition">
          ← Zurück
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Neuer Song</h1>
          <p className="text-gray-400">
            Füge einen neuen Song zur Bibliothek hinzu
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Basis-Informationen */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🎵 Song-Informationen
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
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Künstler *
              </label>
              <input
                type="text"
                name="artist"
                required
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
                min="1900"
                max="2099"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Technische Details */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🎛️ Technische Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                BPM
              </label>
              <input
                type="number"
                name="bpm"
                min="60"
                max="200"
                placeholder="128"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tonart
              </label>
              <select
                name="key"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Auswählen...</option>
                <option value="C">C</option>
                <option value="C#">C#</option>
                <option value="D">D</option>
                <option value="D#">D#</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="F#">F#</option>
                <option value="G">G</option>
                <option value="G#">G#</option>
                <option value="A">A</option>
                <option value="A#">A#</option>
                <option value="B">B</option>
                <option value="Cm">Cm</option>
                <option value="Dm">Dm</option>
                <option value="Em">Em</option>
                <option value="Fm">Fm</option>
                <option value="Gm">Gm</option>
                <option value="Am">Am</option>
                <option value="Bm">Bm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Dauer (Minuten)
              </label>
              <input
                type="number"
                name="duration"
                min="1"
                max="60"
                placeholder="4"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genre
              </label>
              <select
                name="genre"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Auswählen...</option>
                <option value="House">House</option>
                <option value="Techno">Techno</option>
                <option value="Tech-House">Tech-House</option>
                <option value="Deep House">Deep House</option>
                <option value="EDM">EDM</option>
                <option value="Hip-Hop">Hip-Hop</option>
                <option value="R&B">R&B</option>
                <option value="Pop">Pop</option>
                <option value="Rock">Rock</option>
                <option value="80er">80er</option>
                <option value="90er">90er</option>
                <option value="Schlager">Schlager</option>
                <option value="Charts">Charts</option>
                <option value="Latin">Latin</option>
                <option value="Reggaeton">Reggaeton</option>
                <option value="Sonstiges">Sonstiges</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stimmung */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🎭 Stimmung</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Party",
              "Chill",
              "Romantisch",
              "Energetisch",
              "Melancholisch",
              "Happy",
              "Club",
              "Sommer",
            ].map((mood) => (
              <label
                key={mood}
                className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mood"
                  value={mood}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500"
                />
                <span className="text-gray-300">{mood}</span>
              </label>
            ))}
          </div>
        </div>

        {/* MP3 Upload */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            📁 MP3-Datei (optional)
          </h2>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            {mp3File ? (
              <div className="space-y-2">
                <p className="text-green-400">✓ {mp3File.name}</p>
                <p className="text-gray-400 text-sm">
                  {(mp3File.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={() => setMp3File(null)}
                  className="text-red-400 hover:text-red-300 text-sm">
                  Entfernen
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3"
                  onChange={(e) => setMp3File(e.target.files?.[0] || null)}
                  className="hidden"
                  id="mp3-upload"
                />
                <label
                  htmlFor="mp3-upload"
                  className="cursor-pointer text-gray-400 hover:text-white">
                  <span className="text-4xl">🎵</span>
                  <p className="mt-2">
                    Klicke hier oder ziehe eine MP3-Datei hierher
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Du kannst den Song auch ohne MP3 hinzufügen
                  </p>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Notizen */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📝 Notizen</h2>
          <textarea
            name="notes"
            rows={3}
            placeholder="Zusätzliche Informationen zum Song..."
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50">
            {loading ? "Speichern..." : "Song speichern"}
          </button>
          <Link
            href="/dashboard/music"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamischer Import für Waveform (nur Client-Side)
const WaveformWithCuePoints = dynamic(
  () => import("@/components/WaveformWithCuePoints"),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 bg-gray-800/50 rounded-lg animate-pulse" />
    ),
  },
);

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
  duration: number | null;
  tags: string | null;
  mp3Path: string | null;
  notes: string | null;
  createdAt: string;
}

interface HarmonicSuggestion {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  bpm: number | null;
  genre: string | null;
  camelot: string;
  keyScore: number;
  bpmScore: number;
  totalScore: number;
  bpmDiff: number | null;
}

interface HarmonicMixingResponse {
  referenceKey: string;
  referenceCamelot: string;
  referenceBpm: number | null;
  compatibleCodes: string[];
  suggestions: HarmonicSuggestion[];
  totalCompatible: number;
}

export default function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [harmonicSuggestions, setHarmonicSuggestions] =
    useState<HarmonicMixingResponse | null>(null);
  const [loadingHarmonic, setLoadingHarmonic] = useState(false);
  const [showHarmonic, setShowHarmonic] = useState(false);

  useEffect(() => {
    fetch(`/api/music/${id}`)
      .then((r) => r.json())
      .then(setSong)
      .finally(() => setLoading(false));
  }, [id]);

  // Lade Harmonic Mixing Vorschläge wenn angefordert
  const loadHarmonicSuggestions = async () => {
    if (!song?.key) return;
    setLoadingHarmonic(true);
    try {
      const response = await fetch(
        `/api/music/harmonic-mixing?songId=${id}&limit=10`,
      );
      if (response.ok) {
        const data = await response.json();
        setHarmonicSuggestions(data);
      }
    } catch (error) {
      console.error("Error loading harmonic suggestions:", error);
    } finally {
      setLoadingHarmonic(false);
    }
  };

  const handleToggleHarmonic = () => {
    if (!showHarmonic && !harmonicSuggestions) {
      loadHarmonicSuggestions();
    }
    setShowHarmonic(!showHarmonic);
  };

  const handleDelete = async () => {
    if (!confirm("Song wirklich löschen?")) return;
    await fetch(`/api/music/${id}`, { method: "DELETE" });
    router.push("/dashboard/music");
  };

  if (loading)
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  if (!song)
    return (
      <div className="text-center py-12 text-gray-400">Nicht gefunden</div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/music"
            className="p-2 hover:bg-gray-800 rounded-lg transition">
            ← Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{song.title}</h1>
            <p className="text-gray-400">
              {song.artist || "Unbekannter Künstler"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/music/${id}/edit`}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
            Bearbeiten
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
            Löschen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🎵 Song-Details
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-gray-400 text-sm">Album</dt>
              <dd className="text-white">{song.album || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">Jahr</dt>
              <dd className="text-white">{song.year || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">Genre</dt>
              <dd className="text-white">{song.genre || "-"}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🎧 DJ-Info</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-gray-400 text-sm">BPM</dt>
              <dd className="text-white text-2xl font-bold">
                {song.bpm || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">Tonart (Key)</dt>
              <dd className="text-white text-lg font-semibold">
                {song.key || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-sm">Stimmung</dt>
              <dd className="text-white">{song.mood || "-"}</dd>
            </div>
            {song.duration && (
              <div>
                <dt className="text-gray-400 text-sm">Dauer</dt>
                <dd className="text-white">
                  {Math.floor(song.duration / 60)}:
                  {String(song.duration % 60).padStart(2, "0")}
                </dd>
              </div>
            )}
            {song.tags && (
              <div>
                <dt className="text-gray-400 text-sm">Tags</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {song.tags.split(",").map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-yellow-600/30 text-yellow-300 text-xs rounded">
                      {tag.trim()}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Harmonic Mixing Button */}
      {song.key && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              🎹 Harmonic Mixing
            </h2>
            <button
              onClick={handleToggleHarmonic}
              className={`px-4 py-2 rounded-lg transition ${
                showHarmonic
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}>
              {loadingHarmonic
                ? "Laden..."
                : showHarmonic
                  ? "Ausblenden"
                  : "Kompatible Songs zeigen"}
            </button>
          </div>

          {showHarmonic && harmonicSuggestions && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>
                  Camelot:{" "}
                  <span className="text-purple-400 font-bold">
                    {harmonicSuggestions.referenceCamelot}
                  </span>
                </span>
                <span>
                  Kompatible Codes:{" "}
                  {harmonicSuggestions.compatibleCodes.join(", ")}
                </span>
                <span>
                  {harmonicSuggestions.totalCompatible} Songs gefunden
                </span>
              </div>

              {harmonicSuggestions.suggestions.length > 0 ? (
                <div className="divide-y divide-gray-700">
                  {harmonicSuggestions.suggestions.map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      href={`/dashboard/music/${suggestion.id}`}
                      className="flex items-center justify-between py-3 hover:bg-gray-700/50 px-2 rounded transition">
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            suggestion.totalScore >= 5
                              ? "bg-green-600"
                              : suggestion.totalScore >= 3
                                ? "bg-yellow-600"
                                : "bg-gray-600"
                          }`}>
                          {suggestion.camelot}
                        </span>
                        <div>
                          <p className="text-white font-medium">
                            {suggestion.title}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {suggestion.artist}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {suggestion.bpm && (
                          <span className="text-gray-400">
                            {suggestion.bpm} BPM
                            {suggestion.bpmDiff !== null &&
                              suggestion.bpmDiff > 0 && (
                                <span
                                  className={
                                    suggestion.bpmDiff <= 4
                                      ? "text-green-400 ml-1"
                                      : "text-yellow-400 ml-1"
                                  }>
                                  (±{suggestion.bpmDiff})
                                </span>
                              )}
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            suggestion.keyScore === 3
                              ? "bg-green-600/30 text-green-300"
                              : suggestion.keyScore === 2
                                ? "bg-blue-600/30 text-blue-300"
                                : "bg-purple-600/30 text-purple-300"
                          }`}>
                          {suggestion.keyScore === 3
                            ? "Perfekt"
                            : suggestion.keyScore === 2
                              ? "Nachbar"
                              : "Parallel"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  Keine kompatiblen Songs gefunden. Füge mehr Songs mit Tonart
                  hinzu.
                </p>
              )}
            </div>
          )}

          {showHarmonic && !harmonicSuggestions && !loadingHarmonic && (
            <p className="text-gray-400 text-center py-4">
              Fehler beim Laden der Vorschläge.
            </p>
          )}
        </div>
      )}

      {song.mp3Path && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              🎵 Waveform & Cue-Points
            </h2>
            <a
              href={song.mp3Path}
              download
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm">
              ⬇️ Download
            </a>
          </div>
          <WaveformWithCuePoints
            src={song.mp3Path}
            songId={song.id}
            height={120}
            barColor="#4b5563"
            progressColor="#a855f7"
          />
        </div>
      )}

      {song.notes && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📝 Notizen</h2>
          <p className="text-white whitespace-pre-wrap">{song.notes}</p>
        </div>
      )}
    </div>
  );
}

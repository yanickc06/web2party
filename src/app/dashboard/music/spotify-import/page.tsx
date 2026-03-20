"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SpotifyTrack {
  title: string;
  artist: string;
  album: string | null;
  duration: number;
}

interface ImportResult {
  title: string;
  artist: string;
  success: boolean;
  songId?: string;
  error?: string;
  skipped?: boolean;
}

type Phase =
  | "idle"
  | "fetching"
  | "preview"
  | "importing"
  | "complete"
  | "error";

export default function SpotifyImportPage() {
  const router = useRouter();
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [playlistName, setPlaylistName] = useState("");
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const isValidUrl =
    playlistUrl.includes("spotify.com/playlist/") ||
    playlistUrl.includes("spotify:playlist:");

  // Schritt 1: Playlist-Tracks von Spotify laden
  const fetchPlaylist = async () => {
    if (!isValidUrl) return;
    setPhase("fetching");
    setErrorMsg("");

    try {
      const res = await fetch("/api/music/spotify-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setPhase("error");
        setErrorMsg(data.error || "Fehler beim Laden der Playlist");
        return;
      }

      setPlaylistName(data.playlist_name);
      setTracks(data.tracks);
      setPhase("preview");
    } catch {
      setPhase("error");
      setErrorMsg("Netzwerkfehler - Server nicht erreichbar");
    }
  };

  // Schritt 2: Songs einzeln herunterladen & importieren
  const startImport = async () => {
    setPhase("importing");
    setResults([]);
    setCurrentTrack(0);

    const importResults: ImportResult[] = [];

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      setCurrentTrack(i + 1);

      try {
        const res = await fetch("/api/music/spotify-import/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(track),
        });

        const data = await res.json();

        importResults.push({
          title: track.title,
          artist: track.artist,
          success: data.success,
          songId: data.songId,
          error: data.error,
          skipped: data.skipped,
        });
      } catch {
        importResults.push({
          title: track.title,
          artist: track.artist,
          success: false,
          error: "Netzwerkfehler",
        });
      }

      setResults([...importResults]);
    }

    setPhase("complete");
  };

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const successCount = results.filter((r) => r.success).length;
  const skipCount = results.filter((r) => r.skipped).length;
  const failCount = results.filter((r) => !r.success && !r.skipped).length;
  const progress =
    tracks.length > 0 ? Math.round((currentTrack / tracks.length) * 100) : 0;

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
          <h1 className="text-2xl font-bold text-white">
            🎵 Spotify Playlist Import
          </h1>
          <p className="text-gray-400">
            Songs aus einer Spotify-Playlist herunterladen und importieren
          </p>
        </div>
      </div>

      {/* Schritt 1: URL eingeben */}
      {(phase === "idle" || phase === "error" || phase === "fetching") && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">
              Spotify Playlist-Link
            </label>
            <input
              type="url"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              disabled={phase === "fetching"}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none disabled:opacity-50"
            />
            {playlistUrl && !isValidUrl && (
              <p className="text-red-400 text-sm mt-2">
                Bitte einen gültigen Spotify-Playlist-Link eingeben
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          <button
            onClick={fetchPlaylist}
            disabled={!isValidUrl || phase === "fetching"}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
            {phase === "fetching"
              ? "⏳ Lade Playlist..."
              : "🔍 Playlist laden"}
          </button>

          <div className="text-gray-500 text-sm space-y-1">
            <p>
              💡 Die Songs werden via YouTube heruntergeladen und als MP3 in
              deine Bibliothek importiert.
            </p>
            <p>🔄 Duplikate werden automatisch erkannt und übersprungen.</p>
          </div>
        </div>
      )}

      {/* Schritt 2: Playlist-Vorschau */}
      {phase === "preview" && (
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {playlistName}
                </h2>
                <p className="text-gray-400">{tracks.length} Songs gefunden</p>
              </div>
              <button
                onClick={() => {
                  setPhase("idle");
                  setTracks([]);
                }}
                className="text-gray-400 hover:text-white text-sm">
                ← Andere Playlist
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-700 rounded-lg border border-gray-700">
              {tracks.map((track, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-gray-500 text-sm w-8 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{track.title}</p>
                    <p className="text-gray-400 text-sm truncate">
                      {track.artist}
                      {track.album && ` · ${track.album}`}
                    </p>
                  </div>
                  <span className="text-gray-500 text-sm">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={startImport}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold text-lg transition">
            🚀 {tracks.length} Songs importieren
          </button>

          <p className="text-gray-500 text-sm text-center">
            ⏱️ Jeder Song wird einzeln heruntergeladen – das dauert ca.{" "}
            {Math.ceil(tracks.length * 0.5)} - {tracks.length} Minuten
          </p>
        </div>
      )}

      {/* Schritt 3: Import-Fortschritt */}
      {phase === "importing" && (
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">
                📥 Importiere Song {currentTrack} von {tracks.length}
              </span>
              <span className="text-green-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {currentTrack > 0 && currentTrack <= tracks.length && (
              <p className="text-gray-400 text-sm truncate">
                🎵 {tracks[currentTrack - 1].artist} –{" "}
                {tracks[currentTrack - 1].title}
              </p>
            )}
          </div>

          {/* Live-Ergebnisse */}
          {results.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-white font-semibold text-sm">
                  ✅ {results.filter((r) => r.success).length} importiert · ⏭️{" "}
                  {results.filter((r) => r.skipped).length} übersprungen · ❌{" "}
                  {results.filter((r) => !r.success && !r.skipped).length}{" "}
                  fehlgeschlagen
                </h3>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-700">
                {[...results].reverse().map((result, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 flex items-center gap-2 text-sm">
                    <span>
                      {result.success
                        ? "✅"
                        : result.skipped
                          ? "⏭️"
                          : "❌"}
                    </span>
                    <span className="text-gray-300 truncate flex-1">
                      {result.artist} – {result.title}
                    </span>
                    {result.error && (
                      <span className="text-red-400 text-xs truncate max-w-48">
                        {result.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schritt 4: Ergebnis */}
      {phase === "complete" && (
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-2">
              ✅ Import abgeschlossen
            </h2>
            <p className="text-gray-400 mb-4">
              Playlist:{" "}
              <span className="text-white">{playlistName}</span>
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-400">
                  {successCount}
                </p>
                <p className="text-gray-400 text-sm">Importiert</p>
              </div>
              <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">
                  {skipCount}
                </p>
                <p className="text-gray-400 text-sm">Duplikate</p>
              </div>
              <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-red-400">{failCount}</p>
                <p className="text-gray-400 text-sm">Fehlgeschlagen</p>
              </div>
            </div>
          </div>

          {/* Track-Liste */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">
                Ergebnisse ({results.length} Tracks)
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-700">
              {results.map((result, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xl">
                    {result.success
                      ? "✅"
                      : result.skipped
                        ? "⏭️"
                        : "❌"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">
                      {result.artist} – {result.title}
                    </p>
                    {result.error && (
                      <p className="text-red-400 text-xs truncate">
                        {result.error}
                      </p>
                    )}
                  </div>
                  {result.success && result.songId && (
                    <Link
                      href={`/dashboard/music/${result.songId}`}
                      className="text-purple-400 hover:text-purple-300 text-sm whitespace-nowrap">
                      Öffnen →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Aktionen */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard/music")}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
              📚 Zur Musikbibliothek
            </button>
            <button
              onClick={() => {
                setPhase("idle");
                setPlaylistUrl("");
                setTracks([]);
                setResults([]);
              }}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition">
              🔄 Weitere Playlist importieren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

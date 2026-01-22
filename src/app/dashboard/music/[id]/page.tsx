"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Song {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  year: number | null;
  genre: string | null;
  bpm: number | null;
  mood: string | null;
  mp3Path: string | null;
  notes: string | null;
  createdAt: string;
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

  useEffect(() => {
    fetch(`/api/music/${id}`)
      .then((r) => r.json())
      .then(setSong)
      .finally(() => setLoading(false));
  }, [id]);

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
              <dt className="text-gray-400 text-sm">Stimmung</dt>
              <dd className="text-white">{song.mood || "-"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {song.mp3Path && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🎵 MP3-Datei
          </h2>
          <div className="flex items-center gap-4">
            <audio controls className="flex-1">
              <source src={song.mp3Path} type="audio/mpeg" />
            </audio>
            <a
              href={song.mp3Path}
              download
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
              ⬇️ Download
            </a>
          </div>
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

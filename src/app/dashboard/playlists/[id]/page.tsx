"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  songs: {
    song: {
      id: string;
      title: string;
      artist: string | null;
      filePath: string | null;
      bpm: number | null;
    };
  }[];
  parties: { id: string; name: string; date: string }[];
}

export default function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/playlists/${id}`)
      .then((r) => r.json())
      .then(setPlaylist)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Playlist wirklich löschen?")) return;
    await fetch(`/api/playlists/${id}`, { method: "DELETE" });
    router.push("/dashboard/playlists");
  };

  const handleDownload = async () => {
    const res = await fetch(`/api/playlists/${id}?download=mp3`);
    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }
    // Download each file
    for (const file of data.files) {
      const link = document.createElement("a");
      link.href = file.path;
      link.download = `${file.artist || "Unknown"} - ${file.title}.mp3`;
      link.click();
    }
  };

  if (loading)
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  if (!playlist)
    return (
      <div className="text-center py-12 text-gray-400">Nicht gefunden</div>
    );

  const songsWithMp3 = playlist.songs.filter((s) => s.song.filePath).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/playlists"
            className="p-2 hover:bg-gray-800 rounded-lg transition">
            ← Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{playlist.name}</h1>
            <p className="text-gray-400">{playlist.songs.length} Songs</p>
          </div>
        </div>
        <div className="flex gap-2">
          {songsWithMp3 > 0 && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
              ⬇️ MP3s laden ({songsWithMp3})
            </button>
          )}
          <Link
            href={`/dashboard/playlists/${id}/edit`}
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

      {playlist.description && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <p className="text-gray-300">{playlist.description}</p>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">🎶 Songs</h2>
        {playlist.songs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Keine Songs in dieser Playlist
          </p>
        ) : (
          <div className="space-y-2">
            {playlist.songs.map((ps, idx) => (
              <div
                key={ps.song.id}
                className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg">
                <span className="text-gray-500 w-8">{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-white font-medium">{ps.song.title}</p>
                  <p className="text-gray-400 text-sm">
                    {ps.song.artist || "Unbekannt"}
                  </p>
                </div>
                {ps.song.bpm && (
                  <span className="text-gray-400 text-sm">
                    {ps.song.bpm} BPM
                  </span>
                )}
                {ps.song.filePath ? (
                  <span className="text-green-400 text-sm">🎵 MP3</span>
                ) : (
                  <span className="text-gray-500 text-sm">Keine Datei</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {playlist.parties.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🎉 Verwendet bei
          </h2>
          <div className="space-y-2">
            {playlist.parties.map((party) => (
              <Link
                key={party.id}
                href={`/dashboard/parties/${party.id}`}
                className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition">
                <span className="text-white">{party.name}</span>
                <span className="text-gray-400 text-sm ml-2">
                  {new Date(party.date).toLocaleDateString("de-DE")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

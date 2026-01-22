import Link from "next/link";
import prisma from "@/lib/prisma";

interface PlaylistSong {
  song: { duration: number | null; mp3Path: string | null };
}

interface PlaylistWithSongs {
  id: string;
  name: string;
  description: string | null;
  songs: PlaylistSong[];
  _count: { parties: number };
}

async function getPlaylists() {
  return prisma.playlist.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      songs: {
        include: {
          song: true,
        },
        orderBy: { position: "asc" },
      },
      _count: {
        select: { parties: true },
      },
    },
  });
}

export default async function PlaylistsPage() {
  const playlists = await getPlaylists();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📋 Playlists</h1>
          <p className="text-gray-400 mt-1">
            {playlists.length} Playlists erstellt
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/playlists/smart"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition flex items-center gap-2">
            <span>🎯</span> Smart-Playlist
          </Link>
          <Link
            href="/dashboard/playlists/new"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2">
            <span>+</span> Neue Playlist
          </Link>
        </div>
      </div>

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
          <span className="text-6xl">📋</span>
          <p className="text-gray-400 mt-4">Noch keine Playlists erstellt</p>
          <Link
            href="/dashboard/playlists/new"
            className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
            Erste Playlist erstellen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist: PlaylistWithSongs) => {
            const totalDuration = playlist.songs.reduce(
              (acc: number, ps: PlaylistSong) => acc + (ps.song.duration || 0),
              0,
            );
            const hours = Math.floor(totalDuration / 3600);
            const minutes = Math.floor((totalDuration % 3600) / 60);
            const mp3Count = playlist.songs.filter(
              (ps: PlaylistSong) => ps.song.mp3Path,
            ).length;

            return (
              <Link
                key={playlist.id}
                href={`/dashboard/playlists/${playlist.id}`}
                className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 hover:border-purple-500/50 transition group">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-purple-300 transition">
                      {playlist.name}
                    </h3>
                    {playlist.description && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                        {playlist.description}
                      </p>
                    )}
                  </div>
                  <span className="text-3xl">🎵</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-gray-500">Songs</p>
                    <p className="text-white font-semibold">
                      {playlist.songs.length}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-gray-500">Dauer</p>
                    <p className="text-white font-semibold">
                      {hours > 0 ? `${hours}h ` : ""}
                      {minutes}min
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {mp3Count}/{playlist.songs.length} MP3s verfügbar
                  </span>
                  {mp3Count === playlist.songs.length &&
                    playlist.songs.length > 0 && (
                      <span className="text-green-400">⬇️ Download bereit</span>
                    )}
                </div>

                {playlist._count.parties > 0 && (
                  <div className="mt-2 text-sm text-purple-400">
                    🎉 {playlist._count.parties} Partys
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

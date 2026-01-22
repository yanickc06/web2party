import Link from "next/link";
import prisma from "@/lib/prisma";

interface SongWithCount {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  filePath: string | null;
  _count: { playlistSongs: number };
}

async function getSongs() {
  return prisma.song.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { playlistSongs: true },
      },
    },
  });
}

export default async function MusicPage() {
  const songs = await getSongs();

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
        <Link
          href="/dashboard/music/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2">
          <span>+</span> Song hinzufügen
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="search"
          placeholder="Songs suchen..."
          className="flex-1 min-w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <select className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="">Alle Genres</option>
          <option value="house">House</option>
          <option value="techno">Techno</option>
          <option value="hiphop">Hip-Hop</option>
          <option value="pop">Pop</option>
          <option value="rock">Rock</option>
          <option value="80s">80er</option>
          <option value="90s">90er</option>
        </select>
        <select className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="">Alle Stimmungen</option>
          <option value="party">Party</option>
          <option value="chill">Chill</option>
          <option value="romantic">Romantisch</option>
          <option value="energetic">Energetisch</option>
        </select>
      </div>

      {/* Songs Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        {songs.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-6xl">🎵</span>
            <p className="text-gray-400 mt-4">Noch keine Songs vorhanden</p>
            <Link
              href="/dashboard/music/new"
              className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
              Ersten Song hinzufügen
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
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
              {songs.map((song: SongWithCount) => (
                <tr key={song.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{song.title}</p>
                    <p className="text-sm text-gray-400">{song.artist}</p>
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
                    {song.filePath ? (
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

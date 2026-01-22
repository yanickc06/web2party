"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  songs: {
    song: {
      id: string;
      title: string;
      artist: string | null;
      mp3Path: string | null;
      bpm: number | null;
      key: string | null;
      duration: number | null;
      genre: string | null;
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
    // ZIP-Download starten
    try {
      const link = document.createElement("a");
      link.href = `/api/playlists/${id}/download`;
      link.download = `${playlist?.name || "playlist"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      alert("Fehler beim Download");
    }
  };

  const handlePrint = () => {
    if (!playlist) return;

    // Erstelle PDF mit jsPDF
    const doc = new jsPDF();

    // Titel
    doc.setFontSize(20);
    doc.text(playlist.name, 14, 20);

    // Beschreibung
    if (playlist.description) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(playlist.description, 14, 28);
      doc.setTextColor(0);
    }

    // Datum
    doc.setFontSize(10);
    doc.text(
      `Erstellt am: ${new Date().toLocaleDateString("de-DE")}`,
      14,
      playlist.description ? 35 : 28,
    );

    // Hilfsfunktion für Dauer-Formatierung
    const formatDuration = (seconds: number | null) => {
      if (!seconds) return "-";
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Tabelle mit Songs
    const tableData = playlist.songs.map((ps, index) => [
      (index + 1).toString(),
      ps.song.title,
      ps.song.artist || "-",
      ps.song.bpm?.toString() || "-",
      ps.song.key || "-",
      formatDuration(ps.song.duration),
      ps.song.genre || "-",
    ]);

    autoTable(doc, {
      startY: playlist.description ? 42 : 35,
      head: [["#", "Titel", "Künstler", "BPM", "Key", "Dauer", "Genre"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [147, 51, 234], // Purple-600
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 10 }, // #
        1: { cellWidth: 50 }, // Titel
        2: { cellWidth: 40 }, // Künstler
        3: { cellWidth: 15 }, // BPM
        4: { cellWidth: 15 }, // Key
        5: { cellWidth: 15 }, // Dauer
        6: { cellWidth: 30 }, // Genre
      },
    });

    // Gesamtdauer berechnen
    const totalSeconds = playlist.songs.reduce(
      (acc, ps) => acc + (ps.song.duration || 0),
      0,
    );
    const totalMins = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMins / 60);
    const remainingMins = totalMins % 60;

    // Footer
    const finalY =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 10;
    doc.setFontSize(10);
    doc.text(
      `Gesamt: ${playlist.songs.length} Songs | Dauer: ${totalHours > 0 ? `${totalHours}h ` : ""}${remainingMins}min`,
      14,
      finalY,
    );

    // Download
    doc.save(`${playlist.name.replace(/[^a-zA-Z0-9]/g, "_")}_Playlist.pdf`);
  };

  if (loading)
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  if (!playlist)
    return (
      <div className="text-center py-12 text-gray-400">Nicht gefunden</div>
    );

  const songsWithMp3 = playlist.songs.filter((s) => s.song.mp3Path).length;

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
        <div className="flex gap-2 print:hidden">
          {songsWithMp3 > 0 && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
              📦 ZIP Download ({songsWithMp3})
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
            📄 PDF Export
          </button>
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
                {ps.song.mp3Path ? (
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

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .bg-gray-800\\/50,
          .bg-gray-700\\/30,
          .bg-gray-700\\/50 {
            background: white !important;
            border: 1px solid #ddd !important;
          }
          * {
            color: black !important;
          }
          .text-gray-400,
          .text-gray-500 {
            color: #666 !important;
          }
          a {
            text-decoration: none !important;
          }
        }
      `}</style>
    </div>
  );
}

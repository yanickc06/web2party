"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";

interface MusicRequest {
  id: string;
  songTitle: string;
  artist: string | null;
  guestName: string | null;
  status: string;
  createdAt: string;
}

interface QRCodeData {
  code: string;
  url: string;
  qrCode: string;
}

interface Party {
  id: string;
  name: string;
  date: string;
  requestCode: string | null;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-600/20 text-yellow-400",
  PLAYED: "bg-green-600/20 text-green-400",
  DECLINED: "bg-red-600/20 text-red-400",
};

export default function MusicRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [party, setParty] = useState<Party | null>(null);
  const [requests, setRequests] = useState<MusicRequest[]>([]);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadRequests = useCallback(async () => {
    const res = await fetch(`/api/parties/${id}/requests`);
    if (res.ok) setRequests(await res.json());
  }, [id]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/parties/${id}`).then((r) => r.json()),
      fetch(`/api/parties/${id}/requests`).then((r) => r.json()),
    ]).then(([partyData, requestsData]) => {
      setParty(partyData);
      setRequests(requestsData);
      setLoading(false);
    });
  }, [id]);

  const generateQRCode = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/parties/${id}/qrcode`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setQrData(data);
      }
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (requestId: string, status: string) => {
    await fetch(`/api/parties/${id}/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadRequests();
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm("Wunsch wirklich löschen?")) return;
    await fetch(`/api/parties/${id}/requests/${requestId}`, {
      method: "DELETE",
    });
    loadRequests();
  };

  const printQR = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && qrData) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Musikwunsch QR-Code</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 40px; }
              h1 { margin-bottom: 20px; }
              img { max-width: 300px; margin: 20px 0; }
              p { color: #666; }
              .url { font-family: monospace; font-size: 14px; color: #333; }
            </style>
          </head>
          <body>
            <h1>🎵 Musikwunsch</h1>
            <h2>${party?.name || ""}</h2>
            <img src="${qrData.qrCode}" alt="QR Code" />
            <p>Scanne den Code und wünsche dir deinen Song!</p>
            <p class="url">${qrData.url}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  }

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const playedRequests = requests.filter((r) => r.status === "PLAYED");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/parties/${id}`}
            className="p-2 hover:bg-gray-800 rounded-lg transition">
            ← Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">🎵 Musikwünsche</h1>
            <p className="text-gray-400">{party?.name}</p>
          </div>
        </div>
        <button
          onClick={generateQRCode}
          disabled={generating}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50">
          {generating ? "Generiert..." : "🔗 QR-Code generieren"}
        </button>
      </div>

      {/* QR Code Display */}
      {qrData && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white p-4 rounded-xl">
              <img src={qrData.qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-white font-semibold text-lg mb-2">
                Musikwunsch-Link
              </h3>
              <p className="text-purple-400 font-mono text-sm mb-4 break-all">
                {qrData.url}
              </p>
              <div className="flex gap-2 justify-center md:justify-start">
                <button
                  onClick={() => navigator.clipboard.writeText(qrData.url)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
                  📋 Link kopieren
                </button>
                <button
                  onClick={printQR}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
                  🖨️ Drucken
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">
            {pendingRequests.length}
          </p>
          <p className="text-gray-400">Ausstehend</p>
        </div>
        <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400">
            {playedRequests.length}
          </p>
          <p className="text-gray-400">Gespielt</p>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">
            Eingegangene Wünsche ({requests.length})
          </h2>
        </div>
        {requests.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Noch keine Musikwünsche eingegangen
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {requests.map((req) => (
              <div
                key={req.id}
                className={`p-4 flex items-center gap-4 ${
                  req.status === "PLAYED" ? "opacity-50" : ""
                }`}>
                <div className="text-3xl">🎵</div>
                <div className="flex-1">
                  <p className="text-white font-medium">{req.songTitle}</p>
                  {req.artist && (
                    <p className="text-gray-400 text-sm">{req.artist}</p>
                  )}
                  {req.guestName && (
                    <p className="text-purple-400 text-sm">
                      von {req.guestName}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(req.createdAt).toLocaleString("de-DE")}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${statusColors[req.status] || ""}`}>
                  {req.status === "PENDING"
                    ? "⏳ Ausstehend"
                    : req.status === "PLAYED"
                      ? "✅ Gespielt"
                      : "❌ Abgelehnt"}
                </span>
                <div className="flex gap-1">
                  {req.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => updateStatus(req.id, "PLAYED")}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                        title="Als gespielt markieren">
                        ✓
                      </button>
                      <button
                        onClick={() => updateStatus(req.id, "DECLINED")}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        title="Ablehnen">
                        ✕
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteRequest(req.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                    title="Löschen">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

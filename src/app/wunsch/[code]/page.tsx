"use client";

import { useState, useEffect, use } from "react";

interface Party {
  id: string;
  name: string;
  date: string;
  musicRequests: Array<{
    songTitle: string;
    artist: string | null;
    guestName: string | null;
  }>;
}

export default function MusicRequestPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    fetch(`/api/public/wunsch/${code}`)
      .then((r) => {
        if (!r.ok) throw new Error("Party nicht gefunden");
        return r.json();
      })
      .then(setParty)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/public/wunsch/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songTitle, artist, guestName }),
      });

      if (!response.ok) throw new Error("Fehler beim Senden");

      setSuccess(true);
      setSongTitle("");
      setArtist("");

      // Nach 3 Sekunden zurücksetzen für neuen Wunsch
      setTimeout(() => setSuccess(false), 3000);

      // Party neu laden für aktuelle Wünsche
      const partyRes = await fetch(`/api/public/wunsch/${code}`);
      if (partyRes.ok) setParty(await partyRes.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Laden...</div>
      </div>
    );
  }

  if (error && !party) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-white mb-2">Nicht gefunden</h1>
          <p className="text-gray-400">
            Diese Party existiert nicht oder ist nicht aktiv.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-3xl font-bold text-white mb-2">Musikwunsch</h1>
          <p className="text-purple-300 text-lg">{party?.name}</p>
          {party?.date && (
            <p className="text-gray-400">
              {new Date(party.date).toLocaleDateString("de-DE", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-6 text-center">
            ✅ Dein Wunsch wurde gesendet!
          </div>
        )}

        {/* Request Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-700 p-6 space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Song / Titel *
            </label>
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="z.B. Blinding Lights"
              required
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Künstler
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="z.B. The Weeknd"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dein Name (optional)
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Dein Name"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !songTitle.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg transition disabled:opacity-50">
            {submitting ? "Wird gesendet..." : "🎵 Wunsch absenden"}
          </button>
        </form>

        {/* Recent Requests */}
        {party?.musicRequests && party.musicRequests.length > 0 && (
          <div className="bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-700 p-6">
            <h2 className="text-white font-semibold mb-4">Letzte Wünsche</h2>
            <div className="space-y-2">
              {party.musicRequests.map((req, idx) => (
                <div
                  key={idx}
                  className="bg-gray-700/30 rounded-lg p-3 flex items-center gap-3">
                  <span className="text-2xl">🎵</span>
                  <div>
                    <p className="text-white">{req.songTitle}</p>
                    {req.artist && (
                      <p className="text-gray-400 text-sm">{req.artist}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Powered by DJ Yanick 🎧
        </p>
      </div>
    </div>
  );
}

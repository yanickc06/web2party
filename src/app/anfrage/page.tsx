"use client";

import { useState } from "react";

export default function InquiryPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      eventName: formData.get("eventName"),
      eventType: formData.get("eventType"),
      date: formData.get("date"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      guestCount: formData.get("guestCount"),
      musicStyle: formData.get("musicStyle"),
      locationName: formData.get("locationName"),
      locationAddress: formData.get("locationAddress"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch("/api/public/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Fehler beim Senden");
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-700 p-12 text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Anfrage gesendet!
          </h1>
          <p className="text-gray-300">
            Vielen Dank für deine Anfrage! Ich melde mich so schnell wie möglich
            bei dir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎧 DJ Anfrage</h1>
          <p className="text-gray-300">
            Fülle das Formular aus und ich melde mich bei dir!
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-700 p-8 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Persönliche Daten */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              👤 Deine Daten
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vorname *
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nachname *
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  E-Mail *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Event-Details */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              🎉 Event-Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name der Veranstaltung *
                </label>
                <input
                  type="text"
                  name="eventName"
                  required
                  placeholder="z.B. Meine Geburtstagsfeier"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Art der Veranstaltung
                </label>
                <select
                  name="eventType"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Bitte wählen...</option>
                  <option value="birthday">Geburtstagsfeier</option>
                  <option value="wedding">Hochzeit</option>
                  <option value="corporate">Firmenfeier</option>
                  <option value="club">Club / Bar</option>
                  <option value="festival">Festival</option>
                  <option value="private">Private Party</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Erwartete Gäste
                </label>
                <input
                  type="number"
                  name="guestCount"
                  min="1"
                  placeholder="50"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Datum *
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Musikrichtung
                </label>
                <input
                  type="text"
                  name="musicStyle"
                  placeholder="z.B. House, 80er, Charts..."
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Von
                </label>
                <input
                  type="time"
                  name="startTime"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bis
                </label>
                <input
                  type="time"
                  name="endTime"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              📍 Location
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name der Location
                </label>
                <input
                  type="text"
                  name="locationName"
                  placeholder="z.B. Mein Garten, Club XY..."
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  name="locationAddress"
                  placeholder="Straße, PLZ Ort"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Nachricht */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nachricht / Besondere Wünsche
            </label>
            <textarea
              name="message"
              rows={4}
              placeholder="Erzähl mir mehr über dein Event..."
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg transition disabled:opacity-50">
            {loading ? "Wird gesendet..." : "🚀 Anfrage absenden"}
          </button>

          <p className="text-gray-500 text-sm text-center">
            Mit dem Absenden stimmst du zu, dass ich dich kontaktieren darf.
          </p>
        </form>
      </div>
    </div>
  );
}

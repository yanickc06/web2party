import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  // Wenn eingeloggt, direkt zum Dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🎧</span>
          <span className="text-2xl font-bold text-white">Web2Party</span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-6 py-2 text-white hover:text-purple-300 font-medium transition">
            Anmelden
          </Link>
          <Link
            href="/register"
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
            Registrieren
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Dein DJ-Business
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              professionell verwalten
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Kunden, Partys, Musik, Technik und mehr – alles an einem Ort. Plane
            deine Events effizient und behalte den Überblick.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition shadow-lg shadow-purple-500/25">
              Jetzt starten – Kostenlos
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold text-lg transition border border-gray-700">
              Ich habe schon einen Account
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "🎉",
              title: "Partymanager",
              desc: "Plane und verwalte alle deine Events an einem Ort",
            },
            {
              icon: "🎵",
              title: "Musikverwaltung",
              desc: "Organisiere deine Songs und erstelle perfekte Playlists",
            },
            {
              icon: "👥",
              title: "Kundenverwaltung",
              desc: "Behalte alle Kundeninformationen im Blick",
            },
            {
              icon: "🔊",
              title: "Technikverwaltung",
              desc: "Verwalte dein Equipment und Miet-Optionen",
            },
            {
              icon: "🤝",
              title: "Partnerverwaltung",
              desc: "Dokumentiere Vorteile bei deinen Partnern",
            },
            {
              icon: "📁",
              title: "Dateimanager",
              desc: "Speichere wichtige Dokumente und Dateien",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <span className="text-4xl">{feature.icon}</span>
              <h3 className="text-xl font-semibold text-white mt-4">
                {feature.title}
              </h3>
              <p className="text-gray-400 mt-2">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 border-t border-gray-800">
        <p>© 2026 Web2Party – Für DJs, von DJs 🎧</p>
      </footer>
    </div>
  );
}

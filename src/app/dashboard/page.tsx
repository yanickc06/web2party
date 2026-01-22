import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface UpcomingParty {
  id: string;
  name: string;
  date: Date;
  startTime: string | null;
  status: string;
  customer: { firstName: string; lastName: string } | null;
  location: { name: string } | null;
}

async function getStats() {
  const [partyCount, customerCount, songCount, equipmentCount] =
    await Promise.all([
      prisma.party.count(),
      prisma.customer.count(),
      prisma.song.count(),
      prisma.equipment.count(),
    ]);

  const upcomingParties = await prisma.party.findMany({
    where: {
      date: { gte: new Date() },
      status: { in: ["PLANNED", "CONFIRMED"] },
    },
    include: {
      customer: true,
      location: true,
    },
    orderBy: { date: "asc" },
    take: 5,
  });

  return {
    partyCount,
    customerCount,
    songCount,
    equipmentCount,
    upcomingParties,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getStats();

  const statCards = [
    {
      label: "Partys",
      value: stats.partyCount,
      icon: "🎉",
      color: "from-purple-500 to-pink-500",
    },
    {
      label: "Kunden",
      value: stats.customerCount,
      icon: "👥",
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Songs",
      value: stats.songCount,
      icon: "🎵",
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Geräte",
      value: stats.equipmentCount,
      icon: "🔊",
      color: "from-orange-500 to-yellow-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Willkommen zurück, {session?.user?.name}! 👋
        </h1>
        <p className="text-gray-400 mt-1">Hier ist dein Überblick für heute</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Parties */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            📅 Anstehende Partys
          </h2>
        </div>
        <div className="p-6">
          {stats.upcomingParties.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Keine anstehenden Partys. Zeit, neue Events zu planen! 🎵
            </p>
          ) : (
            <div className="space-y-4">
              {stats.upcomingParties.map((party: UpcomingParty) => (
                <div
                  key={party.id}
                  className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center text-2xl">
                      🎉
                    </div>
                    <div>
                      <p className="font-medium text-white">{party.name}</p>
                      <p className="text-sm text-gray-400">
                        {party.customer?.firstName} {party.customer?.lastName}
                        {party.location && ` • ${party.location.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {new Date(party.date).toLocaleDateString("de-DE", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        party.status === "CONFIRMED"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                      {party.status === "CONFIRMED" ? "Bestätigt" : "Geplant"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/dashboard/parties/new"
          className="p-6 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30 hover:border-purple-500/60 transition group">
          <span className="text-3xl">➕</span>
          <h3 className="text-lg font-semibold text-white mt-3 group-hover:text-purple-300">
            Neue Party erstellen
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Plane dein nächstes Event
          </p>
        </a>

        <a
          href="/dashboard/customers/new"
          className="p-6 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/30 hover:border-blue-500/60 transition group">
          <span className="text-3xl">👤</span>
          <h3 className="text-lg font-semibold text-white mt-3 group-hover:text-blue-300">
            Neuer Kunde
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Füge einen neuen Kunden hinzu
          </p>
        </a>

        <a
          href="/dashboard/music/new"
          className="p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl border border-green-500/30 hover:border-green-500/60 transition group">
          <span className="text-3xl">🎵</span>
          <h3 className="text-lg font-semibold text-white mt-3 group-hover:text-green-300">
            Song hinzufügen
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Erweitere deine Musikbibliothek
          </p>
        </a>
      </div>
    </div>
  );
}

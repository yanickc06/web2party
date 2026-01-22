import Link from "next/link";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

interface PartyWithRelations {
  id: string;
  name: string;
  date: Date;
  status: string;
  guestCount: number | null;
  price: Decimal | null;
  deposit: Decimal | null;
  customer: { firstName: string; lastName: string } | null;
  location: { name: string } | null;
  playlist: { name: string } | null;
}

async function getParties() {
  return prisma.party.findMany({
    orderBy: { date: "desc" },
    include: {
      customer: true,
      location: true,
      playlist: true,
    },
  });
}

const statusLabels: Record<string, { label: string; color: string }> = {
  INQUIRY: { label: "📩 Anfrage", color: "bg-yellow-500/20 text-yellow-400" },
  CONFIRMED: { label: "✅ Bestätigt", color: "bg-green-500/20 text-green-400" },
  COMPLETED: {
    label: "🎊 Abgeschlossen",
    color: "bg-blue-500/20 text-blue-400",
  },
  CANCELLED: { label: "❌ Abgesagt", color: "bg-red-500/20 text-red-400" },
};

export default async function PartiesPage() {
  const parties = await getParties();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🎉 Partymanager</h1>
          <p className="text-gray-400 mt-1">{parties.length} Partys gesamt</p>
        </div>
        <Link
          href="/dashboard/parties/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2">
          <span>+</span> Neue Party
        </Link>
      </div>

      {/* Parties Grid */}
      {parties.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
          <span className="text-6xl">🎉</span>
          <p className="text-gray-400 mt-4">Noch keine Partys geplant</p>
          <Link
            href="/dashboard/parties/new"
            className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
            Erste Party planen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parties.map((party: PartyWithRelations) => (
            <Link
              key={party.id}
              href={`/dashboard/parties/${party.id}`}
              className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 hover:border-purple-500/50 transition group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-purple-300 transition">
                    {party.name}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date(party.date).toLocaleDateString("de-DE", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    statusLabels[party.status]?.color || ""
                  }`}>
                  {statusLabels[party.status]?.label || party.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {party.customer && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>👤</span>
                    <span>
                      {party.customer.firstName} {party.customer.lastName}
                    </span>
                  </div>
                )}
                {party.location && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>📍</span>
                    <span>{party.location.name}</span>
                  </div>
                )}
                {party.playlist && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>🎵</span>
                    <span>{party.playlist.name}</span>
                  </div>
                )}
                {party.guestCount && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>👥</span>
                    <span>{party.guestCount} Gäste</span>
                  </div>
                )}
              </div>

              {party.price && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-purple-400 font-semibold">
                    €{Number(party.price).toFixed(2)}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

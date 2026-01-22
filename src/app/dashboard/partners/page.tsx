import Link from "next/link";
import prisma from "@/lib/prisma";

interface PartnerWithCount {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  benefits: string | null;
  _count: { equipment: number };
}

async function getPartners() {
  return prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { equipment: true },
      },
    },
  });
}

export default async function PartnersPage() {
  const partners = await getPartners();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            🤝 Partnerverwaltung
          </h1>
          <p className="text-gray-400 mt-1">{partners.length} Partner gesamt</p>
        </div>
        <Link
          href="/dashboard/partners/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2">
          <span>+</span> Neuer Partner
        </Link>
      </div>

      {/* Partners Grid */}
      {partners.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
          <span className="text-6xl">🤝</span>
          <p className="text-gray-400 mt-4">Noch keine Partner angelegt</p>
          <Link
            href="/dashboard/partners/new"
            className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
            Ersten Partner anlegen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner: PartnerWithCount) => (
            <Link
              key={partner.id}
              href={`/dashboard/partners/${partner.id}`}
              className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 hover:border-purple-500/50 transition group">
              <h3 className="font-semibold text-white text-lg group-hover:text-purple-300 transition">
                {partner.name}
              </h3>

              <div className="mt-4 space-y-2 text-sm">
                {partner.contactPerson && (
                  <p className="text-gray-400">
                    <span className="text-gray-500">Kontakt:</span>{" "}
                    {partner.contactPerson}
                  </p>
                )}
                {partner.email && (
                  <p className="text-gray-400">
                    <span className="text-gray-500">E-Mail:</span>{" "}
                    {partner.email}
                  </p>
                )}
                {partner.phone && (
                  <p className="text-gray-400">
                    <span className="text-gray-500">Telefon:</span>{" "}
                    {partner.phone}
                  </p>
                )}
                {partner.website && (
                  <p className="text-blue-400 hover:text-blue-300">
                    {partner.website}
                  </p>
                )}
              </div>

              {partner.benefits && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-500 text-xs uppercase mb-1">
                    Vorteile
                  </p>
                  <p className="text-gray-300 text-sm">{partner.benefits}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  {partner._count.equipment} Geräte zur Miete
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import prisma from "@/lib/prisma";

interface LocationWithRelations {
  id: string;
  name: string;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  capacity: number | null;
  customer: { firstName: string; lastName: string } | null;
  _count: { parties: number };
}

async function getLocations() {
  return prisma.location.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      _count: {
        select: { parties: true },
      },
    },
  });
}

export default async function LocationsPage() {
  const locations = await getLocations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📍 Locations</h1>
          <p className="text-gray-400 mt-1">
            {locations.length} Locations gespeichert
          </p>
        </div>
        <Link
          href="/dashboard/locations/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2">
          <span>+</span> Neue Location
        </Link>
      </div>

      {/* Locations Grid */}
      {locations.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
          <span className="text-6xl">📍</span>
          <p className="text-gray-400 mt-4">Noch keine Locations angelegt</p>
          <Link
            href="/dashboard/locations/new"
            className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
            Erste Location anlegen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location: LocationWithRelations) => (
            <Link
              key={location.id}
              href={`/dashboard/locations/${location.id}`}
              className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 hover:border-purple-500/50 transition group">
              <h3 className="font-semibold text-white text-lg group-hover:text-purple-300 transition">
                {location.name}
              </h3>

              <div className="mt-4 space-y-2 text-sm">
                {location.street && (
                  <p className="text-gray-400">{location.street}</p>
                )}
                {(location.postalCode || location.city) && (
                  <p className="text-gray-400">
                    {location.postalCode} {location.city}
                  </p>
                )}
                {location.capacity && (
                  <p className="text-gray-400">
                    <span className="text-gray-500">Kapazität:</span>{" "}
                    {location.capacity} Personen
                  </p>
                )}
              </div>

              {location.customer && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-500 text-xs uppercase mb-1">Kunde</p>
                  <p className="text-gray-300">
                    {location.customer.firstName} {location.customer.lastName}
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-700">
                <span className="text-purple-400 text-sm">
                  🎉 {location._count.parties} Partys hier
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

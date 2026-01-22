import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import DeleteCustomerButton from "./DeleteButton";

interface CustomerParty {
  id: string;
  name: string;
  date: Date;
  location: { name: string } | null;
}

async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      locations: true,
      parties: {
        include: { location: true },
        orderBy: { date: "desc" },
        take: 5,
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: {
        select: { parties: true, invoices: true, locations: true },
      },
    },
  });

  return customer;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);

  if (!customer) {
    notFound();
  }

  const age = customer.birthDate
    ? Math.floor(
        (Date.now() - new Date(customer.birthDate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      )
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/customers"
            className="p-2 hover:bg-gray-800 rounded-lg transition">
            ← Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {customer.firstName} {customer.lastName}
            </h1>
            {customer.musicTaste && (
              <p className="text-purple-400">{customer.musicTaste}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/customers/${customer.id}/edit`}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
            ✏️ Bearbeiten
          </Link>
          <DeleteCustomerButton customerId={customer.id} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Partys</p>
          <p className="text-2xl font-bold text-white">
            {customer._count.parties}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Locations</p>
          <p className="text-2xl font-bold text-white">
            {customer._count.locations}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Rechnungen</p>
          <p className="text-2xl font-bold text-white">
            {customer._count.invoices}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Alter</p>
          <p className="text-2xl font-bold text-white">{age ?? "-"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kontaktdaten */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📞 Kontakt</h2>
          <div className="space-y-3">
            {customer.email && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500">E-Mail:</span>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-purple-400 hover:text-purple-300">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500">Telefon:</span>
                <a
                  href={`tel:${customer.phone}`}
                  className="text-purple-400 hover:text-purple-300">
                  {customer.phone}
                </a>
              </div>
            )}
            {(customer.street || customer.city) && (
              <div className="flex items-start gap-3">
                <span className="text-gray-500">Adresse:</span>
                <div className="text-gray-300">
                  {customer.street && <p>{customer.street}</p>}
                  <p>
                    {customer.postalCode} {customer.city}
                  </p>
                  {customer.country && customer.country !== "Deutschland" && (
                    <p>{customer.country}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bankdaten */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🏦 Bankdaten
          </h2>
          {customer.iban || customer.bankName ? (
            <div className="space-y-3">
              {customer.bankName && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">Bank:</span>
                  <span className="text-gray-300">{customer.bankName}</span>
                </div>
              )}
              {customer.iban && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">IBAN:</span>
                  <span className="text-gray-300 font-mono">
                    {customer.iban}
                  </span>
                </div>
              )}
              {customer.bic && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">BIC:</span>
                  <span className="text-gray-300 font-mono">
                    {customer.bic}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Keine Bankdaten hinterlegt</p>
          )}
        </div>

        {/* Letzte Partys */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              🎉 Letzte Partys
            </h2>
            <Link
              href={`/dashboard/parties/new?customer=${customer.id}`}
              className="text-sm text-purple-400 hover:text-purple-300">
              + Neue Party
            </Link>
          </div>
          {customer.parties.length === 0 ? (
            <p className="text-gray-500">Noch keine Partys</p>
          ) : (
            <div className="space-y-3">
              {customer.parties.map((party: CustomerParty) => (
                <Link
                  key={party.id}
                  href={`/dashboard/parties/${party.id}`}
                  className="block p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{party.name}</p>
                    <span className="text-sm text-gray-400">
                      {new Date(party.date).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                  {party.location && (
                    <p className="text-sm text-gray-500">
                      📍 {party.location.name}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notizen */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📝 Notizen</h2>
          {customer.notes ? (
            <p className="text-gray-300 whitespace-pre-wrap">
              {customer.notes}
            </p>
          ) : (
            <p className="text-gray-500">Keine Notizen</p>
          )}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import prisma from "@/lib/prisma";

interface CustomerWithCount {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  musicTaste: string | null;
  _count: { parties: number; invoices: number };
}

async function getCustomers() {
  return prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { parties: true, invoices: true },
      },
    },
  });
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">👥 Kundenverwaltung</h1>
          <p className="text-gray-400 mt-1">{customers.length} Kunden gesamt</p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2">
          <span>+</span> Neuer Kunde
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <input
          type="search"
          placeholder="Kunden suchen..."
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-6xl">👤</span>
            <p className="text-gray-400 mt-4">Noch keine Kunden vorhanden</p>
            <Link
              href="/dashboard/customers/new"
              className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
              Ersten Kunden anlegen
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Ort
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Partys
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {customers.map((customer: CustomerWithCount) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">
                      {customer.firstName} {customer.lastName}
                    </p>
                    {customer.musicTaste && (
                      <p className="text-sm text-gray-500">
                        {customer.musicTaste}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {customer.email && (
                      <p className="text-gray-300">{customer.email}</p>
                    )}
                    {customer.phone && (
                      <p className="text-gray-500 text-sm">{customer.phone}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {customer.city || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-purple-400">
                      {customer._count.parties}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="text-purple-400 hover:text-purple-300 font-medium">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      setUsers(await res.json());
    }
    setLoading(false);
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    await fetchUsers();
    setActionLoading(null);
  };

  const toggleRole = async (userId: string, role: string) => {
    setActionLoading(userId);
    await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: role === "ADMIN" ? "USER" : "ADMIN" }),
    });
    await fetchUsers();
    setActionLoading(null);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Benutzer wirklich löschen?")) return;
    setActionLoading(userId);
    await fetch(`/api/users/${userId}`, { method: "DELETE" });
    await fetchUsers();
    setActionLoading(null);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">👤 Benutzerverwaltung</h1>
        <p className="text-gray-400 mt-1">
          {users.length} Benutzer registriert
        </p>
      </div>

      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Benutzer
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Rolle
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Registriert
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-800/50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleRole(user.id, user.role)}
                    disabled={actionLoading === user.id}
                    className={`px-3 py-1 text-xs rounded-full transition ${
                      user.role === "ADMIN"
                        ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                        : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                    }`}>
                    {user.role === "ADMIN" ? "👑 Admin" : "👤 Benutzer"}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(user.id, user.isActive)}
                    disabled={actionLoading === user.id}
                    className={`px-3 py-1 text-xs rounded-full transition ${
                      user.isActive
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                    }`}>
                    {user.isActive ? "✓ Aktiv" : "⏳ Wartet"}
                  </button>
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {new Date(user.createdAt).toLocaleDateString("de-DE")}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => deleteUser(user.id)}
                    disabled={actionLoading === user.id}
                    className="text-red-400 hover:text-red-300 font-medium disabled:opacity-50">
                    🗑️ Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">ℹ️ Hinweis</h2>
        <ul className="text-gray-400 space-y-2 text-sm">
          <li>
            • Klicke auf <span className="text-purple-400">Rolle</span> um
            zwischen Admin/Benutzer zu wechseln
          </li>
          <li>
            • Klicke auf <span className="text-green-400">Status</span> um
            Benutzer zu aktivieren/deaktivieren
          </li>
          <li>• Inaktive Benutzer können sich nicht einloggen</li>
          <li>• Neue Benutzer werden standardmäßig als inaktiv registriert</li>
        </ul>
      </div>
    </div>
  );
}

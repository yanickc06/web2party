"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "🏠" },
  { name: "Partys", href: "/dashboard/parties", icon: "🎉" },
  { name: "Kunden", href: "/dashboard/customers", icon: "👥" },
  { name: "Musik", href: "/dashboard/music", icon: "🎵" },
  { name: "Playlists", href: "/dashboard/playlists", icon: "📋" },
  { name: "Technik", href: "/dashboard/equipment", icon: "🔊" },
  { name: "Partner", href: "/dashboard/partners", icon: "🤝" },
  { name: "Locations", href: "/dashboard/locations", icon: "📍" },
  { name: "Dateien", href: "/dashboard/files", icon: "📁" },
];

const adminNavigation = [
  { name: "Benutzer", href: "/dashboard/users", icon: "👤" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-gray-900 border-r border-gray-800 min-h-screen flex flex-col transition-all duration-300`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="text-3xl">🎧</span>
          {!collapsed && (
            <span className="text-xl font-bold text-white">Web2Party</span>
          )}
        </Link>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 m-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
        {collapsed ? "→" : "←"}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? "bg-purple-600/20 text-purple-400 border-l-2 border-purple-500"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}>
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-800">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Admin
                </p>
              )}
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-purple-600/20 text-purple-400 border-l-2 border-purple-500"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}>
                    <span className="text-xl">{item.icon}</span>
                    {!collapsed && (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
            {session?.user?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition ${
            collapsed ? "text-xl" : ""
          }`}>
          {collapsed ? "🚪" : "Abmelden"}
        </button>
      </div>
    </aside>
  );
}

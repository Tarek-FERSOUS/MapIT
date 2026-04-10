"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import {
  LayoutDashboard,
  AlertCircle,
  FileText,
  Map,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell
} from "lucide-react";
import { useState } from "react";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      href: "/incidents",
      label: "Incidents",
      icon: AlertCircle
    },
    {
      href: "/documents",
      label: "Documents",
      icon: FileText
    },
    {
      href: "/assets",
      label: "Assets",
      icon: LayoutDashboard
    },
    {
      href: "/problems",
      label: "Problems",
      icon: AlertCircle
    },
    {
      href: "/relationships",
      label: "Relationships",
      icon: Map
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 z-50 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-slate-200">
            <Link href="/dashboard" className="text-xl font-bold text-primary-600">
              MapIT
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-4 top-4 lg:hidden"
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav id="primary-navigation" aria-label="Primary" className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  pathname === href
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-200 space-y-3">
            <Link
              href="/settings"
              aria-current={pathname === "/settings" ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                pathname === "/settings"
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
            {user && (
              <div className="px-4 py-2 text-xs text-slate-500">
                <p className="truncate">
                  <strong>{user.username}</strong>
                </p>
                <p className="text-slate-400">{user.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={sidebarOpen}
              aria-controls="primary-navigation"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  aria-label="Global search"
                  placeholder="Search..."
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-4">
            <button
              className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 overflow-auto page-enter">{children}</main>
      </div>
    </div>
  );
}

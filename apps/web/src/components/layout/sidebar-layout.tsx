"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { apiClient } from "@/lib/api";
import { NotificationItem, NotificationsResponse, UserSettings } from "@/types/api";
import {
  LayoutDashboard,
  Server,
  AlertTriangle,
  Share2,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Bell,
  User,
  Moon,
  Sun
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme, isSaving } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserSettings["profile"] | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const getUserInitials = (value?: string | null) => {
    const normalized = (value || "U").trim();
    if (!normalized) {
      return "U";
    }

    const parts = normalized.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] || "U"}${parts[1][0] || ""}`.toUpperCase();
    }

    return normalized.slice(0, 2).toUpperCase();
  };

  const getProfileInitials = () => {
    const firstName = profile?.firstName?.trim() || "";
    const lastName = profile?.lastName?.trim() || "";

    if (firstName || lastName) {
      return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
    }

    return getUserInitials(user?.username);
  };

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const data = await apiClient.get<NotificationsResponse>("/notifications/recent", { limit: 10 });
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (_error) {
      setNotificationsError("Failed to load notifications");
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiClient.get<UserSettings>("/settings/me");
        setProfile(data.profile || null);
      } catch (_error) {
        setProfile(null);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (notificationsOpen && notifications.length === 0 && !notificationsLoading) {
      loadNotifications();
    }
  }, [notificationsOpen]);

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
      href: "/assets",
      label: "Assets",
      icon: Server
    },
    {
      href: "/problems",
      label: "Problems",
      icon: AlertTriangle
    },
    {
      href: "/relationships",
      label: "Relationships",
      icon: Share2
    },
    {
      href: "/reports",
      label: "Reports",
      icon: BarChart3
    }
  ];

  return (
    <div className="h-screen overflow-hidden flex w-full bg-background">
      <aside className={`${collapsed ? "w-[72px]" : "w-64"} hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 sticky top-0 h-screen`}>
        <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Share2 className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && <span className="text-lg font-bold text-sidebar-accent-foreground tracking-tight">MapIT</span>}
        </div>

        <nav id="primary-navigation" aria-label="Primary" className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex w-full items-center justify-center rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-30 shrink-0 flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search assets, problems..."
              className="w-full h-9 rounded-md border-0 bg-muted pl-9 pr-3 text-sm text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => void toggleTheme()}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              disabled={isSaving}
            >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            <div className="relative">
              <button
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-md border border-border bg-card p-2 shadow-lg z-40">
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/60">
                    <p className="text-sm font-medium">Recent Notifications</p>
                    <button
                      onClick={loadNotifications}
                      className="text-xs text-muted-foreground hover:text-foreground"
                      title="Refresh notifications"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="max-h-80 overflow-auto">
                    {notificationsLoading && <p className="text-xs text-muted-foreground px-2 py-3">Loading...</p>}
                    {!notificationsLoading && notificationsError && (
                      <p className="text-xs text-destructive px-2 py-3">{notificationsError}</p>
                    )}
                    {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                      <p className="text-xs text-muted-foreground px-2 py-3">No recent notifications.</p>
                    )}

                    {!notificationsLoading && !notificationsError && notifications.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setNotificationsOpen(false)}
                        className="block rounded-sm px-2 py-2 hover:bg-muted"
                      >
                        <p className="text-sm text-foreground line-clamp-1">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {item.kind}
                          {item.severity ? ` · ${item.severity}` : ""}
                          {` · ${new Date(item.createdAt).toLocaleString()}`}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                aria-label="User menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {getProfileInitials()}
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-card p-1 shadow-lg">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/settings");
                    }}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-muted"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-destructive hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}

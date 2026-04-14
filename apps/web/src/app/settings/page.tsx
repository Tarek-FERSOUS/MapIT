"use client";

import { useState } from "react";
import { useEffect } from "react";
import { User, Shield, Bell, Plug, Key } from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { UserSettings } from "@/types/api";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "api", label: "API Keys", icon: Key }
] as const;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("profile");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setError(null);
        const data = await apiClient.get<UserSettings>("/settings/me");
        setSettings(data);
      } catch (error) {
        setError(getApiErrorMessage(error, "Failed to load settings"));
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async (next: UserSettings) => {
    try {
      setIsSaving(true);
      setError(null);
      const saved = await apiClient.patch<UserSettings>("/settings/me", next as Record<string, any>);
      setSettings(saved);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to save settings"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1>Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="kpi-shadow border border-border/50 rounded-lg bg-card md:w-[200px] shrink-0">
          <div className="p-2">
            <nav className="flex md:flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={tab.label}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1 kpi-shadow border border-border/50 rounded-lg bg-card p-6">
          {error && <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {activeTab === "profile" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="first-name" className="text-sm">First Name</label>
                  <input
                    id="first-name"
                    value={settings?.profile?.firstName || ""}
                    onChange={(event) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              profile: {
                                firstName: event.target.value,
                                lastName: prev.profile?.lastName || "",
                                email: prev.profile?.email || ""
                              }
                            }
                          : prev
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="last-name" className="text-sm">Last Name</label>
                  <input
                    id="last-name"
                    value={settings?.profile?.lastName || ""}
                    onChange={(event) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              profile: {
                                firstName: prev.profile?.firstName || "",
                                lastName: event.target.value,
                                email: prev.profile?.email || ""
                              }
                            }
                          : prev
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="email" className="text-sm">Email</label>
                  <input
                    id="email"
                    value={settings?.profile?.email || ""}
                    onChange={(event) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              profile: {
                                firstName: prev.profile?.firstName || "",
                                lastName: prev.profile?.lastName || "",
                                email: event.target.value
                              }
                            }
                          : prev
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="role" className="text-sm">Role</label>
                  <input id="role" defaultValue="IT Administrator" disabled className="h-10 w-full rounded-md border border-input bg-muted px-3" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
                  onClick={() => settings && saveSettings(settings)}
                  disabled={!settings || isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button className="h-8 px-3 rounded-md border border-border bg-card text-sm">Cancel</button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Notifications</h2>
              {["Email notifications", "Critical alerts", "Weekly digest", "Asset status changes"].map((item) => (
                <label key={item} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
                  <span>{item}</span>
                  <input
                    type="checkbox"
                    checked={
                      item === "Email notifications"
                        ? Boolean(settings?.notifications.email)
                        : item === "Critical alerts"
                        ? Boolean(settings?.notifications.critical)
                        : item === "Asset status changes"
                        ? Boolean(settings?.notifications.inApp)
                        : false
                    }
                    onChange={(event) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                ...(item === "Email notifications" ? { email: event.target.checked } : {}),
                                ...(item === "Critical alerts" ? { critical: event.target.checked } : {}),
                                ...(item === "Asset status changes" ? { inApp: event.target.checked } : {})
                              }
                            }
                          : prev
                      )
                    }
                    className="h-4 w-4"
                  />
                </label>
              ))}
              <button
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
                onClick={() => settings && saveSettings(settings)}
                disabled={!settings || isSaving}
              >
                {isSaving ? "Saving..." : "Save Notifications"}
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Security</h2>
              <div className="space-y-1.5">
                <label htmlFor="current-password" className="text-sm">Current Password</label>
                <input id="current-password" type="password" className="h-10 w-full max-w-md rounded-md border border-input bg-background px-3" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-sm">New Password</label>
                <input id="new-password" type="password" className="h-10 w-full max-w-md rounded-md border border-input bg-background px-3" />
              </div>
              <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm">Update Password</button>
            </div>
          )}

          {(activeTab === "integrations" || activeTab === "api") && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">This section is coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { MockApiService } from "@/lib/mock-api";
import { UserSettings } from "@/types/api";
import { ErrorAlert, LoadingSpinner } from "@/components/ui";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await MockApiService.getSettings();
        setSettings(data);
      } catch (_err) {
        setError("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!settings) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const updated = await MockApiService.updateSettings(settings);
      setSettings(updated);
    } catch (_err) {
      setError("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your personal preferences (mock data).</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {isLoading || !settings ? (
        <div className="card py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <form className="card space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>

            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      email: event.target.checked
                    }
                  })
                }
              />
              Email notifications
            </label>

            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.notifications.inApp}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      inApp: event.target.checked
                    }
                  })
                }
              />
              In-app notifications
            </label>

            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.notifications.critical}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      critical: event.target.checked
                    }
                  })
                }
              />
              Critical incidents only
            </label>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Theme</h2>
            <select
              className="input"
              value={settings.theme}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  theme: event.target.value as UserSettings["theme"]
                })
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}
    </div>
  );
}

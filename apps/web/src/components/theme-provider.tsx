"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  isSaving: boolean;
  setTheme: (theme: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const STORAGE_KEY = "mapit-theme";

function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      setThemeState(stored);
    } else {
      setThemeState(getSystemTheme());
    }

    setHasLoadedPreference(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedPreference) {
      return;
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, hasLoadedPreference]);

  useEffect(() => {
    const loadTheme = async () => {
      if (!user) {
        return;
      }

      try {
        const settings = await apiClient.get<{ theme: "light" | "dark" | "auto" }>("/settings/me");
        const nextTheme = settings.theme === "auto" ? getSystemTheme() : settings.theme;
        setThemeState(nextTheme);
      } catch {
        // Keep local/system theme when settings endpoint is not accessible for current user.
      }
    };

    loadTheme();
  }, [user?.username]);

  const setTheme = async (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);

    if (!user) {
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.patch("/settings/me", { theme: nextTheme });
    } catch {
      // Keep UI responsive even if persistence fails.
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTheme = async () => {
    await setTheme(theme === "dark" ? "light" : "dark");
  };

  const value = useMemo(
    () => ({
      theme,
      isSaving,
      setTheme,
      toggleTheme
    }),
    [theme, isSaving]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

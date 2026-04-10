import { create } from "zustand";
import { User } from "@/types/api";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => {
    set({ user: null });
  },
  checkSession: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        set({ user: data.user, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      console.error("Session check failed:", error);
      set({ user: null, isLoading: false });
    }
  }
}));

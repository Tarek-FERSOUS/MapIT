import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";
import { User } from "../types/api";

interface AuthState {
  token: string | null;
  user: User | null;
  role: string | null;
  isLoading: boolean;
  error: string | null;

  setAuth: (token: string, user?: User, role?: string) => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
  canAccess: (module: string, action: string) => boolean;
}

const authStoreCreator = persist(
  (set, get) => ({
    token: null,
    user: null,
    role: null,
    isLoading: false,
    error: null,

    setAuth: (token: string, user?: User, role?: string) => {
      set({
        token,
        user: user || null,
        role: role || null,
        error: null
      });
    },

    setUser: (user: User) => {
      set({ user, error: null });
    },

    updateUser: (updates: Partial<User>) => {
      set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      }));
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    clearAuth: () => {
      set({
        token: null,
        user: null,
        role: null,
        error: null,
        isLoading: false
      });
    },

    hasPermission: (permission: string) => {
      const { user } = get();
      if (!user) return false;
      if (!user.permissions) return false;
      return user.permissions.includes(permission);
    },

    canAccess: (module: string, action: string) => {
      const permission = `${module}:${action}`;
      return get().hasPermission(permission);
    }
  }),
  {
    name: "mapit-auth",
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state: AuthState) => ({
      token: state.token,
      user: state.user,
      role: state.role
    })
  }
) as any;

export const useAuthStore = create<AuthState>()(authStoreCreator);

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      role: null,
      setAuth: ({ token, role = "User" }) => set({ token, role }),
      clearAuth: () => set({ token: null, role: null })
    }),
    {
      name: "mapit-auth",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
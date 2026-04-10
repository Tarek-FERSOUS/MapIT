"use client";

import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { ToastProvider } from '@/components/toast-provider';

export function Providers({ children }: { children: ReactNode }) {
  const checkSession = useAuthStore(state => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}

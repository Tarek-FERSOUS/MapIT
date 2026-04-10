'use client';

import React, { useEffect } from 'react';
import { useToastEmitter } from '@/hooks/useUi';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToastEmitter();

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: { id: string; type: string; message: string };
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  }[toast.type] || 'bg-slate-50 border-slate-200';

  const textColor = {
    success: 'text-emerald-800',
    error: 'text-red-800',
    warning: 'text-amber-800',
    info: 'text-blue-800',
  }[toast.type] || 'text-slate-800';

  return (
    <div
      className={`pointer-events-auto rounded-md border ${bgColor} px-4 py-3 shadow-sm ${textColor}`}
      role="alert"
    >
      <p className="text-sm">{toast.message}</p>
    </div>
  );
}

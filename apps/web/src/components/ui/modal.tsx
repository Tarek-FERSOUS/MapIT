'use client';

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md',
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-lg w-full ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
        {actions && (
          <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, open, close };
}

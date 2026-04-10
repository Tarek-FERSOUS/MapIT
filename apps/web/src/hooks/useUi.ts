import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface UseToastOptions {
  duration?: number;
  onClose?: () => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

// Global toast state (simple implementation - upgrade to context/provider in future)
let toastId = 0;
const toastListeners: Set<(toast: Toast) => void> = new Set();
const toastRemoveListeners: Set<(id: string) => void> = new Set();

export function useToast() {
  const show = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', options: UseToastOptions = {}) => {
    const id = String(toastId++);
    const toast: Toast = { id, message, type };
    
    toastListeners.forEach(fn => fn(toast));

    if (options.duration !== 0) {
      const duration = options.duration ?? 4000;
      setTimeout(() => {
        toastRemoveListeners.forEach(fn => fn(id));
        options.onClose?.();
      }, duration);
    }

    return id;
  }, []);

  const success = useCallback((message: string, options?: UseToastOptions) => show(message, 'success', options), [show]);
  const error = useCallback((message: string, options?: UseToastOptions) => show(message, 'error', options), [show]);
  const warning = useCallback((message: string, options?: UseToastOptions) => show(message, 'warning', options), [show]);
  const info = useCallback((message: string, options?: UseToastOptions) => show(message, 'info', options), [show]);

  return { show, success, error, warning, info };
}

export function useToastEmitter() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts(prev => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  toastListeners.add(addToast);
  toastRemoveListeners.add(removeToast);

  return { toasts, removeToast };
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  const confirm = useCallback((
    confirmTitle: string,
    confirmMessage: string,
    onConfirmCallback: () => void
  ) => {
    setTitle(confirmTitle);
    setMessage(confirmMessage);
    setOnConfirm(() => onConfirmCallback);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTitle('');
    setMessage('');
    setOnConfirm(null);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm?.();
    close();
  }, [onConfirm, close]);

  return { isOpen, title, message, confirm, close, handleConfirm };
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;

const toneStyles: Record<ToastTone, string> = {
  success: 'bg-success text-white ring-success/30',
  error: 'bg-danger text-white ring-danger/30',
  info: 'bg-foreground text-white ring-black/20',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message) => toast(message, 'success'),
      error: (message) => toast(message, 'error'),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col gap-2 md:inset-x-auto md:right-4 md:max-w-sm"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ring-1',
        toneStyles[item.tone],
      )}
    >
      <p className="flex-1 leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold opacity-80 transition hover:opacity-100"
        aria-label="Cerrar notificacion"
      >
        Cerrar
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}

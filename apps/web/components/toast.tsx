'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { cn } from './ui';

type Tipo = 'sucesso' | 'erro' | 'info';
interface Toast {
  id: number;
  msg: string;
  tipo: Tipo;
}

const ToastContext = createContext<(msg: string, tipo?: Tipo) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((msg: string, tipo: Tipo = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'max-w-sm rounded-lg px-4 py-3 text-sm text-white shadow-lg',
              t.tipo === 'sucesso' && 'bg-emerald-600',
              t.tipo === 'erro' && 'bg-red-600',
              t.tipo === 'info' && 'bg-slate-800',
            )}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

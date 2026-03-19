import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle, Info, X, WifiOff } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'offline';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const toastConfig: Record<ToastType, { icon: typeof AlertTriangle; bg: string; border: string; text: string }> = {
  success: { icon: CheckCircle, bg: 'bg-green-500/15', border: 'border-green-500/30', text: 'text-green-400' },
  error: { icon: AlertTriangle, bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  info: { icon: Info, bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-400' },
  offline: { icon: WifiOff, bg: 'bg-slate-500/15', border: 'border-slate-500/30', text: 'text-slate-400' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
        <AnimatePresence>
          {toasts.map(toast => {
            const config = toastConfig[toast.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`${config.bg} ${config.border} border backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 pointer-events-auto`}
              >
                <Icon size={18} className={config.text} />
                <span className={`text-sm font-medium ${config.text} flex-1`}>{toast.message}</span>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

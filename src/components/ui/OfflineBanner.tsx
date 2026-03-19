import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OfflineBannerProps {
  isOnline: boolean;
}

export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[9999] p-4 pointer-events-none"
        >
          <div className="max-w-md mx-auto bg-red-500/10 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(239,68,68,0.2)] flex items-center gap-4 pointer-events-auto">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 relative">
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              <WifiOff size={18} className="text-red-400 relative z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-red-100 flex items-center gap-1.5">
                Connection Lost
                <AlertTriangle size={12} className="text-red-400" />
              </h3>
              <p className="text-xs text-red-200/70 mt-0.5">
                You are currently offline. Live AQI data cannot be fetched, but cached data may still be available.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

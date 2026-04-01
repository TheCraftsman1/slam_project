import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Info, Activity, AlertCircle } from 'lucide-react';

export function HealthImpactWidget({ pm25 }: { pm25: number }) {
  const [expanded, setExpanded] = useState(false);

  // The Berkeley Earth rule of thumb: 1 cigarette equivalents to a PM2.5 level of 22 뿯νg/m3 over 24 hours.
  const cigEquivalent = pm25 > 0 ? (pm25 / 22).toFixed(1) : "0";
  const numCigs = parseFloat(cigEquivalent);

  let severityColor = 'text-emerald-600 dark:text-emerald-400';
  let severityBg = 'bg-emerald-500/10 border-emerald-500/20';
  let message = "Your lungs are resting easy today.";
  let badgeText = "Clean Air";

  if (numCigs > 10) {
    severityColor = 'text-rose-600 dark:text-rose-400';
    severityBg = 'bg-rose-500/10 border-rose-500/20';
    message = "Severe toxicity. Extreme health risk.";
    badgeText = "Hazardous Equivalent";
  } else if (numCigs > 5) {
    severityColor = 'text-orange-600 dark:text-orange-400';
    severityBg = 'bg-orange-500/10 border-orange-500/20';
    message = "Living outside today is like chain-smoking.";
    badgeText = "High Risk Equivalent";
  } else if (numCigs > 2) {
    severityColor = 'text-amber-600 dark:text-amber-400';
    severityBg = 'bg-amber-500/10 border-amber-500/20';
    message = "Significant passive smoking impact.";
    badgeText = "Moderate Risk Equivalent";
  } else if (numCigs > 0.5) {
    severityColor = 'text-yellow-600 dark:text-yellow-400';
    severityBg = 'bg-yellow-500/10 border-yellow-500/20';
    message = "Mild passive smoke equivalent.";
    badgeText = "Slight Risk Equivalent";
  }

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="w-full max-w-md mt-6"
    >
      <div 
        onClick={() => setExpanded(!expanded)}
        className={`w-full p-5 rounded-3xl border cursor-pointer transition-all active:scale-[0.98] ${severityBg} flex flex-col relative overflow-hidden`}
      >
        <div className="flex items-center justify-between z-10 w-full mb-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className={severityColor} />
            <span className={`text-[12px] font-black uppercase tracking-wider ${severityColor}`}>
              Passive Smoke Tracker
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md bg-surface border border-current opacity-80 ${severityColor}`}>
            {badgeText}
          </span>
        </div>

        <div className="flex items-end gap-3 z-10">
          <h4 className={`text-4xl font-display font-bold tracking-tighter ${severityColor}`}>
            {numCigs < 0.5 ? "None" : `${cigEquivalent}`} 
          </h4>
          <span className={`text-sm font-semibold mb-1 opacity-80 ${severityColor}`}>
            Cigarettes / day
          </span>
        </div>

        <p className={`text-sm font-medium mt-2 z-10 opacity-90 ${severityColor}`}>
          {message}
        </p>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="z-10"
            >
              <div className="pt-4 border-t border-current/10">
                <div className="flex items-start gap-2.5">
                  <Info size={16} className={`shrink-0 mt-0.5 ${severityColor}`} />
                  <p className={`text-[13px] leading-relaxed opacity-90 ${severityColor}`}>
                    <strong>Scientifically Proven:</strong> Breathing 22 뿯½g/m뿯½ of PM2.5 over 24 hours has a similar health toll as smoking one cigarette (Berkeley Earth methodology). The invisible particles pass through your lungs directly into your bloodstream.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AlertCircle 
          size={120} 
          className={`absolute -bottom-10 -right-10 opacity-[0.08] pointer-events-none ${severityColor}`} 
        />
      </div>
    </motion.div>
  );
}

import React from 'react';
import type { MetricKey, MetricOption } from '../../types';
import { METRIC_OPTIONS } from '../../types';

interface FilterChipsProps {
  activeMetric: MetricKey;
  onMetricChange: (metric: MetricKey) => void;
}

export function FilterChips({ activeMetric, onMetricChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 pointer-events-auto">
      {METRIC_OPTIONS.map(m => (
        <button
          key={m.key}
          onClick={() => onMetricChange(m.key)}
          className={`bg-[#141820]/95 backdrop-blur-2xl border ${activeMetric === m.key ? 'border-blue-500/40 text-white' : 'border-white/[0.08] text-slate-400'} px-3.5 py-2 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 hover:bg-white/[0.05] transition-all active:scale-95`}
        >
          {activeMetric === m.key && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
          )}
          {m.label}
        </button>
      ))}
    </div>
  );
}

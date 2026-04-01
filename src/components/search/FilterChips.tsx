import React from 'react';
import type { MetricKey } from '../../types';
import { METRIC_OPTIONS } from '../../types';

interface FilterChipsProps {
  activeMetric: MetricKey;
  onMetricChange: (metric: MetricKey) => void;
}

export function FilterChips({ activeMetric, onMetricChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 pointer-events-auto">
      {METRIC_OPTIONS.map(m => {
        const isActive = activeMetric === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onMetricChange(m.key)}
            className={`bg-card px-3.5 py-2 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 active:scale-95 border ${
              isActive
                ? 'border-accent text-text-main shadow-minimal'
                : 'border-border-subtle text-text-sub hover:bg-border-subtle hover:text-text-main shadow-sm'
            }`}
          >
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-sm" />
            )}
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

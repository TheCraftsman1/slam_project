import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { AqiStation, MetricKey } from '../../types';
import { getAqiColor } from '../../utils';

interface AqiMarkerProps {
  station: AqiStation;
  isSelected: boolean;
  activeMetric: MetricKey;
  onClick: () => void;
}

export function AqiMarker({ station, isSelected, activeMetric, onClick }: AqiMarkerProps) {
  const colors = getAqiColor(station.aqi);
  const hasError = !!station.error && !station.loading;

  let displayValue: number | string = station.aqi;

  if (station.loading) {
    displayValue = '...';
  } else if (hasError && station.aqi === 0) {
    displayValue = '!';
  } else if (station.airData && activeMetric !== 'us_aqi') {
    displayValue = Math.round(station.airData[activeMetric] || 0);
  }

  // Use error colors if there's an error and no data
  const effectiveColors = hasError && station.aqi === 0
    ? { bg: 'bg-red-500', border: 'border-red-500/40', text: 'text-red-400', hex: '#ef4444' }
    : colors;

  return (
    <div
      className={`flex flex-col items-center -translate-x-1/2 -translate-y-[90%] cursor-pointer group ${isSelected ? 'z-[100]' : 'z-10'}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className={`relative flex items-center px-3.5 py-1.5 rounded-full backdrop-blur-md border shadow-[0_10px_25px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-all duration-300 origin-bottom transform-gpu flex-nowrap ${
        isSelected ? 'bg-[#0f1729]/95 border-white/40 scale-105' : 'bg-[#0b1120]/80 border-white/10 group-hover:bg-[#0f1729]/95 group-hover:border-blue-500/50'
      }`}>
        {station.loading ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full mr-2.5 shrink-0 bg-blue-400 animate-pulse ring-2 ring-blue-400/20" />
            <div className="skeleton-shimmer h-3 w-16 rounded" />
          </>
        ) : (
          <>
            {/* Futuristic glowing indicator dot */}
            <div className={`w-1.5 h-1.5 rounded-full mr-2.5 shrink-0 ${effectiveColors.bg} shadow-[0_0_8px_${effectiveColors.hex}] ring-2 ring-white/20`} />
            
            {/* Clean, responsive-feeling typography for City/Location Name */}
            <span className={`text-[10.5px] font-extrabold uppercase tracking-[0.15em] whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
              isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
            }`}>
              {station.name}
            </span>

            {/* AQI Badge inside the label */}
            <div className="flex items-center ml-2 border-l border-white/20 pl-2">
              <span className={`text-[10px] font-black ${effectiveColors.text} tracking-wider`}>
                {activeMetric === 'us_aqi' ? `AQI ${displayValue}` : displayValue}
              </span>
            </div>
            
            {hasError && station.aqi === 0 && (
              <AlertTriangle size={12} className="text-red-400 ml-1.5" />
            )}
          </>
        )}
      </div>

      {/* Vertical Map tether / stem linking the label to the exact coordinate */}
      <div className={`w-[1.5px] h-3.5 transition-colors duration-300 ${
        isSelected ? 'bg-gradient-to-b from-white/60 to-transparent' : 'bg-gradient-to-b from-white/30 to-transparent group-hover:from-blue-500/60'
      }`} />

      {/* Radar Ring (selected only) */}
      {isSelected && !station.loading && (
        <div className="absolute bottom-0 w-8 h-8 pointer-events-none rounded-full border border-white/30 animate-ping opacity-50" />
      )}
    </div>
  );
}

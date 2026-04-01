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
      {/* ── Marker Pill ── */}
      <div className={`relative flex items-center px-3 py-1.5 rounded-full backdrop-blur-xl border transition-all duration-250 origin-bottom transform-gpu flex-nowrap ${
        isSelected
          ? 'bg-[#0f1729]/95 border-white/30 scale-110 shadow-[0_8px_24px_rgba(0,0,0,0.5)]'
          : 'bg-[#0a0f1a]/85 border-white/[0.08] shadow-[0_6px_20px_rgba(0,0,0,0.5)] group-hover:scale-105 group-hover:bg-[#0f1729]/95 group-hover:border-white/15'
      }`}>
        {station.loading ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full mr-2 shrink-0 bg-cyan-400 animate-pulse ring-2 ring-cyan-400/20" />
            <div className="skeleton-shimmer h-3 w-14 rounded" />
          </>
        ) : (
          <>
            {/* Status dot */}
            <div
              className={`w-1.5 h-1.5 rounded-full mr-2 shrink-0 ${effectiveColors.bg} ring-2 ring-white/15`}
              style={{ boxShadow: `0 0 8px ${effectiveColors.hex}` }}
            />
            
            {/* Name */}
            <span className={`text-[10px] font-bold uppercase tracking-[0.12em] whitespace-nowrap ${
              isSelected ? 'text-white' : 'text-slate-200/90 group-hover:text-white'
            }`}>
              {station.name}
            </span>

            {/* AQI Badge */}
            <div className="flex items-center ml-2 border-l border-white/15 pl-2">
              <span className={`text-[10px] font-extrabold ${effectiveColors.text} tracking-wider tabular-nums`}>
                {activeMetric === 'us_aqi' ? `AQI ${displayValue}` : displayValue}
              </span>
            </div>
            
            {hasError && station.aqi === 0 && (
              <AlertTriangle size={11} className="text-red-400 ml-1.5" />
            )}
          </>
        )}
      </div>

      {/* ── Base stem & ping ring ── */}
      {station.isUserLocation ? (
        <div className="relative flex flex-col items-center mt-1">
          <div className="w-[2px] h-6 bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          
          <div className="absolute -bottom-[8px] w-[18px] h-[18px] bg-blue-500 rounded-full border-[3px] border-white shadow-[0_0_15px_rgba(59,130,246,0.8)] z-20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white flex-shrink-0 rounded-full" />
          </div>
          
          <div 
            className="absolute -bottom-[19px] w-10 h-10 bg-blue-400/20 rounded-full border border-blue-400/50"
            style={{ animation: 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}
          />
          <div className="absolute -bottom-[31px] w-16 h-16 bg-blue-500/10 rounded-full animate-pulse" />
        </div>
      ) : (
        <>
          <div className={`w-px h-3 transition-colors duration-300 ${
            isSelected
              ? 'bg-gradient-to-b from-white/50 to-transparent'
              : 'bg-gradient-to-b from-white/25 to-transparent group-hover:from-cyan-400/50'
          }`} />

          {isSelected && !station.loading && (
            <div
              className="absolute bottom-0 w-7 h-7 pointer-events-none rounded-full border animate-ping opacity-40"
              style={{ borderColor: `${effectiveColors.hex}60` }}
            />
          )}
        </>
      )}
    </div>
  );
}

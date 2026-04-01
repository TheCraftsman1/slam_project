import React from 'react';
import type { IareBuilding } from '../../types';
import { getAqiColor } from '../../utils';

interface BuildingLabelProps {
  name: string;
  aqi?: number | null;
  onClick: () => void;
  isMainCampus?: boolean;
}

export function BuildingLabel({ name, aqi, onClick, isMainCampus }: BuildingLabelProps) {
  const isAqiValid = aqi !== undefined && aqi !== null;
  const aqiColors = isAqiValid ? getAqiColor(aqi) : null;

  return (
    <div
      className="flex flex-col items-center -translate-x-1/2 -translate-y-[90%] cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* ── Label Pill ── */}
      <div className={`relative flex items-center px-3 py-1.5 rounded-full backdrop-blur-xl border transition-all duration-250 origin-bottom transform-gpu flex-nowrap ${
        isMainCampus
          ? 'bg-[#0f1729]/90 border-white/15 shadow-[0_6px_20px_rgba(0,0,0,0.45)]'
          : 'bg-[#0a0f1a]/85 border-white/[0.08] shadow-[0_6px_20px_rgba(0,0,0,0.45)] group-hover:scale-105 group-hover:bg-[#0f1729]/95 group-hover:border-white/15'
      }`}>
        {/* Indicator dot */}
        <div className={`w-1.5 h-1.5 rounded-full mr-2 shrink-0 ${
          isMainCampus && aqiColors
            ? `${aqiColors.bg} ring-2 ring-white/15`
            : 'bg-cyan-400 ring-2 ring-cyan-400/20'
        }`}
          style={isMainCampus && aqiColors ? { boxShadow: `0 0 8px ${aqiColors.hex}` } : { boxShadow: '0 0 8px rgba(6,182,212,0.6)' }}
        />
        
        {/* Name */}
        <span className={`text-[10px] font-bold uppercase tracking-[0.12em] whitespace-nowrap ${
          isMainCampus ? 'text-white' : 'text-slate-200/90 group-hover:text-white'
        }`}>
          {name}
        </span>

        {/* AQI Badge */}
        {isAqiValid && aqiColors && (
          <div className="flex items-center ml-2 border-l border-white/15 pl-2">
            <span className={`text-[10px] font-extrabold ${aqiColors.text} tracking-wider tabular-nums`}>
              AQI {aqi}
            </span>
          </div>
        )}
      </div>

      {/* ── Stem ── */}
      <div className={`w-px h-3 transition-colors duration-300 ${
        isMainCampus
          ? 'bg-gradient-to-b from-white/40 to-transparent'
          : 'bg-gradient-to-b from-white/25 to-transparent group-hover:from-cyan-400/50'
      }`} />
    </div>
  );
}

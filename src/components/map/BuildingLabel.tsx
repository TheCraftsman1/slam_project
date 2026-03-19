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
      {/* High-end glassmorphism label that pops on satellite & normal maps */}
      <div className={`relative flex items-center px-3.5 py-1.5 rounded-full backdrop-blur-md border shadow-[0_10px_25px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-all duration-300 origin-bottom transform-gpu flex-nowrap ${
        isMainCampus ? 'bg-[#0f1729]/90 border-white/20' : 'bg-[#0b1120]/80 border-white/10 group-hover:bg-[#0f1729]/95 group-hover:border-blue-500/50'
      }`}>
        {/* Futuristic glowing indicator dot */}
        <div className={`w-1.5 h-1.5 rounded-full mr-2.5 shrink-0 ${
          isMainCampus && aqiColors ? `${aqiColors.bg} shadow-[0_0_8px_${aqiColors.hex}] ring-2 ring-white/20` : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,1)] ring-2 ring-blue-400/20'
        }`} />
        
        {/* Clean, responsive-feeling typography */}
        <span className={`text-[10.5px] font-extrabold uppercase tracking-[0.15em] whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
          isMainCampus ? 'text-white' : 'text-slate-200 group-hover:text-white'
        }`}>
          {name}
        </span>

        {/* AQI Badge inside the label for the main campus */}
        {isAqiValid && aqiColors && (
          <div className="flex items-center ml-2 border-l border-white/20 pl-2">
            <span className={`text-[10px] font-black ${aqiColors.text} tracking-wider`}>
              AQI {aqi}
            </span>
          </div>
        )}
      </div>

      {/* Vertical Map tether / stem linking the label to the exact coordinate */}
      <div className={`w-[1.5px] h-3.5 transition-colors duration-300 ${
        isMainCampus ? 'bg-gradient-to-b from-white/50 to-transparent' : 'bg-gradient-to-b from-white/30 to-transparent group-hover:from-blue-500/60'
      }`} />
    </div>
  );
}

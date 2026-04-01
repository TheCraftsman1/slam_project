import React from 'react';
import { Sparkles, X, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import type { City, AqiStation } from '../../types';

interface CityPanelProps {
  cities: City[];
  stations: AqiStation[];
  onSelectCity: (city: City) => void;
  onClose: () => void;
}

export function CityPanel({ cities, stations, onSelectCity, onClose }: CityPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-20 right-3 z-[600] bg-card border border-border-subtle shadow-minimal rounded-3xl p-4 shadow-elevated w-56 max-h-[60vh] overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/12 flex items-center justify-center">
            <Sparkles size={12} className="text-blue-400" />
          </div>
          <span className="text-[12px] font-bold text-text-main">Explore Cities</span>
        </div>
        <button onClick={onClose} className="text-text-sub hover:text-text-main transition-colors active:scale-90 p-1">
          <X size={14} />
        </button>
      </div>
      <p className="text-[10px] text-text-sub mb-3">Tap to load live AQI for any city</p>
      <div className="flex flex-col gap-0.5">
        {cities.map(city => {
          const exists = stations.some(s => Math.abs(s.lat - city.lat) < 0.005 && Math.abs(s.lng - city.lng) < 0.005);
          const stationAqi = stations.find(s => Math.abs(s.lat - city.lat) < 0.005)?.aqi;
          return (
            <button
              key={city.name}
              onClick={() => onSelectCity(city)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 active:scale-[0.97] ${
                exists
                  ? 'bg-emerald-500/8 text-emerald-300'
                  : 'hover:bg-white/[0.04] text-text-sub'
              }`}
            >
              <span className="text-[12px] font-semibold">{city.name}</span>
              {exists ? (
                (() => {
                  const matchingStation = stations.find(s => Math.abs(s.lat - city.lat) < 0.005);
                  if (matchingStation?.loading) {
                    return <div className="skeleton-shimmer rounded w-10 h-3" />;
                  }
                  return (
                    <span className="text-[9px] font-bold text-emerald-400 tabular-nums">
                      AQI {stationAqi || '...'}
                    </span>
                  );
                })()
              ) : (
                <MapPin size={11} className="text-text-sub" />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

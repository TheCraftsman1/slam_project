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
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="absolute top-20 right-3 z-[600] bg-[#141820]/98 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-4 shadow-2xl w-56 max-h-[60vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-blue-400" />
          <span className="text-xs font-bold text-white">Explore Cities</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
      <p className="text-[10px] text-slate-500 mb-3">Tap to load live AQI for any city</p>
      <div className="flex flex-col gap-1">
        {cities.map(city => {
          const exists = stations.some(s => Math.abs(s.lat - city.lat) < 0.005 && Math.abs(s.lng - city.lng) < 0.005);
          const stationAqi = stations.find(s => Math.abs(s.lat - city.lat) < 0.005)?.aqi;
          return (
            <button
              key={city.name}
              onClick={() => onSelectCity(city)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all active:scale-95 ${
                exists ? 'bg-green-500/10 text-green-400' : 'hover:bg-white/[0.05] text-slate-300'
              }`}
            >
              <span className="text-xs font-semibold">{city.name}</span>
              {exists ? (
                (() => {
                  const matchingStation = stations.find(s => Math.abs(s.lat - city.lat) < 0.005);
                  if (matchingStation?.loading) {
                    return <div className="skeleton-shimmer rounded w-10 h-3" />;
                  }
                  return (
                    <span className="text-[9px] font-bold text-green-400 tabular-nums">
                      AQI {stationAqi || '...'}
                    </span>
                  );
                })()
              ) : (
                <MapPin size={12} className="text-slate-600" />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import type { IareCollegeData, IareBuilding, AqiStation } from '../../types';
import { getBuildingIcon } from '../../utils';

interface CollegePanelProps {
  college: IareCollegeData;
  stations: AqiStation[];
  onSelectBuilding: (building: IareBuilding) => void;
  onClose: () => void;
}

export function CollegePanel({ college, stations, onSelectBuilding, onClose }: CollegePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="absolute top-20 right-3 z-[600] bg-[#0d1a1f]/98 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-4 shadow-2xl w-64 max-h-[70vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎓</span>
          <div>
            <span className="text-xs font-bold text-white block">{college.name}</span>
            <span className="text-[9px] text-emerald-400/70">{college.fullName}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      <p className="text-[10px] text-slate-500 mb-3">Tap a building to check AQI at that location</p>

      <div className="flex flex-col gap-1">
        {college.buildings.map(building => {
          const exists = stations.some(s => Math.abs(s.lat - building.lat) < 0.0005 && Math.abs(s.lng - building.lng) < 0.0005);
          const stationAqi = stations.find(s => Math.abs(s.lat - building.lat) < 0.0005)?.aqi;
          return (
            <button
              key={building.name}
              onClick={() => onSelectBuilding(building)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all active:scale-95 ${
                exists ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'hover:bg-white/[0.05] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{getBuildingIcon(building.type)}</span>
                <span className="text-xs font-semibold">{building.name}</span>
              </div>
              {exists ? (
                (() => {
                  const matchingStation = stations.find(s => Math.abs(s.lat - building.lat) < 0.0005);
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
                <span className="text-[8px] text-slate-600 uppercase">{building.type}</span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

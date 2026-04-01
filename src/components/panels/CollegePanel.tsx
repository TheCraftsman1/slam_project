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
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-20 right-3 z-[600] bg-card border border-border-subtle shadow-minimal !border-emerald-500/15 rounded-3xl p-4 shadow-elevated w-64 max-h-[70vh] overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🎓</span>
          <div>
            <span className="text-[12px] font-bold text-text-main block">{college.name}</span>
            <span className="text-[9px] text-emerald-400/60">{college.fullName}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-text-sub hover:text-text-main transition-colors active:scale-90 p-1">
          <X size={14} />
        </button>
      </div>

      <p className="text-[10px] text-text-sub mb-3">Tap a building to check AQI at that location</p>

      <div className="flex flex-col gap-0.5">
        {college.buildings.map(building => {
          const exists = stations.some(s => Math.abs(s.lat - building.lat) < 0.0005 && Math.abs(s.lng - building.lng) < 0.0005);
          const stationAqi = stations.find(s => Math.abs(s.lat - building.lat) < 0.0005)?.aqi;
          return (
            <button
              key={building.name}
              onClick={() => onSelectBuilding(building)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 active:scale-[0.97] ${
                exists
                  ? 'bg-emerald-500/8 text-emerald-300 border border-emerald-500/15'
                  : 'hover:bg-white/[0.04] text-text-sub'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{getBuildingIcon(building.type)}</span>
                <span className="text-[12px] font-semibold">{building.name}</span>
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
                <span className="text-[8px] text-text-sub uppercase font-semibold">{building.type}</span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

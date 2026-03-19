import React from 'react';
import { Plus, Minus, Crosshair, Globe, Box, Layers, RotateCcw, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { MapStyle } from '../../types';

interface MapControlsProps {
  map: google.maps.Map | null;
  stationCount: number;
  isLocating: boolean;
  is3D: boolean;
  showCityPanel: boolean;
  showCollegePanel: boolean;
  showLayers: boolean;
  mapStyle: MapStyle;
  onLocateMe: () => void;
  onToggleCityPanel: () => void;
  onGoToCollege: () => void;
  onToggle3D: () => void;
  onRotate3D: (degrees: number) => void;
  onResetHeading: () => void;
  onToggleLayers: () => void;
  onSetMapStyle: (style: MapStyle) => void;
}

export function MapControls({
  map,
  stationCount,
  isLocating,
  is3D,
  showCityPanel,
  showCollegePanel,
  showLayers,
  mapStyle,
  onLocateMe,
  onToggleCityPanel,
  onGoToCollege,
  onToggle3D,
  onRotate3D,
  onResetHeading,
  onToggleLayers,
  onSetMapStyle,
}: MapControlsProps) {
  return (
    <div className="absolute right-3 top-[100px] bottom-[120px] transition-all duration-500 z-[400] flex flex-col pointer-events-none">
      <div className="flex flex-col gap-2.5 sm:gap-3 items-end pointer-events-auto overflow-y-auto h-full pr-1 pb-4" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {/* Live Counter */}
        <div className="bg-[#141820]/95 backdrop-blur-3xl border border-white/[0.08] rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xl flex items-center gap-2 mb-1 shrink-0">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-300">{stationCount} Live</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-col bg-[#141820]/80 backdrop-blur-xl border border-white/[0.1] rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] shrink-0">
          <button
            className="p-2 sm:p-3.5 text-slate-200 hover:bg-white/[0.1] active:bg-white/[0.15] transition-all"
            onClick={() => map?.setZoom((map.getZoom() || 6) + 1)}
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <div className="h-px w-full bg-white/[0.1]" />
          <button
            className="p-2 sm:p-3.5 text-slate-200 hover:bg-white/[0.1] active:bg-white/[0.15] transition-all"
            onClick={() => map?.setZoom((map.getZoom() || 6) - 1)}
          >
            <Minus size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>

        {/* Locate Me */}
        <button
          className={`bg-[#141820]/80 backdrop-blur-xl border border-white/[0.1] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:bg-white/[0.1] active:scale-95 transition-all shrink-0 ${isLocating ? 'text-blue-400' : 'text-slate-200'}`}
          onClick={onLocateMe}
        >
          <Crosshair size={16} className={`sm:w-[18px] sm:h-[18px] ${isLocating ? 'animate-pulse' : ''}`} />
        </button>

        {/* Explore Cities */}
        <button
          className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all flex items-center justify-center shrink-0 ${showCityPanel ? 'bg-blue-500 text-white' : 'bg-[#141820]/80 backdrop-blur-xl border border-white/[0.1] text-slate-200 hover:bg-white/[0.1]'}`}
          onClick={onToggleCityPanel}
          style={showCityPanel ? { boxShadow: '0 8px 30px rgba(59,130,246,0.4)' } : {}}
        >
          <Globe size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>

        {/* College Quick Access */}
        <button
          className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all flex items-center justify-center shrink-0 ${showCollegePanel ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400/40' : 'bg-[#141820]/80 backdrop-blur-xl border border-white/[0.1] text-slate-200 hover:bg-white/[0.1]'}`}
          onClick={onGoToCollege}
          style={showCollegePanel ? { boxShadow: '0 8px 30px rgba(16,185,129,0.4)' } : {}}
          title="IARE Campus"
        >
          <span className="text-sm sm:text-base">🎓</span>
        </button>

        {/* 3D Toggle */}
        <button
          className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all flex items-center justify-center border shrink-0 ${is3D ? 'bg-gradient-to-br from-violet-600 to-blue-600 border-violet-400/40 text-white shadow-[0_8px_30px_rgba(139,92,246,0.5)]' : 'bg-[#141820]/80 backdrop-blur-xl border-white/[0.1] text-slate-200 hover:bg-white/[0.1]'}`}
          onClick={onToggle3D}
          title={is3D ? 'Exit 3D View' : 'Enter 3D View'}
        >
          <Box size={16} className={`sm:w-[18px] sm:h-[18px] ${is3D ? 'animate-pulse' : ''}`} />
        </button>

        {/* Rotate buttons (only visible in 3D mode) */}
        <AnimatePresence>
          {is3D && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8, height: 0 }}
              animate={{ opacity: 1, x: 0, scale: 1, height: 'auto' }}
              exit={{ opacity: 0, x: 20, scale: 0.8, height: 0 }}
              className="flex flex-col bg-[#141820]/90 backdrop-blur-xl border border-violet-500/30 rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] mt-1 shrink-0"
            >
              <button
                className="p-2 sm:p-3 text-violet-300 hover:bg-violet-500/20 active:bg-violet-500/30 transition-all font-bold"
                onClick={() => onRotate3D(45)}
                title="Rotate Right"
              >
                <RotateCcw size={14} className="sm:w-[16px] sm:h-[16px] scale-x-[-1]" />
              </button>
              <div className="h-px w-full bg-violet-500/20" />
              <button
                className="p-2 sm:p-3 text-violet-300 hover:bg-violet-500/20 active:bg-violet-500/30 transition-all font-bold"
                onClick={() => onRotate3D(-45)}
                title="Rotate Left"
              >
                <RotateCcw size={14} className="sm:w-[16px] sm:h-[16px]" />
              </button>
              <div className="h-px w-full bg-violet-500/20" />
              <button
                className="p-2 sm:p-2.5 text-violet-300 hover:bg-violet-500/20 active:bg-violet-500/30 transition-all flex justify-center items-center"
                onClick={onResetHeading}
                title="Reset Heading"
              >
                <Navigation size={12} className="sm:w-[14px] sm:h-[14px] text-violet-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layers */}
        <div className="relative shrink-0 mt-auto">
          <button
            className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all flex items-center justify-center bg-[#141820]/80 backdrop-blur-xl border border-white/[0.1] text-slate-200 hover:bg-white/[0.1]"
            onClick={onToggleLayers}
          >
            <Layers size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <AnimatePresence>
            {showLayers && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                className="absolute right-[110%] bottom-0 bg-[#141820]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl p-2 shadow-[0_15px_50px_rgba(0,0,0,0.7)] flex flex-col gap-1 w-36 sm:w-44"
              >
                {(['dark', 'light', 'satellite'] as const).map(style => (
                  <button
                    key={style}
                    className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left rounded-xl transition-all font-bold ${mapStyle === style ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/[0.08]'}`}
                    onClick={() => onSetMapStyle(style)}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

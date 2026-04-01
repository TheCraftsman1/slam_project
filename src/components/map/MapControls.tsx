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

/* ── Shared button base ── */
const btnBase = "p-2.5 sm:p-3 rounded-xl sm:rounded-2xl active:scale-90 transition-all duration-200 flex items-center justify-center shrink-0";
const btnDefault = `${btnBase} bg-card border border-border-subtle shadow-minimal text-text-sub hover:bg-white/[0.06] hover:text-text-main`;

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
      <div className="flex flex-col gap-2 sm:gap-2.5 items-end pointer-events-auto overflow-y-auto h-full pr-1 pb-4" style={{ scrollbarWidth: 'none' }}>
        
        {/* ── Live Counter ── */}
        <div className="bg-card border border-border-subtle shadow-minimal rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-elevated flex items-center gap-2 mb-0.5 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
          <span className="text-[9px] sm:text-[10px] font-bold text-text-sub tabular-nums">{stationCount} Live</span>
        </div>

        {/* ── Zoom Controls ── */}
        <div className="flex flex-col bg-card border border-border-subtle shadow-minimal rounded-xl sm:rounded-2xl overflow-hidden shadow-elevated shrink-0">
          <button
            className="p-2 sm:p-3 text-text-sub hover:bg-white/[0.06] hover:text-text-main active:bg-white/[0.1] transition-all"
            onClick={() => map?.setZoom((map.getZoom() || 6) + 1)}
          >
            <Plus size={15} />
          </button>
          <div className="h-px w-full bg-white/[0.06]" />
          <button
            className="p-2 sm:p-3 text-text-sub hover:bg-white/[0.06] hover:text-text-main active:bg-white/[0.1] transition-all"
            onClick={() => map?.setZoom((map.getZoom() || 6) - 1)}
          >
            <Minus size={15} />
          </button>
        </div>

        {/* ── Locate Me ── */}
        <button
          className={`${btnDefault} ${isLocating ? '!text-cyan-400 !border-cyan-500/25' : ''}`}
          onClick={onLocateMe}
        >
          <Crosshair size={15} className={isLocating ? 'animate-pulse' : ''} />
        </button>

        {/* ── Explore Cities ── */}
        <button
          className={showCityPanel
            ? `${btnBase} bg-gradient-to-br from-blue-500 to-blue-600 text-text-main shadow-[0_4px_16px_rgba(59,130,246,0.3)] border border-blue-400/30`
            : btnDefault
          }
          onClick={onToggleCityPanel}
        >
          <Globe size={15} />
        </button>

        {/* ── College Quick Access ── */}
        <button
          className={showCollegePanel
            ? `${btnBase} bg-gradient-to-br from-emerald-500 to-teal-600 text-text-main shadow-[0_4px_16px_rgba(16,185,129,0.3)] border border-emerald-400/30`
            : btnDefault
          }
          onClick={onGoToCollege}
          title="IARE Campus"
        >
          <span className="text-sm">🎓</span>
        </button>

        {/* ── 3D Toggle ── */}
        <button
          className={is3D
            ? `${btnBase} bg-gradient-to-br from-violet-500 to-blue-600 text-text-main shadow-[0_4px_16px_rgba(139,92,246,0.35)] border border-violet-400/30`
            : btnDefault
          }
          onClick={onToggle3D}
          title={is3D ? 'Exit 3D View' : 'Enter 3D View'}
        >
          <Box size={15} className={is3D ? 'animate-pulse' : ''} />
        </button>

        {/* ── Rotate (3D only) ── */}
        <AnimatePresence>
          {is3D && (
            <motion.div
              initial={{ opacity: 0, x: 16, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 16, height: 0 }}
              className="flex flex-col bg-card border border-border-subtle shadow-minimal rounded-xl sm:rounded-2xl overflow-hidden !border-violet-500/20 shrink-0"
            >
              <button
                className="p-2 sm:p-2.5 text-violet-300 hover:bg-violet-500/15 active:bg-violet-500/25 transition-all"
                onClick={() => onRotate3D(45)}
                title="Rotate Right"
              >
                <RotateCcw size={13} className="scale-x-[-1]" />
              </button>
              <div className="h-px w-full bg-violet-500/15" />
              <button
                className="p-2 sm:p-2.5 text-violet-300 hover:bg-violet-500/15 active:bg-violet-500/25 transition-all"
                onClick={() => onRotate3D(-45)}
                title="Rotate Left"
              >
                <RotateCcw size={13} />
              </button>
              <div className="h-px w-full bg-violet-500/15" />
              <button
                className="p-2 sm:p-2.5 text-violet-300 hover:bg-violet-500/15 active:bg-violet-500/25 transition-all flex justify-center"
                onClick={onResetHeading}
                title="Reset Heading"
              >
                <Navigation size={12} className="text-violet-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Layers ── */}
        <div className="relative shrink-0 mt-auto">
          <button className={btnDefault} onClick={onToggleLayers}>
            <Layers size={15} />
          </button>
          <AnimatePresence>
            {showLayers && (
              <motion.div
                initial={{ opacity: 0, x: 16, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-[110%] bottom-0 bg-card border border-border-subtle shadow-minimal rounded-2xl p-1.5 shadow-elevated flex flex-col gap-0.5 w-36 sm:w-40"
              >
                {(['dark', 'light', 'satellite'] as const).map(style => (
                  <button
                    key={style}
                    className={`px-3 py-2.5 text-[12px] text-left rounded-xl transition-all duration-200 font-semibold ${
                      mapStyle === style
                        ? 'bg-cyan-500/12 text-cyan-300 border border-cyan-500/20'
                        : 'text-text-sub hover:bg-white/[0.04] hover:text-text-sub'
                    }`}
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

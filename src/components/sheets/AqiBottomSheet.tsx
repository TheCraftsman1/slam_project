import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MapPin, Clock, Trash2, RefreshCw, ChevronDown, ChevronUp, Navigation, Bot, Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import type { AqiStation, MetricKey, AirQualityData } from '../../types';
import type { AiInsightState } from '../../services/aiService';
import { getAqiColor } from '../../utils';

// Haptic feedback utility
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
};

// Pollutant threshold levels for trend/status indication
const POLLUTANT_THRESHOLDS: Record<string, { good: number; moderate: number; unhealthy: number }> = {
  pm2_5: { good: 12, moderate: 35.4, unhealthy: 55.4 },
  pm10: { good: 54, moderate: 154, unhealthy: 254 },
  ozone: { good: 54, moderate: 70, unhealthy: 85 },
  nitrogen_dioxide: { good: 53, moderate: 100, unhealthy: 360 },
  sulphur_dioxide: { good: 35, moderate: 75, unhealthy: 185 },
  carbon_monoxide: { good: 4400, moderate: 9400, unhealthy: 12400 },
};

// Get pollutant status color and trend
const getPollutantStatus = (key: string, value: number) => {
  const thresholds = POLLUTANT_THRESHOLDS[key];
  if (!thresholds) return { color: 'text-slate-400', bg: 'bg-slate-500/10', status: 'unknown' };

  if (value <= thresholds.good) {
    return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', status: 'good' };
  } else if (value <= thresholds.moderate) {
    return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', status: 'moderate' };
  } else if (value <= thresholds.unhealthy) {
    return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', status: 'unhealthy' };
  }
  return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', status: 'hazardous' };
};

type TrendDirection = 'up' | 'down' | 'flat' | 'none';

const getPollutantTrend = (
  key: keyof AirQualityData,
  currentValue: number,
  previousData?: AirQualityData | null
) => {
  const previousValue = previousData?.[key];
  if (previousValue === undefined || previousValue === null) {
    return { direction: 'none' as TrendDirection, delta: 0 };
  }

  const delta = currentValue - previousValue;
  if (Math.abs(delta) < 0.5) {
    return { direction: 'flat' as TrendDirection, delta };
  }

  return {
    direction: delta > 0 ? ('up' as TrendDirection) : ('down' as TrendDirection),
    delta,
  };
};

interface AqiBottomSheetProps {
  selectedStation: AqiStation | null;
  stations: AqiStation[];
  isExpanded: boolean;
  activeMetric: MetricKey;
  aiInsight: AiInsightState;
  onToggleExpand: () => void;
  onSelectStation: (station: AqiStation) => void;
  onRefreshStation: (stationId: string) => void;
  onRemoveStation: (stationId: string) => void;
  onMetricChange: (metric: MetricKey) => void;
  onPanTo: (lat: number, lng: number) => void;
}

export function AqiBottomSheet({
  selectedStation,
  stations,
  isExpanded,
  activeMetric,
  aiInsight,
  onToggleExpand,
  onSelectStation,
  onRefreshStation,
  onRemoveStation,
  onMetricChange,
  onPanTo,
}: AqiBottomSheetProps) {
  const selectedColors = selectedStation ? getAqiColor(selectedStation.aqi) : getAqiColor(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragY = useMotionValue(0);
  const prevExpandedRef = useRef(isExpanded);

  const pollutantCards = useMemo(() => {
    if (!selectedStation?.airData) return [];

    return [
      { label: 'PM2.5', value: selectedStation.airData.pm2_5, key: 'pm2_5' as const, unit: 'µg/m³' },
      { label: 'PM10', value: selectedStation.airData.pm10, key: 'pm10' as const, unit: 'µg/m³' },
      { label: 'Ozone', value: selectedStation.airData.ozone, key: 'ozone' as const, unit: 'ppb' },
      { label: 'NO₂', value: selectedStation.airData.nitrogen_dioxide, key: 'nitrogen_dioxide' as const, unit: 'ppb' },
      { label: 'SO₂', value: selectedStation.airData.sulphur_dioxide, key: 'sulphur_dioxide' as const, unit: 'ppb' },
      { label: 'CO', value: selectedStation.airData.carbon_monoxide, key: 'carbon_monoxide' as const, unit: 'ppb' },
    ];
  }, [selectedStation?.airData]);

  // Smooth spring for drag feedback
  const dragScale = useTransform(dragY, [-100, 0, 100], [1.02, 1, 0.98]);
  const dragOpacity = useTransform(dragY, [-100, 0, 100], [1, 1, 0.95]);
  const handleWidth = useTransform(dragY, [-50, 0, 50], [56, 48, 40]);
  const springScale = useSpring(dragScale, { stiffness: 400, damping: 30 });

  // Trigger haptic on expand/collapse
  useEffect(() => {
    if (prevExpandedRef.current !== isExpanded) {
      triggerHaptic(isExpanded ? 'medium' : 'light');
      prevExpandedRef.current = isExpanded;
    }
  }, [isExpanded]);

  const handleToggle = useCallback(() => {
    triggerHaptic('light');
    onToggleExpand();
  }, [onToggleExpand]);

  return (
    <motion.div
      className="absolute bottom-[90px] left-4 right-4 z-[500] bg-[#0f1729]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.1] pt-3 pb-6 px-5 shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex flex-col mx-auto max-w-md"
      initial={false}
      animate={{
        height: isExpanded && selectedStation ? 'auto' : '100px',
        borderColor: isDragging ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'
      }}
      style={{ scale: springScale, opacity: dragOpacity }}
      transition={{
        height: { type: 'spring', damping: 34, stiffness: 260, mass: 0.85 },
        borderColor: { duration: 0.15 }
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragMomentum={false}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 520, bounceDamping: 34 }}
      onDragStart={() => {
        setIsDragging(true);
        triggerHaptic('light');
      }}
      onDrag={(e, info) => {
        dragY.set(info.offset.y);
      }}
      onDragEnd={(e, { offset, velocity }) => {
        setIsDragging(false);
        dragY.set(0);

        const projectedOffset = offset.y + velocity.y * 0.08;
        const swipeThreshold = 36;
        const velocityThreshold = 420;

        if (projectedOffset > swipeThreshold || velocity.y > velocityThreshold) {
          if (isExpanded) {
            triggerHaptic('medium');
            onToggleExpand();
          }
        } else if (projectedOffset < -swipeThreshold || velocity.y < -velocityThreshold) {
          if (selectedStation && !isExpanded) {
            triggerHaptic('medium');
            onToggleExpand();
          }
        }
      }}
    >
      {/* Handle with drag feedback */}
      <div className="w-full flex justify-center pb-2 cursor-grab active:cursor-grabbing mb-2" onClick={handleToggle}>
        <motion.div
          className="h-1.5 bg-slate-600/50 rounded-full hover:bg-slate-500 transition-colors"
          style={{ width: handleWidth }}
          animate={{
            backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.6)' : 'rgba(71, 85, 105, 0.5)'
          }}
        />
      </div>

      {selectedStation ? (
        <>
          {/* Selected Location Header */}
          {selectedStation.loading ? (
            /* Skeleton header while loading */
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl skeleton-shimmer shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1">
                <div className="skeleton-shimmer rounded w-20 h-2" />
                <div className="skeleton-shimmer rounded w-40 h-4" />
                <div className="skeleton-shimmer rounded w-28 h-2.5" />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3.5 mb-4 cursor-pointer" onClick={handleToggle}>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${selectedColors.border}`}
                style={{ backgroundColor: `${selectedColors.hex}15` }}
              >
                <span className="text-xl">{selectedColors.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <MapPin size={11} className="text-slate-500" />
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    {selectedStation.isUserLocation ? 'Your Location' : selectedStation.isTapped ? 'Tapped Point' : 'City Station'}
                  </p>
                  {selectedStation.lastFetched && (
                    <span className="text-[9px] text-slate-600 flex items-center gap-0.5 ml-auto">
                      <Clock size={8} />
                      {selectedStation.lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white truncate pr-4">{selectedStation.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${selectedColors.bg}`} />
                  <span className={`${selectedColors.text} font-bold text-xs`}>
                    {`${selectedColors.label} — AQI ${selectedStation.aqi}`}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                {selectedStation.isTapped && (
                  <button
                    className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onRemoveStation(selectedStation.id); }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  className="p-2 text-slate-600 hover:text-blue-400 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onRefreshStation(selectedStation.id); }}
                >
                  <RefreshCw size={16} />
                </button>
                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25 }}
                className="overflow-y-auto max-h-[60vh] pr-1 -mr-1"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {selectedStation.loading ? (
                  /* Skeleton expanded content while loading */
                  <>
                    {/* Skeleton Pollutant Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="border border-white/[0.05] rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5">
                          <div className="skeleton-shimmer rounded w-8 h-2" />
                          <div className="skeleton-shimmer rounded w-6 h-3.5" />
                          <div className="skeleton-shimmer rounded w-10 h-1.5" />
                        </div>
                      ))}
                    </div>

                    {/* Skeleton AI Insight */}
                    <div className="bg-[#0b1120] border border-blue-500/15 rounded-2xl p-4 flex flex-col gap-3 mb-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-50" />
                      <div className="flex items-center gap-2">
                        <div className="skeleton-shimmer rounded-full w-6 h-6" />
                        <div className="skeleton-shimmer rounded w-24 h-2.5" />
                      </div>
                      <div className="ml-1 pl-3 flex flex-col gap-2">
                        <div className="skeleton-shimmer rounded w-full h-2.5" />
                        <div className="skeleton-shimmer rounded w-4/5 h-2.5" />
                        <div className="skeleton-shimmer rounded w-3/5 h-2.5" />
                      </div>
                    </div>

                    {/* Skeleton Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="skeleton-shimmer rounded-2xl h-12" />
                      <div className="skeleton-shimmer rounded-2xl h-12" />
                    </div>
                  </>
                ) : selectedStation.hasError && selectedStation.aqi === 0 ? (
                  /* Error State when data fails to load */
                  <div className="flex flex-col mb-2">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-1">
                        <AlertTriangle className="text-red-400" size={20} />
                      </div>
                      <h4 className="text-sm font-bold text-red-200">Data Unavailable</h4>
                      <p className="text-xs text-red-200/70 max-w-[240px]">
                        We couldn't connect to the environmental sensors for this location. Please try again.
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="bg-white/[0.04] text-slate-300 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm pointer-events-none opacity-50"
                      >
                        <Navigation size={14} />
                        Navigate
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-2xl shadow-[0_4px_15px_rgba(59,130,246,0.2)] transition-colors text-sm flex items-center justify-center gap-2"
                        onClick={() => {
                          triggerHaptic('medium');
                          onRefreshStation(selectedStation.id);
                        }}
                      >
                        <RefreshCw size={14} />
                        Retry Connection
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Pollutant Grid - Enhanced with status colors and trend indicators */}
                    {pollutantCards.length > 0 && (
                      <div className="grid grid-cols-2 gap-2.5 mb-4">
                        {pollutantCards.map((pollutant) => {
                          const isActive = activeMetric === pollutant.key;
                          const status = getPollutantStatus(pollutant.key, pollutant.value || 0);
                          const trend = getPollutantTrend(
                            pollutant.key,
                            pollutant.value || 0,
                            selectedStation.previousAirData
                          );

                          const TrendIcon = trend.direction === 'up'
                            ? TrendingUp
                            : trend.direction === 'down'
                              ? TrendingDown
                              : Minus;

                          const trendColor = trend.direction === 'up'
                            ? 'text-red-400'
                            : trend.direction === 'down'
                              ? 'text-green-400'
                              : 'text-slate-500';

                          return (
                            <motion.button
                              key={pollutant.label}
                              onClick={() => {
                                triggerHaptic('light');
                                onMetricChange(pollutant.key as MetricKey);
                              }}
                              whileTap={{ scale: 0.95 }}
                              className={`relative border rounded-2xl p-3.5 flex flex-col items-start justify-between transition-all overflow-hidden min-h-[88px] ${
                                isActive
                                  ? 'bg-blue-500/15 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                  : `${status.bg} ${status.border} hover:bg-white/[0.06]`
                              }`}
                            >
                              <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                                status.status === 'good' ? 'bg-green-500' :
                                status.status === 'moderate' ? 'bg-yellow-500' :
                                status.status === 'unhealthy' ? 'bg-orange-500' : 'bg-red-500'
                              } ${isActive ? 'opacity-100' : 'opacity-50'}`} />

                              <div className="w-full flex items-center justify-between mb-1.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-blue-300' : 'text-slate-400'}`}>
                                  {pollutant.label}
                                </span>
                                <TrendIcon size={10} className={trendColor} />
                              </div>

                              <div className="w-full flex items-end justify-between gap-2">
                                <span className={`font-bold text-lg tabular-nums ${isActive ? 'text-white' : status.color}`}>
                                  {Math.round(pollutant.value || 0)}
                                </span>
                                <span className="text-[8px] text-slate-500 font-medium mb-0.5">{pollutant.unit}</span>
                              </div>

                              <span className={`text-[9px] font-semibold mt-1 ${trendColor}`}>
                                {trend.direction === 'none'
                                  ? 'No baseline yet'
                                  : `${trend.delta > 0 ? '+' : ''}${Math.round(trend.delta)} vs last`}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {/* Comparison with other stations */}
                    {stations.filter(s => s.id !== selectedStation.id && !s.loading).length > 0 && (
                      <div className="mb-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Compare with nearby</span>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {stations.filter(s => s.id !== selectedStation.id && !s.loading).slice(0, 6).map(s => {
                            const c = getAqiColor(s.aqi);
                            return (
                              <motion.button
                                key={s.id}
                                onClick={() => {
                                  triggerHaptic('light');
                                  onSelectStation(s);
                                  onPanTo(s.lat, s.lng);
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-white/[0.04] border border-white/[0.05] rounded-xl px-3 py-2 flex flex-col items-center shrink-0 hover:bg-white/[0.07] transition-colors"
                              >
                                <span className="text-[9px] font-bold text-slate-400 truncate max-w-[60px]">{s.name}</span>
                                <span className={`text-sm font-bold ${c.text} tabular-nums`}>{s.aqi}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* EcoBot Live Local AI Insight */}
                    <div className="bg-[#0b1120] border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)_inset] rounded-2xl p-4 flex flex-col gap-3 mb-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center relative">
                            <Bot className="text-blue-400" size={14} />
                            {aiInsight.loading && <div className="absolute inset-0 rounded-full border border-blue-400 border-t-transparent animate-spin" />}
                          </div>
                          <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            Local AI Core
                          </span>
                        </div>

                        {!aiInsight.loading && (
                          <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[8px] font-bold text-green-400 uppercase tracking-wider">Active</span>
                          </div>
                        )}
                      </div>

                      <div className="ml-1 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-blue-500/30" />

                        <p className="text-xs leading-relaxed text-blue-100/90 pl-3 font-mono">
                          {aiInsight.loading ? (
                            <span className="flex flex-col gap-2">
                              <span className="skeleton-shimmer rounded w-full h-2.5 block" />
                              <span className="skeleton-shimmer rounded w-4/5 h-2.5 block" />
                              <span className="skeleton-shimmer rounded w-2/3 h-2.5 block" />
                            </span>
                          ) : (
                            aiInsight.text
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => triggerHaptic('medium')}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-colors text-sm"
                      >
                        <Navigation size={14} />
                        Navigate
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold py-3 rounded-2xl border border-white/[0.08] transition-colors text-sm flex items-center justify-center gap-2"
                        onClick={() => {
                          triggerHaptic('light');
                          onRefreshStation(selectedStation.id);
                        }}
                      >
                        <RefreshCw size={14} />
                        Refresh
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* No station selected */
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <MapPin size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Tap any location</p>
            <p className="text-[11px] text-slate-500">Click anywhere on map or search a city to see live AQI</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

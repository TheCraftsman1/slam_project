import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Rounded rectangle skeleton placeholder with shimmer animation */
export function SkeletonLine({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded-md ${className}`}
      style={{ height: '12px', ...style }}
    />
  );
}

/** Circular skeleton placeholder with shimmer animation */
export function SkeletonCircle({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded-full aspect-square ${className}`}
      style={{ width: '40px', height: '40px', ...style }}
    />
  );
}

/** Card-shaped skeleton placeholder with shimmer animation */
export function SkeletonCard({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl ${className}`}
      style={{ height: '60px', ...style }}
    />
  );
}

/** A skeleton representation of a pollutant grid item */
export function SkeletonPollutantGrid() {
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="border border-white/[0.05] rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5"
        >
          <SkeletonLine className="w-8" style={{ height: '8px' }} />
          <SkeletonLine className="w-6" style={{ height: '14px' }} />
          <SkeletonLine className="w-10" style={{ height: '6px' }} />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for the AI insight section */
export function SkeletonAiInsight() {
  return (
    <div className="bg-[#0b1120] border border-blue-500/15 rounded-2xl p-4 flex flex-col gap-3 mb-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-50" />
      <div className="flex items-center gap-2">
        <SkeletonCircle style={{ width: '24px', height: '24px' }} />
        <SkeletonLine className="w-24" style={{ height: '10px' }} />
      </div>
      <div className="ml-1 pl-3 flex flex-col gap-2">
        <SkeletonLine className="w-full" style={{ height: '10px' }} />
        <SkeletonLine className="w-4/5" style={{ height: '10px' }} />
        <SkeletonLine className="w-3/5" style={{ height: '10px' }} />
      </div>
    </div>
  );
}

/** Skeleton for the bottom sheet header */
export function SkeletonBottomSheetHeader() {
  return (
    <div className="flex items-start gap-3.5 mb-4">
      <SkeletonCircle className="shrink-0" style={{ width: '48px', height: '48px', borderRadius: '16px' }} />
      <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1">
        <SkeletonLine className="w-20" style={{ height: '8px' }} />
        <SkeletonLine className="w-40" style={{ height: '16px' }} />
        <SkeletonLine className="w-28" style={{ height: '10px' }} />
      </div>
    </div>
  );
}

/** Full HomeScreen skeleton for initial load */
export function SkeletonHomeScreen() {
  return (
    <div className="min-h-full bg-[#0b1120] flex flex-col items-center px-5 pt-6 pb-32 relative overflow-hidden font-display animate-in fade-in duration-300">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-20%] w-[60%] h-[50%] rounded-full blur-[140px] bg-slate-500/[0.06]" />
        <div className="absolute bottom-[10%] left-[-15%] w-[50%] h-[40%] bg-blue-500/[0.04] rounded-full blur-[120px]" />
      </div>

      {/* Header skeleton */}
      <header className="w-full flex items-center justify-between mb-6 z-10">
        <SkeletonCircle style={{ width: '44px', height: '44px', borderRadius: '16px' }} />
        <div className="flex flex-col items-center gap-1.5">
          <SkeletonLine className="w-24" style={{ height: '8px' }} />
          <SkeletonLine className="w-32" style={{ height: '14px' }} />
        </div>
        <SkeletonCircle style={{ width: '44px', height: '44px', borderRadius: '16px' }} />
      </header>

      {/* AQI Gauge skeleton */}
      <div className="relative flex items-center justify-center w-72 h-72 mt-2 z-10">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
        </svg>
        <div className="flex flex-col items-center gap-2 z-10">
          <SkeletonLine className="w-24" style={{ height: '48px', borderRadius: '12px' }} />
          <SkeletonLine className="w-14" style={{ height: '10px' }} />
          <SkeletonLine className="w-20" style={{ height: '14px', borderRadius: '999px' }} />
        </div>
      </div>

      {/* Health Advice skeleton */}
      <div className="w-full max-w-md mt-4 mb-5 z-10">
        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <SkeletonCircle style={{ width: '18px', height: '18px' }} />
          <div className="flex-1 flex flex-col gap-1.5">
            <SkeletonLine className="w-full" style={{ height: '10px' }} />
            <SkeletonLine className="w-3/4" style={{ height: '10px' }} />
          </div>
        </div>
      </div>

      {/* Weather Strip skeleton */}
      <div className="w-full max-w-md glass-card rounded-2xl p-4 mb-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonCircle style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
            <div className="flex flex-col gap-1.5">
              <SkeletonLine className="w-16" style={{ height: '20px' }} />
              <SkeletonLine className="w-24" style={{ height: '10px' }} />
            </div>
          </div>
          <div className="flex gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <SkeletonCircle style={{ width: '14px', height: '14px' }} />
                <SkeletonLine className="w-8" style={{ height: '10px' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pollutant Cards skeleton */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md z-10">
        {[0, 1].map(i => (
          <div key={i} className="glass-card p-4 rounded-2xl flex flex-col gap-2">
            <SkeletonLine className="w-10" style={{ height: '8px' }} />
            <SkeletonLine className="w-12" style={{ height: '20px' }} />
            <SkeletonLine className="w-full" style={{ height: '6px', marginTop: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

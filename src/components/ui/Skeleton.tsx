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
    <div className="bg-[#0a0f1a] border border-cyan-500/12 rounded-2xl p-4 flex flex-col gap-3 mb-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent opacity-50" />
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
    <div className="min-h-full flex flex-col items-center px-6 pt-12 pb-32 w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="w-full flex-col items-start mb-6 max-w-md">
        <SkeletonLine className="w-16 mb-2" style={{ height: '10px' }} />
        <SkeletonLine className="w-48" style={{ height: '36px' }} />
      </div>

      {/* Hero AQI Card */}
      <div className="w-full max-w-md bg-card border border-border-subtle rounded-[32px] h-[320px] mb-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-surface/40 animate-pulse" />
        <SkeletonLine className="w-12 mb-4" style={{ height: '12px' }} />
        <SkeletonLine className="w-32 mb-6" style={{ height: '100px', borderRadius: '16px' }} />
        <SkeletonLine className="w-24 mb-6" style={{ height: '28px', borderRadius: '99px' }} />
        <SkeletonLine className="w-48" style={{ height: '14px' }} />
      </div>

      {/* Stats Row */}
      <div className="w-full max-w-md grid grid-cols-3 gap-3 mb-8">
        {[0, 1, 2].map(i => (
          <div key={i} className="card-minimal h-[90px] flex flex-col items-center justify-center p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-surface/40 animate-pulse" />
            <SkeletonLine className="w-10 mb-2" style={{ height: '10px' }} />
            <SkeletonLine className="w-12" style={{ height: '24px' }} />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md grid grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <SkeletonLine key={i} className="w-full" style={{ height: '56px', borderRadius: '16px' }} />
        ))}
      </div>
    </div>
  );
}

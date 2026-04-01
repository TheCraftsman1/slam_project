import React from 'react';
import { MapPin, Wind, Navigation, AlertTriangle, ShieldCheck, MessageSquare, RefreshCcw, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAqiData } from '../hooks';
import { SkeletonHomeScreen } from './ui';

export function HomeScreen({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const { stations, selectedStation, initProgress, refreshLocation } = useAqiData();
  const station = selectedStation || stations.find(s => s.isUserLocation) || stations[0];

  if (!initProgress.done || (!station && stations.length === 0) || (station && station.loading)) {
    return <SkeletonHomeScreen />;
  }

  if (!station || station.hasError || !station.airData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full">
        <AlertTriangle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-text-main">Data Unavailable</h2>
        <p className="text-text-sub text-sm">We couldn't fetch the latest air quality data. Please try again later.</p>
      </div>
    );
  }

  const aqi = station.aqi;
  const pm25 = station.airData.pm2_5 || 0;
  const wind = 12; // Placeholder as no wind data in AirQualityData
  const uv = 6;    // Placeholder as no UV data in AirQualityData
  const isOfflineData = false;

  // Determine gradient, status, and advice based on AQI
  let gradientClass = 'gradient-good';
  let statusText = 'Good';
  let advice = "Perfect day for a walk outdoors.";
  
  if (aqi > 300) {
    gradientClass = 'gradient-hazardous'; statusText = 'Hazardous'; advice = "Health warning of emergency conditions.";
  } else if (aqi > 200) {
    gradientClass = 'gradient-unhealthy'; statusText = 'Very Unhealthy'; advice = "Health alert: everyone may experience more serious health effects.";
  } else if (aqi > 150) {
    gradientClass = 'gradient-unhealthy'; statusText = 'Unhealthy'; advice = "Everyone may begin to experience health effects.";
  } else if (aqi > 100) {
    gradientClass = 'gradient-sensitive'; statusText = 'Unhealthy for Sensitive Groups'; advice = "Members of sensitive groups may experience health effects.";
  } else if (aqi > 50) {
    gradientClass = 'gradient-moderate'; statusText = 'Moderate'; advice = "Air quality is acceptable; however, there may be some health concern.";
  }

  return (
    <div className="min-h-full flex flex-col items-center px-6 pt-12 pb-32">
      {/* Header */}
      <div className="w-full flex-col items-start mb-6 max-w-md">
        <span className="text-[11px] font-black uppercase tracking-widest text-accent mb-1 block">Outdoor</span>
        <div className="flex items-center justify-between w-full">
          <h1 className="text-4xl font-display font-bold tracking-tight text-text-main flex items-center gap-2">
            {station?.name?.split(',')[0] || 'Unknown'}
            <MapPin size={22} className="text-accent" />
          </h1>
          <button 
            onClick={() => refreshLocation()}
            disabled={!initProgress.done}
            className="w-10 h-10 rounded-full bg-card border border-border-subtle flex items-center justify-center text-text-sub hover:text-accent transition-all active:scale-90 disabled:opacity-50"
            title="Reload Location"
          >
            {!initProgress.done ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCcw size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Hero AQI Card */}
      <motion.div
        onClick={() => onNavigate('details')}
        className={`cursor-pointer w-full max-w-md ${gradientClass} rounded-[32px] p-8 flex flex-col items-center justify-center shadow-minimal mb-6 relative overflow-hidden transition-transform active:scale-[0.98]`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col items-center text-white z-10">
          <span className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">AQI</span>
          <h2 className="text-[110px] sm:text-[120px] font-display font-bold leading-none tracking-tighter mix-blend-overlay">
            {aqi}
          </h2>
          <div className="bg-black/15 backdrop-blur-md px-4 py-1.5 rounded-full mt-4 mb-6 transition-transform hover:scale-105">
            <span className="text-sm font-bold tracking-wide">{statusText}</span>
          </div>
          <p className="text-center text-sm font-medium opacity-90 max-w-[260px] leading-relaxed">
            {advice}
          </p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="w-full max-w-md grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'PM2.5', value: typeof pm25 === 'number' ? pm25.toFixed(1) : pm25, unit: 'µg' },
          { label: 'Wind', value: typeof wind === 'number' ? Math.round(wind) : wind, unit: 'km/h' },
          { label: 'UV', value: typeof uv === 'number' ? Math.round(uv) : uv, unit: 'idx' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="card-minimal flex flex-col items-center justify-center py-5 px-2 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 + (i * 0.05) }}
          >
            <span className="text-[11px] font-bold text-text-sub uppercase tracking-wider mb-2">{stat.label}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-display text-text-main">{stat.value}</span>
              <span className="text-[10px] font-semibold text-text-sub">{stat.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md grid grid-cols-2 gap-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onNavigate('map')}
          className="bg-card hover:bg-border-subtle border border-border-strong text-text-main font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
        >
          <Navigation size={18} className="text-text-sub" />
          View Map
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onNavigate('assistant')}
          className="bg-text-main hover:bg-text-main/90 text-text-inverse font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
        >
          <MessageSquare size={18} className="text-text-inverse/80" />
          Ask EcoBot
        </motion.button>
      </div>
      
      {/* Offline Mode Indicator */}
      {isOfflineData && (
        <div className="mt-8 flex items-center gap-2 text-text-sub bg-card px-4 py-2 rounded-full border border-border-subtle shadow-sm">
          <Wind size={14} className="animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Using Cached Data</span>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RefreshCw, Calendar, Loader2, AlertTriangle, Wind } from 'lucide-react';
import { useAqiData } from '../hooks';
import { fetchHistoricalAqi } from '../services/aqiService';
import { format, subDays } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function LocationDetailScreen({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const { stations, selectedStation } = useAqiData();
  const station = selectedStation || stations.find(s => s.isUserLocation) || stations[0];

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!station) return;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const endDate = format(new Date(), 'yyyy-MM-dd');
        const startDate = format(subDays(new Date(), 2), 'yyyy-MM-dd'); // fetch last 2 days
        
        const { data, error } = await fetchHistoricalAqi(station!.lat, station!.lng, startDate, endDate);
        
        if (error) {
          setError(error);
          return;
        }

        if (data && data.time && data.us_aqi) {
          const formatted = data.time.map((t: string, i: number) => ({
            time: new Date(t),
            displayTime: format(new Date(t), 'ha'),
            aqi: data.us_aqi[i],
            pm2_5: data.pm2_5[i],
          })).filter((d: any) => d.aqi !== null && d.aqi !== undefined);
          
          // Slice only the last 24 hours
          const last24 = formatted.slice(-24);
          setHistory(last24);
        }
      } catch (err) {
        console.error("Failed to load historical data", err);
        setError("Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [station]);

  if (!station) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full">
        <p className="text-text-sub">No location selected</p>
        <button onClick={() => onNavigate('home')} className="mt-4 px-4 py-2 bg-card rounded-xl text-text-main font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const aqi = station.aqi;
  let gradientClass = 'gradient-good';
  let statusText = 'Good';

  if (aqi > 300) { gradientClass = 'gradient-hazardous'; statusText = 'Hazardous'; }
  else if (aqi > 200) { gradientClass = 'gradient-unhealthy'; statusText = 'Very Unhealthy'; }
  else if (aqi > 150) { gradientClass = 'gradient-unhealthy'; statusText = 'Unhealthy'; }
  else if (aqi > 100) { gradientClass = 'gradient-sensitive'; statusText = 'Unhealthy for Sensitive'; }
  else if (aqi > 50) { gradientClass = 'gradient-moderate'; statusText = 'Moderate'; }

  return (
    <div className="min-h-full flex flex-col relative bg-surface text-text-main">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 z-10 bg-surface/80 backdrop-blur-md sticky top-0 border-b border-border-subtle">
        <button onClick={() => onNavigate('home')} className="p-2 rounded-full hover:bg-card text-text-main transition-colors">
          <ArrowLeft size={24} />
        </button>
        <span className="font-bold tracking-wide truncate px-2">{station.name.split(',')[0]}</span>
        <button disabled={loading} className="p-2 rounded-full hover:bg-card text-text-sub transition-colors">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
        {/* Main Current Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full ${gradientClass} rounded-3xl p-6 text-white shadow-minimal mb-6`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Current AQI</span>
            {station.isUserLocation && <span className="px-2 py-1 bg-black/20 rounded-full text-[10px] font-bold">Your Location</span>}
          </div>
          <div className="flex items-end gap-3 mb-2">
            <span className="text-6xl font-display font-black leading-none">{aqi}</span>
            <div className="mb-1.5 flex flex-col">
              <span className="text-lg font-bold">{statusText}</span>
              <span className="text-xs opacity-90">Live updated</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] uppercase opacity-70 mb-1">PM2.5</p>
              <p className="text-sm font-bold">{station.airData?.pm2_5 ?? '--'} µg/m³</p>
            </div>
            <div>
              <p className="text-[10px] uppercase opacity-70 mb-1">PM10</p>
              <p className="text-sm font-bold">{station.airData?.pm10 ?? '--'} µg/m³</p>
            </div>
            <div>
              <p className="text-[10px] uppercase opacity-70 mb-1">O3</p>
              <p className="text-sm font-bold">{station.airData?.ozone ?? '--'} ppb</p>
            </div>
          </div>
        </motion.div>

        {/* Historical Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl p-5 shadow-sm border border-border-subtle mb-6"
        >
          <div className="flex items-center gap-2 mb-6 text-text-main">
            <Calendar size={18} className="text-accent" />
            <h3 className="font-bold text-lg text-text-main">Past 24 Hours</h3>
          </div>
          
          {loading ? (
            <div className="h-48 flex items-center justify-center flex-col gap-2 opacity-50">
              <Loader2 className="animate-spin text-text-sub" size={24} />
              <p className="text-sm text-text-sub">Loading history...</p>
            </div>
          ) : error ? (
            <div className="h-48 flex items-center justify-center flex-col gap-2 text-red-400">
              <AlertTriangle size={24} />
              <p className="text-sm">Failed to load chart data</p>
            </div>
          ) : history.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-text-sub">No historical data available</p>
            </div>
          ) : (
            <div className="h-56 w-full -ml-4 mt-2 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="aqiColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis 
                    dataKey="displayTime" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    dy={10}
                    interval="preserveStartEnd"
                    minTickGap={20}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="aqi" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#aqiColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Detailed Pollutants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="font-bold text-lg mb-4 text-text-main pl-1 flex items-center gap-2">
            <Wind size={18} className="text-accent" />
            Air Composition
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'CO', val: station.airData?.carbon_monoxide, max: 10000, unit: 'ppb' },
              { label: 'NO2', val: station.airData?.nitrogen_dioxide, max: 100, unit: 'ppb' },
              { label: 'SO2', val: station.airData?.sulphur_dioxide, max: 75, unit: 'ppb' },
              { label: 'O3', val: station.airData?.ozone, max: 70, unit: 'ppb' }
            ].map((p, i) => (
              <div key={p.label} className="bg-card p-4 rounded-2xl border border-border-subtle hover:border-border-strong transition-colors group">
                <p className="text-xs font-bold text-text-sub mb-1">{p.label}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <p className="text-xl font-display font-bold text-text-main group-hover:text-accent transition-colors">
                    {p.val !== undefined ? Math.round(p.val) : '--'}
                  </p>
                  <span className="text-[10px] text-text-sub font-medium">{p.unit}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-accent h-full rounded-full" 
                    style={{ width: `${Math.min(((p.val || 0) / p.max) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

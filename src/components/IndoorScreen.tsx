import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Wind, Home, Thermometer, Droplets, Activity, Zap, Eye, Settings, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Room {
  id: string;
  name: string;
  aqi: number;
  co2: number;
  temp: number;
  humidity: number;
  status: string;
  alert?: string;
  icon: 'warning' | 'home' | 'wind';
  purifierOn: boolean;
}

const getIndoorAqiInfo = (aqi: number) => {
  if (aqi > 100) return { label: 'Poor', color: 'orange', hex: '#f97316', textClass: 'text-orange-400', borderClass: 'border-orange-500/30', bgClass: 'bg-orange-500', glowClass: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]' };
  if (aqi > 50) return { label: 'Moderate', color: 'yellow', hex: '#eab308', textClass: 'text-yellow-400', borderClass: 'border-yellow-500/30', bgClass: 'bg-yellow-500', glowClass: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]' };
  return { label: 'Good', color: 'green', hex: '#22c55e', textClass: 'text-green-400', borderClass: 'border-green-500/30', bgClass: 'bg-green-500', glowClass: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]' };
};

const initialRooms: Room[] = [
  { id: 'kitchen', name: 'Kitchen', aqi: 110, co2: 850, temp: 26, humidity: 55, status: 'Elevated VOCs', alert: 'Smoke detected — turn on exhaust fan.', icon: 'warning', purifierOn: false },
  { id: 'master', name: 'Master Bedroom', aqi: 20, co2: 420, temp: 23, humidity: 48, status: 'CO₂ Normal', icon: 'home', purifierOn: false },
  { id: 'living', name: 'Living Room', aqi: 15, co2: 380, temp: 24, humidity: 45, status: 'Purifier Active', icon: 'wind', purifierOn: true },
  { id: 'bathroom', name: 'Bathroom', aqi: 35, co2: 500, temp: 25, humidity: 72, status: 'Humidity High', icon: 'wind', purifierOn: false },
];

export function IndoorScreen() {
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [overallAqi, setOverallAqi] = useState(35);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate real-time fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setRooms(prev => prev.map(room => ({
        ...room,
        aqi: Math.max(5, room.aqi + Math.floor(Math.random() * 5) - 2),
        co2: Math.max(300, room.co2 + Math.floor(Math.random() * 20) - 10),
        temp: room.temp + (Math.random() - 0.5) * 0.5,
        humidity: Math.max(30, Math.min(80, room.humidity + Math.floor(Math.random() * 3) - 1)),
      })));
      setLastUpdated(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const avg = Math.round(rooms.reduce((s, r) => s + r.aqi, 0) / rooms.length);
    setOverallAqi(avg);
  }, [rooms]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRooms(prev => prev.map(room => ({
      ...room,
      aqi: Math.max(5, room.aqi + Math.floor(Math.random() * 10) - 5),
    })));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const togglePurifier = (roomId: string) => {
    setRooms(prev => prev.map(room =>
      room.id === roomId ? { ...room, purifierOn: !room.purifierOn } : room
    ));
  };

  const overallInfo = getIndoorAqiInfo(overallAqi);
  const alertRoom = rooms.find(r => r.alert);

  const RoomIcon = ({ type, className }: { type: string; className?: string }) => {
    if (type === 'warning') return <AlertTriangle className={className} size={22} />;
    if (type === 'home') return <Home className={className} size={22} />;
    return <Wind className={className} size={22} />;
  };

  return (
    <div className="min-h-full bg-[#0b1120] text-white px-5 pt-8 pb-32 font-display">
      {/* Header */}
      <motion.header className="flex justify-between items-center mb-8" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Home</h1>
          <p className="text-slate-500 text-sm mt-0.5">Indoor Air Quality Monitor</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center active:scale-95 transition-transform">
            <RefreshCw size={16} className={`text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center active:scale-95 transition-transform">
            <Settings size={16} className="text-slate-400" />
          </button>
        </div>
      </motion.header>

      {/* Overall AQI Banner */}
      <motion.div
        className={`glass-card ${overallInfo.borderClass} p-5 rounded-3xl flex items-center gap-4 ${overallInfo.glowClass} mb-5`}
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
      >
        <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: `${overallInfo.hex}15` }}>
          <CheckCircle2 className={overallInfo.textClass} size={28} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-lg">Overall Air Quality</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`${overallInfo.textClass} font-bold text-sm`}>{overallInfo.label}</span>
            <span className="text-slate-500 text-sm">—</span>
            <span className="text-white font-bold text-sm tabular-nums">AQI {overallAqi}</span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full border-4 ${overallInfo.borderClass} flex items-center justify-center`}>
            <span className={`text-lg font-black ${overallInfo.textClass} tabular-nums`}>{overallAqi}</span>
          </div>
        </div>
      </motion.div>

      {/* Live Indicator */}
      <motion.div className="flex items-center justify-between mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-500 font-semibold">Live Monitoring</span>
        </div>
        <span className="text-[10px] text-slate-600">Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </motion.div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {rooms.map((room, i) => {
          const roomInfo = getIndoorAqiInfo(room.aqi);
          return (
            <motion.button
              key={room.id}
              className={`glass-card ${roomInfo.borderClass} p-4 rounded-3xl ${roomInfo.glowClass} text-left active:scale-[0.97] transition-transform ${room.id === 'kitchen' ? 'col-span-2 sm:col-span-1' : ''}`}
              onClick={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.08 }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${roomInfo.hex}15` }}>
                  <RoomIcon type={room.icon} className={roomInfo.textClass} />
                </div>
                {room.alert && (
                  <div className="flex h-5 w-5 items-center justify-center bg-red-500 rounded-full animate-pulse">
                    <AlertTriangle size={12} className="text-white" />
                  </div>
                )}
                {room.purifierOn && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/15 rounded-full">
                    <Zap size={10} className="text-green-400" />
                    <span className="text-[9px] text-green-400 font-bold">ON</span>
                  </div>
                )}
              </div>
              <h3 className="text-base font-bold">{room.name}</h3>
              <p className={`${roomInfo.textClass} text-sm font-bold mt-1 tabular-nums`}>AQI: {room.aqi}</p>
              <p className="text-slate-500 text-xs mt-0.5">{room.status}</p>

              {/* Mini stats */}
              <div className="flex gap-3 mt-3 pt-3 border-t border-white/[0.05]">
                <div className="flex items-center gap-1">
                  <Thermometer size={10} className="text-slate-500" />
                  <span className="text-[10px] text-slate-400 tabular-nums">{Math.round(room.temp)}°C</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplets size={10} className="text-slate-500" />
                  <span className="text-[10px] text-slate-400 tabular-nums">{room.humidity}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity size={10} className="text-slate-500" />
                  <span className="text-[10px] text-slate-400 tabular-nums">{room.co2} ppm</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Room Detail Expansion */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div
            className="glass-card border-blue-500/20 rounded-3xl p-5 mb-5"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{selectedRoom.name} Details</h3>
              <button onClick={() => setSelectedRoom(null)} className="text-slate-500 hover:text-white transition-colors">
                <Eye size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Activity size={16} className="text-blue-400" />} label="CO₂ Level" value={`${selectedRoom.co2} ppm`} hint={selectedRoom.co2 > 800 ? 'Above normal' : 'Normal range'} />
              <StatCard icon={<Thermometer size={16} className="text-orange-400" />} label="Temperature" value={`${Math.round(selectedRoom.temp)}°C`} hint="Indoor" />
              <StatCard icon={<Droplets size={16} className="text-cyan-400" />} label="Humidity" value={`${selectedRoom.humidity}%`} hint={selectedRoom.humidity > 65 ? 'High' : 'Comfortable'} />
              <StatCard icon={<Wind size={16} className="text-green-400" />} label="Purifier" value={selectedRoom.purifierOn ? 'Active' : 'Off'} hint={<button onClick={() => togglePurifier(selectedRoom.id)} className="text-blue-400 underline text-[10px]">{selectedRoom.purifierOn ? 'Turn Off' : 'Turn On'}</button>} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EcoBot Alert */}
      <AnimatePresence>
        {alertRoom && (
          <motion.div
            className="glass-card border-orange-500/20 p-4 rounded-3xl flex items-start gap-3"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-9 h-9 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
              <span className="text-blue-400 font-black text-xs">EB</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">EcoBot Alert</p>
              <p className="text-sm text-slate-300 leading-relaxed">{alertRoom.alert}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span></div>
      <span className="text-white font-bold text-sm">{value}</span>
      <div className="text-[10px] text-slate-500 mt-0.5">{hint}</div>
    </div>
  );
}

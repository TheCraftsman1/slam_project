import { useState, useEffect, useRef } from 'react';
import { Menu, MapPin, Bell, Wind, Droplets, Sun, Cloud, CloudRain, Shield, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SkeletonHomeScreen } from './ui';

interface AqiData {
  aqi: number;
  pm25: number;
  pm10: number;
  ozone: number;
  no2: number;
  so2: number;
  co: number;
  status: string;
  color: string;
  hex: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  feelsLike: number;
  uvIndex: number;
}

const getAqiInfo = (aqi: number) => {
  if (aqi > 300) return { status: 'Hazardous', color: 'purple', hex: '#a855f7', advice: 'Everyone should avoid all outdoor activity.' };
  if (aqi > 200) return { status: 'Very Unhealthy', color: 'purple', hex: '#a855f7', advice: 'Health alert: everyone may experience health effects.' };
  if (aqi > 150) return { status: 'Unhealthy', color: 'red', hex: '#ef4444', advice: 'Everyone may begin to experience health effects.' };
  if (aqi > 100) return { status: 'Sensitive Groups', color: 'orange', hex: '#f97316', advice: 'Sensitive groups should reduce prolonged outdoor exertion.' };
  if (aqi > 50) return { status: 'Moderate', color: 'yellow', hex: '#eab308', advice: 'Air quality is acceptable for most people.' };
  return { status: 'Good', color: 'green', hex: '#22c55e', advice: 'Air quality is satisfactory. Enjoy outdoor activities!' };
};

export function HomeScreen() {
  const [locationName, setLocationName] = useState('Detecting...');
  const [aqiData, setAqiData] = useState<AqiData>({
    aqi: 0, pm25: 0, pm10: 0, ozone: 0, no2: 0, so2: 0, co: 0,
    status: 'Loading...', color: 'gray', hex: '#64748b'
  });
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 0, humidity: 0, windSpeed: 0, condition: 'Loading',
    feelsLike: 0, uvIndex: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);

  async function fetchWeather(lat: number, lon: number) {
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=uv_index_max&timezone=auto`);
      const data = await response.json();
      if (data?.current) {
        const code = data.current.weather_code;
        let condition = 'Sunny';
        if (code >= 61) condition = 'Rainy';
        else if (code >= 45) condition = 'Foggy';
        else if (code >= 2) condition = 'Cloudy';
        else if (code >= 1) condition = 'Partly Cloudy';
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          humidity: Math.round(data.current.relative_humidity_2m),
          windSpeed: Math.round(data.current.wind_speed_10m),
          condition,
          feelsLike: Math.round(data.current.apparent_temperature),
          uvIndex: data.daily?.uv_index_max?.[0] ? Math.round(data.daily.uv_index_max[0]) : 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch weather:", error);
    }
  }

  async function fetchAQI(lat: number, lon: number) {
    try {
      const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`);
      const data = await response.json();
      if (data?.current) {
        const aqi = Math.round(data.current.us_aqi);
        const info = getAqiInfo(aqi);
        setAqiData({
          aqi,
          pm25: Math.round(data.current.pm2_5 || 0),
          pm10: Math.round(data.current.pm10 || 0),
          ozone: Math.round(data.current.ozone || 0),
          no2: Math.round(data.current.nitrogen_dioxide || 0),
          so2: Math.round(data.current.sulphur_dioxide || 0),
          co: Math.round(data.current.carbon_monoxide || 0),
          status: info.status, color: info.color, hex: info.hex
        });
        setLastUpdated(new Date());
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error("Failed to fetch AQI data:", error);
      setIsInitialLoad(false);
    }
  }

  async function fetchCityName(lat: number, lon: number) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      if (data?.address) {
        setLocationName(data.address.city || data.address.town || data.address.village || data.address.county || 'Current Location');
      } else setLocationName('Current Location');
    } catch { setLocationName('Current Location'); }
  }

  const refreshData = async () => {
    if (!coordsRef.current) return;
    setIsRefreshing(true);
    const { lat, lon } = coordsRef.current;
    await Promise.all([fetchAQI(lat, lon), fetchWeather(lat, lon)]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    const fallback = () => {
      setLocationName('New York City');
      coordsRef.current = { lat: 40.7128, lon: -74.006 };
      fetchAQI(40.7128, -74.006);
      fetchWeather(40.7128, -74.006);
    };
    if (!("geolocation" in navigator)) { fallback(); return; }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        coordsRef.current = { lat, lon };
        fetchAQI(lat, lon);
        fetchCityName(lat, lon);
        fetchWeather(lat, lon);
      },
      fallback
    );

    const intervalId = setInterval(() => {
      if (coordsRef.current) {
        fetchAQI(coordsRef.current.lat, coordsRef.current.lon);
        fetchWeather(coordsRef.current.lat, coordsRef.current.lon);
      }
    }, 3 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const textColorMap: Record<string, string> = {
    green: 'text-green-400', yellow: 'text-yellow-400', orange: 'text-orange-400',
    red: 'text-red-400', purple: 'text-purple-400', gray: 'text-slate-400'
  };
  const bgColorMap: Record<string, string> = {
    green: 'bg-green-500', yellow: 'bg-yellow-500', orange: 'bg-orange-500',
    red: 'bg-red-500', purple: 'bg-purple-500', gray: 'bg-slate-500'
  };
  const textColor = textColorMap[aqiData.color] || 'text-green-400';
  const bgColor = bgColorMap[aqiData.color] || 'bg-green-500';
  const info = getAqiInfo(aqiData.aqi);
  const aqiPercent = Math.min(100, (aqiData.aqi / 500) * 100);
  const pm25Percent = Math.min(100, (aqiData.pm25 / 75) * 100);
  const pm10Percent = Math.min(100, (aqiData.pm10 / 150) * 100);
  const WeatherIcon = weather.condition === 'Rainy' ? CloudRain : weather.condition === 'Cloudy' ? Cloud : Sun;

  // Show skeleton on initial load
  if (isInitialLoad) {
    return <SkeletonHomeScreen />;
  }

  return (
    <div className="min-h-full bg-[#0b1120] flex flex-col items-center px-5 pt-6 pb-32 relative overflow-hidden font-display">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-20%] w-[60%] h-[50%] rounded-full blur-[140px] transition-colors duration-[2000ms]" style={{ backgroundColor: `${aqiData.hex}15` }} />
        <div className="absolute bottom-[10%] left-[-15%] w-[50%] h-[40%] bg-blue-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[25%] bg-cyan-500/[0.04] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="w-full flex items-center justify-between mb-6 z-10">
        <button className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm active:scale-95 transition-transform">
          <Menu size={20} className="text-slate-300" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Current Location</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin size={14} className="text-blue-400" />
            <span className="font-bold text-sm text-white">{locationName}</span>
          </div>
        </div>
        <button className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm relative active:scale-95 transition-transform">
          <Bell size={20} className="text-slate-300" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-[#0b1120]" />
        </button>
      </header>

      {/* AQI Gauge */}
      <motion.div
        className="relative flex items-center justify-center w-72 h-72 mt-2 z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
          <motion.circle
            cx="100" cy="100" r="85" fill="none" stroke={aqiData.hex} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${aqiPercent * 5.34} 534`}
            initial={{ strokeDasharray: "0 534" }}
            animate={{ strokeDasharray: `${aqiPercent * 5.34} 534` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 12px ${aqiData.hex}66)` }}
          />
        </svg>
        <div className="absolute w-48 h-48 rounded-full transition-all duration-1000" style={{
          background: `radial-gradient(circle, ${aqiData.hex}12 0%, transparent 70%)`,
        }} />
        <div className="flex flex-col items-center z-10">
          <motion.span className={`text-7xl font-black ${textColor} transition-colors duration-1000 tabular-nums`}
            key={aqiData.aqi} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            {aqiData.aqi}
          </motion.span>
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-1">US AQI</span>
          <motion.span className={`text-sm font-bold ${textColor} mt-1 px-3 py-0.5 rounded-full`} style={{ backgroundColor: `${aqiData.hex}15` }}>
            {aqiData.status}
          </motion.span>
        </div>
      </motion.div>

      {/* Health Advice */}
      <motion.div className="w-full max-w-md mt-4 mb-5 z-10" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border" style={{ backgroundColor: `${aqiData.hex}08`, borderColor: `${aqiData.hex}20` }}>
          <Shield size={18} className={`${textColor} mt-0.5 shrink-0`} />
          <p className="text-xs text-slate-300 leading-relaxed">{info.advice}</p>
        </div>
      </motion.div>

      {/* Weather Strip */}
      <motion.div className="w-full max-w-md glass-card rounded-2xl p-4 mb-4 z-10" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <WeatherIcon size={20} className="text-amber-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white">{weather.temperature}°C</span>
              <p className="text-[11px] text-slate-500">Feels like {weather.feelsLike}°C</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <Droplets size={14} className="text-blue-400 mb-1" />
              <span className="text-xs font-semibold text-white">{weather.humidity}%</span>
            </div>
            <div className="flex flex-col items-center">
              <Wind size={14} className="text-cyan-400 mb-1" />
              <span className="text-xs font-semibold text-white">{weather.windSpeed} km/h</span>
            </div>
            <div className="flex flex-col items-center">
              <Sun size={14} className="text-yellow-400 mb-1" />
              <span className="text-xs font-semibold text-white">UV {weather.uvIndex}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pollutant Cards */}
      <motion.div className="grid grid-cols-2 gap-3 w-full max-w-md z-10" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
        <PollutantCard label="PM2.5" value={aqiData.pm25} unit="µg/m³" percent={pm25Percent} color={bgColor} />
        <PollutantCard label="PM10" value={aqiData.pm10} unit="µg/m³" percent={pm10Percent} color={bgColor} />
      </motion.div>

      <motion.button
        className="mt-4 flex items-center gap-2 text-slate-400 text-xs font-semibold z-10 active:scale-95 transition-transform"
        onClick={() => setShowDetails(!showDetails)}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
      >
        <span>{showDetails ? 'Hide' : 'View'} All Pollutants</span>
        <motion.div animate={{ rotate: showDetails ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <TrendingDown size={14} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {showDetails && (
          <motion.div className="grid grid-cols-2 gap-3 w-full max-w-md z-10 mt-3"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
          >
            <PollutantCard label="Ozone" value={aqiData.ozone} unit="µg/m³" percent={Math.min(100, (aqiData.ozone / 180) * 100)} color="bg-cyan-500" />
            <PollutantCard label="NO₂" value={aqiData.no2} unit="µg/m³" percent={Math.min(100, (aqiData.no2 / 200) * 100)} color="bg-violet-500" />
            <PollutantCard label="SO₂" value={aqiData.so2} unit="µg/m³" percent={Math.min(100, (aqiData.so2 / 350) * 100)} color="bg-rose-500" />
            <PollutantCard label="CO" value={aqiData.co} unit="µg/m³" percent={Math.min(100, (aqiData.co / 10000) * 100)} color="bg-amber-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forecast Trend */}
      <motion.div className="w-full max-w-md glass-card rounded-2xl p-4 mt-4 z-10" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-white">7-Day AQI Trend</span>
          <TrendingUp size={16} className="text-green-400" />
        </div>
        <div className="flex items-end justify-between gap-1.5 h-14">
          {[35, 42, 38, 55, 48, 40, 32].map((val, i) => (
            <motion.div key={i} className="flex-1 rounded-t-md"
              style={{ backgroundColor: getAqiInfo(val).hex + '90' }}
              initial={{ height: 0 }} animate={{ height: `${(val / 60) * 100}%` }}
              transition={{ delay: 0.8 + i * 0.06, duration: 0.5 }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <span key={d} className="text-[9px] text-slate-600 font-medium flex-1 text-center">{d}</span>
          ))}
        </div>
      </motion.div>

      {/* Last Updated */}
      <motion.div className="flex items-center gap-3 mt-4 z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        {lastUpdated && (
          <span className="text-[10px] text-slate-600">Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        )}
        <button onClick={refreshData} className="flex items-center gap-1.5 text-[10px] text-blue-400 font-semibold active:scale-95 transition-transform" disabled={isRefreshing}>
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </motion.div>
    </div>
  );
}

function PollutantCard({ label, value, unit, percent, color }: { label: string; value: number; unit: string; percent: number; color: string }) {
  return (
    <div className="glass-card-hover p-4 rounded-2xl flex flex-col">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</span>
      <div className="flex items-end justify-between">
        <motion.span className="text-2xl font-bold text-white tabular-nums" key={value}
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {value}
        </motion.span>
        <span className="text-[10px] text-slate-500 pb-1 font-medium">{unit}</span>
      </div>
      <div className="w-full bg-white/[0.05] h-1.5 mt-3 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

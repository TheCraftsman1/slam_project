import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Mic, Plus, Minus, Crosshair, Layers, AlertTriangle, Bot, Navigation, ChevronUp, ChevronDown, MapPin, X, Loader2, Globe, Trash2, RefreshCw, Sparkles, Clock, Box, RotateCcw } from 'lucide-react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'motion/react';

const GOOGLE_MAPS_API_KEY = "
";
const GOOGLE_MAP_ID = "dc9ce5fd592358c4efda7c27";

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1f2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1f2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#7c8594" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e2d2f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#4ade80" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a3040" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1f2e" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#374151" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1a1f2e" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#242b3a" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#7c8594" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1525" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#0e1525" }] }
];

// ─── Types ───────────────────────────────────────────
interface AqiStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  airData: any | null;
  isUserLocation?: boolean;
  isTapped?: boolean;
  loading?: boolean;
  lastFetched?: Date;
}

type MetricKey = 'us_aqi' | 'pm2_5' | 'nitrogen_dioxide' | 'carbon_monoxide' | 'ozone' | 'sulphur_dioxide';

const getAqiColor = (aqi: number) => {
  if (aqi > 300) return { bg: 'bg-purple-500', border: 'border-purple-500/40', text: 'text-purple-400', hex: '#a855f7', label: 'Hazardous', emoji: '☣️' };
  if (aqi > 200) return { bg: 'bg-purple-500', border: 'border-purple-500/40', text: 'text-purple-400', hex: '#a855f7', label: 'Very Unhealthy', emoji: '😷' };
  if (aqi > 150) return { bg: 'bg-red-500', border: 'border-red-500/40', text: 'text-red-400', hex: '#ef4444', label: 'Unhealthy', emoji: '😟' };
  if (aqi > 100) return { bg: 'bg-orange-500', border: 'border-orange-500/40', text: 'text-orange-400', hex: '#f97316', label: 'Sensitive', emoji: '😐' };
  if (aqi > 50) return { bg: 'bg-yellow-500', border: 'border-yellow-500/40', text: 'text-yellow-400', hex: '#eab308', label: 'Moderate', emoji: '🙂' };
  return { bg: 'bg-green-500', border: 'border-green-500/40', text: 'text-green-400', hex: '#22c55e', label: 'Good', emoji: '😊' };
};

// ─── Major Indian + World Cities for quick explore ───
const EXPLORE_CITIES = [
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
];

// ─── Fetch AQI from open-meteo (real API) ────────────
async function fetchAqiForLocation(lat: number, lng: number): Promise<any | null> {
  try {
    const resp = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`
    );
    const data = await resp.json();
    return data?.current ?? null;
  } catch { return null; }
}

// ─── Reverse geocode ────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const resp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`);
    const data = await resp.json();
    if (data?.results?.length > 0) {
      return data.results[0].address_components.find((c: any) => c.types.includes('locality'))?.long_name ||
        data.results[0].address_components.find((c: any) => c.types.includes('sublocality'))?.long_name ||
        data.results[0].address_components.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name ||
        data.results[0].address_components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name ||
        'Unknown Location';
    }
    return 'Unknown Location';
  } catch { return 'Unknown Location'; }
}

// ─── Forward geocode ────────────────────────────────
async function forwardGeocode(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const resp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`);
    const data = await resp.json();
    if (data?.results?.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      const name = data.results[0].address_components.find((c: any) => c.types.includes('locality'))?.long_name ||
        data.results[0].address_components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name || query;
      return { lat, lng, name };
    }
    return null;
  } catch { return null; }
}


export function MapScreen() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 17.6868, lng: 83.2185 }); // Vizag default
  const [stations, setStations] = useState<AqiStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<AqiStation | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricKey>('us_aqi');
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'light' | 'satellite'>('dark');
  const [showLayers, setShowLayers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [showCityPanel, setShowCityPanel] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [tappedLoading, setTappedLoading] = useState<string | null>(null);
  const [totalMarkersLoaded, setTotalMarkersLoaded] = useState(0);
  const [is3D, setIs3D] = useState(false);
  const [heading, setHeading] = useState(0);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Add a station with live AQI ────────────────────
  const addStation = useCallback(async (lat: number, lng: number, name: string, opts?: { isUserLocation?: boolean; isTapped?: boolean }) => {
    const id = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    
    // Don't add duplicates (within ~500m)
    const exists = stations.some(s => Math.abs(s.lat - lat) < 0.005 && Math.abs(s.lng - lng) < 0.005);
    if (exists) {
      // Select the existing one instead
      const existing = stations.find(s => Math.abs(s.lat - lat) < 0.005 && Math.abs(s.lng - lng) < 0.005);
      if (existing) {
        setSelectedStation(existing);
        setIsSheetExpanded(true);
      }
      return;
    }

    // Add placeholder
    const placeholder: AqiStation = { id, name, lat, lng, aqi: 0, airData: null, loading: true, ...opts };
    setStations(prev => [...prev, placeholder]);
    setTappedLoading(id);

    // Fetch real AQI
    const airData = await fetchAqiForLocation(lat, lng);
    const aqi = airData ? Math.round(airData.us_aqi) : 0;

    const complete: AqiStation = { id, name, lat, lng, aqi, airData, loading: false, lastFetched: new Date(), ...opts };
    setStations(prev => prev.map(s => s.id === id ? complete : s));
    setTotalMarkersLoaded(prev => prev + 1);
    setTappedLoading(null);

    setSelectedStation(complete);
    setIsSheetExpanded(true);
  }, [stations]);

  // ─── Refresh a single station ──────────────────────
  const refreshStation = useCallback(async (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    if (!station) return;
    
    setStations(prev => prev.map(s => s.id === stationId ? { ...s, loading: true } : s));
    const airData = await fetchAqiForLocation(station.lat, station.lng);
    const aqi = airData ? Math.round(airData.us_aqi) : station.aqi;
    
    const updated = { ...station, aqi, airData, loading: false, lastFetched: new Date() };
    setStations(prev => prev.map(s => s.id === stationId ? updated : s));
    if (selectedStation?.id === stationId) setSelectedStation(updated);
  }, [stations, selectedStation]);

  // ─── Refresh ALL stations ──────────────────────────
  const refreshAllStations = useCallback(async () => {
    const promises = stations.map(async s => {
      const airData = await fetchAqiForLocation(s.lat, s.lng);
      const aqi = airData ? Math.round(airData.us_aqi) : s.aqi;
      return { ...s, aqi, airData, lastFetched: new Date() };
    });
    const updated = await Promise.all(promises);
    setStations(updated);
    if (selectedStation) {
      const refresh = updated.find(s => s.id === selectedStation.id);
      if (refresh) setSelectedStation(refresh);
    }
  }, [stations, selectedStation]);

  // ─── Remove a tapped station ───────────────────────
  const removeStation = useCallback((stationId: string) => {
    setStations(prev => prev.filter(s => s.id !== stationId));
    if (selectedStation?.id === stationId) {
      setSelectedStation(null);
      setIsSheetExpanded(false);
    }
  }, [selectedStation]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    // Click-to-check AQI anywhere
    map.addListener('click', async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const name = await reverseGeocode(lat, lng);
      // Use a function ref because addStation captures stale state
      addStationRef.current(lat, lng, name, { isTapped: true });
    });
  }, []);
  
  const addStationRef = useRef(addStation);
  useEffect(() => { addStationRef.current = addStation; }, [addStation]);

  const onUnmount = useCallback(() => setMap(null), []);

  // ─── Init: user location + some nearby cities ──────
  useEffect(() => {
    const init = async () => {
      // Try user location
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude: lat, longitude: lon } = pos.coords;
            setCenter({ lat, lng: lon });
            const name = await reverseGeocode(lat, lon);
            addStationRef.current(lat, lon, name, { isUserLocation: true });
          },
          async () => {
            // Fallback: start with Vizag
            addStationRef.current(17.6868, 83.2185, 'Visakhapatnam', { isUserLocation: true });
          }
        );
      } else {
        addStationRef.current(17.6868, 83.2185, 'Visakhapatnam', { isUserLocation: true });
      }

      // Pre-load a few major cities for comparison
      const preloadCities = [
        { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
        { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
        { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
        { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
        { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
      ];

      // Load them with staggered delays so they appear one by one
      for (let i = 0; i < preloadCities.length; i++) {
        await new Promise(r => setTimeout(r, 400));
        const c = preloadCities[i];
        addStationRef.current(c.lat, c.lng, c.name);
      }
    };
    init();

    // Auto-refresh every 3 min
    refreshRef.current = setInterval(() => {
      // Will use latest ref
    }, 3 * 60 * 1000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, []);

  // ─── Search handler ────────────────────────────────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const result = await forwardGeocode(searchQuery);
    if (result) {
      map?.panTo({ lat: result.lat, lng: result.lng });
      map?.setZoom(is3D ? 18 : 12);
      await addStationRef.current(result.lat, result.lng, result.name);
      setSearchQuery('');
    }
    setIsSearching(false);
  };

  // ─── Quick-add a city ──────────────────────────────
  const handleQuickCity = async (city: typeof EXPLORE_CITIES[0]) => {
    map?.panTo({ lat: city.lat, lng: city.lng });
    map?.setZoom(is3D ? 18 : 12);
    await addStationRef.current(city.lat, city.lng, city.name);
    setShowCityPanel(false);
  };

  // ─── Locate me ────────────────────────────────────
  const handleLocateMe = () => {
    if (!("geolocation" in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const loc = { lat, lng: lon };
        setCenter(loc);
        map?.panTo(loc);
        map?.setZoom(is3D ? 18 : 14);
        const name = await reverseGeocode(lat, lon);
        await addStationRef.current(lat, lon, name, { isUserLocation: true });
        setIsLocating(false);
      },
      () => setIsLocating(false)
    );
  };

  // ─── Render an AQI marker ─────────────────────────
  const renderAqiMarker = (station: AqiStation) => {
    const colors = getAqiColor(station.aqi);
    const isSelected = selectedStation?.id === station.id;
    
    let displayValue: number | string = station.aqi;
    let unit = '';
    
    if (station.loading) {
      displayValue = '...';
    } else if (station.airData && activeMetric !== 'us_aqi') {
      displayValue = Math.round(station.airData[activeMetric] || 0);
      unit = ' µg/m³';
    }

    return (
      <div
        className="flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer group"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedStation(station);
          setIsSheetExpanded(true);
        }}
      >
        {/* City label */}
        <div className={`mb-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
          isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-black/40 text-slate-400'
        } backdrop-blur-md max-w-[100px] truncate`}>
          {station.name}
        </div>
        
        {/* AQI Bubble */}
        <div className={`relative bg-[#141820]/95 backdrop-blur-xl border-2 ${isSelected ? 'border-blue-400/60 shadow-[0_0_20px_rgba(59,130,246,0.25)]' : colors.border} px-3.5 py-2 rounded-2xl shadow-2xl flex items-center gap-2 transition-all duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
          style={{ boxShadow: isSelected ? undefined : `0 4px 20px ${colors.hex}20` }}
        >
          {station.loading ? (
            <Loader2 size={14} className="text-blue-400 animate-spin" />
          ) : (
            <div className="relative">
              <div className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
              <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${colors.bg} animate-ping opacity-40`} />
            </div>
          )}
          <span className="text-sm font-bold text-white tabular-nums">{displayValue}</span>
          {unit && <span className="text-[8px] text-slate-400">{unit}</span>}
          
          {/* User location badge */}
          {station.isUserLocation && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-[#141820]" />
          )}
        </div>
        
        {/* Stem */}
        <div className={`w-0.5 h-4 ${isSelected ? 'bg-blue-400/40' : 'bg-gradient-to-b from-white/15 to-transparent'}`} />
        <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-blue-500' : colors.bg} shadow-lg`}
          style={{ boxShadow: `0 0 8px ${isSelected ? '#3b82f680' : colors.hex + '50'}` }}
        />
      </div>
    );
  };

  // ─── 3D Toggle handler ─────────────────────────────
  const toggle3D = useCallback(() => {
    setIs3D(prev => {
      const next = !prev;
      if (map) {
        if (next) {
          // Enter 3D mode: zoom in, tilt camera, switch to satellite for best visuals
          const currentZoom = map.getZoom() || 6;
          if (currentZoom < 16) map.setZoom(18);
          map.setTilt(45);
          map.setHeading(heading);
          setMapStyle('satellite');
        } else {
          // Exit 3D: flatten camera, go back to dark mode
          map.setTilt(0);
          map.setHeading(0);
          setMapStyle('dark');
        }
      }
      return next;
    });
  }, [map, heading]);

  // ─── Rotate 3D view ────────────────────────────────
  const rotate3D = useCallback((degrees: number) => {
    setHeading(prev => {
      const next = (prev + degrees) % 360;
      if (map && is3D) map.setHeading(next);
      return next;
    });
  }, [map, is3D]);

  const mapOptions = {
    disableDefaultUI: true,
    styles: (mapStyle === 'dark' && !is3D) ? darkMapStyle : [],
    mapTypeId: mapStyle === 'satellite' ? (is3D ? 'hybrid' : 'satellite') : 'roadmap',
    gestureHandling: 'greedy' as const,
    clickableIcons: false,
    mapId: GOOGLE_MAP_ID,
    tilt: is3D ? 45 : 0,
    heading: is3D ? heading : 0,
  };

  // ─── Loading state ────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0b1120] gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-blue-500/20" />
          <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
        </div>
        <span className="text-sm text-slate-400 font-semibold">Loading Air Quality Map...</span>
        <span className="text-[10px] text-slate-600">Real-time data from 16+ cities</span>
      </div>
    );
  }

  const selectedColors = selectedStation ? getAqiColor(selectedStation.aqi) : getAqiColor(0);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0b1120] font-display flex flex-col">
      {/* ─── Map ──────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={6}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {/* Render ALL stations as live AQI markers */}
          {stations.map(station => (
            <OverlayView
              key={station.id}
              position={{ lat: station.lat, lng: station.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              {renderAqiMarker(station)}
            </OverlayView>
          ))}

          {/* ─── Map Controls ────────────────────── */}
          <div className={`absolute right-3 transition-all duration-500 z-[500] flex flex-col gap-2 pointer-events-auto ${isSheetExpanded ? 'bottom-[380px]' : 'bottom-[130px]'}`}>
            {/* Live Counter */}
            <div className="bg-[#141820]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-300">{stations.filter(s => !s.loading).length} Live</span>
            </div>

            <div className="flex flex-col bg-[#141820]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
              <button className="p-3 text-slate-200 hover:bg-white/[0.08] active:scale-90 transition-all" onClick={() => map?.setZoom((map.getZoom() || 6) + 1)}>
                <Plus size={18} />
              </button>
              <div className="h-px w-full bg-white/[0.06]" />
              <button className="p-3 text-slate-200 hover:bg-white/[0.08] active:scale-90 transition-all" onClick={() => map?.setZoom((map.getZoom() || 6) - 1)}>
                <Minus size={18} />
              </button>
            </div>

            <button
              className={`bg-[#141820]/95 backdrop-blur-2xl border border-white/[0.08] p-3 rounded-2xl shadow-2xl hover:bg-white/[0.08] active:scale-90 transition-all ${isLocating ? 'text-blue-400' : 'text-slate-200'}`}
              onClick={handleLocateMe}
            >
              <Crosshair size={18} className={isLocating ? 'animate-pulse' : ''} />
            </button>

            {/* Refresh All */}
            <button
              className="bg-[#141820]/95 backdrop-blur-2xl border border-white/[0.08] p-3 rounded-2xl shadow-2xl hover:bg-white/[0.08] active:scale-90 transition-all text-slate-200"
              onClick={refreshAllStations}
              title="Refresh all stations"
            >
              <RefreshCw size={18} />
            </button>

            {/* Explore Cities */}
            <button
              className={`p-3 rounded-2xl shadow-lg active:scale-90 transition-all flex items-center justify-center ${showCityPanel ? 'bg-blue-500 text-white' : 'bg-blue-500/90 text-white'}`}
              onClick={() => setShowCityPanel(!showCityPanel)}
              style={{ boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
            >
              <Globe size={18} />
            </button>

            {/* 3D Toggle */}
            <button
              className={`p-3 rounded-2xl shadow-lg active:scale-90 transition-all flex items-center justify-center border ${is3D ? 'bg-gradient-to-br from-violet-500 to-blue-500 border-violet-400/40 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]' : 'bg-white/[0.08] border-white/[0.08] text-slate-200'}`}
              onClick={toggle3D}
              title={is3D ? 'Exit 3D View' : 'Enter 3D View'}
            >
              <Box size={18} />
            </button>

            {/* Rotate buttons (only visible in 3D mode) */}
            <AnimatePresence>
              {is3D && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col bg-[#141820]/95 backdrop-blur-2xl border border-violet-500/20 rounded-2xl overflow-hidden shadow-2xl"
                >
                  <button
                    className="p-3 text-violet-300 hover:bg-violet-500/10 active:scale-90 transition-all"
                    onClick={() => rotate3D(45)}
                    title="Rotate Right"
                  >
                    <RotateCcw size={16} className="scale-x-[-1]" />
                  </button>
                  <div className="h-px w-full bg-violet-500/10" />
                  <button
                    className="p-3 text-violet-300 hover:bg-violet-500/10 active:scale-90 transition-all"
                    onClick={() => rotate3D(-45)}
                    title="Rotate Left"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <div className="h-px w-full bg-violet-500/10" />
                  <button
                    className="p-2.5 text-violet-300 hover:bg-violet-500/10 active:scale-90 transition-all"
                    onClick={() => { setHeading(0); if (map) map.setHeading(0); }}
                    title="Reset Heading"
                  >
                    <span className="text-[10px] font-bold">N</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Layers */}
            <div className="relative">
              <button
                className={`p-3 rounded-2xl shadow-lg active:scale-90 transition-all flex items-center justify-center bg-white/[0.08] border border-white/[0.08] text-slate-200`}
                onClick={() => setShowLayers(!showLayers)}
              >
                <Layers size={18} />
              </button>
              <AnimatePresence>
                {showLayers && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    className="absolute right-14 top-0 bg-[#141820]/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-44"
                  >
                    {(['dark', 'light', 'satellite'] as const).map(style => (
                      <button key={style}
                        className={`px-4 py-2.5 text-sm text-left rounded-xl transition-all font-medium ${mapStyle === style ? 'bg-blue-500/15 text-blue-400' : 'text-slate-300 hover:bg-white/[0.05]'}`}
                        onClick={() => { setMapStyle(style); setShowLayers(false); }}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                    <div className="h-px w-full bg-white/[0.06] my-1" />
                    <button
                      className={`px-4 py-2.5 text-sm text-left rounded-xl transition-all font-medium flex items-center gap-2 ${
                        is3D && mapStyle === 'satellite' ? 'bg-violet-500/15 text-violet-400' : 'text-slate-300 hover:bg-white/[0.05]'
                      }`}
                      onClick={() => {
                        setMapStyle('satellite');
                        if (!is3D) toggle3D();
                        const currentZoom = map?.getZoom() || 6;
                        if (currentZoom < 16) map?.setZoom(18);
                        setShowLayers(false);
                      }}
                    >
                      <Box size={13} />
                      3D Satellite
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </GoogleMap>
      </div>

      {/* ─── Explore Cities Panel ─────────────────── */}
      <AnimatePresence>
        {showCityPanel && (
          <motion.div
            initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
            className="absolute top-20 right-3 z-[600] bg-[#141820]/98 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-4 shadow-2xl w-56 max-h-[60vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-blue-400" />
                <span className="text-xs font-bold text-white">Explore Cities</span>
              </div>
              <button onClick={() => setShowCityPanel(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mb-3">Tap to load live AQI for any city</p>
            <div className="flex flex-col gap-1">
              {EXPLORE_CITIES.map(city => {
                const exists = stations.some(s => Math.abs(s.lat - city.lat) < 0.005 && Math.abs(s.lng - city.lng) < 0.005);
                return (
                  <button
                    key={city.name}
                    onClick={() => handleQuickCity(city)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all active:scale-95 ${
                      exists ? 'bg-green-500/10 text-green-400' : 'hover:bg-white/[0.05] text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-semibold">{city.name}</span>
                    {exists ? (
                      <span className="text-[9px] font-bold text-green-400 tabular-nums">
                        AQI {stations.find(s => Math.abs(s.lat - city.lat) < 0.005)?.aqi || '...'}
                      </span>
                    ) : (
                      <MapPin size={12} className="text-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Tap Instruction Toast ────────────────── */}
      {stations.length <= 1 && (
        <motion.div
          className="absolute top-[140px] left-1/2 -translate-x-1/2 z-[500] bg-blue-500/15 backdrop-blur-xl border border-blue-500/20 rounded-full px-4 py-2 pointer-events-none"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <span className="text-[11px] font-semibold text-blue-300">👆 Tap anywhere on the map to check live AQI  •  Tap 🧊 for 3D</span>
        </motion.div>
      )}

      {/* ─── Search Bar ───────────────────────────── */}
      <div className="absolute top-0 left-0 w-full p-4 z-[500] flex flex-col gap-3 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <form onSubmit={handleSearch} className="flex-1 bg-[#141820]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl flex items-center px-4 py-3.5 shadow-2xl transition-all focus-within:border-blue-500/40 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            {isSearching ? (
              <Loader2 className="text-blue-400 mr-3 animate-spin" size={18} />
            ) : (
              <Search className="text-slate-500 mr-3" size={18} />
            )}
            <input
              className="bg-transparent border-none focus:outline-none text-white placeholder:text-slate-500 w-full text-sm font-medium"
              placeholder="Search Vizag, Delhi, Tokyo..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white mr-2 transition-colors">
                <X size={16} />
              </button>
            )}
            <Mic className="text-slate-500 ml-2 cursor-pointer hover:text-blue-400 transition-colors" size={18} />
          </form>
        </div>

        {/* Metric Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 pointer-events-auto">
          {([
            { key: 'us_aqi' as MetricKey, label: 'AQI' },
            { key: 'pm2_5' as MetricKey, label: 'PM2.5' },
            { key: 'ozone' as MetricKey, label: 'O₃' },
            { key: 'nitrogen_dioxide' as MetricKey, label: 'NO₂' },
            { key: 'carbon_monoxide' as MetricKey, label: 'CO' },
            { key: 'sulphur_dioxide' as MetricKey, label: 'SO₂' },
          ]).map(m => (
            <button key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`bg-[#141820]/95 backdrop-blur-2xl border ${activeMetric === m.key ? 'border-blue-500/40 text-white' : 'border-white/[0.08] text-slate-400'} px-3.5 py-2 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 hover:bg-white/[0.05] transition-all active:scale-95`}
            >
              {activeMetric === m.key && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Bottom Sheet ─────────────────────────── */}
      <motion.div
        className="bg-[#0f1729]/98 backdrop-blur-2xl rounded-t-[2rem] border-t border-white/[0.08] pt-3 pb-8 px-5 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] relative z-[500] mt-auto flex flex-col"
        initial={false}
        animate={{ height: isSheetExpanded && selectedStation ? 'auto' : '105px' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Handle */}
        <div className="w-full flex justify-center py-2 cursor-pointer mb-1" onClick={() => setIsSheetExpanded(!isSheetExpanded)}>
          <div className="w-10 h-1 bg-slate-700 rounded-full hover:bg-slate-500 transition-colors" />
        </div>

        {selectedStation ? (
          <>
            {/* Selected Location Header */}
            <div className="flex items-start gap-3.5 mb-4 cursor-pointer" onClick={() => setIsSheetExpanded(!isSheetExpanded)}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${selectedColors.border}`}
                style={{ backgroundColor: `${selectedColors.hex}15` }}>
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
                    {selectedStation.loading ? 'Fetching...' : `${selectedColors.label} — AQI ${selectedStation.aqi}`}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                {selectedStation.isTapped && (
                  <button className="p-2 text-slate-600 hover:text-red-400 transition-colors" onClick={(e) => { e.stopPropagation(); removeStation(selectedStation.id); }}>
                    <Trash2 size={16} />
                  </button>
                )}
                <button className="p-2 text-slate-600 hover:text-blue-400 transition-colors" onClick={(e) => { e.stopPropagation(); refreshStation(selectedStation.id); }}>
                  <RefreshCw size={16} className={selectedStation.loading ? 'animate-spin' : ''} />
                </button>
                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                  {isSheetExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isSheetExpanded && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.25 }}>
                  {/* Pollutant Grid */}
                  {selectedStation.airData && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: 'PM2.5', value: selectedStation.airData.pm2_5, key: 'pm2_5' },
                        { label: 'PM10', value: selectedStation.airData.pm10, key: 'pm10' },
                        { label: 'Ozone', value: selectedStation.airData.ozone, key: 'ozone' },
                        { label: 'NO₂', value: selectedStation.airData.nitrogen_dioxide, key: 'nitrogen_dioxide' },
                        { label: 'SO₂', value: selectedStation.airData.sulphur_dioxide, key: 'sulphur_dioxide' },
                        { label: 'CO', value: selectedStation.airData.carbon_monoxide, key: 'carbon_monoxide' },
                      ].map(p => {
                        const isActive = activeMetric === p.key;
                        return (
                          <button
                            key={p.label}
                            onClick={() => setActiveMetric(p.key as MetricKey)}
                            className={`border rounded-xl p-2.5 flex flex-col items-center justify-center transition-all active:scale-95 ${
                              isActive ? 'bg-blue-500/10 border-blue-500/25' : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06]'
                            }`}
                          >
                            <span className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>{p.label}</span>
                            <span className="text-white font-bold text-sm tabular-nums">{Math.round(p.value || 0)}</span>
                            <span className="text-[8px] text-slate-600 font-medium">µg/m³</span>
                          </button>
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
                            <button
                              key={s.id}
                              onClick={() => { setSelectedStation(s); map?.panTo({ lat: s.lat, lng: s.lng }); }}
                              className="bg-white/[0.04] border border-white/[0.05] rounded-xl px-3 py-2 flex flex-col items-center shrink-0 hover:bg-white/[0.07] transition-colors active:scale-95"
                            >
                              <span className="text-[9px] font-bold text-slate-400 truncate max-w-[60px]">{s.name}</span>
                              <span className={`text-sm font-bold ${c.text} tabular-nums`}>{s.aqi}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* EcoBot Tip */}
                  <div className="bg-blue-500/[0.08] border border-blue-500/15 rounded-2xl p-3.5 flex gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
                      <Bot className="text-blue-400" size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">EcoBot</p>
                      <p className="text-xs leading-relaxed text-slate-300">
                        {selectedStation.aqi > 150
                          ? `Air in ${selectedStation.name} is unhealthy. Avoid prolonged outdoor activity and wear an N95 mask if going out.`
                          : selectedStation.aqi > 100
                          ? `${selectedStation.name} has moderate-to-poor air. Sensitive groups should limit outdoor exertion.`
                          : selectedStation.aqi > 50
                          ? `${selectedStation.name} has acceptable air quality. Light outdoor activity is fine.`
                          : `${selectedStation.name} has excellent air quality! Perfect for outdoor activities. 🌿`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.3)] active:scale-[0.97] transition-all text-sm">
                      <Navigation size={14} />
                      Navigate
                    </button>
                    <button
                      className="bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold py-3 rounded-2xl border border-white/[0.08] active:scale-[0.97] transition-all text-sm"
                      onClick={() => refreshStation(selectedStation.id)}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw size={14} className={selectedStation.loading ? 'animate-spin' : ''} />
                        Refresh
                      </span>
                    </button>
                  </div>
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
    </div>
  );
}

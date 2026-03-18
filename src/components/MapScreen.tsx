import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Mic, Plus, Minus, Crosshair, Layers, AlertTriangle, Bot, Navigation, ChevronUp, ChevronDown, MapPin, X, Loader2, Globe, Trash2, RefreshCw, Sparkles, Clock, Box, RotateCcw } from 'lucide-react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'motion/react';

const GOOGLE_MAPS_API_KEY = "AIzaSyAbP_bF7fte-ru9MywNP08Ag7bpzmjBfh4";
const GOOGLE_MAP_ID = "dc9ce5fd592358c4efda7c27";
const BACKEND_URL = 'http://localhost:8000';

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

interface AddStationOptions {
  isUserLocation?: boolean;
  isTapped?: boolean;
  autoSelect?: boolean;
}

interface IareBuilding {
  name: string;
  lat: number;
  lng: number;
  type: string;
}

interface IareCollegeData {
  name: string;
  fullName: string;
  center: { lat: number; lng: number };
  buildings: IareBuilding[];
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

// ─── IARE College Buildings ─────────────────────────
const DEFAULT_IARE_COLLEGE: IareCollegeData = {
  name: 'IARE',
  fullName: 'Institute of Aeronautical Engineering',
  center: { lat: 17.6001, lng: 78.4175 },
  buildings: [
    { name: 'Bharadwaja Block', lat: 17.599903, lng: 78.416924, type: 'academic' },
    { name: 'Abdul Kalam Block', lat: 17.599639, lng: 78.417294, type: 'academic' },
    { name: 'Aryabhatta Block', lat: 17.599878, lng: 78.417661, type: 'academic' },
    { name: '5th Block', lat: 17.599799, lng: 78.418182, type: 'academic' },
    { name: 'IT Park', lat: 17.600183, lng: 78.418238, type: 'academic' },
    { name: 'TIIC Center', lat: 17.600462, lng: 78.416978, type: 'facility' },
    { name: 'IARE Canteen', lat: 17.600247, lng: 78.418606, type: 'facility' },
    { name: 'Engineering Workshop', lat: 17.599523, lng: 78.418172, type: 'facility' },
    { name: 'Indoor Badminton Court', lat: 17.600932, lng: 78.417066, type: 'sports' },
    { name: 'Basketball Court', lat: 17.599784, lng: 78.418563, type: 'sports' },
    { name: 'IARE Parking', lat: 17.600968, lng: 78.417310, type: 'facility' },
    { name: 'Car Parking', lat: 17.600607, lng: 78.417410, type: 'facility' },
    { name: 'Main Entrance', lat: 17.600372, lng: 78.416849, type: 'entrance' },
  ]
};

const getBuildingIcon = (type: string) => {
  switch (type) {
    case 'academic': return '🏛️';
    case 'library': return '📚';
    case 'admin': return '🏢';
    case 'facility': return '🏪';
    case 'sports': return '🏟️';
    case 'hostel': return '🏠';
    case 'entrance': return '🚪';
    default: return '📍';
  }
};

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

async function fetchIareCollegeData(): Promise<IareCollegeData | null> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/iare/buildings`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data?.center || !Array.isArray(data?.buildings)) return null;
    return {
      name: data.name || 'IARE',
      fullName: data.full_name || data.fullName || 'Institute of Aeronautical Engineering',
      center: data.center,
      buildings: data.buildings,
    };
  } catch {
    return null;
  }
}

async function fetchNearestIareBuilding(lat: number, lng: number): Promise<{ name: string; distance_m: number; is_near_campus: boolean } | null> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/iare/nearest?latitude=${lat}&longitude=${lng}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data?.nearest?.name) return null;
    return {
      name: data.nearest.name,
      distance_m: data.nearest.distance_m ?? 99999,
      is_near_campus: !!data.is_near_campus,
    };
  } catch {
    return null;
  }
}

// ─── Reverse geocode ────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const nearestIare = await fetchNearestIareBuilding(lat, lng);
  if (nearestIare?.is_near_campus) {
    if (nearestIare.distance_m <= 120) return nearestIare.name;
    return 'IARE Campus';
  }

  try {
    const resp = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await resp.json();

    if (data?.results?.length > 0) {
      // Helper to check if string is a Plus Code (e.g., "HCX8+XQH")
      const isPlusCode = (str: string) => /^[A-Z0-9]{4,}\+[A-Z0-9]+$/i.test(str?.trim() || '');

      // Priority 1: Look for POI/establishment/premise result
      for (const result of data.results) {
        const types = result.types || [];
        if (types.some((t: string) => ['point_of_interest', 'establishment', 'premise', 'subpremise'].includes(t))) {
          // Get first part of formatted_address (usually the place name)
          const parts = result.formatted_address?.split(',') || [];
          for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed && !isPlusCode(trimmed) && trimmed.length < 60) {
              return trimmed;
            }
          }
        }
      }

      // Priority 2: Search all results for a good name
      for (const result of data.results) {
        const components = result.address_components || [];

        // Try to find premise, neighborhood, or route
        for (const comp of components) {
          const types = comp.types || [];
          if (types.includes('premise') || types.includes('neighborhood') || types.includes('route')) {
            if (!isPlusCode(comp.long_name)) {
              return comp.long_name;
            }
          }
        }
      }

      // Priority 3: Get sublocality or locality
      const first = data.results[0];
      const components = first.address_components || [];

      for (const comp of components) {
        const types = comp.types || [];
        if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
          if (!isPlusCode(comp.long_name)) return comp.long_name;
        }
      }

      for (const comp of components) {
        if (comp.types?.includes('locality') && !isPlusCode(comp.long_name)) {
          return comp.long_name;
        }
      }

      // Priority 4: First non-Plus-Code part of any formatted_address
      for (const result of data.results) {
        const parts = result.formatted_address?.split(',') || [];
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed && !isPlusCode(trimmed) && trimmed.length < 60 && trimmed.length > 2) {
            return trimmed;
          }
        }
      }
    }
    return 'Unknown Location';
  } catch (err) {
    console.error('Geocode error:', err);
    return 'Unknown Location';
  }
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
  const [showCollegePanel, setShowCollegePanel] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [tappedLoading, setTappedLoading] = useState<string | null>(null);
  const [totalMarkersLoaded, setTotalMarkersLoaded] = useState(0);
  const [is3D, setIs3D] = useState(false);
  const [heading, setHeading] = useState(0);
  const [iareCollege, setIareCollege] = useState<IareCollegeData>(DEFAULT_IARE_COLLEGE);
  const [aiInsight, setAiInsight] = useState<{ loading: boolean; text: string | null }>({ loading: false, text: null });
  const [currentZoom, setCurrentZoom] = useState(6);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insightRequestIdRef = useRef(0);
  const insightCacheRef = useRef<Map<string, string>>(new Map());
  const insightAbortRef = useRef<AbortController | null>(null);

  // ─── Fetch AI Insight ──────────────────────────────
  const fetchAiInsight = async (station: AqiStation) => {
    const cacheKey = `${station.id}:${station.aqi}`;
    const cachedInsight = insightCacheRef.current.get(cacheKey);
    if (cachedInsight) {
      setAiInsight({ loading: false, text: cachedInsight });
      return;
    }

    if (insightAbortRef.current) {
      insightAbortRef.current.abort();
    }
    const controller = new AbortController();
    insightAbortRef.current = controller;

    const requestId = ++insightRequestIdRef.current;
    setAiInsight({ loading: true, text: null });
    try {
      const resp = await fetch('http://localhost:8000/api/ask-ecobot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          user_voice_text: "Give one short, specific safety insight for this spot.",
          current_aqi: station.aqi,
          location: station.name,
          latitude: station.lat,
          longitude: station.lng,
          response_style: 'map_fast'
        })
      });
      if (resp.ok) {
        const reader = resp.body?.getReader();
        if (!reader) throw new Error('No stream reader');

        const decoder = new TextDecoder('utf-8');
        let fullReply = '';
        let isDone = false;

        while (!isDone) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              isDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed?.text) {
                fullReply += parsed.text;
                if (requestId === insightRequestIdRef.current) {
                  setAiInsight({ loading: true, text: fullReply });
                }
              }
            } catch {
              // Ignore malformed SSE lines
            }
          }
        }

        if (requestId === insightRequestIdRef.current) {
          const finalText = fullReply || `AQI in ${station.name} is ${station.aqi}.`;
          setAiInsight({ loading: false, text: finalText });
          insightCacheRef.current.set(cacheKey, finalText);
        }
      } else {
        throw new Error('Fallback');
      }
    } catch {
      // Offline fallback
      let advice = "";
      if (station.aqi > 150) advice = `Air in ${station.name} is unhealthy. Avoid outdoor activity and wear an N95 mask.`;
      else if (station.aqi > 100) advice = `${station.name} has moderate-to-poor air. Sensitive groups limit exertion.`;
      else if (station.aqi > 50) advice = `Air quality is acceptable. Light outdoor activity is fine.`;
      else advice = `Excellent air quality in ${station.name}! AI local server is offline, but it looks safe.`;
      if (requestId === insightRequestIdRef.current) {
        setAiInsight({ loading: false, text: advice });
      }
    }
  };

  // ─── Add a station with live AQI ────────────────────
  const addStation = useCallback(async (lat: number, lng: number, name: string, opts?: AddStationOptions) => {
    const shouldAutoSelect = opts?.autoSelect !== false;
    const id = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    
    // Don't add duplicates (within ~500m)
    const exists = stations.some(s => Math.abs(s.lat - lat) < 0.005 && Math.abs(s.lng - lng) < 0.005);
    if (exists) {
      // Select the existing one instead
      const existing = stations.find(s => Math.abs(s.lat - lat) < 0.005 && Math.abs(s.lng - lng) < 0.005);
      if (existing && shouldAutoSelect) {
        setSelectedStation(existing);
        fetchAiInsight(existing);
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

    if (shouldAutoSelect) {
      setSelectedStation(complete);
      fetchAiInsight(complete);
      setIsSheetExpanded(true);
    }
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
    // Track zoom changes for building label visibility
    map.addListener('zoom_changed', () => {
      setCurrentZoom(map.getZoom() || 6);
    });
  }, []);
  
  const addStationRef = useRef(addStation);
  useEffect(() => { addStationRef.current = addStation; }, [addStation]);

  const onUnmount = useCallback(() => setMap(null), []);

  useEffect(() => {
    const loadIareData = async () => {
      const data = await fetchIareCollegeData();
      if (data) setIareCollege(data);
    };
    loadIareData();
  }, []);

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
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
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
        addStationRef.current(c.lat, c.lng, c.name, { autoSelect: false });
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

    // First check if searching for a college building
    const query = searchQuery.toLowerCase().trim();
    const matchingBuilding = iareCollege.buildings.find(b =>
      b.name.toLowerCase().includes(query) ||
      query.includes(b.name.toLowerCase().split(' ')[0]) // Match first word like "bharadwaja"
    );

    if (matchingBuilding) {
      // Found a college building match
      map?.panTo({ lat: matchingBuilding.lat, lng: matchingBuilding.lng });
      map?.setZoom(is3D ? 19 : 18);
      await addStationRef.current(matchingBuilding.lat, matchingBuilding.lng, matchingBuilding.name, { isTapped: true });
      setSearchQuery('');
      setIsSearching(false);
      return;
    }

    // Check if searching for IARE/college
    if (query.includes('iare') || query.includes('college') || query.includes('campus')) {
      goToCollege();
      setSearchQuery('');
      setIsSearching(false);
      return;
    }

    // Otherwise do normal geocode search
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

  // ─── Quick-add a college building ────────────────────
  const handleCollegeBuilding = async (building: IareBuilding) => {
    map?.panTo({ lat: building.lat, lng: building.lng });
    map?.setZoom(is3D ? 19 : 18); // Zoom in close for buildings
    await addStationRef.current(building.lat, building.lng, building.name, { isTapped: true });
    setShowCollegePanel(false);
  };

  // ─── Go to college center ────────────────────────────
  const goToCollege = () => {
    map?.panTo(iareCollege.center);
    map?.setZoom(is3D ? 18 : 17);
    setMapStyle('satellite'); // Satellite view for better campus visibility
    setShowCollegePanel(true);
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
      () => setIsLocating(false),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
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
        className="flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedStation(station);
          fetchAiInsight(station);
          setIsSheetExpanded(true);
        }}
      >
        {/* Glow Aura / Radar ping */}
        {station.loading ? (
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse scale-150" />
        ) : (
          <div 
            className={`absolute inset-0 rounded-full blur-xl opacity-40 transition-all duration-700 ${isSelected ? 'scale-[2.5] opacity-70' : 'scale-150 group-hover:scale-[2]'} ${colors.bg}`} 
          />
        )}
        
        {/* Radar Ring (selected only) */}
        {isSelected && (
          <div className={`absolute inset-[-20px] rounded-full border border-white/20 animate-ping opacity-30`} />
        )}

        {/* City label - Floating above */}
        <div className={`absolute -top-8 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all shadow-lg ${
          isSelected ? 'bg-blue-500/90 text-white shadow-blue-500/30' : 'bg-black/60 text-slate-300 backdrop-blur-md opacity-0 group-hover:opacity-100'
        } whitespace-nowrap z-20`}>
          {station.name}
        </div>
        
        {/* 3D-Like AQI Node */}
        <div className={`relative z-10 w-12 h-12 rounded-full backdrop-blur-md border-[3px] flex items-center justify-center transition-all duration-500 shadow-2xl ${
          isSelected ? 'border-white/90 scale-110' : `${colors.border} scale-100 group-hover:scale-105`
        }`}
          style={{ 
            background: isSelected ? 'rgba(15, 23, 41, 0.85)' : 'rgba(20, 24, 32, 0.75)',
            boxShadow: `0 ${isSelected ? '10px' : '4px'} 25px ${isSelected ? '#ffffff30' : colors.hex + '40'}, inset 0 0 15px ${colors.hex}30` 
          }}
        >
          {station.loading ? (
            <Loader2 size={16} className="text-blue-400 animate-spin" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className={`text-sm font-black tabular-nums tracking-tighter ${isSelected ? 'text-white' : colors.text}`} style={{ textShadow: `0 0 10px ${colors.hex}` }}>
                {displayValue}
              </span>
            </div>
          )}
          
          {/* User location badge */}
          {station.isUserLocation && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-[#141820]" />
          )}
        </div>
        
        {/* Shadow floor base */}
        <div className="w-6 h-1.5 mt-2 bg-black/60 rounded-full blur-[2px]" />
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

          {/* ─── IARE Building Labels (visible when zoomed in) ─── */}
          {currentZoom >= 16 && iareCollege.buildings.map(building => (
            <OverlayView
              key={`building-${building.name}`}
              position={{ lat: building.lat, lng: building.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div
                className="-translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleCollegeBuilding(building)}
              >
                <div className="px-2 py-1 rounded bg-white/95 shadow-md border border-gray-200">
                  <span className="text-[10px] font-semibold text-gray-800 whitespace-nowrap">
                    {building.name}
                  </span>
                </div>
              </div>
            </OverlayView>
          ))}

          {/* ─── Map Controls ────────────────────── */}
          <div className="absolute right-4 top-[140px] transition-all duration-500 z-[400] flex flex-col gap-3 pointer-events-auto mt-6">
            {/* Live Counter */}
            <div className="bg-[#141820]/95 backdrop-blur-3xl border border-white/[0.08] rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-300">{stations.filter(s => !s.loading).length} Live</span>
            </div>

            <div className="flex flex-col bg-[#141820]/80 backdrop-blur-xl border border-white/[0.1] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <button className="p-3.5 text-slate-200 hover:bg-white/[0.1] active:bg-white/[0.15] transition-all" onClick={() => map?.setZoom((map.getZoom() || 6) + 1)}>
                <Plus size={18} />
              </button>
              <div className="h-px w-full bg-white/[0.1]" />
              <button className="p-3.5 text-slate-200 hover:bg-white/[0.1] active:bg-white/[0.15] transition-all" onClick={() => map?.setZoom((map.getZoom() || 6) - 1)}>
                <Minus size={18} />
              </button>
            </div>

            <button
              className={`bg-[#141820]/80 backdrop-blur-xl border border-white/[0.1] p-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:bg-white/[0.1] active:scale-95 transition-all ${isLocating ? 'text-blue-400' : 'text-slate-200'}`}
              onClick={handleLocateMe}
            >
              <Crosshair size={18} className={isLocating ? 'animate-pulse' : ''} />
            </button>

            {/* Explore Cities */}
            <button
              className={`p-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all flex items-center justify-center ${showCityPanel ? 'bg-blue-500 text-white' : 'bg-[#141820]/80 backdrop-blur-xl border border-white/[0.1] text-slate-200 hover:bg-white/[0.1]'}`}
              onClick={() => setShowCityPanel(!showCityPanel)}
              style={showCityPanel ? { boxShadow: '0 8px 30px rgba(59,130,246,0.4)' } : {}}
            >
              <Globe size={18} />
            </button>

            {/* College Quick Access */}
            <button
              className={`p-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all flex items-center justify-center ${showCollegePanel ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400/40' : 'bg-[#141820]/80 backdrop-blur-xl border border-white/[0.1] text-slate-200 hover:bg-white/[0.1]'}`}
              onClick={goToCollege}
              style={showCollegePanel ? { boxShadow: '0 8px 30px rgba(16,185,129,0.4)' } : {}}
              title="IARE Campus"
            >
              <span className="text-base">🎓</span>
            </button>

            {/* 3D Toggle */}
            <button
              className={`p-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all flex items-center justify-center border ${is3D ? 'bg-gradient-to-br from-violet-600 to-blue-600 border-violet-400/40 text-white shadow-[0_8px_30px_rgba(139,92,246,0.5)]' : 'bg-[#141820]/80 backdrop-blur-xl border-white/[0.1] text-slate-200 hover:bg-white/[0.1]'}`}
              onClick={toggle3D}
              title={is3D ? 'Exit 3D View' : 'Enter 3D View'}
            >
              <Box size={18} className={is3D ? 'animate-pulse' : ''} />
            </button>

            {/* Rotate buttons (only visible in 3D mode) */}
            <AnimatePresence>
              {is3D && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  className="flex flex-col bg-[#141820]/90 backdrop-blur-xl border border-violet-500/30 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] mt-1"
                >
                  <button
                    className="p-3 text-violet-300 hover:bg-violet-500/20 active:bg-violet-500/30 transition-all font-bold"
                    onClick={() => rotate3D(45)}
                    title="Rotate Right"
                  >
                    <RotateCcw size={16} className="scale-x-[-1]" />
                  </button>
                  <div className="h-px w-full bg-violet-500/20" />
                  <button
                    className="p-3 text-violet-300 hover:bg-violet-500/20 active:bg-violet-500/30 transition-all font-bold"
                    onClick={() => rotate3D(-45)}
                    title="Rotate Left"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <div className="h-px w-full bg-violet-500/20" />
                  <button
                    className="p-2.5 text-violet-300 hover:bg-violet-500/20 active:bg-violet-500/30 transition-all flex justify-center items-center"
                    onClick={() => { setHeading(0); if (map) map.setHeading(0); }}
                    title="Reset Heading"
                  >
                    <Navigation size={14} className="text-violet-400" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Layers */}
            <div className="relative mt-auto">
              <button
                className={`p-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all flex items-center justify-center bg-[#141820]/80 backdrop-blur-xl border border-white/[0.1] text-slate-200 hover:bg-white/[0.1]`}
                onClick={() => setShowLayers(!showLayers)}
              >
                <Layers size={18} />
              </button>
              <AnimatePresence>
                {showLayers && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    className="absolute right-14 bottom-0 bg-[#141820]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl p-2 shadow-[0_15px_50px_rgba(0,0,0,0.7)] flex flex-col gap-1 w-44"
                  >
                    {(['dark', 'light', 'satellite'] as const).map(style => (
                      <button key={style}
                        className={`px-4 py-3 text-sm text-left rounded-xl transition-all font-bold ${mapStyle === style ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/[0.08]'}`}
                        onClick={() => { setMapStyle(style); setShowLayers(false); }}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
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

      {/* ─── IARE College Buildings Panel ─────────────── */}
      <AnimatePresence>
        {showCollegePanel && (
          <motion.div
            initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
            className="absolute top-20 right-3 z-[600] bg-[#0d1a1f]/98 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-4 shadow-2xl w-64 max-h-[70vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎓</span>
                <div>
                  <span className="text-xs font-bold text-white block">{iareCollege.name}</span>
                  <span className="text-[9px] text-emerald-400/70">{iareCollege.fullName}</span>
                </div>
              </div>
              <button onClick={() => setShowCollegePanel(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>

            <p className="text-[10px] text-slate-500 mb-3">Tap a building to check AQI at that location</p>

            {/* Building categories */}
            <div className="flex flex-col gap-1">
              {iareCollege.buildings.map(building => {
                const exists = stations.some(s => Math.abs(s.lat - building.lat) < 0.0005 && Math.abs(s.lng - building.lng) < 0.0005);
                return (
                  <button
                    key={building.name}
                    onClick={() => handleCollegeBuilding(building)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all active:scale-95 ${
                      exists ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'hover:bg-white/[0.05] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getBuildingIcon(building.type)}</span>
                      <span className="text-xs font-semibold">{building.name}</span>
                    </div>
                    {exists ? (
                      <span className="text-[9px] font-bold text-emerald-400 tabular-nums">
                        AQI {stations.find(s => Math.abs(s.lat - building.lat) < 0.0005)?.aqi || '...'}
                      </span>
                    ) : (
                      <span className="text-[8px] text-slate-600 uppercase">{building.type}</span>
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
              placeholder="Search cities or IARE buildings..."
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
        className="absolute bottom-[90px] left-4 right-4 z-[500] bg-[#0f1729]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.1] pt-3 pb-6 px-5 shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex flex-col mx-auto max-w-md"
        initial={false}
        animate={{ height: isSheetExpanded && selectedStation ? 'auto' : '100px' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.y > 50 || velocity.y > 500) {
            setIsSheetExpanded(false);
          } else if (offset.y < -50 || velocity.y < -500) {
            if (selectedStation) setIsSheetExpanded(true);
          }
        }}
      >
        {/* Handle */}
        <div className="w-full flex justify-center pb-2 cursor-pointer mb-2" onClick={() => setIsSheetExpanded(!isSheetExpanded)}>
          <div className="w-12 h-1.5 bg-slate-600/50 rounded-full hover:bg-slate-500 transition-colors" />
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
                              onClick={() => { setSelectedStation(s); fetchAiInsight(s); map?.panTo({ lat: s.lat, lng: s.lng }); }}
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
                       {/* AI typing scanline effect */}
                       <div className="absolute left-0 top-0 bottom-0 w-px bg-blue-500/30" />
                       
                       <p className="text-xs leading-relaxed text-blue-100/90 pl-3 font-mono">
                         {aiInsight.loading ? (
                           <span className="flex items-center gap-2">
                             <Loader2 size={12} className="animate-spin text-blue-500" /> Analyzing atmospheric data models locally...
                           </span>
                         ) : (
                           aiInsight.text
                         )}
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

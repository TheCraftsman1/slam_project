import { useState, useCallback, useRef, useEffect } from 'react';
import type { AqiStation, AddStationOptions, IareCollegeData } from '../types';
import type { AiInsightState } from '../services/aiService';
import { fetchAqiForLocation } from '../services/aqiService';
import { fetchIareCollegeData } from '../services/iareService';
import { reverseGeocode } from '../services/geocodeService';
import { fetchAiInsight } from '../services/aiService';
import { DEFAULT_IARE_COLLEGE, PRELOAD_CITIES } from '../utils/constants';

export interface InitProgress {
  step: number;
  total: number;
  label: string;
  done: boolean;
}

export function useAqiData() {
  const [stations, setStations] = useState<AqiStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<AqiStation | null>(null);
  const [iareCollege, setIareCollege] = useState<IareCollegeData>(DEFAULT_IARE_COLLEGE);
  const [aiInsight, setAiInsight] = useState<AiInsightState>({ loading: false, text: null });
  const [tappedLoading, setTappedLoading] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState<InitProgress>({ step: 0, total: 1, label: 'Initializing...', done: false });

  const insightRequestIdRef = useRef(0);
  const insightCacheRef = useRef<Map<string, string>>(new Map());
  const insightAbortRef = useRef<AbortController | null>(null);

  // Load IARE college data on mount
  useEffect(() => {
    const loadIareData = async () => {
      const data = await fetchIareCollegeData();
      if (data) setIareCollege(data);
    };
    loadIareData();
  }, []);

  // Fetch AI insight for a station
  const fetchInsightForStation = useCallback(async (station: AqiStation) => {
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

    try {
      const text = await fetchAiInsight(
        station,
        controller.signal,
        (state) => {
          if (requestId === insightRequestIdRef.current) {
            setAiInsight(state);
          }
        },
        insightCacheRef.current
      );
      if (requestId === insightRequestIdRef.current) {
        setAiInsight({ loading: false, text });
      }
    } catch {
      // handled in service
    }
  }, []);

  // Add a station with live AQI
  const addStation = useCallback(async (
    lat: number,
    lng: number,
    name: string,
    opts?: AddStationOptions
  ) => {
    const shouldAutoSelect = opts?.autoSelect !== false;
    const id = `${lat.toFixed(4)}_${lng.toFixed(4)}`;

    // Check for duplicates
    const existingStation = stations.find(s => Math.abs(s.lat - lat) < 0.005 && Math.abs(s.lng - lng) < 0.005);
    if (existingStation) {
      if (shouldAutoSelect) {
        setSelectedStation(existingStation);
        fetchInsightForStation(existingStation);
      }
      return;
    }

    // Add placeholder
    const placeholder: AqiStation = { id, name, lat, lng, aqi: 0, airData: null, loading: true, ...opts };
    
    setStations(prev => {
      // Remove any previous tapped stations that were auto-generated
      const withoutOldTapped = opts?.isTapped ? prev.filter(s => !s.isTapped || s.id === id) : prev;
      return [...withoutOldTapped, placeholder];
    });
    setTappedLoading(id);

    // Fetch real AQI
    const { data: airData, error } = await fetchAqiForLocation(lat, lng);
    const aqi = airData ? Math.round(airData.us_aqi) : 0;

    const complete: AqiStation = {
      id,
      name,
      lat,
      lng,
      aqi,
      airData,
      previousAqi: null,
      previousAirData: null,
      loading: false,
      lastFetched: new Date(),
      error,
      hasError: !!error,
      ...opts
    };
    setStations(prev => prev.map(s => s.id === id ? complete : s));
    setTappedLoading(null);

    if (shouldAutoSelect) {
      setSelectedStation(complete);
      fetchInsightForStation(complete);
    }
  }, [stations, fetchInsightForStation]);

  // Ref for addStation to avoid stale closure
  const addStationRef = useRef(addStation);
  useEffect(() => { addStationRef.current = addStation; }, [addStation]);

  // Refresh a single station
  const refreshStation = useCallback(async (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    if (!station) return;

    setStations(prev => prev.map(s => s.id === stationId ? { ...s, loading: true, error: null, hasError: false } : s));
    const { data: airData, error } = await fetchAqiForLocation(station.lat, station.lng);
    const aqi = airData ? Math.round(airData.us_aqi) : station.aqi;

    const updated = {
      ...station,
      previousAqi: station.aqi,
      previousAirData: station.airData,
      aqi,
      airData,
      loading: false,
      lastFetched: new Date(),
      error,
      hasError: !!error
    };
    setStations(prev => prev.map(s => s.id === stationId ? updated : s));
    if (selectedStation?.id === stationId) setSelectedStation(updated);
  }, [stations, selectedStation]);

  // Remove a tapped station
  const removeStation = useCallback((stationId: string) => {
    setStations(prev => prev.filter(s => s.id !== stationId));
    if (selectedStation?.id === stationId) {
      setSelectedStation(null);
    }
  }, [selectedStation]);

  // Select a station
  const selectStation = useCallback((station: AqiStation) => {
    setSelectedStation(station);
    fetchInsightForStation(station);
  }, [fetchInsightForStation]);

  // Initialize with user location and preload cities
  const initialize = useCallback(async () => {
    const totalSteps = PRELOAD_CITIES.length + 1; // +1 for user location

    setInitProgress({ step: 0, total: totalSteps, label: 'Detecting your location...', done: false });
      // HARDCODED IARE 5TH BLOCK INIT
      setTimeout(async () => {
        setInitProgress({ step: 1, total: totalSteps, label: 'Fetching local AQI...', done: false });
        const name = "5th Block, IARE"; 
        await addStationRef.current(17.599799, 78.418182, name, { isUserLocation: true });

        // Load preload cities
        for (let i = 0; i < PRELOAD_CITIES.length; i++) {
          await new Promise(r => setTimeout(r, 400));
          const c = PRELOAD_CITIES[i];
          setInitProgress({ step: i + 2, total: totalSteps, label: `Loading ${c.name}...`, done: false });
          await addStationRef.current(c.lat, c.lng, c.name, { autoSelect: false });
        }

        setInitProgress(prev => ({ ...prev, done: true }));
      }, 500);
      /* ORIGINAL CODE COMMENTED OUT    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          setInitProgress({ step: 1, total: totalSteps, label: 'Fetching local AQI...', done: false });
          const name = await reverseGeocode(lat, lon);
          addStationRef.current(lat, lon, name, { isUserLocation: true });
        },
        async () => {
          setInitProgress({ step: 1, total: totalSteps, label: 'Fetching local AQI...', done: false });
          addStationRef.current(17.6868, 83.2185, 'Visakhapatnam', { isUserLocation: true });
        },
//         { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
//       );
//     } else {
//       setInitProgress({ step: 1, total: totalSteps, label: 'Fetching local AQI...', done: false });
//       addStationRef.current(17.6868, 83.2185, 'Visakhapatnam', { isUserLocation: true });
//     }

//     // Load preload cities
//     for (let i = 0; i < PRELOAD_CITIES.length; i++) {
//       await new Promise(r => setTimeout(r, 400));
//       const c = PRELOAD_CITIES[i];
//       setInitProgress({ step: i + 2, total: totalSteps, label: `Loading ${c.name}...`, done: false });
//       addStationRef.current(c.lat, c.lng, c.name, { autoSelect: false });
//     }

//     setInitProgress(prev => ({ ...prev, done: true }));
//     */
  }, []);

  return {
    stations,
    selectedStation,
    iareCollege,
    aiInsight,
    tappedLoading,
    initProgress,
    addStation,
    addStationRef,
    refreshStation,
    removeStation,
    selectStation,
    setSelectedStation,
    initialize,
  };
}

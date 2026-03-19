import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Crosshair } from 'lucide-react';

// Types
import type { MetricKey, IareBuilding, City } from '../types';

// Hooks
import { useAqiData } from '../hooks/useAqiData';
import { useGeolocation } from '../hooks/useGeolocation';
import { useMapControls } from '../hooks/useMapControls';
import { SearchSuggestion } from '../hooks';

// Services
import { reverseGeocode, forwardGeocode } from '../services/geocodeService';

// Utils
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAP_ID } from '../utils/config';
import { darkMapStyle } from '../utils/mapStyles';
import { EXPLORE_CITIES } from '../utils/constants';

// Components
import { AqiMarker, BuildingLabel, MapControls } from './map';
import { SearchBar, FilterChips } from './search';
import { CityPanel, CollegePanel } from './panels';
import { AqiBottomSheet } from './sheets';

const libraries: ("places")[] = ["places"];

export function MapScreen() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricKey>('us_aqi');
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCityPanel, setShowCityPanel] = useState(false);
  const [showCollegePanel, setShowCollegePanel] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Custom hooks
  const {
    stations,
    selectedStation,
    iareCollege,
    aiInsight,
    initProgress,
    addStation,
    addStationRef,
    refreshStation,
    removeStation,
    selectStation,
    setSelectedStation,
    initialize,
  } = useAqiData();

  const { center, isLocating, locateUser } = useGeolocation();

  const {
    mapStyle,
    showLayers,
    is3D,
    currentZoom,
    setShowLayers,
    toggle3D,
    rotate3D,
    resetHeading,
    setMapStyle,
    updateZoom,
  } = useMapControls(map);

  // Map callbacks
  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);

    // Click-to-check AQI anywhere
    mapInstance.addListener('click', async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const name = await reverseGeocode(lat, lng);
      addStationRef.current(lat, lng, name, { isTapped: true });
    });

    // Track zoom changes
    mapInstance.addListener('zoom_changed', () => {
      updateZoom(mapInstance.getZoom() || 6);
    });
  }, [addStationRef, updateZoom]);

  const onUnmount = useCallback(() => setMap(null), []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Autocomplete select handler
  const handleSuggestionSelect = async (suggestion: SearchSuggestion) => {
    setIsSearching(true);
    if (suggestion.lat !== undefined && suggestion.lng !== undefined) {
      map?.panTo({ lat: suggestion.lat, lng: suggestion.lng });
      map?.setZoom(is3D ? 19 : 18);
      await addStationRef.current(suggestion.lat, suggestion.lng, suggestion.primaryText);
      setSearchQuery('');
    } else {
      const result = await forwardGeocode(`${suggestion.primaryText} ${suggestion.secondaryText}`);
      if (result) {
        map?.panTo({ lat: result.lat, lng: result.lng });
        map?.setZoom(is3D ? 18 : 12);
        await addStationRef.current(result.lat, result.lng, result.name);
        setSearchQuery('');
      }
    }
    setIsSearching(false);
  };

  // Search handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    const query = searchQuery.toLowerCase().trim();

    // Check for college building match
    const matchingBuilding = iareCollege.buildings.find(b =>
      b.name.toLowerCase().includes(query) ||
      query.includes(b.name.toLowerCase().split(' ')[0])
    );

    if (matchingBuilding) {
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

    // Normal geocode search
    const result = await forwardGeocode(searchQuery);
    if (result) {
      map?.panTo({ lat: result.lat, lng: result.lng });
      map?.setZoom(is3D ? 18 : 12);
      await addStationRef.current(result.lat, result.lng, result.name);
      setSearchQuery('');
    }
    setIsSearching(false);
  };

  // Quick-add a city
  const handleQuickCity = async (city: City) => {
    map?.panTo({ lat: city.lat, lng: city.lng });
    map?.setZoom(is3D ? 18 : 12);
    await addStationRef.current(city.lat, city.lng, city.name);
    setShowCityPanel(false);
  };

  // Quick-add a college building
  const handleCollegeBuilding = async (building: IareBuilding) => {
    map?.panTo({ lat: building.lat, lng: building.lng });
    map?.setZoom(is3D ? 19 : 18);
    await addStationRef.current(building.lat, building.lng, building.name, { isTapped: true });
    setShowCollegePanel(false);
  };

  // Go to college center
  const goToCollege = async () => {
    map?.panTo(iareCollege.center);
    map?.setZoom(is3D ? 18 : 17);
    setMapStyle('satellite');
    setShowCollegePanel(true);
    // Auto-fetch the main IARE campus AQI so there's always a big marker visible when zoomed out
    await addStationRef.current(iareCollege.center.lat, iareCollege.center.lng, 'IARE Campus', { isTapped: true });
  };

  // Locate me
  const handleLocateMe = () => {
    locateUser(map, is3D, async (lat, lng, name) => {
      await addStationRef.current(lat, lng, name, { isUserLocation: true });
    });
  };

  // Map options
  const mapOptions = {
    disableDefaultUI: true,
    styles: [
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ...(mapStyle === 'dark' && !is3D ? darkMapStyle : [])
    ],
    mapTypeId: mapStyle === 'satellite' ? (is3D ? 'hybrid' : 'satellite') : 'roadmap',
    gestureHandling: 'greedy' as const,
    clickableIcons: false,
    mapId: GOOGLE_MAP_ID,
    tilt: is3D ? 45 : 0,
  };

  // Loading state
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

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0b1120] font-display flex flex-col">
      {/* Map */}
      <div className="absolute inset-0 z-0">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={6}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {/* AQI Markers */}
          {stations.map(station => {
            const isIareStation = station.name.includes('IARE');

            // If this is the IARE Campus station, hide it when zoomed deep into the individual buildings
            if (isIareStation && station.isTapped && currentZoom >= 17) {
              return null; 
            }

            return (
              <OverlayView
                key={station.id}
                position={{ lat: station.lat, lng: station.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <AqiMarker
                  station={station}
                  isSelected={selectedStation?.id === station.id}
                  activeMetric={activeMetric}
                  onClick={() => {
                    selectStation(station);
                    setIsSheetExpanded(true);
                    if (isIareStation) goToCollege();
                  }}
                />
              </OverlayView>
            )
          })}

          {/* Building Labels with Level of Detail (LOD) */}
          {currentZoom >= 17 && iareCollege.buildings.map(building => {
            const isMainBlock = ['Bharadwaja Block', 'Aryabhatta Block', 'Abdul Kalam Block', '5th Block', 'IT Park'].includes(building.name);
            
            // Only show major blocks between Zoom 17 and 18.2. Show everything higher than 18.2.
            if (!isMainBlock && currentZoom < 18.2) {
              return null;
            }

            return (
              <OverlayView
                key={`building-${building.name}`}
                position={{ lat: building.lat, lng: building.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <BuildingLabel
                  name={building.name}
                  onClick={() => handleCollegeBuilding(building)}
                />
              </OverlayView>
            )
          })}

      {/* Map Controls */}
          <MapControls
            map={map}
            stationCount={stations.filter(s => !s.loading).length}
            isLocating={isLocating}
            is3D={is3D}
            showCityPanel={showCityPanel}
            showCollegePanel={showCollegePanel}
            showLayers={showLayers}
            mapStyle={mapStyle}
            onLocateMe={handleLocateMe}
            onToggleCityPanel={() => setShowCityPanel(!showCityPanel)}
            onGoToCollege={goToCollege}
            onToggle3D={toggle3D}
            onRotate3D={rotate3D}
            onResetHeading={resetHeading}
            onToggleLayers={() => setShowLayers(!showLayers)}
            onSetMapStyle={(style) => { setMapStyle(style); setShowLayers(false); }}
          />
        </GoogleMap>
      </div>

      {/* No Stations Empty State Overlay */}
      <AnimatePresence>
        {initProgress.done && stations.length === 0 && (
          <motion.div
            className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] flex flex-col items-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="bg-[#141820]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex flex-col items-center text-center max-w-[280px] pointer-events-auto">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 mb-4 flex items-center justify-center border border-white/[0.05]">
                <MapPin size={24} className="text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">No Stations Found</h3>
              <p className="text-xs text-slate-400 mb-5">There are no air quality stations near this location. Try searching for a different area.</p>
              <button
                onClick={handleLocateMe}
                className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold py-2.5 rounded-xl border border-blue-500/30 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Crosshair size={14} />
                Return to My Location
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* City Panel */}
      <AnimatePresence>
        {showCityPanel && (
          <CityPanel
            cities={EXPLORE_CITIES}
            stations={stations}
            onSelectCity={handleQuickCity}
            onClose={() => setShowCityPanel(false)}
          />
        )}
      </AnimatePresence>

      {/* College Panel */}
      <AnimatePresence>
        {showCollegePanel && (
          <CollegePanel
            college={iareCollege}
            stations={stations}
            onSelectBuilding={handleCollegeBuilding}
            onClose={() => setShowCollegePanel(false)}
          />
        )}
      </AnimatePresence>

      {/* Tap Instruction Toast */}
      {stations.length <= 1 && initProgress.done && (
        <motion.div
          className="absolute bottom-[200px] md:top-[140px] md:bottom-auto left-1/2 -translate-x-1/2 z-[500] bg-blue-500/15 backdrop-blur-xl border border-blue-500/20 rounded-full px-4 py-2 pointer-events-none shadow-xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <span className="text-[11px] font-semibold text-blue-300 drop-shadow-md">👆 Tap anywhere on the map to manually fetch live AQI</span>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="absolute top-0 left-0 w-full p-4 z-[500] flex flex-col gap-3 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <SearchBar
            searchQuery={searchQuery}
            isSearching={isSearching}
            onSearchQueryChange={setSearchQuery}
            onSearch={handleSearch}
            onClear={() => setSearchQuery('')}
            onSelectSuggestion={handleSuggestionSelect}
            iareCollege={iareCollege}
            isMapLoaded={isLoaded}
          />
        </div>

        {/* Filter Chips */}
        <FilterChips
          activeMetric={activeMetric}
          onMetricChange={setActiveMetric}
        />

        {/* Init Progress Bar */}
        <AnimatePresence>
          {!initProgress.done && (
            <motion.div
              className="pointer-events-auto max-w-md mx-auto w-full"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-[#0f1729]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-4 py-3 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loading Stations</span>
                  <span className="text-[10px] font-bold text-blue-400 tabular-nums">
                    {Math.min(initProgress.step, initProgress.total)}/{initProgress.total}
                  </span>
                </div>
                <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden mb-1.5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(100, (initProgress.step / initProgress.total) * 100)}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{initProgress.label}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Sheet */}
      <AqiBottomSheet
        selectedStation={selectedStation}
        stations={stations}
        isExpanded={isSheetExpanded}
        activeMetric={activeMetric}
        aiInsight={aiInsight}
        onToggleExpand={() => setIsSheetExpanded(!isSheetExpanded)}
        onSelectStation={(station) => {
          selectStation(station);
          setIsSheetExpanded(true);
        }}
        onRefreshStation={refreshStation}
        onRemoveStation={(id) => {
          removeStation(id);
          setIsSheetExpanded(false);
        }}
        onMetricChange={setActiveMetric}
        onPanTo={(lat, lng) => map?.panTo({ lat, lng })}
      />
    </div>
  );
}

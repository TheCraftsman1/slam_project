import { useState, useCallback } from 'react';
import type { MapStyle } from '../types';

export function useMapControls(map: google.maps.Map | null) {
  const [mapStyle, setMapStyleState] = useState<MapStyle>('dark');
  const [showLayers, setShowLayers] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [heading, setHeading] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(6);

  const toggle3D = useCallback(() => {
    setIs3D(prev => {
      const next = !prev;
      if (map) {
        if (next) {
          const currZoom = map.getZoom() || 6;
          if (currZoom < 16) map.setZoom(18);
          map.setTilt(45);
          map.setHeading(heading);
          setMapStyleState('satellite');
        } else {
          map.setTilt(0);
          map.setHeading(0);
          setMapStyleState('dark');
        }
      }
      return next;
    });
  }, [map, heading]);

  const rotate3D = useCallback((degrees: number) => {
    setHeading(prev => {
      const next = (prev + degrees) % 360;
      if (map && is3D) map.setHeading(next);
      return next;
    });
  }, [map, is3D]);

  const resetHeading = useCallback(() => {
    setHeading(0);
    if (map) map.setHeading(0);
  }, [map]);

  const setMapStyle = useCallback((style: MapStyle) => {
    setMapStyleState(style);
    setShowLayers(false);
  }, []);

  const updateZoom = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);

  return {
    mapStyle,
    showLayers,
    is3D,
    heading,
    currentZoom,
    setShowLayers,
    toggle3D,
    rotate3D,
    resetHeading,
    setMapStyle,
    updateZoom,
  };
}

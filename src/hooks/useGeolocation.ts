import { useState, useCallback } from 'react';
import { reverseGeocode } from '../services/geocodeService';
import { DEFAULT_CENTER } from '../utils/constants';

export function useGeolocation() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [isLocating, setIsLocating] = useState(false);

  const locateUser = useCallback(async (
    map: google.maps.Map | null,
    is3D: boolean,
    onLocationFound: (lat: number, lng: number, name: string) => void
  ) => {
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
        onLocationFound(lat, lon, name);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  return {
    center,
    setCenter,
    isLocating,
    locateUser,
  };
}

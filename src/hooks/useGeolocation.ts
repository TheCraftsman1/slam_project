import { useState, useCallback } from 'react';
import { reverseGeocode } from '../services/geocodeService';

// Force default location to IARE 5th Block for testing/demo
const IARE_5TH_BLOCK = { lat: 17.599799, lng: 78.418182 };

export function useGeolocation() {
  const [center, setCenter] = useState(IARE_5TH_BLOCK);
  const [isLocating, setIsLocating] = useState(false);

  const locateUser = useCallback(async (
    map: google.maps.Map | null,
    is3D: boolean,
    onLocationFound: (lat: number, lng: number, name: string) => void
  ) => {
    // Mocking the Geolocation API to always return 5th Block, IARE
    setIsLocating(true);
    
    setTimeout(async () => {
      const lat = IARE_5TH_BLOCK.lat;
      const lon = IARE_5TH_BLOCK.lng;
      const loc = { lat, lng: lon };
      
      setCenter(loc);
      map?.panTo(loc);
      map?.setZoom(is3D ? 18 : 14);
      
      // We can hardcode the name or still use reverse geocode
      const name = "5th Block, IARE"; 
      onLocationFound(lat, lon, name);
      setIsLocating(false);
    }, 800); // Small timeout to simulate GPS delay
    
    /* ORIGINAL GPS CODE COMMENTED OUT:
    if (!("geolocation" in navigator)) return;

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
    */
  }, []);

  return {
    center,
    setCenter,
    isLocating,
    locateUser,
  };
}

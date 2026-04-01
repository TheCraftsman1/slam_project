import { useState, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
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
    
    /* COMMENTED OUT MOCK CODE FOR IARE 5TH BLOCK:
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
    */
    
    // REALLY GET DEVICE LOCATION THIS TIME
    try {
      let lat: number;
      let lon: number;

      if (Capacitor.isNativePlatform()) {
        // First check permissions (wrap in try-catch because web implementation might throw Unimplemented)
        try {
          let permissions = await Geolocation.checkPermissions();
          if (permissions.location !== 'granted') {
            permissions = await Geolocation.requestPermissions();
            if (permissions.location !== 'granted') {
              console.warn("Location permission denied");
              setIsLocating(false);
              return;
            }
          }
        } catch (permError) {
          console.log("Permission check not fully supported on this platform, falling back to direct request");
        }

        // Use native Capacitor Location Services
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });

        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } else {
        // High accuracy HTML5 Geolocation API for Web (Chrome/Firefox/Safari)
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      }

      const loc = { lat, lng: lon };
      setCenter(loc);
      map?.panTo(loc);
      map?.setZoom(is3D ? 20 : 18);
      
      const name = await reverseGeocode(lat, lon);
      onLocationFound(lat, lon, name);
    } catch (error: any) {
      console.error("Geolocation error:", error.message || error);
      // Optional: Add a UI toast here for errors like "User denied Geolocation"
    } finally {
      setIsLocating(false);
    }
  }, []);

  return {
    center,
    setCenter,
    isLocating,
    locateUser,
  };
}

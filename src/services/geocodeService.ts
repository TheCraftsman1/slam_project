import { GOOGLE_MAPS_API_KEY } from '../utils/config';
import { fetchNearestIareBuilding } from './iareService';
import type { GeocodeResult } from '../types';

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
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

export async function forwardGeocode(query: string): Promise<GeocodeResult | null> {
  try {
    const resp = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await resp.json();
    if (data?.results?.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      const name = data.results[0].address_components.find((c: any) => c.types.includes('locality'))?.long_name ||
        data.results[0].address_components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name || query;
      return { lat, lng, name };
    }
    return null;
  } catch {
    return null;
  }
}

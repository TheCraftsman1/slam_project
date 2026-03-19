import type { AirQualityData } from '../types';
import { fetchWithRetry, isNetworkError } from '../utils/retry';

export interface AqiFetchResult {
  data: AirQualityData | null;
  error: string | null;
}

export async function fetchAqiForLocation(lat: number, lng: number): Promise<AqiFetchResult> {
  try {
    const data = await fetchWithRetry(async () => {
      const resp = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`
      );
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const json = await resp.json();
      return json?.current ?? null;
    }, { maxRetries: 2, baseDelay: 500 });

    return { data, error: null };
  } catch (error) {
    const message = isNetworkError(error)
      ? 'Network unavailable'
      : 'Failed to fetch AQI data';
    return { data: null, error: message };
  }
}

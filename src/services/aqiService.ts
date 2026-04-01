import type { AirQualityData } from '../types';
import { fetchWithRetry, isNetworkError } from '../utils/retry';
import { GOOGLE_MAPS_API_KEY } from '../utils/config';

export interface AqiFetchResult {
  data: AirQualityData | null;
  error: string | null;
}

export async function fetchAqiForLocation(lat: number, lng: number): Promise<AqiFetchResult> {
  try {
    const data = await fetchWithRetry(async () => {
      const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_MAPS_API_KEY}`;
      const payload = {
        location: { latitude: lat, longitude: lng },
        extraComputations: ["LOCAL_AQI", "POLLUTANT_CONCENTRATION"]
      };

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      
      const json = await resp.json();
      
      // Default fallback values
      let us_aqi = -1;
      let pm2_5 = -1;
      let pm10 = -1;
      let carbon_monoxide = -1;
      let nitrogen_dioxide = -1;
      let sulphur_dioxide = -1;
      let ozone = -1;

      // Extract India NAQI if available, else fallback to Universal AQI
      if (json.indexes && json.indexes.length > 0) {
        const indAqi = json.indexes.find((idx: any) => idx.code?.toLowerCase() === "ind_cpcb");
        if (indAqi && indAqi.aqi !== undefined) {
          us_aqi = indAqi.aqi;
        } else {
          const universalAqi = json.indexes.find((idx: any) => idx.code?.toLowerCase() === "uaqi");
          if (universalAqi && universalAqi.aqi !== undefined) {
             us_aqi = universalAqi.aqi;
          } else {
             us_aqi = json.indexes[0].aqi || -1;
          }
        }
      }

      // Extract pollutant concentrations
      if (json.pollutants && json.pollutants.length > 0) {
        json.pollutants.forEach((p: any) => {
          const val = p.concentration?.value ?? -1;
          switch (p.code) {
            case "pm25": pm2_5 = val; break;
            case "pm10": pm10 = val; break;
            case "co": carbon_monoxide = val; break;
            case "no2": nitrogen_dioxide = val; break;
            case "so2": sulphur_dioxide = val; break;
            case "o3": ozone = val; break;
          }
        });
      }

      const current = {
        us_aqi,
        pm2_5,
        pm10,
        carbon_monoxide,
        nitrogen_dioxide,
        sulphur_dioxide,
        ozone
      };
      
      return current;
    }, { maxRetries: 2, baseDelay: 500 });

    return { data, error: null };
  } catch (error) {
    const message = isNetworkError(error)
      ? 'Network unavailable'
      : 'Failed to fetch AQI data';
    return { data: null, error: message };
  }
}

export interface HistoricalAqiFetchResult {
  data: any | null;
  error: string | null;
}

export async function fetchHistoricalAqi(lat: number, lng: number, startDate: string, endDate: string): Promise<HistoricalAqiFetchResult> {
  try {
    const data = await fetchWithRetry(async () => {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&start_date=${startDate}&end_date=${endDate}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const json = await resp.json();
      return json?.hourly ?? null;
    }, { maxRetries: 2, baseDelay: 500 });

    return { data, error: null };
  } catch (error) {
    const message = isNetworkError(error)
      ? 'Network unavailable'
      : 'Failed to fetch historical AQI data';
    return { data: null, error: message };
  }
}

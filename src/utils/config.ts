// Environment detection
export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;
export const mode = import.meta.env.MODE;

// API Keys & URLs from environment variables
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || '';
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// App constants
export const AUTO_REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes
export const AQI_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
export const GEOLOCATION_TIMEOUT = 15000; // 15 seconds
export const GEOLOCATION_MAX_AGE = 0;

// Validate required config in development
if (isDev) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[Config] VITE_GOOGLE_MAPS_API_KEY is not set. Map features may not work.');
  }
}

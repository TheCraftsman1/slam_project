export interface AqiStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  airData: AirQualityData | null;
  previousAqi?: number | null;
  previousAirData?: AirQualityData | null;
  isUserLocation?: boolean;
  isTapped?: boolean;
  loading?: boolean;
  lastFetched?: Date;
  error?: string | null;
  hasError?: boolean;
  retryCount?: number;
}

export interface AirQualityData {
  us_aqi: number;
  pm2_5: number;
  pm10: number;
  carbon_monoxide: number;
  nitrogen_dioxide: number;
  sulphur_dioxide: number;
  ozone: number;
}

export interface AddStationOptions {
  isUserLocation?: boolean;
  isTapped?: boolean;
  autoSelect?: boolean;
}

export type MetricKey = 'us_aqi' | 'pm2_5' | 'nitrogen_dioxide' | 'carbon_monoxide' | 'ozone' | 'sulphur_dioxide';

export interface AqiColorInfo {
  bg: string;
  border: string;
  text: string;
  hex: string;
  label: string;
  emoji: string;
}

export interface MetricOption {
  key: MetricKey;
  label: string;
}

export const METRIC_OPTIONS: MetricOption[] = [
  { key: 'us_aqi', label: 'AQI' },
  { key: 'pm2_5', label: 'PM2.5' },
  { key: 'ozone', label: 'O₃' },
  { key: 'nitrogen_dioxide', label: 'NO₂' },
  { key: 'carbon_monoxide', label: 'CO' },
  { key: 'sulphur_dioxide', label: 'SO₂' },
];

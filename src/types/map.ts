export type MapStyle = 'dark' | 'light' | 'satellite';

export interface MapPosition {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  name: string;
}

export interface NearestBuildingResult {
  name: string;
  distance_m: number;
  is_near_campus: boolean;
}

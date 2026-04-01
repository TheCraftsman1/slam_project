import type { City, IareCollegeData } from '../types';

export const EXPLORE_CITIES: City[] = [
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
];

export const PRELOAD_CITIES: City[] = [
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
];

export const DEFAULT_IARE_COLLEGE: IareCollegeData = {
  name: 'IARE',
  fullName: 'Institute of Aeronautical Engineering',
  center: { lat: 17.6001, lng: 78.4175 },
  buildings: [
    { name: 'Bharadwaja Block', lat: 17.599903, lng: 78.416924, type: 'academic' },
    { name: 'Abdul Kalam Block', lat: 17.599639, lng: 78.417294, type: 'academic' },
    { name: 'Aryabhatta Block', lat: 17.599878, lng: 78.417661, type: 'academic' },
    { name: '5th Block', lat: 17.599799, lng: 78.418182, type: 'academic' },
    { name: 'IT Park', lat: 17.600183, lng: 78.418238, type: 'academic' },
    { name: 'TIIC Center', lat: 17.600462, lng: 78.416978, type: 'facility' },
    { name: 'IARE Canteen', lat: 17.600247, lng: 78.418606, type: 'facility' },
    { name: 'Engineering Workshop', lat: 17.599523, lng: 78.418172, type: 'facility' },
    { name: 'Indoor Badminton Court', lat: 17.600932, lng: 78.417066, type: 'sports' },
    { name: 'Basketball Court', lat: 17.599784, lng: 78.418563, type: 'sports' },
    { name: 'IARE Parking', lat: 17.600968, lng: 78.417310, type: 'facility' },
    { name: 'Car Parking', lat: 17.600607, lng: 78.417410, type: 'facility' },
    { name: 'Main Entrance', lat: 17.600372, lng: 78.416849, type: 'entrance' },
  ]
};

export const DEFAULT_CENTER = { lat: 17.6001, lng: 78.4175 }; // Default to IARE center instead of Vizag

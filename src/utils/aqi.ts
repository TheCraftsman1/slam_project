import type { AqiColorInfo, BuildingType } from '../types';

export const getAqiColor = (aqi: number): AqiColorInfo => {
  if (aqi > 300) return { bg: 'bg-purple-500', border: 'border-purple-500/40', text: 'text-purple-400', hex: '#a855f7', label: 'Hazardous', emoji: '☣️' };
  if (aqi > 200) return { bg: 'bg-purple-500', border: 'border-purple-500/40', text: 'text-purple-400', hex: '#a855f7', label: 'Very Unhealthy', emoji: '😷' };
  if (aqi > 150) return { bg: 'bg-red-500', border: 'border-red-500/40', text: 'text-red-400', hex: '#ef4444', label: 'Unhealthy', emoji: '😟' };
  if (aqi > 100) return { bg: 'bg-orange-500', border: 'border-orange-500/40', text: 'text-orange-400', hex: '#f97316', label: 'Sensitive', emoji: '😐' };
  if (aqi > 50) return { bg: 'bg-yellow-500', border: 'border-yellow-500/40', text: 'text-yellow-400', hex: '#eab308', label: 'Moderate', emoji: '🙂' };
  return { bg: 'bg-green-500', border: 'border-green-500/40', text: 'text-green-400', hex: '#22c55e', label: 'Good', emoji: '😊' };
};

export const getBuildingIcon = (type: BuildingType): string => {
  switch (type) {
    case 'academic': return '🏛️';
    case 'library': return '📚';
    case 'admin': return '🏢';
    case 'facility': return '🏪';
    case 'sports': return '🏟️';
    case 'hostel': return '🏠';
    case 'entrance': return '🚪';
    default: return '📍';
  }
};

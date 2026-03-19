import { BACKEND_URL } from '../utils/config';
import type { IareCollegeData, NearestBuildingResult } from '../types';

export async function fetchIareCollegeData(): Promise<IareCollegeData | null> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/iare/buildings`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data?.center || !Array.isArray(data?.buildings)) return null;
    return {
      name: data.name || 'IARE',
      fullName: data.full_name || data.fullName || 'Institute of Aeronautical Engineering',
      center: data.center,
      buildings: data.buildings,
    };
  } catch {
    return null;
  }
}

export async function fetchNearestIareBuilding(lat: number, lng: number): Promise<NearestBuildingResult | null> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/iare/nearest?latitude=${lat}&longitude=${lng}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data?.nearest?.name) return null;
    return {
      name: data.nearest.name,
      distance_m: data.nearest.distance_m ?? 99999,
      is_near_campus: !!data.is_near_campus,
    };
  } catch {
    return null;
  }
}

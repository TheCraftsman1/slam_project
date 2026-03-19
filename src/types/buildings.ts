export interface IareBuilding {
  name: string;
  lat: number;
  lng: number;
  type: BuildingType;
}

export type BuildingType = 'academic' | 'library' | 'admin' | 'facility' | 'sports' | 'hostel' | 'entrance';

export interface IareCollegeData {
  name: string;
  fullName: string;
  center: { lat: number; lng: number };
  buildings: IareBuilding[];
}

export interface City {
  name: string;
  lat: number;
  lng: number;
}

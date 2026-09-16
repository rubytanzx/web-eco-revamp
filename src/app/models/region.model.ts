export interface CountryEntry {
  iso: string;
  regionId: string | null;
  path: string | null;
  hasPolygon: boolean;
}

export interface RegionEntry {
  id: string;
  name: string;
  shortName: string;
  color: string;
  officeCity: string;
  countries: string[];
  stat: string;
  markerX: number;
  markerY: number;
}

export interface MarkerOnlyEntry {
  iso: string;
  regionId: string;
  markerX: number | null;
  markerY: number | null;
}

export interface LiaisonOffice {
  id: string;
  name: string;
  city: string;
  markerX: number | null;
  markerY: number | null;
}

export interface MapData {
  viewBox: string;
  width: number;
  height: number;
  countries: CountryEntry[];
  regions: RegionEntry[];
  markerOnly: MarkerOnlyEntry[];
  liaisonOffices?: LiaisonOffice[];
}

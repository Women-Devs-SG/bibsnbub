export type Location = {
  id: number;
} & Address;

export type Amenity = {
  id: number;
  name: string;
  description: string | null;
  is_multiple_applicable: boolean;
};

export type Facility = {
  id: number;
  location_id: number;
  facility_type_id: number;
  floor: string;
  how_to_access: string | null;
  description: string | null;
  has_diaper_changing_station: boolean;
  has_lactation_room: boolean;
  amenities?: Amenity[];
  created_by: string;
  created_at: string;
};

export type FacilityType = {
  id: number;
  name: string;
};

export type Address = {
  building?: string;
  block?: string;
  road?: string;
  address: string;
  latitude: number;
  longitude: number;
  opensAt: string | null;
  closesAt: string | null;
};

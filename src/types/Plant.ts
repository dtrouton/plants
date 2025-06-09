export interface Plant {
  id: number;
  name: string;
  species_id?: number;
  species_name?: string;
  photo_uri?: string;
  location: string;
  created_date: string;
  last_watered?: string;
}

export interface PlantSpecies {
  species_id: number;
  common_name: string;
  scientific_name?: string;
  watering_frequency?: number; // days
  light_requirements?: string;
  care_instructions?: string;
  cached_date: string;
}

export interface WateringRecord {
  id: number;
  plant_id: number;
  watered_date: string;
  notes?: string;
}
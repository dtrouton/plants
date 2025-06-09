import axios from 'axios';

// Perenual API configuration
const PERENUAL_API_KEY = 'sk-NXyN675e25e05f8bb7945'; // Free tier API key
const PERENUAL_BASE_URL = 'https://perenual.com/api';

export interface PlantSpeciesAPI {
  id: number;
  common_name: string;
  scientific_name: string[];
  other_name?: string[];
  cycle?: string;
  watering?: string;
  sunlight?: string[];
  default_image?: {
    medium_url?: string;
    original_url?: string;
  };
}

export interface PlantDetailsAPI {
  id: number;
  common_name: string;
  scientific_name: string[];
  other_name?: string[];
  family?: string;
  origin?: string[];
  type?: string;
  dimension?: string;
  dimensions?: {
    type?: string;
    min_value?: number;
    max_value?: number;
    unit?: string;
  };
  cycle?: string;
  watering?: string;
  depth_water_requirement?: {
    unit?: string;
    value?: string;
  };
  volume_water_requirement?: {
    unit?: string;
    value?: string;
  };
  watering_period?: string;
  watering_general_benchmark?: {
    value?: string;
    unit?: string;
  };
  plant_anatomy?: {
    bark?: string;
    leaf?: string;
  }[];
  sunlight?: string[];
  pruning_month?: string[];
  pruning_count?: {
    amount?: number;
    interval?: string;
  };
  seeds?: number;
  attracts?: string[];
  propagation?: string[];
  hardiness?: {
    min?: string;
    max?: string;
  };
  hardiness_location?: {
    full_url?: string;
    full_iframe?: string;
  };
  flowers?: boolean;
  flowering_season?: string;
  color?: string;
  soil?: string[];
  pest_susceptibility?: string[];
  cones?: boolean;
  fruits?: boolean;
  edible_fruit?: boolean;
  edible_fruit_taste_profile?: string;
  fruit_nutritional_value?: string;
  fruit_color?: string[];
  harvest_season?: string;
  leaf?: boolean;
  leaf_color?: string[];
  edible_leaf?: boolean;
  cuisine?: boolean;
  medicinal?: boolean;
  poisonous_to_humans?: number;
  poisonous_to_pets?: number;
  description?: string;
  default_image?: {
    license?: number;
    license_name?: string;
    license_url?: string;
    original_url?: string;
    regular_url?: string;
    medium_url?: string;
    small_url?: string;
    thumbnail?: string;
  };
  other_images?: {
    license?: number;
    license_name?: string;
    license_url?: string;
    original_url?: string;
    regular_url?: string;
    medium_url?: string;
    small_url?: string;
    thumbnail?: string;
  }[];
}

class PlantAPIService {
  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response = await axios.get(`${PERENUAL_BASE_URL}${endpoint}`, {
        params: {
          key: PERENUAL_API_KEY,
          ...params,
        },
        timeout: 10000, // 10 second timeout
      });

      return response.data;
    } catch (error) {
      console.error('Plant API error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('API key is invalid or expired');
        } else if (error.response?.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please check your internet connection.');
        }
      }
      throw new Error('Failed to fetch plant data. Please try again.');
    }
  }

  async searchPlants(query: string, page: number = 1): Promise<{ data: PlantSpeciesAPI[]; to: number; per_page: number; current_page: number; from: number; last_page: number; total: number }> {
    if (!query.trim()) {
      return {
        data: [],
        to: 0,
        per_page: 30,
        current_page: 1,
        from: 0,
        last_page: 1,
        total: 0,
      };
    }

    return this.makeRequest('/species-list', {
      q: query.trim(),
      page,
    });
  }

  async getPlantDetails(plantId: number): Promise<PlantDetailsAPI> {
    return this.makeRequest(`/species/details/${plantId}`);
  }

  // Convert API watering info to days
  convertWateringToDays(watering?: string): number | null {
    if (!watering) return null;
    
    const lowerWatering = watering.toLowerCase();
    
    // Map common watering frequencies to days
    if (lowerWatering.includes('daily') || lowerWatering.includes('every day')) {
      return 1;
    } else if (lowerWatering.includes('twice a week')) {
      return 3;
    } else if (lowerWatering.includes('weekly') || lowerWatering.includes('once a week')) {
      return 7;
    } else if (lowerWatering.includes('twice a month') || lowerWatering.includes('biweekly')) {
      return 14;
    } else if (lowerWatering.includes('monthly') || lowerWatering.includes('once a month')) {
      return 30;
    } else if (lowerWatering.includes('rarely') || lowerWatering.includes('infrequent')) {
      return 60;
    } else if (lowerWatering.includes('minimum')) {
      return 14; // Default for minimum watering
    } else if (lowerWatering.includes('average')) {
      return 7; // Default for average watering
    } else if (lowerWatering.includes('frequent')) {
      return 3; // Default for frequent watering
    }

    // Try to extract number of days from text like "every 5 days"
    const dayMatch = lowerWatering.match(/every\s+(\d+)\s+days?/);
    if (dayMatch) {
      return parseInt(dayMatch[1], 10);
    }

    // Default fallback
    return 7;
  }

  // Format sunlight requirements
  formatSunlight(sunlight?: string[]): string {
    if (!sunlight || sunlight.length === 0) return 'Unknown';
    return sunlight.join(', ');
  }

  // Create care instructions from API data
  createCareInstructions(plant: PlantDetailsAPI): string {
    const instructions: string[] = [];

    if (plant.watering) {
      instructions.push(`💧 Watering: ${plant.watering}`);
    }

    if (plant.sunlight && plant.sunlight.length > 0) {
      instructions.push(`☀️ Light: ${this.formatSunlight(plant.sunlight)}`);
    }

    if (plant.soil && plant.soil.length > 0) {
      instructions.push(`🌱 Soil: ${plant.soil.join(', ')}`);
    }

    if (plant.watering_period) {
      instructions.push(`📅 Watering Period: ${plant.watering_period}`);
    }

    if (plant.pruning_month && plant.pruning_month.length > 0) {
      instructions.push(`✂️ Pruning: ${plant.pruning_month.join(', ')}`);
    }

    if (plant.flowering_season) {
      instructions.push(`🌸 Flowering: ${plant.flowering_season}`);
    }

    if (plant.description) {
      instructions.push(`📝 Description: ${plant.description}`);
    }

    return instructions.length > 0 ? instructions.join('\n\n') : 'No specific care instructions available.';
  }
}

export default new PlantAPIService();
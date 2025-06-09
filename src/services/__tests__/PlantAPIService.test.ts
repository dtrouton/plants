import PlantAPIService from '../PlantAPIService';
import axios from 'axios';
import { PERENUAL_API_KEY, PERENUAL_BASE_URL } from '../../constants/api';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PlantAPIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchPlants', () => {
    it('should return empty results for empty query', async () => {
      const result = await PlantAPIService.searchPlants('');
      
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should search plants successfully with correct API call', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 1,
              common_name: 'Test Plant',
              scientific_name: ['Testus plantus'],
              watering: 'Weekly',
              sunlight: ['Bright indirect light'],
              default_image: {
                medium_url: 'https://example.com/image.jpg',
              },
            },
          ],
          total: 1,
          per_page: 30,
          current_page: 1,
          from: 1,
          last_page: 1,
          to: 1,
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await PlantAPIService.searchPlants('test', 2);
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].common_name).toBe('Test Plant');
      expect(result.total).toBe(1);
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${PERENUAL_BASE_URL}/species-list`,
        {
          params: {
            key: PERENUAL_API_KEY,
            q: 'test',
            page: 2,
          },
          timeout: 10000,
        }
      );
    });

    it('should handle 401 unauthorized error', async () => {
      const error = {
        response: { status: 401 },
      };
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(PlantAPIService.searchPlants('test')).rejects.toThrow(
        'API key is invalid or expired'
      );
    });

    it('should handle 429 rate limit error', async () => {
      const error = {
        response: { status: 429 },
      };
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(PlantAPIService.searchPlants('test')).rejects.toThrow(
        'API rate limit exceeded. Please try again later.'
      );
    });

    it('should handle timeout error', async () => {
      const error = {
        code: 'ECONNABORTED',
      };
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(PlantAPIService.searchPlants('test')).rejects.toThrow(
        'Request timeout. Please check your internet connection.'
      );
    });

    it('should handle general network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(PlantAPIService.searchPlants('test')).rejects.toThrow(
        'Failed to fetch plant data. Please try again.'
      );
    });
  });

  describe('getPlantDetails', () => {
    it('should fetch plant details successfully', async () => {
      const mockPlantDetails = {
        id: 1,
        common_name: 'Detailed Plant',
        scientific_name: ['Detailus plantus'],
        watering: 'Every 7 days',
        sunlight: ['Full sun', 'Partial shade'],
        soil: ['Well-drained', 'Sandy'],
        description: 'A beautiful plant',
      };

      mockedAxios.get.mockResolvedValue({ data: mockPlantDetails });

      const result = await PlantAPIService.getPlantDetails(1);

      expect(result).toEqual(mockPlantDetails);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${PERENUAL_BASE_URL}/species/details/1`,
        {
          params: { key: PERENUAL_API_KEY },
          timeout: 10000,
        }
      );
    });
  });

  describe('convertWateringToDays', () => {
    it('should convert common watering frequencies correctly', () => {
      expect(PlantAPIService.convertWateringToDays('daily')).toBe(1);
      expect(PlantAPIService.convertWateringToDays('twice a week')).toBe(3);
      expect(PlantAPIService.convertWateringToDays('weekly')).toBe(7);
      expect(PlantAPIService.convertWateringToDays('biweekly')).toBe(14);
      expect(PlantAPIService.convertWateringToDays('monthly')).toBe(30);
      expect(PlantAPIService.convertWateringToDays('rarely')).toBe(60);
    });

    it('should extract days from "every X days" format', () => {
      expect(PlantAPIService.convertWateringToDays('every 5 days')).toBe(5);
      expect(PlantAPIService.convertWateringToDays('every 10 days')).toBe(10);
    });

    it('should return default for unknown frequencies', () => {
      expect(PlantAPIService.convertWateringToDays('unknown frequency')).toBe(7);
      expect(PlantAPIService.convertWateringToDays('some random text')).toBe(7);
    });

    it('should return null for undefined input', () => {
      expect(PlantAPIService.convertWateringToDays()).toBeNull();
    });
  });

  describe('formatSunlight', () => {
    it('should format multiple sunlight requirements', () => {
      expect(PlantAPIService.formatSunlight(['Full sun', 'Partial shade'])).toBe(
        'Full sun, Partial shade'
      );
    });

    it('should handle single sunlight requirement', () => {
      expect(PlantAPIService.formatSunlight(['Full sun'])).toBe('Full sun');
    });

    it('should return "Unknown" for empty or undefined arrays', () => {
      expect(PlantAPIService.formatSunlight([])).toBe('Unknown');
      expect(PlantAPIService.formatSunlight()).toBe('Unknown');
    });
  });

  describe('createCareInstructions', () => {
    it('should create comprehensive care instructions', () => {
      const mockPlant = {
        id: 1,
        common_name: 'Test Plant',
        scientific_name: ['Testus plantus'],
        watering: 'Weekly',
        sunlight: ['Bright light'],
        soil: ['Well-drained'],
        watering_period: 'Spring to Fall',
        pruning_month: ['March', 'April'],
        flowering_season: 'Summer',
        description: 'A lovely test plant',
      } as any;

      const instructions = PlantAPIService.createCareInstructions(mockPlant);

      expect(instructions).toContain('💧 Watering: Weekly');
      expect(instructions).toContain('☀️ Light: Bright light');
      expect(instructions).toContain('🌱 Soil: Well-drained');
      expect(instructions).toContain('📅 Watering Period: Spring to Fall');
      expect(instructions).toContain('✂️ Pruning: March, April');
      expect(instructions).toContain('🌸 Flowering: Summer');
      expect(instructions).toContain('📝 Description: A lovely test plant');
    });

    it('should handle plants with minimal information', () => {
      const mockPlant = {
        id: 1,
        common_name: 'Simple Plant',
        scientific_name: ['Simplius plantus'],
      } as any;

      const instructions = PlantAPIService.createCareInstructions(mockPlant);

      expect(instructions).toBe('No specific care instructions available.');
    });

    it('should handle plants with partial information', () => {
      const mockPlant = {
        id: 1,
        common_name: 'Partial Plant',
        scientific_name: ['Partialis plantus'],
        watering: 'Weekly',
        sunlight: ['Bright light'],
      } as any;

      const instructions = PlantAPIService.createCareInstructions(mockPlant);

      expect(instructions).toContain('💧 Watering: Weekly');
      expect(instructions).toContain('☀️ Light: Bright light');
      expect(instructions).not.toContain('🌱 Soil:');
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle axios error without response', async () => {
      const error = new Error('Network error');
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(PlantAPIService.searchPlants('test')).rejects.toThrow(
        'Failed to fetch plant data. Please try again.'
      );
    });

    it('should handle non-axios errors', async () => {
      const error = new Error('Some other error');
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(PlantAPIService.searchPlants('test')).rejects.toThrow(
        'Failed to fetch plant data. Please try again.'
      );
    });
  });
});
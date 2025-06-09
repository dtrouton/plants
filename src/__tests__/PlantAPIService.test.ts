import PlantAPIService from '../services/PlantAPIService';
import axios from 'axios';

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
    });

    it('should search plants successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 1,
              common_name: 'Test Plant',
              scientific_name: ['Testus plantus'],
              watering: 'Weekly',
              sunlight: ['Bright indirect light'],
            },
          ],
          total: 1,
          per_page: 30,
          current_page: 1,
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await PlantAPIService.searchPlants('test');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].common_name).toBe('Test Plant');
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(PlantAPIService.searchPlants('test')).rejects.toThrow(
        'Failed to fetch plant data. Please try again.'
      );
    });
  });

  describe('convertWateringToDays', () => {
    it('should convert watering frequencies correctly', () => {
      expect(PlantAPIService.convertWateringToDays('daily')).toBe(1);
      expect(PlantAPIService.convertWateringToDays('weekly')).toBe(7);
      expect(PlantAPIService.convertWateringToDays('monthly')).toBe(30);
      expect(PlantAPIService.convertWateringToDays('every 5 days')).toBe(5);
      expect(PlantAPIService.convertWateringToDays('unknown')).toBe(7);
      expect(PlantAPIService.convertWateringToDays()).toBeNull();
    });
  });

  describe('formatSunlight', () => {
    it('should format sunlight requirements', () => {
      expect(PlantAPIService.formatSunlight(['Full sun', 'Partial shade'])).toBe(
        'Full sun, Partial shade'
      );
      expect(PlantAPIService.formatSunlight([])).toBe('Unknown');
      expect(PlantAPIService.formatSunlight()).toBe('Unknown');
    });
  });
});

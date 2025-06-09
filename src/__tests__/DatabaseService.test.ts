import DatabaseService from '../database/DatabaseService';
import { Plant, PlantSpecies, WateringRecord } from '../types/Plant';

describe('DatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Plant Operations', () => {
    it('should create a new plant', async () => {
      const mockPlant: Omit<Plant, 'id'> = {
        name: 'Test Plant',
        species_name: 'Test Species',
        location: 'Living Room',
        created_date: '2023-01-01T00:00:00.000Z',
      };

      const plantId = await DatabaseService.createPlant(mockPlant);
      expect(typeof plantId).toBe('number');
    });

    it('should retrieve all plants', async () => {
      const plants = await DatabaseService.getAllPlants();
      expect(Array.isArray(plants)).toBe(true);
    });

    it('should update a plant', async () => {
      const updates: Partial<Plant> = {
        name: 'Updated Plant Name',
        location: 'Bedroom',
      };

      await expect(DatabaseService.updatePlant(1, updates)).resolves.not.toThrow();
    });

    it('should delete a plant', async () => {
      await expect(DatabaseService.deletePlant(1)).resolves.not.toThrow();
    });
  });

  describe('Watering Record Operations', () => {
    it('should add a watering record', async () => {
      const mockRecord: Omit<WateringRecord, 'id'> = {
        plant_id: 1,
        watered_date: '2023-01-01T00:00:00.000Z',
        notes: 'Test watering',
      };

      const recordId = await DatabaseService.addWateringRecord(mockRecord);
      expect(typeof recordId).toBe('number');
    });

    it('should retrieve watering records for a plant', async () => {
      const records = await DatabaseService.getWateringRecords(1);
      expect(Array.isArray(records)).toBe(true);
    });
  });

  describe('Plant Species Operations', () => {
    it('should create a plant species', async () => {
      const mockSpecies: Omit<PlantSpecies, 'species_id'> = {
        common_name: 'Test Plant',
        scientific_name: 'Testus plantus',
        watering_frequency: 7,
        light_requirements: 'Bright indirect light',
        care_instructions: 'Water weekly',
        cached_date: '2023-01-01T00:00:00.000Z',
      };

      const speciesId = await DatabaseService.createPlantSpecies(mockSpecies);
      expect(typeof speciesId).toBe('number');
    });

    it('should search plant species', async () => {
      const species = await DatabaseService.searchPlantSpecies('test');
      expect(Array.isArray(species)).toBe(true);
    });
  });
});

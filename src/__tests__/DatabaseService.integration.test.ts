import DatabaseService from '../database/DatabaseService';
import { Plant, PlantSpecies, WateringRecord } from '../types/Plant';

// Mock the SQLite module properly
const mockExecuteSql = jest.fn();
const mockClose = jest.fn();
const mockDatabase = {
  executeSql: mockExecuteSql,
  close: mockClose,
};

jest.mock('react-native-sqlite-storage', () => ({
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  openDatabase: jest.fn(() => Promise.resolve(mockDatabase)),
}));

describe('DatabaseService Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the database instance for each test
    (DatabaseService as any).db = mockDatabase;
    mockExecuteSql.mockResolvedValue([{ insertId: 1, rows: { length: 0, item: jest.fn() } }]);
  });

  describe('Plant Operations', () => {
    it('should create a new plant successfully', async () => {
      const mockPlant: Omit<Plant, 'id'> = {
        name: 'Test Plant',
        species_name: 'Test Species',
        location: 'Living Room',
        created_date: '2023-01-01T00:00:00.000Z',
      };

      mockExecuteSql.mockResolvedValue([{ insertId: 123 }]);

      const plantId = await DatabaseService.createPlant(mockPlant);

      expect(plantId).toBe(123);
      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO plants'),
        expect.arrayContaining([mockPlant.name, null, mockPlant.species_name])
      );
    });

    it('should retrieve all plants', async () => {
      const mockPlants = [
        {
          id: 1,
          name: 'Plant 1',
          location: 'Room 1',
          created_date: '2023-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          name: 'Plant 2',
          location: 'Room 2',
          created_date: '2023-01-02T00:00:00.000Z',
        },
      ];

      mockExecuteSql.mockResolvedValue([{
        rows: {
          length: mockPlants.length,
          item: (index: number) => mockPlants[index],
        },
      }]);

      const plants = await DatabaseService.getAllPlants();

      expect(plants).toHaveLength(2);
      expect(plants[0].name).toBe('Plant 1');
      expect(mockExecuteSql).toHaveBeenCalledWith('SELECT * FROM plants ORDER BY created_date DESC');
    });

    it('should update a plant', async () => {
      const updates: Partial<Plant> = {
        name: 'Updated Plant Name',
        location: 'New Location',
      };

      await DatabaseService.updatePlant(1, updates);

      expect(mockExecuteSql).toHaveBeenCalledWith(
        'UPDATE plants SET name = ?, location = ? WHERE id = ?',
        ['Updated Plant Name', 'New Location', 1]
      );
    });

    it('should delete a plant', async () => {
      await DatabaseService.deletePlant(1);

      expect(mockExecuteSql).toHaveBeenCalledWith('DELETE FROM plants WHERE id = ?', [1]);
    });
  });

  describe('Watering Record Operations', () => {
    it('should add a watering record', async () => {
      const mockRecord: Omit<WateringRecord, 'id'> = {
        plant_id: 1,
        watered_date: '2023-01-01T00:00:00.000Z',
        notes: 'Test watering',
      };

      // Mock the insert and update calls
      mockExecuteSql
        .mockResolvedValueOnce([{ insertId: 456 }]) // watering record insert
        .mockResolvedValueOnce([{}]); // plant update

      const recordId = await DatabaseService.addWateringRecord(mockRecord);

      expect(recordId).toBe(456);
      expect(mockExecuteSql).toHaveBeenCalledTimes(2); // insert record + update plant
    });

    it('should retrieve watering records for a plant', async () => {
      const mockRecords = [
        {
          id: 1,
          plant_id: 1,
          watered_date: '2023-01-01T00:00:00.000Z',
          notes: 'First watering',
        },
      ];

      mockExecuteSql.mockResolvedValue([{
        rows: {
          length: mockRecords.length,
          item: (index: number) => mockRecords[index],
        },
      }]);

      const records = await DatabaseService.getWateringRecords(1);

      expect(records).toHaveLength(1);
      expect(records[0].notes).toBe('First watering');
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

      mockExecuteSql.mockResolvedValue([{ insertId: 789 }]);

      const speciesId = await DatabaseService.createPlantSpecies(mockSpecies);

      expect(speciesId).toBe(789);
      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO plant_species'),
        expect.arrayContaining([mockSpecies.common_name, mockSpecies.scientific_name])
      );
    });

    it('should search plant species', async () => {
      const mockSpecies = [
        {
          species_id: 1,
          common_name: 'Test Plant',
          scientific_name: 'Testus plantus',
          cached_date: '2023-01-01T00:00:00.000Z',
        },
      ];

      mockExecuteSql.mockResolvedValue([{
        rows: {
          length: mockSpecies.length,
          item: (index: number) => mockSpecies[index],
        },
      }]);

      const species = await DatabaseService.searchPlantSpecies('test');

      expect(species).toHaveLength(1);
      expect(species[0].common_name).toBe('Test Plant');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockExecuteSql.mockRejectedValue(new Error('Database error'));

      await expect(DatabaseService.getAllPlants()).rejects.toThrow('Database error');
    });

    it('should throw error when database not initialized', async () => {
      (DatabaseService as any).db = null;

      await expect(DatabaseService.getAllPlants()).rejects.toThrow('Database not initialized');
    });
  });
});
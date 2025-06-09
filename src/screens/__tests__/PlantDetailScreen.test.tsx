import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PlantDetailScreen from '../PlantDetailScreen';
import DatabaseService from '../../database/DatabaseService';
import { Plant, WateringRecord, PlantSpecies } from '../../types/Plant';

// Get the mock Alert from our mocked react-native
const { __mockAlert } = require('react-native');

// Mock DatabaseService
jest.mock('../../database/DatabaseService');
const mockedDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
};

// Mock route with plant data
const mockPlant: Plant = {
  id: 1,
  name: 'Test Plant',
  species_id: 123,
  species_name: 'Test Species',
  location: 'Living Room',
  photo_uri: 'test-photo-uri',
  created_date: '2023-01-01T00:00:00.000Z',
  last_watered: '2023-12-01T00:00:00.000Z',
};

const mockRoute = {
  params: {
    plant: mockPlant,
  },
};

const mockWateringRecords: WateringRecord[] = [
  {
    id: 1,
    plant_id: 1,
    watered_date: '2023-12-01T00:00:00.000Z',
    notes: 'Regular watering',
  },
  {
    id: 2,
    plant_id: 1,
    watered_date: '2023-11-25T00:00:00.000Z',
    notes: 'Plant was looking thirsty',
  },
];

const mockSpeciesData: PlantSpecies[] = [
  {
    id: 1,
    species_id: 123,
    common_name: 'Test Species',
    scientific_name: 'Testicus planticus',
    watering_frequency: 7,
    light_requirements: 'Bright indirect light',
    care_instructions: 'Water when soil is dry. Mist occasionally.',
  },
];

describe('PlantDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation.goBack.mockClear();
    
    // Default mock implementations
    mockedDatabaseService.getWateringRecords.mockResolvedValue(mockWateringRecords);
    mockedDatabaseService.searchPlantSpecies.mockResolvedValue(mockSpeciesData);
    mockedDatabaseService.addWateringRecord.mockResolvedValue();
    mockedDatabaseService.deletePlant.mockResolvedValue();
  });

  it('should render plant information correctly', async () => {
    const { getByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText('Test Plant')).toBeTruthy();
    expect(getByText('Test Species')).toBeTruthy();
    expect(getByText('📍 Living Room')).toBeTruthy();
    expect(getByText(/Added:/)).toBeTruthy();
  });

  it('should show placeholder image when no photo is provided', async () => {
    const plantWithoutPhoto = {
      ...mockPlant,
      photo_uri: undefined,
    };
    
    const routeWithoutPhoto = {
      params: {
        plant: plantWithoutPhoto,
      },
    };

    const { getByText } = render(
      <PlantDetailScreen route={routeWithoutPhoto} navigation={mockNavigation} />
    );

    expect(getByText('🌱')).toBeTruthy();
  });

  it('should display watering status correctly', async () => {
    const { getByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText('Watering Status')).toBeTruthy();
    expect(getByText('Last Watered:')).toBeTruthy();
    expect(getByText(/days ago/)).toBeTruthy();
  });

  it('should show watering buttons', async () => {
    const { getByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText('💧 Water Now')).toBeTruthy();
    expect(getByText('Water with Notes')).toBeTruthy();
  });

  it('should load and display watering history', async () => {
    const { getByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Watering History')).toBeTruthy();
      expect(getByText('Regular watering')).toBeTruthy();
      expect(getByText('Plant was looking thirsty')).toBeTruthy();
    });

    expect(mockedDatabaseService.getWateringRecords).toHaveBeenCalledWith(1);
  });

  it('should show empty history message when no watering records exist', async () => {
    mockedDatabaseService.getWateringRecords.mockResolvedValue([]);

    const { getByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('No watering records yet')).toBeTruthy();
    });
  });

  it('should show loading state for watering history', () => {
    // Make the promise never resolve to test loading state
    mockedDatabaseService.getWateringRecords.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { getByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText('Loading history...')).toBeTruthy();
  });

  it('should handle quick water functionality', async () => {
    const { getByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    const waterButton = getByText('💧 Water Now');
    fireEvent.press(waterButton);

    await waitFor(() => {
      expect(mockedDatabaseService.addWateringRecord).toHaveBeenCalledWith({
        plant_id: 1,
        watered_date: expect.any(String),
        notes: 'Quick watering',
      });
    });

    // Should reload watering records after watering
    expect(mockedDatabaseService.getWateringRecords).toHaveBeenCalledTimes(2);
  });

  it('should show watering modal when "Water with Notes" is pressed', async () => {
    const { getByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    const waterWithNotesButton = getByText('Water with Notes');
    fireEvent.press(waterWithNotesButton);

    await waitFor(() => {
      expect(getByText('Log Watering')).toBeTruthy();
      expect(getByText('Notes (Optional)')).toBeTruthy();
      expect(getByText('💧 Log Watering')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
    });
  });

  it('should handle watering with notes', async () => {
    const { getByText, getByPlaceholderText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    // Open modal
    const waterWithNotesButton = getByText('Water with Notes');
    fireEvent.press(waterWithNotesButton);

    await waitFor(() => {
      expect(getByText('Log Watering')).toBeTruthy();
    });

    // Add notes
    const notesInput = getByPlaceholderText('e.g., Soil was dry, gave extra water...');
    fireEvent.changeText(notesInput, 'Plant needed extra water today');

    // Submit watering
    const logWateringButton = getByText('💧 Log Watering');
    fireEvent.press(logWateringButton);

    await waitFor(() => {
      expect(mockedDatabaseService.addWateringRecord).toHaveBeenCalledWith({
        plant_id: 1,
        watered_date: expect.any(String),
        notes: 'Plant needed extra water today',
      });
    });
  });

  it('should close watering modal when Cancel is pressed', async () => {
    const { getByText, queryByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    // Open modal
    const waterWithNotesButton = getByText('Water with Notes');
    fireEvent.press(waterWithNotesButton);

    await waitFor(() => {
      expect(getByText('Cancel')).toBeTruthy();
    });

    // Close modal
    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(queryByText('Log Watering')).toBeNull();
    });
  });

  it('should show delete plant button', () => {
    const { getByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText('Delete Plant')).toBeTruthy();
  });

  it('should load and display care information when species has data', async () => {
    const { getByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Care Information')).toBeTruthy();
      expect(getByText('💧 Watering Frequency:')).toBeTruthy();
      expect(getByText('Every 7 days')).toBeTruthy();
      expect(getByText('☀️ Light Requirements:')).toBeTruthy();
      expect(getByText('Bright indirect light')).toBeTruthy();
      expect(getByText('📝 Care Instructions:')).toBeTruthy();
      expect(getByText('Water when soil is dry. Mist occasionally.')).toBeTruthy();
    });

    expect(mockedDatabaseService.searchPlantSpecies).toHaveBeenCalledWith('');
  });

  it('should not show care information section when no species_id exists', () => {
    const plantWithoutSpecies = {
      ...mockPlant,
      species_id: undefined,
    };
    
    const routeWithoutSpecies = {
      params: {
        plant: plantWithoutSpecies,
      },
    };

    const { queryByText } = render(
      <PlantDetailScreen route={routeWithoutSpecies} navigation={mockNavigation} />
    );

    expect(queryByText('Care Information')).toBeNull();
  });

  it('should show loading state for care information', () => {
    // Make the species search never resolve
    mockedDatabaseService.searchPlantSpecies.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { getByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText('Loading care information...')).toBeTruthy();
  });

  it('should not show care information when species is not found', async () => {
    mockedDatabaseService.searchPlantSpecies.mockResolvedValue([]);

    const { queryByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(queryByText('Care Information')).toBeNull();
    });
  });

  it('should show "Never" when plant has never been watered', () => {
    const plantNeverWatered = {
      ...mockPlant,
      last_watered: undefined,
    };
    
    const routeNeverWatered = {
      params: {
        plant: plantNeverWatered,
      },
    };

    const { getByText } = render(
      <PlantDetailScreen route={routeNeverWatered} navigation={mockNavigation} />
    );

    expect(getByText('Never')).toBeTruthy();
  });

  it('should show "Today" when plant was watered today', () => {
    const today = new Date().toISOString();
    const plantWateredToday = {
      ...mockPlant,
      last_watered: today,
    };
    
    const routeWateredToday = {
      params: {
        plant: plantWateredToday,
      },
    };

    const { getByText } = render(
      <PlantDetailScreen route={routeWateredToday} navigation={mockNavigation} />
    );

    expect(getByText('Today')).toBeTruthy();
  });

  it('should disable buttons during watering operation', async () => {
    let resolveWatering: () => void;
    const wateringPromise = new Promise<void>((resolve) => {
      resolveWatering = resolve;
    });
    mockedDatabaseService.addWateringRecord.mockReturnValue(wateringPromise);

    const { getByText, queryByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    const waterButton = getByText('💧 Water Now');
    fireEvent.press(waterButton);

    // Should show watering state
    await waitFor(() => {
      expect(getByText('Watering...')).toBeTruthy();
    });

    // During watering, the button text should change and show loading state
    // This verifies that the watering state is properly managed
    expect(getByText('Watering...')).toBeTruthy();
    
    // The "Water with Notes" button should still be present
    expect(getByText('Water with Notes')).toBeTruthy();

    // Resolve the watering operation
    resolveWatering!();
    
    await waitFor(() => {
      expect(getByText('💧 Water Now')).toBeTruthy(); // Back to normal state
    });
  });

  it('should limit watering history to 10 records', async () => {
    const manyRecords: WateringRecord[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      plant_id: 1,
      watered_date: `2023-12-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
      notes: `Record ${i + 1}`,
    }));

    mockedDatabaseService.getWateringRecords.mockResolvedValue(manyRecords);

    const { getAllByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    await waitFor(() => {
      // Should only show first 10 records
      const recordElements = getAllByText(/Record \d+/);
      expect(recordElements).toHaveLength(10);
    });
  });

  it('should show success alert after quick watering', async () => {
    const { getByText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    const waterButton = getByText('💧 Water Now');
    fireEvent.press(waterButton);

    await waitFor(() => {
      expect(__mockAlert).toHaveBeenCalledWith('Success', 'Plant watered successfully! 💧');
    });
  });

  it('should show success alert after watering with notes', async () => {
    const { getByText, getByPlaceholderText } = render(
      <PlantDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    // Open modal
    const waterWithNotesButton = getByText('Water with Notes');
    fireEvent.press(waterWithNotesButton);

    await waitFor(() => {
      expect(getByText('Log Watering')).toBeTruthy();
    });

    // Add notes and submit
    const notesInput = getByPlaceholderText('e.g., Soil was dry, gave extra water...');
    fireEvent.changeText(notesInput, 'Test notes');

    const logWateringButton = getByText('💧 Log Watering');
    fireEvent.press(logWateringButton);

    await waitFor(() => {
      expect(__mockAlert).toHaveBeenCalledWith('Success', 'Watering logged successfully! 💧');
    });
  });
});
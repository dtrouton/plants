import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PlantsListScreen from '../PlantsListScreen';
import DatabaseService from '../../database/DatabaseService';

// Mock the navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock DatabaseService
jest.mock('../../database/DatabaseService');
const mockedDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => {
    require('react').useEffect(callback, []);
  }),
}));

// Access the global mock
declare global {
  var mockAlert: jest.Mock;
}

describe('PlantsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when no plants exist', async () => {
    mockedDatabaseService.getAllPlants.mockResolvedValue([]);

    const { getByText } = render(
      <PlantsListScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('No plants yet! 🌱')).toBeTruthy();
      expect(getByText('Tap the "Add Plant" tab to add your first plant')).toBeTruthy();
    });
  });

  it('should render plants when they exist', async () => {
    const mockPlants = [
      {
        id: 1,
        name: 'Test Plant',
        species_name: 'Test Species',
        location: 'Living Room',
        created_date: '2023-01-01T00:00:00.000Z',
        last_watered: '2023-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        name: 'Another Plant',
        species_name: 'Another Species',
        location: 'Bedroom',
        created_date: '2023-01-02T00:00:00.000Z',
        last_watered: undefined,
      },
    ];

    mockedDatabaseService.getAllPlants.mockResolvedValue(mockPlants);

    const { getByText } = render(
      <PlantsListScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Test Plant')).toBeTruthy();
      expect(getByText('Test Species')).toBeTruthy();
      expect(getByText('Living Room')).toBeTruthy();
      expect(getByText('Another Plant')).toBeTruthy();
      expect(getByText('Bedroom')).toBeTruthy();
    });
  });

  it('should show loading state initially', () => {
    mockedDatabaseService.getAllPlants.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { getByText } = render(
      <PlantsListScreen navigation={mockNavigation} />
    );

    expect(getByText('Loading plants...')).toBeTruthy();
  });

  it('should navigate to plant detail when plant is pressed', async () => {
    const mockPlant = {
      id: 1,
      name: 'Test Plant',
      species_name: 'Test Species',
      location: 'Living Room',
      created_date: '2023-01-01T00:00:00.000Z',
      last_watered: '2023-01-01T00:00:00.000Z',
    };

    mockedDatabaseService.getAllPlants.mockResolvedValue([mockPlant]);

    const { getByText } = render(
      <PlantsListScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Test Plant')).toBeTruthy();
    });

    fireEvent.press(getByText('Test Plant'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('PlantDetail', {
      plant: mockPlant,
    });
  });

  it('should show delete confirmation on long press', async () => {
    const mockPlant = {
      id: 1,
      name: 'Test Plant',
      species_name: 'Test Species',
      location: 'Living Room',
      created_date: '2023-01-01T00:00:00.000Z',
      last_watered: '2023-01-01T00:00:00.000Z',
    };

    mockedDatabaseService.getAllPlants.mockResolvedValue([mockPlant]);

    const { getByText } = render(
      <PlantsListScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Test Plant')).toBeTruthy();
    });

    fireEvent(getByText('Test Plant'), 'longPress');

    expect(global.mockAlert).toHaveBeenCalledWith(
      'Delete Plant',
      'Are you sure you want to delete this plant?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete' }),
      ])
    );
  });

  it('should display "Needs Water" badge for plants that need watering', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

    const mockPlant = {
      id: 1,
      name: 'Thirsty Plant',
      species_name: 'Thirsty Species',
      location: 'Living Room',
      created_date: '2023-01-01T00:00:00.000Z',
      last_watered: oldDate.toISOString(),
    };

    mockedDatabaseService.getAllPlants.mockResolvedValue([mockPlant]);

    const { getByText } = render(
      <PlantsListScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Thirsty Plant')).toBeTruthy();
      expect(getByText('Needs Water')).toBeTruthy();
    });
  });

  it('should not show "Needs Water" badge for recently watered plants', async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 2); // 2 days ago

    const mockPlant = {
      id: 1,
      name: 'Well Watered Plant',
      species_name: 'Happy Species',
      location: 'Living Room',
      created_date: '2023-01-01T00:00:00.000Z',
      last_watered: recentDate.toISOString(),
    };

    mockedDatabaseService.getAllPlants.mockResolvedValue([mockPlant]);

    const { getByText, queryByText } = render(
      <PlantsListScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Well Watered Plant')).toBeTruthy();
      expect(queryByText('Needs Water')).toBeNull();
    });
  });

  it('should show placeholder image when plant has no photo', async () => {
    const mockPlant = {
      id: 1,
      name: 'Plant Without Photo',
      location: 'Living Room',
      created_date: '2023-01-01T00:00:00.000Z',
    };

    mockedDatabaseService.getAllPlants.mockResolvedValue([mockPlant]);

    const { getByText } = render(
      <PlantsListScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('🌱')).toBeTruthy(); // Placeholder emoji
    });
  });

  it('should handle database errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockedDatabaseService.getAllPlants.mockRejectedValue(new Error('Database error'));

    const { getByText } = render(
      <PlantsListScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(global.mockAlert).toHaveBeenCalledWith('Error', 'Failed to load plants');
    });

    expect(consoleError).toHaveBeenCalledWith('Error loading plants:', expect.any(Error));
    consoleError.mockRestore();
  });

  it('should handle delete plant successfully', async () => {
    const mockPlant = {
      id: 1,
      name: 'Plant to Delete',
      location: 'Living Room',
      created_date: '2023-01-01T00:00:00.000Z',
    };

    mockedDatabaseService.getAllPlants
      .mockResolvedValueOnce([mockPlant]) // Initial load
      .mockResolvedValueOnce([]); // After deletion

    mockedDatabaseService.deletePlant.mockResolvedValue();

    const { getByText, unmount } = render(
      <PlantsListScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Plant to Delete')).toBeTruthy();
    });

    fireEvent(getByText('Plant to Delete'), 'longPress');

    // Get the delete function from the Alert.alert call
    const alertCall = global.mockAlert.mock.calls[0];
    const deleteOption = alertCall[2].find((option: any) => option.text === 'Delete');
    
    // Execute the delete
    if (deleteOption?.onPress) {
      await deleteOption.onPress();
    }

    expect(mockedDatabaseService.deletePlant).toHaveBeenCalledWith(1);
    
    // Cleanup
    unmount();
  });

  it('should handle delete plant error', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const mockPlant = {
      id: 1,
      name: 'Plant Delete Error',
      location: 'Living Room',
      created_date: '2023-01-01T00:00:00.000Z',
    };

    mockedDatabaseService.getAllPlants.mockResolvedValue([mockPlant]);
    mockedDatabaseService.deletePlant.mockRejectedValue(new Error('Delete error'));

    const { getByText, unmount } = render(
      <PlantsListScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Plant Delete Error')).toBeTruthy();
    });

    fireEvent(getByText('Plant Delete Error'), 'longPress');

    const alertCall = global.mockAlert.mock.calls[0];
    const deleteOption = alertCall[2].find((option: any) => option.text === 'Delete');
    
    if (deleteOption?.onPress) {
      await deleteOption.onPress();
    }

    await waitFor(() => {
      expect(global.mockAlert).toHaveBeenCalledWith('Error', 'Failed to delete plant');
    });
    
    expect(consoleError).toHaveBeenCalledWith('Error deleting plant:', expect.any(Error));
    consoleError.mockRestore();
    
    // Cleanup
    unmount();
  });
});
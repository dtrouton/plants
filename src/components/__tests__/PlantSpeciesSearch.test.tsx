import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PlantSpeciesSearch from '../PlantSpeciesSearch';
import PlantAPIService from '../../services/PlantAPIService';
import DatabaseService from '../../database/DatabaseService';

// Mock the services
jest.mock('../../services/PlantAPIService');
jest.mock('../../database/DatabaseService');
jest.mock('../../utils/plantUtils');

const mockedPlantAPIService = PlantAPIService as jest.Mocked<typeof PlantAPIService>;
const mockedDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;
const { convertWateringToDays, formatSunlight } = require('../../utils/plantUtils');

describe('PlantSpeciesSearch', () => {
  const mockOnSelectSpecies = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render search input', () => {
    const { getByPlaceholderText } = render(
      <PlantSpeciesSearch onSelectSpecies={mockOnSelectSpecies} />
    );

    expect(getByPlaceholderText('Search for plant species...')).toBeTruthy();
  });

  it('should show loading state when searching', async () => {
    mockedDatabaseService.searchPlantSpecies.mockResolvedValue([]);
    mockedPlantAPIService.searchPlants.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { getByPlaceholderText, getByText } = render(
      <PlantSpeciesSearch onSelectSpecies={mockOnSelectSpecies} />
    );

    const searchInput = getByPlaceholderText('Search for plant species...');
    fireEvent.changeText(searchInput, 'test');

    // Fast-forward timers to trigger debounced search
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(getByText('Searching...')).toBeTruthy();
    });
  });

  it('should display search results from cache first', async () => {
    const mockCachedSpecies = [
      {
        species_id: 1,
        common_name: 'Cached Plant',
        scientific_name: 'Cachedus plantus',
        cached_date: '2023-01-01T00:00:00.000Z',
      },
    ];

    mockedDatabaseService.searchPlantSpecies.mockResolvedValue(mockCachedSpecies);

    const { getByPlaceholderText, getByText } = render(
      <PlantSpeciesSearch onSelectSpecies={mockOnSelectSpecies} />
    );

    const searchInput = getByPlaceholderText('Search for plant species...');
    fireEvent.changeText(searchInput, 'cached');

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(getByText('Cached Plant')).toBeTruthy();
    });

    expect(mockedDatabaseService.searchPlantSpecies).toHaveBeenCalledWith('cached');
  });

  it('should search API when no cached results found', async () => {
    const mockAPIResponse = {
      data: [
        {
          id: 1,
          common_name: 'API Plant',
          scientific_name: ['APIus plantus'],
          watering: 'Weekly',
          sunlight: ['Bright light'],
        },
      ],
      total: 1,
      per_page: 30,
      current_page: 1,
      from: 1,
      last_page: 1,
      to: 1,
    };

    mockedDatabaseService.searchPlantSpecies.mockResolvedValue([]);
    mockedPlantAPIService.searchPlants.mockResolvedValue(mockAPIResponse);

    const { getByPlaceholderText, getByText } = render(
      <PlantSpeciesSearch onSelectSpecies={mockOnSelectSpecies} />
    );

    const searchInput = getByPlaceholderText('Search for plant species...');
    fireEvent.changeText(searchInput, 'api');

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(getByText('API Plant')).toBeTruthy();
    });

    expect(mockedPlantAPIService.searchPlants).toHaveBeenCalledWith('api');
  });

  it('should handle species selection', async () => {
    const mockSpecies = {
      id: 1,
      common_name: 'Selected Plant',
      scientific_name: ['Selectedus plantus'],
      watering: 'Weekly',
      sunlight: ['Bright light'],
    };

    mockedDatabaseService.searchPlantSpecies.mockResolvedValue([]);
    mockedPlantAPIService.searchPlants.mockResolvedValue({
      data: [mockSpecies],
      total: 1,
      per_page: 30,
      current_page: 1,
      from: 1,
      last_page: 1,
      to: 1,
    });

    mockedPlantAPIService.getPlantDetails.mockResolvedValue({
      id: 1,
      common_name: 'Selected Plant',
      scientific_name: ['Selectedus plantus'],
      watering: 'Weekly',
      sunlight: ['Bright light'],
    } as any);

    mockedPlantAPIService.createCareInstructions.mockReturnValue('Care instructions');
    convertWateringToDays.mockReturnValue(7);
    formatSunlight.mockReturnValue('Bright light');

    mockedDatabaseService.createPlantSpecies.mockResolvedValue(1);

    const { getByPlaceholderText, getByText } = render(
      <PlantSpeciesSearch onSelectSpecies={mockOnSelectSpecies} />
    );

    const searchInput = getByPlaceholderText('Search for plant species...');
    fireEvent.changeText(searchInput, 'selected');

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(getByText('Selected Plant')).toBeTruthy();
    });

    // Select the species
    fireEvent.press(getByText('Selected Plant'));

    await waitFor(() => {
      expect(mockOnSelectSpecies).toHaveBeenCalledWith({
        id: 1,
        common_name: 'Selected Plant',
        scientific_name: 'Selectedus plantus',
        watering_frequency: 7,
        light_requirements: 'Bright light',
        care_instructions: 'Care instructions',
      });
    });
  });

  it('should not search for queries shorter than 2 characters', () => {
    const { getByPlaceholderText } = render(
      <PlantSpeciesSearch onSelectSpecies={mockOnSelectSpecies} />
    );

    const searchInput = getByPlaceholderText('Search for plant species...');
    fireEvent.changeText(searchInput, 'a');

    jest.advanceTimersByTime(500);

    expect(mockedDatabaseService.searchPlantSpecies).not.toHaveBeenCalled();
    expect(mockedPlantAPIService.searchPlants).not.toHaveBeenCalled();
  });

  it('should show selected species and allow clearing', async () => {
    const { getByPlaceholderText, getByText, queryByPlaceholderText } = render(
      <PlantSpeciesSearch onSelectSpecies={mockOnSelectSpecies} initialValue="test" />
    );

    // Simulate species selection
    mockedDatabaseService.searchPlantSpecies.mockResolvedValue([]);
    mockedPlantAPIService.searchPlants.mockResolvedValue({
      data: [{
        id: 1,
        common_name: 'Test Plant',
        scientific_name: ['Testus plantus'],
      }],
      total: 1,
      per_page: 30,
      current_page: 1,
      from: 1,
      last_page: 1,
      to: 1,
    });

    mockedPlantAPIService.getPlantDetails.mockResolvedValue({} as any);
    mockedPlantAPIService.createCareInstructions.mockReturnValue('Instructions');
    convertWateringToDays.mockReturnValue(7);
    formatSunlight.mockReturnValue('Unknown');
    mockedDatabaseService.createPlantSpecies.mockResolvedValue(1);

    const searchInput = getByPlaceholderText('Search for plant species...');
    fireEvent.changeText(searchInput, 'test');
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(getByText('Test Plant')).toBeTruthy();
    });

    fireEvent.press(getByText('Test Plant'));

    await waitFor(() => {
      expect(getByText('Selected Species:')).toBeTruthy();
      expect(getByText('Test Plant')).toBeTruthy();
    });

    // Clear selection
    const changeButton = getByText('Change');
    fireEvent.press(changeButton);

    await waitFor(() => {
      expect(queryByPlaceholderText('Search for plant species...')).toBeTruthy();
    });
  });

  it('should handle search errors gracefully', async () => {
    mockedDatabaseService.searchPlantSpecies.mockResolvedValue([]);
    mockedPlantAPIService.searchPlants.mockRejectedValue(new Error('API Error'));

    const { getByPlaceholderText } = render(
      <PlantSpeciesSearch onSelectSpecies={mockOnSelectSpecies} />
    );

    const searchInput = getByPlaceholderText('Search for plant species...');
    fireEvent.changeText(searchInput, 'error');

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(mockedPlantAPIService.searchPlants).toHaveBeenCalled();
    });

    // Should not crash and should reset loading state
    await waitFor(() => {
      expect(getByPlaceholderText('Search for plant species...')).toBeTruthy();
    });
  });
});
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PlantSpeciesSearch from '../PlantSpeciesSearch';
import PlantAPIService from '../../services/PlantAPIService';
import DatabaseService from '../../database/DatabaseService';

// Mock the services
jest.mock('../../services/PlantAPIService');
jest.mock('../../database/DatabaseService');
jest.mock('../../utils/plantUtils');

const mockedPlantAPIService = PlantAPIService as jest.Mocked<typeof PlantAPIService>;
const mockedDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;

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

    const { convertWateringToDays, formatSunlight } = require('../../utils/plantUtils');
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

    const { convertWateringToDays, formatSunlight } = require('../../utils/plantUtils');
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

  it('should handle getPlantDetails failure during species selection', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    const mockSpecies = {
      id: 1,
      common_name: 'Test Plant',
      scientific_name: ['Testus plantus'],
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

    // Make getPlantDetails fail
    mockedPlantAPIService.getPlantDetails.mockRejectedValue(new Error('Details API Error'));
    mockedPlantAPIService.createCareInstructions.mockReturnValue('Care instructions');

    const { convertWateringToDays, formatSunlight } = require('../../utils/plantUtils');
    convertWateringToDays.mockReturnValue(7);
    formatSunlight.mockReturnValue('Bright light');

    mockedDatabaseService.createPlantSpecies.mockResolvedValue(1);

    const { getByPlaceholderText, getByText } = render(
      <PlantSpeciesSearch onSelectSpecies={mockOnSelectSpecies} />
    );

    const searchInput = getByPlaceholderText('Search for plant species...');
    fireEvent.changeText(searchInput, 'test');

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(getByText('Test Plant')).toBeTruthy();
    });

    // Select the species
    fireEvent.press(getByText('Test Plant'));

    await waitFor(() => {
      expect(consoleWarn).toHaveBeenCalledWith('Failed to get detailed info, using basic info:', expect.any(Error));
      expect(mockOnSelectSpecies).toHaveBeenCalled();
    });

    consoleWarn.mockRestore();
  });

  it('should handle caching failure during species selection', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    const mockSpecies = {
      id: 1,
      common_name: 'Test Plant',
      scientific_name: ['Testus plantus'],
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

    mockedPlantAPIService.getPlantDetails.mockResolvedValue({} as any);
    mockedPlantAPIService.createCareInstructions.mockReturnValue('Care instructions');

    const { convertWateringToDays, formatSunlight } = require('../../utils/plantUtils');
    convertWateringToDays.mockReturnValue(7);
    formatSunlight.mockReturnValue('Bright light');

    // Make caching fail
    mockedDatabaseService.createPlantSpecies.mockRejectedValue(new Error('Cache error'));

    const { getByPlaceholderText, getByText } = render(
      <PlantSpeciesSearch onSelectSpecies={mockOnSelectSpecies} />
    );

    const searchInput = getByPlaceholderText('Search for plant species...');
    fireEvent.changeText(searchInput, 'test');

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(getByText('Test Plant')).toBeTruthy();
    });

    // Select the species
    fireEvent.press(getByText('Test Plant'));

    await waitFor(() => {
      expect(consoleWarn).toHaveBeenCalledWith('Failed to cache species:', expect.any(Error));
      expect(mockOnSelectSpecies).toHaveBeenCalled();
    });

    consoleWarn.mockRestore();
  });

  it('should handle species selection errors', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const mockSpecies = {
      id: 1,
      common_name: 'Test Plant',
      scientific_name: ['Testus plantus'],
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

    mockedPlantAPIService.getPlantDetails.mockResolvedValue({} as any);

    // Make convertWateringToDays throw an error to trigger the outer catch block
    const { convertWateringToDays } = require('../../utils/plantUtils');
    convertWateringToDays.mockImplementation(() => {
      throw new Error('Conversion error');
    });

    const { getByPlaceholderText, getByText } = render(
      <PlantSpeciesSearch onSelectSpecies={mockOnSelectSpecies} />
    );

    const searchInput = getByPlaceholderText('Search for plant species...');
    fireEvent.changeText(searchInput, 'test');

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(getByText('Test Plant')).toBeTruthy();
    });

    // Select the species
    fireEvent.press(getByText('Test Plant'));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error selecting species:', expect.any(Error));
    });

    consoleError.mockRestore();
  });
});

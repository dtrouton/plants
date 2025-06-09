import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PlantsListScreen from '../screens/PlantsListScreen';
import DatabaseService from '../database/DatabaseService';

// Mock the navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock DatabaseService
jest.mock('../database/DatabaseService');
const mockedDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;

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
    ];

    mockedDatabaseService.getAllPlants.mockResolvedValue(mockPlants);

    const { getByText } = render(
      <PlantsListScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Test Plant')).toBeTruthy();
      expect(getByText('Test Species')).toBeTruthy();
      expect(getByText('Living Room')).toBeTruthy();
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
});

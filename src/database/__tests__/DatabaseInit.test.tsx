import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import DatabaseInit from '../DatabaseInit';
import DatabaseService from '../DatabaseService';

// Mock DatabaseService
jest.mock('../DatabaseService');
const mockedDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;

describe('DatabaseInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockedDatabaseService.init.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { getByText } = render(
      <DatabaseInit>
        <Text>Test Child</Text>
      </DatabaseInit>
    );

    expect(getByText('Initializing database...')).toBeTruthy();
  });

  it('should render children after successful initialization', async () => {
    mockedDatabaseService.init.mockResolvedValue();

    const { getByText } = render(
      <DatabaseInit>
        <Text>Test Child</Text>
      </DatabaseInit>
    );

    await waitFor(() => {
      expect(getByText('Test Child')).toBeTruthy();
    });

    expect(mockedDatabaseService.init).toHaveBeenCalled();
  });

  it('should render error state when initialization fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockedDatabaseService.init.mockRejectedValue(new Error('Init failed'));

    const { getByText } = render(
      <DatabaseInit>
        <Text>Test Child</Text>
      </DatabaseInit>
    );

    await waitFor(() => {
      expect(getByText('Database Error: Failed to initialize database')).toBeTruthy();
    });

    expect(consoleError).toHaveBeenCalledWith('Failed to initialize database:', expect.any(Error));
    expect(mockedDatabaseService.init).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddPlantScreen from '../AddPlantScreen';
import DatabaseService from '../../database/DatabaseService';

// Get the mock Alert from our mocked react-native
const { __mockAlert } = require('react-native');

// Mock the navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock DatabaseService
jest.mock('../../database/DatabaseService');
const mockedDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;

// Mock PlantSpeciesSearch component
jest.mock('../../components/PlantSpeciesSearch', () => {
  return function MockPlantSpeciesSearch({ onSelectSpecies }: any) {
    return null; // We'll test this component separately
  };
});

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

describe('AddPlantScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation.navigate.mockClear();
  });

  it('should render correctly with initial state', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    expect(getByText('Add New Plant')).toBeTruthy();
    expect(getByText('Photo')).toBeTruthy();
    expect(getByText('📷')).toBeTruthy();
    expect(getByText('Tap to add photo')).toBeTruthy();
    expect(getByPlaceholderText('e.g., My Monstera')).toBeTruthy();
    expect(getByPlaceholderText('e.g., Living room window')).toBeTruthy();
    expect(getByText('Save Plant')).toBeTruthy();
    expect(getByText('Clear Form')).toBeTruthy();
  });

  it('should update plant name when text input changes', () => {
    const { getByPlaceholderText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    const nameInput = getByPlaceholderText('e.g., My Monstera');
    fireEvent.changeText(nameInput, 'Test Plant Name');

    expect(nameInput.props.value).toBe('Test Plant Name');
  });

  it('should update location when text input changes', () => {
    const { getByPlaceholderText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    const locationInput = getByPlaceholderText('e.g., Living room window');
    fireEvent.changeText(locationInput, 'Kitchen counter');

    expect(locationInput.props.value).toBe('Kitchen counter');
  });

  it('should clear form when Clear Form button is pressed', () => {
    const { getByPlaceholderText, getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    // Fill form fields
    const nameInput = getByPlaceholderText('e.g., My Monstera');
    const locationInput = getByPlaceholderText('e.g., Living room window');
    
    fireEvent.changeText(nameInput, 'Test Plant');
    fireEvent.changeText(locationInput, 'Kitchen');

    // Clear form
    const clearButton = getByText('Clear Form');
    fireEvent.press(clearButton);

    // Check that fields are cleared
    expect(nameInput.props.value).toBe('');
    expect(locationInput.props.value).toBe('');
  });

  it('should show required field labels', () => {
    const { getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    expect(getByText('Plant Name *')).toBeTruthy();
    expect(getByText('Location *')).toBeTruthy();
  });

  it('should show proper placeholder texts', () => {
    const { getByPlaceholderText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    expect(getByPlaceholderText('e.g., My Monstera')).toBeTruthy();
    expect(getByPlaceholderText('e.g., Living room window')).toBeTruthy();
  });

  it('should display form sections properly', () => {
    const { getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    // Check section titles
    expect(getByText('Photo')).toBeTruthy();
    expect(getByText('Plant Name *')).toBeTruthy();
    expect(getByText('Location *')).toBeTruthy();
  });

  it('should render buttons with correct styles', () => {
    const { getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    const saveButton = getByText('Save Plant');
    const clearButton = getByText('Clear Form');

    expect(saveButton).toBeTruthy();
    expect(clearButton).toBeTruthy();
  });

  it('should handle multiple text changes correctly', () => {
    const { getByPlaceholderText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    const nameInput = getByPlaceholderText('e.g., My Monstera');
    
    fireEvent.changeText(nameInput, 'First Name');
    expect(nameInput.props.value).toBe('First Name');
    
    fireEvent.changeText(nameInput, 'Second Name');
    expect(nameInput.props.value).toBe('Second Name');
    
    fireEvent.changeText(nameInput, '');
    expect(nameInput.props.value).toBe('');
  });

  it('should maintain independent state for name and location inputs', () => {
    const { getByPlaceholderText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    const nameInput = getByPlaceholderText('e.g., My Monstera');
    const locationInput = getByPlaceholderText('e.g., Living room window');
    
    fireEvent.changeText(nameInput, 'Plant Name');
    fireEvent.changeText(locationInput, 'Plant Location');

    expect(nameInput.props.value).toBe('Plant Name');
    expect(locationInput.props.value).toBe('Plant Location');
    
    // Clear only one field
    fireEvent.changeText(nameInput, '');
    expect(nameInput.props.value).toBe('');
    expect(locationInput.props.value).toBe('Plant Location');
  });

  it('should show error alert when trying to save without plant name', async () => {
    const { getByPlaceholderText, getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    // Fill location but not name
    const locationInput = getByPlaceholderText('e.g., Living room window');
    fireEvent.changeText(locationInput, 'Kitchen');

    const saveButton = getByText('Save Plant');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(__mockAlert).toHaveBeenCalledWith('Error', 'Please enter a plant name');
    });

    expect(mockedDatabaseService.createPlant).not.toHaveBeenCalled();
  });

  it('should show error alert when trying to save without location', async () => {
    const { getByPlaceholderText, getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    // Fill name but not location
    const nameInput = getByPlaceholderText('e.g., My Monstera');
    fireEvent.changeText(nameInput, 'Test Plant');

    const saveButton = getByText('Save Plant');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(__mockAlert).toHaveBeenCalledWith('Error', 'Please enter a location');
    });

    expect(mockedDatabaseService.createPlant).not.toHaveBeenCalled();
  });
});
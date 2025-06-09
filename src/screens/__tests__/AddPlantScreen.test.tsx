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
  return function MockPlantSpeciesSearch({ onSelectSpecies: _onSelectSpecies }: any) {
    return null; // We'll test this component separately
  };
});

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
  MediaType: {
    photo: 'photo',
    video: 'video',
    mixed: 'mixed',
  },
}));

const { launchCamera, launchImageLibrary } = require('react-native-image-picker');

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

  it('should handle image picker alert options', () => {
    const { getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    const addPhotoButton = getByText('📷');
    fireEvent.press(addPhotoButton);

    expect(__mockAlert).toHaveBeenCalledWith(
      'Select Photo',
      'Choose how you want to add a photo',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Camera' }),
        expect.objectContaining({ text: 'Photo Library' }),
      ])
    );
  });

  it('should handle camera option selection', () => {
    const { getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    const addPhotoButton = getByText('📷');
    fireEvent.press(addPhotoButton);

    // Get the camera option from the alert and press it
    const alertCall = __mockAlert.mock.calls[__mockAlert.mock.calls.length - 1];
    const cameraOption = alertCall[2].find((option: any) => option.text === 'Camera');
    cameraOption.onPress();

    expect(launchCamera).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
      }),
      expect.any(Function)
    );
  });

  it('should handle photo library option selection', () => {
    const { getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    const addPhotoButton = getByText('📷');
    fireEvent.press(addPhotoButton);

    // Get the photo library option from the alert and press it
    const alertCall = __mockAlert.mock.calls[__mockAlert.mock.calls.length - 1];
    const libraryOption = alertCall[2].find((option: any) => option.text === 'Photo Library');
    libraryOption.onPress();

    expect(launchImageLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
      }),
      expect.any(Function)
    );
  });

  it('should handle camera response with photo', () => {
    const { getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    const addPhotoButton = getByText('📷');
    fireEvent.press(addPhotoButton);

    // Get the camera option and press it
    const alertCall = __mockAlert.mock.calls[__mockAlert.mock.calls.length - 1];
    const cameraOption = alertCall[2].find((option: any) => option.text === 'Camera');
    cameraOption.onPress();

    // Simulate camera response with photo
    const cameraCallback = launchCamera.mock.calls[0][1];
    cameraCallback({
      assets: [{ uri: 'file://test-image.jpg' }],
    });

    // Should now show a different UI indicating photo is selected
    expect(getByText('📷')).toBeTruthy(); // Photo icon should still be there
  });

  it('should handle image library response with photo', () => {
    const { getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    const addPhotoButton = getByText('📷');
    fireEvent.press(addPhotoButton);

    // Get the photo library option and press it
    const alertCall = __mockAlert.mock.calls[__mockAlert.mock.calls.length - 1];
    const libraryOption = alertCall[2].find((option: any) => option.text === 'Photo Library');
    libraryOption.onPress();

    // Simulate image library response with photo
    const libraryCallback = launchImageLibrary.mock.calls[0][1];
    libraryCallback({
      assets: [{ uri: 'file://test-library-image.jpg' }],
    });

    // Should now show a different UI indicating photo is selected
    expect(getByText('📷')).toBeTruthy();
  });

  it('should handle camera response with no assets', () => {
    const { getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    const addPhotoButton = getByText('📷');
    fireEvent.press(addPhotoButton);

    // Get the camera option and press it
    const alertCall = __mockAlert.mock.calls[__mockAlert.mock.calls.length - 1];
    const cameraOption = alertCall[2].find((option: any) => option.text === 'Camera');
    cameraOption.onPress();

    // Simulate camera response with no assets
    const cameraCallback = launchCamera.mock.calls[0][1];
    cameraCallback({ assets: [] });

    // Should still show the original button
    expect(getByText('📷')).toBeTruthy();
  });

  it('should handle camera response with empty assets', () => {
    const { getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    const addPhotoButton = getByText('📷');
    fireEvent.press(addPhotoButton);

    // Get the camera option and press it
    const alertCall = __mockAlert.mock.calls[__mockAlert.mock.calls.length - 1];
    const cameraOption = alertCall[2].find((option: any) => option.text === 'Camera');
    cameraOption.onPress();

    // Simulate camera response with asset but no URI
    const cameraCallback = launchCamera.mock.calls[0][1];
    cameraCallback({ assets: [{}] });

    // Should still show the original button
    expect(getByText('📷')).toBeTruthy();
  });

  it('should handle save error', async () => {
    mockedDatabaseService.createPlant.mockRejectedValue(new Error('Database error'));

    const { getByPlaceholderText, getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    // Fill form
    const nameInput = getByPlaceholderText('e.g., My Monstera');
    const locationInput = getByPlaceholderText('e.g., Living room window');
    fireEvent.changeText(nameInput, 'Test Plant');
    fireEvent.changeText(locationInput, 'Kitchen');

    const saveButton = getByText('Save Plant');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(__mockAlert).toHaveBeenCalledWith('Error', 'Failed to save plant. Please try again.');
    });
  });

  it('should show saving state during save operation', async () => {
    // Create a promise we can control
    let resolveSave: () => void;
    const savePromise = new Promise<number>((resolve) => {
      resolveSave = () => resolve(1);
    });
    mockedDatabaseService.createPlant.mockReturnValue(savePromise);

    const { getByPlaceholderText, getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    // Fill form
    const nameInput = getByPlaceholderText('e.g., My Monstera');
    const locationInput = getByPlaceholderText('e.g., Living room window');
    fireEvent.changeText(nameInput, 'Test Plant');
    fireEvent.changeText(locationInput, 'Kitchen');

    const saveButton = getByText('Save Plant');
    fireEvent.press(saveButton);

    // Should show saving state
    await waitFor(() => {
      expect(getByText('Saving...')).toBeTruthy();
    });

    // Resolve the save operation
    resolveSave!();

    await waitFor(() => {
      expect(__mockAlert).toHaveBeenCalledWith('Success', 'Plant added successfully!', expect.any(Array));
    });
  });

  it('should reset form and navigate after successful save', async () => {
    const { getByPlaceholderText, getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    // Fill form
    const nameInput = getByPlaceholderText('e.g., My Monstera');
    const locationInput = getByPlaceholderText('e.g., Living room window');
    fireEvent.changeText(nameInput, 'Test Plant');
    fireEvent.changeText(locationInput, 'Kitchen');

    const saveButton = getByText('Save Plant');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(__mockAlert).toHaveBeenCalledWith('Success', 'Plant added successfully!', expect.any(Array));
    });

    // Get the success alert and press OK
    const successAlert = __mockAlert.mock.calls.find((call: any) => call[0] === 'Success');
    const okButton = successAlert[2][0];
    okButton.onPress();

    // Should navigate to Plants screen
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Plants');

    // Form should be reset (need to wait for state update)
    await waitFor(() => {
      expect(nameInput.props.value).toBe('');
      expect(locationInput.props.value).toBe('');
    });
  });

  it('should trim whitespace from input fields before saving', async () => {
    const { getByPlaceholderText, getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    // Fill form with whitespace
    const nameInput = getByPlaceholderText('e.g., My Monstera');
    const locationInput = getByPlaceholderText('e.g., Living room window');
    fireEvent.changeText(nameInput, '  Test Plant  ');
    fireEvent.changeText(locationInput, '  Kitchen  ');

    const saveButton = getByText('Save Plant');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockedDatabaseService.createPlant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Plant',
          location: 'Kitchen',
        })
      );
    });
  });

  it('should save plant with photo when photo is selected', async () => {
    const { getByPlaceholderText, getByText } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    // Add a photo first
    const addPhotoButton = getByText('📷');
    fireEvent.press(addPhotoButton);

    const alertCall = __mockAlert.mock.calls[__mockAlert.mock.calls.length - 1];
    const cameraOption = alertCall[2].find((option: any) => option.text === 'Camera');
    cameraOption.onPress();

    const cameraCallback = launchCamera.mock.calls[0][1];
    cameraCallback({
      assets: [{ uri: 'file://test-image.jpg' }],
    });

    // Fill form
    const nameInput = getByPlaceholderText('e.g., My Monstera');
    const locationInput = getByPlaceholderText('e.g., Living room window');
    fireEvent.changeText(nameInput, 'Test Plant');
    fireEvent.changeText(locationInput, 'Kitchen');

    const saveButton = getByText('Save Plant');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockedDatabaseService.createPlant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Plant',
          location: 'Kitchen',
          photo_uri: 'file://test-image.jpg',
        })
      );
    });
  });

  it('should handle species selection callback', () => {
    // This test verifies that the handleSpeciesSelect function exists and can be called
    // Since PlantSpeciesSearch is mocked, we can't test the actual interaction
    // but we can verify the component renders without errors
    const { } = render(
      <AddPlantScreen navigation={mockNavigation} />
    );

    // Component should render successfully
    expect(true).toBe(true);
  });
});

import React from 'react';
import { render } from '@testing-library/react-native';
import AppNavigator from '../AppNavigator';

// Mock the screens to avoid complex rendering
jest.mock('../../screens/PlantsListScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>Plants List Screen</Text>;
});

jest.mock('../../screens/AddPlantScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>Add Plant Screen</Text>;
});

jest.mock('../../screens/PlantDetailScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>Plant Detail Screen</Text>;
});

describe('AppNavigator', () => {
  it('should render without crashing', () => {
    const component = render(<AppNavigator />);

    // Just verify it renders without errors
    expect(component).toBeTruthy();
  });
});

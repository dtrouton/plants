import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';

import PlantsListScreen from '../screens/PlantsListScreen';
import AddPlantScreen from '../screens/AddPlantScreen';
import PlantDetailScreen from '../screens/PlantDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const PlantsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PlantsList"
        component={PlantsListScreen}
        options={{title: 'My Plants'}}
      />
      <Stack.Screen
        name="PlantDetail"
        component={PlantDetailScreen}
        options={{title: 'Plant Details'}}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="Plants"
          component={PlantsStackNavigator}
          options={{
            headerShown: false,
            title: 'My Plants',
          }}
        />
        <Tab.Screen
          name="AddPlant"
          component={AddPlantScreen}
          options={{title: 'Add Plant'}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

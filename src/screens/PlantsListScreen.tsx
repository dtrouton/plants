import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const PlantsListScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Plants</Text>
      <Text style={styles.subtitle}>Your plants will appear here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default PlantsListScreen;
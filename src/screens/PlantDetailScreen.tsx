import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const PlantDetailScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plant Details</Text>
      <Text style={styles.subtitle}>Plant info and care history</Text>
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

export default PlantDetailScreen;
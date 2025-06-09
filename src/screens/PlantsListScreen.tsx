import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import DatabaseService from '../database/DatabaseService';
import {Plant} from '../types/Plant';
import { formatDate, needsWatering } from '../utils/dateUtils';

interface PlantsListScreenProps {
  navigation: any;
}

const PlantsListScreen: React.FC<PlantsListScreenProps> = ({navigation}) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlants = async () => {
    try {
      setLoading(true);
      const plantsData = await DatabaseService.getAllPlants();
      setPlants(plantsData);
    } catch (error) {
      console.error('Error loading plants:', error);
      Alert.alert('Error', 'Failed to load plants');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPlants();
    }, [])
  );

  const handlePlantPress = (plant: Plant) => {
    navigation.navigate('PlantDetail', {plant});
  };

  const handleDeletePlant = async (plantId: number) => {
    Alert.alert(
      'Delete Plant',
      'Are you sure you want to delete this plant?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.deletePlant(plantId);
              await loadPlants();
            } catch (error) {
              console.error('Error deleting plant:', error);
              Alert.alert('Error', 'Failed to delete plant');
            }
          },
        },
      ]
    );
  };

  const renderPlantItem = ({item}: {item: Plant}) => {
    const plantNeedsWatering = needsWatering(item.last_watered);

    return (
      <TouchableOpacity
        style={styles.plantItem}
        onPress={() => handlePlantPress(item)}
        onLongPress={() => handleDeletePlant(item.id)}>
        <View style={styles.plantImageContainer}>
          {item.photo_uri ? (
            <Image source={{uri: item.photo_uri}} style={styles.plantImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>🌱</Text>
            </View>
          )}
        </View>

        <View style={styles.plantInfo}>
          <Text style={styles.plantName}>{item.name}</Text>
          {item.species_name && (
            <Text style={styles.speciesName}>{item.species_name}</Text>
          )}
          <Text style={styles.location}>{item.location}</Text>

          <View style={styles.wateringInfo}>
            <Text style={styles.lastWatered}>
              Last watered: {formatDate(item.last_watered)}
            </Text>
            {plantNeedsWatering && (
              <View style={styles.needsWateringBadge}>
                <Text style={styles.needsWateringText}>Needs Water</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No plants yet! 🌱</Text>
      <Text style={styles.emptySubtitle}>
        Tap the "Add Plant" tab to add your first plant
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading plants...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plants}
        keyExtractor={item => item.id.toString()}
        renderItem={renderPlantItem}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={plants.length === 0 ? styles.emptyList : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  plantItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plantImageContainer: {
    marginRight: 16,
  },
  plantImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  plantInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  plantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  speciesName: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  wateringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastWatered: {
    fontSize: 12,
    color: '#95a5a6',
  },
  needsWateringBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  needsWateringText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default PlantsListScreen;

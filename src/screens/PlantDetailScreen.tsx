import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import DatabaseService from '../database/DatabaseService';
import {Plant, WateringRecord, PlantSpecies} from '../types/Plant';
import { formatDate, formatDateTime, getDaysAgo, needsWatering } from '../utils/dateUtils';

interface PlantDetailScreenProps {
  route: {
    params: {
      plant: Plant;
    };
  };
  navigation: any;
}

interface CareInformationSectionProps {
  plantId: number;
  speciesId: number;
}

const CareInformationSection: React.FC<CareInformationSectionProps> = ({speciesId}) => {
  const [speciesInfo, setSpeciesInfo] = useState<PlantSpecies | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSpeciesInfo = useCallback(async () => {
    try {
      setLoading(true);
      // Get species info from database
      const species = await DatabaseService.searchPlantSpecies('');
      const foundSpecies = species.find(s => s.species_id === speciesId);
      setSpeciesInfo(foundSpecies || null);
    } catch (error) {
      console.error('Error loading species info:', error);
    } finally {
      setLoading(false);
    }
  }, [speciesId]);

  useEffect(() => {
    loadSpeciesInfo();
  }, [loadSpeciesInfo]);

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Care Information</Text>
        <Text style={styles.loadingText}>Loading care information...</Text>
      </View>
    );
  }

  if (!speciesInfo) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Care Information</Text>

      {speciesInfo.watering_frequency && (
        <View style={styles.careItem}>
          <Text style={styles.careLabel}>💧 Watering Frequency:</Text>
          <Text style={styles.careValue}>Every {speciesInfo.watering_frequency} days</Text>
        </View>
      )}

      {speciesInfo.light_requirements && (
        <View style={styles.careItem}>
          <Text style={styles.careLabel}>☀️ Light Requirements:</Text>
          <Text style={styles.careValue}>{speciesInfo.light_requirements}</Text>
        </View>
      )}

      {speciesInfo.care_instructions && (
        <View style={styles.careItem}>
          <Text style={styles.careLabel}>📝 Care Instructions:</Text>
          <Text style={styles.careInstructions}>{speciesInfo.care_instructions}</Text>
        </View>
      )}
    </View>
  );
};

const PlantDetailScreen: React.FC<PlantDetailScreenProps> = ({route, navigation}) => {
  const [plant, setPlant] = useState<Plant>(route.params.plant);
  const [wateringRecords, setWateringRecords] = useState<WateringRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWateringModal, setShowWateringModal] = useState(false);
  const [wateringNotes, setWateringNotes] = useState('');
  const [watering, setWatering] = useState(false);

  const loadWateringRecords = useCallback(async () => {
    try {
      setLoading(true);
      const records = await DatabaseService.getWateringRecords(plant.id);
      setWateringRecords(records);
    } catch (error) {
      console.error('Error loading watering records:', error);
      Alert.alert('Error', 'Failed to load watering history');
    } finally {
      setLoading(false);
    }
  }, [plant.id]);

  useEffect(() => {
    loadWateringRecords();
  }, [loadWateringRecords]);

  const handleQuickWater = async () => {
    try {
      setWatering(true);
      const wateringDate = new Date().toISOString();

      await DatabaseService.addWateringRecord({
        plant_id: plant.id,
        watered_date: wateringDate,
        notes: 'Quick watering',
      });

      // Update local plant state
      setPlant(prev => ({...prev, last_watered: wateringDate}));

      // Reload watering records
      await loadWateringRecords();

      Alert.alert('Success', 'Plant watered successfully! 💧');
    } catch (error) {
      console.error('Error recording watering:', error);
      Alert.alert('Error', 'Failed to record watering');
    } finally {
      setWatering(false);
    }
  };

  const handleWaterWithNotes = async () => {
    try {
      setWatering(true);
      const wateringDate = new Date().toISOString();

      await DatabaseService.addWateringRecord({
        plant_id: plant.id,
        watered_date: wateringDate,
        notes: wateringNotes.trim() || undefined,
      });

      // Update local plant state
      setPlant(prev => ({...prev, last_watered: wateringDate}));

      // Reload watering records
      await loadWateringRecords();

      setShowWateringModal(false);
      setWateringNotes('');
      Alert.alert('Success', 'Watering logged successfully! 💧');
    } catch (error) {
      console.error('Error recording watering:', error);
      Alert.alert('Error', 'Failed to record watering');
    } finally {
      setWatering(false);
    }
  };


  const handleDeletePlant = () => {
    Alert.alert(
      'Delete Plant',
      `Are you sure you want to delete ${plant.name}? This cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.deletePlant(plant.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting plant:', error);
              Alert.alert('Error', 'Failed to delete plant');
            }
          },
        },
      ]
    );
  };

  const daysAgo = getDaysAgo(plant.last_watered);
  const plantNeedsWatering = needsWatering(plant.last_watered);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Plant Header */}
      <View style={styles.header}>
        {plant.photo_uri ? (
          <Image source={{uri: plant.photo_uri}} style={styles.plantImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🌱</Text>
          </View>
        )}

        <View style={styles.plantInfo}>
          <Text style={styles.plantName}>{plant.name}</Text>
          {plant.species_name && (
            <Text style={styles.speciesName}>{plant.species_name}</Text>
          )}
          <Text style={styles.location}>📍 {plant.location}</Text>
          <Text style={styles.addedDate}>
            Added: {formatDate(plant.created_date)}
          </Text>
        </View>
      </View>

      {/* Watering Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Watering Status</Text>
        <View style={styles.wateringStatus}>
          <View style={styles.wateringInfo}>
            <Text style={styles.lastWateredLabel}>Last Watered:</Text>
            <Text style={styles.lastWateredDate}>
              {plant.last_watered ? formatDate(plant.last_watered) : 'Never'}
            </Text>
            {daysAgo !== null && (
              <Text style={styles.daysAgo}>
                {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
              </Text>
            )}
          </View>

          {plantNeedsWatering && (
            <View style={styles.needsWateringBadge}>
              <Text style={styles.needsWateringText}>Needs Water!</Text>
            </View>
          )}
        </View>

        {/* Watering Buttons */}
        <View style={styles.wateringButtons}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleQuickWater}
            disabled={watering}>
            <Text style={styles.buttonText}>
              {watering ? 'Watering...' : '💧 Water Now'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setShowWateringModal(true)}
            disabled={watering}>
            <Text style={styles.secondaryButtonText}>Water with Notes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Care Information */}
      {plant.species_id && (
        <CareInformationSection plantId={plant.id} speciesId={plant.species_id} />
      )}

      {/* Watering History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Watering History</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading history...</Text>
        ) : wateringRecords.length > 0 ? (
          <View style={styles.historyList}>
            {wateringRecords.slice(0, 10).map((record) => (
              <View key={record.id} style={styles.historyItem}>
                <View style={styles.historyDate}>
                  <Text style={styles.historyDateText}>
                    {formatDateTime(record.watered_date)}
                  </Text>
                </View>
                {record.notes && (
                  <Text style={styles.historyNotes}>{record.notes}</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyHistory}>No watering records yet</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleDeletePlant}>
          <Text style={styles.dangerButtonText}>Delete Plant</Text>
        </TouchableOpacity>
      </View>

      {/* Watering Modal */}
      <Modal
        visible={showWateringModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Watering</Text>
            <TouchableOpacity
              onPress={() => setShowWateringModal(false)}
              style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={wateringNotes}
              onChangeText={setWateringNotes}
              placeholder="e.g., Soil was dry, gave extra water..."
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleWaterWithNotes}
              disabled={watering}>
              <Text style={styles.buttonText}>
                {watering ? 'Logging...' : '💧 Log Watering'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  plantImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 20,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  placeholderText: {
    fontSize: 40,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  speciesName: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  addedDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  wateringStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  wateringInfo: {
    flex: 1,
  },
  lastWateredLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  lastWateredDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  daysAgo: {
    fontSize: 12,
    color: '#95a5a6',
  },
  needsWateringBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  needsWateringText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  wateringButtons: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  dangerButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  historyDate: {
    marginBottom: 4,
  },
  historyDateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  historyNotes: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  emptyHistory: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    color: '#3498db',
    fontSize: 16,
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  careItem: {
    marginBottom: 16,
  },
  careLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  careValue: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  careInstructions: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
});

export default PlantDetailScreen;

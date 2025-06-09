import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {launchImageLibrary, launchCamera, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import DatabaseService from '../database/DatabaseService';
import PlantSpeciesSearch from '../components/PlantSpeciesSearch';

interface AddPlantScreenProps {
  navigation: any;
}

interface SelectedSpecies {
  id: number;
  common_name: string;
  scientific_name: string;
  watering_frequency?: number;
  light_requirements?: string;
  care_instructions?: string;
}

const AddPlantScreen: React.FC<AddPlantScreenProps> = ({navigation}) => {
  const [plantName, setPlantName] = useState('');
  const [location, setLocation] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<SelectedSpecies | null>(null);

  const handleImagePicker = () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add a photo',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Camera',
          onPress: () => openCamera(),
        },
        {
          text: 'Photo Library',
          onPress: () => openImageLibrary(),
        },
      ]
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.7,
      maxWidth: 800,
      maxHeight: 800,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.uri) {
          setPhotoUri(asset.uri);
        }
      }
    });
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.7,
      maxWidth: 800,
      maxHeight: 800,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.uri) {
          setPhotoUri(asset.uri);
        }
      }
    });
  };

  const handleSpeciesSelect = (species: SelectedSpecies) => {
    setSelectedSpecies(species);
  };

  const handleSavePlant = async () => {
    if (!plantName.trim()) {
      Alert.alert('Error', 'Please enter a plant name');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    try {
      setSaving(true);
      
      const newPlant = {
        name: plantName.trim(),
        species_id: selectedSpecies?.id,
        species_name: selectedSpecies?.common_name,
        photo_uri: photoUri || undefined,
        location: location.trim(),
        created_date: new Date().toISOString(),
      };

      await DatabaseService.createPlant(newPlant);
      
      Alert.alert('Success', 'Plant added successfully!', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            navigation.navigate('Plants');
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving plant:', error);
      Alert.alert('Error', 'Failed to save plant. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setPlantName('');
    setLocation('');
    setPhotoUri(null);
    setSelectedSpecies(null);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Add New Plant</Text>
          
          {/* Photo Section */}
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Photo</Text>
            <TouchableOpacity style={styles.photoContainer} onPress={handleImagePicker}>
              {photoUri ? (
                <Image source={{uri: photoUri}} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>📷</Text>
                  <Text style={styles.photoPlaceholderSubtext}>Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plant Name *</Text>
              <TextInput
                style={styles.input}
                value={plantName}
                onChangeText={setPlantName}
                placeholder="e.g., My Monstera"
                placeholderTextColor="#bbb"
              />
            </View>

            <PlantSpeciesSearch onSelectSpecies={handleSpeciesSelect} />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., Living room window"
                placeholderTextColor="#bbb"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSavePlant}
              disabled={saving}>
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Plant'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={resetForm}
              disabled={saving}>
              <Text style={styles.cancelButtonText}>Clear Form</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 24,
    textAlign: 'center',
  },
  photoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#27ae60',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ecf0f1',
    borderWidth: 2,
    borderColor: '#bdc3c7',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 32,
    marginBottom: 4,
  },
  photoPlaceholderSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
  },
  buttonSection: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddPlantScreen;
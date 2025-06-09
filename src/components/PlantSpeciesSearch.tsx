import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import PlantAPIService, {PlantSpeciesAPI} from '../services/PlantAPIService';
import DatabaseService from '../database/DatabaseService';
import { SEARCH_DEBOUNCE_MS } from '../constants/api';

interface PlantSpeciesSearchProps {
  onSelectSpecies: (species: {
    id: number;
    common_name: string;
    scientific_name: string;
    watering_frequency?: number;
    light_requirements?: string;
    care_instructions?: string;
  }) => void;
  initialValue?: string;
}

const PlantSpeciesSearch: React.FC<PlantSpeciesSearchProps> = ({
  onSelectSpecies,
  initialValue = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [searchResults, setSearchResults] = useState<PlantSpeciesAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);

  const performSearch = useCallback(async () => {
    try {
      setLoading(true);
      setShowResults(true);

      // First check local database for cached species
      const cachedSpecies = await DatabaseService.searchPlantSpecies(searchQuery);

      if (cachedSpecies.length > 0) {
        // Convert cached species to API format for consistency
        const convertedSpecies: PlantSpeciesAPI[] = cachedSpecies.map(species => ({
          id: species.species_id,
          common_name: species.common_name,
          scientific_name: species.scientific_name ? [species.scientific_name] : [],
          watering: species.watering_frequency ? `Every ${species.watering_frequency} days` : undefined,
          sunlight: species.light_requirements ? [species.light_requirements] : undefined,
        }));
        setSearchResults(convertedSpecies);
      } else {
        // Search API if not found in cache
        const response = await PlantAPIService.searchPlants(searchQuery);
        setSearchResults(response.data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search for plants. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, performSearch]);

  const handleSelectSpecies = async (species: PlantSpeciesAPI) => {
    try {
      setLoading(true);

      // Get detailed information from API
      let detailedInfo;
      try {
        detailedInfo = await PlantAPIService.getPlantDetails(species.id);
      } catch (error) {
        console.warn('Failed to get detailed info, using basic info:', error);
        detailedInfo = null;
      }

      const wateringFrequency = detailedInfo
        ? PlantAPIService.convertWateringToDays(detailedInfo.watering)
        : PlantAPIService.convertWateringToDays(species.watering);

      const lightRequirements = detailedInfo
        ? PlantAPIService.formatSunlight(detailedInfo.sunlight)
        : PlantAPIService.formatSunlight(species.sunlight);

      const careInstructions = detailedInfo
        ? PlantAPIService.createCareInstructions(detailedInfo)
        : `💧 Watering: ${species.watering || 'Unknown'}\n☀️ Light: ${lightRequirements}`;

      const selectedSpeciesData = {
        id: species.id,
        common_name: species.common_name,
        scientific_name: species.scientific_name?.[0] || '',
        watering_frequency: wateringFrequency || undefined,
        light_requirements: lightRequirements,
        care_instructions: careInstructions,
      };

      // Cache the species in local database
      try {
        await DatabaseService.createPlantSpecies({
          common_name: selectedSpeciesData.common_name,
          scientific_name: selectedSpeciesData.scientific_name,
          watering_frequency: selectedSpeciesData.watering_frequency || undefined,
          light_requirements: selectedSpeciesData.light_requirements,
          care_instructions: selectedSpeciesData.care_instructions,
          cached_date: new Date().toISOString(),
        });
      } catch (cacheError) {
        console.warn('Failed to cache species:', cacheError);
        // Continue anyway - caching is not critical
      }

      setSelectedSpecies(species.common_name);
      setShowResults(false);
      onSelectSpecies(selectedSpeciesData);
    } catch (error) {
      console.error('Error selecting species:', error);
      Alert.alert('Error', 'Failed to select plant species. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedSpecies(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const renderSpeciesItem = ({item}: {item: PlantSpeciesAPI}) => (
    <TouchableOpacity
      style={styles.speciesItem}
      onPress={() => handleSelectSpecies(item)}>
      {item.default_image?.medium_url ? (
        <Image
          source={{uri: item.default_image.medium_url}}
          style={styles.speciesImage}
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>🌱</Text>
        </View>
      )}

      <View style={styles.speciesInfo}>
        <Text style={styles.speciesName}>{item.common_name}</Text>
        {item.scientific_name && item.scientific_name.length > 0 && (
          <Text style={styles.scientificName}>{item.scientific_name[0]}</Text>
        )}
        {item.watering && (
          <Text style={styles.careInfo}>💧 {item.watering}</Text>
        )}
        {item.sunlight && item.sunlight.length > 0 && (
          <Text style={styles.careInfo}>☀️ {item.sunlight.join(', ')}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (selectedSpecies) {
    return (
      <View style={styles.selectedContainer}>
        <Text style={styles.selectedLabel}>Selected Species:</Text>
        <View style={styles.selectedSpecies}>
          <Text style={styles.selectedText}>{selectedSpecies}</Text>
          <TouchableOpacity onPress={clearSelection} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Plant Species (Optional)</Text>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search for plant species..."
        placeholderTextColor="#bbb"
      />

      {showResults && (
        <View style={styles.resultsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSpeciesItem}
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          ) : searchQuery.length >= 2 ? (
            <Text style={styles.noResults}>No species found. Try a different search term.</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
  },
  resultsContainer: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 300,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#7f8c8d',
  },
  resultsList: {
    maxHeight: 300,
  },
  speciesItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  speciesImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeholderText: {
    fontSize: 20,
  },
  speciesInfo: {
    flex: 1,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  scientificName: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  careInfo: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 2,
  },
  noResults: {
    padding: 20,
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  selectedContainer: {
    marginBottom: 20,
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  selectedSpecies: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  selectedText: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: 'bold',
    flex: 1,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#27ae60',
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default PlantSpeciesSearch;

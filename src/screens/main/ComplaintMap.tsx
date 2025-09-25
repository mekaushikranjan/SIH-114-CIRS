import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, Modal, Image, ScrollView, Dimensions } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface ComplaintMapProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  onLocationSelect?: (location: { latitude: number; longitude: number; address?: string }) => void;
  markers?: Array<{
    id: string;
    coordinate: { latitude: number; longitude: number };
    title: string;
    description?: string;
    status?: string;
    category?: string;
  }>;
  mode?: 'select' | 'view'; // 'select' for choosing location, 'view' for displaying complaints
  height?: number;
  showControls?: boolean; // Show map controls (zoom, home, map type)
  showUserComplaints?: boolean; // Show user's own complaints
  showNearbyComplaints?: boolean; // Show nearby complaints
}

export const ComplaintMap: React.FC<ComplaintMapProps> = ({
  initialLocation,
  onLocationSelect,
  markers = [],
  mode = 'view',
  height = 300,
  showControls = true,
  showUserComplaints = false,
  showNearbyComplaints = false,
}) => {
  const [region, setRegion] = useState<Region>({
    latitude: 23.6102, // Jharkhand center
    longitude: 85.2799,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [showMapTypeMenu, setShowMapTypeMenu] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [showMarkerModal, setShowMarkerModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (initialLocation) {
      setRegion({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setSelectedLocation(initialLocation);
    }
    getUserLocation();
  }, [initialLocation]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(userLoc);
      
      // If no initial location, center on user location
      if (!initialLocation) {
        setRegion({
          latitude: userLoc.latitude,
          longitude: userLoc.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      // Don't show alert on initial load, just log the error
    }
  };

  const handleMapPress = async (event: any) => {
    if (mode !== 'select') return;

    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });

    try {
      setLoading(true);
      const address = await getAddressFromCoordinates(latitude, longitude);
      onLocationSelect?.({ latitude, longitude, address });
    } catch (error) {
      console.error('Error getting address:', error);
      onLocationSelect?.({ latitude, longitude });
    } finally {
      setLoading(false);
    }
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses.length > 0) {
        const address = addresses[0];
        return `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.postalCode || ''}`.trim();
      }
      return '';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return '';
    }
  };

  const getMarkerColor = (status?: string, category?: string) => {
    // Priority: Status first, then category
    if (status) {
      switch (status.toLowerCase()) {
        case 'completed':
        case 'resolved': return '#4CAF50'; // Green
        case 'in_progress': return '#FF9800'; // Orange
        case 'assigned': return '#2196F3'; // Blue
        case 'acknowledged': return '#9C27B0'; // Purple
        case 'submitted':
        case 'new': return '#F44336'; // Red
        default: return '#9E9E9E'; // Gray
      }
    }
    
    if (category) {
      switch (category.toLowerCase()) {
        case 'sanitation': return '#8BC34A'; // Light Green
        case 'roads and infrastructure':
        case 'roads_transport': return '#FF5722'; // Deep Orange
        case 'water supply':
        case 'water_supply': return '#00BCD4'; // Cyan
        case 'electricity': return '#FFC107'; // Amber
        case 'public health':
        case 'public_health': return '#E91E63'; // Pink
        case 'waste management':
        case 'waste_management': return '#795548'; // Brown
        case 'environment':
        case 'parks_environment': return '#4CAF50'; // Green
        case 'housing':
        case 'housing_urban_development': return '#607D8B'; // Blue Grey
        case 'disaster management':
        case 'disaster_management': return '#F44336'; // Red
        case 'fire emergency':
        case 'fire_emergency_services': return '#FF5722'; // Deep Orange
        case 'transportation': return '#3F51B5'; // Indigo
        case 'education': return '#FF9800'; // Orange
        case 'healthcare': return '#E91E63'; // Pink
        case 'public safety': return '#F44336'; // Red
        default: return '#9E9E9E'; // Gray
      }
    }
    
    return '#1976d2'; // Default Blue
  };

  const centerOnUserLocation = async () => {
    if (isLocating) return; // Prevent multiple simultaneous requests
    
    setIsLocating(true);
    
    try {
      // First try to get fresh location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to show your current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(userLoc);
      
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: userLoc.latitude,
          longitude: userLoc.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      
      // Fallback to stored user location if available
      if (userLocation && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      } else {
        Alert.alert('Location Error', 'Unable to get your current location. Please check your location settings.');
      }
    } finally {
      setIsLocating(false);
    }
  };

  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.getCamera().then((camera) => {
        const newCamera = {
          ...camera,
          zoom: Math.min(20, camera.zoom + 1),
        };
        mapRef.current?.animateCamera(newCamera, { duration: 300 });
      });
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.getCamera().then((camera) => {
        const newCamera = {
          ...camera,
          zoom: Math.max(1, camera.zoom - 1),
        };
        mapRef.current?.animateCamera(newCamera, { duration: 300 });
      });
    }
  };

  const goHome = () => {
    if (userLocation) {
      // Center on user location if available
      const homeRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(homeRegion);
      mapRef.current?.animateToRegion(homeRegion, 1000);
    } else {
      // Fallback to Jharkhand center if user location not available
      const homeRegion = {
        latitude: 23.6102, // Jharkhand center
        longitude: 85.2799,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(homeRegion);
      mapRef.current?.animateToRegion(homeRegion, 1000);
    }
  };

  const toggleMapType = () => {
    setShowMapTypeMenu(!showMapTypeMenu);
  };

  const changeMapType = (type: 'standard' | 'satellite' | 'hybrid') => {
    setMapType(type);
    setShowMapTypeMenu(false);
  };

  const handleMarkerPress = (marker: any) => {
    setSelectedMarker(marker);
    setShowMarkerModal(true);
  };

  const closeMarkerModal = () => {
    setShowMarkerModal(false);
    setSelectedMarker(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType={mapType}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="Current location"
            pinColor="#2196F3"
            identifier="user-location"
          />
        )}

        {/* Selected location marker (for select mode) */}
        {mode === 'select' && selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="Selected Location"
            description="Tap to select this location"
            pinColor="#F44336"
          />
        )}

        {/* Complaint markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={getMarkerColor(marker.status, marker.category)}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}
      </MapView>

      {/* Map controls */}
      {showControls && (
        <>
          {/* Left side controls - Zoom In/Out */}
          <View style={styles.leftControls}>
            <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
              <Ionicons name="add" size={20} color="#2E7D32" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
              <Ionicons name="remove" size={20} color="#2E7D32" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={toggleMapType}>
              <Ionicons name="layers" size={20} color="#2E7D32" />
            </TouchableOpacity>
          </View>

          {/* Bottom right - Focus location button */}
          <View style={styles.bottomRightControls}>
            <TouchableOpacity 
              style={[styles.focusButton, isLocating && styles.focusButtonLoading]} 
              onPress={centerOnUserLocation}
              disabled={isLocating}
            >
              <Ionicons 
                name={isLocating ? "hourglass-outline" : "locate"} 
                size={24} 
                color={isLocating ? "#666" : "#2E7D32"} 
              />
            </TouchableOpacity>
          </View>

          {/* Select mode button */}
          {mode === 'select' && (
            <View style={styles.bottomRightControls}>
              <TouchableOpacity 
                style={[styles.controlButton, styles.selectButton]} 
                onPress={() => {
                  if (selectedLocation) {
                    onLocationSelect?.(selectedLocation);
                  }
                }}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Map type menu */}
      {showMapTypeMenu && (
        <View style={styles.mapTypeMenu}>
          <TouchableOpacity 
            style={[styles.mapTypeOption, mapType === 'standard' && styles.mapTypeOptionSelected]}
            onPress={() => changeMapType('standard')}
          >
            <Text style={[styles.mapTypeText, mapType === 'standard' && styles.mapTypeTextSelected]}>
              Standard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mapTypeOption, mapType === 'satellite' && styles.mapTypeOptionSelected]}
            onPress={() => changeMapType('satellite')}
          >
            <Text style={[styles.mapTypeText, mapType === 'satellite' && styles.mapTypeTextSelected]}>
              Satellite
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mapTypeOption, mapType === 'hybrid' && styles.mapTypeOptionSelected]}
            onPress={() => changeMapType('hybrid')}
          >
            <Text style={[styles.mapTypeText, mapType === 'hybrid' && styles.mapTypeTextSelected]}>
              Hybrid
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Getting address...</Text>
        </View>
      )}
 

      {/* Marker Details Modal */}
      <Modal
        visible={showMarkerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeMarkerModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complaint Details</Text>
              <TouchableOpacity onPress={closeMarkerModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedMarker && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.complaintHeader}>
                  <View style={styles.statusBadge}>
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color={getMarkerColor(selectedMarker.status, selectedMarker.category)}
                    />
                    <Text style={[styles.statusText, { color: getMarkerColor(selectedMarker.status, selectedMarker.category) }]}>
                      {selectedMarker.status?.toUpperCase() || 'UNKNOWN'}
                    </Text>
                  </View>
                  {selectedMarker.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{selectedMarker.category}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.complaintTitle}>{selectedMarker.title}</Text>
                
                {selectedMarker.description && (
                  <Text style={styles.complaintDescription}>{selectedMarker.description}</Text>
                )}

                {selectedMarker.images && selectedMarker.images.length > 0 && (
                  <View style={styles.imagesContainer}>
                    <Text style={styles.imagesTitle}>Images:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.imagesList}>
                        {selectedMarker.images.map((image: any, index: number) => (
                          <Image
                            key={index}
                            source={{ uri: image.uri || image }}
                            style={styles.complaintImage}
                            resizeMode="cover"
                          />
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                <View style={styles.complaintInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {selectedMarker.address || 'Location not specified'}
                    </Text>
                  </View>
                  
                  {selectedMarker.submittedAt && (
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.infoText}>
                        Submitted: {formatDate(selectedMarker.submittedAt)}
                      </Text>
                    </View>
                  )}

                  {selectedMarker.upvotes !== undefined && (
                    <View style={styles.infoRow}>
                      <Ionicons name="arrow-up-outline" size={16} color="#2E7D32" />
                      <Text style={styles.infoText}>
                        {selectedMarker.upvotes} upvotes
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  leftControls: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'column',
    gap: 10,
  },
  bottomRightControls: {
    position: 'absolute',
    bottom: 80,
    right: 10,
    flexDirection: 'column',
    gap: 10,
  },
  controlButton: {
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  focusButton: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  focusButtonLoading: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  selectButton: {
    backgroundColor: '#2E7D32',
  },
  mapTypeMenu: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 120,
  },
  mapTypeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  mapTypeOptionSelected: {
    backgroundColor: '#E8F5E8',
  },
  mapTypeText: {
    fontSize: 14,
    color: '#333',
  },
  mapTypeTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  instructions: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.7,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  categoryBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  categoryText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  complaintTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  complaintDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  imagesContainer: {
    marginBottom: 20,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  imagesList: {
    flexDirection: 'row',
  },
  complaintImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginRight: 10,
  },
  complaintInfo: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
});

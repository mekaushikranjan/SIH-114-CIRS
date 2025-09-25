import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { RootState } from '../../store/store';
import WorkerHeader from '../../components/WorkerHeader';
import { offlineApiService } from '../../services/offlineApiService';
import locationService from '../../services/locationService';

const { width, height } = Dimensions.get('window');

interface MapIssue {
  id: string;
  issueId: string;
  title: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'assigned' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: string;
}

const WorkerMapScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [mapIssues, setMapIssues] = useState<MapIssue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<MapIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<MapIssue | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Removed mapView state - only showing map now
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 23.3441,
    longitude: 85.3096,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    getCurrentLocation();
    fetchMapIssues();
  }, [user?.id]);

  useEffect(() => {
    filterIssues();
  }, [mapIssues]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userCoords);
      setMapRegion({
        ...userCoords,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const fetchMapIssues = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🗺️ Fetching map issues for worker:', user.id);
      
      const response = await offlineApiService.getWorkerAssignments(user.id);
      
      if (response.success && response.data) {
        const assignments = response.data.assignments || [];
        
        // Transform assignments to MapIssue format - only assigned and in-progress
        const transformedIssues: MapIssue[] = assignments
          .filter(assignment => 
            assignment.issue && 
            (assignment.status === 'assigned' || assignment.status === 'in_progress')
          )
          .map(assignment => {
            const issue = assignment.issue as any;
            return {
              id: assignment.id,
              issueId: assignment.issueId,
              title: issue.title,
              location: issue.location || issue.address || 'Location not available',
              latitude: issue.latitude || issue.coordinates?.latitude || issue.location?.lat || 23.3441,
              longitude: issue.longitude || issue.coordinates?.longitude || issue.location?.lng || 85.3096,
              status: assignment.status as 'assigned' | 'in_progress',
              priority: assignment.priority as 'low' | 'medium' | 'high',
              category: issue.category || 'General',
            };
          });

        console.log('🗺️ Transformed map issues:', transformedIssues.length);
        setMapIssues(transformedIssues);
      } else {
        console.log('⚠️ No assignments found, using fallback');
        setMapIssues([]);
      }
    } catch (error) {
      console.error('❌ Error fetching map issues:', error);
      Alert.alert('Error', 'Failed to load map data');
      setMapIssues([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterIssues = () => {
    // Show all issues since we removed filters
    setFilteredIssues(mapIssues);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMapIssues();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#2196F3';
      case 'in_progress': return '#FF9800';
      case 'completed': return '#4CAF50';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return 'clipboard';
      case 'in_progress': return 'sync';
      case 'completed': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const navigateToIssue = (issue: MapIssue) => {
    Alert.alert(
      'Navigate to Issue',
      `Open navigation to ${issue.location}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open in Google Maps', onPress: () => openInGoogleMaps(issue) },
      ]
    );
  };

  const handleViewDetails = (issue: MapIssue) => {
    // Navigate to My Work tab and open the issue details there
    (navigation as any).navigate('MyWork', { 
      openIssueId: issue.issueId 
    });
  };

  const openInGoogleMaps = (issue: MapIssue) => {
    const url = Platform.select({
      ios: `comgooglemaps://?daddr=${issue.latitude},${issue.longitude}&directionsmode=driving`,
      android: `google.navigation:q=${issue.latitude},${issue.longitude}&mode=d`,
    });

    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${issue.latitude},${issue.longitude}&travelmode=driving`;

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(fallbackUrl);
        }
      });
    } else {
      Linking.openURL(fallbackUrl);
    }
  };

  const openInAppleMaps = (issue: MapIssue) => {
    const url = `http://maps.apple.com/?daddr=${issue.latitude},${issue.longitude}&dirflg=d`;
    Linking.openURL(url);
  };

  const renderMapView = () => (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="Current location"
            pinColor="blue"
          />
        )}

        {/* Issue Markers */}
        {mapIssues.map((issue) => (
          <Marker
            key={issue.id}
            coordinate={{
              latitude: issue.latitude,
              longitude: issue.longitude,
            }}
            pinColor={getPriorityColor(issue.priority)}
            onPress={() => setSelectedIssue(issue)}
          >
            <Callout onPress={() => navigateToIssue(issue)}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{issue.title}</Text>
                <Text style={styles.calloutLocation}>{issue.location}</Text>
                <View style={styles.calloutMeta}>
                  <View style={[styles.calloutBadge, { backgroundColor: getStatusColor(issue.status) }]}>
                    <Text style={styles.calloutBadgeText}>{issue.status.toUpperCase()}</Text>
                  </View>
                  <View style={[styles.calloutBadge, { backgroundColor: getPriorityColor(issue.priority) }]}>
                    <Text style={styles.calloutBadgeText}>{issue.priority.toUpperCase()}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.calloutButton}>
                  <Ionicons name="navigate" size={16} color="#FF6B35" />
                  <Text style={styles.calloutButtonText}>Navigate</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity 
          style={styles.mapControlButton}
          onPress={() => {
            if (userLocation) {
              setMapRegion({
                ...userLocation,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              });
            } else {
              getCurrentLocation();
            }
          }}
        >
          <Ionicons name="locate" size={24} color="#FF6B35" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.mapControlButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Issue Markers Info */}
      <View style={styles.mapLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: '#f44336' }]} />
          <Text style={styles.legendText}>High Priority</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Medium Priority</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Low Priority</Text>
        </View>
      </View>
    </View>
  );

  // Removed list view - only showing map now

  // Removed header toggle - only showing map now

  return (
    <View style={styles.container}>
      <WorkerHeader
        title="Issue Locations"
        subtitle={`${mapIssues.length} locations`}
      />


      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{mapIssues.filter(i => i.status === 'assigned').length}</Text>
          <Text style={styles.statLabel}>Assigned</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{mapIssues.filter(i => i.status === 'in_progress').length}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{mapIssues.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Map View Only */}
      {renderMapView()}

      {/* Selected Issue Modal */}
      {selectedIssue && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedIssue.title}</Text>
              <TouchableOpacity onPress={() => setSelectedIssue(null)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.modalRow}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.modalText}>{selectedIssue.location}</Text>
              </View>
              <View style={styles.modalRow}>
                <Ionicons name="folder" size={16} color="#666" />
                <Text style={styles.modalText}>{selectedIssue.category}</Text>
              </View>
              <View style={styles.modalRow}>
                <Ionicons name="flag" size={16} color={getPriorityColor(selectedIssue.priority)} />
                <Text style={styles.modalText}>{selectedIssue.priority} Priority</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalNavigateButton, { flex: 1 }]}
                onPress={() => {
                  navigateToIssue(selectedIssue);
                  setSelectedIssue(null);
                }}
              >
                <Ionicons name="navigate" size={18} color="white" />
                <Text style={styles.modalNavigateText}>Navigate to Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerActions: {
    flexDirection: 'row',
  },
  viewToggle: {
    padding: 6,
    borderRadius: 6,
    marginLeft: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeViewToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  statsBar: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  calloutLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  calloutMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calloutBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  calloutBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  calloutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  calloutButtonText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 4,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  mapPlaceholderNote: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
    fontStyle: 'italic',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  mapControlButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mapLegend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  issueCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.48,
    justifyContent: 'center',
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalNavigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  modalNavigateText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalDetailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDetailsText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default WorkerMapScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  RefreshControl,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store/store';
import { apiService } from '../../services/apiService';
import { ComplaintMap } from './ComplaintMap';

const { width } = Dimensions.get('window');

// Issue interface
interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  location: { address: string };
  status: string;
  upvotes: number;
  submittedAt: string;
  distance?: string;
}

const IssuesScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('issues');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list'); // Toggle between list and map view
  
  const categories = useSelector((state: RootState) => state.issues.categories);

  // Fetch issues from backend
  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPublicIssues({
        page: 1,
        limit: 50
        // Don't send status parameter to get all issues
      });

      if (response.success && response.data) {
        // Transform API response to match our Issue interface
        const transformedIssues = (response.data.issues || []).map((apiIssue: any) => ({
          id: apiIssue.id || '',
          title: apiIssue.title || '',
          description: apiIssue.description || '',
          category: apiIssue.category || '',
          location: { address: apiIssue.location?.address || 'Unknown Location' },
          status: apiIssue.status || 'submitted',
          upvotes: apiIssue.upvotes || 0,
          submittedAt: apiIssue.submittedAt || apiIssue.createdAt,
          distance: apiIssue.distance
        }));
        setIssues(transformedIssues);
      } else {
        Alert.alert('Error', 'Failed to load issues');
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      Alert.alert('Error', 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIssues();
    setRefreshing(false);
  };

  const filteredIssues = issues.filter((issue: Issue) => {
    const matchesSearch = (issue.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (issue.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (issue.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#FF9800';
      case 'acknowledged': return '#2196F3';
      case 'assigned': return '#9C27B0';
      case 'in_progress': return '#FF5722';
      case 'completed': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return 'time-outline';
      case 'acknowledged': return 'checkmark-circle-outline';
      case 'assigned': return 'person-outline';
      case 'in_progress': return 'construct-outline';
      case 'completed': return 'checkmark-done-outline';
      default: return 'help-outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const handleIssuePress = (issueId: string) => {
    (navigation as any).navigate('TrackIssue', { issueId });
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'map' : 'list');
  };

  // Transform issues for map markers
  const mapMarkers = issues.map((issue) => ({
    id: issue.id,
    coordinate: {
      latitude: 23.6102 + (Math.random() - 0.5) * 0.1, // Mock coordinates for demo
      longitude: 85.2799 + (Math.random() - 0.5) * 0.1,
    },
    title: issue.title,
    description: issue.description,
    status: issue.status,
    category: issue.category,
    upvotes: issue.upvotes,
    submittedAt: issue.submittedAt,
    address: issue.location.address,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {viewMode === 'list' ? 'Civic Issues' : 'Issues Map'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {viewMode === 'list' ? 'Browse and track community issues' : 'View issues on map'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={toggleViewMode}
        >
          <Ionicons 
            name={viewMode === 'list' ? 'map' : 'list'} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar - only show in list view */}
      {viewMode === 'list' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search issues..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredIssues.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={styles.emptyStateText}>No issues found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try adjusting your search terms' : 'No issues available'}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultsCount}>
                {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''} found
              </Text>
              
              {filteredIssues.map((issue) => (
                <TouchableOpacity
                  key={issue.id}
                  style={styles.issueCard}
                  onPress={() => handleIssuePress(issue.id)}
                >
                  <View style={styles.issueHeader}>
                    <View style={styles.statusBadge}>
                      <Ionicons
                        name={getStatusIcon(issue.status) as any}
                        size={14}
                        color={getStatusColor(issue.status)}
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(issue.status) }]}>
                        {issue.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    {issue.distance && (
                      <View style={styles.issueDistance}>
                        <Ionicons name="location-outline" size={12} color="#666" />
                        <Text style={styles.distanceText}>{issue.distance}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.issueTitle}>{issue.title}</Text>
                  <Text style={styles.issueDescription} numberOfLines={2}>
                    {issue.description}
                  </Text>

                  <View style={styles.issueLocation}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.locationText}>{issue.location.address}</Text>
                  </View>

                  <View style={styles.issueFooter}>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryText}>{issue.category}</Text>
                    </View>
                    
                    <View style={styles.issueStats}>
                      <View style={styles.upvoteCount}>
                        <Ionicons name="arrow-up" size={14} color="#2E7D32" />
                        <Text style={styles.upvoteText}>{issue.upvotes}</Text>
                      </View>
                      <Text style={styles.issueDate}>{formatDate(issue.submittedAt)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      ) : (
        /* Map View */
        <View style={styles.mapContainer}>
          <ComplaintMap
            markers={mapMarkers}
            mode="view"
            height={Dimensions.get('window').height - 200}
            showControls={true}
            showUserComplaints={false}
            showNearbyComplaints={true}
          />
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => (navigation as any).navigate('Complaint')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    marginTop: 5,
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 15,
    marginVertical: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ccc',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  issueCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  issueDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 3,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  issueDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  issueLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  categoryTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  issueStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvoteCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  upvoteText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 3,
  },
  issueDate: {
    fontSize: 12,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default IssuesScreen;
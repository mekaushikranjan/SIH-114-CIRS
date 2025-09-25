import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiService } from '../../services/apiService';

interface ProgressUpdate {
  id: string;
  assignmentId: string;
  workerId: string;
  notes: string;
  progressPercentage: number;
  photos: string[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: string;
}

interface Assignment {
  id: string;
  issueId: string;
  issue: {
    title: string;
    location: string;
    category: string;
  };
}

const WorkProgressHistoryScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { assignment } = route.params as { assignment: Assignment };
  
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchProgressHistory = async () => {
    try {
      setLoading(true);
      
      // In a real app, you'd have an API endpoint for this
      // For now, we'll use mock data
      const mockProgressUpdates: ProgressUpdate[] = [
        {
          id: '1',
          assignmentId: assignment.id,
          workerId: 'worker1',
          notes: 'Started work on the pothole repair. Assessed the damage and prepared materials.',
          progressPercentage: 25,
          photos: [],
          location: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'MG Road, Bangalore'
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        },
        {
          id: '2',
          assignmentId: assignment.id,
          workerId: 'worker1',
          notes: 'Excavated the damaged area and cleaned debris. Ready for filling.',
          progressPercentage: 50,
          photos: ['/uploads/progress/progress1.jpg'],
          location: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'MG Road, Bangalore'
          },
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        },
        {
          id: '3',
          assignmentId: assignment.id,
          workerId: 'worker1',
          notes: 'Applied asphalt mixture and compacted the surface. Almost complete.',
          progressPercentage: 85,
          photos: ['/uploads/progress/progress2.jpg', '/uploads/progress/progress3.jpg'],
          location: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'MG Road, Bangalore'
          },
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        },
      ];

      setProgressUpdates(mockProgressUpdates);
    } catch (error) {
      console.error('Error fetching progress history:', error);
      Alert.alert('Error', 'Failed to fetch progress history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProgressHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProgressHistory();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 50) return '#FF9800';
    return '#2196F3';
  };

  const renderProgressUpdate = (update: ProgressUpdate, index: number) => (
    <View key={update.id} style={styles.updateCard}>
      <View style={styles.updateHeader}>
        <View style={styles.progressIndicator}>
          <View style={[styles.progressCircle, { borderColor: getProgressColor(update.progressPercentage) }]}>
            <Text style={[styles.progressText, { color: getProgressColor(update.progressPercentage) }]}>
              {update.progressPercentage}%
            </Text>
          </View>
          {index < progressUpdates.length - 1 && <View style={styles.progressLine} />}
        </View>
        
        <View style={styles.updateContent}>
          <View style={styles.updateMeta}>
            <Text style={styles.updateTime}>{formatDate(update.createdAt)}</Text>
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={12} color="#666" />
              <Text style={styles.locationText} numberOfLines={1}>
                {update.location.address}
              </Text>
            </View>
          </View>
          
          <Text style={styles.updateNotes}>{update.notes}</Text>
          
          {update.photos.length > 0 && (
            <View style={styles.photosContainer}>
              <Text style={styles.photosLabel}>Progress Photos:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                {update.photos.map((photo, photoIndex) => (
                  <TouchableOpacity key={photoIndex} style={styles.photoContainer}>
                    <Image 
                      source={{ uri: `http://192.168.29.36:3003${photo}` }} 
                      style={styles.progressPhoto}
                      defaultSource={require('../../assets/placeholder-image.png')}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Progress History</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {assignment.issue.title}
          </Text>
        </View>
      </View>

      {/* Issue Info */}
      <View style={styles.issueInfo}>
        <View style={styles.issueDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.detailText}>{assignment.issue.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="folder" size={16} color="#666" />
            <Text style={styles.detailText}>{assignment.issue.category}</Text>
          </View>
        </View>
      </View>

      {/* Progress Timeline */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {progressUpdates.length > 0 ? (
          <>
            <Text style={styles.timelineTitle}>Work Progress Timeline</Text>
            {progressUpdates.map((update, index) => renderProgressUpdate(update, index))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No progress updates yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Progress updates will appear here as work progresses
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  issueInfo: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  issueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  updateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  updateHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  progressIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressLine: {
    width: 2,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginTop: 8,
  },
  updateContent: {
    flex: 1,
  },
  updateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  updateTime: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 150,
  },
  locationText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  updateNotes: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  photosContainer: {
    marginTop: 8,
  },
  photosLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  photosScroll: {
    marginBottom: 4,
  },
  photoContainer: {
    marginRight: 8,
  },
  progressPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
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

export default WorkProgressHistoryScreen;

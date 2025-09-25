import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../../store/store';
import WorkerHeader from '../../components/WorkerHeader';
import { apiService } from '../../services/apiService';

interface WorkHistoryItem {
  id: string;
  issueId: string;
  title: string;
  description: string;
  category: string;
  status: 'completed' | 'in_progress' | 'assigned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  assignedDate: string;
  completedDate?: string;
  rating?: number;
  feedback?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  timeSpent?: number; // in hours
}

interface WorkHistoryScreenProps {
  navigation: any;
}

const WorkHistoryScreen: React.FC<WorkHistoryScreenProps> = ({ navigation }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  
  const [workHistory, setWorkHistory] = useState<WorkHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress'>('all');

  // Removed mock data; we will load via API

  useEffect(() => {
    fetchWorkHistory();
  }, []);

  const fetchWorkHistory = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('Fetching work history for user:', user.id);
      const response = await apiService.getWorkerWorkHistory(user.id);
      if (response.success && response.data) {
        // Map to local shape if needed
        const list = (response.data as any).workHistory || response.data;
        setWorkHistory(list as WorkHistoryItem[]);
      } else {
        console.error('Work history API error:', (response as any).error);
        Alert.alert('Error', (response as any).error?.message || 'Failed to load work history');
      }
    } catch (error) {
      console.error('Error fetching work history:', error);
      Alert.alert('Error', 'Failed to load work history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      case 'assigned': return '#2196F3';
      default: return '#666';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#f44336';
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffHours = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diffHours.toFixed(1);
  };

  const filteredHistory = workHistory.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
        onPress={() => setFilter('all')}
      >
        <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
          All ({workHistory.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
        onPress={() => setFilter('completed')}
      >
        <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
          Completed ({workHistory.filter(item => item.status === 'completed').length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, filter === 'in_progress' && styles.filterButtonActive]}
        onPress={() => setFilter('in_progress')}
      >
        <Text style={[styles.filterText, filter === 'in_progress' && styles.filterTextActive]}>
          In Progress ({workHistory.filter(item => item.status === 'in_progress').length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderWorkItem = (item: WorkHistoryItem) => (
    <TouchableOpacity key={item.id} style={styles.workItem}>
      <View style={styles.workHeader}>
        <View style={styles.workTitleRow}>
          <Text style={styles.workTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.workMetaRow}>
          <View style={styles.categoryContainer}>
            <Ionicons name="folder" size={14} color="#666" />
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.workDescription} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.locationRow}>
        <Ionicons name="location" size={14} color="#666" />
        <Text style={styles.locationText} numberOfLines={1}>{item.location.address}</Text>
      </View>

      <View style={styles.workFooter}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Assigned:</Text>
          <Text style={styles.dateValue}>{formatDate(item.assignedDate)}</Text>
        </View>
        
        {item.completedDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Completed:</Text>
            <Text style={styles.dateValue}>{formatDate(item.completedDate)}</Text>
          </View>
        )}
      </View>

      {item.timeSpent && (
        <View style={styles.timeSpentRow}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.timeSpentText}>Time spent: {item.timeSpent}h</Text>
        </View>
      )}

      {item.rating && (
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>Rating: {item.rating}/5</Text>
          {item.feedback && (
            <Text style={styles.feedbackText} numberOfLines={1}>• {item.feedback}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <WorkerHeader
        title="Work History"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderFilterButtons()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading work history...</Text>
          </View>
        ) : filteredHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Work History</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'You haven\'t been assigned any work yet.'
                : `No ${filter.replace('_', ' ')} assignments found.`
              }
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {filteredHistory.map(renderWorkItem)}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: 'white',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyList: {
    gap: 12,
  },
  workItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  workHeader: {
    marginBottom: 12,
  },
  workTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  workMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  workDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  workFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    width: 80,
  },
  dateValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  timeSpentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeSpentText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 8,
  },
  feedbackText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});

export default WorkHistoryScreen;

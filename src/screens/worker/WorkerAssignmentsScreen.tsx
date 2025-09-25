import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store/store';
import { setAssignments, setLoading, setError } from '../../store/slices/workerSlice';
import WorkerHeader from '../../components/WorkerHeader';
import locationService from '../../services/locationService';
import timeTrackingService from '../../services/timeTrackingService';
import { offlineApiService } from '../../services/offlineApiService';
import { updateProfile } from '../../store/slices/authSlice';
import IssueDetailsModal from '../../components/IssueDetailsModal';
import EndWorkModal from '../../components/EndWorkModal';
import { startWorkService } from '../../services/startWorkService';

interface Assignment {
  id: string;
  issueId: string;
  workerId: string;
  status: 'assigned' | 'in-progress' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high';
  assignedAt: string;
  estimatedDuration?: number;
  issue: {
    id: string;
    title: string;
    description: string;
    location: string;
    category: string;
    reportedAt: string;
    latitude?: number;
    longitude?: number;
    reporterName?: string;
    reporterEmail?: string;
    reporterPhone?: string;
    media?: Array<{
      id: string;
      type: 'image' | 'video';
      url: string;
      filename: string;
    }>;
    priority?: string;
    status?: string;
    reportedBy?: {
      name: string;
      email: string;
      phone: string;
    };
    assignedAt?: string;
  } | null;
}

const WorkerAssignmentsScreen = ({ openIssueId }: { openIssueId?: string }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { assignments, loading } = useSelector((state: RootState) => state.worker);
  
  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'assigned' | 'in_progress'>('all');
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [issueDetailsVisible, setIssueDetailsVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [endWorkModalVisible, setEndWorkModalVisible] = useState(false);

  const fetchAssignments = async () => {
    if (!user?.id) return;

    try {
      dispatch(setLoading(true));
      // Refresh worker profile in background to sync header
      try {
        const prof = await offlineApiService.getWorkerProfile(user.id);
        if (prof.success && prof.data) {
          const w = prof.data as any;
          // Sync minimal fields used in headers
          (dispatch as any)(updateProfile({
            name: w.fullName || w.name,
            profilePicture: w.profilePicture || w.profilePhoto,
          }));
        }
      } catch {}
      
      // Use the new API service method
      const response = await offlineApiService.getWorkerAssignments(user.id);

      if (response.success && response.data) {
        console.log('📋 Raw API response:', response.data);
        
        // Transform the data to match the expected Assignment interface
        const transformedAssignments = response.data.assignments.map(assignment => {
          console.log('📋 Raw assignment data:', assignment);
          return ({
          id: assignment.id,
          issueId: assignment.issueId,
          workerId: assignment.workerId,
          status: assignment.status.replace('_', '-') as 'assigned' | 'in-progress' | 'completed' | 'on-hold',
          priority: assignment.priority as 'low' | 'medium' | 'high',
          assignedAt: assignment.assignedAt,
          estimatedDuration: assignment.estimatedDuration,
          issue: assignment.issue ? {
            id: assignment.issue.id.toString(),
            title: assignment.issue.title,
            description: assignment.issue.description,
            location: assignment.issue.location || assignment.issue.address || 'Location not available',
            category: assignment.issue.category,
            reportedAt: assignment.issue.reportedAt,
            // Add location coordinates
            latitude: assignment.issue.latitude || assignment.issue.location?.lat || 0,
            longitude: assignment.issue.longitude || assignment.issue.location?.lng || 0,
            // Add reporter information
            reporterName: assignment.issue.reporterName || assignment.issue.reportedBy?.name || 'Unknown Reporter',
            reporterEmail: assignment.issue.reporterEmail || assignment.issue.reportedBy?.email || 'Not available',
            reporterPhone: assignment.issue.reporterPhone || assignment.issue.reportedBy?.phone || 'Not available',
            // Add media fields for IssueDetailsModal
            media: (() => {
              const mediaArray = [
                // Transform images array to media objects
                ...(assignment.issue.images || []).map((url: string, index: number) => ({
                  id: `img-${index}`,
                  type: 'image' as const,
                  url: url,
                  filename: `image-${index + 1}.jpg`
                })),
                // Add videos if exist
                ...(assignment.issue.videos || []).map((url: string, index: number) => ({
                  id: `video-${index}`,
                  type: 'video' as const,
                  url: url,
                  filename: `video-${index + 1}.mp4`
                }))
              ];
              // Media array created for IssueDetailsModal
              return mediaArray;
            })(),
            priority: assignment.issue.priority || 'MEDIUM',
            status: assignment.issue.status || 'ASSIGNED',
            reportedBy: {
              name: assignment.issue.reporterName || assignment.issue.reportedBy?.name || 'Unknown Reporter',
              email: assignment.issue.reporterEmail || assignment.issue.reportedBy?.email || 'Not available',
              phone: assignment.issue.reporterPhone || assignment.issue.reportedBy?.phone || 'Not available'
            },
            assignedAt: assignment.assignedAt
          } : null
        });
        });

        // Filter out completed/resolved work - show assigned and in-progress assignments
        const activeAssignments = transformedAssignments.filter(assignment => 
          assignment.status === 'assigned' || assignment.status === 'in-progress'
        );

        setAssignmentsList(activeAssignments);
        setFilteredAssignments(activeAssignments);
        dispatch(setAssignments(activeAssignments));
      } else {
        const errorMessage = (response as any).error?.message || 'Failed to fetch assignments';
        dispatch(setError(errorMessage));
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Assignments fetch error:', error);
      dispatch(setError('Network error occurred'));
      Alert.alert('Error', 'Network error occurred');
    } finally {
      dispatch(setLoading(false));
      setRefreshing(false);
    }
  };

  const startWork = async (assignmentId: string) => {
    // Find the assignment to get the issue details
    const assignment = assignmentsList.find(a => a.id === assignmentId);
    if (!assignment || !assignment.issue) {
      Alert.alert('Error', 'Assignment not found');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Use the unified start work service
    await startWorkService.startWork({
      issueId: assignment.issueId,
      assignmentId: assignmentId,
      issueTitle: assignment.issue.title,
      userId: user.id,
      showConfirmation: false, // No confirmation for assignments page (direct action)
      onSuccess: (sessionId) => {
        console.log('✅ Work started successfully, session ID:', sessionId);
        fetchAssignments(); // Refresh the assignments list
      },
      onError: (error) => {
        console.error('❌ Failed to start work:', error);
      }
    });
  };

  const completeWork = async (assignmentId: string) => {
    try {
      // Get current location for check-out
      const currentLocation = await locationService.getCurrentLocationWithRetry(3, 2000);
      
      if (!currentLocation) {
        Alert.alert(
          'Location Required',
          'Location access is required to complete work. This helps verify work completion at the site.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => completeWork(assignmentId) }
          ]
        );
        return;
      }

      await proceedWithCompleteWork(assignmentId, currentLocation);
    } catch (error) {
      console.error('Complete work error:', error);
      Alert.alert('Error', 'Failed to complete work. Please try again.');
    }
  };

  const proceedWithCompleteWork = async (assignmentId: string, location: any) => {
    try {
      const response = await offlineApiService.completeWorkOnAssignment(
        assignmentId,
        'Work completed successfully',
        [],
        locationService.createLocationPayload(location)
      );

      if (response.success) {
        Alert.alert(
          'Work Completed',
          `Work completed successfully at ${locationService.formatLocationForDisplay(location)}`,
          [{ text: 'OK' }]
        );
        fetchAssignments(); // Refresh the list
      } else {
        Alert.alert('Error', (response as any).error?.message || 'Failed to complete work');
      }
    } catch (error) {
      console.error('Complete work API error:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };
  useEffect(() => {
    fetchAssignments();
  }, [user?.id, openIssueId]);

  useEffect(() => {
    if (openIssueId && assignmentsList.length > 0) {
      const assignment = assignmentsList.find(a => a.issueId === openIssueId);
      if (assignment) {
        console.log('Opening issue from dashboard navigation:', openIssueId);
        handleViewIssueDetails(assignment);
      }
    }
  }, [openIssueId, assignmentsList]);

  useEffect(() => {
    filterAssignments();
  }, [assignmentsList, searchQuery, selectedFilter]);
  const filterAssignments = () => {
    let filtered = assignmentsList;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === selectedFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(assignment =>
        assignment.issue?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.issue?.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.issue?.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAssignments(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
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
      case 'on_hold': return '#9C27B0';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return 'clipboard';
      case 'in_progress': return 'sync';
      case 'completed': return 'checkmark-circle';
      case 'on_hold': return 'pause-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewIssueDetails = async (assignment: Assignment) => {
    if (!assignment.issue) {
      Alert.alert('Error', 'Issue details not available');
      return;
    }

    try {
      console.log('📋 Fetching issue details for assignment:', assignment.issueId);
      
      // Call API to get full issue details
      const response = await offlineApiService.getIssueDetails(assignment.issueId);
      
      if (response.success && response.data) {
        // Transform the data to match our modal interface
        const issue = response.data as any;
        console.log('📋 API Response data:', issue);
        
        console.log('🗺️ Location debugging - issue.location:', issue.location);
        
        const issueData = {
          id: issue.id,
          title: issue.title || assignment.issue.title,
          description: issue.description || assignment.issue.description,
          category: issue.category || assignment.issue.category,
          priority: assignment.priority.toUpperCase(),
          status: assignment.status.toUpperCase(),
          location: {
            latitude: issue.location?.lat || issue.location?.latitude || issue.latitude || (assignment.issue as any).coordinates?.latitude || 0,
            longitude: issue.location?.lng || issue.location?.longitude || issue.longitude || (assignment.issue as any).coordinates?.longitude || 0,
            address: issue.location?.address || issue.address || assignment.issue.location || 'Location not available',
          },
          media: assignment.issue.media || issue.attachments || issue.media || issue.images || [],
          reportedBy: {
            name: issue.reporterName || issue.reportedBy?.name || issue.user?.name || issue.user?.fullName || 'Unknown Reporter',
            email: issue.reporterEmail || issue.reportedBy?.email || issue.user?.email || 'Not available',
            phone: issue.reporterPhone || issue.reportedBy?.phone || issue.user?.phoneNumber || 'Not available',
          },
          reportedAt: issue.createdAt || issue.reportedAt || assignment.issue.reportedAt,
          assignedAt: assignment.assignedAt,
          estimatedResolution: issue.estimatedResolution,
        };
        
        console.log('📋 Transformed issue data - location:', issueData.location);
        setSelectedIssue(issueData);
        setIssueDetailsVisible(true);
      } else {
        console.warn('API failed, using enhanced assignment data as fallback');
        console.log('📋 Assignment data:', assignment);
        
        // Enhanced fallback: Try to extract better data from assignment
        const fallbackIssueData = {
          id: assignment.issueId,
          title: assignment.issue.title,
          description: assignment.issue.description,
          category: assignment.issue.category,
          priority: assignment.priority.toUpperCase(),
          status: assignment.status.toUpperCase(),
          location: {
            // Try to parse location if it's a string with coordinates
            latitude: assignment.issue.latitude || (assignment.issue as any).coordinates?.latitude || 0,
            longitude: assignment.issue.longitude || (assignment.issue as any).coordinates?.longitude || 0,
            address: assignment.issue.location || 'Location not available',
          },
          media: assignment.issue.media || [],
          reportedBy: {
            name: assignment.issue.reportedBy?.name || assignment.issue.reporterName || 'Unknown Reporter',
            email: assignment.issue.reportedBy?.email || assignment.issue.reporterEmail || 'Not available',
            phone: assignment.issue.reportedBy?.phone || assignment.issue.reporterPhone || 'Not available',
          },
          reportedAt: assignment.issue.reportedAt,
          assignedAt: assignment.assignedAt,
          estimatedResolution: null,
        };
        
        console.log('📋 Enhanced fallback data:', fallbackIssueData);
        setSelectedIssue(fallbackIssueData);
        setIssueDetailsVisible(true);
      }
    } catch (error) {
      console.error('Error fetching issue details:', error);
      // Enhanced fallback: Use assignment data with better extraction
      const fallbackIssueData = {
        id: assignment.issueId,
        title: assignment.issue.title,
        description: assignment.issue.description,
        category: assignment.issue.category,
        priority: assignment.priority.toUpperCase(),
        status: assignment.status.toUpperCase(),
        location: {
          latitude: assignment.issue.latitude || 0,
          longitude: assignment.issue.longitude || 0,
          address: assignment.issue.location || 'Location not available',
        },
        media: assignment.issue.media || [],
        reportedBy: {
          name: assignment.issue.reportedBy?.name || assignment.issue.reporterName || 'Unknown Reporter',
          email: assignment.issue.reportedBy?.email || assignment.issue.reporterEmail || 'Not available',
          phone: assignment.issue.reportedBy?.phone || assignment.issue.reporterPhone || 'Not available',
        },
        reportedAt: assignment.issue.reportedAt,
        assignedAt: assignment.assignedAt,
        estimatedResolution: null,
      };
      
      console.log('📋 Error fallback data:', fallbackIssueData);
      setSelectedIssue(fallbackIssueData);
      setIssueDetailsVisible(true);
    }
  };

  const handleStartWorkFromModal = async (issueId: string) => {
    setIssueDetailsVisible(false);
    // Find the assignment with this issue ID
    const assignment = assignmentsList.find(a => a.issueId === issueId);
    if (assignment) {
      await startWork(assignment.id);
    }
  };

  const handleCompleteWork = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEndWorkModalVisible(true);
  };

  const handleWorkCompleted = () => {
    fetchAssignments(); // Refresh assignments after work completion
    setEndWorkModalVisible(false);
  };

  const renderAssignmentCard = (assignment: Assignment) => {
    return (
    <View key={assignment.id} style={styles.assignmentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.statusBadge}>
          <Ionicons 
            name={getStatusIcon(assignment.status) as any} 
            size={14} 
            color={getStatusColor(assignment.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(assignment.status) }]}>
            {assignment.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(assignment.priority)}20` }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(assignment.priority) }]}>
            {assignment.priority.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.issueTitle}>{assignment.issue?.title || 'Issue Title'}</Text>
      <Text style={styles.issueDescription} numberOfLines={2}>
        {assignment.issue?.description || 'No description available'}
      </Text>

      <View style={styles.issueDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={14} color="#666" />
          <Text style={styles.detailText}>{assignment.issue?.location || 'Location'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="folder" size={14} color="#666" />
          <Text style={styles.detailText}>{assignment.issue?.category || 'Category'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.detailText}>Assigned: {formatDate(assignment.assignedAt)}</Text>
        </View>
        {assignment.estimatedDuration && (
          <View style={styles.detailRow}>
            <Ionicons name="hourglass" size={14} color="#666" />
            <Text style={styles.detailText}>Est. Duration: {assignment.estimatedDuration}h</Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        {assignment.status === 'assigned' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.startButton]}
            onPress={() => startWork(assignment.id)}
          >
            <Ionicons name="play" size={16} color="white" />
            <Text style={styles.actionButtonText}>Start Work</Text>
          </TouchableOpacity>
        )}
        
        {assignment.status === 'in-progress' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleCompleteWork(assignment)}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.detailsButton]}
          onPress={() => handleViewIssueDetails(assignment)}
        >
          <Ionicons name="eye" size={16} color="#FF6B35" />
          <Text style={[styles.actionButtonText, { color: '#FF6B35' }]}>View Details</Text>
        </TouchableOpacity>

      </View>
    </View>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <WorkerHeader
        title="My Assignments"
        subtitle={`${assignmentsList.length} active assignments`}
      />

      {/* Assignments List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchAssignments} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map(renderAssignmentCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No assignments found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter' 
                : 'You have no assignments at the moment'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Issue Details Modal */}
      <IssueDetailsModal
        visible={issueDetailsVisible}
        issue={selectedIssue}
        onClose={() => setIssueDetailsVisible(false)}
        onStartWork={handleStartWorkFromModal}
      />

      {/* End Work Modal */}
      <EndWorkModal
        visible={endWorkModalVisible}
        workerId={user?.id || ''}
        issueId={selectedAssignment?.issueId || ''}
        onClose={() => setEndWorkModalVisible(false)}
        onWorkCompleted={handleWorkCompleted}
      />
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
    paddingTop: 8,
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#FF6B35',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  assignmentCard: {
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
  issueDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  issueDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  progressButton: {
    backgroundColor: '#FF9800',
  },
  completeButton: {
    backgroundColor: '#2196F3',
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  historyButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default WorkerAssignmentsScreen;

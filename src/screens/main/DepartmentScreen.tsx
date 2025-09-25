import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { upvoteIssue } from '../../store/slices/issuesSlice';

const DepartmentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { department } = route.params as { department: string };
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  
  const issues = useSelector((state: RootState) => state.issues.issues);

  // Mock data for department issues
  const [departmentIssues, setDepartmentIssues] = useState([
    {
      id: '1',
      title: 'Large pothole on Main Street',
      description: 'Deep pothole causing vehicle damage near City Center',
      category: 'Potholes',
      location: {
        latitude: 23.3441,
        longitude: 85.3096,
        address: 'Main Street, Ranchi',
      },
      media: [],
      status: 'acknowledged',
      upvotes: 15,
      submittedBy: 'user1',
      submittedAt: '2024-01-10T10:00:00Z',
      department: 'Potholes',
      deadline: '2024-01-25T00:00:00Z',
    },
    {
      id: '2',
      title: 'Garbage pile near school',
      description: 'Accumulated garbage creating health hazard',
      category: 'Garbage',
      location: {
        latitude: 23.3441,
        longitude: 85.3096,
        address: 'School Road, Ranchi',
      },
      media: [],
      status: 'in_progress',
      upvotes: 8,
      submittedBy: 'user2',
      submittedAt: '2024-01-12T14:30:00Z',
      department: 'Garbage',
      deadline: '2024-01-20T00:00:00Z',
    },
  ]);

  const filteredIssues = departmentIssues.filter(issue => {
    if (filter === 'all') return issue.department === department;
    return issue.department === department && issue.status === filter;
  });

  const handleUpvote = (issueId: string) => {
    setDepartmentIssues(prev => 
      prev.map(issue => 
        issue.id === issueId 
          ? { ...issue, upvotes: issue.upvotes + 1 }
          : issue
      )
    );
    dispatch(upvoteIssue(issueId));
  };

  const handleTrackIssue = (issueId: string) => {
    // Navigate to public issues view for community viewing
    (navigation as any).navigate('PublicIssues');
  };

  const handleViewAllIssues = () => {
    // Navigate to the Issues tab in the bottom navigator
    (navigation as any).navigate('Issues', { screen: 'IssuesMain' });
  };

  const handleViewMyIssues = () => {
    (navigation as any).navigate('Reports');
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

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
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{department} Issues</Text>
        <Text style={styles.headerSubtitle}>
          {filteredIssues.length} acknowledged issues
        </Text>
        
        {/* Navigation Buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleViewMyIssues}
          >
            <Ionicons name="person-outline" size={16} color="#fff" />
            <Text style={styles.headerButtonText}>My Issues</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleViewAllIssues}
          >
            <Ionicons name="list-outline" size={16} color="#fff" />
            <Text style={styles.headerButtonText}>All Issues</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'acknowledged', 'assigned', 'in_progress', 'completed'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filter === status && styles.filterTabActive,
            ]}
            onPress={() => setFilter(status)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === status && styles.filterTabTextActive,
              ]}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredIssues.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={60} color="#ccc" />
            <Text style={styles.emptyStateText}>No issues found</Text>
            <Text style={styles.emptyStateSubtext}>
              No {filter === 'all' ? '' : filter} issues in this department
            </Text>
          </View>
        ) : (
          filteredIssues.map((issue) => (
            <TouchableOpacity 
              key={issue.id} 
              style={styles.issueCard}
              onPress={() => handleTrackIssue(issue.id)}
            >
              <View style={styles.issueHeader}>
                <View style={styles.statusBadge}>
                  <Ionicons
                    name={getStatusIcon(issue.status) as any}
                    size={16}
                    color={getStatusColor(issue.status)}
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(issue.status) }]}>
                    {issue.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.issueDate}>{formatDate(issue.submittedAt)}</Text>
              </View>

              <Text style={styles.issueTitle}>{issue.title}</Text>
              <Text style={styles.issueDescription} numberOfLines={2}>
                {issue.description}
              </Text>

              <View style={styles.issueLocation}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.locationText}>{issue.location.address}</Text>
              </View>

              {issue.deadline && (
                <View style={styles.deadline}>
                  <Ionicons name="time-outline" size={16} color="#FF5722" />
                  <Text style={styles.deadlineText}>
                    Deadline: {formatDate(issue.deadline)}
                  </Text>
                </View>
              )}

              <View style={styles.issueActions}>
                <TouchableOpacity
                  style={styles.upvoteButton}
                  onPress={() => handleUpvote(issue.id)}
                >
                  <Ionicons name="arrow-up" size={20} color="#2E7D32" />
                  <Text style={styles.upvoteText}>{issue.upvotes}</Text>
                </TouchableOpacity>

                <View style={styles.issueInfo}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>Reported by citizen</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    paddingTop: 50,
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
  headerActions: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterTabActive: {
    backgroundColor: '#2E7D32',
  },
  filterTabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 15,
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
  issueDate: {
    fontSize: 12,
    color: '#666',
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
  deadline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deadlineText: {
    fontSize: 12,
    color: '#FF5722',
    marginLeft: 5,
    fontWeight: '600',
  },
  issueActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  upvoteText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 5,
  },
  issueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
});

export default DepartmentScreen;

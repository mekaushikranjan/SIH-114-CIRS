import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { apiService, Issue } from '../../services/apiService';

const ReportsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [userIssues, setUserIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user issues with detailed information
      const issuesResponse = await apiService.getUserIssues({
        page: 1,
        limit: 100
      });
      
      if (issuesResponse.success && issuesResponse.data) {
        // Transform and enrich the issues data
        const enrichedIssues = issuesResponse.data.issues.map((issue: any) => ({
          ...issue,
          // Ensure we have proper category information
          category: issue.category || 'General',
          categoryIcon: getCategoryIcon(issue.category),
          // Parse location if it's a string
          location: typeof issue.location === 'string' 
            ? JSON.parse(issue.location) 
            : issue.location || { address: 'Location not specified' },
          // Ensure arrays for images
          imageUrls: issue.imageUrls || [],
          // Calculate days since reported
          daysSinceReported: Math.floor((new Date().getTime() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }));
        
        setUserIssues(enrichedIssues);
      } else {
        setError('Failed to load your issues');
      }

    } catch (err) {
      console.error('Error loading user issues:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    const categoryIcons: { [key: string]: string } = {
      'Road Maintenance': 'car-outline',
      'Water Supply': 'water-outline',
      'Electricity': 'flash-outline',
      'Garbage Collection': 'trash-outline',
      'Street Lighting': 'bulb-outline',
      'Drainage': 'water-outline',
      'Public Transport': 'bus-outline',
      'Parks & Recreation': 'leaf-outline',
      'Public Safety': 'shield-outline',
      'Healthcare': 'medical-outline',
      'Education': 'school-outline',
      'General': 'help-circle-outline'
    };
    return categoryIcons[category] || 'help-circle-outline';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return '#D32F2F';
      case 'HIGH': return '#F57C00';
      case 'MEDIUM': return '#1976D2';
      case 'LOW': return '#388E3C';
      default: return '#757575';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return `🔴 ${t('reports.priority.critical')}`;
      case 'HIGH': return `🟠 ${t('reports.priority.high')}`;
      case 'MEDIUM': return `🔵 ${t('reports.priority.medium')}`;
      case 'LOW': return `🟢 ${t('reports.priority.low')}`;
      default: return `⚪ ${t('reports.priority.unknown')}`;
    }
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

  const handleTrackIssue = (issueId: string) => {
    (navigation as any).navigate('TrackIssue', { issueId });
  };


  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF5722" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>{t('reports.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('reports.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {userIssues.length} {userIssues.length === 1 ? t('reports.issue') : t('reports.issues')} {t('reports.subtitle')}
          </Text>
        </View>

        {/* Issues List */}
        <View style={styles.section}>
          {userIssues.length > 0 ? (
            userIssues.map((issue) => (
              <TouchableOpacity
                key={issue.id}
                style={[
                  styles.issueCard,
                  { borderLeftColor: getPriorityColor(issue.priority) }
                ]}
                onPress={() => handleTrackIssue(issue.id)}
              >
                {/* Card Header with Status and Priority */}
                <View style={styles.issueHeader}>
                  <View style={styles.headerLeft}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) + '15' }]}>
                      <Ionicons
                        name={getStatusIcon(issue.status) as any}
                        size={14}
                        color={getStatusColor(issue.status)}
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(issue.status) }]}>
                        {t(`reports.status.${issue.status}`) || issue.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.priorityBadge}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(issue.priority) }]}>
                        {getPriorityLabel(issue.priority)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.issueDate}>
                    {(issue as any).daysSinceReported === 0 ? 'Today' : 
                     (issue as any).daysSinceReported === 1 ? 'Yesterday' : 
                     `${(issue as any).daysSinceReported} days ago`}
                  </Text>
                </View>

                {/* Issue Title with Category Icon */}
                <View style={styles.titleRow}>
                  <View style={styles.categoryIconContainer}>
                    <Ionicons
                      name={getCategoryIcon(issue.category) as any}
                      size={20}
                      color="#2E7D32"
                    />
                  </View>
                  <Text style={styles.issueTitle} numberOfLines={2}>
                    {(issue as any).title || issue.description}
                  </Text>
                </View>

                {/* Location */}
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {issue.location?.address || 'Location not specified'}
                  </Text>
                </View>

                {/* Images Preview */}
                {(issue as any).imageUrls && (issue as any).imageUrls.length > 0 && (
                  <View style={styles.imagesPreview}>
                    <Ionicons name="images-outline" size={14} color="#666" />
                    <Text style={styles.imagesText}>
                      {(issue as any).imageUrls.length} {(issue as any).imageUrls.length === 1 ? 'photo' : 'photos'}
                    </Text>
                  </View>
                )}

                {/* Footer with Category and Actions */}
                <View style={styles.issueFooter}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{issue.category}</Text>
                  </View>
                  <View style={styles.issueStats}>
                    {(issue as any).rating && (
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>{(issue as any).rating}</Text>
                      </View>
                    )}
                    <View style={styles.upvoteCount}>
                      <Ionicons name="arrow-up" size={14} color="#2E7D32" />
                      <Text style={styles.upvoteText}>{issue.upvotes || 0}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>{t('reports.noIssues')}</Text>
              <Text style={styles.emptyStateSubtext}>{t('reports.noIssuesMessage')}</Text>
              <TouchableOpacity 
                style={styles.reportButton}
                onPress={() => (navigation as any).navigate('ReportIssue')}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.reportButtonText}>{t('reports.reportFirstIssue')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF5722',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  reportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
  },
  issueCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  issueDate: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  imagesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagesText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginRight: 10,
  },
  upvoteText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 3,
  },
});

export default ReportsScreen;

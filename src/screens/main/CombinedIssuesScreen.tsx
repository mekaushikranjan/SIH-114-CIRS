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
  location: { 
    address: string;
    lat?: number;
    lng?: number;
  };
  status: string;
  upvotes: number;
  submittedAt: string;
  distance?: string;
}

const CombinedIssuesScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('issues');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [wordCloudData, setWordCloudData] = useState<Array<{word: string, count: number, size: number}>>([]);
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
          location: { 
            address: apiIssue.location?.address || 'Unknown Location',
            latitude: apiIssue.location?.latitude,
            longitude: apiIssue.location?.longitude
          },
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

  // Fetch word cloud data from backend
  const fetchWordCloudData = async () => {
    try {
      const response = await apiService.getIssueAnalytics();
      if (response.success && response.data) {
        // Transform backend data to word cloud format
        const wordData = response.data.categoryStats?.map((stat: any) => ({
          word: stat.category,
          count: stat.count,
          size: Math.min(24, Math.max(10, stat.count / 10))
        })) || [];
        setWordCloudData(wordData);
      }
    } catch (error) {
      console.error('Error fetching word cloud data:', error);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchWordCloudData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchIssues(), fetchWordCloudData()]);
    setRefreshing(false);
  };


  const filteredIssues = issues.filter(issue => {
    const matchesSearch = (issue.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (issue.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (issue.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Get popular issues sorted by upvotes
  const getPopularIssues = () => {
    return [...issues].sort((a, b) => b.upvotes - a.upvotes).slice(0, 10);
  };

  // Get trending topics from categories
  const trendingTopics = categories.map((category: any) => ({
    topic: category.name || category,
    issues: issues.filter(issue => issue.category === (category.name || category)).length,
    trend: 'stable' as const
  })).sort((a, b) => b.issues - a.issues).slice(0, 5);

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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#4CAF50';
      case 'down': return '#f44336';
      default: return '#666';
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
    // Handle issue press within the same screen - could show more details or just upvote
    console.log('Issue pressed:', issueId);
    // For now, we'll just focus on upvoting functionality within this screen
    // If you want to show more details, you could expand the card or show a modal
  };

  const handleViewCommunityIssues = () => {
    // Navigate to the dedicated community issues page with upvoting
    (navigation as any).navigate('PublicIssues');
  };

  const handleUpvote = (issueId: string) => {
    const hasUpvoted = userUpvotes.has(issueId);
    
    setIssues(prevIssues => 
      prevIssues.map(issue => 
        issue.id === issueId 
          ? { ...issue, upvotes: hasUpvoted ? issue.upvotes - 1 : issue.upvotes + 1 }
          : issue
      )
    );
    
    setUserUpvotes(prev => {
      const newSet = new Set(prev);
      if (hasUpvoted) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'map' : 'list');
  };

  // Transform issues for map markers
  const mapMarkers = issues
    .filter(issue => issue.location?.lat && issue.location?.lng) // Only include issues with valid coordinates
    .map((issue) => ({
      id: issue.id,
      coordinate: {
        latitude: issue.location.lat,
        longitude: issue.location.lng,
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
            {viewMode === 'list' ? 'Civic Issues & Community' : 'Issues Map'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {viewMode === 'list' ? 'Browse issues and community insights' : 'View issues on map'}
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

      {/* Tab Navigation - only show in list view */}
      {viewMode === 'list' && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'issues' && styles.tabActive]}
            onPress={() => setSelectedTab('issues')}
          >
            <Text style={[styles.tabText, selectedTab === 'issues' && styles.tabTextActive]}>
              All Issues
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'popular' && styles.tabActive]}
            onPress={() => setSelectedTab('popular')}
          >
            <Text style={[styles.tabText, selectedTab === 'popular' && styles.tabTextActive]}>
              Popular
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'insights' && styles.tabActive]}
            onPress={() => setSelectedTab('insights')}
          >
            <Text style={[styles.tabText, selectedTab === 'insights' && styles.tabTextActive]}>
              AI Insights
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar - only show in list view */}
      {viewMode === 'list' && selectedTab === 'issues' && (
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
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
        {selectedTab === 'issues' ? (
          <>
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
                      <View style={styles.issueDistance}>
                        <Ionicons name="location-outline" size={12} color="#666" />
                        <Text style={styles.distanceText}>{issue.distance}</Text>
                      </View>
                    </View>

                    <Text style={styles.issueTitle}>{issue.title}</Text>
                    <Text style={styles.issueDescription} numberOfLines={2}>
                      {issue.description}
                    </Text>

                    <View style={styles.issueFooter}>
                      <View style={styles.issueLocation}>
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text style={styles.locationText}>{issue.location.address}</Text>
                      </View>
                      <View style={styles.issueStats}>
                        <TouchableOpacity 
                          style={[styles.upvoteContainer, userUpvotes.has(issue.id) && styles.upvoteContainerActive]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleUpvote(issue.id);
                          }}
                        >
                          <Ionicons 
                            name={userUpvotes.has(issue.id) ? "arrow-up" : "arrow-up-outline"} 
                            size={16} 
                            color={userUpvotes.has(issue.id) ? "#2E7D32" : "#666"} 
                          />
                          <Text style={[styles.upvoteText, userUpvotes.has(issue.id) && styles.upvoteTextActive]}>
                            {issue.upvotes}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.issueDate}>{formatDate(issue.submittedAt)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        ) : selectedTab === 'popular' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Most Upvoted Issues</Text>
              {getPopularIssues().map((issue, index) => (
                <View key={issue.id} style={styles.popularIssueCard}>
                  <View style={styles.issueRank}>
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                  </View>
                  
                  <View style={styles.issueContent}>
                    <View style={styles.issueHeader}>
                      <Text style={styles.issueTitle} numberOfLines={1}>
                        {issue.title}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
                        <Text style={styles.statusTextWhite}>
                          {issue.status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.issueDetails}>
                      <View style={styles.issueLocation}>
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text style={styles.locationText}>{issue.location.address}</Text>
                      </View>
                      <Text style={styles.issueDate}>{formatDate(issue.submittedAt)}</Text>
                    </View>
                    
                    <View style={styles.issueFooter}>
                      <View style={styles.categoryTag}>
                        <Text style={styles.categoryText}>{issue.category}</Text>
                      </View>
                      <View style={styles.upvoteCount}>
                        <Ionicons name="arrow-up" size={16} color="#2E7D32" />
                        <Text style={styles.upvoteText}>{issue.upvotes}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Word Cloud Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Issue Categories Word Cloud</Text>
              <View style={styles.wordCloudContainer}>
                {wordCloudData.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.wordCloudItem,
                      {
                        backgroundColor: `hsl(${120 + (index * 20) % 240}, 70%, ${85 + (index % 3) * 5}%)`,
                      },
                    ]}
                  >
                    <Text style={[styles.wordCloudText, { fontSize: item.size }]}>
                      {item.word}
                    </Text>
                    <Text style={styles.wordCloudCount}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Trending Topics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trending Topics</Text>
              {trendingTopics.map((topic, index) => (
                <View key={index} style={styles.trendingCard}>
                  <View style={styles.trendingContent}>
                    <Text style={styles.trendingTopic}>{topic.topic}</Text>
                    <Text style={styles.trendingCount}>{topic.issues} issues</Text>
                  </View>
                  <View style={styles.trendingIndicator}>
                    <Ionicons
                      name={getTrendIcon(topic.trend) as any}
                      size={20}
                      color={getTrendColor(topic.trend)}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Statistics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Community Statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="people-outline" size={24} color="#2E7D32" />
                  <Text style={styles.statNumber}>2,847</Text>
                  <Text style={styles.statLabel}>Active Citizens</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="document-text-outline" size={24} color="#FF9800" />
                  <Text style={styles.statNumber}>1,234</Text>
                  <Text style={styles.statLabel}>Total Issues</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-done-outline" size={24} color="#4CAF50" />
                  <Text style={styles.statNumber}>892</Text>
                  <Text style={styles.statLabel}>Resolved</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="time-outline" size={24} color="#2196F3" />
                  <Text style={styles.statNumber}>5.2</Text>
                  <Text style={styles.statLabel}>Avg Days</Text>
                </View>
              </View>
            </View>
          </>
        )}
        </ScrollView>
      ) : (
        /* Map View */
        <View style={styles.mapContainer}>
          <ComplaintMap
            markers={mapMarkers}
            mode="view"
            height={Dimensions.get('window').height - 120}
            showControls={true}
            showUserComplaints={false}
            showNearbyComplaints={true}
          />
        </View>
      )}

      {/* Floating Action Button - only show in list view */}
      {viewMode === 'list' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => (navigation as any).navigate('Complaint')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
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
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
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
    marginHorizontal: 0,
    marginVertical: 0,
    padding: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2E7D32',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#2E7D32',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
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
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontWeight: '500',
  },
  issueCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  popularIssueCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  issueRank: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  issueContent: {
    flex: 1,
    marginLeft: 10,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    flex: 1,
  },
  issueDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
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
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusTextWhite: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
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
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 3,
  },
  issueStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  upvoteContainerActive: {
    backgroundColor: '#E8F5E8',
  },
  upvoteText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 3,
  },
  upvoteTextActive: {
    color: '#2E7D32',
  },
  issueDate: {
    fontSize: 12,
    color: '#666',
  },
  issueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  upvoteCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordCloudContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  wordCloudItem: {
    margin: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    alignItems: 'center',
  },
  wordCloudText: {
    fontWeight: 'bold',
    color: '#333',
  },
  wordCloudCount: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  trendingCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  trendingContent: {
    flex: 1,
  },
  trendingTopic: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  trendingCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  trendingIndicator: {
    padding: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    width: (width - 45) / 2,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
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
  scrollContent: {
    paddingBottom: 80, // Add padding to show above bottom navigation
  },
});

export default CombinedIssuesScreen;

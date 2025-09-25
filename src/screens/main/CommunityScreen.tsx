import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const { width } = Dimensions.get('window');

const CommunityScreen = () => {
  const [selectedTab, setSelectedTab] = useState('popular');
  
  // Mock data for word cloud insights
  const wordCloudData = [
    { word: 'Potholes', count: 45, size: 24 },
    { word: 'Garbage', count: 38, size: 20 },
    { word: 'Street Lights', count: 32, size: 18 },
    { word: 'Drainage', count: 28, size: 16 },
    { word: 'Water Supply', count: 25, size: 15 },
    { word: 'Sanitation', count: 22, size: 14 },
    { word: 'Traffic', count: 18, size: 13 },
    { word: 'Parks', count: 15, size: 12 },
    { word: 'Roads', count: 12, size: 11 },
    { word: 'Noise', count: 10, size: 10 },
  ];

  // Mock popular issues
  const popularIssues = [
    {
      id: '1',
      title: 'Major pothole on Ring Road',
      category: 'Potholes',
      upvotes: 156,
      status: 'in_progress',
      location: 'Ring Road, Ranchi',
      submittedAt: '2024-01-08T10:00:00Z',
    },
    {
      id: '2',
      title: 'Overflowing garbage bins near market',
      category: 'Garbage',
      upvotes: 134,
      status: 'acknowledged',
      location: 'Main Market, Ranchi',
      submittedAt: '2024-01-10T14:30:00Z',
    },
    {
      id: '3',
      title: 'Non-functional street lights',
      category: 'Street Lights',
      upvotes: 98,
      status: 'assigned',
      location: 'College Road, Ranchi',
      submittedAt: '2024-01-12T09:15:00Z',
    },
    {
      id: '4',
      title: 'Blocked drainage causing waterlogging',
      category: 'Drainage',
      upvotes: 87,
      status: 'acknowledged',
      location: 'Station Road, Ranchi',
      submittedAt: '2024-01-09T16:45:00Z',
    },
  ];

  // Mock trending topics
  const trendingTopics = [
    { topic: 'Road Maintenance', issues: 23, trend: 'up' },
    { topic: 'Waste Management', issues: 19, trend: 'up' },
    { topic: 'Public Safety', issues: 15, trend: 'down' },
    { topic: 'Water Issues', issues: 12, trend: 'up' },
    { topic: 'Traffic Problems', issues: 8, trend: 'stable' },
  ];

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
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
        <Text style={styles.headerTitle}>Community Insights</Text>
        <Text style={styles.headerSubtitle}>AI-powered civic issue analytics</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'popular' && styles.tabActive]}
          onPress={() => setSelectedTab('popular')}
        >
          <Text style={[styles.tabText, selectedTab === 'popular' && styles.tabTextActive]}>
            Popular Issues
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'popular' ? (
          <>
            {/* Popular Issues */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Most Upvoted Issues</Text>
              {popularIssues.map((issue, index) => (
                <View key={issue.id} style={styles.issueCard}>
                  <View style={styles.issueRank}>
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                  </View>
                  
                  <View style={styles.issueContent}>
                    <View style={styles.issueHeader}>
                      <Text style={styles.issueTitle} numberOfLines={1}>
                        {issue.title}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
                        <Text style={styles.statusText}>
                          {issue.status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.issueDetails}>
                      <View style={styles.issueLocation}>
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text style={styles.locationText}>{issue.location}</Text>
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
  issueCard: {
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
    marginBottom: 5,
  },
  issueTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  issueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  issueDate: {
    fontSize: 12,
    color: '#666',
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  upvoteText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 3,
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
});

export default CommunityScreen;

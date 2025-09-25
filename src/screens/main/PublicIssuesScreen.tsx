import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  StatusBar,
  SafeAreaView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/apiService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useTranslation } from 'react-i18next';

interface PublicIssue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location: any;
  imageUrls: string[];
  beforeImages?: string[];
  afterImages?: string[];
  workerComments?: string;
  createdAt: string;
  categoryName: string;
  departmentName: string;
  upvoteCount: number;
}

interface PopularIssue extends PublicIssue {}

const PublicIssuesScreen: React.FC = () => {
  const { t } = useTranslation();
  const [issues, setIssues] = useState<PublicIssue[]>([]);
  const [popularIssues, setPopularIssues] = useState<PopularIssue[]>([]);
  const [completedIssues, setCompletedIssues] = useState<PublicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upvoteStatuses, setUpvoteStatuses] = useState<{[key: string]: boolean}>({});
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'completed'>('all');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    sort: 'recent' as 'recent' | 'popular' | 'oldest'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  const loadIssues = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      const response = await apiService.getPublicIssues({
        page: isRefresh ? 1 : page,
        limit: 20,
        ...filters,
        // Only show issues that are acknowledged, in progress, or assigned
        excludeStatuses: ['REPORTED', 'RESOLVED']
      });

      if (response.success && response.data) {
        const newIssues = response.data.issues;
        
        if (isRefresh) {
          setIssues(newIssues);
        } else {
          setIssues(prev => page === 1 ? newIssues : [...prev, ...newIssues]);
        }
        
        setHasMore(newIssues.length === 20);
        
        // Load upvote statuses if user is authenticated
        if (user && newIssues.length > 0) {
          const issueIds = newIssues.map((issue: PublicIssue) => issue.id);
          const statusResponse = await apiService.getUpvoteStatus(issueIds);
          if (statusResponse.success) {
            setUpvoteStatuses(prev => ({ ...prev, ...statusResponse.data }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading issues:', error);
      Alert.alert(t('common.error'), t('issues.failedToLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, page, user]);

  const loadPopularIssues = useCallback(async () => {
    try {
      const response = await apiService.getPopularIssues();
      if (response.success && response.data) {
        // Exclude resolved issues from trending/popular list
        const filtered = (response.data.issues || []).filter(
          (issue: PopularIssue) => issue.status?.toLowerCase() !== 'resolved'
        );
        setPopularIssues(filtered);
        
        // Load upvote statuses for popular issues
        if (user && filtered.length > 0) {
          const issueIds = filtered.map((issue: PopularIssue) => issue.id);
          const statusResponse = await apiService.getUpvoteStatus(issueIds);
          if (statusResponse.success) {
            setUpvoteStatuses(prev => ({ ...prev, ...statusResponse.data }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading popular issues:', error);
    }
  }, [user]);

  const loadCompletedIssues = useCallback(async () => {
    try {
      const response = await apiService.getPublicIssues({
        status: 'RESOLVED',
        sort: 'recent',
        limit: 50
      });
      
      if (response.success && response.data) {
        setCompletedIssues(response.data.issues);
        
        // Load upvote statuses for completed issues
        if (user && response.data.issues.length > 0) {
          const issueIds = response.data.issues.map((issue: PublicIssue) => issue.id);
          const statusResponse = await apiService.getUpvoteStatus(issueIds);
          if (statusResponse.success) {
            setUpvoteStatuses(prev => ({ ...prev, ...statusResponse.data }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading completed issues:', error);
    }
  }, [user]);

  const handleUpvote = async (issueId: string) => {
    if (!user) {
      Alert.alert(t('issues.loginRequired'), t('issues.pleaseLoginToUpvote'));
      return;
    }

    try {
      const response = await apiService.upvoteIssue(issueId);
      if (response.success) {
        const newStatus = response.data.upvoted;
        setUpvoteStatuses(prev => ({ ...prev, [issueId]: newStatus }));
        
        // Update upvote count in the issues list
        setIssues(prev => prev.map(issue => {
          if (issue.id === issueId) {
            return {
              ...issue,
              upvoteCount: newStatus ? issue.upvoteCount + 1 : issue.upvoteCount - 1
            };
          }
          return issue;
        }));
        
        // Update popular issues as well
        setPopularIssues(prev => prev.map(issue => {
          if (issue.id === issueId) {
            return {
              ...issue,
              upvoteCount: newStatus ? issue.upvoteCount + 1 : issue.upvoteCount - 1
            };
          }
          return issue;
        }));
      }
    } catch (error) {
      console.error('Error upvoting issue:', error);
      Alert.alert(t('common.error'), t('issues.failedToUpvote'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'reported': return '#FF9800';
      case 'in_progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#757575';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const parseLocation = (location: any) => {
    if (typeof location === 'string') {
      try {
        const parsed = JSON.parse(location);
        return parsed.address || 'Location not specified';
      } catch {
        return location;
      }
    }
    return location?.address || 'Location not specified';
  };

  useEffect(() => {
    loadIssues();
    loadPopularIssues();
    loadCompletedIssues();
  }, []);

  useEffect(() => {
    if (page > 1) {
      loadIssues();
    }
  }, [page]);

  const renderCompletedIssueCard = (issue: PublicIssue) => (
    <View key={issue.id} style={styles.completedIssueCard}>
      {/* Issue Header */}
      <View style={styles.issueHeader}>
        <View style={styles.issueInfo}>
          <Text style={styles.issueTitle} numberOfLines={2}>
            {issue.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.completedBadge}>
              <View style={styles.completedIconContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              </View>
              <Text style={styles.completedText}>{t('issues.completed')}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(issue.priority) }]}>
              <Text style={styles.priorityText}>{issue.priority}</Text>
            </View>
          </View>
        </View>
        
        {/* Upvote Button */}
        <TouchableOpacity
          style={[styles.enhancedUpvoteButton, upvoteStatuses[issue.id] && styles.enhancedUpvoteButtonActive]}
          onPress={() => handleUpvote(issue.id)}
        >
          <Ionicons
            name={upvoteStatuses[issue.id] ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
            size={22}
            color={upvoteStatuses[issue.id] ? '#fff' : '#FF6B6B'}
          />
          <Text style={[styles.enhancedUpvoteCount, upvoteStatuses[issue.id] && styles.enhancedUpvoteCountActive]}>
            {issue.upvoteCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Issue Description */}
      <Text style={styles.issueDescription} numberOfLines={2}>
        {issue.description}
      </Text>

      {/* Before/After Images Section - Enhanced */}
      <View style={styles.beforeAfterSection}>
        <View style={styles.progressHeader}>
          <Ionicons name="trending-up" size={20} color="#4CAF50" />
          <Text style={styles.beforeAfterTitle}>Work Progress</Text>
        </View>
        
        <View style={styles.imageComparisonContainer}>
          {/* Before Images */}
          <View style={styles.imageSection}>
            <View style={styles.imageSectionHeader}>
              <Ionicons name="camera-outline" size={16} color="#FF6B35" />
              <Text style={styles.imageSectionTitle}>Before</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollContainer}>
              {(issue.beforeImages && issue.beforeImages.length > 0) || (issue.imageUrls && issue.imageUrls.length > 0) ? (
                // Use beforeImages if available, otherwise fall back to imageUrls
                (issue.beforeImages && issue.beforeImages.length > 0 ? issue.beforeImages : issue.imageUrls)
                  .slice(0, 2).map((imageUrl, index) => (
                    <TouchableOpacity key={index} style={styles.imageWrapper} onPress={() => openImageModal(imageUrl)}>
                      <Image source={{ uri: imageUrl }} style={styles.beforeAfterImage} />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="eye" size={16} color="white" />
                      </View>
                    </TouchableOpacity>
                  ))
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Ionicons name="image-outline" size={32} color="#FF6B35" />
                  <Text style={styles.noImageText}>No before images</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* VS Divider */}
          <View style={styles.vsDivider}>
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
          </View>

          {/* After Images */}
          <View style={styles.imageSection}>
            <View style={styles.imageSectionHeader}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.imageSectionTitle}>After</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollContainer}>
              {issue.afterImages && issue.afterImages.length > 0 ? (
                issue.afterImages.slice(0, 2).map((imageUrl, index) => (
                  <TouchableOpacity key={index} style={styles.imageWrapper} onPress={() => openImageModal(imageUrl)}>
                    <Image source={{ uri: imageUrl }} style={styles.beforeAfterImage} />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="eye" size={16} color="white" />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Ionicons name="construct" size={32} color="#4CAF50" />
                  <Text style={styles.workCompletedText}>{t('issues.workCompleted')}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Issue Details */}
      <View style={styles.issueDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText} numberOfLines={1}>
            {parseLocation(issue.location)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {issue.categoryName} • {issue.departmentName}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="checkmark-done-outline" size={16} color="#4CAF50" />
          <Text style={[styles.detailText, { color: '#4CAF50' }]}>
{t('issues.completedOn')} {formatDate(issue.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEnhancedPopularIssueCard = (issue: PopularIssue) => (
    <View key={issue.id} style={styles.popularIssueCard}>
      {/* Popular Badge */}
      <View style={styles.popularBadge}>
        <Ionicons name="trending-up" size={16} color="#FF6B35" />
        <Text style={styles.popularBadgeText}>TRENDING</Text>
      </View>
      
      {/* Priority Indicator Strip */}
      <View style={[styles.priorityStrip, { backgroundColor: getPriorityColor(issue.priority) }]} />
      
      {/* Issue Header */}
      <View style={styles.enhancedIssueHeader}>
        <View style={styles.issueInfo}>
          <Text style={styles.enhancedIssueTitle} numberOfLines={2}>
            {issue.title}
          </Text>
          <View style={styles.enhancedMetaRow}>
            <View style={[styles.enhancedStatusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
              <Ionicons 
                name={issue.status === 'ASSIGNED' ? 'person' : issue.status === 'IN_PROGRESS' ? 'construct' : 'checkmark-circle'} 
                size={12} 
                color="white" 
              />
              <Text style={styles.enhancedStatusText}>{issue.status}</Text>
            </View>
            <View style={[styles.enhancedPriorityBadge, { backgroundColor: getPriorityColor(issue.priority) }]}>
              <Ionicons 
                name={issue.priority === 'CRITICAL' ? 'warning' : issue.priority === 'HIGH' ? 'alert-circle' : issue.priority === 'MEDIUM' ? 'information-circle' : 'checkmark-circle'} 
                size={12} 
                color="white" 
              />
              <Text style={styles.enhancedPriorityText}>{issue.priority}</Text>
            </View>
          </View>
        </View>
        
        {/* Enhanced Popular Upvote Button */}
        <TouchableOpacity
          style={[styles.popularUpvoteButton, upvoteStatuses[issue.id] && styles.popularUpvoteButtonActive]}
          onPress={() => handleUpvote(issue.id)}
        >
          <Ionicons
            name={upvoteStatuses[issue.id] ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
            size={24}
            color={upvoteStatuses[issue.id] ? '#fff' : '#FF6B35'}
          />
          <Text style={[styles.popularUpvoteCount, upvoteStatuses[issue.id] && styles.popularUpvoteCountActive]}>
            {issue.upvoteCount}
          </Text>
          <Text style={[styles.popularUpvoteLabel, upvoteStatuses[issue.id] && styles.popularUpvoteLabelActive]}>
            votes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Issue Description */}
      <Text style={styles.enhancedIssueDescription} numberOfLines={3}>
        {issue.description}
      </Text>

      {/* Enhanced Issue Details */}
      <View style={styles.enhancedIssueDetails}>
        <View style={styles.enhancedDetailRow}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="location" size={16} color="#2E7D32" />
          </View>
          <Text style={styles.enhancedDetailText} numberOfLines={1}>
            {parseLocation(issue.location)}
          </Text>
        </View>
        
        <View style={styles.enhancedDetailRow}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="business" size={16} color="#FF6B35" />
          </View>
          <Text style={styles.enhancedDetailText}>
            {issue.categoryName} • {issue.departmentName}
          </Text>
        </View>
        
        <View style={styles.enhancedDetailRow}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="time" size={16} color="#666" />
          </View>
          <Text style={styles.enhancedDetailText}>
            {formatDate(issue.createdAt)}
          </Text>
        </View>
      </View>

      {/* Enhanced Issue Images */}
      {issue.imageUrls && issue.imageUrls.length > 0 && (
        <View style={styles.enhancedImageSection}>
          <View style={styles.imageSectionHeader}>
            <Ionicons name="images" size={16} color="#666" />
            <Text style={styles.imageSectionTitle}>
              {issue.imageUrls.length} {issue.imageUrls.length === 1 ? 'Photo' : 'Photos'}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.enhancedImageContainer}>
            {issue.imageUrls.slice(0, 4).map((imageUrl, index) => (
              <TouchableOpacity key={index} onPress={() => openImageModal(imageUrl)} style={styles.enhancedImageWrapper}>
                <Image source={{ uri: imageUrl }} style={styles.enhancedIssueImage} />
                <View style={styles.enhancedImageOverlay}>
                  <Ionicons name="eye" size={16} color="white" />
                </View>
              </TouchableOpacity>
            ))}
            {issue.imageUrls.length > 4 && (
              <View style={styles.enhancedMoreImagesOverlay}>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.enhancedMoreImagesText}>+{issue.imageUrls.length - 4}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
      
      {/* Popular Issue Footer */}
      <View style={styles.popularCardFooter}>
        <View style={styles.popularFooterStats}>
          <Ionicons name="flame" size={16} color="#FF6B35" />
          <Text style={styles.popularFooterStatsText}>Popular Issue</Text>
        </View>
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.footerAction}>
            <Ionicons name="share-outline" size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerAction}>
            <Ionicons name="bookmark-outline" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderIssueCard = (issue: PublicIssue) => (
    <View key={issue.id} style={styles.enhancedIssueCard}>
      {/* Priority Indicator Strip */}
      <View style={[styles.priorityStrip, { backgroundColor: getPriorityColor(issue.priority) }]} />
      
      {/* Issue Header */}
      <View style={styles.enhancedIssueHeader}>
        <View style={styles.issueInfo}>
          <Text style={styles.enhancedIssueTitle} numberOfLines={2}>
            {issue.title}
          </Text>
          <View style={styles.enhancedMetaRow}>
            <View style={[styles.enhancedStatusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
              <Ionicons 
                name={issue.status === 'ASSIGNED' ? 'person' : issue.status === 'IN_PROGRESS' ? 'construct' : 'checkmark-circle'} 
                size={12} 
                color="white" 
              />
              <Text style={styles.enhancedStatusText}>{issue.status}</Text>
            </View>
            <View style={[styles.enhancedPriorityBadge, { backgroundColor: getPriorityColor(issue.priority) }]}>
              <Ionicons 
                name={issue.priority === 'CRITICAL' ? 'warning' : issue.priority === 'HIGH' ? 'alert-circle' : issue.priority === 'MEDIUM' ? 'information-circle' : 'checkmark-circle'} 
                size={12} 
                color="white" 
              />
              <Text style={styles.enhancedPriorityText}>{issue.priority}</Text>
            </View>
          </View>
        </View>
        
        {/* Enhanced Upvote Button */}
        <TouchableOpacity
          style={[styles.enhancedUpvoteButton, upvoteStatuses[issue.id] && styles.enhancedUpvoteButtonActive]}
          onPress={() => handleUpvote(issue.id)}
        >
          <Ionicons
            name={upvoteStatuses[issue.id] ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
            size={22}
            color={upvoteStatuses[issue.id] ? '#fff' : '#FF6B6B'}
          />
          <Text style={[styles.enhancedUpvoteCount, upvoteStatuses[issue.id] && styles.enhancedUpvoteCountActive]}>
            {issue.upvoteCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Issue Description */}
      <Text style={styles.enhancedIssueDescription} numberOfLines={3}>
        {issue.description}
      </Text>

      {/* Enhanced Issue Details */}
      <View style={styles.enhancedIssueDetails}>
        <View style={styles.enhancedDetailRow}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="location" size={16} color="#2E7D32" />
          </View>
          <Text style={styles.enhancedDetailText} numberOfLines={1}>
            {parseLocation(issue.location)}
          </Text>
        </View>
        
        <View style={styles.enhancedDetailRow}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="business" size={16} color="#FF6B35" />
          </View>
          <Text style={styles.enhancedDetailText}>
            {issue.categoryName} • {issue.departmentName}
          </Text>
        </View>
        
        <View style={styles.enhancedDetailRow}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="time" size={16} color="#666" />
          </View>
          <Text style={styles.enhancedDetailText}>
            {formatDate(issue.createdAt)}
          </Text>
        </View>
      </View>

      {/* Enhanced Issue Images */}
      {issue.imageUrls && issue.imageUrls.length > 0 && (
        <View style={styles.enhancedImageSection}>
          <View style={styles.imageSectionHeader}>
            <Ionicons name="images" size={16} color="#666" />
            <Text style={styles.imageSectionTitle}>
              {issue.imageUrls.length} {issue.imageUrls.length === 1 ? 'Photo' : 'Photos'}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.enhancedImageContainer}>
            {issue.imageUrls.slice(0, 4).map((imageUrl, index) => (
              <TouchableOpacity key={index} onPress={() => openImageModal(imageUrl)} style={styles.enhancedImageWrapper}>
                <Image source={{ uri: imageUrl }} style={styles.enhancedIssueImage} />
                <View style={styles.enhancedImageOverlay}>
                  <Ionicons name="eye" size={16} color="white" />
                </View>
              </TouchableOpacity>
            ))}
            {issue.imageUrls.length > 4 && (
              <View style={styles.enhancedMoreImagesOverlay}>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.enhancedMoreImagesText}>+{issue.imageUrls.length - 4}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
      
      {/* Action Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerStats}>
          <Ionicons name="eye-outline" size={14} color="#999" />
          <Text style={styles.footerStatsText}>Public Issue</Text>
        </View>
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.footerAction}>
            <Ionicons name="share-outline" size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerAction}>
            <Ionicons name="bookmark-outline" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );


  if (loading && issues.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>{t('issues.loadingCommunityIssues')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('issues.communityIssues')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('issues.seeWhatsHappening')}
          </Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            {t('issues.allIssues')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'popular' && styles.tabActive]}
          onPress={() => setActiveTab('popular')}
        >
          <Text style={[styles.tabText, activeTab === 'popular' && styles.tabTextActive]}>
            {t('issues.popular')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            {t('issues.beforeAfter')}
          </Text>
        </TouchableOpacity>
      </View>


      {/* Issues List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadIssues(true)}
            colors={['#2E7D32']}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          
          if (isCloseToBottom && hasMore && !loading && activeTab === 'all') {
            setPage(prev => prev + 1);
          }
        }}
        scrollEventThrottle={400}
      >
        {activeTab === 'all' ? (
          <>
            {issues.map(renderIssueCard)}
            {loading && issues.length > 0 && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#2E7D32" />
                <Text style={styles.loadingMoreText}>Loading more issues...</Text>
              </View>
            )}
          </>
        ) : activeTab === 'popular' ? (
          <>
            {popularIssues.length > 0 ? (
              popularIssues.map(renderEnhancedPopularIssueCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="trending-up-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No popular issues yet</Text>
                <Text style={styles.emptySubtext}>
                  Issues with upvotes will appear here
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {completedIssues.length > 0 ? (
              completedIssues.map(renderCompletedIssueCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No before & after photos yet</Text>
                <Text style={styles.emptySubtext}>
                  Resolved issues with progress photos will appear here
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={closeImageModal}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              {selectedImage && (
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2E7D32',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  issueCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  // Enhanced Issue Card Styles
  enhancedIssueCard: {
    backgroundColor: 'white',
    margin: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  priorityStrip: {
    height: 4,
    width: '100%',
  },
  enhancedIssueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  enhancedIssueTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
    lineHeight: 24,
  },
  enhancedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enhancedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  enhancedStatusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  enhancedPriorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  enhancedPriorityText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  enhancedUpvoteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'white',
    minWidth: 65,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedUpvoteButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  enhancedUpvoteCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 2,
  },
  enhancedUpvoteCountActive: {
    color: 'white',
  },
  enhancedIssueDescription: {
    fontSize: 15,
    color: '#4a4a4a',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  enhancedIssueDetails: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  enhancedDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  enhancedDetailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    fontWeight: '500',
  },
  enhancedImageSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  imageSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  enhancedImageContainer: {
    flexDirection: 'row',
  },
  enhancedImageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  enhancedIssueImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  enhancedImageOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 4,
  },
  enhancedMoreImagesOverlay: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  enhancedMoreImagesText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  footerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerStatsText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  footerAction: {
    padding: 4,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  issueInfo: {
    flex: 1,
    marginRight: 12,
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Enhanced Completed Badge Styles
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    marginRight: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  completedIconContainer: {
    marginRight: 6,
  },
  completedText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  upvoteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    backgroundColor: 'white',
    minWidth: 60,
  },
  upvoteButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  upvoteCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 2,
  },
  upvoteCountActive: {
    color: 'white',
  },
  issueDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  issueDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  imageContainer: {
    marginTop: 8,
  },
  issueImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  moreImagesOverlay: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Completed Work Styles
  completedIssueCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  beforeAfterSection: {
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  beforeAfterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  imageComparisonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageSection: {
    flex: 1,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  imageSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  imageScrollContainer: {
    height: 140,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  beforeAfterImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  vsDivider: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  vsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  noImageText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  workCompletedText: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Image Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.95,
    height: Dimensions.get('window').height * 0.8,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  // Popular Issue Card Styles
  popularIssueCard: {
    backgroundColor: 'white',
    margin: 12,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFE5D9',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
    zIndex: 1,
    gap: 4,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 0.5,
  },
  popularUpvoteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FF6B35',
    backgroundColor: 'white',
    minWidth: 75,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  popularUpvoteButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  popularUpvoteCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6B35',
    marginTop: 2,
  },
  popularUpvoteCountActive: {
    color: 'white',
  },
  popularUpvoteLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B35',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popularUpvoteLabelActive: {
    color: 'white',
  },
  popularCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFE5D9',
    backgroundColor: '#FFF8F5',
  },
  popularFooterStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  popularFooterStatsText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default PublicIssuesScreen;

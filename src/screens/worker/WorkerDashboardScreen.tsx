import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useWorkerTabNavigation } from '../../components/SwipeableWorkerTabNavigator';
import { RootState } from '../../store/store';
import { setWorkerStats, setAssignments, setLoading, setError } from '../../store/slices/workerSlice';
import { logout } from '../../store/slices/authSlice';
import OfflineIndicator from '../../components/OfflineIndicator';
import { offlineService } from '../../services/offlineService';
import { offlineApiService } from '../../services/offlineApiService';
import { tokenStorage } from '../../utils/tokenStorage';
import { authDebug } from '../../utils/authDebug';
// Removed IssueDetailsModal import - now redirecting to MyWork tab
import EndWorkModal from '../../components/EndWorkModal';

interface DashboardStats {
  totalAssigned: number;
  todayAssigned: number;
  inProgress: number;
  completed: number;
  pending: number;
}

interface PriorityIssue {
  id: string;
  issueId: string;
  priority: 'high' | 'medium' | 'low';
  issue: {
    title: string;
    location: string;
    category: string;
  };
}

interface WorkerData {
  id: string;
  workerId: string;
  name: string;
  department: string;
  rating: number;
  completedIssues: number;
  profilePhoto?: string;
}

const WorkerDashboardScreen = () => {
  const dispatch = useDispatch();
  const { navigateToTab } = useWorkerTabNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { stats, loading } = useSelector((state: RootState) => state.worker);
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalAssigned: 0,
    todayAssigned: 0,
    inProgress: 0,
    completed: 0,
    pending: 0,
  });
  const [priorityIssues, setPriorityIssues] = useState<PriorityIssue[]>([]);
  const [workerData, setWorkerData] = useState<WorkerData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showEndWorkModal, setShowEndWorkModal] = useState(false);
  const [activeWorkSession, setActiveWorkSession] = useState<any>(null);
  const glowAnimation = useRef(new Animated.Value(0)).current;

  const fetchDashboardData = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available');
      return;
    }

    // Check if we have a fallback token in Redux state
    if (token && token.startsWith('fallback_token')) {
      console.log('❌ Fallback token detected in Redux state:', token.substring(0, 30) + '...');
      
      // Immediately clear Redux state and force logout
      console.log('🔄 Clearing Redux state immediately...');
      dispatch(logout());
      
      Alert.alert(
        'Authentication Error',
        'Invalid authentication detected. Please login again.',
        [
          {
            text: 'Login',
            onPress: async () => {
              try {
                await authDebug.completeAuthReset();
              } catch (error) {
                console.error('Error during auth reset:', error);
              }
            }
          }
        ]
      );
      return;
    }

    if (!token) {
      console.log('❌ No authentication token available');
      
      // Debug current auth state
      await authDebug.debugAuthState();
      
      Alert.alert(
        'Authentication Required',
        'No valid authentication token found. We will reset your authentication completely.',
        [
          {
            text: 'Reset & Login',
            onPress: async () => {
              try {
                await authDebug.completeAuthReset();
                // The app should automatically redirect to login screen
              } catch (error) {
                console.error('Error during complete auth reset:', error);
              }
            }
          }
        ]
      );
      return;
    }

    try {
      dispatch(setLoading(true));
      
      // Use the new API service method
      const response = await offlineApiService.getWorkerDashboard(user.id);

      if (response.success && response.data) {
        // Handle different data structures from API vs cache
        const stats = response.data.stats as any;
        const worker = response.data.worker as any;
        const priorityIssues = response.data.priorityIssues || [];

        // Normalize stats data structure
        const normalizedStats = {
          totalAssigned: stats.totalAssigned || stats.totalAssignments || 0,
          todayAssigned: stats.todayAssigned || stats.todayAssignments || 0,
          inProgress: stats.inProgress || stats.inProgressCount || 0,
          completed: stats.completed || stats.completedCount || 0,
          pending: stats.pending || stats.pendingCount || 0,
        };

        setDashboardStats(normalizedStats);

        // Normalize priority issues data structure
        const normalizedPriorityIssues = priorityIssues.map((item: any) => {
          if (item.issue) {
            // API format
            return item;
          } else {
            // Cache format - transform to API format
            return {
              id: item.id,
              issueId: item.id,
              priority: item.priority,
              issue: {
                title: item.title,
                location: item.location,
                category: item.category,
              }
            };
          }
        });

        setPriorityIssues(normalizedPriorityIssues);

        // Normalize worker data
        const normalizedWorker = {
          id: worker.id || user?.id || '',
          workerId: worker.workerId || worker.id || user?.id || '',
          name: worker.name || worker.fullName || user?.name || 'Worker',
          department: worker.department || 'Department',
          rating: worker.rating || 0,
          completedIssues: worker.completedIssues || 0,
          profilePhoto: worker.profilePhoto || worker.profilePicture || user?.profilePicture || null,
        };

        setWorkerData(normalizedWorker);
        
        // Update Redux store
        dispatch(setWorkerStats({
          totalAssigned: normalizedStats.totalAssigned,
          inProgress: normalizedStats.inProgress,
          completed: normalizedStats.completed,
          avgResponseTime: 0, // Will be calculated from actual data
          completionRate: normalizedStats.totalAssigned > 0 
            ? (normalizedStats.completed / normalizedStats.totalAssigned) * 100 
            : 0,
          rating: normalizedWorker.rating,
        }));

        console.log('✅ Worker data loaded:', normalizedWorker.name);
      } else {
        const errorMessage = (response as any).error?.message || 'Failed to fetch dashboard data';
        console.error('❌ Dashboard API error:', (response as any).error);
        
        // Handle authentication errors specifically
        if ((response as any).error?.code === 'INVALID_TOKEN' || (response as any).error?.code === 'MALFORMED_TOKEN' || (response as any).error?.code === 'NO_TOKEN') {
          console.log('🔍 Authentication error detected, debugging...');
          await authDebug.debugAuthState();
          
          Alert.alert(
            'Authentication Error',
            'Your session is invalid. We will completely reset your authentication.',
            [
              {
                text: 'Reset & Login',
                onPress: async () => {
                  try {
                    await authDebug.completeAuthReset();
                    // The app should automatically redirect to login screen
                  } catch (error) {
                    console.error('Error during complete auth reset:', error);
                  }
                }
              }
            ]
          );
        } else {
          dispatch(setError(errorMessage));
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error) {
      console.error('❌ Dashboard fetch error:', error);
      dispatch(setError('Network error occurred'));
      Alert.alert('Error', 'Network error occurred');
    } finally {
      dispatch(setLoading(false));
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    startGlowAnimation();
  }, [user?.id]);

  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  // Refresh dashboard data when screen comes into focus (e.g., returning from profile screen)
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [user?.id])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
  }, []);

  const handleViewIssueDetails = (issueId: string) => {
    // Navigate to My Work tab and open the issue details there
    navigateToTab('MyWork', { 
      openIssueId: issueId 
    });
  };

  const handleStartWork = async (issueId: string) => {
    try {
      console.log('🚀 Starting work on issue:', issueId);
      
      // TODO: Implement proper API call to start work
      // For now, just show success message
      Alert.alert('Success', 'Work started successfully! (Feature will be implemented soon)');
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error starting work:', error);
      Alert.alert('Error', 'Failed to start work on issue');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#f44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'alert-circle';
      case 'medium': return 'warning';
      case 'low': return 'information-circle';
      default: return 'help-circle';
    }
  };

  // Quick Action Navigation Functions
  const handleMyAssignments = () => {
    console.log('🚀 Navigating to My Assignments');
    navigateToTab('MyWork');
  };

  const handleMapView = () => {
    console.log('🗺️ Navigating to Map View');
    navigateToTab('Map');
  };

  const handleReports = () => {
    console.log('📊 Navigating to Reports');
    navigateToTab('Reports');
  };

  const handleProfile = () => {
    console.log('👤 Navigating to Profile');
    navigateToTab('Profile');
  };

  const handleHelp = () => {
    console.log('❓ Navigating to Help');
    navigateToTab('Profile'); // Navigate to Profile tab which contains Help & Support
  };

  const handleSupport = () => {
    console.log('💬 Navigating to Support');
    navigateToTab('Profile'); // Navigate to Profile tab which contains Help & Support
  };

  const insets = useSafeAreaInsets();

  // Set status bar for home page
  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#FF6B35', true);
      StatusBar.setTranslucent(false);
    }
  }, []);

  const renderCustomHeader = () => {
    const statusBarHeight = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;
    
    return (
      <View style={[styles.modernHeader, { paddingTop: statusBarHeight }]}>
        <View style={styles.headerGradientOverlay} />
        <View style={styles.headerContent}>
          {/* Left side - Enhanced greeting */}
          <View style={styles.headerLeft}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <View style={styles.weatherBadge}>
                <Ionicons name="sunny" size={12} color="#FFD700" />
                <Text style={styles.weatherText}>25°C</Text>
              </View>
            </View>
            <Text style={styles.userName}>{workerData?.name || user?.name || 'Worker'}</Text>
            <View style={styles.workerInfo}>
              <View style={styles.workerBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#4CAF50" />
                <Text style={styles.workerId}>ID: {workerData?.workerId || 'Loading...'}</Text>
              </View>
              <View style={styles.departmentBadge}>
                <Ionicons name="business" size={12} color="#2196F3" />
                <Text style={styles.department}>{workerData?.department || 'Loading...'}</Text>
              </View>
            </View>
          </View>
          
          {/* Right side - Enhanced profile */}
          <View style={styles.headerRight}>
            <View style={styles.profileSection}>
              <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
                <View style={styles.profileAvatar}>
                  <View style={styles.avatarGlow} />
                  {(workerData?.profilePhoto || user?.profilePicture) ? (
                    <Image 
                      source={{ uri: workerData?.profilePhoto || user?.profilePicture }} 
                      style={styles.avatarImage}
                      onError={() => {
                        console.log('Profile image failed to load, showing fallback');
                      }}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {(workerData?.name || user?.name || 'W').charAt(0).toUpperCase()}
                    </Text>
                  )}
                  <View style={styles.onlineIndicator} />
                </View>
              </TouchableOpacity>
              <View style={styles.ratingContainer}>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.ratingText}>{(workerData?.rating && typeof workerData.rating === 'number') ? workerData.rating.toFixed(1) : '0.0'}</Text>
                </View>
                <Text style={styles.ratingLabel}>Rating</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderCustomHeader()}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* Performance Overview */}
        <View style={styles.performanceSection}>
          <View style={styles.performanceHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.performanceIcon}>
                <Ionicons name="analytics" size={18} color="#FF6B35" />
              </View>
              <Text style={styles.performanceTitle}>Today's Performance</Text>
            </View>
            <Animated.View style={[
              styles.performanceBadge,
              {
                shadowOpacity: glowAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.6],
                }),
                elevation: glowAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2, 8],
                }),
              }
            ]}>
              <Text style={styles.performanceBadgeText}>Live</Text>
              <Animated.View style={[
                styles.liveDot,
                {
                  opacity: glowAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                  transform: [{
                    scale: glowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  }],
                }
              ]} />
            </Animated.View>
          </View>
          
          {/* Main Stats Row */}
          <View style={styles.mainStatsRow}>
            <TouchableOpacity style={[styles.primaryStatCard, styles.assignedCard]} activeOpacity={0.8}>
              <View style={styles.statCardHeader}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="clipboard" size={18} color="#2196F3" />
                </View>
                <Text style={styles.statTrend}>+2</Text>
              </View>
              <Text style={styles.primaryStatNumber}>{dashboardStats.todayAssigned || 0}</Text>
              <Text style={styles.primaryStatLabel}>Assigned Today</Text>
              <View style={styles.statProgress}>
                <View style={[styles.statProgressBar, { width: '70%', backgroundColor: '#2196F3' }]} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.primaryStatCard, styles.progressCard]} activeOpacity={0.8}>
              <View style={styles.statCardHeader}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="sync" size={18} color="#FF9800" />
                </View>
                <Text style={styles.statTrend}>+1</Text>
              </View>
              <Text style={styles.primaryStatNumber}>{dashboardStats.inProgress || 0}</Text>
              <Text style={styles.primaryStatLabel}>In Progress</Text>
              <View style={styles.statProgress}>
                <View style={[styles.statProgressBar, { width: '45%', backgroundColor: '#FF9800' }]} />
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Secondary Stats Row */}
          <View style={styles.secondaryStatsRow}>
            <View style={styles.secondaryStatCard}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.secondaryStatNumber}>{dashboardStats.completed || 0}</Text>
              <Text style={styles.secondaryStatLabel}>Completed</Text>
            </View>
            <View style={styles.secondaryStatCard}>
              <Ionicons name="time" size={16} color="#9C27B0" />
              <Text style={styles.secondaryStatNumber}>{dashboardStats.pending || 0}</Text>
              <Text style={styles.secondaryStatLabel}>Pending</Text>
            </View>
            <View style={styles.secondaryStatCard}>
              <Ionicons name="trophy" size={16} color="#FFD700" />
              <Text style={styles.secondaryStatNumber}>{Math.round((dashboardStats.completed / Math.max(dashboardStats.totalAssigned, 1)) * 100)}%</Text>
              <Text style={styles.secondaryStatLabel}>Success Rate</Text>
            </View>
          </View>
        </View>

        {/* Priority Issues */}
        <View style={styles.modernSection}>
          <View style={styles.modernSectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.priorityIcon}>
                <Ionicons name="flash" size={18} color="#FF6B35" />
              </View>
              <Text style={styles.modernSectionTitle}>Priority Tasks</Text>
              {priorityIssues.length > 0 && (
                <View style={styles.modernCountBadge}>
                  <Text style={styles.modernCountText}>{priorityIssues.length}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={handleMyAssignments} style={styles.modernViewAllButton}>
              <Text style={styles.modernViewAllText}>View All</Text>
              <View style={styles.arrowIcon}>
                <Ionicons name="arrow-forward" size={14} color="#FF6B35" />
              </View>
            </TouchableOpacity>
          </View>
          
          {priorityIssues.length > 0 ? (
            priorityIssues.map((item, index) => (
              <TouchableOpacity key={item.id} style={[styles.issueCard, { marginBottom: index === priorityIssues.length - 1 ? 0 : 12 }]} activeOpacity={0.8}>
                <View style={styles.issueHeader}>
                  <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(item.priority)}15` }]}>
                    <Ionicons 
                      name={getPriorityIcon(item.priority) as any} 
                      size={12} 
                      color={getPriorityColor(item.priority)} 
                    />
                    <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                      {(item.priority || 'MEDIUM').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.issueNumber}>
                    <Text style={styles.issueNumberText}>#{item.issueId?.slice(-4) || '0000'}</Text>
                  </View>
                </View>
                <Text style={styles.issueTitle} numberOfLines={2}>{item.issue?.title || 'Issue Title'}</Text>
                <View style={styles.issueDetails}>
                  <View style={styles.issueDetailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="location" size={12} color="#666" />
                    </View>
                    <Text style={styles.issueDetailText} numberOfLines={1}>{item.issue?.location || 'Location'}</Text>
                  </View>
                  <View style={styles.issueDetailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="folder" size={12} color="#666" />
                    </View>
                    <Text style={styles.issueDetailText} numberOfLines={1}>{item.issue?.category || 'Category'}</Text>
                  </View>
                </View>
                <View style={styles.issueActions}>
                  <TouchableOpacity 
                    style={styles.modernActionButton}
                    onPress={() => handleViewIssueDetails(item.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye" size={14} color="white" />
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No priority issues at the moment</Text>
              <Text style={styles.emptyStateSubtext}>Great job keeping up with your work!</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.modernSection}>
          <View style={styles.modernSectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.actionsIcon}>
                <Ionicons name="grid" size={18} color="#FF6B35" />
              </View>
              <Text style={styles.modernSectionTitle}>Quick Actions</Text>
            </View>
          </View>
          
          {/* Primary Actions */}
          <View style={styles.primaryActionsRow}>
            <TouchableOpacity 
              style={[styles.primaryActionCard, { backgroundColor: '#FF6B3515' }]}
              onPress={handleMyAssignments}
              activeOpacity={0.8}
            >
              <View style={styles.primaryActionContent}>
                <View style={[styles.primaryActionIcon, { backgroundColor: '#FF6B35' }]}>
                  <Ionicons name="briefcase" size={20} color="white" />
                </View>
                <View style={styles.primaryActionInfo}>
                  <Text style={styles.primaryActionTitle} numberOfLines={1}>My Work</Text>
                  <Text style={styles.primaryActionSubtitle} numberOfLines={1}>{dashboardStats.totalAssigned || 0} assignments</Text>
                </View>
                <View style={styles.primaryActionArrow}>
                  <Ionicons name="chevron-forward" size={18} color="#FF6B35" />
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.primaryActionCard, { backgroundColor: '#2196F315' }]}
              onPress={handleMapView}
              activeOpacity={0.8}
            >
              <View style={styles.primaryActionContent}>
                <View style={[styles.primaryActionIcon, { backgroundColor: '#2196F3' }]}>
                  <Ionicons name="location" size={20} color="white" />
                </View>
                <View style={styles.primaryActionInfo}>
                  <Text style={styles.primaryActionTitle} numberOfLines={1}>Map View</Text>
                  <Text style={styles.primaryActionSubtitle} numberOfLines={1}>Navigate sites</Text>
                </View>
                <View style={styles.primaryActionArrow}>
                  <Ionicons name="chevron-forward" size={18} color="#2196F3" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Secondary Actions Grid */}
          <View style={styles.secondaryActionsGrid}>
            <TouchableOpacity 
              style={styles.secondaryActionCard}
              onPress={handleReports}
              activeOpacity={0.8}
            >
              <View style={[styles.secondaryActionIcon, { backgroundColor: '#4CAF5015' }]}>
                <Ionicons name="bar-chart" size={18} color="#4CAF50" />
              </View>
              <Text style={styles.secondaryActionText} numberOfLines={1}>Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryActionCard}
              onPress={handleProfile}
              activeOpacity={0.8}
            >
              <View style={[styles.secondaryActionIcon, { backgroundColor: '#9C27B015' }]}>
                <Ionicons name="settings" size={18} color="#9C27B0" />
              </View>
              <Text style={styles.secondaryActionText} numberOfLines={1}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryActionCard}
              onPress={handleHelp}
              activeOpacity={0.8}
            >
              <View style={[styles.secondaryActionIcon, { backgroundColor: '#FF980015' }]}>
                <Ionicons name="help-circle" size={18} color="#FF9800" />
              </View>
              <Text style={styles.secondaryActionText} numberOfLines={1}>Help</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryActionCard}
              onPress={handleSupport}
              activeOpacity={0.8}
            >
              <View style={[styles.secondaryActionIcon, { backgroundColor: '#E91E6315' }]}>
                <Ionicons name="chatbubbles" size={18} color="#E91E63" />
              </View>
              <Text style={styles.secondaryActionText} numberOfLines={1}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <OfflineIndicator />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  customHeader: {
    backgroundColor: '#FF6B35',
    paddingBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 20, // Increased margin to prevent overlap
    maxWidth: '70%', // Limit width to prevent overlap
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '400',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Allow wrapping if content is too long
    maxWidth: '100%',
  },
  workerId: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 8,
  },
  department: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    flexShrink: 1, // Allow text to shrink if needed
    maxWidth: 150, // Limit maximum width
  },
  headerRight: {
    alignItems: 'flex-end',
    minWidth: 80, // Ensure minimum width for profile section
    justifyContent: 'flex-start',
  },
  profileSection: {
    alignItems: 'center',
    position: 'relative',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    marginLeft: 2,
  },
  profileButton: {
    padding: 2,
  },
  profileAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  avatarImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  assignedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  progressCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  completedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  issueCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  issueDetails: {
    marginBottom: 12,
  },
  issueDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  issueActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.48,
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FF6B35',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  // New enhanced styles
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryBadge: {
    backgroundColor: '#FF6B3515',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '600',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  priorityCountBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  priorityCountText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  issueNumber: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  issueNumberText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  detailIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  modernActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionSubtext: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  primaryAction: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  secondaryAction: {
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  tertiaryAction: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  quaternaryAction: {
    borderLeftWidth: 3,
    borderLeftColor: '#9C27B0',
  },
  // Modern header styles
  modernHeader: {
    backgroundColor: '#FF6B35',
    paddingBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    position: 'relative',
  },
  headerGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  weatherText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    marginLeft: 3,
  },
  workerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  departmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  avatarGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  ratingContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  ratingLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  // Performance section styles
  performanceSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  performanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B3515',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5015',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#4CAF5025',
  },
  performanceBadgeText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  mainStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  primaryStatCard: {
    flex: 0.48,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statTrend: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    backgroundColor: '#4CAF5015',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryStatNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  primaryStatLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  statProgress: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  statProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryStatCard: {
    flex: 0.31,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  secondaryStatNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
    marginBottom: 2,
  },
  secondaryStatLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Modern section styles
  modernSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  priorityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B3515',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B3515',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernCountBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  modernCountText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '700',
  },
  modernViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B3515',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modernViewAllText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '600',
    marginRight: 4,
  },
  arrowIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B3525',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Primary actions styles
  primaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  primaryActionCard: {
    flex: 0.48,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 70,
  },
  primaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  primaryActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  primaryActionInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 4,
    minWidth: 0,
  },
  primaryActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    lineHeight: 16,
  },
  primaryActionSubtitle: {
    fontSize: 11,
    color: '#666',
    lineHeight: 13,
  },
  primaryActionArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Secondary actions styles
  secondaryActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  secondaryActionCard: {
    width: '23%',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 80,
    justifyContent: 'center',
  },
  secondaryActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  secondaryActionText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 13,
  },
});

export default WorkerDashboardScreen;

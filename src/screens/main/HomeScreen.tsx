import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { apiService, DashboardStats } from '../../services/apiService';
import { useUserTabNavigation } from '../../components/SwipeableUserTabNavigator';
import { useCountUp } from '../../hooks/useCountUp';

const { width } = Dimensions.get('window');
const HomeScreen = () => {
  const navigation = useNavigation();
  let tabNavigation;
  try {
    tabNavigation = useUserTabNavigation();
  } catch (error) {
    console.log('Tab navigation not available, using React Navigation fallback');
    tabNavigation = null;
  }
  const { t } = useTranslation();
  const categories = useSelector((state: RootState) => state.issues.categories);
  
  // State for API data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [successStories, setSuccessStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Count-up animations for statistics (will use real data)
  const resolvedCount = useCountUp({ 
    end: dashboardStats?.resolvedIssues || 0, 
    duration: 2000 
  });
  const inProgressCount = useCountUp({ 
    end: dashboardStats?.inProgressIssues || 0, 
    duration: 2000 
  });
  const avgResponseHours = useCountUp({ 
    end: dashboardStats?.averageResolutionTime || 0, 
    duration: 2000 
  });
  
  // Load dashboard data from API
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load dashboard statistics from new home content API
      const statsResponse = await fetch(`${apiService.getBaseURL()}/home-content/statistics`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setDashboardStats({
            totalIssues: statsData.data.totalIssues,
            resolvedIssues: statsData.data.resolvedIssues,
            inProgressIssues: statsData.data.inProgressIssues,
            pendingIssues: 0,
            averageResolutionTime: statsData.data.averageResolutionTime,
            categoryStats: [],
            districtStats: []
          });
        }
      } else {
        // Fallback to original dashboard stats API
        const fallbackResponse = await apiService.getDashboardStats();
        if (fallbackResponse.success && fallbackResponse.data) {
          setDashboardStats(fallbackResponse.data);
        } else {
          // Final fallback to mock data
          setDashboardStats({
            totalIssues: 1336,
            resolvedIssues: 1247,
            inProgressIssues: 89,
            pendingIssues: 0,
            averageResolutionTime: 24,
            categoryStats: [],
            districtStats: []
          });
        }
      }
      
      // Load announcements from new home content API
      const announcementsResponse = await fetch(`${apiService.getBaseURL()}/home-content/announcements?limit=3`);
      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json();
        if (announcementsData.success) {
          setAnnouncements(announcementsData.data);
        }
      } else {
        // Fallback to original announcements API
        const fallbackResponse = await apiService.getAnnouncements({ limit: 3 });
        if (fallbackResponse.success && fallbackResponse.data) {
          setAnnouncements(fallbackResponse.data.announcements || fallbackResponse.data);
        } else {
          // Final fallback to mock data
          setAnnouncements([
            { id: '1', title: 'New Waste Management Initiative', description: 'Government of Jharkhand launches new waste segregation program', date: '2024-01-15', priority: 'HIGH' },
            { id: '2', title: 'Road Repair Schedule', description: 'Major road repairs scheduled for next month in Ranchi district', date: '2024-01-10', priority: 'MEDIUM' },
            { id: '3', title: 'Public Health Campaign', description: 'Free health checkup camps in rural areas starting this week', date: '2024-01-08', priority: 'LOW' },
          ]);
        }
      }
      
      // Load initiatives from new home content API
      const initiativesResponse = await fetch(`${apiService.getBaseURL()}/home-content/initiatives`);
      if (initiativesResponse.ok) {
        const initiativesData = await initiativesResponse.json();
        if (initiativesData.success) {
          setInitiatives(initiativesData.data);
        }
      }
      
      // Load success stories from new home content API
      const storiesResponse = await fetch(`${apiService.getBaseURL()}/home-content/success-stories`);
      if (storiesResponse.ok) {
        const storiesData = await storiesResponse.json();
        if (storiesData.success) {
          setSuccessStories(storiesData.data);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
      // Set fallback data
      setDashboardStats({
        totalIssues: 1336,
        resolvedIssues: 1247,
        inProgressIssues: 89,
        pendingIssues: 0,
        averageResolutionTime: 24,
        categoryStats: [],
        districtStats: []
      });
      setAnnouncements([
        { id: '1', title: 'New Waste Management Initiative', description: 'Government of Jharkhand launches new waste segregation program', date: '2024-01-15', priority: 'HIGH' },
        { id: '2', title: 'Road Repair Schedule', description: 'Major road repairs scheduled for next month in Ranchi district', date: '2024-01-10', priority: 'MEDIUM' },
        { id: '3', title: 'Public Health Campaign', description: 'Free health checkup camps in rural areas starting this week', date: '2024-01-08', priority: 'LOW' },
      ]);
      setInitiatives([
        { title: 'Road Infrastructure', completionPercentage: 75, footerLeft: '75% Complete', footerRight: '450 roads improved', iconName: 'car', colorScheme: 'orange' },
        { title: 'Clean Jharkhand Mission', completionPercentage: 60, footerLeft: '60% Complete', footerRight: '1200 areas cleaned', iconName: 'leaf', colorScheme: 'green' }
      ]);
      setSuccessStories([
        { category: 'Potholes', title: 'Pothole Fixed on Main Street', description: 'Reported by citizen, fixed within 48 hours. Road now smooth for daily commuters.', completedAt: '2024-01-12' },
        { category: 'Street Lights', title: 'Street Lights Restored in Dhanbad', description: 'Community effort led to quick resolution', completedAt: '2024-01-05' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const categoryIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    'Potholes': 'car-outline',
    'Garbage': 'trash-outline',
    'Trash Bins': 'trash-bin-outline',
    'Sanitation': 'water-outline',
    'Street Lights': 'bulb-outline',
    'Water Supply': 'water-outline',
    'Drainage': 'water-outline',
  };

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    return categoryIcons[category] || 'construct';
  };

  const getColorSchemeColors = (colorScheme: string) => {
    switch (colorScheme) {
      case 'orange':
        return { primary: '#FF6B35', secondary: '#FF9800' };
      case 'green':
        return { primary: '#10B981', secondary: '#4CAF50' };
      case 'blue':
        return { primary: '#3B82F6', secondary: '#2196F3' };
      case 'purple':
        return { primary: '#8B5CF6', secondary: '#9C27B0' };
      case 'red':
        return { primary: '#EF4444', secondary: '#F44336' };
      case 'yellow':
        return { primary: '#F59E0B', secondary: '#FFC107' };
      default:
        return { primary: '#FF6B35', secondary: '#FF9800' };
    }
  };

  const handleCategoryPress = (category: string) => {
    // @ts-expect-error: navigation type mismatch
    navigation.navigate('Department', { department: category });
  };

  const handleReportIssue = () => {
    // @ts-expect-error: navigation type mismatch
    navigation.navigate('Complaint');
  };

  const handleTrackIssues = () => {
    // Navigate to the Profile tab
    if (tabNavigation) {
      try {
        tabNavigation.navigateToTab('Profile');
      } catch (error) {
        console.error('Tab navigation failed:', error);
        // Fallback to React Navigation
        try {
          (navigation as any).navigate('Reports');
        } catch (navError) {
          console.error('React Navigation also failed:', navError);
        }
      }
    } else {
      // Direct React Navigation fallback
      try {
        (navigation as any).navigate('Reports');
      } catch (navError) {
        console.error('Navigation failed:', navError);
      }
    }
  };

  const handleViewAllIssues = () => {
    // Navigate to the Issues tab
    if (tabNavigation) {
      try {
        tabNavigation.navigateToTab('Issues');
      } catch (error) {
        console.error('Tab navigation failed:', error);
        try {
          (navigation as any).navigate('PublicIssues');
        } catch (navError) {
          console.error('React Navigation also failed:', navError);
        }
      }
    } else {
      try {
        (navigation as any).navigate('PublicIssues');
      } catch (navError) {
        console.error('Navigation failed:', navError);
      }
    }
  };

  const handleViewMoreUpdates = () => {
    // Navigate to the Alerts tab
    if (tabNavigation) {
      try {
        tabNavigation.navigateToTab('Alerts');
      } catch (error) {
        console.error('Tab navigation failed:', error);
      }
    } else {
      console.log('Tab navigation not available for Alerts');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
    
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        bounces={false}
        overScrollMode="never"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBackground}>
            <View style={styles.headerBackgroundOverlay} />
            
            
            <View style={styles.headerBackgroundImages}>
              {/* Background Illustrations */}
              <View style={styles.cityscape}>
                <Ionicons name="business" size={45} color="rgba(33, 150, 243, 0.12)" />
              </View>
              <View style={styles.homeIcon}>
                <Ionicons name="home" size={35} color="rgba(76, 175, 80, 0.1)" />
              </View>
              <View style={styles.carIcon}>
                <Ionicons name="car" size={30} color="rgba(255, 193, 7, 0.1)" />
              </View>
              <View style={styles.libraryIcon}>
                <Ionicons name="library" size={25} color="rgba(156, 39, 176, 0.08)" />
              </View>
              <View style={styles.schoolIcon}>
                <Ionicons name="school" size={28} color="rgba(255, 87, 34, 0.09)" />
              </View>
              
              {/* Jharkhand Cultural Motifs */}
              <View style={styles.leafMotif}>
                <Ionicons name="leaf" size={32} color="rgba(76, 175, 80, 0.08)" />
              </View>
              <View style={styles.flowerMotif}>
                <Ionicons name="flower" size={24} color="rgba(233, 30, 99, 0.07)" />
              </View>
              <View style={styles.diamondMotif}>
                <Ionicons name="diamond" size={20} color="rgba(63, 81, 181, 0.06)" />
              </View>
            </View>
          </View>
          
          <View style={styles.headerContent}>
            {/* Enhanced State Emblem */}
            <View style={styles.stateEmblem}>
              <View style={styles.emblemContainer}>
                <View style={styles.emblemCircle}>
                  <Ionicons name="shield" size={20} color="#FFD700" />
                </View>
                <View style={styles.emblemLeaf}>
                  <Ionicons name="leaf" size={16} color="#4CAF50" />
                </View>
              </View>
              <Text style={styles.stateName}>झारखंड सरकार</Text>
              <Text style={styles.stateNameEn}>Government of Jharkhand</Text>
              <View style={styles.stateTagline}>
                <Ionicons name="diamond-outline" size={12} color="#FFD700" />
                <Text style={styles.stateTaglineText}>Land of Forests & Minerals</Text>
                <Ionicons name="diamond-outline" size={12} color="#FFD700" />
              </View>
            </View>
            <Text style={styles.title}>Civic Issue Reporter</Text>
            <Text style={styles.subtitle}>नागरिक समस्या रिपोर्टर</Text>
          </View>
        </View>

        {/* Enhanced Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroBackground}>
            <View style={styles.heroBackgroundOverlay} />
            <View style={styles.heroBackgroundImages}>
              {/* Clean City & Civic Reporting Illustrations */}
              <View style={styles.cityIllustration}>
                <Ionicons name="business" size={45} color="rgba(33, 150, 243, 0.12)" />
              </View>
              <View style={styles.peopleReporting}>
                <Ionicons name="people" size={40} color="rgba(76, 175, 80, 0.15)" />
              </View>
              <View style={styles.cleanEnvironment}>
                <Ionicons name="leaf" size={38} color="rgba(76, 175, 80, 0.13)" />
              </View>
              <View style={styles.mobileReporting}>
                <Ionicons name="phone-portrait" size={35} color="rgba(33, 150, 243, 0.14)" />
              </View>
              <View style={styles.communityAction}>
                <Ionicons name="hand-left" size={32} color="rgba(76, 175, 80, 0.11)" />
              </View>
            </View>
          </View>
          
          <View style={styles.heroContent}>
            {/* Government Emblem */}
            <View style={styles.emblemSection}>
              <Image 
                source={require('../../../assets/jharkhand-emblem.png')} 
                style={styles.standaloneEmblem}
                resizeMode="contain"
              />
            </View>
            
            {/* Main Title */}
            <View style={styles.heroTitleContainer}>
              <Text style={styles.heroTitle} numberOfLines={1} adjustsFontSizeToFit={true}>Make Jharkhand Better</Text>
              <Text style={styles.heroTitleHindi}>झारखंड को बेहतर बनाएं</Text>
            </View>
            
            {/* Enhanced Subtitle */}
            <View style={styles.heroSubtitleContainer}>
              <Text style={styles.heroSubtitle}>{t('home.yourVoiceMatters')}</Text>
              <TouchableOpacity style={styles.heroCallToAction}>
                <Ionicons name="arrow-forward-circle" size={14} color="#666" />
                <Text style={styles.heroCallToActionText}>{t('home.startMakingDifference')}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Process Flow Icons */}
            <View style={styles.processFlowContainer}>
              <View style={styles.processStep}>
                <View style={styles.processIconCircle}>
                  <Ionicons name="camera" size={18} color="#2E7D32" />
                </View>
                <Text style={styles.processStepLabel}>{t('home.report')}</Text>
              </View>
              <View style={styles.processArrow}>
                <Ionicons name="arrow-forward" size={16} color="#4CAF50" />
              </View>
              <View style={styles.processStep}>
                <View style={styles.processIconCircle}>
                  <Ionicons name="people" size={18} color="#2E7D32" />
                </View>
                <Text style={styles.processStepLabel}>{t('home.track')}</Text>
              </View>
              <View style={styles.processArrow}>
                <Ionicons name="arrow-forward" size={16} color="#4CAF50" />
              </View>
              <View style={styles.processStep}>
                <View style={styles.processIconCircle}>
                  <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                </View>
                <Text style={styles.processStepLabel}>{t('home.resolve')}</Text>
              </View>
            </View>
            
            {/* Primary Action Button */}
            <TouchableOpacity style={styles.heroActionButton} onPress={handleReportIssue}>
              <Ionicons name="camera" size={22} color="#fff" />
              <Text style={styles.heroActionButtonText}>{t('home.reportIssue')}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>


        {/* Secondary Buttons */}
        <View style={styles.secondaryButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleTrackIssues}>
            <Ionicons name="list-outline" size={20} color="#2E7D32" />
            <Text style={styles.secondaryButtonText}>{t('home.trackIssues')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleViewAllIssues}>
            <Ionicons name="eye-outline" size={20} color="#2E7D32" />
            <Text style={styles.secondaryButtonText}>{t('home.viewAllIssues')}</Text>
          </TouchableOpacity>
        </View>


        {/* Enhanced Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCardResolved}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>{resolvedCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{t('home.resolved')}</Text>
          </View>
          <View style={styles.statCardProgress}>
            <View style={styles.statIconContainer}>
              <Ionicons name="sync" size={24} color="#FF9800" />
            </View>
            <Text style={styles.statNumber}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>{t('home.inProgress')}</Text>
          </View>
          <View style={styles.statCardResponse}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={24} color="#2196F3" />
            </View>
            <Text style={styles.statNumber}>
              {avgResponseHours === 0 ? 'N/A' : `${avgResponseHours} ${t('home.hours')}`}
            </Text>
            <Text style={styles.statLabel}>{t('home.avgResponse')}</Text>
          </View>
        </View>
        
        {/* Error message if data failed to load */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={20} color="#FF9800" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Indicators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.currentInitiatives')}</Text>
          {initiatives.map((initiative, index) => {
            const colors = getColorSchemeColors(initiative.colorScheme || 'orange');
            return (
              <View key={index} style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Ionicons 
                    name={initiative.iconName || 'construct'} 
                    size={20} 
                    color={colors.secondary} 
                  />
                  <Text style={styles.progressTitle}>{initiative.title}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFillDynamic,
                    { 
                      width: `${initiative.completionPercentage}%`,
                      backgroundColor: colors.primary
                    }
                  ]}>
                    <View style={styles.progressIcon}>
                      <Ionicons name={initiative.iconName || 'construct'} size={12} color="#fff" />
                    </View>
                  </View>
                </View>
                <Text style={styles.progressText}>
                  {initiative.footerLeft} • {initiative.footerRight}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Success Stories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.successStories')}</Text>
          {successStories.map((story, index) => {
            const categoryIcon = getCategoryIcon(story.category);
            const completedDate = new Date(story.completedAt);
            const formattedDate = completedDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
            
            return (
              <View key={index} style={styles.successCardEnhanced}>
                <View style={styles.successThumbnail}>
                  <Ionicons name={categoryIcon} size={32} color="#FF9800" />
                </View>
                <View style={styles.successContent}>
                  <View style={styles.successHeader}>
                    <View style={styles.successIcon}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    </View>
                    <Text style={styles.successTitle}>{story.title}</Text>
                  </View>
                  <Text style={styles.successDescription}>
                    {story.description}
                  </Text>
                  <Text style={styles.successTime}>Completed: {formattedDate}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.announcements')}</Text>
          {announcements.map((announcement) => {
            const announcementDate = announcement.date ? new Date(announcement.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : new Date().toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
            
            return (
              <View key={announcement.id} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <View style={styles.announcementTitleRow}>
                    <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  </View>
                  <View style={[styles.priorityBadgeEnhanced, { 
                    backgroundColor: announcement.priority === 'HIGH' ? '#FFEBEE' : announcement.priority === 'MEDIUM' ? '#FFF3E0' : '#E8F5E9',
                    borderColor: announcement.priority === 'HIGH' ? '#f44336' : announcement.priority === 'MEDIUM' ? '#FF9800' : '#4CAF50'
                  }]}>
                    <Ionicons 
                      name={announcement.priority === 'HIGH' ? 'alert-circle' : announcement.priority === 'MEDIUM' ? 'construct' : 'medical'} 
                      size={14} 
                      color={announcement.priority === 'HIGH' ? '#f44336' : announcement.priority === 'MEDIUM' ? '#FF9800' : '#4CAF50'} 
                    />
                    <Text style={[styles.priorityTextEnhanced, { 
                      color: announcement.priority === 'HIGH' ? '#f44336' : announcement.priority === 'MEDIUM' ? '#FF9800' : '#4CAF50' 
                    }]}>
                      {announcement.priority}
                    </Text>
                  </View>
                </View>
                <Text style={styles.announcementDescription}>{announcement.description}</Text>
                <View style={styles.announcementFooter}>
                  <Text style={styles.announcementDateFooter}>{announcementDate}</Text>
                </View>
              </View>
            );
          })}
          
          <TouchableOpacity style={styles.viewMoreButton} onPress={handleViewMoreUpdates}>
            <Text style={styles.viewMoreText}>{t('home.viewMoreUpdates')}</Text>
            <Ionicons name="arrow-forward" size={16} color="#2E7D32" />
          </TouchableOpacity>  
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    minHeight: 140,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    // Gradient background from dark green to light green
    backgroundColor: '#1B5E20',
    // Add gradient effect using multiple layers
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  headerBackgroundIllustrations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerIcon1: {
    position: 'absolute',
    top: 20,
    left: 30,
  },
  headerIcon2: {
    position: 'absolute',
    top: 15,
    right: 40,
  },
  headerIcon3: {
    position: 'absolute',
    bottom: 30,
    left: 15,
  },
  headerIcon4: {
    position: 'absolute',
    top: 45,
    left: '50%',
    marginLeft: -15,
  },
  headerIcon5: {
    position: 'absolute',
    bottom: 15,
    right: 25,
  },
  headerIcon6: {
    position: 'absolute',
    top: 35,
    right: 15,
  },
  headerIcon7: {
    position: 'absolute',
    bottom: 45,
    left: '40%',
  },
  headerIcon8: {
    position: 'absolute',
    top: 60,
    right: 60,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  stateEmblem: {
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 1,
  },
  emblemContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emblemCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  emblemLeaf: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  stateTagline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 15,
  },
  stateTaglineText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '500',
    marginHorizontal: 6,
  },
  stateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 2,
  },
  stateNameEn: {
    fontSize: 12,
    color: '#C8E6C9',
    textAlign: 'center',
    fontWeight: '500',
  },
  governmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    textAlign: 'center',
  },
  headerStatsText: {
    color: '#E8F5E8',
    fontSize: 11,
    fontWeight: '500',
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#E8F5E8',
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    textAlign: 'center',
    fontWeight: '500',
  },
  heroSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.1)',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  heroBackgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 1,
  },
  heroBackgroundImages: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundIcon: {
    position: 'absolute',
    top: 10,
    left: 20,
  },
  backgroundIcon2: {
    top: 40,
    right: 30,
    left: 'auto',
  },
  backgroundIcon3: {
    bottom: 20,
    left: 40,
    top: 'auto',
  },
  backgroundIcon4: {
    bottom: 40,
    right: 20,
    left: 'auto',
    top: 'auto',
  },
  // Hero Background Illustration Styles
  cityIllustration: {
    position: 'absolute',
    top: 15,
    left: 25,
  },
  peopleReporting: {
    position: 'absolute',
    top: 20,
    right: 30,
  },
  cleanEnvironment: {
    position: 'absolute',
    bottom: 25,
    left: 20,
  },
  mobileReporting: {
    position: 'absolute',
    bottom: 20,
    right: 25,
  },
  communityAction: {
    position: 'absolute',
    top: 50,
    left: '50%',
    marginLeft: -16,
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 2,
    position: 'relative',
  },
  heroTitleContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    width: '100%',
  },
  heroIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 4,
    width: '100%',
    minWidth: 200,
  },
  heroTitleHindi: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '500',
  },
  heroSubtitleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  heroCallToAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(158, 158, 158, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginTop: 4,
  },
  heroCallToActionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    borderRadius: 12,
    paddingVertical: 16,
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    marginBottom: 6,
  },
  heroStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(46, 125, 50, 0.2)',
    alignSelf: 'center',
  },
  heroStatNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 2,
  },
  heroStatLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  heroActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  heroActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  // Illustration Section Styles
  heroIllustrationSection: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  illustrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  illustrationItem: {
    alignItems: 'center',
    flex: 1,
  },
  illustrationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  illustrationText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  illustrationArrow: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  illustrationSubtext: {
    alignItems: 'center',
  },
  illustrationDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // State Emblem Watermark Styles
  stateEmblemWatermark: {
    position: 'absolute',
    top: 20,
    right: 20,
    opacity: 0.8,
    zIndex: 1,
  },
  emblemSection: {
    alignItems: 'center',
    marginBottom: 5,
    marginTop: -35,
  },
  standaloneEmblem: {
    width: 150,
    height: 150,
  },

  // Header Background Elements
  headerBackgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(27, 94, 32, 0.1)',
  },
  headerBackgroundImages: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  cityscape: {
    position: 'absolute',
    top: 15,
    left: 30,
  },
  homeIcon: {
    position: 'absolute',
    top: 45,
    right: 80,
  },
  carIcon: {
    position: 'absolute',
    bottom: 20,
    left: 60,
  },
  libraryIcon: {
    position: 'absolute',
    top: 25,
    right: 150,
  },
  schoolIcon: {
    position: 'absolute',
    bottom: 30,
    right: 40,
  },
  leafMotif: {
    position: 'absolute',
    top: 60,
    left: 120,
  },
  flowerMotif: {
    position: 'absolute',
    bottom: 50,
    left: 150,
  },
  diamondMotif: {
    position: 'absolute',
    top: 35,
    right: 200,
  },
  // Enhanced Stat Cards
  statCardResolved: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statCardProgress: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  statCardResponse: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  // Enhanced Progress Bar Styles
  progressFillRoad: {
    height: 6,
    backgroundColor: '#FF9800',
    borderRadius: 3,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 8,
  },
  progressFillClean: {
    height: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 3,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 8,
  },
  progressFillDynamic: {
    height: 12,
    borderRadius: 6,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 8,
  },
  progressIcon: {
    position: 'absolute',
    right: 4,
    top: 0,
  },
  // Enhanced Success Stories Styles
  successCardEnhanced: {
    backgroundColor: '#F8FFF8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successContent: {
    flex: 1,
  },
  // Enhanced Government Updates Styles
  announcementTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  announcementDateSmall: {
    fontSize: 11,
    color: '#999',
    fontWeight: '400',
  },
  priorityBadgeEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  priorityTextEnhanced: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  viewMoreText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  // Process Flow Styles
  processFlowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  processStep: {
    alignItems: 'center',
  },
  processStepLabel: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    marginTop: 4,
  },
  processIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
  },
  processArrow: {
    marginHorizontal: 10,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  secondaryButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  secondaryButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  announcementCard: {
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
  announcementHeader: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    color: '#666',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  announcementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  announcementFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'flex-end',
  },
  announcementDateFooter: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  // Progress Indicators Styles
  progressCard: {
    backgroundColor: 'white',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  // Success Stories Styles
  successCard: {
    backgroundColor: 'white',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  successIcon: {
    marginRight: 12,
  },
 
  successTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  successDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  successTime: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  // Priority Badge Styles
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Add padding to show above bottom navigation
  },
  // Loading and Error States
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
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default HomeScreen;

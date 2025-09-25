import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface AppTourModalProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
}

interface TourStep {
  id: number;
  title: string;
  description: string;
  features: string[];
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  mockupType: 'home' | 'report' | 'track' | 'profile' | 'community';
}

const AppTourModal: React.FC<AppTourModalProps> = ({
  visible,
  onClose,
  userName = 'User',
}) => {
  // const { t } = useTranslation(); // Not used in this component
  const [currentStep, setCurrentStep] = useState(0);
  
  // Animation values
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.9)).current;

  const tourSteps: TourStep[] = [
    {
      id: 0,
      title: 'Welcome to Civic Issue Reporter!',
      description: 'Your voice matters in building a better community. Let\'s explore how you can make a difference.',
      features: [
        'Report civic issues instantly',
        'Track progress in real-time',
        'Connect with your community',
        'Make your city better'
      ],
      icon: 'home',
      color: '#4CAF50',
      mockupType: 'home'
    },
    {
      id: 1,
      title: 'Report Issues Easily',
      description: 'Found a pothole, broken streetlight, or garbage issue? Report it in seconds with photos and location.',
      features: [
        'Take photos with automatic location',
        'Choose from 7 issue categories',
        'Add detailed descriptions',
        'Submit with one tap'
      ],
      icon: 'camera',
      color: '#FF6B35',
      mockupType: 'report'
    },
    {
      id: 2,
      title: 'Track Your Reports',
      description: 'Stay updated on all your reported issues. See status changes, government responses, and resolution progress.',
      features: [
        'Real-time status updates',
        'Government department responses',
        'Photo evidence of fixes',
        'Community upvotes and comments'
      ],
      icon: 'list',
      color: '#2196F3',
      mockupType: 'track'
    },
    {
      id: 3,
      title: 'Explore Community Issues',
      description: 'See what others are reporting in your area. Support important issues and stay informed about your neighborhood.',
      features: [
        'Browse nearby issues',
        'Filter by category and status',
        'Upvote important issues',
        'View resolution statistics'
      ],
      icon: 'people',
      color: '#9C27B0',
      mockupType: 'community'
    },
    {
      id: 4,
      title: 'Manage Your Profile',
      description: 'Keep track of your contributions, manage settings, and access help resources.',
      features: [
        'View your impact statistics',
        'Manage account settings',
        'Access help and support',
        'Switch between languages'
      ],
      icon: 'person',
      color: '#FF9800',
      mockupType: 'profile'
    }
  ];

  useEffect(() => {
    if (visible) {
      startEntranceAnimation();
      
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (currentStep > 0) {
          handlePrevious();
        } else {
          onClose();
        }
        return true;
      });
      
      return () => backHandler.remove();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      animateStepChange();
    }
  }, [currentStep]);

  const startEntranceAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateStepChange = () => {
    Animated.sequence([
      Animated.timing(slideAnimation, {
        toValue: -width * 0.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const renderMockup = (type: string) => {

    switch (type) {
      case 'home':
        return (
          <View style={styles.mockupContainer}>
            <View style={styles.mockupHeader}>
              <Text style={styles.mockupHeaderText}>झारखंड सरकार</Text>
            </View>
            <View style={styles.mockupContent}>
              <View style={styles.mockupStatsRow}>
                <View style={styles.mockupStat}>
                  <Text style={styles.mockupStatNumber}>1,247</Text>
                  <Text style={styles.mockupStatLabel}>Resolved</Text>
                </View>
                <View style={styles.mockupStat}>
                  <Text style={styles.mockupStatNumber}>89</Text>
                  <Text style={styles.mockupStatLabel}>In Progress</Text>
                </View>
                <View style={styles.mockupStat}>
                  <Text style={styles.mockupStatNumber}>24h</Text>
                  <Text style={styles.mockupStatLabel}>Avg Response</Text>
                </View>
              </View>
              <View style={styles.mockupButton}>
                <Ionicons name="camera" size={16} color="white" />
                <Text style={styles.mockupButtonText}>Report Issue</Text>
              </View>
            </View>
          </View>
        );

      case 'report':
        return (
          <View style={styles.mockupContainer}>
            <View style={styles.mockupHeader}>
              <Text style={styles.mockupHeaderText}>Report Issue</Text>
            </View>
            <View style={styles.mockupContent}>
              <View style={styles.mockupForm}>
                <View style={styles.mockupField}>
                  <Text style={styles.mockupFieldLabel}>Category</Text>
                  <View style={styles.mockupDropdown}>
                    <Text>Potholes</Text>
                  </View>
                </View>
                <View style={styles.mockupPhotoArea}>
                  <Ionicons name="camera" size={32} color="#ccc" />
                  <Text style={styles.mockupPhotoText}>Take Photo</Text>
                </View>
                <View style={styles.mockupLocationArea}>
                  <Ionicons name="location" size={16} color="#4CAF50" />
                  <Text style={styles.mockupLocationText}>Location captured</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'track':
        return (
          <View style={styles.mockupContainer}>
            <View style={styles.mockupHeader}>
              <Text style={styles.mockupHeaderText}>My Issues</Text>
            </View>
            <View style={styles.mockupContent}>
              <View style={styles.mockupIssueCard}>
                <View style={styles.mockupIssueHeader}>
                  <Text style={styles.mockupIssueTitle}>Pothole on Main Street</Text>
                  <View style={[styles.mockupStatusBadge, { backgroundColor: '#FF9800' }]}>
                    <Text style={styles.mockupStatusText}>In Progress</Text>
                  </View>
                </View>
                <Text style={styles.mockupIssueDate}>Reported 2 days ago</Text>
              </View>
              <View style={styles.mockupIssueCard}>
                <View style={styles.mockupIssueHeader}>
                  <Text style={styles.mockupIssueTitle}>Broken Street Light</Text>
                  <View style={[styles.mockupStatusBadge, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.mockupStatusText}>Resolved</Text>
                  </View>
                </View>
                <Text style={styles.mockupIssueDate}>Resolved yesterday</Text>
              </View>
            </View>
          </View>
        );

      case 'community':
        return (
          <View style={styles.mockupContainer}>
            <View style={styles.mockupHeader}>
              <Text style={styles.mockupHeaderText}>Community Issues</Text>
            </View>
            <View style={styles.mockupContent}>
              <View style={styles.mockupFilterRow}>
                <View style={styles.mockupFilter}>
                  <Text style={styles.mockupFilterText}>All</Text>
                </View>
                <View style={styles.mockupFilter}>
                  <Text style={styles.mockupFilterText}>Nearby</Text>
                </View>
              </View>
              <View style={styles.mockupIssueCard}>
                <Text style={styles.mockupIssueTitle}>Garbage Collection Issue</Text>
                <View style={styles.mockupIssueFooter}>
                  <Text style={styles.mockupIssueLocation}>📍 Ranchi</Text>
                  <View style={styles.mockupUpvotes}>
                    <Ionicons name="arrow-up" size={12} color="#4CAF50" />
                    <Text style={styles.mockupUpvoteText}>23</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      case 'profile':
        return (
          <View style={styles.mockupContainer}>
            <View style={styles.mockupHeader}>
              <Text style={styles.mockupHeaderText}>Profile</Text>
            </View>
            <View style={styles.mockupContent}>
              <View style={styles.mockupProfileInfo}>
                <View style={styles.mockupAvatar}>
                  <Text style={styles.mockupAvatarText}>U</Text>
                </View>
                <Text style={styles.mockupUserName}>{userName}</Text>
              </View>
              <View style={styles.mockupStatsGrid}>
                <View style={styles.mockupProfileStat}>
                  <Text style={styles.mockupProfileStatNumber}>5</Text>
                  <Text style={styles.mockupProfileStatLabel}>Issues Reported</Text>
                </View>
                <View style={styles.mockupProfileStat}>
                  <Text style={styles.mockupProfileStatNumber}>3</Text>
                  <Text style={styles.mockupProfileStatLabel}>Resolved</Text>
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return <View style={styles.mockupContainer} />;
    }
  };

  const currentTourStep = tourSteps[currentStep];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnimation,
              transform: [
                { scale: scaleAnimation },
                { translateX: slideAnimation },
              ],
            },
          ]}
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {tourSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: index <= currentStep ? currentTourStep.color : '#E0E0E0',
                  },
                ]}
              />
            ))}
          </View>

          {/* Step Counter */}
          <Text style={styles.stepCounter}>
            {currentStep + 1} of {tourSteps.length}
          </Text>

          {/* Content */}
          <ScrollView 
            style={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${currentTourStep.color}15` }]}>
              <Ionicons 
                name={currentTourStep.icon} 
                size={40} 
                color={currentTourStep.color} 
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>{currentTourStep.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{currentTourStep.description}</Text>

            {/* Mockup */}
            {renderMockup(currentTourStep.mockupType)}

            {/* Features List */}
            <View style={styles.featuresList}>
              {currentTourStep.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[styles.featureDot, { backgroundColor: currentTourStep.color }]} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.prevButton,
                currentStep === 0 && styles.disabledButton,
              ]}
              onPress={handlePrevious}
              disabled={currentStep === 0}
            >
              <Ionicons name="chevron-back" size={20} color={currentStep === 0 ? '#ccc' : '#666'} />
              <Text style={[styles.navButtonText, currentStep === 0 && styles.disabledText]}>
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, styles.nextButton, { backgroundColor: currentTourStep.color }]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons 
                name={currentStep === tourSteps.length - 1 ? 'checkmark' : 'chevron-forward'} 
                size={20} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={onClose}>
            <Text style={styles.skipButtonText}>Skip Tour</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '90%',
    maxHeight: '90%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  stepCounter: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  prevButton: {
    backgroundColor: '#f5f5f5',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  navButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  nextButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginRight: 4,
  },
  disabledText: {
    color: '#ccc',
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'underline',
  },
  // Mockup Styles
  mockupContainer: {
    width: width * 0.6,
    height: height * 0.35,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  mockupHeader: {
    backgroundColor: '#4CAF50',
    padding: 12,
    alignItems: 'center',
  },
  mockupHeaderText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  mockupContent: {
    flex: 1,
    padding: 16,
  },
  mockupStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  mockupStat: {
    alignItems: 'center',
  },
  mockupStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  mockupStatLabel: {
    fontSize: 10,
    color: '#666',
  },
  mockupButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockupButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  mockupForm: {
    flex: 1,
  },
  mockupField: {
    marginBottom: 16,
  },
  mockupFieldLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  mockupDropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 4,
  },
  mockupPhotoArea: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
  },
  mockupPhotoText: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 8,
  },
  mockupLocationArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 4,
  },
  mockupLocationText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  mockupIssueCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  mockupIssueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mockupIssueTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  mockupStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mockupStatusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  mockupIssueDate: {
    fontSize: 10,
    color: '#999',
  },
  mockupFilterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  mockupFilter: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  mockupFilterText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: '600',
  },
  mockupIssueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  mockupIssueLocation: {
    fontSize: 10,
    color: '#666',
  },
  mockupUpvotes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockupUpvoteText: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 2,
  },
  mockupProfileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mockupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mockupAvatarText: {
    color: 'white',
    fontWeight: '600',
  },
  mockupUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  mockupStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mockupProfileStat: {
    alignItems: 'center',
  },
  mockupProfileStatNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  mockupProfileStatLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});

export default AppTourModal;

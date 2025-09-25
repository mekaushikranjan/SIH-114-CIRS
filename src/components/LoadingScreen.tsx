
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
  type?: 'app' | 'login' | 'register' | 'general' | 'splash';
  onLoadingComplete?: () => void;
  minLoadingTime?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  showProgress = false,
  progress = 0,
  type = 'general',
  onLoadingComplete,
  minLoadingTime = 2000
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0.5)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  
  // Progress simulation state (for app initialization)
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [showSimulatedProgress, setShowSimulatedProgress] = useState(false);

  // Get loading message based on type
  const getLoadingMessage = () => {
    if (typeof message === 'string' && message.length > 0) return message;
    
    switch (type) {
      case 'app':
        return 'Initializing Civic Reporter...';
      case 'login':
        return 'Signing you in...';
      case 'register':
        return 'Creating your account...';
      case 'splash':
        return 'Civic Issue Reporter';
      default:
        return 'Loading...';
    }
  };

  // Get loading subtitle based on type
  const getLoadingSubtitle = () => {
    switch (type) {
      case 'app':
        return 'Government of Jharkhand';
      case 'login':
        return 'Please wait while we authenticate you';
      case 'register':
        return 'Setting up your account';
      case 'splash':
        return 'Government of Jharkhand';
      default:
        return 'Please wait';
    }
  };

  useEffect(() => {
    // Spinning animation for the border
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulse animation for the logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Fade animation for loading text
    const fadeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();
    fadeAnimation.start();

    // Handle splash screen timer
    if (type === 'splash' && onLoadingComplete) {
      const timer = setTimeout(() => {
        onLoadingComplete();
      }, 2000); // Show splash for 2 seconds
      
      return () => {
        clearTimeout(timer);
        spinAnimation.stop();
        pulseAnimation.stop();
        fadeAnimation.stop();
      };
    }
    
    // Handle app initialization progress simulation
    if (type === 'app' && onLoadingComplete) {
      // Simulate app initialization progress
      const progressInterval = setInterval(() => {
        setSimulatedProgress(prev => {
          if (prev >= 1) {
            clearInterval(progressInterval);
            setTimeout(() => {
              onLoadingComplete();
            }, 500);
            return 1;
          }
          return prev + 0.1;
        });
      }, 200);

      // Show progress after a short delay
      setTimeout(() => {
        setShowSimulatedProgress(true);
      }, 500);

      // Ensure minimum loading time
      const minTimeTimeout = setTimeout(() => {
        if (simulatedProgress < 1) {
          setSimulatedProgress(1);
        }
      }, minLoadingTime);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(minTimeTimeout);
        spinAnimation.stop();
        pulseAnimation.stop();
        fadeAnimation.stop();
      };
    }

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
      fadeAnimation.stop();
    };
  }, [type, onLoadingComplete, minLoadingTime, simulatedProgress]);

  useEffect(() => {
    // Update progress animation
    const currentProgress = type === 'app' ? simulatedProgress : progress;
    const shouldShowProgress = type === 'app' ? showSimulatedProgress : showProgress;
    
    if (shouldShowProgress) {
      Animated.timing(progressValue, {
        toValue: currentProgress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, showProgress, simulatedProgress, showSimulatedProgress, type]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressInterpolate = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Create SVG circular loader with 3 green arcs
// Create SVG circular loader with 3 green arcs (evenly spaced)
// Create SVG circular loader with 3 green arcs (clearly visible)
const createSVGLoader = () => {
  const size = 150;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Arc length = 1/6 of circle (≈60°)
  const arcLength = circumference / 6;
  // Gap length = arc length (same spacing as arc)
  const gap = arcLength;

  return (
    <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E9E6E9"
        strokeWidth={strokeWidth}
        fill="none"
      />

      {/* Green arcs (3 evenly spaced) */}
      {[0, 1, 2].map((i) => (
        <Circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2E7D32"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          // Draw arc + leave space for gap
          strokeDasharray={`${arcLength}, ${circumference}`}
          // Offset each arc by 120° (1/3 of circle)
          strokeDashoffset={-(i * circumference) / 3}
          fill="none"
        />
      ))}
    </Svg>
  );
};


  // Render splash screen version
  if (type === 'splash') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f0f7f0" />
        <View style={styles.loaderContainer}>
          {/* Animated spinning SVG loader */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            {createSVGLoader()}
          </Animated.View>

          {/* Fixed pulsating logo in center */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: pulseValue }],
              },
            ]}
          >
            <Image
              source={require('../../assets/Jharkhand_Rajakiya_Chihna.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* App name */}
          <View style={styles.loadingTextContainer}>
            <Text style={styles.appName}>{getLoadingMessage()}</Text>
            <Text style={styles.subtitle}>{getLoadingSubtitle()}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f7f0" />
      <View style={styles.loaderContainer}>
        {/* Animated spinning SVG loader */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          {createSVGLoader()}
        </Animated.View>

        {/* Fixed pulsating logo in center */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseValue }],
            },
          ]}
        >
          <Image
            source={require('../../assets/Jharkhand_Rajakiya_Chihna.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Loading text */}
        <View style={styles.loadingTextContainer}>
          <Text style={styles.loadingText}>{getLoadingMessage()}</Text>
          <Text style={styles.subtitle}>{getLoadingSubtitle()}</Text>
          <LoadingDots />
        </View>

        {/* Progress bar */}
        {((type === 'app' && showSimulatedProgress) || (type !== 'app' && showProgress)) && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressInterpolate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((type === 'app' ? simulatedProgress : progress) * 100)}%
            </Text>
          </View>
        )}

        {/* Government branding (non-interactive, below content) */}
        <View style={styles.brandingContainer} pointerEvents="none">
          <Ionicons name="shield-checkmark" size={16} color="#2E7D32" />
          <Text style={styles.brandingText}>Government of Jharkhand</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};


// Animated dots component
const LoadingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      const duration = 500;
      const delay = 200;

      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(dot1, {
              toValue: 0,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(dot2, {
              toValue: 0,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(dot3, {
              toValue: 0,
              duration,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animateDots();
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.Text style={[styles.dot, { opacity: dot1 }]}>•</Animated.Text>
      <Animated.Text style={[styles.dot, { opacity: dot2 }]}>•</Animated.Text>
      <Animated.Text style={[styles.dot, { opacity: dot3 }]}>•</Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f7f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundCircle: {
    width: 150,
    height: 150,
    borderRadius: 110,
    backgroundColor: 'transparent',
    borderWidth: 8,
    borderColor: 'rgba(46, 125, 50, 0.1)',
    position: 'absolute',
  },
  borderContainer: {
    width: 150,
    height: 150,
    position: 'absolute',
    borderRadius: 110,
  },
  borderSegment: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 110,
    borderWidth: 0,
    borderColor: 'transparent',
    borderTopColor: '#2E7D32',
    borderTopWidth: 12,
    // Only show top border for arc segments
    borderLeftColor: 'transparent',
    borderLeftWidth: 0,
    borderRightColor: 'transparent', 
    borderRightWidth: 0,
    borderBottomColor: 'transparent',
    borderBottomWidth: 0,
    transform: [{ rotate: '0deg' }],
  },
  shadowCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 85,
    borderWidth: 12,
    borderColor: 'transparent',
    borderTopColor: '#000',
    borderTopWidth: 12,
    borderLeftColor: '#000',
    borderLeftWidth: 12,
    borderRightColor: '#000', 
    borderRightWidth: 12,
    // Fixed shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    opacity: 0.1, // Make shadow subtle
  },
  svgContainer: {
    position: 'absolute',
  },
  svgBorder: {
    position: 'absolute',
  },
  logoContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  loadingTextContainer: {
    alignItems: 'center',
    marginTop: 300,
    paddingHorizontal: 24,
    zIndex: 5,
  },
  loadingText: {
    color: '#2E7D32',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  appName: {
    color: '#2E7D32',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dot: {
    color: '#2E7D32',
    fontSize: 20,
    marginHorizontal: 2,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 20,
    zIndex: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(46, 125, 50, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '600',
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 28,
    zIndex: 5,
  },
  brandingText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default LoadingScreen;
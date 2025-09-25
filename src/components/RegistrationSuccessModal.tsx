import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface RegistrationSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
}

const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  visible,
  onClose,
  userName = 'User',
}) => {
  const { t } = useTranslation();
  
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.3)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkRotate = useRef(new Animated.Value(0)).current;
  const confettiAnimation = useRef(new Animated.Value(0)).current;
  const textSlideY = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      startEntranceAnimation();
      startContinuousAnimations();
      
      // Handle back button
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        onClose();
        return true;
      });
      
      return () => backHandler.remove();
    } else {
      resetAnimations();
    }
  }, [visible]);

  const startEntranceAnimation = () => {
    // Staggered entrance animation
    Animated.sequence([
      // Overlay fade in
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Modal scale and fade in
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // After modal appears, animate checkmark
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.spring(checkmarkScale, {
            toValue: 1,
            tension: 150,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(checkmarkRotate, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // After checkmark, animate text and confetti
        Animated.parallel([
          Animated.spring(textSlideY, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(buttonScale, {
            toValue: 1,
            tension: 120,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });
  };

  const startContinuousAnimations = () => {
    // Pulse animation for success icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const resetAnimations = () => {
    overlayOpacity.setValue(0);
    modalScale.setValue(0.3);
    modalOpacity.setValue(0);
    checkmarkScale.setValue(0);
    checkmarkRotate.setValue(0);
    confettiAnimation.setValue(0);
    textSlideY.setValue(30);
    buttonScale.setValue(0.8);
    pulseAnimation.setValue(1);
  };

  const handleClose = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const renderConfetti = () => {
    const confettiItems = [];
    for (let i = 0; i < 12; i++) {
      const randomX = Math.random() * width;
      const randomDelay = Math.random() * 500;
      const randomDuration = 1000 + Math.random() * 1000;
      
      confettiItems.push(
        <Animated.View
          key={i}
          style={[
            styles.confettiItem,
            {
              left: randomX,
              backgroundColor: i % 4 === 0 ? '#4CAF50' : i % 4 === 1 ? '#FF6B35' : i % 4 === 2 ? '#2196F3' : '#FFD700',
              transform: [
                {
                  translateY: confettiAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, height + 50],
                  }),
                },
                {
                  rotate: confettiAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '720deg'],
                  }),
                },
              ],
              opacity: confettiAnimation.interpolate({
                inputRange: [0, 0.1, 0.9, 1],
                outputRange: [0, 1, 1, 0],
              }),
            },
          ]}
        />
      );
    }
    return confettiItems;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Animated Overlay */}
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
            },
          ]}
        />

        {/* Confetti Animation */}
        <View style={styles.confettiContainer}>
          {renderConfetti()}
        </View>

        {/* Success Modal */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: modalOpacity,
              transform: [{ scale: modalScale }],
            },
          ]}
        >
          {/* Government Emblem Background */}
          <View style={styles.emblemBackground}>
            <Ionicons name="shield" size={120} color="rgba(76, 175, 80, 0.1)" />
          </View>

          {/* Success Icon with Animation */}
          <Animated.View
            style={[
              styles.successIconContainer,
              {
                transform: [
                  { scale: Animated.multiply(checkmarkScale, pulseAnimation) },
                  {
                    rotate: checkmarkRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.successIconBg}>
              <Ionicons name="checkmark" size={40} color="white" />
            </View>
            <View style={styles.successIconGlow} />
          </Animated.View>

          {/* Animated Text Content */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                transform: [{ translateY: textSlideY }],
              },
            ]}
          >
            <Text style={styles.successTitle}>Registration Successful!</Text>
            <Text style={styles.successSubtitle}>
              Welcome to Civic Issue Reporter!
            </Text>
            <Text style={styles.welcomeMessage}>
              Hello {userName}! Your account has been created successfully.
            </Text>
            <Text style={styles.benefitsText}>
              You can now report civic issues, track progress, and contribute to making your community better.
            </Text>
          </Animated.View>

          {/* Features List */}
          <Animated.View
            style={[
              styles.featuresList,
              {
                opacity: confettiAnimation,
                transform: [
                  {
                    translateY: confettiAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.featureItem}>
              <Ionicons name="camera" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Report Issues with Photos</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="location" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Track Issue Status</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="people" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Connect with Community</Text>
            </View>
          </Animated.View>

          {/* Animated OK Button */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                transform: [{ scale: buttonScale }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.okButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.okButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </Animated.View>

          {/* Decorative Elements */}
          <View style={styles.decorativeElements}>
            <View style={[styles.decorativeDot, { backgroundColor: '#4CAF50' }]} />
            <View style={[styles.decorativeDot, { backgroundColor: '#FF6B35' }]} />
            <View style={[styles.decorativeDot, { backgroundColor: '#2196F3' }]} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiItem: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 24,
    maxWidth: 400,
    width: '90%',
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  emblemBackground: {
    position: 'absolute',
    top: -20,
    right: -20,
    opacity: 0.5,
  },
  successIconContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  successIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successIconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    top: -10,
    left: -10,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  benefitsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  featuresList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
  },
  okButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  okButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  decorativeElements: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
  },
  decorativeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
});

export default RegistrationSuccessModal;

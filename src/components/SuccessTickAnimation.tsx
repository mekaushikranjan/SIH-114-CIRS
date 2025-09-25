import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface SuccessTickAnimationProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
  duration?: number;
}

const SuccessTickAnimation: React.FC<SuccessTickAnimationProps> = ({
  visible,
  onClose,
  message = 'Issue Submitted Successfully!',
  duration = 3000,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const textScaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
      bounceAnim.setValue(0);
      textOpacityAnim.setValue(0);
      textScaleAnim.setValue(0.8);

      // Start the animation sequence
      const animationSequence = Animated.sequence([
        // Initial appearance with scale and opacity
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        
        // Rotation animation for 3D effect
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        
        // Bounce effect
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        
        // Text animation
        Animated.parallel([
          Animated.timing(textOpacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(textScaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]);

      animationSequence.start();

      // Start pulsing animation for tick mark (repeating show/hide)
      const startPulsingAnimation = () => {
        const pulseSequence = Animated.loop(
          Animated.sequence([
            // Fade out
            Animated.parallel([
              Animated.timing(scaleAnim, {
                toValue: 0.3,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 0.3,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
            // Fade in
            Animated.parallel([
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
            // Wait a bit
            Animated.delay(200),
          ]),
          { iterations: -1 } // Infinite loop
        );
        
        pulseSequence.start();
        return pulseSequence;
      };

      // Start pulsing after initial animation
      const pulseTimer = setTimeout(() => {
        startPulsingAnimation();
      }, 2000); // Start pulsing after 2 seconds

      // Auto close after total duration
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => {
        clearTimeout(timer);
        clearTimeout(pulseTimer);
      };
    }
  }, [visible, duration, onClose]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scaleInterpolate = Animated.multiply(scaleAnim, bounceAnim);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.container}>
            {/* 3D Tick Mark */}
            <Animated.View
              style={[
                styles.tickContainer,
                {
                  transform: [
                    { scale: scaleInterpolate },
                    { rotateY: rotateInterpolate },
                    { perspective: 1000 },
                  ],
                  opacity: opacityAnim,
                },
              ]}
            >
              {/* Main tick mark */}
              <View style={styles.tickMark}>
                <Ionicons name="checkmark" size={80} color="#4CAF50" />
              </View>
              
              {/* 3D shadow effect */}
              <View style={styles.tickShadow} />
              
              {/* Glow effect */}
              <View style={styles.glowEffect} />
            </Animated.View>

            {/* Success Text */}
            <Animated.View
              style={[
                styles.textContainer,
                {
                  opacity: textOpacityAnim,
                  transform: [{ scale: textScaleAnim }],
                },
              ]}
            >
              <Text style={styles.successText}>{message}</Text>
              <Text style={styles.subText}>Your issue has been recorded</Text>
            </Animated.View>

            {/* Floating particles effect */}
            <View style={styles.particlesContainer}>
              {[...Array(6)].map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.particle,
                    {
                      left: Math.random() * width,
                      top: Math.random() * 100 + 200,
                      opacity: opacityAnim,
                      transform: [
                        {
                          translateY: Animated.multiply(
                            opacityAnim,
                            new Animated.Value(Math.random() * 50 - 25)
                          ),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  tickContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  tickMark: {
    position: 'relative',
    zIndex: 3,
    backgroundColor: 'white',
    borderRadius: 60,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tickShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 112,
    height: 112,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 56,
    zIndex: 1,
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 140,
    height: 140,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 70,
    zIndex: 0,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
});

export default SuccessTickAnimation;

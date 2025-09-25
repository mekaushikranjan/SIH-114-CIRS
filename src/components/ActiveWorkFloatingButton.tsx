import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EndWorkModal from './EndWorkModal';
import { getCurrentConfig } from '../config/environment';
import { tokenStorage } from '../utils/tokenStorage';

interface ActiveWorkFloatingButtonProps {
  workerId: string;
}

const ActiveWorkFloatingButton: React.FC<ActiveWorkFloatingButtonProps> = ({ workerId }) => {
  const insets = useSafeAreaInsets();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [showEndWorkModal, setShowEndWorkModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    checkActiveWorkSession();
    const interval = setInterval(checkActiveWorkSession, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [workerId]);

  const checkActiveWorkSession = async () => {
    try {
      const config = getCurrentConfig();
      const response = await fetch(`${config.BASE_URL}/work-progress/active/${workerId}`, {
        headers: {
          'Authorization': `Bearer ${await tokenStorage.getToken()}`,
        },
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setActiveSession(result.data);
        // Fade in the button
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } else {
        setActiveSession(null);
        // Fade out the button
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error checking active work session:', error);
    }
  };

  const handleWorkEnded = () => {
    setActiveSession(null);
    setShowEndWorkModal(false);
    // Fade out the button
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  if (!activeSession) {
    return null;
  }

  return (
    <>
      <Animated.View 
        style={[
          styles.floatingButton, 
          { 
            bottom: insets.bottom + 100,
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowEndWorkModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.buttonText}>End Work</Text>
          </View>
          <Text style={styles.issueTitle} numberOfLines={1}>
            {activeSession.issueTitle || 'Active Work Session'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <EndWorkModal
        visible={showEndWorkModal}
        onClose={() => setShowEndWorkModal(false)}
        onWorkEnded={handleWorkEnded}
        workSessionId={activeSession.id}
        issueTitle={activeSession.issueTitle || 'Work Session'}
      />
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 140,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  issueTitle: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
    textAlign: 'center',
  },
});

export default ActiveWorkFloatingButton;

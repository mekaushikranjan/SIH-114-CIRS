import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkerHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
}

const WorkerHeader: React.FC<WorkerHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightComponent,
  backgroundColor = '#FF6B35',
}) => {
  const insets = useSafeAreaInsets();

  // Set status bar style for all non-home pages
  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(backgroundColor, true);
      StatusBar.setTranslucent(false);
    }
  }, [backgroundColor]);

  // Calculate consistent header height - made smaller
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;
  const headerContentHeight = 48; // Reduced from 56 to 48
  const totalHeaderHeight = statusBarHeight + headerContentHeight;

  return (
    <View style={[styles.container, { backgroundColor, height: totalHeaderHeight }]}>
      {/* Status bar spacer for iOS */}
      <View style={{ height: statusBarHeight }} />
      
      {/* Header content */}
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          )}
          
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>{rightComponent}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF6B35',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18, // Increased from 16 to 18
    paddingVertical: 2, // Added vertical padding
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20, // Increased from 18 to 20
    fontWeight: '700', // Increased from 600 to 700
    color: 'white',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13, // Increased from 12 to 13
    color: 'rgba(255, 255, 255, 0.85)', // Slightly more opaque
    marginTop: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default WorkerHeader;

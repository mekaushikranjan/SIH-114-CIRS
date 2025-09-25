import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { offlineService } from '../services/offlineService';

interface OfflineIndicatorProps {
  style?: any;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ style }) => {
  const [syncStatus, setSyncStatus] = useState(offlineService.getSyncStatus());
  const [showDetails, setShowDetails] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Update sync status every 5 seconds
    const interval = setInterval(() => {
      setSyncStatus(offlineService.getSyncStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Pulse animation for offline state
    if (!syncStatus.isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [syncStatus.isOnline, pulseAnim]);

  const handleSync = async () => {
    try {
      await offlineService.forcSync();
      setSyncStatus(offlineService.getSyncStatus());
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return '#FF6B35'; // Orange for offline
    if (syncStatus.pendingActions > 0) return '#FFA500'; // Yellow for pending
    return '#4CAF50'; // Green for online and synced
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline Mode';
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (syncStatus.pendingActions > 0) return `${syncStatus.pendingActions} Pending`;
    return 'Online & Synced';
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return 'cloud-offline';
    if (syncStatus.syncInProgress) return 'sync';
    if (syncStatus.pendingActions > 0) return 'cloud-upload';
    return 'cloud-done';
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.indicator, { backgroundColor: getStatusColor() }]}
        onPress={() => setShowDetails(!showDetails)}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.iconContainer, { opacity: pulseAnim }]}>
          <Ionicons 
            name={getStatusIcon()} 
            size={16} 
            color="white" 
          />
        </Animated.View>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        <Ionicons 
          name={showDetails ? 'chevron-up' : 'chevron-down'} 
          size={14} 
          color="white" 
        />
      </TouchableOpacity>

      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor() }]}>
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pending Actions:</Text>
            <Text style={styles.detailValue}>{syncStatus.pendingActions}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Sync:</Text>
            <Text style={styles.detailValue}>
              {new Date(syncStatus.lastSync).toLocaleTimeString()}
            </Text>
          </View>

          {syncStatus.isOnline && syncStatus.pendingActions > 0 && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSync}
              disabled={syncStatus.syncInProgress}
            >
              <Ionicons name="sync" size={16} color="white" />
              <Text style={styles.syncButtonText}>
                {syncStatus.syncInProgress ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          )}

          {!syncStatus.isOnline && (
            <View style={styles.offlineNotice}>
              <Ionicons name="information-circle" size={16} color="#FF6B35" />
              <Text style={styles.offlineNoticeText}>
                Working offline. Changes will sync when connection is restored.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  detailsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#FF6B35',
    marginLeft: 6,
    lineHeight: 16,
  },
});

export default OfflineIndicator;

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { networkService, NetworkState } from '../services/networkService';
import { syncService, SyncStatus } from '../services/syncService';

const { width } = Dimensions.get('window');

interface OfflineStatusBarProps {
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom';
  onPress?: () => void;
}

const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({
  showWhenOnline = false,
  position = 'top',
  onPress
}) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: false,
    type: 'unknown',
    isInternetReachable: null
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    pendingActions: 0,
    syncProgress: 0
  });
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = new Animated.Value(-60);

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribeNetwork = networkService.addListener(setNetworkState);
    
    // Subscribe to sync status changes
    const unsubscribeSync = syncService.addSyncListener(setSyncStatus);

    // Get initial states
    setNetworkState(networkService.getCurrentState());
    syncService.getSyncStatus().then(setSyncStatus);

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
    };
  }, []);

  useEffect(() => {
    const shouldShow = !networkState.isConnected || 
                     syncStatus.isSyncing || 
                     syncStatus.pendingActions > 0 ||
                     showWhenOnline;

    if (shouldShow !== isVisible) {
      setIsVisible(shouldShow);
      
      Animated.timing(slideAnim, {
        toValue: shouldShow ? 0 : -60,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [networkState.isConnected, syncStatus.isSyncing, syncStatus.pendingActions, showWhenOnline, isVisible]);

  const getStatusInfo = () => {
    if (syncStatus.isSyncing) {
      return {
        icon: 'sync' as const,
        text: `Syncing... ${Math.round(syncStatus.syncProgress)}%`,
        color: '#FF6B35',
        backgroundColor: '#FFF3E0'
      };
    }

    if (!networkState.isConnected) {
      const pendingText = syncStatus.pendingActions > 0 
        ? ` • ${syncStatus.pendingActions} pending`
        : '';
      
      return {
        icon: 'cloud-offline' as const,
        text: `Offline${pendingText}`,
        color: '#f44336',
        backgroundColor: '#FFEBEE'
      };
    }

    if (syncStatus.pendingActions > 0) {
      return {
        icon: 'cloud-upload' as const,
        text: `${syncStatus.pendingActions} items to sync`,
        color: '#FF9800',
        backgroundColor: '#FFF8E1'
      };
    }

    if (showWhenOnline) {
      const connectionType = networkState.type === 'wifi' ? 'WiFi' : 'Mobile';
      return {
        icon: 'cloud-done' as const,
        text: `Online via ${connectionType}`,
        color: '#4CAF50',
        backgroundColor: '#E8F5E8'
      };
    }

    return null;
  };

  const statusInfo = getStatusInfo();

  if (!statusInfo) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (!networkState.isConnected && syncStatus.pendingActions > 0) {
      // Default action: show sync info
      console.log('Offline status pressed - pending actions:', syncStatus.pendingActions);
    }
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) return 'Never';
    
    const now = Date.now();
    const diff = now - syncStatus.lastSyncTime;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'bottom' ? styles.bottom : styles.top,
        { backgroundColor: statusInfo.backgroundColor },
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          <Ionicons 
            name={statusInfo.icon} 
            size={16} 
            color={statusInfo.color}
            style={syncStatus.isSyncing ? styles.spinningIcon : undefined}
          />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>

        {syncStatus.pendingActions > 0 && !syncStatus.isSyncing && (
          <View style={styles.rightContent}>
            <Text style={[styles.syncText, { color: statusInfo.color }]}>
              Last sync: {formatLastSync()}
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={14} 
              color={statusInfo.color} 
            />
          </View>
        )}

        {syncStatus.isSyncing && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${syncStatus.syncProgress}%`,
                    backgroundColor: statusInfo.color
                  }
                ]} 
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  syncText: {
    fontSize: 12,
    marginRight: 4,
  },
  progressContainer: {
    marginLeft: 12,
    width: 60,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  spinningIcon: {
    // Add rotation animation if needed
  },
});

export default OfflineStatusBar;

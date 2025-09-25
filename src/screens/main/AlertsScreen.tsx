import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Image,
  Platform,
  Animated,
  StatusBar,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../../services/apiService';
import { getCurrentConfig } from '../../config/environment';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface AlertItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'emergency' | 'maintenance' | 'announcement' | 'warning';
  targetAudience: 'all' | 'citizens' | 'department' | 'admins';
  department?: string;
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'expired';
  readBy: string[];
  createdBy: string;
}

const AlertsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'important'>('all');
  const [newAlertIds, setNewAlertIds] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userToken, setUserToken] = useState<string | null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const wsRef = useRef<WebSocket | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(50)).current;
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Get current user ID and token
  useEffect(() => {
    const getCurrentUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        const userData = userDataString ? JSON.parse(userDataString) : {};
        setCurrentUserId(userData.id || null);
        
        // Get JWT token for WebSocket authentication
        const token = await AsyncStorage.getItem('token');
        setUserToken(token);
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };
    getCurrentUserData();
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await apiService.getPublicAlerts();
      if (res.success) {
        // Sort alerts by creation date - newest first
        const sortedAlerts = (res.data || []).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAlerts(sortedAlerts);
      } else {
        console.error('Failed to fetch alerts:', res.error);
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    
    // Connect to WebSocket when user token is available
    if (userToken) {
      connectWebSocket();
    }
    
    return () => {
      // Cleanup WebSocket connection
      if (wsRef.current) {
        wsRef.current.close(1000); // Normal closure
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchAlerts, userToken]);

  const connectWebSocket = useCallback(() => {
    // Don't connect if no token available
    if (!userToken) {
      console.log('WebSocket connection skipped: No authentication token');
      return;
    }

    // Don't reconnect if max attempts reached
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('WebSocket max reconnection attempts reached');
      return;
    }

    try {
      const config = getCurrentConfig();
      const wsUrl = `${config.WS_URL}?token=${encodeURIComponent(userToken)}`;
      
      console.log('Attempting WebSocket connection...');
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        reconnectAttempts.current = 0; // Reset attempts on successful connection
        
        // Clear any pending reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data.type);
          
          if (data.type === 'new_alert' && data.alert) {
            handleNewAlert(data.alert);
          } else if (data.type === 'connection') {
            console.log('🔌 WebSocket connection confirmed:', data.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
      
      wsRef.current.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected (code: ${event.code})`);
        
        // Only attempt reconnection if not manually closed and within attempt limits
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          
          // Exponential backoff: 2^attempts * 1000ms (1s, 2s, 4s, 8s, 16s)
          const delay = Math.pow(2, reconnectAttempts.current - 1) * 1000;
          
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.CLOSED) {
              connectWebSocket();
            }
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('🚫 Max WebSocket reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      reconnectAttempts.current++;
    }
  }, [userToken]);

  const handleNewAlert = useCallback((newAlert: AlertItem) => {
    setAlerts(prevAlerts => {
      // Check if alert already exists
      const exists = prevAlerts.some(alert => alert.id === newAlert.id);
      if (exists) return prevAlerts;
      
      // Add to new alert IDs for animation
      setNewAlertIds(prev => new Set([...prev, newAlert.id]));
      
      // Remove from new alert IDs after animation
      setTimeout(() => {
        setNewAlertIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(newAlert.id);
          return newSet;
        });
      }, 2000);
      
      // Show toast notification
      showToast(t('alerts.newAlertReceived'));
      
      // Add new alert to the top of the list
      return [newAlert, ...prevAlerts];
    });
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    
    // Animate toast in
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateY, {
          toValue: 50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToastVisible(false);
      });
    }, 3000);
  }, [toastOpacity, toastTranslateY]);

  const markAsRead = async (alertId: string) => {
    try {
      const res = await apiService.markAlertAsRead(alertId);
      if (res.success) {
        setAlerts(prev => prev.map(alert => {
          if (alert.id === alertId && currentUserId) {
            return { ...alert, readBy: [...alert.readBy, currentUserId] };
          }
          return alert;
        }));
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const isAlertRead = (alert: AlertItem): boolean => {
    if (!currentUserId) return false;
    return alert.readBy.includes(currentUserId);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'emergency': return 'warning';
      case 'maintenance': return 'construct';
      case 'announcement': return 'megaphone';
      case 'warning': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const getAlertIconColor = (type: string) => {
    switch (type) {
      case 'emergency': return '#FF4444';
      case 'maintenance': return '#FF8800';
      case 'announcement': return '#2E7D32';
      case 'warning': return '#FF6B00';
      default: return '#2196F3';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF4444';
      case 'medium': return '#FF8800';
      case 'low': return '#00AA00';
      default: return '#666666';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return '#FF4444';
      case 'maintenance': return '#FF8800';
      case 'announcement': return '#2E7D32';
      case 'warning': return '#FF6B00';
      default: return '#666666';
    }
  };

  const getAlertTypeBadgeText = (type: string) => {
    switch (type) {
      case 'emergency': return 'EMERGENCY';
      case 'maintenance': return 'MAINTENANCE';
      case 'announcement': return 'ANNOUNCEMENT';
      case 'warning': return 'WARNING';
      default: return type.toUpperCase();
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAlerts();
  }, [fetchAlerts]);

  const filteredAlerts = alerts.filter(alert => {
    // Search filter
    if (searchQuery) {
      const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           alert.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Tab filter - only important tab now
    if (activeTab === 'important' && alert.priority !== 'high') {
      return false;
    }

    return true;
  });

  const handleAlertPress = (alert: AlertItem) => {
    // No action on alert container click
    // Users can use the triple dot menu for actions
  };

  const handleMarkAsRead = (alert: AlertItem) => {
    if (!isAlertRead(alert)) {
      markAsRead(alert.id);
    }
  };

  const showAlertDetails = (alert: AlertItem) => {
    const formatDateTime = (dateString: string) => {
      return new Date(dateString).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return '#FF4444';
        case 'medium': return '#FF8800';
        case 'low': return '#2E7D32';
        default: return '#666';
      }
    };

    const getAlertTypeColor = (type: string) => {
      switch (type) {
        case 'emergency': return '#FF4444';
        case 'maintenance': return '#FF8800';
        case 'information': return '#2E7D32';
        case 'warning': return '#FF8800';
        default: return '#666';
      }
    };

    const getAlertTypeText = (type: string) => {
      switch (type) {
        case 'emergency': return 'Emergency Alert';
        case 'maintenance': return 'Maintenance Notice';
        case 'information': return 'Information';
        case 'warning': return 'Warning';
        default: return 'Alert';
      }
    };

    Alert.alert(
      alert.title,
      `Description: ${alert.description}\n\n` +
      `Type: ${getAlertTypeText(alert.type)}\n` +
      `Priority: ${alert.priority.toUpperCase()}\n` +
      `Created: ${formatDateTime(alert.createdAt)}\n` +
      `${alert.expiresAt ? `Expires: ${formatDateTime(alert.expiresAt)}` : 'No expiry'}\n` +
      `Department: ${alert.department || 'General'}\n` +
      `Target: ${alert.targetAudience.charAt(0).toUpperCase() + alert.targetAudience.slice(1)}\n` +
      `Status: ${isAlertRead(alert) ? 'Read' : 'Unread'}`,
      [
        {
          text: 'Close',
          style: 'default',
        },
        ...(isAlertRead(alert) ? [] : [{
          text: 'Mark as Read',
          onPress: () => handleMarkAsRead(alert),
          style: 'default' as const,
        }])
      ],
      { cancelable: true }
    );
  };

  const toggleAlertExpansion = (alertId: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const isAlertExpanded = (alertId: string) => {
    return expandedAlerts.has(alertId);
  };

  const renderAlert = (alert: AlertItem) => {
    const isRead = isAlertRead(alert);
    const isNewAlert = newAlertIds.has(alert.id);
    
  return (
    <View
      key={alert.id}
      style={[
        styles.alertCard,
        !isRead && styles.unreadAlert,
        isNewAlert && styles.newAlertCard,
        isRead && styles.readAlert
      ]}
    >
        {/* Header with Title and Menu */}
        <View style={styles.alertHeader}>
          <View style={styles.alertTitleContainer}>
            <Text style={[
              styles.alertTitle,
              isRead && styles.readTitle
            ]}>
              {alert.title}
            </Text>
            {/* Read/Unread Status Dot */}
            <View style={[
              styles.statusDot,
              isRead ? styles.readDot : styles.unreadDot
            ]} />
          </View>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => {
              Alert.alert(
                'Alert Options',
                'Choose an action',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'View Details',
                    onPress: () => showAlertDetails(alert),
                    style: 'default',
                  },
                  {
                    text: isAlertRead(alert) ? 'Already Read' : 'Mark as Read',
                    onPress: () => handleMarkAsRead(alert),
                    style: isAlertRead(alert) ? 'cancel' : 'default',
                  },
                ],
                { cancelable: true }
              );
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Alert Content */}
        <View style={styles.alertContent}>
          <View style={[
            styles.alertIconContainer,
            { backgroundColor: getAlertTypeColor(alert.type) }
          ]}>
            <Ionicons
              name={getAlertIcon(alert.type) as any}
              size={20}
              color="#fff"
            />
          </View>
          
          <View style={styles.alertMainContent}>
            <Text style={[
              styles.alertDescription,
              isRead && styles.readDescription
            ]}>
              {alert.description}
            </Text>
            <Text style={styles.alertTime}>
              {formatTimeAgo(alert.createdAt)}
            </Text>
          </View>
          
          {/* Badge */}
          {isNewAlert && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>{t('alerts.newBadge')}</Text>
            </View>
          )}
          <View style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(alert.priority) }
          ]}>
            <Text style={styles.priorityBadgeText}>
              {alert.priority.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Action Link */}
        <TouchableOpacity 
          style={styles.actionLink}
          onPress={() => showAlertDetails(alert)}
        >
          <Text style={styles.actionLinkText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const alertDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - alertDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t('alerts.loadingAlerts')}</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      {/* Simple Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('alerts.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('alerts.subtitle')}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={activeTab === 'all' ? 'notifications' : 'notifications-outline'} size={18} color={activeTab === 'all' ? '#2E7D32' : '#666'} style={styles.tabIcon} />
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>{t('alerts.allAlerts')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'important' && styles.activeTab]}
          onPress={() => setActiveTab('important')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={activeTab === 'important' ? 'warning' : 'warning-outline'} size={18} color={activeTab === 'important' ? '#FF4444' : '#666'} style={styles.tabIcon} />
            <Text style={[styles.tabText, activeTab === 'important' && styles.activeTabText]}>{t('alerts.important')}</Text>
            {alerts.filter(a => a.priority === 'high').length > 0 && (
              <View style={styles.importantBadge}>
                <Text style={styles.importantBadgeText}>{alerts.filter(a => a.priority === 'high').length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('alerts.searchPlaceholder')}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Alerts List */}
      <ScrollView
        style={styles.alertsList}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2E7D32']}
            tintColor="#2E7D32"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Results Count */}
        <Text style={styles.resultsCount}>{filteredAlerts.length} {t('alerts.alertsFound')}</Text>
        
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons 
                name={activeTab === 'important' ? "warning-outline" : "notifications-off"} 
                size={80} 
                color="#ddd" 
              />
            </View>
            <Text style={styles.emptyText}>
              {activeTab === 'important' ? 'No important alerts' : 'No alerts found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : activeTab === 'important'
                ? 'High priority alerts will appear here'
                : 'New alerts will appear here when available'}
            </Text>
          </View>
        ) : (
          <>
            {activeTab === 'important' && filteredAlerts.length > 0 && (
              <View style={styles.sectionHeader}>
                <Ionicons name="warning" size={20} color="#FF4444" />
                <Text style={styles.sectionTitle}>{t('alerts.highPriorityAlerts')}</Text>
              </View>
            )}
            {filteredAlerts.map(renderAlert)}
          </>
        )}
      </ScrollView>

        {/* Toast Notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.toastIcon} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2E7D32',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  alertsList: {
    flex: 1,
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  unreadAlert: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOpacity: 0.15,
  },
  readAlert: {
    backgroundColor: '#f8f9fa',
    opacity: 0.8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  unreadDot: {
    backgroundColor: '#2E7D32',
  },
  readDot: {
    backgroundColor: '#ccc',
  },
  readTitle: {
    color: '#666',
    fontWeight: '400',
  },
  readDescription: {
    color: '#999',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  alertMainContent: {
    flex: 1,
    marginRight: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  newBadge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  priorityBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginLeft: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  priorityBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actionLinkText: {
    fontSize: 13,
    color: '#2E7D32',
    marginRight: 4,
    fontWeight: '600',
  },
  unreadText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
 
  
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  alertTimeAgo: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  alertTimestamps: {
    alignItems: 'flex-end',
  },
  expiryText: {
    fontSize: 10,
    color: '#FF8800',
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 8,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4444',
    marginLeft: 8,
  },
  highPriorityIconContainer: {
    backgroundColor: '#FF4444',
    borderRadius: 20,
    padding: 8,
  },
  // Toast notification styles
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastIcon: {
    marginRight: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  // New alert animation styles
  newAlertGlow: {
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Read More functionality styles

  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  readMoreText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  readMoreIcon: {
    marginLeft: 4,
  },
  // Enhanced read/unread distinction styles
  unreadDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontWeight: '500',
  },
  unreadMeta: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  // Quick actions and improved layout styles
  alertActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 8,
  },
  markReadButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  markReadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  readStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  // Improved time/expiry layout styles
  timeInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 8,
  },
  // Top right corner layout for badge and status dot
  alertTopRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  // Tab icon style
  tabIcon: {
    marginRight: 6,
  },
  // Important badge styles
  importantBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  importantBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // New enhanced styles
  alertStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  alertMetaText: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  newAlertCard: {
    borderColor: '#2E7D32',
    borderWidth: 2,
    backgroundColor: '#F8FFF8',
    shadowColor: '#2E7D32',
    shadowOpacity: 0.15,
  },
  scrollContent: {
    paddingBottom: 80, // Add padding to show above bottom navigation
  },
});

export default AlertsScreen;
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { apiService } from './apiService';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  type: 'assignment' | 'reminder' | 'update' | 'alert';
  priority: 'low' | 'normal' | 'high';
  scheduledFor?: string;
  workerId?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  newAssignments: boolean;
  reminders: boolean;
  updates: boolean;
  alerts: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

class NotificationService {
  private expoPushToken: string | null = null;
  private readonly SETTINGS_KEY = 'notification_settings';
  private readonly TOKEN_KEY = 'expo_push_token';

  constructor() {
    this.configureNotifications();
  }

  /**
   * Configure notification behavior
   */
  private configureNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Initialize push notifications
   */
  async initializePushNotifications(): Promise<string | null> {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Get existing token
      const existingToken = await AsyncStorage.getItem(this.TOKEN_KEY);
      if (existingToken) {
        this.expoPushToken = existingToken;
        return existingToken;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }

      // Get push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;

      // Save token
      await AsyncStorage.setItem(this.TOKEN_KEY, token);

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('worker-assignments', {
          name: 'Worker Assignments',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B35',
        });

        await Notifications.setNotificationChannelAsync('worker-reminders', {
          name: 'Work Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B35',
        });
      }

      console.log('Push notifications initialized:', token);
      return token;

    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return null;
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Get authentication token from storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      const settings = await this.getNotificationSettings();
      
      if (!settings.enabled) {
        console.log('Notifications disabled');
        return null;
      }

      // Check type-specific settings
      if (!this.shouldSendNotification(notification.type, settings)) {
        console.log(`Notifications disabled for type: ${notification.type}`);
        return null;
      }

      // Check quiet hours
      if (this.isQuietHours(settings.quietHours)) {
        console.log('In quiet hours, skipping notification');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: settings.sound,
          priority: this.mapPriority(notification.priority),
        },
        trigger: notification.scheduledFor 
          ? { date: new Date(notification.scheduledFor) }
          : null,
      });

      console.log('Local notification sent:', notificationId);
      return notificationId;

    } catch (error) {
      console.error('Error sending local notification:', error);
      return null;
    }
  }

  /**
   * Send push notification to server for delivery
   */
  async sendPushNotification(
    workerId: string, 
    notification: NotificationData
  ): Promise<boolean> {
    try {
      const response = await fetch(apiService.getFullURL('notifications/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerId,
          notification,
          pushToken: this.expoPushToken,
        }),
      });

      const data = await response.json();
      return data.success || false;

    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Schedule reminder notification
   */
  async scheduleReminder(
    title: string,
    body: string,
    scheduledFor: Date,
    data?: any
  ): Promise<string | null> {
    const notification: NotificationData = {
      id: `reminder_${Date.now()}`,
      title,
      body,
      data,
      type: 'reminder',
      priority: 'normal',
      scheduledFor: scheduledFor.toISOString(),
    };

    return await this.sendLocalNotification(notification);
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }

    // Return default settings
    return {
      enabled: true,
      newAssignments: true,
      reminders: true,
      updates: true,
      alerts: true,
      sound: true,
      vibration: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
    };
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const currentSettings = await this.getNotificationSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
      console.log('Notification settings updated');
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  /**
   * Register for citizen notifications (issue updates, civic alerts)
   */
  async registerForCitizenNotifications(userId: string): Promise<boolean> {
    try {
      const token = await this.initializePushNotifications();
      if (!token) {
        return false;
      }

      // Register with backend for citizen notifications
      const response = await fetch(apiService.getFullURL('notifications/register/user'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          userId,
          pushToken: token,
          platform: Platform.OS,
        }),
      });

      const data = await response.json();
      console.log('📱 Citizen notification registration:', data);
      return data.success || false;

    } catch (error) {
      console.error('Error registering citizen for notifications:', error);
      return false;
    }
  }

  /**
   * Register for assignment notifications (workers)
   */
  async registerForAssignmentNotifications(workerId: string): Promise<boolean> {
    try {
      const token = await this.initializePushNotifications();
      if (!token) {
        return false;
      }

      // Register with backend
      const response = await fetch(apiService.getFullURL('notifications/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          workerId,
          pushToken: token,
          platform: Platform.OS,
        }),
      });

      const data = await response.json();
      return data.success || false;

    } catch (error) {
      console.error('Error registering for notifications:', error);
      return false;
    }
  }

  /**
   * Unregister from notifications (workers)
   */
  async unregisterFromNotifications(workerId: string): Promise<boolean> {
    try {
      const response = await fetch(apiService.getFullURL('notifications/unregister'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          workerId,
          pushToken: this.expoPushToken,
        }),
      });

      const data = await response.json();
      return data.success || false;

    } catch (error) {
      console.error('Error unregistering from notifications:', error);
      return false;
    }
  }

  /**
   * Get notification status for citizen
   */
  async getCitizenNotificationStatus(userId: string): Promise<any> {
    try {
      const response = await fetch(apiService.getFullURL(`notifications/status/user/${userId}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      const data = await response.json();
      return data.success ? data.data : null;

    } catch (error) {
      console.error('Error getting citizen notification status:', error);
      return null;
    }
  }

  /**
   * Handle issue status update notifications
   */
  setupIssueStatusNotificationHandler(callback: (issueId: string, newStatus: string, trackingNumber: string) => void) {
    return this.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'status_update' && data?.issueId) {
        callback(data.issueId, data.newStatus, data.trackingNumber || '');
      }
    });
  }

  /**
   * Handle civic alert notifications
   */
  setupCivicAlertNotificationHandler(callback: (alertData: any) => void) {
    return this.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'civic_alert') {
        callback(data);
      }
    });
  }

  /**
   * Handle notification received while app is running
   */
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Handle notification tapped
   */
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(): Promise<Notifications.Notification[]> {
    try {
      return await Notifications.getPresentedNotificationsAsync();
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Clear notification badge
   */
  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Private helper methods
   */
  private shouldSendNotification(type: string, settings: NotificationSettings): boolean {
    switch (type) {
      case 'assignment':
        return settings.newAssignments;
      case 'reminder':
        return settings.reminders;
      case 'update':
        return settings.updates;
      case 'alert':
        return settings.alerts;
      default:
        return true;
    }
  }

  private isQuietHours(quietHours: NotificationSettings['quietHours']): boolean {
    if (!quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Same day quiet hours
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private mapPriority(priority: string): Notifications.AndroidImportance {
    switch (priority) {
      case 'high':
        return Notifications.AndroidImportance.HIGH;
      case 'low':
        return Notifications.AndroidImportance.LOW;
      default:
        return Notifications.AndroidImportance.DEFAULT;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;

import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

export interface NetworkState {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean | null;
}

class NetworkService {
  private listeners: ((state: NetworkState) => void)[] = [];
  private currentState: NetworkState = {
    isConnected: false,
    type: 'unknown',
    isInternetReachable: null
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Get initial network state
    const state = await NetInfo.fetch();
    this.updateNetworkState(state);

    // Subscribe to network state changes
    NetInfo.addEventListener(state => {
      this.updateNetworkState(state);
    });
  }

  private updateNetworkState(state: any) {
    const newState: NetworkState = {
      isConnected: state.isConnected ?? false,
      type: state.type || 'unknown',
      isInternetReachable: state.isInternetReachable
    };

    const wasConnected = this.currentState.isConnected;
    const isNowConnected = newState.isConnected;

    this.currentState = newState;

    // Notify listeners
    this.listeners.forEach(listener => listener(newState));

    // Handle connection state changes
    if (!wasConnected && isNowConnected) {
      this.onConnectionRestored();
    } else if (wasConnected && !isNowConnected) {
      this.onConnectionLost();
    }

    console.log('🌐 Network state updated:', newState);
  }

  private onConnectionRestored() {
    console.log('✅ Internet connection restored');
    // Trigger sync when connection is restored
    this.notifyConnectionRestored();
  }

  private onConnectionLost() {
    console.log('❌ Internet connection lost');
    this.showOfflineNotification();
  }

  private showOfflineNotification() {
    Alert.alert(
      'Connection Lost',
      'You are now offline. Your work will be saved and synced when connection is restored.',
      [{ text: 'OK' }]
    );
  }

  private notifyConnectionRestored() {
    // This will be handled by the sync service
    console.log('🔄 Ready to sync offline data');
  }

  // Public methods
  getCurrentState(): NetworkState {
    return this.currentState;
  }

  isOnline(): boolean {
    return this.currentState.isConnected && 
           (this.currentState.isInternetReachable !== false);
  }

  isOffline(): boolean {
    return !this.isOnline();
  }

  getConnectionType(): string {
    return this.currentState.type;
  }

  // Subscribe to network changes
  addListener(callback: (state: NetworkState) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Check if connection is suitable for large operations
  isHighQualityConnection(): boolean {
    const { type, isConnected } = this.currentState;
    
    if (!isConnected) return false;
    
    // Consider WiFi and cellular as high quality
    // Exclude 2G and slow connections
    return ['wifi', 'cellular', 'ethernet'].includes(type.toLowerCase());
  }

  // Test actual internet connectivity
  async testInternetConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response.status === 204;
    } catch (error) {
      console.log('🌐 Internet connectivity test failed:', error);
      return false;
    }
  }

  // Get network quality indicator
  getNetworkQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
    if (!this.isOnline()) return 'offline';
    
    const { type } = this.currentState;
    
    switch (type.toLowerCase()) {
      case 'wifi':
      case 'ethernet':
        return 'excellent';
      case 'cellular':
        return 'good';
      case '2g':
        return 'poor';
      default:
        return 'good';
    }
  }

  // Show network status to user
  getNetworkStatusMessage(): string {
    const quality = this.getNetworkQuality();
    
    switch (quality) {
      case 'excellent':
        return 'Connected via WiFi';
      case 'good':
        return 'Connected via cellular';
      case 'poor':
        return 'Slow connection detected';
      case 'offline':
        return 'No internet connection';
      default:
        return 'Connection status unknown';
    }
  }

  // Check if we should attempt sync
  shouldAttemptSync(): boolean {
    return this.isOnline() && this.isHighQualityConnection();
  }

  // Wait for connection with timeout
  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    if (this.isOnline()) return true;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.addListener((state) => {
        if (state.isConnected) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }
}

export const networkService = new NetworkService();

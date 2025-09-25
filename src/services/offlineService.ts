import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { apiService } from './apiService';

interface OfflineAction {
  id: string;
  type: 'WORK_LOG' | 'ASSIGNMENT_UPDATE' | 'PHOTO_UPLOAD' | 'CHECK_IN' | 'CHECK_OUT';
  data: any;
  timestamp: string;
  retryCount: number;
}

interface OfflineData {
  assignments: any[];
  workLogs: any[];
  photos: any[];
  lastSync: string;
}

class OfflineService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private pendingActions: OfflineAction[] = [];
  private offlineData: OfflineData = {
    assignments: [],
    workLogs: [],
    photos: [],
    lastSync: new Date().toISOString()
  };

  constructor() {
    this.initializeNetworkListener();
    this.loadOfflineData();
  }

  private async initializeNetworkListener() {
    // Listen for network state changes
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected || false;
      
      console.log('🌐 Network status:', this.isOnline ? 'Online' : 'Offline');
      
      // If we just came back online, sync pending actions
      if (wasOffline && this.isOnline) {
        this.syncPendingActions();
      }
    });

    // Get initial network state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected || false;
  }

  private async loadOfflineData() {
    try {
      const storedData = await AsyncStorage.getItem('offlineData');
      if (storedData) {
        this.offlineData = JSON.parse(storedData);
      }

      const storedActions = await AsyncStorage.getItem('pendingActions');
      if (storedActions) {
        this.pendingActions = JSON.parse(storedActions);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }

  private async saveOfflineData() {
    try {
      await AsyncStorage.setItem('offlineData', JSON.stringify(this.offlineData));
      await AsyncStorage.setItem('pendingActions', JSON.stringify(this.pendingActions));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  // Check if device is online
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  // Add action to pending queue for offline execution
  async addPendingAction(type: OfflineAction['type'], data: any): Promise<string> {
    const action: OfflineAction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    this.pendingActions.push(action);
    await this.saveOfflineData();

    console.log(`📱 Added offline action: ${type}`, action.id);

    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncPendingActions();
    }

    return action.id;
  }

  // Sync all pending actions when back online
  async syncPendingActions(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.pendingActions.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Syncing pending actions...', this.pendingActions.length);

    const actionsToSync = [...this.pendingActions];
    const successfulActions: string[] = [];

    for (const action of actionsToSync) {
      try {
        const success = await this.executeAction(action);
        if (success) {
          successfulActions.push(action.id);
          console.log(`✅ Synced action: ${action.type} - ${action.id}`);
        } else {
          // Increment retry count
          action.retryCount++;
          if (action.retryCount >= 3) {
            console.error(`❌ Failed to sync action after 3 retries: ${action.type} - ${action.id}`);
            successfulActions.push(action.id); // Remove from queue to prevent infinite retries
          }
        }
      } catch (error) {
        console.error(`Error syncing action ${action.id}:`, error);
        action.retryCount++;
        if (action.retryCount >= 3) {
          successfulActions.push(action.id);
        }
      }
    }

    // Remove successful actions from pending queue
    this.pendingActions = this.pendingActions.filter(
      action => !successfulActions.includes(action.id)
    );

    await this.saveOfflineData();
    this.syncInProgress = false;

    console.log(`🔄 Sync complete. Remaining actions: ${this.pendingActions.length}`);
  }

  private async executeAction(action: OfflineAction): Promise<boolean> {
    try {
      switch (action.type) {
        case 'WORK_LOG':
          return await this.syncWorkLog(action.data);
        
        case 'ASSIGNMENT_UPDATE':
          return await this.syncAssignmentUpdate(action.data);
        
        case 'PHOTO_UPLOAD':
          return await this.syncPhotoUpload(action.data);
        
        case 'CHECK_IN':
          return await this.syncCheckIn(action.data);
        
        case 'CHECK_OUT':
          return await this.syncCheckOut(action.data);
        
        default:
          console.warn('Unknown action type:', action.type);
          return false;
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      return false;
    }
  }

  private async syncWorkLog(data: any): Promise<boolean> {
    try {
      const response = await apiService.submitWorkLog(data);
      return response.success;
    } catch (error) {
      return false;
    }
  }

  private async syncAssignmentUpdate(data: any): Promise<boolean> {
    try {
      const response = await apiService.put(`/assignments/${data.assignmentId}`, data.updates);
      return response.success;
    } catch (error) {
      return false;
    }
  }

  private async syncPhotoUpload(data: any): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: data.uri,
        type: data.type,
        name: data.name,
      } as any);
      formData.append('workerId', data.workerId);
      formData.append('assignmentId', data.assignmentId);
      formData.append('location', JSON.stringify(data.location));

      const response = await apiService.post('/uploads/work-progress', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.success;
    } catch (error) {
      return false;
    }
  }

  private async syncCheckIn(data: any): Promise<boolean> {
    try {
      const response = await apiService.checkIn(data);
      return response.success;
    } catch (error) {
      return false;
    }
  }

  private async syncCheckOut(data: any): Promise<boolean> {
    try {
      const response = await apiService.checkOut(data);
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // Store data locally for offline access
  async storeAssignmentsOffline(assignments: any[]): Promise<void> {
    this.offlineData.assignments = assignments;
    this.offlineData.lastSync = new Date().toISOString();
    await this.saveOfflineData();
  }

  async getOfflineAssignments(): Promise<any[]> {
    return this.offlineData.assignments;
  }

  // Store work logs locally
  async storeWorkLogOffline(workLog: any): Promise<void> {
    this.offlineData.workLogs.push({
      ...workLog,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      synced: false
    });
    await this.saveOfflineData();
  }

  async getOfflineWorkLogs(): Promise<any[]> {
    return this.offlineData.workLogs;
  }

  // Store photos locally for later upload
  async storePhotoOffline(photoData: any): Promise<string> {
    const photoId = Date.now().toString();
    const photo = {
      id: photoId,
      ...photoData,
      timestamp: new Date().toISOString(),
      synced: false
    };

    this.offlineData.photos.push(photo);
    await this.saveOfflineData();

    // Add to pending actions for sync
    await this.addPendingAction('PHOTO_UPLOAD', photoData);

    return photoId;
  }

  async getOfflinePhotos(): Promise<any[]> {
    return this.offlineData.photos;
  }

  // Get sync status
  getSyncStatus(): {
    isOnline: boolean;
    pendingActions: number;
    lastSync: string;
    syncInProgress: boolean;
  } {
    return {
      isOnline: this.isOnline,
      pendingActions: this.pendingActions.length,
      lastSync: this.offlineData.lastSync,
      syncInProgress: this.syncInProgress
    };
  }

  // Manual sync trigger
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncPendingActions();
    } else {
      throw new Error('Device is offline. Cannot sync.');
    }
  }

  // Clear offline data (for logout or reset)
  async clearOfflineData(): Promise<void> {
    this.offlineData = {
      assignments: [],
      workLogs: [],
      photos: [],
      lastSync: new Date().toISOString()
    };
    this.pendingActions = [];
    
    await AsyncStorage.removeItem('offlineData');
    await AsyncStorage.removeItem('pendingActions');
  }

  // Get offline storage size
  async getStorageSize(): Promise<{ size: number; items: number }> {
    try {
      const offlineDataStr = await AsyncStorage.getItem('offlineData');
      const pendingActionsStr = await AsyncStorage.getItem('pendingActions');
      
      const size = (offlineDataStr?.length || 0) + (pendingActionsStr?.length || 0);
      const items = this.offlineData.assignments.length + 
                   this.offlineData.workLogs.length + 
                   this.offlineData.photos.length + 
                   this.pendingActions.length;

      return { size, items };
    } catch (error) {
      return { size: 0, items: 0 };
    }
  }
}

export const offlineService = new OfflineService();
export default offlineService;

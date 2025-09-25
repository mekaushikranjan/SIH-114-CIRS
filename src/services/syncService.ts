import { networkService } from './networkService';
import { offlineStorageService, OfflineAction } from './offlineStorageService';
import { apiService } from './apiService';
import { Alert } from 'react-native';

export interface SyncResult {
  success: boolean;
  syncedActions: number;
  failedActions: number;
  errors: string[];
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingActions: number;
  syncProgress: number;
}

class SyncService {
  private isSyncing = false;
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private autoSyncEnabled = true;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Listen for network changes
    networkService.addListener((networkState) => {
      if (networkState.isConnected && this.autoSyncEnabled) {
        // Delay sync to ensure stable connection
        setTimeout(() => {
          this.syncOfflineData();
        }, 2000);
      }
    });

    // Start periodic sync when online
    this.startPeriodicSync();
  }

  private startPeriodicSync() {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (networkService.isOnline() && this.autoSyncEnabled && !this.isSyncing) {
        this.syncOfflineData();
      }
    }, 5 * 60 * 1000);
  }

  private stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Main sync function
  async syncOfflineData(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('🔄 Sync already in progress');
      return {
        success: false,
        syncedActions: 0,
        failedActions: 0,
        errors: ['Sync already in progress']
      };
    }

    if (!networkService.shouldAttemptSync()) {
      console.log('🌐 Network not suitable for sync');
      return {
        success: false,
        syncedActions: 0,
        failedActions: 0,
        errors: ['Network not suitable for sync']
      };
    }

    this.isSyncing = true;
    this.notifyListeners();

    console.log('🔄 Starting offline data sync...');

    try {
      // Get queued actions
      const actions = await offlineStorageService.getActionQueue();
      
      if (actions.length === 0) {
        console.log('✅ No actions to sync');
        await this.syncCacheData();
        return {
          success: true,
          syncedActions: 0,
          failedActions: 0,
          errors: []
        };
      }

      console.log(`📝 Found ${actions.length} actions to sync`);

      let syncedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Process actions one by one
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        
        try {
          await this.processOfflineAction(action);
          await offlineStorageService.removeActionFromQueue(action.id);
          syncedCount++;
          console.log(`✅ Synced action: ${action.type}`);
        } catch (error) {
          console.error(`❌ Failed to sync action ${action.type}:`, error);
          
          // Increment retry count
          await offlineStorageService.incrementRetryCount(action.id);
          failedCount++;
          errors.push(`${action.type}: ${error.message}`);
        }

        // Update progress
        const progress = ((i + 1) / actions.length) * 100;
        this.notifyListeners(progress);
      }

      // Clean up expired actions
      await offlineStorageService.clearExpiredActions();

      // Update last sync timestamp
      await offlineStorageService.updateLastSyncTimestamp();

      // Sync cache data
      await this.syncCacheData();

      const result: SyncResult = {
        success: failedCount === 0,
        syncedActions: syncedCount,
        failedActions: failedCount,
        errors
      };

      if (syncedCount > 0) {
        this.showSyncSuccessNotification(syncedCount, failedCount);
      }

      console.log('🔄 Sync completed:', result);
      return result;

    } catch (error) {
      console.error('❌ Sync failed:', error);
      return {
        success: false,
        syncedActions: 0,
        failedActions: 0,
        errors: [error.message]
      };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private async processOfflineAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'START_WORK':
        await this.syncStartWork(action);
        break;
      case 'UPDATE_PROGRESS':
        await this.syncProgressUpdate(action);
        break;
      case 'COMPLETE_WORK':
        await this.syncCompleteWork(action);
        break;
      case 'UPDATE_PROFILE':
        await this.syncProfileUpdate(action);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async syncStartWork(action: OfflineAction): Promise<void> {
    const { assignmentId, location } = action.payload;
    const response = await apiService.startWorkOnAssignment(assignmentId, location);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to start work');
    }
  }

  private async syncProgressUpdate(action: OfflineAction): Promise<void> {
    const { assignmentId, formData } = action.payload;
    const response = await apiService.updateWorkProgress(assignmentId, formData);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update progress');
    }
  }

  private async syncCompleteWork(action: OfflineAction): Promise<void> {
    const { assignmentId, notes, photos, location } = action.payload;
    const response = await apiService.completeWorkOnAssignment(assignmentId, notes, photos, location);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to complete work');
    }
  }

  private async syncProfileUpdate(action: OfflineAction): Promise<void> {
    const { workerId, profileData } = action.payload;
    const response = await apiService.updateWorkerProfile(workerId, profileData);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update profile');
    }
  }

  private async syncCacheData(): Promise<void> {
    try {
      // Refresh assignments cache
      const user = await apiService.getCurrentUser();
      if (user && user.id) {
        const assignmentsResponse = await apiService.getWorkerAssignments(user.id);
        if (assignmentsResponse.success && assignmentsResponse.data) {
          const assignments = assignmentsResponse.data.assignments || [];
          await offlineStorageService.cacheAssignments(assignments);
        }

        // Refresh profile cache
        const profileResponse = await apiService.getWorkerProfile(user.id);
        if (profileResponse.success && profileResponse.data) {
          await offlineStorageService.cacheWorkerProfile(profileResponse.data);
        }
      }
    } catch (error) {
      console.error('❌ Failed to sync cache data:', error);
    }
  }

  private showSyncSuccessNotification(synced: number, failed: number) {
    const message = failed > 0 
      ? `Synced ${synced} actions, ${failed} failed`
      : `Successfully synced ${synced} actions`;
    
    Alert.alert('Sync Complete', message, [{ text: 'OK' }]);
  }

  // Public methods
  async forcSync(): Promise<SyncResult> {
    console.log('🔄 Force sync requested');
    return this.syncOfflineData();
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const actions = await offlineStorageService.getActionQueue();
    const stats = await offlineStorageService.getCacheStats();
    
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: stats.lastSync,
      pendingActions: actions.length,
      syncProgress: 0
    };
  }

  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
    
    if (enabled) {
      this.startPeriodicSync();
      // Trigger immediate sync if online
      if (networkService.isOnline()) {
        setTimeout(() => this.syncOfflineData(), 1000);
      }
    } else {
      this.stopPeriodicSync();
    }
    
    console.log(`🔄 Auto-sync ${enabled ? 'enabled' : 'disabled'}`);
  }

  isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled;
  }

  // Queue offline actions
  async queueStartWork(assignmentId: string, location: any): Promise<void> {
    await offlineStorageService.queueAction({
      type: 'START_WORK',
      payload: { assignmentId, location }
    });
    
    console.log('📝 Queued start work action for:', assignmentId);
  }

  async queueProgressUpdate(assignmentId: string, formData: FormData): Promise<void> {
    await offlineStorageService.queueAction({
      type: 'UPDATE_PROGRESS',
      payload: { assignmentId, formData }
    });
    
    console.log('📝 Queued progress update for:', assignmentId);
  }

  async queueCompleteWork(assignmentId: string, notes: string, photos: any[], location: any): Promise<void> {
    await offlineStorageService.queueAction({
      type: 'COMPLETE_WORK',
      payload: { assignmentId, notes, photos, location }
    });
    
    console.log('📝 Queued complete work action for:', assignmentId);
  }

  async queueProfileUpdate(workerId: string, profileData: any): Promise<void> {
    await offlineStorageService.queueAction({
      type: 'UPDATE_PROFILE',
      payload: { workerId, profileData }
    });
    
    console.log('📝 Queued profile update for:', workerId);
  }

  // Listeners
  addSyncListener(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback);
    
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(progress: number = 0) {
    const status: SyncStatus = {
      isSyncing: this.isSyncing,
      lastSyncTime: Date.now(),
      pendingActions: 0, // Will be updated by getSyncStatus
      syncProgress: progress
    };
    
    this.syncListeners.forEach(listener => listener(status));
  }

  // Cleanup
  destroy(): void {
    this.stopPeriodicSync();
    this.syncListeners = [];
  }
}

export const syncService = new SyncService();

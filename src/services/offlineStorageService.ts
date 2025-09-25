import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineAction {
  id: string;
  type: 'START_WORK' | 'UPDATE_PROGRESS' | 'COMPLETE_WORK' | 'UPDATE_PROFILE';
  payload: any;
  timestamp: number;
  retryCount: number;
}

export interface CachedAssignment {
  id: string;
  issueId: string;
  workerId: string;
  status: string;
  priority: string;
  assignedAt: string;
  issue: {
    id: string;
    title: string;
    description: string;
    location: string;
    category: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    photos?: string[];
    reportedAt: string;
  };
  cachedAt: number;
}

export interface CachedWorkerProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  department: string;
  profilePicture?: string;
  skills: string[];
  address?: {
    city?: string;
    state?: string;
    street?: string;
    pincode?: string;
  };
  cachedAt: number;
}

class OfflineStorageService {
  private readonly ASSIGNMENTS_KEY = 'offline_assignments';
  private readonly ACTIONS_QUEUE_KEY = 'offline_actions_queue';
  private readonly WORKER_PROFILE_KEY = 'offline_worker_profile';
  private readonly PROGRESS_UPDATES_KEY = 'offline_progress_updates';
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  // Cache Management
  async cacheAssignments(assignments: CachedAssignment[]): Promise<void> {
    try {
      const cachedData = assignments.map(assignment => ({
        ...assignment,
        cachedAt: Date.now()
      }));
      
      await AsyncStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(cachedData));
      console.log('📦 Cached assignments:', cachedData.length);
    } catch (error) {
      console.error('❌ Error caching assignments:', error);
    }
  }

  async getCachedAssignments(): Promise<CachedAssignment[]> {
    try {
      const cached = await AsyncStorage.getItem(this.ASSIGNMENTS_KEY);
      if (!cached) return [];

      const assignments: CachedAssignment[] = JSON.parse(cached);
      
      // Filter out expired cache
      const now = Date.now();
      const validAssignments = assignments.filter(
        assignment => (now - assignment.cachedAt) < this.CACHE_EXPIRY
      );

      if (validAssignments.length !== assignments.length) {
        // Update cache with only valid assignments
        await this.cacheAssignments(validAssignments);
      }

      console.log('📦 Retrieved cached assignments:', validAssignments.length);
      return validAssignments;
    } catch (error) {
      console.error('❌ Error retrieving cached assignments:', error);
      return [];
    }
  }

  async cacheWorkerProfile(profile: CachedWorkerProfile): Promise<void> {
    try {
      const cachedProfile = {
        ...profile,
        cachedAt: Date.now()
      };
      
      await AsyncStorage.setItem(this.WORKER_PROFILE_KEY, JSON.stringify(cachedProfile));
      console.log('📦 Cached worker profile');
    } catch (error) {
      console.error('❌ Error caching worker profile:', error);
    }
  }

  async getCachedWorkerProfile(): Promise<CachedWorkerProfile | null> {
    try {
      const cached = await AsyncStorage.getItem(this.WORKER_PROFILE_KEY);
      if (!cached) return null;

      const profile: CachedWorkerProfile = JSON.parse(cached);
      
      // Check if cache is expired
      const now = Date.now();
      if ((now - profile.cachedAt) > this.CACHE_EXPIRY) {
        await AsyncStorage.removeItem(this.WORKER_PROFILE_KEY);
        return null;
      }

      console.log('📦 Retrieved cached worker profile');
      return profile;
    } catch (error) {
      console.error('❌ Error retrieving cached worker profile:', error);
      return null;
    }
  }

  // Offline Actions Queue
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const actionWithMeta: OfflineAction = {
        ...action,
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0
      };

      const existingQueue = await this.getActionQueue();
      const updatedQueue = [...existingQueue, actionWithMeta];
      
      await AsyncStorage.setItem(this.ACTIONS_QUEUE_KEY, JSON.stringify(updatedQueue));
      console.log('📝 Queued offline action:', actionWithMeta.type);
    } catch (error) {
      console.error('❌ Error queuing action:', error);
    }
  }

  async getActionQueue(): Promise<OfflineAction[]> {
    try {
      const queue = await AsyncStorage.getItem(this.ACTIONS_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('❌ Error retrieving action queue:', error);
      return [];
    }
  }

  async removeActionFromQueue(actionId: string): Promise<void> {
    try {
      const queue = await this.getActionQueue();
      const updatedQueue = queue.filter(action => action.id !== actionId);
      
      await AsyncStorage.setItem(this.ACTIONS_QUEUE_KEY, JSON.stringify(updatedQueue));
      console.log('✅ Removed action from queue:', actionId);
    } catch (error) {
      console.error('❌ Error removing action from queue:', error);
    }
  }

  async incrementRetryCount(actionId: string): Promise<void> {
    try {
      const queue = await this.getActionQueue();
      const updatedQueue = queue.map(action => 
        action.id === actionId 
          ? { ...action, retryCount: action.retryCount + 1 }
          : action
      );
      
      await AsyncStorage.setItem(this.ACTIONS_QUEUE_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('❌ Error incrementing retry count:', error);
    }
  }

  async clearExpiredActions(): Promise<void> {
    try {
      const queue = await this.getActionQueue();
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      const maxRetries = 5;

      const validActions = queue.filter(action => 
        (now - action.timestamp) < maxAge && action.retryCount < maxRetries
      );

      await AsyncStorage.setItem(this.ACTIONS_QUEUE_KEY, JSON.stringify(validActions));
      
      if (validActions.length !== queue.length) {
        console.log('🧹 Cleared expired/failed actions:', queue.length - validActions.length);
      }
    } catch (error) {
      console.error('❌ Error clearing expired actions:', error);
    }
  }

  // Progress Updates Cache
  async cacheProgressUpdate(assignmentId: string, update: any): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(this.PROGRESS_UPDATES_KEY);
      const updates = existing ? JSON.parse(existing) : {};
      
      if (!updates[assignmentId]) {
        updates[assignmentId] = [];
      }
      
      updates[assignmentId].push({
        ...update,
        cachedAt: Date.now(),
        synced: false
      });

      await AsyncStorage.setItem(this.PROGRESS_UPDATES_KEY, JSON.stringify(updates));
      console.log('📦 Cached progress update for assignment:', assignmentId);
    } catch (error) {
      console.error('❌ Error caching progress update:', error);
    }
  }

  async getCachedProgressUpdates(assignmentId: string): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(this.PROGRESS_UPDATES_KEY);
      if (!cached) return [];

      const updates = JSON.parse(cached);
      return updates[assignmentId] || [];
    } catch (error) {
      console.error('❌ Error retrieving cached progress updates:', error);
      return [];
    }
  }

  async markProgressUpdateSynced(assignmentId: string, updateIndex: number): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(this.PROGRESS_UPDATES_KEY);
      if (!cached) return;

      const updates = JSON.parse(cached);
      if (updates[assignmentId] && updates[assignmentId][updateIndex]) {
        updates[assignmentId][updateIndex].synced = true;
        await AsyncStorage.setItem(this.PROGRESS_UPDATES_KEY, JSON.stringify(updates));
      }
    } catch (error) {
      console.error('❌ Error marking progress update as synced:', error);
    }
  }

  // Cache Statistics
  async getCacheStats(): Promise<{
    assignmentsCount: number;
    queuedActionsCount: number;
    cacheSize: string;
    lastSync: number | null;
  }> {
    try {
      const assignments = await this.getCachedAssignments();
      const queue = await this.getActionQueue();
      
      // Estimate cache size (rough calculation)
      const assignmentsSize = JSON.stringify(assignments).length;
      const queueSize = JSON.stringify(queue).length;
      const totalSize = assignmentsSize + queueSize;
      
      const sizeInKB = (totalSize / 1024).toFixed(2);
      
      // Get last sync timestamp
      const lastSync = await AsyncStorage.getItem('last_sync_timestamp');
      
      return {
        assignmentsCount: assignments.length,
        queuedActionsCount: queue.length,
        cacheSize: `${sizeInKB} KB`,
        lastSync: lastSync ? parseInt(lastSync) : null
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return {
        assignmentsCount: 0,
        queuedActionsCount: 0,
        cacheSize: '0 KB',
        lastSync: null
      };
    }
  }

  async updateLastSyncTimestamp(): Promise<void> {
    try {
      await AsyncStorage.setItem('last_sync_timestamp', Date.now().toString());
    } catch (error) {
      console.error('❌ Error updating last sync timestamp:', error);
    }
  }

  // Clear all offline data
  async clearAllCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.ASSIGNMENTS_KEY),
        AsyncStorage.removeItem(this.ACTIONS_QUEUE_KEY),
        AsyncStorage.removeItem(this.WORKER_PROFILE_KEY),
        AsyncStorage.removeItem(this.PROGRESS_UPDATES_KEY),
        AsyncStorage.removeItem('last_sync_timestamp')
      ]);
      
      console.log('🧹 Cleared all offline cache');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }
}

export const offlineStorageService = new OfflineStorageService();

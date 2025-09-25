import { apiService } from './apiService';
import { networkService } from './networkService';
import { offlineStorageService } from './offlineStorageService';
import { syncService } from './syncService';

/**
 * Offline-aware API service that handles online/offline scenarios
 * Falls back to cached data when offline and queues actions for later sync
 */
class OfflineApiService {
  
  // Worker Assignments - with offline support
  async getWorkerAssignments(workerId: string, params?: any) {
    if (networkService.isOnline()) {
      try {
        const response = await apiService.getWorkerAssignments(workerId, params);
        
        // Cache successful responses
        if (response.success && response.data) {
          const assignments = response.data.assignments || [];
          await offlineStorageService.cacheAssignments(assignments);
        }
        
        return response;
      } catch (error) {
        console.log('🌐 API call failed, falling back to cache');
        return this.getCachedAssignments();
      }
    } else {
      console.log('📱 Offline mode: using cached assignments');
      return this.getCachedAssignments();
    }
  }

  private async getCachedAssignments() {
    const cachedAssignments = await offlineStorageService.getCachedAssignments();
    
    return {
      success: true,
      data: {
        assignments: cachedAssignments,
        total: cachedAssignments.length
      },
      fromCache: true
    };
  }

  // Worker Profile - with offline support
  async getWorkerProfile(workerId: string) {
    if (networkService.isOnline()) {
      try {
        const response = await apiService.getWorkerProfile(workerId);
        
        // Cache successful responses
        if (response.success && response.data) {
          const worker = (response as any).data.worker || (response as any).data;
          await offlineStorageService.cacheWorkerProfile(worker);
        }
        
        return response;
      } catch (error) {
        console.log('🌐 API call failed, falling back to cache');
        return this.getCachedProfile();
      }
    } else {
      console.log('📱 Offline mode: using cached profile');
      return this.getCachedProfile();
    }
  }

  private async getCachedProfile() {
    const cachedProfile = await offlineStorageService.getCachedWorkerProfile();
    
    if (cachedProfile) {
      return {
        success: true,
        data: cachedProfile,
        fromCache: true
      };
    } else {
      return {
        success: false,
        error: { message: 'No cached profile available' },
        fromCache: true
      };
    }
  }

  // Work Actions - with offline queuing
  async startWorkOnAssignment(assignmentId: string, location: any) {
    if (networkService.isOnline()) {
      try {
        return await apiService.startWorkOnAssignment(assignmentId, location);
      } catch (error) {
        console.log('🌐 API call failed, queuing for later sync');
        await syncService.queueStartWork(assignmentId, location);
        return this.createOfflineResponse('Work start queued for sync');
      }
    } else {
      console.log('📱 Offline mode: queuing start work action');
      await syncService.queueStartWork(assignmentId, location);
      return this.createOfflineResponse('Work start queued for sync when online');
    }
  }

  async updateWorkProgress(assignmentId: string, formData: FormData) {
    if (networkService.isOnline()) {
      try {
        const response = await apiService.updateWorkProgress(assignmentId, formData);
        
        // Cache progress update locally
        if (response.success) {
          await offlineStorageService.cacheProgressUpdate(assignmentId, {
            notes: formData.get('notes'),
            progressPercentage: formData.get('progressPercentage'),
            timestamp: Date.now()
          });
        }
        
        return response;
      } catch (error) {
        console.log('🌐 API call failed, queuing for later sync');
        await syncService.queueProgressUpdate(assignmentId, formData);
        
        // Cache locally for immediate UI update
        await offlineStorageService.cacheProgressUpdate(assignmentId, {
          notes: formData.get('notes'),
          progressPercentage: formData.get('progressPercentage'),
          timestamp: Date.now(),
          offline: true
        });
        
        return this.createOfflineResponse('Progress update queued for sync');
      }
    } else {
      console.log('📱 Offline mode: queuing progress update');
      await syncService.queueProgressUpdate(assignmentId, formData);
      
      // Cache locally for immediate UI update
      await offlineStorageService.cacheProgressUpdate(assignmentId, {
        notes: formData.get('notes'),
        progressPercentage: formData.get('progressPercentage'),
        timestamp: Date.now(),
        offline: true
      });
      
      return this.createOfflineResponse('Progress update saved offline');
    }
  }

  async completeWorkOnAssignment(assignmentId: string, notes: string, photos: any[], location: any) {
    if (networkService.isOnline()) {
      try {
        return await apiService.completeWorkOnAssignment(assignmentId, notes, photos, location);
      } catch (error) {
        console.log('🌐 API call failed, queuing for later sync');
        await syncService.queueCompleteWork(assignmentId, notes, photos, location);
        return this.createOfflineResponse('Work completion queued for sync');
      }
    } else {
      console.log('📱 Offline mode: queuing complete work action');
      await syncService.queueCompleteWork(assignmentId, notes, photos, location);
      return this.createOfflineResponse('Work completion queued for sync when online');
    }
  }

  // Profile Updates - with offline queuing
  async updateWorkerProfile(workerId: string, profileData: any) {
    if (networkService.isOnline()) {
      try {
        const response = await apiService.updateWorkerProfile(workerId, profileData);
        
        // Update cache with new data
        if (response.success && response.data) {
          await offlineStorageService.cacheWorkerProfile(response.data);
        }
        
        return response;
      } catch (error) {
        console.log('🌐 API call failed, queuing for later sync');
        await syncService.queueProfileUpdate(workerId, profileData);
        return this.createOfflineResponse('Profile update queued for sync');
      }
    } else {
      console.log('📱 Offline mode: queuing profile update');
      await syncService.queueProfileUpdate(workerId, profileData);
      return this.createOfflineResponse('Profile update queued for sync when online');
    }
  }

  // Dashboard Data - with offline support
  async getWorkerDashboard(workerId: string) {
    if (networkService.isOnline()) {
      try {
        return await apiService.getWorkerDashboard(workerId);
      } catch (error) {
        console.log('🌐 API call failed, generating offline dashboard');
        return this.generateOfflineDashboard(workerId);
      }
    } else {
      console.log('📱 Offline mode: generating dashboard from cache');
      return this.generateOfflineDashboard(workerId);
    }
  }

  private async generateOfflineDashboard(workerId: string) {
    const cachedAssignments = await offlineStorageService.getCachedAssignments();
    const cachedProfile = await offlineStorageService.getCachedWorkerProfile();
    
    // Generate basic stats from cached data
    const totalAssignments = cachedAssignments.length;
    const inProgressCount = cachedAssignments.filter(a => a.status === 'in_progress').length;
    const completedCount = cachedAssignments.filter(a => a.status === 'completed').length;
    const pendingCount = cachedAssignments.filter(a => a.status === 'assigned').length;
    
    // Get today's assignments
    const today = new Date().toDateString();
    const todayAssignments = cachedAssignments.filter(a => 
      new Date(a.assignedAt).toDateString() === today
    );

    // Get priority issues
    const priorityIssues = cachedAssignments
      .filter(a => a.priority === 'high' && a.status !== 'completed')
      .slice(0, 5);

    return {
      success: true,
      data: {
        worker: cachedProfile || { fullName: 'Worker', department: 'Unknown' },
        stats: {
          totalAssignments,
          todayAssignments: todayAssignments.length,
          inProgressCount,
          completedCount,
          pendingCount
        },
        priorityIssues: priorityIssues.map(a => ({
          id: a.issue.id,
          title: a.issue.title,
          location: a.issue.location,
          category: a.issue.category,
          priority: a.priority,
          assignedAt: a.assignedAt
        }))
      },
      fromCache: true
    };
  }

  // Issue Details - with offline support
  async getIssueDetails(issueId: string) {
    if (networkService.isOnline()) {
      try {
        // Try worker-specific endpoint first, fallback to regular endpoint
        try {
          return await apiService.getWorkerIssueDetails(issueId);
        } catch (workerError) {
          console.log('🔄 Worker endpoint failed, trying regular endpoint');
          return await apiService.getIssueDetails(issueId);
        }
      } catch (error) {
        console.log('🌐 API call failed, searching cache');
        return this.getCachedIssueDetails(issueId);
      }
    } else {
      console.log('📱 Offline mode: searching cached issue details');
      return this.getCachedIssueDetails(issueId);
    }
  }

  private async getCachedIssueDetails(issueId: string) {
    const cachedAssignments = await offlineStorageService.getCachedAssignments();
    const assignment = cachedAssignments.find(a => a.issueId === issueId);
    
    if (assignment && assignment.issue) {
      return {
        success: true,
        data: {
          issue: assignment.issue,
          assignment: {
            id: assignment.id,
            status: assignment.status,
            priority: assignment.priority,
            assignedAt: assignment.assignedAt
          }
        },
        fromCache: true
      };
    } else {
      return {
        success: false,
        error: { message: 'Issue not found in cache' },
        fromCache: true
      };
    }
  }

  // Helper methods
  private createOfflineResponse(message: string) {
    return {
      success: true,
      data: { message },
      offline: true
    };
  }

  // Network status methods
  isOnline(): boolean {
    return networkService.isOnline();
  }

  isOffline(): boolean {
    return networkService.isOffline();
  }

  getNetworkStatus(): string {
    return networkService.getNetworkStatusMessage();
  }

  // Sync methods
  async forcSync() {
    return syncService.forcSync();
  }

  async getSyncStatus() {
    return syncService.getSyncStatus();
  }

  // Cache management
  async getCacheStats() {
    return offlineStorageService.getCacheStats();
  }

  async clearCache() {
    return offlineStorageService.clearAllCache();
  }
}

export const offlineApiService = new OfflineApiService();

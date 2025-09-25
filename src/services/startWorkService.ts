import { Alert } from 'react-native';
import locationService from './locationService';
import timeTrackingService from './timeTrackingService';
import { offlineApiService } from './offlineApiService';
import { tokenStorage } from '../utils/tokenStorage';
import { getCurrentConfig } from '../config/environment';

export interface StartWorkOptions {
  issueId: string;
  assignmentId?: string;
  issueTitle: string;
  userId: string;
  onSuccess?: (sessionId?: string) => void;
  onError?: (error: string) => void;
  showConfirmation?: boolean;
}

class StartWorkService {
  /**
   * Unified start work function that combines all the best practices
   */
  async startWork(options: StartWorkOptions): Promise<void> {
    const {
      issueId,
      assignmentId,
      issueTitle,
      userId,
      onSuccess,
      onError,
      showConfirmation = true
    } = options;

    try {
      // Step 1: Show confirmation dialog if requested
      if (showConfirmation) {
        const confirmed = await this.showConfirmationDialog(issueTitle);
        if (!confirmed) return;
      }

      // Step 2: Get and validate current location
      const location = await this.getCurrentLocationWithValidation();
      if (!location) {
        onError?.('Location access is required to start work');
        return;
      }

      // Step 3: Start work session via API
      const sessionId = await this.startWorkSession(issueId, assignmentId, location, issueTitle);
      if (!sessionId) {
        onError?.('Failed to start work session');
        return;
      }

      // Step 4: Start local time tracking
      if (assignmentId) {
        await this.startTimeTracking(assignmentId, issueId, userId, location);
      }

      // Step 5: Show success message
      this.showSuccessMessage(location);

      // Step 6: Call success callback
      onSuccess?.(sessionId);

    } catch (error) {
      console.error('Start work error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start work. Please try again.';
      onError?.(errorMessage);
      Alert.alert('Error', errorMessage);
    }
  }

  /**
   * Show confirmation dialog
   */
  private showConfirmationDialog(issueTitle: string): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Start Work',
        `Are you sure you want to start working on "${issueTitle}"?`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Start Work',
            onPress: () => resolve(true),
            style: 'default',
          },
        ]
      );
    });
  }

  /**
   * Get current location with validation and user feedback
   */
  private async getCurrentLocationWithValidation(): Promise<any> {
    try {
      // Get current location with retry
      const currentLocation = await locationService.getCurrentLocationWithRetry(3, 2000);
      
      if (!currentLocation) {
        const retry = await this.showLocationRequiredDialog();
        if (retry) {
          return await this.getCurrentLocationWithValidation();
        }
        return null;
      }

      // Check location accuracy
      if (!locationService.isLocationAccurate(currentLocation, 100)) {
        const continueAnyway = await this.showLocationAccuracyDialog(currentLocation.accuracy);
        if (!continueAnyway) {
          return null;
        }
      }

      return currentLocation;
    } catch (error) {
      console.error('Location error:', error);
      throw new Error('Failed to get current location');
    }
  }

  /**
   * Show location required dialog
   */
  private showLocationRequiredDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Location Required',
        'Location access is required to start work. This helps verify you are at the work site.',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => resolve(false)
          },
          { 
            text: 'Retry', 
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }

  /**
   * Show location accuracy dialog
   */
  private showLocationAccuracyDialog(accuracy?: number): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Location Accuracy',
        `Location accuracy is ${accuracy?.toFixed(0)}m. For better tracking, please move to an area with better GPS signal.`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => resolve(false)
          },
          { 
            text: 'Continue Anyway', 
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }

  /**
   * Start work session via API
   */
  private async startWorkSession(
    issueId: string, 
    assignmentId: string | undefined, 
    location: any, 
    issueTitle: string
  ): Promise<string | null> {
    try {
      // Try the assignment-based API first (more robust)
      if (assignmentId) {
        const response = await offlineApiService.startWorkOnAssignment(
          issueId,
          locationService.createLocationPayload(location)
        );

        if (response.success) {
          return response.data?.sessionId || 'assignment-session';
        }
      }

      // Fallback to direct work progress API
      const config = getCurrentConfig();
      const response = await fetch(`${config.BASE_URL}/work-progress/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await tokenStorage.getToken()}`,
        },
        body: JSON.stringify({
          issueId: issueId,
          location: locationService.createLocationPayload(location),
          estimatedDuration: 60, // Default 1 hour
          notes: `Started work on ${issueTitle}`
        })
      });

      const result = await response.json();

      if (result.success) {
        return result.data?.sessionId || 'work-progress-session';
      } else {
        throw new Error(result.error?.message || 'Failed to start work session');
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  /**
   * Start local time tracking
   */
  private async startTimeTracking(
    assignmentId: string,
    issueId: string,
    userId: string,
    location: any
  ): Promise<void> {
    try {
      await timeTrackingService.startTimeTracking(
        assignmentId,
        issueId,
        userId,
        location
      );
      console.log('⏱️ Time tracking started for assignment:', assignmentId);
    } catch (timeError) {
      console.error('Error starting time tracking:', timeError);
      // Don't fail the entire operation for time tracking errors
    }
  }

  /**
   * Show success message
   */
  private showSuccessMessage(location: any): void {
    Alert.alert(
      'Work Started',
      `Work started successfully at ${locationService.formatLocationForDisplay(location)}\n\nTime tracking has begun.`,
      [{ text: 'OK' }]
    );
  }
}

export const startWorkService = new StartWorkService();

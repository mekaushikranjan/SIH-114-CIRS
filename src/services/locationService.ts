import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
  address?: string;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private lastKnownLocation: LocationData | null = null;

  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status
      };
    } catch (error) {
      console.error('Location permission error:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED
      };
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(highAccuracy: boolean = true): Promise<LocationData | null> {
    try {
      const permission = await this.requestLocationPermission();
      
      if (!permission.granted) {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to track work locations and verify check-ins.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: new Date().toISOString(),
      };

      // Try to get address
      try {
        const address = await this.reverseGeocode(locationData.latitude, locationData.longitude);
        locationData.address = address || undefined;
      } catch (geocodeError) {
        console.log('Geocoding failed:', geocodeError);
      }

      this.lastKnownLocation = locationData;
      return locationData;
    } catch (error) {
      console.error('Get location error:', error);
      Alert.alert('Location Error', 'Failed to get current location. Please try again.');
      return null;
    }
  }

  /**
   * Start watching location changes
   */
  async startLocationTracking(
    callback: (location: LocationData) => void,
    options?: {
      accuracy?: Location.Accuracy;
      timeInterval?: number;
      distanceInterval?: number;
    }
  ): Promise<boolean> {
    try {
      const permission = await this.requestLocationPermission();
      
      if (!permission.granted) {
        return false;
      }

      // Stop existing tracking
      if (this.watchId) {
        this.stopLocationTracking();
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.High,
          timeInterval: options?.timeInterval || 10000, // 10 seconds
          distanceInterval: options?.distanceInterval || 10, // 10 meters
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            altitude: location.coords.altitude || undefined,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
            timestamp: new Date().toISOString(),
          };

          this.lastKnownLocation = locationData;
          callback(locationData);
        }
      );

      return true;
    } catch (error) {
      console.error('Start location tracking error:', error);
      return false;
    }
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        const parts = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.postalCode,
          address.country
        ].filter(Boolean);

        return parts.join(', ');
      }

      return null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points (in meters)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if worker is within acceptable range of work site
   */
  isWithinWorkSite(
    currentLat: number,
    currentLon: number,
    workSiteLat: number,
    workSiteLon: number,
    maxDistance: number = 100 // 100 meters default
  ): boolean {
    const distance = this.calculateDistance(currentLat, currentLon, workSiteLat, workSiteLon);
    return distance <= maxDistance;
  }

  /**
   * Get last known location
   */
  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Check location services error:', error);
      return false;
    }
  }

  /**
   * Format location for display
   */
  formatLocationForDisplay(location: LocationData): string {
    if (location.address) {
      return location.address;
    }
    
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  /**
   * Create location object for API calls
   */
  createLocationPayload(location: LocationData): any {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
      address: location.address,
    };
  }

  /**
   * Validate location accuracy
   */
  isLocationAccurate(location: LocationData, maxAccuracy: number = 50): boolean {
    return !location.accuracy || location.accuracy <= maxAccuracy;
  }

  /**
   * Get location with retry mechanism
   */
  async getCurrentLocationWithRetry(
    maxRetries: number = 3,
    retryDelay: number = 2000
  ): Promise<LocationData | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const location = await this.getCurrentLocation();
        if (location && this.isLocationAccurate(location)) {
          return location;
        }
        
        if (attempt < maxRetries) {
          console.log(`Location attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        console.error(`Location attempt ${attempt} error:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
    
    return null;
  }

  /**
   * Background location tracking for work sessions
   */
  async startBackgroundLocationTracking(): Promise<boolean> {
    try {
      const permission = await Location.requestBackgroundPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert(
          'Background Location Required',
          'To track work progress accurately, please allow background location access.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestBackgroundPermissionsAsync() }
          ]
        );
        return false;
      }

      // Start background location task
      await Location.startLocationUpdatesAsync('workTracking', {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 20, // 20 meters
        foregroundService: {
          notificationTitle: 'Work Location Tracking',
          notificationBody: 'Tracking your work location for progress verification.',
        },
      });

      return true;
    } catch (error) {
      console.error('Background location tracking error:', error);
      return false;
    }
  }

  /**
   * Stop background location tracking
   */
  async stopBackgroundLocationTracking(): Promise<void> {
    try {
      await Location.stopLocationUpdatesAsync('workTracking');
    } catch (error) {
      console.error('Stop background tracking error:', error);
    }
  }
}

export const locationService = new LocationService();
export default locationService;

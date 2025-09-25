// Environment Configuration
import Constants from 'expo-constants';

export interface EnvironmentConfig {
  BASE_URL: string;
  WS_URL: string;
  TIMEOUT: number;
}

export const ENVIRONMENTS = {
  development: {
    BASE_URL: 'http://192.168.29.36:3003/api/v1',
    WS_URL: 'ws://192.168.29.36:3003/ws',
    TIMEOUT: 60000, // Increased to 60 seconds for video uploads
  },
  local: {
    BASE_URL: 'http://localhost:3003/api/v1',
    WS_URL: 'ws://localhost:3003/ws',
    TIMEOUT: 60000,
  },
  staging: {
    BASE_URL: 'https://staging-api.civic-reporter.jharkhand.gov.in/v1',
    WS_URL: 'wss://staging-api.civic-reporter.jharkhand.gov.in',
    TIMEOUT: 15000,
  },
  production: {
    BASE_URL: 'https://api.civic-reporter.jharkhand.gov.in/v1',
    WS_URL: 'wss://api.civic-reporter.jharkhand.gov.in',
    TIMEOUT: 20000,
  },
};

export const FEATURE_FLAGS = {
  USE_REAL_API: true, // Re-enabled after fixing auth middleware
  ENABLE_OFFLINE_SUPPORT: true,
  ENABLE_WEBSOCKETS: true, // Enable WebSockets for real-time alerts
  ENABLE_DEBUG_LOGGING: __DEV__,
};

// Get current environment
export const getCurrentEnvironment = (): keyof typeof ENVIRONMENTS => {
  if (__DEV__) return 'development';
  // Add logic for staging detection if needed
  return 'production';
};

// Get current configuration
export const getCurrentConfig = (): EnvironmentConfig => {
  return ENVIRONMENTS[getCurrentEnvironment()];
};

// Debug logging helper
export const debugLog = (message: string, ...args: any[]) => {
  if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
    console.log(`[Civic Reporter] ${message}`, ...args);
  }
};
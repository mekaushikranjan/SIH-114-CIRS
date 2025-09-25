import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

console.log('[Firebase] Starting initialization...');

// Get Firebase config from Expo constants
const config = Constants.expoConfig?.extra?.firebase;
if (!config) {
  throw new Error('[Firebase] Missing firebase config in app.config.js extra');
}

console.log('[Firebase] Config loaded successfully');

// Initialize Firebase app if not already initialized
const firebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
console.log('[Firebase] App initialized');

// Initialize Firebase Auth with React Native persistence
const firebaseAuth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(AsyncStorage)
});
console.log('[Firebase] Auth initialized with AsyncStorage persistence');

export { firebaseApp, firebaseAuth };



import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useSelector } from 'react-redux';
import { View, Text, Platform } from 'react-native';
import { store } from './src/store/store';
import { RootState } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthInitialization } from './src/hooks/useAuthInitialization';
import LoadingScreen from './src/components/LoadingScreen';
import i18n from './src/i18n';
import * as NavigationBar from 'expo-navigation-bar';

// Firebase disabled - using database auth only
// import './src/services/firebase';

// Initialize Constants to prevent PlatformConstants error

function AppContent() {
  const { isInitialized } = useAuthInitialization();
  const preferences = useSelector((state: RootState) => state.user.preferences);
  const [showSplash, setShowSplash] = useState(true);

  // Update i18n language when preference changes
  useEffect(() => {
    if (preferences.language) {
      i18n.changeLanguage(preferences.language);
    }
  }, [preferences.language]);

  // Set navigation bar color for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#f0f7f0');
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  // Show splash screen first, then loading screen
  if (showSplash) {
    return (
      <LoadingScreen 
        type="splash"
        onLoadingComplete={() => setShowSplash(false)}
      />
    );
  }

  // Show loading screen while app is initializing
  if (!isInitialized) {
    return (
      <LoadingScreen 
        type="app"
        onLoadingComplete={() => {
          console.log('App initialization complete');
        }}
        minLoadingTime={2000}
      />
    );
  }
  
  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          background: '#f0f7f0',
          card: '#f0f7f0',
          text: '#000000',
          border: 'transparent',
          notification: '#2E7D32',
          primary: '#2E7D32',
        },
      }}
    >
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

import React, { useRef } from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import SwipeableWorkerTabNavigator, { SwipeableWorkerTabNavigatorRef } from '../components/SwipeableWorkerTabNavigator';

const Tab = createBottomTabNavigator();

// Import worker screens
import WorkerDashboardScreen from '../screens/worker/WorkerDashboardScreen';
import WorkerAssignmentsScreen from '../screens/worker/WorkerAssignmentsScreen';
import WorkerMapScreen from '../screens/worker/WorkerMapScreen';
import WorkerReportsScreen from '../screens/worker/WorkerReportsScreen';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';
import EditProfileScreen from '../screens/worker/EditProfileScreen';
import WorkHistoryScreen from '../screens/worker/WorkHistoryScreen';
import HelpSupportScreen from '../screens/worker/HelpSupportScreen';
import AboutAppScreen from '../screens/worker/AboutAppScreen';

const Stack = createStackNavigator();

// Profile Stack Navigator to handle profile-related screens
const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ProfileMain" 
      component={WorkerProfileScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="EditProfile" 
      component={EditProfileScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="WorkHistory" 
      component={WorkHistoryScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="HelpSupport" 
      component={HelpSupportScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="AboutApp" 
      component={AboutAppScreen} 
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);


const WorkerNavigator = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const tabNavigatorRef = useRef<SwipeableWorkerTabNavigatorRef>(null);

  // Define tabs for SwipeableWorkerTabNavigator
  const workerTabs = [
    {
      key: 'Dashboard',
      title: 'Dashboard',
      icon: 'home',
      iconOutline: 'home-outline',
      component: WorkerDashboardScreen,
    },
    {
      key: 'MyWork',
      title: 'My Work',
      icon: 'list',
      iconOutline: 'list-outline',
      component: WorkerAssignmentsScreen,
    },
    {
      key: 'Map',
      title: 'Map',
      icon: 'map',
      iconOutline: 'map-outline',
      component: WorkerMapScreen,
    },
    {
      key: 'Reports',
      title: 'Reports',
      icon: 'document-text',
      iconOutline: 'document-text-outline',
      component: WorkerReportsScreen,
    },
    {
      key: 'Profile',
      title: 'Profile',
      icon: 'person',
      iconOutline: 'person-outline',
      component: ProfileStack,
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <SwipeableWorkerTabNavigator 
        ref={tabNavigatorRef}
        tabs={workerTabs}
        initialTab={0}
      />
    </View>
  );
};

export default WorkerNavigator;

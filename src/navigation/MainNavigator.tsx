import React, { useRef } from 'react';
import { View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import SwipeableUserTabNavigator, { SwipeableUserTabNavigatorRef } from '../components/SwipeableUserTabNavigator';
import HomeScreen from '../screens/main/HomeScreen';
import AlertsScreen from '../screens/main/AlertsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import HelpSupportScreen from '../screens/main/HelpSupportScreen';
import PrivacyPolicyScreen from '../screens/main/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/main/TermsOfServiceScreen';
import AboutScreen from '../screens/main/AboutScreen';
import ComplaintWizardScreen from '../screens/main/ComplaintWizardScreen';
import DepartmentScreen from '../screens/main/DepartmentScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import TrackIssueScreen from '../screens/main/TrackIssueScreen';
import PublicIssuesScreen from '../screens/main/PublicIssuesScreen';


const Stack = createStackNavigator();




// Main Tab Navigator with swipe navigation
const MainTabNavigator = () => {
  const { t } = useTranslation();
  const tabNavigatorRef = useRef<SwipeableUserTabNavigatorRef>(null);

  // Define tabs for SwipeableUserTabNavigator - using direct screen components to avoid nested navigators
  const userTabs = [
    {
      key: 'Home',
      title: t('navigation.home'),
      icon: 'home',
      iconOutline: 'home-outline',
      component: HomeScreen,
    },
    {
      key: 'Issues',
      title: t('navigation.issues'),
      icon: 'list',
      iconOutline: 'list-outline',
      component: PublicIssuesScreen,
    },
    {
      key: 'Alerts',
      title: t('navigation.alerts'),
      icon: 'notifications',
      iconOutline: 'notifications-outline',
      component: AlertsScreen,
    },
    {
      key: 'Profile',
      title: t('navigation.profile'),
      icon: 'person',
      iconOutline: 'person-outline',
      component: ProfileScreen,
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <SwipeableUserTabNavigator 
        ref={tabNavigatorRef}
        tabs={userTabs}
        initialTab={0}
      />
    </View>
  );
};

// Keep the stack navigators for when they're needed via navigation
const UserStackNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Complaint" 
        component={ComplaintWizardScreen}
        options={{ title: t('navigation.reportIssue') }}
      />
      <Stack.Screen 
        name="Department" 
        component={DepartmentScreen}
        options={{ title: t('navigation.departmentIssues') }}
      />
      <Stack.Screen 
        name="TrackIssue" 
        component={TrackIssueScreen}
        options={{ 
          title: t('navigation.trackIssue'),
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="PublicIssues" 
        component={PublicIssuesScreen}
        options={{ 
          title: t('navigation.communityIssues'),
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: t('navigation.editProfile'),
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="HelpSupport" 
        component={HelpSupportScreen}
        options={{ 
          title: t('navigation.helpSupport'),
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen}
        options={{ 
          title: t('navigation.privacyPolicy'),
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="TermsOfService" 
        component={TermsOfServiceScreen}
        options={{ 
          title: t('navigation.termsOfService'),
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ 
          title: t('navigation.myIssues'),
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ 
          title: t('navigation.about'),
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  return <UserStackNavigator />;
};

export default MainNavigator;

import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { logout } from '../store/slices/authSlice';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import WorkerNavigator from './WorkerNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  // Check if user is logged in and role hasn't changed recently
  useEffect(() => {
    const checkUserRoleAndLogout = async () => {
      if (user && token && isAuthenticated) {
        try {
          // Check if user role was last updated more than 24 hours ago
          // Using loginTime as a fallback since lastRoleUpdate might not exist
          const lastRoleUpdate = (user as any).lastRoleUpdate || (user as any).loginTime || new Date().toISOString();
          const now = new Date();
          const roleUpdateTime = new Date(lastRoleUpdate);
          const hoursSinceUpdate = (now.getTime() - roleUpdateTime.getTime()) / (1000 * 60 * 60);

          // If role hasn't been updated in the last 24 hours, logout the user
          if (hoursSinceUpdate > 24) {
            console.log('User role not updated recently, logging out...');
            dispatch(logout());
            return;
          }

          // Additional check: Verify current role with backend
          // This could be expanded to make an API call to verify the user's current role
          // For now, we'll just check the local timestamp
          
        } catch (error) {
          console.error('Error checking user role:', error);
          // If there's an error checking the role, logout for security
          dispatch(logout());
        }
      }
    };

    checkUserRoleAndLogout();
  }, [user, token, isAuthenticated, dispatch]);

  const getNavigatorForRole = () => {
    if (!user) return MainNavigator; // Default fallback
    
    switch (user.role) {
      case 'worker':
        return WorkerNavigator;
      case 'admin':
        return MainNavigator; // Admin uses same navigator for now, can be changed later
      case 'citizen':
      default:
        return MainNavigator;
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={getNavigatorForRole()} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from './tokenStorage';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

export const authDebug = {
  // Complete authentication reset - clears everything
  async completeAuthReset(): Promise<void> {
    try {
      console.log('🔄 Starting complete authentication reset...');
      
      // Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📋 All AsyncStorage keys:', allKeys);
      
      // Filter auth-related keys
      const authKeys = allKeys.filter(key => 
        key.includes('auth') || 
        key.includes('token') || 
        key.includes('user') || 
        key.includes('firebase') ||
        key.includes('worker') ||
        key.includes('fallback') ||
        key.includes('mock')
      );
      
      console.log('🔑 Auth-related keys to remove:', authKeys);
      
      // Remove all auth-related keys
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
        console.log('✅ Removed auth-related keys');
      }
      
      // Also use our tokenStorage clear method
      await tokenStorage.clearAuthData();
      
      // Clear all AsyncStorage (nuclear option)
      await AsyncStorage.clear();
      console.log('💥 Cleared all AsyncStorage data');
      
      // Clear Redux state as well
      console.log('🔄 Clearing Redux auth state...');
      store.dispatch(logout());
      console.log('✅ Redux auth state cleared');
      
      console.log('✅ Complete authentication reset successful');
    } catch (error) {
      console.error('❌ Error during complete auth reset:', error);
      throw error;
    }
  },

  // Debug current auth state
  async debugAuthState(): Promise<void> {
    try {
      console.log('🔍 Debugging current authentication state...');
      
      // Check tokenStorage
      const token = await tokenStorage.getToken();
      const user = await tokenStorage.getUser();
      
      console.log('Token from tokenStorage:', token ? token.substring(0, 30) + '...' : 'null');
      console.log('User from tokenStorage:', user);
      
      // Check Redux state
      const reduxState = store.getState();
      console.log('Redux auth state:', {
        isAuthenticated: reduxState.auth.isAuthenticated,
        token: reduxState.auth.token ? reduxState.auth.token.substring(0, 30) + '...' : 'null',
        user: reduxState.auth.user ? { id: reduxState.auth.user.id, email: reduxState.auth.user.email } : 'null'
      });
      
      // Check all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      const allData: Record<string, string | null> = {};
      
      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(key);
        allData[key] = value;
      }
      
      console.log('📋 All AsyncStorage data:', allData);
      
      // Look for any token-like values
      const tokenLikeKeys = allKeys.filter(key => 
        key.toLowerCase().includes('token') || 
        key.toLowerCase().includes('auth')
      );
      
      console.log('🔑 Token-like keys:', tokenLikeKeys);
      for (const key of tokenLikeKeys) {
        const value = await AsyncStorage.getItem(key);
        console.log(`${key}:`, value ? value.substring(0, 50) + '...' : 'null');
      }
      
    } catch (error) {
      console.error('❌ Error during auth debug:', error);
    }
  },

  // Force logout and clear everything
  async forceLogout(): Promise<void> {
    try {
      console.log('🚪 Forcing complete logout...');
      
      await this.completeAuthReset();
      
      // The app should automatically redirect to login after this
      console.log('✅ Force logout complete - app should redirect to login');
      
    } catch (error) {
      console.error('❌ Error during force logout:', error);
      throw error;
    }
  }
};

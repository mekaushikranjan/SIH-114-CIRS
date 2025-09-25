import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'citizen' | 'admin' | 'worker';
}

export const tokenStorage = {
  // Store token and user data
  async storeAuthData(token: string, user: StoredUser): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, token],
        [USER_KEY, JSON.stringify(user)]
      ]);
      console.log('Auth data stored successfully');
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  },

  // Get stored token
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Get stored user data
  async getUser(): Promise<StoredUser | null> {
    try {
      const userStr = await AsyncStorage.getItem(USER_KEY);
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Get both token and user data
  async getAuthData(): Promise<{ token: string | null; user: StoredUser | null }> {
    try {
      const [token, userStr] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
      
      return {
        token: token[1],
        user: userStr[1] ? JSON.parse(userStr[1]) : null
      };
    } catch (error) {
      console.error('Error getting auth data:', error);
      return { token: null, user: null };
    }
  },

  // Clear all auth data (for logout)
  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      console.log('Auth data cleared successfully');
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token !== null;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  },

  // Force complete auth reset (for debugging/fixing auth issues)
  async forceAuthReset(): Promise<void> {
    try {
      console.log('🔄 Forcing complete authentication reset...');
      
      // Clear all possible auth-related keys
      const keysToRemove = [
        TOKEN_KEY,
        USER_KEY,
        'firebase_user',
        'auth_state',
        'user_preferences',
        'worker_data',
        'fallback_token',
        'mock_token'
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ Complete auth reset successful');
    } catch (error) {
      console.error('Error during force auth reset:', error);
      throw error;
    }
  }
};

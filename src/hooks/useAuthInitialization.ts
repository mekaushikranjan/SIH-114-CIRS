import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { restoreAuthState, initializeAuthComplete } from '../store/slices/authSlice';
import { tokenStorage } from '../utils/tokenStorage';
// Firebase disabled - using database auth only
// import { subscribeAuth, subscribeIdToken } from '../services/firebaseAuth';
// import { firebaseAuth } from '../services/firebase';

export const useAuthInitialization = () => {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Starting database-only auth initialization...');
        
        // Only restore auth state from AsyncStorage (no Firebase)
        const storedUser = await tokenStorage.getUser();
        const storedToken = await tokenStorage.getToken();
        
        if (storedUser && storedToken) {
          console.log('Restoring stored auth state from database...');
          
          // Validate token format before restoring
          const tokenParts = storedToken.split('.');
          if (tokenParts.length === 3 && !storedToken.startsWith('fallback_token')) {
            dispatch(restoreAuthState({ user: storedUser, token: storedToken }));
            console.log('✅ Valid auth state restored');
          } else {
            console.log('❌ Invalid token format, clearing auth data');
            await tokenStorage.clearAuthData();
          }
        } else {
          console.log('No stored auth state found');
        }

        setIsInitialized(true);
        dispatch(initializeAuthComplete());
        console.log('✅ Database auth initialization complete');
      } catch (error) {
        console.error('❌ Error during auth initialization:', error);
        dispatch(initializeAuthComplete());
      }
    };

    if (!isInitialized) {
      console.log('Starting auth initialization...');
      initializeAuth();
    }

    // Cleanup (no subscriptions for database-only auth)
    return () => {
      console.log('Cleaning up auth initialization...');
      mounted = false;
    };
  }, [dispatch, isInitialized]);

  return { isInitialized };
};

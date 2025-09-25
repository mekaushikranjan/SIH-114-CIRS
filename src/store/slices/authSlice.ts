import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: any;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  profilePicture?: string;

  role: 'citizen' | 'admin' | 'worker';
  // Worker-specific fields
  workerId?: string;
  department?: string;
  skills?: string[];
  assignedArea?: string;
  rating?: number;
  completedIssues?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  isInitialized: boolean;
  sessionExpiry: number | null;
  authMethod: 'email' | 'phone' | 'google' | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
  loading: false,
  isInitialized: false,
  sessionExpiry: null,
  authMethod: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action: PayloadAction<{ 
      user: User; 
      token: string; 
      refreshToken?: string; 
      authMethod?: 'email' | 'phone' | 'google';
      sessionExpiry?: number;
    }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.authMethod = action.payload.authMethod || null;
      state.sessionExpiry = action.payload.sessionExpiry || null;
      state.loading = false;
    },
    loginFailure: (state) => {
      state.loading = false;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.authMethod = null;
      state.sessionExpiry = null;
      state.loading = false;
    },
    restoreAuthState: (state, action: PayloadAction<{ 
      user: User; 
      token: string; 
      refreshToken?: string; 
      authMethod?: 'email' | 'phone' | 'google';
      sessionExpiry?: number;
    }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.authMethod = action.payload.authMethod || null;
      state.sessionExpiry = action.payload.sessionExpiry || null;
      state.loading = false;
      state.isInitialized = true;
    },
    initializeAuthComplete: (state) => {
      state.isInitialized = true;
      state.loading = false;
    },
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updateVerificationStatus: (state, action: PayloadAction<{ emailVerified?: boolean; phoneVerified?: boolean }>) => {
      if (state.user) {
        state.user = { 
          ...state.user, 
          emailVerified: action.payload.emailVerified ?? state.user.emailVerified,
          phoneVerified: action.payload.phoneVerified ?? state.user.phoneVerified,
        };
      }
    },
    refreshTokens: (state, action: PayloadAction<{ token: string; refreshToken?: string; sessionExpiry?: number }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || state.refreshToken;
      state.sessionExpiry = action.payload.sessionExpiry || state.sessionExpiry;
    },
    setSessionExpiry: (state, action: PayloadAction<number>) => {
      state.sessionExpiry = action.payload;
    },
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  restoreAuthState, 
  initializeAuthComplete, 
  updateProfile,
  updateVerificationStatus,
  refreshTokens,
  setSessionExpiry
} = authSlice.actions;
export default authSlice.reducer;

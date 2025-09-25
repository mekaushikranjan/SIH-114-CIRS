import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserPreferences {
  language: 'en' | 'hi' | 'bn';
  notifications: boolean;
  theme: 'light' | 'dark';
}

interface UserState {
  preferences: UserPreferences;
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

const initialState: UserState = {
  preferences: {
    language: 'en',
    notifications: true,
    theme: 'light',
  },
  location: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setLocation: (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
      state.location = action.payload;
    },
  },
});

export const { updatePreferences, setLocation } = userSlice.actions;
export default userSlice.reducer;

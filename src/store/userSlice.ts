import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../lib/supabase';
import { Business } from '../lib/api';

interface UserState {
  user: User | null;
  userProfile: UserProfile | null;
  businesses: Business[];
  loading: boolean;
  authInitialized: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  userProfile: null,
  businesses: [],
  loading: true,
  authInitialized: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    setUserProfile(state, action: PayloadAction<UserProfile | null>) {
      state.userProfile = action.payload;
    },
    setBusinesses(state, action: PayloadAction<Business[]>) {
      state.businesses = action.payload;
    },
    updateBusinessInStore(state, action: PayloadAction<Business>) {
      const idx = state.businesses.findIndex(b => b.id === action.payload.id);
      if (idx !== -1) state.businesses[idx] = action.payload;
    },
    setActiveBusinessId(state, action: PayloadAction<string | undefined>) {
      if (state.userProfile) {
        state.userProfile.business_id = action.payload;
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setAuthInitialized(state, action: PayloadAction<boolean>) {
      state.authInitialized = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setUser, setUserProfile, setBusinesses, updateBusinessInStore, setActiveBusinessId, setLoading, setAuthInitialized, setError } = userSlice.actions;
export default userSlice.reducer; 
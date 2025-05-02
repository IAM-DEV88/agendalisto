import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../lib/supabase';

interface UserState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authInitialized: boolean;
}

const initialState: UserState = {
  user: null,
  userProfile: null,
  loading: true,
  authInitialized: false,
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
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setAuthInitialized(state, action: PayloadAction<boolean>) {
      state.authInitialized = action.payload;
    },
  },
});

export const { setUser, setUserProfile, setLoading, setAuthInitialized } = userSlice.actions;
export default userSlice.reducer; 
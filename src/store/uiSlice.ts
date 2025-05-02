import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// UI slice para manejar estado de interfaz persistente (pestaña activa)
interface UIState {
  activeTab: 'upcoming' | 'past' | 'profile';
}

const initialState: UIState = {
  activeTab: 'upcoming',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<UIState['activeTab']>) {
      state.activeTab = action.payload;
    },
  },
});

export const { setActiveTab } = uiSlice.actions;
export default uiSlice.reducer;
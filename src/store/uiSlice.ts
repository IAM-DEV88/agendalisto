import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// UI slice para manejar estado de interfaz persistente (pestaña activa)
export interface UIState {
  activeTab: 'upcoming' | 'pending' | 'past' | 'profile' | 'general';
  itemsPerPage: number;
}

const initialState: UIState = {
  activeTab: 'upcoming',
  itemsPerPage: 5
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<UIState['activeTab']>) {
      state.activeTab = action.payload;
    },
    setItemsPerPage(state, action: PayloadAction<number>) {
      state.itemsPerPage = Math.max(1, Math.min(100, action.payload));
    }
  },
});

export const { setActiveTab, setItemsPerPage } = uiSlice.actions;
export default uiSlice.reducer;
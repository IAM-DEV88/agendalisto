import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// UI slice para manejar estado de interfaz persistente (pestaña activa)
interface UIState {
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
      state.itemsPerPage = action.payload;
    }
  },
});

export const { setActiveTab, setItemsPerPage } = uiSlice.actions;
export default uiSlice.reducer;
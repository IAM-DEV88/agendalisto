import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Definir el tipo para las pestañas
type TabId = 'appointments' | 'profile' | 'general';

// UI slice para manejar estado de interfaz persistente
interface UIState {
  activeTab: TabId;
  itemsPerPage: number;
}

const initialState: UIState = {
  activeTab: 'appointments',
  itemsPerPage: 5
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<TabId>) {
      state.activeTab = action.payload;
    },
    setItemsPerPage(state, action: PayloadAction<number>) {
      state.itemsPerPage = action.payload;
    }
  },
});

export const { setActiveTab, setItemsPerPage } = uiSlice.actions;
export default uiSlice.reducer;
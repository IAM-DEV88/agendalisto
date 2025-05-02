import { configureStore, combineReducers } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import uiReducer from './uiSlice';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Redux Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user', 'ui'],
};

const rootReducer = combineReducers({
  user: userReducer,
  ui: uiReducer,
});

// Creamos un reducer persistente
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configuramos el store usando el reducer persistido
export const store = configureStore({
  reducer: persistedReducer,
});

// Creamos el persistor para pasar a PersistGate
export const persistor = persistStore(store);

// Tipos para RootState y AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
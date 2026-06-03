import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { Provider } from 'react-redux';
import { store, persistor } from './store';
import { PersistGate } from 'redux-persist/integration/react';
import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <PersistGate loading={<div>Cargando estado...</div>} persistor={persistor}>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
); 

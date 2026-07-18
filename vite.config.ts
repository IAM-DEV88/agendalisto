import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      allowedHosts: true,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/.netlify/functions': {
          target: 'http://localhost:8888',
          changeOrigin: true,
        }
      }
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            ui: ['leaflet', 'react-leaflet', 'swiper'],
            state: ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
            forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
            payments: ['@paypal/react-paypal-js'],
          }
        }
      }
    },
    define: {
      'process.env': {
        VITE_SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL),
        VITE_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
      }
    }
  }
})
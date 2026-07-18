import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const isDev = mode === 'development';

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
          manualChunks(id: string) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/scheduler/')) {
              return 'vendor-core';
            }
            if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
              return 'vendor-router';
            }
            if (id.includes('node_modules/@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet') || id.includes('node_modules/swiper')) {
              return 'vendor-ui';
            }
            if (id.includes('node_modules/@reduxjs') || id.includes('node_modules/react-redux') || id.includes('node_modules/redux')) {
              return 'vendor-state';
            }
            if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform') || id.includes('node_modules/zod')) {
              return 'vendor-forms';
            }
            if (id.includes('node_modules/@paypal')) {
              return 'vendor-payments';
            }
            if (id.includes('node_modules/date-fns')) {
              return 'vendor-date';
            }
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons')) {
              return 'vendor-icons';
            }
          }
        }
      },
    },
    esbuild: isDev ? {} : {
      drop: ['console', 'debugger'],
    },
    define: {
      'process.env': {
        VITE_SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL),
        VITE_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
      }
    }
  }
})
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg'],
        manifest: {
          name: 'Micro Gestion Facile',
          short_name: 'MicroGest',
          description: 'Gestion facile pour micro-entrepreneurs',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'web-app-manifest-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'web-app-manifest-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'icon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom', 'zustand'],
            'vendor-ui': ['framer-motion', 'lucide-react', 'sonner', 'styled-components'],
            'vendor-pdf': ['jspdf', 'pdf-lib', 'html2canvas'],
            'vendor-charts': ['recharts'],
            'vendor-utils': ['decimal.js', 'zod', 'dexie'],
            'vendor-ai': ['@google/genai'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});

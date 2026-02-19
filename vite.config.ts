import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // 🔒 Configuration du serveur avec proxy pour API sécurisée
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/ai': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
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
      // 🔒 NE PAS exposer les clés API en build-time
      // Les clés API sensibles doivent rester côté serveur (server/api.ts)
      'import.meta.env.VITE_API_PROXY_URL': JSON.stringify(
        env.VITE_API_PROXY_URL || 'http://localhost:3001'
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-state': ['zustand'],
            'vendor-ui': ['framer-motion', 'lucide-react', 'sonner', 'styled-components'],
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'vendor-pdf': ['jspdf', 'html2canvas'],
            'vendor-pdflib': ['pdf-lib'],
            'vendor-charts': ['recharts'],
            'vendor-db': ['dexie', 'dexie-react-hooks', 'decimal.js'],
            'vendor-ai': ['@google/genai'],
          },
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return `assets/[name]-[hash][extname]`;
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|gif|svg/.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            } else if (/woff|woff2|ttf|otf|eot/.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            } else if (ext === 'css') {
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
      },
      chunkSizeWarningLimit: 600,
      reportCompressedSize: true,
      sourcemap: false,
      commonjsOptions: {
        include: /node_modules/,
        transformMixedEsModules: true,
      },
    },
  };
});

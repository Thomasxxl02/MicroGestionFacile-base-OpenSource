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
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Isoler jspdf et pdf-lib complètement - très volumineux
            if (id.includes('node_modules/jspdf')) {
              return 'vendor-jspdf';
            }
            if (id.includes('node_modules/pdf-lib')) {
              return 'vendor-pdflib';
            }
            if (id.includes('html2canvas')) {
              return 'vendor-html2canvas';
            }
            if (id.includes('recharts')) {
              return 'vendor-recharts';
            }
            // Séparer les dépendances React
            if (id.includes('node_modules/react/') && !id.includes('jsx')) {
              return 'vendor-react-core';
            }
            if (id.includes('node_modules/react-dom')) {
              return 'vendor-react-dom';
            }
            if (id.includes('node_modules/react-router-dom')) {
              return 'vendor-react-router';
            }
            if (id.includes('node_modules/zustand')) {
              return 'vendor-zustand';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('sonner') || id.includes('styled-components')) {
              return 'vendor-ui-extras';
            }
            if (id.includes('decimal.js') || id.includes('zod') || id.includes('dexie')) {
              return 'vendor-utils';
            }
            if (id.includes('@google/genai')) {
              return 'vendor-ai';
            }
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

/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'TITANIC OS',
          short_name: 'TITANIC OS',
          description: 'Industrial Maintenance & PDR Operations Command Center',
          theme_color: '#050508',
          background_color: '#050508',
          display: 'standalone',
          orientation: 'portrait-primary',
          icons: [
            {
              src: 'favicon.ico',
              sizes: '64x64 32x32 24x24 16x16',
              type: 'image/x-icon'
            },
            {
              src: 'logo192.png',
              type: 'image/png',
              sizes: '192x192'
            },
            {
              src: 'logo512.png',
              type: 'image/png',
              sizes: '512x512',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          // Pre-cache html, css, js
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          // Increase cache sizes for large asset bundles common in heavy UI
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [
            {
              // Cache Google Fonts
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache external images (like from grainy-gradients or transparenttextures used in UI bg)
              urlPattern: /^https:\/\/.+\.(png|jpe?g|svg)/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'external-assets-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Group react and UI basics
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/motion')) {
              return 'ui-vendor';
            }
            if (id.includes('node_modules/zustand') || id.includes('node_modules/dexie')) {
              return 'data-vendor';
            }
            // Prevent chunks from being named "errors" to avoid confusion in logs
            if (id.includes('error') || id.includes('Error')) {
              return 'app-core';
            }
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
  };
});

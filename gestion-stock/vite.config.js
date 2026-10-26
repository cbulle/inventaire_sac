import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['sac.png'],
      workbox: {
        // Notifications de péremption (voir src/notifications.js)
        importScripts: ['notif-sw.js'],
        // Icônes disponibles hors réseau
        globPatterns: ['**/*.{js,css,html,woff2}']
      },
      manifest: {
        name: 'Stock Sac SSSM',
        short_name: 'Stock Sac',
        description: 'Gestion du stock sac de secours',
        lang: 'fr',
        start_url: '.',
        display: 'standalone',
        theme_color: '#b91c1c',
        background_color: '#f4f5f7',
        icons: [
          {
            src: 'sac.png',
            sizes: '1200x1200',
            type: 'image/jpeg',
            purpose: 'any'
          }
        ]
      }
    })
  ],
})

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      '@shell': fileURLToPath(new URL('./src/shell', import.meta.url)),
      '@games': fileURLToPath(new URL('./src/games', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name:             'LaGames',
        short_name:       'LaGames',
        description:      'Jogos de festa para jogar com os amigos',
        theme_color:      '#0E0E0E',
        background_color: '#0E0E0E',
        display:          'fullscreen',
        display_override: ['fullscreen', 'standalone', 'minimal-ui'],
        orientation:      'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: {
      // ESTA É A CORREÇÃO: Ensinamos o Vite onde encontrar o arquivo fantasma
      'react/jsx-runtime': 'react/jsx-runtime.js',
    },
  },
  plugins: [
    react(), // Voltamos ao padrão (sem 'classic')
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Agenda Semanal Arcanjos',
        short_name: 'Agenda Arcanjos',
        description: 'Agenda para controle de presença no escritório.',
        theme_color: '#1E2024',
        background_color: '#1E2024',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { VitePWA } from 'vite-plugin-pwa'; <--- Comentado por enquanto

export default defineConfig({
  plugins: [
    react(), 
    // VitePWA({...}) <--- Removemos o bloco do PWA inteiro por enquanto
  ],
});
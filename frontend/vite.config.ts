// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const NGROK_HOST = 'c972ae8b2369.ngrok-free.app';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    host: true,
    allowedHosts: [NGROK_HOST],
    origin: `https://${NGROK_HOST}`,
    hmr: { host: NGROK_HOST, protocol: 'wss' },
  },
});




import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En local el frontend corre en 5174 y la API en 3002; el proxy evita CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3002',
      '/health': 'http://localhost:3002',
    },
  },
})

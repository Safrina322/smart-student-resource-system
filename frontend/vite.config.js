import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND_URL = process.env.VITE_DEV_BACKEND_URL || 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Cross-origin cookies (frontend:5173 vs backend:5000) require
    // SameSite=None + Secure, which local http dev doesn't have. Proxying
    // API/asset/socket requests through Vite makes them same-origin from
    // the browser's point of view instead, so the httpOnly session cookies
    // work locally with plain SameSite=Lax - no HTTPS setup needed just for
    // dev. Production stays genuinely cross-origin (Vercel + Railway, both
    // HTTPS), where SameSite=None+Secure applies instead - see utils/cookies.js.
    proxy: {
      '/api': { target: BACKEND_URL, changeOrigin: true },
      '/images': { target: BACKEND_URL, changeOrigin: true },
      '/lesson-files': { target: BACKEND_URL, changeOrigin: true },
      '/socket.io': { target: BACKEND_URL, changeOrigin: true, ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
  },
})

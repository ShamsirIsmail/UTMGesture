import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path configuration:
// For GitHub Pages repository deployment: set GITHUB_PAGES=true or VITE_BASE_PATH='/UTMGesture/'
// For local exhibition running: defaults to './' so assets work relatively on any port or local static server
const base = process.env.VITE_BASE_PATH || (process.env.GITHUB_PAGES === 'true' ? '/UTMGesture/' : './');

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'lucide': ['lucide-react'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
})

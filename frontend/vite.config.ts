import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'reactflow': ['reactflow'],
          'vendor': ['react', 'react-dom', 'react-router-dom', 'zustand', 'axios', 'uuid'],
          'ui': ['lucide-react'],
        }
      }
    },
    chunkSizeWarningLimit: 700,
  }
})

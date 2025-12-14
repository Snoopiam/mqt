import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration for production
  build: {
    // Output directory (default, but explicit for clarity)
    outDir: 'dist',
    // Generate source maps for debugging
    sourcemap: false,
    // Minify for production
    minify: 'esbuild',
  },
  
  // Development server configuration (used when Vite runs as middleware)
  server: {
    port: 5173,
  },
})


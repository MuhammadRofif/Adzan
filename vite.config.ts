import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Enable CSS code splitting for lazy-loaded routes
    cssCodeSplit: true,
    // Report compressed sizes in build output
    reportCompressedSize: true,
    // Target modern browsers for smaller output
    target: 'es2020',
    // Manual chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — rarely changes, cached long-term
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase client — separate chunk
          'vendor-supabase': ['@supabase/supabase-js'],
          // UI libraries — lucide icons, framer-motion, clsx, tailwind-merge
          'vendor-ui': ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/frontend'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/admin-dashboard',
  build: {
    outDir: './dist',
    emptyOutDir: true,
  },
  server: {
    port: 4201,
    host: 'localhost',
  },
  preview: {
    port: 4301,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

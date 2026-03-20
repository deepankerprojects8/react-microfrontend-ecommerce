import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/customer-app',
  build: {
    outDir: './dist',
    emptyOutDir: true,
  },
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

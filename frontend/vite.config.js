
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    css: false,
  },

  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,

    hmr: {
      protocol: 'ws',
      host: 'localhost',
      clientPort: 5173,
    },

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },

      '/sitemap.xml': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },

      '/robots.txt': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
});

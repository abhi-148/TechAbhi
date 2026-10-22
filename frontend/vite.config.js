import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], test: { environment: 'jsdom', globals: true, setupFiles: ['./src/__tests__/setup.js'], css: false }, server: { port: 5173, proxy: { '/api': 'http://localhost:4000', '/sitemap.xml': 'http://localhost:4000', '/robots.txt': 'http://localhost:4000' } } });

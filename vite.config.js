import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // relative paths so Electron can load dist/index.html from disk
  server: { host: true, port: 5173 },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1200 },
});

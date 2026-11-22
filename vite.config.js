import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages under /zwift-arpg/ and anywhere else.
export default defineConfig({
  base: './',
  server: { host: true },
  build: { chunkSizeWarningLimit: 800 },
});

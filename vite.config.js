import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Relative base so the build works on GitHub Pages under /zwift-arpg/ and anywhere else.
// Two pages: the ARPG at the root, the original pedal-driven demo at /pedal/.
export default defineConfig({
  base: './',
  server: { host: true },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), pedal: resolve(__dirname, 'pedal/index.html') } },
  },
});

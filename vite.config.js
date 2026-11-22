import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Relative base so the build works on GitHub Pages under /zwift-arpg/ and anywhere else.
// Three pages: the ARPG at the root, the original pedal-driven demo at /pedal/, the asset gallery at /gallery/.
export default defineConfig({
  base: './',
  server: { host: true },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), pedal: resolve(__dirname, 'pedal/index.html'), gallery: resolve(__dirname, 'gallery/index.html') } },
  },
});

import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Build stamp for the home screen: package version with the commit count as the patch number, short commit and build time.
const git = c => { try { return execSync('git ' + c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return ''; } };
const [major, minor] = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')).version.split('.');
const BUILD = { version: `${major}.${minor}.${git('rev-list --count HEAD') || 0}`, commit: git('rev-parse --short HEAD'), date: new Date().toISOString() };

// Relative base so the build works on GitHub Pages under /zwift-arpg/ and anywhere else.
// Three pages: the ARPG at the root, the original pedal-driven demo at /pedal/, the asset gallery at /gallery/.
export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify(BUILD) },
  server: { host: true },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), pedal: resolve(__dirname, 'pedal/index.html'), gallery: resolve(__dirname, 'gallery/index.html') } },
  },
});

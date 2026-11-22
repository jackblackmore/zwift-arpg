// Balance arena: scripted fights with the real game code, one encounter at a time (no level runs).
// Run `npm run build` first. Usage: npm run arena [-- maxTier]   (SEED=n changes the fixed random seed)
// Each row is one fight at the tier's par level and par gear (src/data/balance.js) unless the row says otherwise.
// The bot kites in circles, holds Fireball, novas when crowded and flasks at half life: a good player.
// 'standing still' rows never kite: a careless player. Real play sits between the two.
import { preview } from 'vite';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const maxTier = Number(process.argv[2]) || 5, SEED = Number(process.env.SEED) || 1234;
const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium'].find(existsSync);
if (!chrome) { console.error('No Chrome found. Set CHROME_PATH.'); process.exit(1); }

// Encounters per tier. n(x) scales a pack count with tier like the map does.
const encounters = (t, n) => [
  { name: 'zombie pack', fight: [['zombie', n(4)]] },
  { name: 'mixed pack', fight: [['zombie', n(3)], ['archer', n(1)]] },
  { name: 'runner swarm', fight: [['runner', n(5)]] },
  { name: 'bloaters', fight: [['bloater', n(2)], ['zombie', n(2)]] },
  { name: 'magic pack', fight: [['zombie', n(3)], ['archer', n(1)]], rar: 1 },
  { name: 'rare + pack', fight: [['zombie', n(3)]], rare: 'zombie' },
  { name: 'guardian', guardian: true, maxT: 240 },
  { name: 'guardian (starter staff)', guardian: true, gear: 'start', maxT: 240, skip: t === 1 },
  { name: 'mixed pack, standing still', fight: [['zombie', n(3)], ['archer', n(1)]], bot: 'stand' },
  { name: 'magic pack, standing still', fight: [['zombie', n(3)], ['archer', n(1)]], rar: 1, bot: 'stand' },
  { name: 'rare + pack, standing still', fight: [['zombie', n(3)]], rare: 'zombie', bot: 'stand' },
  { name: 'mixed pack (2 levels under)', fight: [['zombie', n(3)], ['archer', n(1)]], under: 2, skip: t === 1 },
].filter(e => !e.skip);

const PORT = Number(process.env.PORT) || 4174; // PORT=4184 npm run arena
const server = await preview({ preview: { port: PORT, strictPort: true } });
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(seed => {
    let a = seed >>> 0;
    Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }, SEED);
  await page.setViewport({ width: 800, height: 500 });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__dbg && window.__dbg.ready(), { timeout: 20000 });
  await page.evaluate(() => window.__dbg.start(true));
  console.log('Watt Dungeon arena · real game code, scripted player · times in game seconds\n');
  console.log('tier lvl gear   encounter                     result   time   taken  lowest  flasks  starved');
  for (let t = 1; t <= maxTier; t++) {
    for (const enc of encounters(t, x => Math.round(x * (1 + .2 * (t - 1))))) {
      const r = await page.evaluate((t, enc) => {
        const D = window.__dbg, par = D.parLevel(t);
        return { ...D.arena({ ...enc, tier: t, lvl: enc.under ? par - enc.under : undefined }), gear: enc.gear || D.parGear(t) };
      }, t, enc);
      const bad = r.result !== 'clear' ? '  ✗' : '';
      console.log(`${String(t).padStart(4)} ${String(r.lvl).padStart(3)} ${r.gear.padEnd(6)} ${enc.name.padEnd(29)} ${r.result.padEnd(7)} ${(r.t + 's').padStart(6)} ${String(r.taken).padStart(6)} ${(Math.round(r.lowest * 100) + '%').padStart(7)} ${String(r.flasks).padStart(7)} ${(r.starved + 's').padStart(8)}${bad}`);
    }
    console.log('');
  }
} finally { await browser.close(); server.httpServer.close(); }

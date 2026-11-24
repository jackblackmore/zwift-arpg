// Level time: the RIDE autopilot plays whole generated levels (entrance to guardian killed) with the real game code, at par
// (src/game/levelrun.js), and reports game minutes per level split into walking, fighting, the guardian, junction waits, loot and
// time dead. Compare with the 30-minute target (design notes "Level generation v2") and the estimate in `npm run balance`.
// Columns: walk, loot (walking to drops), fight (packs), guard (the guardian fight), junc (waiting at junctions), dead (waiting to
// respawn), stop (hit-stop: the game freezes for a moment on big hits); then deaths, junction stops, packs placed and left uncleared.
// Run `npm run build` first. Usage: npm run level [-- maxTier [seeds]]   (default tiers 1–5, seeds 1–3)
//   SEEDS=1,4,9 picks the layout seeds (the map viewer's seeds: tier t plays layout seed + t − 1, like ?seed=), BOT=perfect|careless.
// Monsters, packs and drops use a fixed random seed per run, so a row repeats exactly.
import { preview } from 'vite';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const maxTier = Number(process.argv[2]) || 5, nSeeds = Number(process.argv[3]) || 3;
const SEEDS = process.env.SEEDS ? process.env.SEEDS.split(',').map(Number) : Array.from({ length: nSeeds }, (_, i) => i + 1);
const BOT = process.env.BOT || 'smart';
const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium'].find(existsSync);
if (!chrome) { console.error('No Chrome found. Set CHROME_PATH.'); process.exit(1); }

const PORT = Number(process.env.PORT) || 4175;
const server = await preview({ preview: { port: PORT, strictPort: true } });
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', protocolTimeout: 900000, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const f = (v, w = 5) => (typeof v === 'number' ? v.toFixed(1) : String(v)).padStart(w);
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 500 });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__dbg && window.__dbg.ready(), { timeout: 20000 });
  // The page's own loop stays still between runs, and a short warm-up plays the first sounds (making the noise buffer uses the
// random stream once), so a row repeats whatever ran before it.
await page.evaluate(() => { window.__dbg.start(true); window.__dbg.G.paused = true; window.__dbg.levelRun({ tier: 1, seed: 1, maxMin: 1 }); });
  console.log(`Watt Dungeon level time · real game code, RIDE autopilot at par, ${BOT === 'smart' ? 'a good rider' : BOT + ' bot'} · game minutes\n`);
  console.log('tier lvl seed result  total │  walk  loot fight guard  junc  dead  stop │ deaths junc packs left kills rooms route walked taken flasks parry roll');
  const sum = {};
  for (let t = 1; t <= maxTier; t++) {
    const rows = [];
    for (const seed of SEEDS) {
      const wall = Date.now();
      const r = await page.evaluate((t, seed, bot) => {
        let a = (seed * 7919 + t * 104729) >>> 0; // a fixed random stream per run
        Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let x = a; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
        return window.__dbg.levelRun({ tier: t, seed, bot });
      }, t, seed, BOT);
      rows.push(r); const s = r.split;
      console.log(`${String(t).padStart(4)} ${String(r.lvl).padStart(3)} ${String(seed).padStart(4)} ${r.result.padEnd(7)} ${f(r.min)} │ ${f(s.walk)} ${f(s.loot)} ${f(s.fight)} ${f(s.guardian)} ${f(s.junction)} ${f(s.dead)} ${f(s.hitstop)} │ ${String(r.deaths).padStart(6)} ${String(r.junctions).padStart(4)} ${String(r.packs).padStart(5)} ${String(r.packsLeft).padStart(4)} ${String(r.kills).padStart(5)} ${String(r.rooms).padStart(5)} ${String(r.routeLen).padStart(5)} ${String(r.walked).padStart(6)} ${String(r.taken).padStart(5)} ${String(r.flasks).padStart(6)} ${String(r.parries).padStart(5)} ${String(r.rolls).padStart(4)}${r.result !== 'clear' ? '  ✗' + (r.stuck ? ' ' + JSON.stringify(r.stuck) : '') : ''}${s.idle > .05 ? `  idle ${s.idle}` : ''}  (${((Date.now() - wall) / 1000).toFixed(0)} s)`);
    }
    const avg = k => rows.reduce((n, r) => n + (k ? r.split[k] : r.min), 0) / rows.length;
    sum[t] = { min: avg(), walk: avg('walk'), loot: avg('loot'), fight: avg('fight'), guardian: avg('guardian'), junction: avg('junction'), dead: avg('dead'), hitstop: avg('hitstop') };
    const s = sum[t];
    console.log(`  mean             ${f(s.min)} │ ${f(s.walk)} ${f(s.loot)} ${f(s.fight)} ${f(s.guardian)} ${f(s.junction)} ${f(s.dead)} ${f(s.hitstop)} │\n`);
  }
  console.log('Mean minutes per level: ' + Object.entries(sum).map(([t, s]) => `tier ${t} ${s.min.toFixed(1)}`).join(', ') + ' · target 25–35 (data/balance.js LEVEL_TIME)');
} finally { await browser.close(); server.httpServer.close(); }

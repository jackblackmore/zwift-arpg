// Headless playtest: builds the game, runs simulated rides through __dbg.sim, and checks the
// game makes progress without errors. Usage: npm test  (needs Chrome; set CHROME_PATH if not found)
import { preview } from 'vite';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chrome) { console.error('No Chrome found. Set CHROME_PATH.'); process.exit(1); }

const server = await preview({ preview: { port: 4173, strictPort: true } });
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failed++; };

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Ignore network failures (web fonts may be unreachable in CI/sandboxes); catch real script errors.
  page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  await page.setViewport({ width: 900, height: 700 });
  await page.goto('http://localhost:4173/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__dbg, { timeout: 10000 });

  for (const [mode, name] of [[1, 'easy day'], [2, 'good day']]) {
    // 12 simulated minutes in 50 ms ticks
    const r = await page.evaluate(m => {
      const d = window.__dbg; d.start(m); d.sim(12 * 60 * 20);
      const met = d.metrics();
      return { floor: d.floor(), rooms: d.ride.rooms, kills: d.ride.kills, kj: d.ride.kj, t: d.ride.t, np: met.np, tss: met.tss, gold: d.S.gold, boons: d.hero.boons.length };
    }, mode);
    console.log(`  ${name}:`, JSON.stringify({ ...r, kj: Math.round(r.kj), np: Math.round(r.np), tss: Math.round(r.tss) }));
    check(Math.abs(r.t - 720) < 1, `${name}: ride clock advanced 12 min`);
    check(r.kills > 10, `${name}: hero fought (${r.kills} kills)`);
    check(r.rooms >= 3, `${name}: hero cleared rooms (${r.rooms})`);
    check(r.kj > 50, `${name}: kilojoules banked (${Math.round(r.kj)})`);
  }
  check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  if (process.env.SCREENSHOT) { await page.evaluate(() => window.__dbg.sim(20)); await new Promise(r => setTimeout(r, 300)); await page.screenshot({ path: process.env.SCREENSHOT }); }
} finally {
  await browser.close();
  server.httpServer.close();
}
process.exit(failed ? 1 : 0);

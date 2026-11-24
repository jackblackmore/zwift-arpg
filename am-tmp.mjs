// Mean of seeds for selected arena rows, with and without the tree. Usage: node arena-mean.mjs [seeds] [port]
import { preview } from 'vite';
import puppeteer from 'puppeteer-core';
const NS = Number(process.argv[2]) || 6, PORT = Number(process.argv[3]) || 4192, ONLY = process.env.ROWS ? process.env.ROWS.split(',') : null;
const server = await preview({ root: '/home/user/zwift-arpg', preview: { port: PORT, strictPort: true } });
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const rows = [
  ['guardian', { guardian: true, maxT: 240 }], ['guardian perfect', { guardian: true, maxT: 240, bot: 'perfect' }], ['guardian careless', { guardian: true, maxT: 240, bot: 'careless' }],
  ['rare+pack', { fight: [['zombie', 3]], rare: 'zombie' }], ['rare+pack careless', { fight: [['zombie', 3]], rare: 'zombie', bot: 'careless' }],
].filter(r => !ONLY || ONLY.includes(r[0]));
const trees = (process.env.TREES || 'none,par').split(',');
const page = await browser.newPage();
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__dbg && window.__dbg.ready(), { timeout: 30000 });
await page.evaluate(() => window.__dbg.start(true));
const tiers = (process.env.TIERS || '1,2,3,4,5').split(',').map(Number);
for (const tr of trees) for (const [name, spec] of rows) {
  const line = [];
  for (const t of tiers) {
    let T = 0, tk = 0, win = 0, low = 0;
    for (let s = 1; s <= NS; s++) {
      const r = await page.evaluate((t, spec, tr, seed) => {
        let a = seed * 7919 >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let q = a; q = Math.imul(q ^ (q >>> 15), q | 1); q ^= q + Math.imul(q ^ (q >>> 7), q | 61); return ((q ^ (q >>> 14)) >>> 0) / 4294967296; };
        const n = x => Math.round(x * (1 + .2 * (t - 1)));
        const sp = { ...spec, fight: spec.fight && spec.fight.map(([k, c]) => [k, n(c)]), tier: t, tree: tr === 'par' ? undefined : tr === 'none' ? false : tr };
        return window.__dbg.arena(sp);
      }, t, spec, tr, s);
      T += r.t / NS; tk += r.taken / NS; win += r.result === 'clear' ? 1 : 0; low += r.lowest / NS;
    }
    line.push(`t${t} ${T.toFixed(0)}s ${tk.toFixed(0)} ${win}/${NS} ${(low * 100).toFixed(0)}%`);
  }
  console.log(`${tr.padEnd(8)} ${name.padEnd(20)} ${line.join(' | ')}`);
}
await browser.close(); server.httpServer.close();

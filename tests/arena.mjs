// Balance arena: scripted fights with the real game code, one encounter at a time (no level runs).
// Run `npm run build` first. Usage: npm run arena [-- maxTier]   (SEED=n changes the fixed random seed; MAIN=gemId swaps the Main gem;
// TREE=none plays with no passive tree points, TREE=<preset> another data/balance.js TREE_PRESETS entry; default: the par preset)
// Each row is one fight at the tier's par level and par gear (src/data/balance.js) unless the row says otherwise.
// The bot walks into swing reach and lets the Main gem auto-attack, novas when crowded, flasks at half life and surges on rares,
// guardians and crowds. It never steps out of anything: it parries, blocks and rolls at a reaction skill (src/game/arena.js):
// default a good rider (parries 70% of swings, rolls 90% of heavies in time), 'perfect' never misses, 'careless' never defends.
// 'surged' is how long it spent surging (the Surge gauge holds data/skills.js SURGE.max seconds). parry/block/roll/break count
// parries, blocked hits, rolls and guard breaks; stag/fin count monsters staggered and finishers landed; chan is the guardian's channels broken / started. Careless rows should do clearly worse and perfect ones clearly better: the skill is timing.
import { preview } from 'vite';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const maxTier = Number(process.argv[2]) || 5, SEED = Number(process.env.SEED) || 1234, MAIN = process.env.MAIN || undefined, TREE = process.env.TREE === 'none' ? false : process.env.TREE || undefined;
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
  { name: 'rare + pack, perfect', fight: [['zombie', n(3)]], rare: 'zombie', bot: 'perfect' },
  { name: 'guardian', guardian: true, maxT: 240 },
  { name: 'guardian, perfect', guardian: true, maxT: 240, bot: 'perfect' },
  { name: 'guardian, never surging', guardian: true, maxT: 240, surge: false },
  { name: 'rare + pack, Magic Shield', fight: [['zombie', n(3)]], rare: 'zombie', guard: 'shield' },
  { name: 'rare + pack, Frost Ward', fight: [['zombie', n(3)]], rare: 'zombie', guard: 'ward' },
  { name: 'guardian, Magic Shield', guardian: true, maxT: 240, guard: 'shield' },
  { name: 'guardian, Frost Ward', guardian: true, maxT: 240, guard: 'ward' },
  { name: 'guardian (starter sword)', guardian: true, gear: 'start', maxT: 240, skip: t === 1 },
  { name: 'mixed pack, careless', fight: [['zombie', n(3)], ['archer', n(1)]], bot: 'careless' },
  { name: 'magic pack, careless', fight: [['zombie', n(3)], ['archer', n(1)]], rar: 1, bot: 'careless' },
  { name: 'rare + pack, careless', fight: [['zombie', n(3)]], rare: 'zombie', bot: 'careless' },
  { name: 'guardian, careless', guardian: true, maxT: 240, bot: 'careless' },
  { name: 'mixed pack (2 levels under)', fight: [['zombie', n(3)], ['archer', n(1)]], under: 2, skip: t === 1 },
  // The passive tree's keystones (data/tree.js), from tier 4 (level 8: the keystone presets reach theirs at 7 points).
  ...['riposte', 'bulwark', 'duelist', 'blood'].flatMap(k => [
    { name: `rare + pack, ${k}`, fight: [['zombie', n(3)]], rare: 'zombie', tree: k, skip: t < 4 || TREE !== undefined },
    { name: `guardian, ${k}`, guardian: true, maxT: 240, tree: k, skip: t < 4 || TREE !== undefined },
  ]),
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
  console.log(`Watt Dungeon arena · real game code, scripted player · times in game seconds${MAIN ? ' · Main gem: ' + MAIN : ''} · passive tree: ${TREE === false ? 'none' : TREE || 'par preset'}\n`);
  console.log('tier lvl gear   encounter                     result   time   taken  lowest  flasks  parry block roll break stag fin  chan  surged');
  for (let t = 1; t <= maxTier; t++) {
    for (const enc of encounters(t, x => Math.round(x * (1 + .2 * (t - 1))))) {
      const r = await page.evaluate((t, enc, main, tree) => {
        const D = window.__dbg, par = D.parLevel(t);
        return { ...D.arena({ tree, ...enc, tier: t, main, lvl: enc.under ? par - enc.under : undefined }), gear: enc.gear || D.parGear(t) };
      }, t, enc, MAIN, TREE);
      const bad = r.result !== 'clear' ? '  ✗' : '';
      console.log(`${String(t).padStart(4)} ${String(r.lvl).padStart(3)} ${r.gear.padEnd(6)} ${enc.name.padEnd(29)} ${r.result.padEnd(7)} ${(r.t + 's').padStart(6)} ${String(r.taken).padStart(6)} ${(Math.round(r.lowest * 100) + '%').padStart(7)} ${String(r.flasks).padStart(7)} ${String(r.parries).padStart(6)} ${String(r.blocks).padStart(5)} ${String(r.rolls).padStart(4)} ${String(r.breaks).padStart(5)} ${String(r.staggers).padStart(4)} ${String(r.finishers).padStart(3)} ${(r.chans ? r.chanBroken + '/' + r.chans : '').padStart(5)} ${(r.surged + 's').padStart(7)}${bad}`);
    }
    console.log('');
  }
} finally { await browser.close(); server.httpServer.close(); }

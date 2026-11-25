// Balance arena: scripted fights with the real game code, one encounter at a time (no level runs).
// Run `npm run build` first. Usage: npm run arena [-- maxTier]
//   SEED=n: the fixed random seed (default 1234; every row restarts the stream from it, so a row plays the same with or without ONLY).
//   SEEDS=12: play every row with seeds 1–12 and print means (wins, time, taken...) instead of one run per row. Use it with ONLY.
//   ONLY='^guardian': just the rows whose names match that regular expression. TIERS=3 or TIERS=2-4: just those tiers.
//   MAIN=gemId swaps the Main gem in every row; TREE=none plays with no passive tree points, TREE=<preset> another
//   data/balance.js TREE_PRESETS entry (default: the par preset for the row's Main gem).
//   JOBS=n: browsers to fight in at once (default: CPU count, at most 4). JSON=path: also write every result there.
// Each row is one fight at the tier's par level, par gems and par gear (src/data/balance.js) unless the row says otherwise.
// 'guardian' rows fight that tier's guardian (src/data/dungeon.js LEVELS: the skeleton knight, the bone archer captain, the plague
// bloat, then the Pale Warden); 'guardian: Pale Warden' rows fight the Warden on tiers that have another guardian, to compare.
// The bot walks into swing reach and lets the Main gem auto-attack, novas when crowded, flasks at half life and surges on rares,
// guardians and crowds. It never steps out of anything: it parries, blocks and rolls at a reaction skill (src/game/arena.js):
// default a good rider (parries 70% of swings, rolls 90% of heavies in time), 'perfect' never misses, 'careless' never defends.
// 'surged' is how long it spent surging (the Surge gauge holds data/skills.js SURGE.max seconds). parry/block/roll/break count
// parries, blocked hits, rolls and guard breaks; stag/fin count monsters staggered and finishers landed; chan is the guardian's
// channels broken / started. Careless rows should do clearly worse and perfect ones clearly better: the skill is timing.
// The table ends with a summary per tier (builds, perfect vs good rider, careless, elites, under-geared and under-levelled,
// wrong resistances, uniques) checked against data/balance.js ARENA_TARGETS; ✗ marks a miss.
import { preview } from 'vite';
import puppeteer from 'puppeteer-core';
import { existsSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { ARENA_TARGETS as AT, PAR_SUPPORT_FROM } from '../src/data/balance.js';
import { MIX, PACKS, GUARDIANS } from '../src/data/monsters.js';
import { levelOf } from '../src/game/formulas.js';

const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const maxTier = Number(process.argv[2]) || 5, SEED = Number(process.env.SEED) || 1234, MAIN = process.env.MAIN || undefined, TREE = process.env.TREE === 'none' ? false : process.env.TREE || undefined;
const SEEDS = Number(process.env.SEEDS) || 0, seeds = SEEDS ? Array.from({ length: SEEDS }, (_, i) => i + 1) : [SEED];
const TR = process.env.TIERS ? process.env.TIERS.split('-').map(Number) : null, tierOk = t => !TR || (t >= TR[0] && t <= (TR[1] || TR[0]));
const JOBS = Number(process.env.JOBS) || Math.min(4, cpus().length);
const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium'].find(existsSync);
if (!chrome) { console.error('No Chrome found. Set CHROME_PATH.'); process.exit(1); }

// The Main gem builds (each with its par support and tree preset, data/balance.js PAR_SUPPORT, PAR_TREE). The Sword is the par row.
const BUILDS = { cleave: 'Ember Cleave', fstrike: 'Frost Strike', slam: 'Thunder Slam' };
const UNIQUES = { bell: 'Answering Bell', seal: "Headsman's Seal", storm: 'Heart of the Storm' };
const G = { guardian: true, maxT: 240 };
// Encounters per tier. n(x) scales a pack count with tier like the map does.
const encounters = (t, n) => [
  // Every pack template of the Crypt (data/monsters.js PACKS).
  { name: 'zombie pack', fight: [['zombie', n(4)]] },
  { name: 'mixed pack', fight: [['zombie', n(3)], ['archer', n(1)]] },
  { name: 'runner swarm', fight: [['runner', n(5)]] },
  { name: 'bloaters', fight: [['bloater', n(2)], ['zombie', n(2)]] },
  { name: 'skirmishers', fight: [['runner', n(3)], ['archer', n(1)], ['bloater', n(1)]] },
  { name: 'archer line', fight: [['archer', n(2)], ['zombie', n(2)]] },
  { name: 'zombies + runners', fight: [['zombie', n(2)], ['runner', n(3)]] },
  { name: 'magic pack', fight: [['zombie', n(3)], ['archer', n(1)]], rar: 1 },
  // The level's own pack templates (data/monsters.js MIX, data/dungeon.js LEVELS) that aren't among the Crypt's above.
  ...(MIX[levelOf(t).mix] ? MIX[levelOf(t).mix].packs.filter(p => !PACKS.some(q => JSON.stringify(q) === JSON.stringify(p))).map(p => ({ name: `${levelOf(t).name} pack: ${p.map(([ty, c]) => ty + ' ' + c).join(', ')}`, fight: p.map(([ty, c]) => [ty, n(c)]) })) : []),
  // Rares of every type a pack can have (PACK.rareTypes), and the elite room's elite (ELITE) with its minions.
  { name: 'rare + pack', fight: [['zombie', n(3)]], rare: 'zombie' },
  { name: 'rare archer + pack', fight: [['zombie', n(3)]], rare: 'archer' },
  { name: 'rare bloater + pack', fight: [['zombie', n(3)]], rare: 'bloater' },
  { name: 'rare + pack, perfect', fight: [['zombie', n(3)]], rare: 'zombie', bot: 'perfect' },
  { name: 'elite', elite: 'zombie', maxT: 180 },
  { name: 'elite archer', elite: 'archer', maxT: 180 },
  { name: 'elite, perfect', elite: 'zombie', maxT: 180, bot: 'perfect' },
  { name: 'guardian', ...G },
  { name: 'guardian, perfect', ...G, bot: 'perfect' },
  { name: 'guardian, never surging', ...G, surge: false },
  // The level's guardian is the 'guardian' rows (data/dungeon.js LEVELS); the Pale Warden on the same tier, to compare.
  { name: 'guardian: Pale Warden', ...G, guardian: 'warden', skip: levelOf(t).guardian === 'warden' },
  { name: 'guardian: Pale Warden, perfect', ...G, guardian: 'warden', bot: 'perfect', skip: levelOf(t).guardian === 'warden' },
  // Each Main gem build: the same fights with that gem in Main.
  ...Object.entries(BUILDS).flatMap(([id, b]) => [
    { name: `mixed pack · ${b}`, fight: [['zombie', n(3)], ['archer', n(1)]], main: id },
    { name: `rare + pack · ${b}`, fight: [['zombie', n(3)]], rare: 'zombie', main: id },
    { name: `elite · ${b}`, elite: 'zombie', maxT: 180, main: id },
    { name: `guardian · ${b}`, ...G, main: id },
    { name: `guardian, perfect · ${b}`, ...G, bot: 'perfect', main: id },
    { name: `guardian, careless · ${b}`, ...G, bot: 'careless', main: id },
  ]),
  { name: 'rare + pack, Magic Shield', fight: [['zombie', n(3)]], rare: 'zombie', guard: 'shield' },
  { name: 'rare + pack, Frost Ward', fight: [['zombie', n(3)]], rare: 'zombie', guard: 'ward' },
  { name: 'guardian, Magic Shield', ...G, guard: 'shield' },
  { name: 'guardian, Frost Ward', ...G, guard: 'ward' },
  // Behind par: gear (the starter sword only), character level (life and tree points) and gem levels (damage).
  { name: 'rare + pack (starter sword)', fight: [['zombie', n(3)]], rare: 'zombie', gear: 'start', skip: t === 1 },
  { name: 'elite (starter sword)', elite: 'zombie', maxT: 180, gear: 'start', skip: t === 1 },
  { name: 'guardian (starter sword)', ...G, gear: 'start', skip: t === 1 },
  { name: 'mixed pack (2 levels under)', fight: [['zombie', n(3)], ['archer', n(1)]], under: 2, skip: t === 1 },
  { name: 'elite (2 levels under)', elite: 'zombie', maxT: 180, under: 2, gemUnder: 2, skip: t === 1 },
  { name: 'guardian (2 levels under)', ...G, under: 2, gemUnder: 2, skip: t === 1 },
  { name: 'guardian (gems 2 under)', ...G, gemUnder: 2, skip: t === 1 },
  // Wrong resistances: the par kit with fire resistance where its poison resistance was (data/balance.js GEAR_PROFILES.wrong).
  { name: 'bloaters (wrong resistances)', fight: [['bloater', n(2)], ['zombie', n(2)]], gear: 'wrong', skip: t === 1 },
  { name: 'guardian (wrong resistances)', ...G, gear: 'wrong', skip: t === 1 },
  { name: 'bloaters, careless', fight: [['bloater', n(2)], ['zombie', n(2)]], bot: 'careless', skip: t === 1 },
  { name: 'bloaters (wrong resistances), careless', fight: [['bloater', n(2)], ['zombie', n(2)]], gear: 'wrong', bot: 'careless', skip: t === 1 },
  { name: 'mixed pack, careless', fight: [['zombie', n(3)], ['archer', n(1)]], bot: 'careless' },
  { name: 'magic pack, careless', fight: [['zombie', n(3)], ['archer', n(1)]], rar: 1, bot: 'careless' },
  { name: 'rare + pack, careless', fight: [['zombie', n(3)]], rare: 'zombie', bot: 'careless' },
  { name: 'elite, careless', elite: 'zombie', maxT: 180, bot: 'careless' },
  { name: 'guardian, careless', ...G, bot: 'careless' },
  // The passive tree's keystones (data/tree.js), from tier 4 (level 8: the keystone presets reach theirs at 7 points).
  ...['riposte', 'bulwark', 'duelist', 'blood'].flatMap(k => [
    { name: `rare + pack, ${k}`, fight: [['zombie', n(3)]], rare: 'zombie', tree: k, skip: t < 4 || TREE !== undefined },
    { name: `guardian, ${k}`, ...G, tree: k, skip: t < 4 || TREE !== undefined },
  ]),
  // Uniques (data/items.js UNIQ; they drop from tier 6, so these are a look ahead): the par kit with one unique in its slot.
  ...Object.entries(UNIQUES).map(([id, u]) => ({ name: `guardian · ${u}`, ...G, unique: id, skip: t < 5 })),
].filter(e => !e.skip && (!ONLY || ONLY.test(e.name)));

const jobs = [];
for (let t = 1; t <= (TR ? TR[1] || TR[0] : maxTier); t++) if (tierOk(t)) for (const enc of encounters(t, x => Math.round(x * (1 + .2 * (t - 1))))) for (const seed of seeds) jobs.push({ t, enc, seed, i: jobs.length });

const PORT = Number(process.env.PORT) || 4174; // PORT=4184 npm run arena
const server = await preview({ preview: { port: PORT, strictPort: true } });
const browsers = [];
async function worker() {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  browsers.push(browser);
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    let a = 1;
    window.__seedTo = s => { a = s >>> 0; };
    Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  });
  await page.setViewport({ width: 800, height: 500 });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__dbg && window.__dbg.ready(), { timeout: 30000 });
  // A fresh page's first fight plays a little differently from later ones (state left by loading), so warm up first: then a fight
  // gives the same result whatever ran before it in that page, and the table doesn't depend on JOBS.
  await page.evaluate(() => { const D = window.__dbg; D.start(true); window.__seedTo(1); D.arena({ tier: 3, guardian: true, maxT: 30 }); D.arena({ tier: 3, elite: 'zombie', maxT: 10 }); });
  return page;
}
const res = new Array(jobs.length);
try {
  console.log('Guardians: ' + Array.from({ length: maxTier }, (_, i) => `tier ${i + 1} ${GUARDIANS[levelOf(i + 1).guardian].name}`).join(', ') + '\n');
  console.log(`Watt Dungeon arena · real game code, scripted player · times in game seconds${MAIN ? ' · Main gem: ' + MAIN : ''} · passive tree: ${TREE === false ? 'none' : TREE || 'par preset'} · ${SEEDS ? `means of seeds 1–${SEEDS}` : 'seed ' + SEED}\n`);
  const pages = await Promise.all(Array.from({ length: Math.max(1, Math.min(JOBS, jobs.length)) }, worker));
  let next = 0;
  await Promise.all(pages.map(async page => {
    while (next < jobs.length) {
      const j = jobs[next++];
      // Loading drew on the random stream a varying number of times, so every fight restarts it from its seed.
      res[j.i] = await page.evaluate((t, enc, main, tree, seed) => {
        const D = window.__dbg, par = D.parLevel(t); window.__seedTo(seed);
        return { ...D.arena({ tree, ...enc, tier: t, main: enc.main || main, lvl: enc.under ? par - enc.under : undefined }), gear: enc.gear || D.parGear(t) };
      }, j.t, j.enc, MAIN, TREE, j.seed);
    }
  }));
} finally { await Promise.all(browsers.map(b => b.close())); server.httpServer.close(); }

// One line per row (the mean of its seeds in SEEDS mode).
const rows = new Map();
jobs.forEach(j => { const k = j.t + '|' + j.enc.name; if (!rows.has(k)) rows.set(k, { t: j.t, enc: j.enc, runs: [] }); rows.get(k).runs.push(res[j.i]); });
const mean = (a, f) => a.reduce((s, x) => s + f(x), 0) / a.length, r1 = v => Math.round(v * 10) / 10;
function agg(runs) {
  const won = runs.filter(r => r.result === 'clear');
  const tm0 = mean(runs, r => r.t);
  return { n: runs.length, won: won.length, t: r1(tm0), sd: r1(Math.sqrt(mean(runs, r => (r.t - tm0) ** 2))), tWon: won.length ? r1(mean(won, r => r.t)) : null, taken: Math.round(mean(runs, r => r.taken)), lowest: mean(runs, r => r.lowest),
    flasks: r1(mean(runs, r => r.flasks)), parries: r1(mean(runs, r => r.parries)), blocks: r1(mean(runs, r => r.blocks)), rolls: r1(mean(runs, r => r.rolls)), breaks: r1(mean(runs, r => r.breaks)),
    staggers: r1(mean(runs, r => r.staggers)), finishers: r1(mean(runs, r => r.finishers)), chans: runs.reduce((s, r) => s + r.chans, 0), chanBroken: runs.reduce((s, r) => s + r.chanBroken, 0), surged: r1(mean(runs, r => r.surged)),
    lvl: runs[0].lvl, gear: runs[0].gear, result: runs.length === 1 ? runs[0].result : `${won.length}/${runs.length}` };
}
console.log('tier lvl gear   encounter                                result   time   taken  lowest  flasks  parry block roll break stag fin   chan  surged');
let lastT = 0; const A = {};
for (const [, row] of rows) {
  const a = agg(row.runs); (A[row.t] = A[row.t] || {})[row.enc.name] = a;
  if (row.t !== lastT && lastT) console.log(''); lastT = row.t;
  const bad = a.won < a.n ? '  ✗' : '';
  console.log(`${String(row.t).padStart(4)} ${String(a.lvl).padStart(3)} ${a.gear.padEnd(6)} ${row.enc.name.padEnd(40)} ${a.result.padEnd(7)} ${(a.t + 's').padStart(6)} ${String(a.taken).padStart(6)} ${(Math.round(a.lowest * 100) + '%').padStart(7)} ${String(a.flasks).padStart(7)} ${String(a.parries).padStart(6)} ${String(a.blocks).padStart(5)} ${String(a.rolls).padStart(4)} ${String(a.breaks).padStart(5)} ${String(a.staggers).padStart(4)} ${String(a.finishers).padStart(3)} ${(a.chans ? a.chanBroken + '/' + a.chans : '').padStart(6)} ${(a.surged + 's').padStart(7)}${bad}`);
}
if (process.env.JSON) writeFileSync(process.env.JSON, JSON.stringify(A, null, 1));

// Summary per tier, against data/balance.js ARENA_TARGETS. Rows missing (ONLY, TIERS) are left out.
const pc = v => (v >= 0 ? '+' : '') + Math.round(v * 100) + '%', wins = a => a ? `${a.won}/${a.n}` : '–', tm = a => a ? a.t + 's' : '–';
let miss = 0; const mark = ok => ok ? ' ' : (miss++, '✗');
console.log('\nSummary (good rider unless named) · ✗ misses a data/balance.js ARENA_TARGETS target');
for (const t of Object.keys(A).map(Number)) {
  const R = A[t], g = R.guardian, out = []; if (g) out.push(GUARDIANS[levelOf(t).guardian].name + ':');
  if (g) {
    const b = Object.entries(BUILDS).filter(([, n]) => R[`guardian · ${n}`]).map(([, n]) => { const x = R[`guardian · ${n}`], d = x.t / g.t - 1; return `${n} ${tm(x)} ${pc(d)}${mark((t < PAR_SUPPORT_FROM || Math.abs(d) <= AT.buildSpread) && x.won === x.n)} ${wins(x)}`; });
    out.push(`guardian: Sword ${tm(g)} ${wins(g)}${mark(g.won === g.n)}${b.length ? ' · ' + b.join(' · ') : ''}`);
    const lead = [['Sword', R['guardian, perfect'], g], ...Object.values(BUILDS).map(n => [n, R[`guardian, perfect · ${n}`], R[`guardian · ${n}`]])].filter(([, p, s]) => p && s)
      .map(([n, p, s]) => { const v = 1 - p.t / s.t; return `${n} ${pc(v)}${n === "Sword" ? mark(v >= AT.perfectLead) : " "}`; });
    if (lead.length) out.push(`perfect is faster than the good rider by: ${lead.join(' · ')}`);
    const cl = [['Sword', R['guardian, careless']], ...Object.values(BUILDS).map(n => [n, R[`guardian, careless · ${n}`]])].filter(([, c]) => c).map(([n, c]) => `${n} ${wins(c)}${mark(c.won === 0)}`);
    if (cl.length) out.push(`careless guardian wins: ${cl.join(' · ')}`);
    const pw = R['guardian: Pale Warden'], pwp = R['guardian: Pale Warden, perfect'];
    if (pw) out.push(`${GUARDIANS[levelOf(t).guardian].name} ${tm(g)} taking ${g.taken} vs the Pale Warden on this tier ${tm(pw)} taking ${pw.taken} ${wins(pw)}${pwp ? ` (perfect ${tm(pwp)})` : ''}`);
  }
  const rp = R['rare + pack'], el = R.elite;
  if (rp && el) out.push(`elite ${tm(el)} taking ${el.taken} ${wins(el)}${mark(el.won === el.n && el.t >= rp.t * AT.eliteVsRare[0] && el.taken >= rp.taken)} vs rare + pack ${tm(rp)} taking ${rp.taken}` +
    (R['elite archer'] ? ` · elite archer ${tm(R['elite archer'])} taking ${R['elite archer'].taken} ${wins(R['elite archer'])}` : '') + (R['elite, careless'] ? ` · careless ${wins(R['elite, careless'])} taking ${R['elite, careless'].taken}` : '') +
    Object.values(BUILDS).filter(n => R[`elite · ${n}`]).map(n => ` · ${n} ${tm(R[`elite · ${n}`])} ${wins(R[`elite · ${n}`])}`).join(''));
  const behind = [['starter sword', 'guardian (starter sword)', 'elite (starter sword)'], ['2 levels under', 'guardian (2 levels under)', 'elite (2 levels under)'], ['gems 2 under', 'guardian (gems 2 under)', null]]
    .filter(([, gk]) => R[gk] && g).map(([n, gk, ek]) => { const x = R[gk]; return `${n}: guardian ${wins(x)} ${tm(x)} taking ${x.taken}${mark(x.won < x.n || x.taken > g.taken)}${ek && R[ek] ? ` · elite ${wins(R[ek])} taking ${R[ek].taken}` : ''}`; });
  if (behind.length) out.push(`behind par (par guardian takes ${g.taken}): ${behind.join(' · ')}`);
  const wr = [['guardian (wrong resistances)', 'guardian'], ['bloaters (wrong resistances)', 'bloaters'], ['bloaters (wrong resistances), careless', 'bloaters, careless']].filter(([w, p]) => R[w] && R[p]).map(([w, p]) => `${p} taking ${R[w].taken} vs ${R[p].taken} ${wins(R[w])}`);
  if (wr.length) out.push(`wrong resistances: ${wr.join(' · ')}`);
  const un = Object.values(UNIQUES).filter(n => R[`guardian · ${n}`] && g).map(n => { const x = R[`guardian · ${n}`]; return `${n} ${tm(x)} ${pc(x.t / g.t - 1)} taking ${x.taken} ${wins(x)}`; });
  if (un.length) out.push(`uniques (guardian): ${un.join(' · ')}`);
  if (out.length) console.log(`  tier ${t}: ` + out.join('\n          '));
}
console.log(miss ? `\n${miss} arena targets missed.` : '\nAll arena targets met.');

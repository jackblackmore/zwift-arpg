// Headless playtest. Builds nothing itself: run `npm run build` first. Serves dist/, then:
//   1. ARPG (/): a scripted player clears packs, loots, equips, spends passives, kills the boss and takes the portal.
//      Then balance guard rails: a few arena fights (src/game/arena.js) must land in sane ranges.
//      Then the room-and-corridor layout: generated layouts are checked in Node, the live map in the browser, and the autopilot walks the route.
//   2. Pedal demo (/pedal/): two 12-minute simulated rides, as before.
//   3. Asset gallery (/gallery/): every character, animation set and model pack loads and shows.
// Usage: npm test  (needs Chrome; set CHROME_PATH if not found; SEED=n changes the fixed random seed). SCREENSHOT=/tmp/shot.png saves an ARPG mid-fight shot
// (and /tmp/shot-gallery-*.png, gallery views).
import { preview } from 'vite';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { generateLevel, walkField, cellOf } from '../src/world/gen.js'; // pure: layouts are checked here in Node as well as in the game
import { HERO } from '../src/data/balance.js';

const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chrome) { console.error('No Chrome found. Set CHROME_PATH.'); process.exit(1); }

const PORT = Number(process.env.PORT) || 4173; // so two runs can go at once: PORT=4183 npm test
const server = await preview({ preview: { port: PORT, strictPort: true } });
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failed++; };
// Seeded Math.random so every run plays out the same (maps, packs, drops, crits). Override with SEED=n.
const SEED = Number(process.env.SEED) || 1234;
async function open(path) {
  const page = await browser.newPage(), errors = [];
  await page.evaluateOnNewDocument(seed => {
    let a = seed >>> 0;
    Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }, SEED);
  page.on('pageerror', e => errors.push(e.message));
  // Ignore network failures (web fonts may be unreachable in CI/sandboxes); catch real script errors.
  page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  await page.setViewport({ width: 1100, height: 700 });
  await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__gal || (window.__dbg && (!window.__dbg.ready || window.__dbg.ready())), { timeout: 20000 });
  return { page, errors };
}

try {
  // ---------- ARPG ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, out = {};
      D.start(true);
      out.packs = D.packs().length;
      // Scripted player: walk toward the nearest living pack, hold Fireball, Arc and Nova on a rhythm.
      D.ctl.aim = null; // a stray headless pointer event can leave a mouse aim point; auto-aim like touch does
      D.ctl.fb = true; var px = 1e9, pz = 1e9;
      for (let step = 0; step < 240; step++) {
        const alive = D.packs().filter(p => !p.spawned || p.list.some(e => !e.deathT));
        const tgt = alive.sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
        // Close in on the nearest awake monster (so props can't block every shot), else walk to the nearest pack.
        const foe = D.enemies().filter(e => !e.deathT && e.awake).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
        const goal = foe && Math.hypot(foe.x - P.x, foe.z - P.z) < 14 ? foe : tgt, keep = goal === foe ? 3 : 6;
        if (goal) {
          const dx = goal.x - P.x, dz = goal.z - P.z, d = Math.hypot(dx, dz); D.ctl.mx = d > keep ? dx / d : 0; D.ctl.mz = d > keep ? dz / d : 0;
          if (d > keep && Math.hypot(P.x - px, P.z - pz) < .3) { P.x = goal.x - dx / d * keep; P.z = goal.z - dz / d * keep; } // stuck on a prop: hop closer
        }
        // Mana is scarce now: mostly Fireball, with the other skills now and then.
        if (step % 45 === 0) D.ctl.nova = true; if (step % 60 === 0) D.ctl.shield = true; if (step % 50 === 0) D.castArc();
        var px = P.x, pz = P.z; P.life = Math.max(P.life, 60); D.sim(10);
      }
      D.ctl.fb = false; D.ctl.mx = D.ctl.mz = 0;
      out.rigged = D.chars.ready && D.G.heroM.rigged && D.enemies().some(e => e.model.rigged);
      out.dressed = D.G.dressed && D.G.obst.length > 40 && D.G.torches.length > 10;
      out.kills = P.kills; out.lvl = P.lvl; out.loot = P.inv.length + D.items().length;
      for (let i = 0; i < 4; i++) D.dropItem(P.x, P.z, .5);
      D.sim(40); for (const d of D.items()) { P.x = d.x; P.z = d.z; D.sim(2); } out.inv = P.inv.length; // walk over anything that bounced away
      const before = JSON.stringify(P.gear); D.equip(0); out.equipped = JSON.stringify(P.gear) !== before;
      P.pts = 1; D.openPass(); out.cards = document.querySelectorAll('.pc').length; document.querySelector('.pc').click();
      out.passives = Object.keys(P.passives).length;
      document.getElementById('passClose').click();
      // Boss
      P.x = D.G.bossSpot.x - 6; P.z = D.G.bossSpot.z + 6; D.sim(30);
      const boss = D.enemies().find(e => e.type === 'boss'); out.boss = !!boss;
      if (boss) { for (let i = 0; i < 30; i++) { P.life = Math.max(P.life, 60); D.sim(5); } out.bossCast = boss.rot > 0; P.x = D.G.start.x; P.z = D.G.start.z; D.kill(boss); out.portal = !!D.G.portal; D.sim(10); }
      if (D.G.portal) { P.x = D.G.portal.x; P.z = D.G.portal.z; D.sim(3); }
      out.tier = D.G.tier;
      return out;
    });
    console.log('  arpg:', JSON.stringify(r));
    check(r.rigged, 'arpg: KayKit character models loaded for hero and monsters');
    check(r.dressed, 'arpg: map built from the KayKit dungeon pieces');
    check(r.packs >= 18, `arpg: map has packs (${r.packs})`);
    check(r.kills > 20, `arpg: player fought through packs (${r.kills} kills)`);
    check(r.lvl >= 2, `arpg: player levelled up (level ${r.lvl})`);
    check(r.loot > 0, `arpg: monsters dropped loot (${r.loot})`);
    check(r.inv >= 4, `arpg: loot picked up into the bag (${r.inv})`);
    check(r.equipped, 'arpg: equipping an item changes gear');
    check(r.cards === 3 && r.passives >= 1, `arpg: passive offer shows 3 cards and allocates`);
    check(r.boss && r.bossCast, 'arpg: boss spawned and used abilities');
    check(r.portal && r.tier === 2, `arpg: boss kill opens portal to map 2 (tier ${r.tier})`);
    if (process.env.SCREENSHOT) {
      await page.evaluate(() => { const D = window.__dbg, P = D.P; const pk = D.packs().find(p => !p.spawned); if (pk) { P.x = pk.x - 6; P.z = pk.z + 3; } D.sim(25); D.castNova(); D.castFireball(); D.castArc(); D.sim(3); });
      await new Promise(r => setTimeout(r, 300)); await page.screenshot({ path: process.env.SCREENSHOT });
    }
    check(errors.length === 0, `arpg: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Level layout: rooms and corridors (src/world/gen.js; walls are a grid, see world/map.js) ----------
  {
    // The generator is pure: check lots of layouts here in Node, then the live game's map in the browser.
    let s = SEED; const rng = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const N = 200, MIN_WALK = 45, MIN_SHORTEST = 35; // seconds at base move speed
    const st = { minWalk: 1e9, maxWalk: 0, minShort: 1e9, unreachable: 0, rooms: 1e9, apart: 1e9, sizes: 1e9, side: 1e9, badRoom: 0, tiles: 0 };
    for (let k = 0; k < N; k++) {
      const L = generateLevel({}, rng), at = (x, z) => cellOf(L, z) * L.n + cellOf(L, x), f = walkField(L, cellOf(L, L.start.x), cellOf(L, L.start.z));
      st.minShort = Math.min(st.minShort, f[at(L.boss.x, L.boss.z)] * L.cell / HERO.ms);
      st.minWalk = Math.min(st.minWalk, L.routeLen / HERO.ms); st.maxWalk = Math.max(st.maxWalk, L.routeLen / HERO.ms);
      st.apart = Math.min(st.apart, f[at(L.boss.x, L.boss.z)] < 0 ? -1 : f[at(L.boss.x, L.boss.z)]);
      for (let i = 0; i < L.n * L.n; i++) if (L.grid[i] && f[i] < 0) st.unreachable++; // a floor cell you can't walk to
      for (const r of L.rooms) if (f[at(r.x, r.z)] < 0 || !L.grid[at(r.x, r.z)]) st.badRoom++;
      st.rooms = Math.min(st.rooms, L.rooms.length); st.sizes = Math.min(st.sizes, new Set(L.rooms.map(r => r.w * r.h)).size);
      st.side = Math.min(st.side, L.rooms.filter(r => r.kind === 'side').length);
      st.tiles += L.grid.reduce((a, v) => a + v, 0) / (L.n * L.n) / N;
      // the outer ring of cells is always wall, so nothing can leave the grid
      for (let i = 0; i < L.n; i++) if (L.grid[i] || L.grid[(L.n - 1) * L.n + i] || L.grid[i * L.n] || L.grid[i * L.n + L.n - 1]) st.badRoom++;
    }
    console.log('  layouts:', JSON.stringify({ ...st, floor: Math.round(st.tiles * 100) + '%' }));
    check(st.apart > 0 && st.minShort >= MIN_SHORTEST, `layout: guardian is a path apart from the start (shortest walk ${st.minShort.toFixed(0)}s at base speed over ${N} layouts, at least ${MIN_SHORTEST}s)`);
    check(st.unreachable === 0 && st.badRoom === 0, `layout: every room and floor cell is reachable from the start (${st.unreachable} unreachable cells, ${st.badRoom} bad rooms)`);
    check(st.minWalk >= MIN_WALK, `layout: walking the route takes ${st.minWalk.toFixed(0)}-${st.maxWalk.toFixed(0)}s at base speed (at least ${MIN_WALK}s)`);
    check(st.sizes >= 4 && st.side >= 1, `layout: rooms vary in size (${st.sizes}+ sizes) with side branches (${st.side}+)`);

    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, G = D.G, out = {}; D.start(true);
      let L = G.layout; const solidAt = (i, j) => i < 0 || j < 0 || i >= L.n || j >= L.n || !L.grid[j * L.n + i];
      const hit = (x, z, r) => { for (let j = Math.floor((z - r + L.half) / L.cell); j <= Math.floor((z + r + L.half) / L.cell); j++) for (let i = Math.floor((x - r + L.half) / L.cell); i <= Math.floor((x + r + L.half) / L.cell); i++) { if (!solidAt(i, j)) continue; const cx = Math.max(-L.half + i * L.cell, Math.min(x, -L.half + (i + 1) * L.cell)), cz = Math.max(-L.half + j * L.cell, Math.min(z, -L.half + (j + 1) * L.cell)); if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true; } return false; };
      out.layout = !!L && L.rooms.length >= 10;
      out.packsInWalls = G.packs.filter(p => hit(p.x, p.z, 1.5)).length; out.packs = G.packs.length;
      out.propsInWalls = G.obst.filter(o => hit(o.x, o.z, o.r)).length; out.props = G.obst.length;
      out.startFree = !hit(G.start.x, G.start.z, 1) && !hit(G.bossSpot.x, G.bossSpot.z, 1);
      out.packRooms = new Set(G.packs.map(p => Math.round(p.rank * 4))).size;
      // Wake every pack and the guardian by standing at each; no monster may spawn inside a wall.
      let enemies = 0, bad = 0, asleepThrough = 0;
      for (const p of [...G.packs, { x: G.bossSpot.x, z: G.bossSpot.z }]) {
        P.x = p.x + 5; P.z = p.z; P.life = 1e5; D.ctl.mx = D.ctl.mz = 0; D.sim(1);
        for (const e of G.enemies) if (!e.chk) { e.chk = 1; enemies++; if (hit(e.sx, e.sz, e.r * .9)) bad++; }
      }
      out.enemies = enemies; out.enemiesInWalls = bad;
      // Aggro needs sight: a pack in another room stays asleep while you stand in the start room.
      D.start(true); L = G.layout; P.x = G.start.x; P.z = G.start.z; D.sim(40);
      out.farAwake = G.enemies.filter(e => e.awake).length;
      // Walls hold: charge every wall from a random floor spot and never end up inside one.
      const floor = []; for (let j = 0; j < L.n; j++) for (let i = 0; i < L.n; i++) if (L.grid[j * L.n + i]) floor.push([i, j]);
      let inside = 0, tries = 0;
      for (let t = 0; t < 120; t++) {
        const [i, j] = floor[(t * 7919) % floor.length]; P.x = -L.half + (i + .5) * L.cell; P.z = -L.half + (j + .5) * L.cell; P.dead = 0; P.life = 1e5;
        const a = t * 2.399; D.ctl.mx = Math.cos(a); D.ctl.mz = Math.sin(a);
        for (let k = 0; k < 25; k++) { D.sim(1); tries++; if (hit(P.x, P.z, P.r * .9)) inside++; }
      }
      D.ctl.mx = D.ctl.mz = 0; out.insideWalls = inside; out.moves = tries;
      return out;
    });
    console.log('  level:', JSON.stringify(r));
    check(r.layout, 'level: the live map has a room layout');
    check(r.packsInWalls === 0 && r.propsInWalls === 0 && r.startFree, `level: no pack (${r.packs}) or prop (${r.props}) inside a wall`);
    check(r.enemies > 40 && r.enemiesInWalls === 0, `level: no monster spawns inside a wall (${r.enemies} spawned)`);
    check(r.farAwake === 0, `level: nothing wakes from the start room (${r.farAwake} awake)`);
    check(r.insideWalls === 0, `level: the hero can't walk into walls (${r.moves} ticks of charging)`);
    check(errors.length === 0, `level: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }
  {
    // The autopilot with the level cleared walks the route to the guardian: round every corner, no teleporting.
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, G = D.G, out = {};
      D.setRide(true); D.start(true); G.packs = []; D.ride.pw = 250; D.ctl.auto = true; D.ctl.fb = false;
      let t = 0, walked = 0, lx = P.x, lz = P.z; const best = { d: 1e9 };
      for (; t < 20000; t++) { D.sim(1); walked += Math.hypot(P.x - lx, P.z - lz); lx = P.x; lz = P.z; const d = Math.hypot(P.x - G.bossSpot.x, P.z - G.bossSpot.z); best.d = Math.min(best.d, d); if (d < 14) break; }
      D.setRide(false);
      out.arrived = best.d < 14; out.secs = Math.round(t * .033); out.walked = Math.round(walked); out.routeLen = Math.round(G.layout.routeLen);
      return out;
    });
    console.log('  autopilot route:', JSON.stringify(r));
    check(r.arrived, `autopilot: follows the route to the guardian (${r.secs}s, ${r.walked} units walked, route ${r.routeLen})`);
    check(errors.length === 0, `autopilot route: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Balance guard rails (arena: real fights, scripted player; full table via `npm run arena`) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg; D.start(true);
      return {
        pack: D.arena({ tier: 1, fight: [['zombie', 3], ['archer', 1]] }),
        boss: D.arena({ tier: 1, guardian: true, maxT: 240 }),
        under: D.arena({ tier: 2, gear: 'start', guardian: true, maxT: 120 }),
        shield: (() => { D.P.shieldCd = 0; D.P.mana = 100; D.castShield(); const a = D.P.shield / D.S.maxLife; const l = D.P.life; D.ctl.shield = false; return { result: a > .3 ? 'ok' : 'none', t: Math.round(a * 100) / 100, lowest: l }; })(),
      };
    });
    console.log('  balance:', JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, `${v.result} ${v.t}s lowest ${v.lowest}`]))));
    check(r.pack.result === 'clear' && r.pack.t > 3 && r.pack.t < 20, `balance: a tier 1 pack takes a few seconds with the starter staff (${r.pack.t}s)`);
    check(r.boss.result === 'clear' && r.boss.t > 45 && r.boss.t < 180, `balance: tier 1 guardian can't be burned down (${r.boss.t}s)`);
    check(r.under.result !== 'clear', `balance: starter staff can't beat the tier 2 guardian in 2 minutes (${r.under.result})`);
    check(r.shield.result === 'ok' && r.boss.shields > 0, `balance: Magic Shield absorbs ${Math.round(r.shield.t * 100)}% of max life and the bot uses it (${r.boss.shields} casts)`);
    check(errors.length === 0, `balance: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- ARPG in RIDE mode (simulated Zwift Ride + KICKR) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, out = {};
      D.setRide(true); D.start(true);
      // Not pedalling: the hero must not move even with the D-pad held.
      D.ride.pw = 0; D.ride.held.right = true; const x0 = P.x; D.sim(60); out.stillAt0W = Math.abs(P.x - x0) < .01;
      D.ride.held.right = false;
      // Pedalling at ~80% FTP with autopilot on and A (Fireball) held: the hero should go and clear packs alone.
      D.ride.pw = 200; D.ctl.auto = true; D.ctl.fb = true;
      // Measure the path walked, not distance from the start: the autopilot can loop back toward the entrance.
      let walked = 0, lx = P.x, lz = P.z;
      for (let i = 0; i < 150; i++) {
        P.life = Math.max(P.life, 60); if (i % 6 === 0) D.ctl.nova = true;
        for (let k = 0; k < 15; k++) { D.sim(1); const step = Math.hypot(P.x - lx, P.z - lz); if (step < 1) walked += step; /* skip respawn and dash jumps */ lx = P.x; lz = P.z; }
      }
      out.kills = P.kills; out.travelled = walked;
      D.setRide(false);
      return out;
    });
    console.log('  ride:', JSON.stringify(r));
    check(r.stillAt0W, 'ride: hero stands still at 0 W');
    check(r.travelled > 10, `ride: autopilot moves the hero (${r.travelled.toFixed(1)} units walked)`);
    check(r.kills >= 10, `ride: autopilot + held Fireball clears monsters (${r.kills} kills)`);
    check(errors.length === 0, `ride: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Pedal demo ----------
  {
    const { page, errors } = await open('/pedal/');
    for (const [mode, name] of [[1, 'easy day'], [2, 'good day']]) {
      // 12 simulated minutes in 50 ms ticks
      const r = await page.evaluate(m => {
        const d = window.__dbg; d.start(m); d.sim(12 * 60 * 20);
        const met = d.metrics();
        return { floor: d.floor(), rooms: d.ride.rooms, kills: d.ride.kills, kj: d.ride.kj, t: d.ride.t, np: met.np, tss: met.tss, gold: d.S.gold, boons: d.hero.boons.length };
      }, mode);
      console.log(`  pedal ${name}:`, JSON.stringify({ ...r, kj: Math.round(r.kj), np: Math.round(r.np), tss: Math.round(r.tss) }));
      check(Math.abs(r.t - 720) < 1, `pedal ${name}: ride clock advanced 12 min`);
      check(r.kills > 10, `pedal ${name}: hero fought (${r.kills} kills)`);
      check(r.rooms >= 3, `pedal ${name}: hero cleared rooms (${r.rooms})`);
      check(r.kj > 50, `pedal ${name}: kilojoules banked (${Math.round(r.kj)})`);
    }
    check(errors.length === 0, `pedal: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }
  // ---------- Asset gallery ----------
  {
    const { page, errors } = await open('/gallery/');
    await page.waitForFunction(() => window.__gal.ready() || /Failed/.test(document.getElementById('status').textContent), { timeout: 30000 });
    const shots = [];
    const view = async (name) => {
      await page.waitForFunction(() => window.__gal.ready(), { timeout: 30000 });
      const r = await page.evaluate(() => ({ ...window.__gal.onStage(), label: window.__gal.shown.name }));
      if (process.env.SCREENSHOT) { await new Promise(r => setTimeout(r, 400)); const f = process.env.SCREENSHOT.replace(/\.png$/, `-gallery-${name}.png`); await page.screenshot({ path: f }); shots.push(f); }
      return r;
    };
    const idx = await page.evaluate(() => window.__gal.idx());
    const res = {};
    res.first = await view('character');
    // Every character on the other animation set, then an attack clip.
    let charsOk = 0;
    for (let i = 0; i < idx.chars.length; i++) { await page.evaluate(i => window.__gal.act('char', i), i); const r = await view('c' + i).catch(() => null); if (r && r.meshes > 0 && r.playing) charsOk++; }
    await page.evaluate(() => window.__gal.act('char', 0));
    await page.evaluate(() => window.__gal.act('set', 'adventurers'));
    await page.evaluate(() => window.__gal.act('clip', '2H_Melee_Attack_Spin'));
    res.adv = await view('attack');
    await page.evaluate(() => window.__gal.act('set', 'anim11'));
    await page.evaluate(() => window.__gal.act('clip', 'Ranged_Magic_Spellcasting'));
    res.a11 = await view('anim11');
    let packsOk = 0;
    for (const p of idx.packs) { await page.evaluate(id => window.__gal.act('tab', id), p.id); const r = await view(p.id); if (r.top === p.items.length && r.meshes > 0) packsOk++; else console.log('  pack', p.id, JSON.stringify(r), p.items.length); }
    console.log('  gallery:', JSON.stringify({ chars: idx.chars.length, packs: idx.packs.map(p => p.id + ':' + p.items.length), charsOk, packsOk, adv: res.adv.label, a11: res.a11.label }), shots.length ? 'shots: ' + shots.join(' ') : '');
    check(res.first.meshes > 0 && res.first.playing, 'gallery: first character shows and animates');
    check(charsOk === idx.chars.length, `gallery: all characters load (${charsOk}/${idx.chars.length})`);
    check(/2H Melee Attack Spin|2H_Melee_Attack_Spin/.test(res.adv.label) && res.adv.playing, 'gallery: switching animation set and clip plays it');
    check(/Ranged_Magic_Spellcasting/.test(res.a11.label) && res.a11.playing, 'gallery: Animations 1.1 clips play on the KayKit characters');
    check(packsOk === idx.packs.length, `gallery: every model pack shows all its models (${packsOk}/${idx.packs.length})`);
    check(errors.length === 0, `gallery: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }
} finally {
  await browser.close();
  server.httpServer.close();
}
process.exit(failed ? 1 : 0);

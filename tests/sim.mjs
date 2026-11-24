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
import { GEMS, SUPPORTS } from '../src/data/gems.js';
import { SK } from '../src/data/skills.js';

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
  await page.waitForFunction(() => window.__gal || window.__maps || (window.__dbg && (!window.__dbg.ready || window.__dbg.ready())), { timeout: 20000 });
  return { page, errors };
}

try {
  // ---------- Data: the text players read matches the numbers in src/data (supports and milestones) ----------
  {
    const pc = v => Math.round(v * 100) + '%', less = v => pc(1 - v) + ' less', U = SUPPORTS, M = id => GEMS[id].mile;
    const want = {
      sweep: [less(U.sweep.more)], brittle: [pc(U.brittle.taken), U.brittle.dur + 's'], aftershock: [U.aftershock.delay + 's', pc(U.aftershock.mult)],
      raise: [pc(U.raise.chance), 'up to ' + U.raise.cap], ignite: [pc(U.ignite.share), U.ignite.dur + 's'],
      shatter: [pc(U.shatter.pct)], forked: ['+' + U.forked.chains], conduit: [pc(U.conduit.shockMore)], warding: [pc(U.warding.shieldPct)], volley: [U.volley.targets === 2 ? 'two' : String(U.volley.targets), less(U.volley.mult)],
      twinmeteor: [less(U.twinmeteor.mult)], quickstep: ['+' + U.quickstep.ch + ' charge'], lingering: [pc(U.lingering.dur)],
    };
    const mile = {
      cleave: [pc(M('cleave').arc - 1) + ' wider', pc(M('cleave').reach - 1) + ' further'], fstrike: ['Every ' + M('fstrike').every + 'rd', M('fstrike').freeze + 's'], slam: ['+' + pc(M('slam').radius - 1)], arc: ['+' + M('arc').add.chains + ' chains'], nova: ['+' + pc(M('nova').add.novaR)],
      totem: [pc(M('totem').dur - 1)], meteor: ['+' + pc(M('meteor').radius - 1)], shield: [pc(M('shield').add.shieldPct)],
      ward: ['+' + pc(M('ward').radius - 1)], dash: ['+' + M('dash').add.dashCh + ' charge'],
      sword: ['Every ' + M('sword').every + 'rd', pc(M('sword').mult - 1) + ' more damage', M('sword').stagger === 2 ? 'twice the stagger' : M('sword').stagger + '× the stagger'],
    };
    // Shield arts: their gem text carries their numbers (SK.shield, SK.ward).
    const art = { shield: [pc(SK.shield.barrier), pc(SK.shield.cap), SK.shield.dur + 's'], ward: [SK.ward.chill + 's', SK.ward.dur + 's'] };
    const bad = [...Object.entries(want).filter(([k, w]) => w.some(t => !U[k].d.includes(t))).map(([k]) => k), ...Object.entries(mile).filter(([k, w]) => w.some(t => !GEMS[k].ms[5].includes(t))).map(([k]) => k + ' (milestone)'),
      ...Object.entries(art).filter(([k, w]) => w.some(t => !GEMS[k].d.includes(t))).map(([k]) => k + ' (art)')];
    const missing = Object.keys(U).filter(k => !want[k]);
    check(!bad.length && !missing.length, `data: support, milestone and shield art text matches their numbers${bad.length ? ' · out of step: ' + bad.join(', ') : ''}${missing.length ? ' · no text check for: ' + missing.join(', ') : ''}`);
  }

  // ---------- ARPG ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, out = {};
      D.start(true);
      out.packs = D.packs().length;
      // A fresh character starts with the Sword, the Knight's Shield and Roll, and no Main shrine.
      const gemIn = s => (P.gems.find(g => g.id === P.bar[s]) || {}).gem;
      out.shrineOpen = !document.getElementById('mShrine').classList.contains('show') && gemIn('main') === 'sword' && gemIn('guard') === 'block' && gemIn('evade') === 'roll';
      // Scripted player: walk toward the nearest living pack and into melee; the Main gem auto-attacks. Magic Shield on a rhythm.
      D.ctl.aim = null; // a stray headless pointer event can leave a mouse aim point; auto-aim like touch does
      D.setAutoAtk(true); var px = 1e9, pz = 1e9;
      for (let step = 0; step < 240; step++) {
        const alive = D.packs().filter(p => !p.spawned || p.list.some(e => !e.deathT));
        const tgt = alive.sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
        // Close in on the nearest awake monster (so props can't block every shot), else walk to the nearest pack.
        const foe = D.enemies().filter(e => !e.deathT && e.awake).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
        const goal = foe && Math.hypot(foe.x - P.x, foe.z - P.z) < 14 ? foe : tgt, keep = goal === foe ? 1.4 : 6;
        if (goal) {
          const dx = goal.x - P.x, dz = goal.z - P.z, d = Math.hypot(dx, dz); D.ctl.mx = d > keep ? dx / d : 0; D.ctl.mz = d > keep ? dz / d : 0;
          if (d > keep && Math.hypot(P.x - px, P.z - pz) < .3) { P.x = goal.x - dx / d * keep; P.z = goal.z - dz / d * keep; } // stuck on a prop: hop closer
        }
        if (step % 60 === 0) D.ctl.tap.guard = true;
        var px = P.x, pz = P.z; P.life = Math.max(P.life, 60); D.sim(10);
      }
      D.ctl.mx = D.ctl.mz = 0;
      out.mainGem = P.gems.find(g => g.id === P.bar.main).lvl;
      out.rigged = D.chars.ready && D.G.heroM.rigged && D.enemies().some(e => e.model.rigged);
      out.dressed = D.G.dressed && D.G.obst.length > 40 && D.G.torches.length > 10;
      // Loot is sparse (normal packs mostly give XP), so make sure a rare is among the kills: rares always drop an item.
      const rr = D.spawnEnemy('zombie', P.x + 1, P.z, null, 2); D.kill(rr); D.sim(30);
      out.kills = P.kills; out.lvl = P.lvl; out.loot = P.inv.length + D.items().length;
      for (let i = 0; i < 4; i++) D.dropItem(P.x, P.z, .5);
      D.sim(40); for (const d of D.items()) { P.x = d.x; P.z = d.z; D.sim(2); } out.inv = P.inv.length; // walk over anything that bounced away
      const before = JSON.stringify(P.gear); D.equip(0); out.equipped = JSON.stringify(P.gear) !== before;
      P.pts = 1; D.openPass(); out.cards = document.querySelectorAll('#passCards .pc').length; document.querySelector('#passCards .pc').click();
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
    check(r.shrineOpen, 'arpg: a new character starts with the Sword, the Knight\'s Shield and Roll, and no Main shrine');
    check(r.mainGem >= 2, `arpg: the Main gem levelled from kills (gem level ${r.mainGem})`);
    check(r.rigged, 'arpg: KayKit character models loaded for hero and monsters');
    check(r.dressed, 'arpg: map built from the KayKit dungeon pieces');
    check(r.packs >= 18, `arpg: map has packs (${r.packs})`);
    check(r.kills > 20, `arpg: player fought through packs in melee with the auto-attack (${r.kills} kills)`);
    check(r.lvl >= 2, `arpg: player levelled up (level ${r.lvl})`);
    check(r.loot > 0, `arpg: monsters dropped loot (${r.loot})`);
    check(r.inv >= 4, `arpg: loot picked up into the bag (${r.inv})`);
    check(r.equipped, 'arpg: equipping an item changes gear');
    check(r.cards === 3 && r.passives >= 1, `arpg: passive offer shows 3 cards and allocates`);
    check(r.boss && r.bossCast, 'arpg: boss spawned and used abilities');
    check(r.portal && r.tier === 2, `arpg: boss kill opens portal to map 2 (tier ${r.tier})`);
    if (process.env.SCREENSHOT) {
      await page.evaluate(() => { const D = window.__dbg, P = D.P; const pk = D.packs().find(p => !p.spawned); if (pk) { P.x = pk.x - 6; P.z = pk.z + 3; } D.sim(25); D.castNova(); D.strike('cleave'); D.castArc(); D.sim(3); });
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
      D.setRide(true); D.start(true); G.packs = []; D.ride.pw = 250; D.ctl.auto = true; D.ctl.main = false;
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

  // ---------- Route choice at junctions (game/route.js): wait for a pick, default to clearing everything, a tap picks ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, G = D.G, out = {};
      D.start(true);
      // A route room with a side room off it, and the next room along the route (new maps until one has it).
      const find = L => L.route.findIndex((id, i) => i < L.route.length - 1 && L.edges.some(e => (e.a === id || e.b === id) && L.rooms[e.a === id ? e.b : e.a].kind === 'side'));
      for (let n = 0; n < 20 && find(G.layout) < 0; n++) D.newMap(1);
      const L = G.layout, k = find(L);
      const C = L.rooms[L.route[k]], next = L.rooms[L.route[k + 1]];
      const side = L.rooms[L.edges.map(e => e.a === C.id ? e.b : e.b === C.id ? e.a : -1).find(id => id >= 0 && L.rooms[id].kind === 'side')];
      // Only two packs left on the map: one in the side room, one in the next room (both far enough not to spawn).
      G.enemies.forEach(e => { e.deathT = 1; e.gone = true; });
      const pk = (room) => ({ x: room.x, z: room.z, mem: [], spawned: false, awake: false, list: [], rank: room.rank });
      const sp = pk(side), np = pk(next); G.packs = [sp, np];
      D.resetRoute(); P.x = C.x; P.z = C.z; D.ctl.tapDir = null;
      const t0 = D.routeTarget(.1); out.waits = t0 === 'wait' && !!G.jn;
      out.kinds = G.jn ? G.jn.opts.map(o => o.kind).join(',') : '';
      out.defaultSide = G.jn && G.jn.opts[G.jn.sel].kind === 'side';
      let t = .1, res = 'wait'; while (res === 'wait' && t < 10) { res = D.routeTarget(.1); t += .1; }
      out.waitSecs = Math.round(t * 10) / 10; out.toSide = res === sp && G.jn && G.jn.mode === 'go';
      // During the grace period a tap toward the onward exit changes the way, and skips the side room.
      const on = G.jn.opts.find(o => o.kind === 'onward'); D.ctl.tapDir = [Math.sign(on.door.x - P.x) * (Math.abs(on.door.x - P.x) > Math.abs(on.door.z - P.z) ? 1 : 0), Math.sign(on.door.z - P.z) * (Math.abs(on.door.z - P.z) >= Math.abs(on.door.x - P.x) ? 1 : 0)];
      out.toNext = D.routeTarget(.1) === np && G.skip.has(side.id);
      // A tap while waiting picks straight away.
      D.resetRoute(); D.routeTarget(.1); D.ctl.tapDir = [Math.sign(side.x - P.x) * (Math.abs(side.x - P.x) > Math.abs(side.z - P.z) ? 1 : 0), Math.sign(side.z - P.z) * (Math.abs(side.z - P.z) >= Math.abs(side.x - P.x) ? 1 : 0)];
      out.quick = D.routeTarget(.1) === sp && G.jn.picked;
      // With only one way on, no stop.
      D.resetRoute(); G.packs = [np]; out.noStop = D.routeTarget(.1) === np && !G.jn;
      return out;
    });
    console.log('  route:', JSON.stringify(r));
    check(r.waits && r.kinds.includes('side') && r.kinds.includes('onward') && r.defaultSide, `route: a cleared room with a side room and a way onward stops and offers both, defaulting to the side room (${r.kinds})`);
    check(r.toSide && r.waitSecs >= 4.9 && r.waitSecs <= 5.2, `route: with no pick it takes the default after about 5 s (${r.waitSecs}s)`);
    check(r.toNext, 'route: a D-pad tap during the grace period switches to Onward and skips the side room');
    check(r.quick, 'route: a tap while waiting picks straight away');
    check(r.noStop, 'route: with only one way on, the autopilot doesn\'t stop');
    check(errors.length === 0, `route: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Map viewer (/maps/): layouts by seed ----------
  {
    const { page, errors } = await open('/maps/?seed=7');
    const r = await page.evaluate(() => {
      const M = window.__maps, out = {};
      const a = M.level(7), b = M.level(7), c = M.level(8);
      out.same = JSON.stringify(a.rooms) === JSON.stringify(b.rooms) && JSON.stringify(a.rooms) !== JSON.stringify(c.rooms);
      out.panel = document.getElementById('panel').textContent.includes('SEED 7') && !!document.querySelector('#panel a.play[href="../?seed=7"]');
      document.getElementById('next').click(); out.next = M.st.seed === 8;
      document.getElementById('mode').click(); out.grid = M.st.grid && M.st.cells.length >= 4;
      out.layout7 = { rooms: a.rooms.length, start: [Math.round(a.start.x), Math.round(a.start.z)] };
      return out;
    });
    console.log('  maps:', JSON.stringify(r));
    check(r.same && r.panel && r.next && r.grid, 'maps: the viewer draws the same layout for the same seed, pages through seeds, shows a grid and links to the game');
    check(errors.length === 0, `maps: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
    // ?seed= in the game plays the viewer's layout.
    const g = await open('/?seed=7');
    const q = await g.page.evaluate(() => { const D = window.__dbg; D.start(true); const L = D.G.layout; return { seed: D.G.devSeed, rooms: L.rooms.length, start: [Math.round(L.start.x), Math.round(L.start.z)] }; });
    console.log('  seed:', JSON.stringify(q));
    check(q.seed === 7 && q.rooms === r.layout7.rooms && q.start.join() === r.layout7.start.join(), 'seed: ?seed=7 plays the same layout the map viewer shows for seed 7');
    check(g.errors.length === 0, `seed: no page errors${g.errors.length ? ': ' + g.errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Balance guard rails (arena: real fights, scripted player; full table via `npm run arena`) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg; D.start(true);
      return {
        pack: D.arena({ tier: 1, fight: [['zombie', 3], ['archer', 1]] }),
        boss: D.arena({ tier: 1, guardian: true, maxT: 240, bot: 'perfect' }), // how long it takes, not whether you survive (a good rider sometimes dies here)
        careless: D.arena({ tier: 2, guardian: true, maxT: 240, bot: 'careless' }),
        smart: D.arena({ tier: 2, guardian: true, maxT: 240 }),
        under: D.arena({ tier: 2, gear: 'start', guardian: true, maxT: 120 }),
        perfect: D.arena({ tier: 2, guardian: true, maxT: 240, bot: 'perfect' }),
        // one fight is noisy (a good rider can get lucky): compare damage taken over three more fights each
        smart3: [0, 1, 2].map(() => D.arena({ tier: 2, guardian: true, maxT: 240 })).reduce((a, x) => a + x.taken, 0),
        perfect3: [0, 1, 2].map(() => D.arena({ tier: 2, guardian: true, maxT: 240, bot: 'perfect' })).reduce((a, x) => a + x.taken, 0),
      };
    });
    console.log('  balance:', JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? v : `${v.result} ${v.t}s lowest ${v.lowest}`]))));
    check(r.pack.result === 'clear' && r.pack.t > 3 && r.pack.t < 20, `balance: a tier 1 pack takes a few seconds with the starter sword (${r.pack.t}s)`);
    check(r.boss.result === 'clear' && r.boss.t > 45 && r.boss.t < 180, `balance: tier 1 guardian can't be burned down (${r.boss.t}s)`);
    check(r.under.result !== 'clear', `balance: starter sword can't beat the tier 2 guardian in 2 minutes (${r.under.result})`);
    check(r.smart.result === 'clear' && (r.careless.result === 'died' || r.careless.taken > r.smart.taken * 3), `balance: never parrying, blocking or rolling against the tier 2 guardian does far worse (${r.careless.result}, ${r.careless.taken} taken vs ${r.smart.taken})`);
    check(r.perfect.result === 'clear' && r.perfect3 < r.smart3 && r.smart.parries > 5 && r.smart.rolls > 2, `balance: perfect timing takes less than a good rider over three tier 2 guardian fights (${r.perfect3} vs ${r.smart3}), who parries and rolls (${r.smart.parries} parries, ${r.smart.rolls} rolls)`);
    check(errors.length === 0, `balance: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Skill gems: the bar, shrines, gem levels, milestones, saves ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, out = {};
      const filled = () => Object.keys(P.bar).filter(s => P.bar[s]).sort().join(',');
      D.start(true); P.shrined.guard = 1; // the Frost Ward shrine has its own check below
      out.freshBar = filled(); // the starting bar: Sword, Knight's Shield, Roll
      out.guardGem = P.gems.find(g => g.id === P.bar.guard).gem;
      out.mainGem0 = P.gems.find(g => g.id === P.bar.main).gem;
      D.placeGem(D.addGem('cleave').id, 'main'); document.getElementById('mShrine').classList.remove('show');
      out.afterMain = filled();
      out.lockedFlex = D.placeGem(P.bar.main, 'flexA') === false; // level 1: Flex A is locked
      // Reach level 5: the Flex A shrine waits at the next map entrance; walking into it opens the choice.
      P.lvl = 5; D.recalc(); D.newMap(1);
      out.shrineSlot = G.shrine && G.shrine.slot;
      P.x = G.shrine.x; P.z = G.shrine.z; D.sim(2);
      out.ask = G.shrineAsk; G.shrineAsk = null;
      D.openShrine('flexA'); out.flexOffer = [...document.querySelectorAll('#shrineCards .pc')].map(c => c.dataset.k).join(',');
      out.flexPick = document.querySelector('#shrineCards .pc').dataset.k; document.querySelector('#shrineCards .pc').click();
      out.afterFlex = filled(); out.shrineGone = !G.shrine;
      out.flexGem = P.gems.find(g => g.id === P.bar.flexA).gem;
      // Gem XP: kills give bar gems full XP and bag gems 10%.
      const spare = D.addGem('arc'), arc = P.gems.find(g => g.id === P.bar.main);
      // grant XP the way a kill does (a stand-in monster)
      const before = { arc: arc.xp + arc.lvl * 1e4, spare: spare.xp };
      window.__dbg.kill({ deathT: 0, x: P.x, z: P.z, xp: 30, rar: 0, type: 'zombie', aff: [], freeze: 0, h: 1, model: { g: {} } });
      out.barXp = arc.xp + arc.lvl * 1e4 - before.arc; out.bagXp = spare.xp - before.spare;
      // Level 5 milestone: Ember Cleave reaches further.
      const c0 = D.meleeReach('cleave'); arc.lvl = 5; D.recalc(); out.reachGain = Math.round(D.meleeReach('cleave') / c0 * 100) / 100;
      // Save round-trip.
      D.save(); const sv = D.load();
      out.saved = sv.bar && sv.bar.main === P.bar.main && sv.gems.length === P.gems.length && sv.shrined.flexA === 1;
      D.begin(false); document.getElementById('mShrine').classList.remove('show');
      out.loaded = filled() === 'evade,flexA,guard,main' && P.gems.find(g => g.id === P.bar.main).lvl === 5;
      // Saves from an older version (another key) are ignored: no migration while the game is unreleased.
      localStorage.clear(); localStorage.setItem('wd-arpg-1', JSON.stringify(sv)); out.oldSave = D.load() === null;
      return out;
    });
    console.log('  gems:', JSON.stringify(r));
    check(r.freshBar === 'evade,guard,main' && r.mainGem0 === 'sword' && r.guardGem === 'block' && r.afterMain === 'evade,guard,main', `gems: a fresh character has the Sword, the Knight's Shield and Roll (${r.freshBar})`);
    check(r.lockedFlex, 'gems: Flex A is locked below level 5');
    check(r.shrineSlot === 'flexA' && r.ask === 'flexA', `gems: at level 5 a Flex A shrine appears and opens when walked into (${r.shrineSlot}, ${r.ask})`);
    check(r.flexOffer.split(',').length === 3 && !r.flexOffer.split(',').includes('cleave') && r.afterFlex === 'evade,flexA,guard,main' && r.flexGem === r.flexPick && r.shrineGone, `gems: the Flex shrine offers 3 gems you don't own and picking one fills the slot (offered ${r.flexOffer})`);
    check(r.barXp > 0 && r.bagXp > 0 && Math.abs(r.bagXp - r.barXp * .1) < 1, `gems: kills give bar gems XP and bag gems 10% (${r.barXp} / ${r.bagXp})`);
    check(r.reachGain === 1.15, `gems: Ember Cleave's level 5 milestone reaches 15% further (×${r.reachGain})`);
    check(r.saved && r.loaded, 'gems: saves round-trip the skill bar and the gem bag');
    check(r.oldSave, 'gems: saves from an older version are ignored (no migration before release)');
    check(errors.length === 0, `gems: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Gems v2: support gems and sockets, gem drops, feeding (step 3) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, out = {};
      D.start(true); P.shrined.guard = 1; D.placeGem(D.addGem('cleave').id, 'main'); document.getElementById('mShrine').classList.remove('show');
      P.lvl = 5; P.shrined.flexA = 1; D.recalc();
      const fb = P.gems.find(g => g.id === P.bar.main), arc = D.addGem('arc'); D.placeGem(arc.id, 'flexA');
      out.socks = [D.sockCount('main'), D.sockCount('flexA'), D.sockCount('flexB'), D.sockCount('main', 15)].join(',');
      const base = { chains: S.sk.arc.chains };
      // Sweep fits Ember Cleave, not Arc; socketed with Cleave it changes Cleave only.
      const tw = D.addGem('sweep');
      out.twinOnArc = D.socketGem(tw.id, 'flexA');
      out.twinOnFb = D.socketGem(tw.id, 'main');
      out.afterTwin = { sweep: S.sk.cleave.sweep, chains: S.sk.arc.chains - base.chains };
      const fk = D.addGem('forked'); out.forkedOnFb = D.socketGem(fk.id, 'main'); out.forkedOnArc = D.socketGem(fk.id, 'flexA');
      out.afterForked = { sweep: S.sk.cleave.sweep, chains: S.sk.arc.chains - base.chains, arcSweep: S.sk.arc.sweep };
      // The real swing: with Sweep, Ember Cleave hits a monster behind you too.
      const behind = D.targets('cleave', P.x, P.z, 0).list.length; // nothing there yet
      const z = D.spawnEnemy('zombie', P.x, P.z - 1.6, null, 0); D.sim(1);
      out.shots = D.targets('cleave', P.x, P.z, 0).list.includes(z) && behind === 0;
      z.hp = 0; D.kill(z);
      // Socketed supports earn full XP, like the gem they support.
      const x0 = { fb: fb.xp, tw: tw.xp };
      D.kill({ deathT: 0, x: P.x, z: P.z, xp: 30, rar: 0, type: 'zombie', aff: [], freeze: 0, h: 1, model: { g: {} } });
      out.supXp = tw.xp - x0.tw === fb.xp - x0.fb && tw.xp > x0.tw;
      // Saves round-trip the sockets.
      D.save(); const sv = D.load(); out.savedSock = sv.sock && sv.sock.main[0] === tw.id && sv.sock.flexA[0] === fk.id;
      D.begin(false); document.getElementById('mShrine').classList.remove('show');
      out.loaded = S.sk.cleave.sweep && S.sk.arc.chains === base.chains + 2;
      // A guardian always drops a gem; walking over it puts it in the gem bag.
      const n0 = P.gems.length, boss = D.spawnEnemy('boss', P.x + 3, P.z, null, 0); D.kill(boss);
      const gd = G.ground.find(d => d.gem); out.bossGem = !!gd && (gd.gem.lvl >= 1);
      D.sim(40); if (gd) { P.x = gd.x; P.z = gd.z; D.sim(2); }
      out.pickedGem = P.gems.length === n0 + 1 && P.newGems > 0 && gd && P.gems[P.gems.length - 1].gem === gd.gem.gem;
      // Feeding: a duplicate goes in at 100% and is used up; your last copy of a gem stays behind at level 1.
      const bar = P.gems.find(g => g.id === P.bar.flexA), tot = g => { let n = g.xp; for (let l = 1; l < g.lvl; l++) n += D.xpNeedFor(l); return n; };
      const dup = D.addGem('arc', 3), t0 = tot(bar) , give = tot(dup), cnt = P.gems.length;
      const f1 = D.feedGem(dup.id, bar.id);
      out.feedDup = !!f1 && f1.share === 1 && !f1.last && P.gems.length === cnt - 1 && Math.abs(f1.gain - give) < 2 && bar.lvl >= 2;
      const met = D.addGem('meteor', 3), f0 = P.gems.find(g => g.id === P.bar.main), before = f0.lvl * 1e5 + f0.xp;
      const f2 = D.feedGem(met.id, f0.id);
      out.feedLast = !!f2 && f2.last && f2.share === .5 && P.gems.includes(met) && met.lvl === 1 && met.xp === 0 && f0.lvl * 1e5 + f0.xp > before;
      out.feedEmpty = D.feedPreview(met.id, f0.id) === null;            // a fresh level 1 gem has nothing to give
      out.feedBar = D.feedPreview(f0.id, bar.id) === null;              // only spare gems can be fed
      out.feedOther = D.feedPreview(D.addGem('ward', 2).id, f0.id).share === .25; // guard into attack: different kind
      // Every support, socketed with a gem it fits, casts cleanly and shows up in that skill's stats.
      P.lvl = 12; D.recalc(); const bad = [];
      for (const [sup, def] of Object.entries(D.SUPPORTS)) {
        const gem = D.GEMS[def.for[0]] ? def.for[0] : 'fstrike', slot = D.GEMS[gem].kind === 'guard' ? 'guard' : D.GEMS[gem].kind === 'evade' ? 'evade' : 'flexB';
        const g = D.addGem(gem, 3), sg = D.addGem(sup); D.placeGem(g.id, slot);
        if (!D.socketGem(sg.id, slot) || !D.S.sk[gem].sup.includes(sup)) { bad.push(sup + ':socket'); continue; }
        const k = S.sk[gem]; if ({ sweep: !k.sweep, brittle: !k.brittle, aftershock: !k.aftershock, raise: !k.raise, volley: !k.volley, twinmeteor: !k.twin, lingering: k.dur !== 1.5, quickstep: k.ch !== 1 }[sup]) bad.push(sup + ':stats');
        P.life = S.maxLife; D.spawnEnemy('zombie', P.x + 3, P.z, null, 0).awake = true; D.ctl.aim = [P.x + 3, P.z];
        try { D.cast(gem); D.sim(20); } catch (e) { bad.push(sup + ':' + e.message); }
      }
      out.allSupports = bad.join(',') || 'ok';
      D.ctl.aim = null;
      // The gem panel shows sockets and lists supports in the bag.
      D.openGems(true); out.panel = document.querySelectorAll('#gemBar .scell').length >= 2 && !!document.querySelector('#gemBar .scell[data-s="main"]'); D.openGems(false);
      return out;
    });
    console.log('  gems v2:', JSON.stringify(r));
    check(r.socks === '1,1,0,2', `gems v2: sockets per slot at level 5: Main 1, Flex A 1, locked Flex B 0; Main 2 at level 15 (${r.socks})`);
    check(!r.twinOnArc && r.twinOnFb && r.afterTwin.sweep && r.afterTwin.chains === 0, `gems v2: Sweep only fits Ember Cleave and changes it alone (${JSON.stringify(r.afterTwin)})`);
    check(!r.forkedOnFb && r.forkedOnArc && r.afterForked.chains === 2 && r.afterForked.sweep && !r.afterForked.arcSweep, `gems v2: Forked Sky in Flex A changes Arc only (${JSON.stringify(r.afterForked)})`);
    check(r.shots, 'gems v2: Ember Cleave with Sweep hits a monster behind you');
    check(r.supXp, 'gems v2: a socketed support earns the same XP as its skill gem');
    check(r.savedSock && r.loaded, 'gems v2: supports and sockets round-trip through saves');
    check(r.bossGem && r.pickedGem, 'gems v2: a guardian drops a gem, and walking over it adds it to the gem bag');
    check(r.feedDup, 'gems v2: feeding a duplicate moves 100% of its XP and uses it up');
    check(r.feedLast && r.feedEmpty, 'gems v2: feeding your last copy moves 50% (same kind) and leaves a level 1 copy');
    check(r.feedBar && r.feedOther, 'gems v2: gems in use can\'t be fed; a different kind gives 25%');
    check(r.allSupports === 'ok', `gems v2: every support sockets with its gem, changes that skill's stats and casts without errors (${r.allSupports})`);
    check(r.panel, 'gems v2: the gem panel shows the sockets');
    check(errors.length === 0, `gems v2: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Skill gems: Blink (Evade) and Frost Ward (Guard) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, out = {};
      D.start(true); D.placeGem(D.addGem('cleave').id, 'main'); document.getElementById('mShrine').classList.remove('show');
      // Frost Ward shrine: appears at level 3, takes Ward into the bag, the Knight's Shield stays in Guard.
      out.noShrineEarly = !D.shrineDue().includes('guard');
      P.lvl = 3; D.recalc(); out.due = D.shrineDue().includes('guard');
      D.openShrine('guard'); out.guardOffer = [...document.querySelectorAll('#shrineCards .pc')].map(c => c.dataset.k).sort().join(','); document.getElementById('mShrine').classList.remove('show');
      const w = D.takeShrine('guard', 'ward');
      out.wardInBag = !!w && P.gems.find(g => g.id === P.bar.guard).gem === 'block' && !D.shrineDue().includes('guard');
      D.placeGem(w.id, 'guard'); out.wardSlotted = P.gems.find(g => g.id === P.bar.guard).gem === 'ward';
      // Evade shrine (level 8, the slot has Roll from level 1): offered Flame Dash and Blink.
      P.lvl = 7; D.recalc(); out.noEvadeEarly = !D.shrineDue().includes('evade');
      P.lvl = 8; D.recalc(); D.openShrine('evade'); out.evadeOffer = [...document.querySelectorAll('#shrineCards .pc')].map(c => c.dataset.k).join(',');
      document.getElementById('mShrine').classList.remove('show');
      D.takeShrine('evade', 'blink'); document.getElementById('mShrine').classList.remove('show');
      const clear = () => { G.enemies.forEach(e => { e.deathT = 1; e.gone = true; }); G.eproj = []; P.invuln = 0; P.life = S.maxLife; };
      const walls = D.blocked;
      // Blink: a monster 2 units to the east, in the open: we end up farther west, and never in a wall.
      clear(); const r0 = G.layout ? G.layout.rooms[0] : null; // start room
      P.x = G.start.x; P.z = G.start.z; D.ctl.mx = D.ctl.mz = 0; D.ctl.aim = null;
      const m = D.spawnEnemy('zombie', P.x + 2, P.z, null, 0); m.awake = true; D.sim(1);
      const d0 = Math.hypot(m.x - P.x, m.z - P.z), x0 = P.x, z0 = P.z;
      out.blinked = D.CAST.blink(); const d1 = Math.hypot(m.x - P.x, m.z - P.z);
      out.blinkAway = d1 > d0 + 2 && Math.hypot(P.x - x0, P.z - z0) <= 6.6 && P.invuln > .3;
      out.blinkClear = !walls(P.x, P.z, P.r);
      // Blink into a wall: from every spot of the start room, with the threat on each side, never end up in a wall.
      let bad = 0, moved = 0;
      for (let k = 0; k < 40; k++) {
        clear(); const a = k * .157; P.x = G.start.x + Math.cos(a) * 1.5; P.z = G.start.z + Math.sin(a) * 1.5;
        if (walls(P.x, P.z, P.r)) continue;
        const t = D.spawnEnemy('zombie', P.x + Math.cos(k) * 1.5, P.z + Math.sin(k) * 1.5, null, 0); t.awake = true;
        const px = P.x, pz = P.z; if (D.CAST.blink()) moved++; if (walls(P.x, P.z, P.r)) bad++;
      }
      out.wallBad = bad; out.wallMoved = moved;
      clear();
      return out;
    });
    console.log('  skills D:', JSON.stringify(r));
    check(r.noShrineEarly && r.due && r.wardInBag && r.wardSlotted && r.guardOffer === 'shield,ward', `skills D: the level 3 Guard shrine offers Frost Ward and Magic Shield (${r.guardOffer}); Ward goes to the bag, swappable into Guard`);
    check(r.noEvadeEarly && r.evadeOffer.split(',').sort().join() === 'blink,dash', `skills D: the Evade shrine at level 8 offers Flame Dash and Blink (${r.evadeOffer})`);
    check(r.blinked && r.blinkAway && r.blinkClear, `skills D: Blink moves the player away from a nearby monster, with invulnerability`);
    check(r.wallBad === 0 && r.wallMoved > 5, `skills D: Blink never lands in a wall (${r.wallBad} bad of ${r.wallMoved})`);
    check(errors.length === 0, `skills D: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Shield arts: Magic Shield and Frost Ward change the Knight's Shield's block and parry ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, ctl = D.ctl, SK = D.SK, out = {};
      D.start(true); ctl.aim = null; ctl.mx = ctl.mz = 0; D.setAutoAtk(false);
      const clear = () => { G.enemies.forEach(e => { e.deathT = 1; e.gone = true; }); G.eproj = []; G.queue = []; Object.assign(P, { invuln: 0, life: S.maxLife, posture: 0, broken: 0, blocking: false, parryT: 0, parryCd: 0, riposteT: 0, rollT: 0, shield: 0, shieldT: 0 }); ctl.guard = false; ctl.tap = {}; P.x = G.start.x; P.z = G.start.z; };
      const foe = (type, dx, dz) => { const e = D.spawnEnemy(type, P.x + dx, P.z + dz, null, 0); e.awake = true; e.spd = 0; e.atkT = 99; e.hp = e.maxHp = 1e6; return e; };
      const gems = {}; const art = (gem, sup) => { const g = gems[gem] || (gems[gem] = D.addGem(gem)); D.placeGem(g.id, 'guard'); if (sup) D.socketGem(D.addGem(sup).id, 'guard'); D.recalc(); };
      const parry = z => { P.parryCd = 0; ctl.tap.guard = true; D.sim(1); return D.hurtP(20, 'zombie', { from: z, by: z }); };
      const blocked = z => { ctl.guard = true; D.sim(15); const l = P.life; D.hurtP(20, 'zombie', { from: z, by: z }); ctl.guard = false; D.sim(1); return l - P.life; };
      // The Knight's Shield: no barrier, no ring, a riposte.
      clear(); let z = foe('zombie', 0, 1.2); D.sim(1); out.kParry = parry(z) === 'parry' && !(P.shield > 0) && D.frostRings().length === 0 && P.riposteT > 0 && P.riposteMul === SK.block.riposte;
      P.posture = 0; const kBlock = blocked(z);
      // Magic Shield: a parry grants a barrier (12% of life), stacking to the cap; the barrier soaks the next hit; a weaker riposte; blocks take less.
      art('shield'); clear(); z = foe('zombie', 0, 1.2); D.sim(1);
      out.mParry = parry(z); out.barrier = Math.round(P.shield); out.mRiposte = P.riposteT > 0 ? P.riposteMul : 0;
      out.barrierOk = out.mParry === 'parry' && Math.abs(P.shield - S.maxLife * SK.shield.barrier) < 1 && P.shieldT > 0 && z.stun > 0 && out.mRiposte === SK.shield.guard.riposte && out.mRiposte < SK.block.riposte;
      for (let i = 0; i < 5; i++) { D.sim(25); parry(z); } out.capOk = Math.abs(P.shield - S.maxLife * SK.shield.cap) < 1;
      ctl.guard = false; P.blocking = false; P.parryT = 0; D.sim(25); const l0 = P.life, sh0 = P.shield; D.hurtP(30, 'zombie', { from: { x: P.x - Math.sin(P.face) * 2, z: P.z - Math.cos(P.face) * 2 } });
      out.absorbs = P.life === l0 && P.shield < sh0 - 30 * (1 - S.dr) * .9;
      P.shield = 0; P.posture = 0; const mBlock = blocked(z); out.blocks = [kBlock, mBlock].map(v => Math.round(v * 100) / 100); out.mBlockMore = mBlock < kBlock * .85;
      P.shield = 0; D.sim(1); parry(z); D.sim(Math.ceil(SK.shield.dur / .033) + 5); out.fades = !(P.shield > 0);
      // Warding: the same parry grants 30% more.
      art('shield', 'warding'); clear(); z = foe('zombie', 0, 1.2); D.sim(1); parry(z); out.warded = Math.round(P.shield); out.wardingOk = Math.abs(P.shield - S.maxLife * SK.shield.barrier * (1 + D.SUPPORTS.warding.shieldPct)) < 1;
      // Frost Ward: a parry chills the attacker and drops a frost ring that chills and bites a monster inside, not one outside.
      art('ward'); clear(); z = foe('zombie', 0, 1.2); const far = foe('zombie', 8, 0), inRing = foe('zombie', -1.5, 0); D.sim(1);
      out.wParry = parry(z) === 'parry'; out.chill = Math.round(z.chill * 100) / 100; out.rings = D.frostRings().length;
      const ring = D.frostRings()[0]; out.ringDur = ring && Math.round(ring.max * 100) / 100;
      out.wardOk = out.wParry && Math.abs(z.chill - SK.ward.chill) < .1 && out.rings === 1 && Math.abs(out.ringDur - SK.ward.dur) < .01 && P.riposteT > 0;
      D.sim(20); out.ringBites = inRing.hp < 1e6 && inRing.chill > 0 && far.hp === 1e6 && !(far.chill > 0);
      P.posture = 0; const wBlock = blocked(z); out.wBlockLess = wBlock > kBlock * 1.2; out.blocks.push(Math.round(wBlock * 100) / 100);
      D.sim(Math.ceil(SK.ward.dur / .033) + 5); out.ringEnds = D.frostRings().length === 0;
      for (let i = 0; i < SK.ward.rings + 2; i++) { D.sim(25); parry(z); } out.ringCap = D.frostRings().length === SK.ward.rings;
      // Lingering Frost: the parry chill and the ring last 50% longer.
      D.sim(200); art('ward', 'lingering'); clear(); z = foe('zombie', 0, 1.2); D.sim(1); parry(z);
      out.lingerChill = Math.round(z.chill * 100) / 100; out.lingerRing = Math.round(D.frostRings()[0].max * 100) / 100;
      out.lingerOk = Math.abs(z.chill - SK.ward.chill * 1.5) < .1 && Math.abs(out.lingerRing - SK.ward.dur * 1.5) < .01;
      // A Frost Ward parry on the guardian chills it (it swings less often).
      clear(); const b = D.spawnEnemy('boss', P.x, P.z + 2.2, null, 0); b.awake = true; b.abilT = 99; b.atkT = 99; b.spd = 0; D.sim(1); parry(b); out.bossChill = b.chill > 0;
      // Map change clears the rings.
      D.newMap(1); out.cleared = D.frostRings().length === 0;
      clear(); return out;
    });
    console.log('  shield arts:', JSON.stringify(r));
    check(r.kParry, 'shield arts: the Knight\'s Shield parry gives a riposte, no barrier and no frost ring');
    check(r.barrierOk && r.capOk && r.absorbs && r.fades, `shield arts: a Magic Shield parry grants a barrier (${r.barrier}) that stacks to its cap, absorbs damage, fades, and gives a weaker riposte (${r.mRiposte}×)`);
    check(r.mBlockMore && r.wBlockLess, `shield arts: Magic Shield blocks take less, Frost Ward blocks more, than the Knight's Shield (taken of 20: ${r.blocks})`);
    check(r.wardingOk, `shield arts: Warding makes the parry barrier 30% bigger (${r.warded} vs ${r.barrier})`);
    check(r.wardOk && r.ringBites && r.ringEnds && r.ringCap && r.bossChill, `shield arts: a Frost Ward parry chills the attacker (${r.chill}s) and leaves a frost ring (${r.ringDur}s) that chills and bites only what's inside, ends, and is capped`);
    check(r.lingerOk, `shield arts: Lingering Frost makes the parry chill and ring last 50% longer (${r.lingerChill}s, ${r.lingerRing}s)`);
    check(r.cleared, 'shield arts: frost rings are cleared with the map');
    check(errors.length === 0, `shield arts: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Fight mechanics: the Knight's Shield (block, parry, posture), Roll, stagger, telegraph kinds ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, ctl = D.ctl, out = {};
      D.start(true); ctl.aim = null; ctl.mx = ctl.mz = 0; D.setAutoAtk(false);
      const clear = () => { G.enemies.forEach(e => { e.deathT = 1; e.gone = true; }); G.eproj = []; G.queue = []; Object.assign(P, { invuln: 0, life: S.maxLife, posture: 0, broken: 0, blocking: false, parryT: 0, parryCd: 0, riposteT: 0, rollT: 0 }); ctl.guard = false; ctl.tap = {}; P.x = G.start.x; P.z = G.start.z; };
      const foe = (type, dx, dz) => { const e = D.spawnEnemy(type, P.x + dx, P.z + dz, null, 0); e.awake = true; e.spd = 0; e.atkT = 99; e.hp = e.maxHp = 1e6; return e; };
      // Parry: a press just before the hit lands takes nothing and stuns the attacker.
      clear(); let z = foe('zombie', 0, 1.2); D.sim(1);
      ctl.tap.guard = true; D.sim(1); const l0 = P.life;
      out.parry = D.hurtP(20, 'zombie', { from: z, by: z }) === 'parry' && P.life === l0 && z.stun > 0 && P.riposteT > 0;
      // Block: held past the parry window, a hit from the front is reduced and fills posture; from behind it isn't blocked.
      ctl.guard = true; D.sim(15); const l1 = P.life;
      out.blockRes = D.hurtP(20, 'zombie', { from: z, by: z }); out.blockTaken = Math.round((l1 - P.life) * 100) / 100; out.posture = P.posture;
      out.block = out.blockRes === 'block' && out.blockTaken > 0 && out.blockTaken < 20 * .5 && P.posture > 0 && P.blocking;
      out.behind = D.hurtP(10, 'zombie', { from: { x: P.x - Math.sin(P.face) * 2, z: P.z - Math.cos(P.face) * 2 } }) === 'hit';
      // Posture drains once you stop taking blocked hits.
      const p0 = P.posture; ctl.guard = false; D.sim(60); out.drains = P.posture < p0;
      // A full posture bar breaks your guard: stunned, can't move, and hits land harder.
      clear(); z = foe('zombie', 0, 1.2); ctl.guard = true; D.sim(15);
      let res = ''; for (let i = 0; i < 20 && res !== 'broken'; i++) res = D.hurtP(S.maxLife * .2, 'zombie', { from: z });
      const bx = P.x; ctl.mx = 1; D.sim(5); ctl.mx = 0;
      out.broken = res === 'broken' && P.broken > 0 && !P.blocking && Math.abs(P.x - bx) < .01;
      const l2 = P.life; D.hurtP(10, 'zombie', { from: z }); out.brokenHurts = l2 - P.life > 10 * (1 - S.dr) * 1.2;
      // Unblockable: goes through a block and breaks the guard.
      clear(); z = foe('zombie', 0, 1.2); ctl.guard = true; D.sim(15);
      out.unblockable = D.hurtP(20, 'charge', { from: z, kind: 'unblockable' }) === 'broken' && P.broken > 0;
      // Heavy: a block takes off less than a normal hit.
      clear(); z = foe('zombie', 0, 1.2); ctl.guard = true; D.sim(15); const l3 = P.life; D.hurtP(20, 'slam', { from: z, kind: 'heavy' }); out.heavyBlock = l3 - P.life > 20 * (1 - S.dr) * .4;
      // Raising the shield cancels the swing being wound up.
      clear(); ctl.guard = false; z = foe('zombie', 0, 1.2); D.sim(1); P.aimAt = [z.x, z.z]; D.strike('sword'); P.aimAt = null; ctl.tap.guard = true; D.sim(10);
      out.cancelled = z.hp === z.maxHp;
      // A riposte: the first swing after a parry hits harder.
      clear(); z = foe('zombie', 0, 1.2); D.sim(1); const swing = () => { const h = z.hp; P.aimAt = [z.x, z.z]; D.strike('sword'); P.aimAt = null; D.sim(10); return h - z.hp; };
      const plain = swing(); P.riposteT = 2; const rip = swing(); out.riposte = rip > plain * 1.4 && P.riposteT <= 0;
      // Roll: from Evade, away from the threat, untouchable, and the autopilot holds still after it.
      clear(); z = foe('zombie', 0, 1.2); D.sim(1); const d0 = Math.hypot(z.x - P.x, z.z - P.z);
      ctl.tap.evade = true; D.sim(1); out.rollPause = P.apPause > 0 && P.rollT > 0;
      out.rollMiss = D.hurtP(50, 'slam', { from: z, kind: 'heavy' }) === 'miss'; D.sim(15);
      out.rollAway = Math.hypot(z.x - P.x, z.z - P.z) > d0 + 2.5 && !D.blocked(P.x, P.z, P.r);
      // Stagger: parrying the guardian fills its bar; full, it's stunned (its ability cancelled) and takes more damage.
      clear(); const b = D.spawnEnemy('boss', P.x, P.z + 2.2, null, 0); b.awake = true; b.abilT = 99; b.atkT = 99; b.spd = 0;
      b.cast = { kind: 'slam', t: 5, x: P.x, z: P.z, r: 2 }; const st = [];
      for (let i = 0; i < 6 && !(b.stun > 0); i++) { P.parryCd = 0; ctl.tap.guard = true; D.sim(1); D.hurtP(10, 'boss', { from: b, by: b }); st.push(Math.round(b.stag * 100) / 100); }
      out.stagSteps = st.join(','); out.stunned = b.stun > 0 && !b.cast;
      // The first swing on a staggered guardian is a finisher (about STAGGER.finisher × a stunned swing); the rest of the stun
      // still hits harder than normal. Crits, the hit spread (Math.random pinned) and the parry's riposte are off so the comparison is fair.
      const crit = S.crit, rnd = Math.random; S.crit = 0; Math.random = () => .5; const bswing = () => { const h = b.hp; P.aimAt = [b.x, b.z]; D.strike('sword'); P.aimAt = null; D.sim(10); return h - b.hp; };
      ctl.guard = false; D.sim(12); P.riposteT = 0; const f0 = P.finishers, finHit = bswing(); out.finCount = P.finishers - f0; const stunHit = bswing(); out.stillStunned = b.stun > 0;
      b.stun = 0; b.stag = 0; D.sim(1); const plainHit = bswing(); S.crit = crit; Math.random = rnd;
      out.finRatio = Math.round(finHit / stunHit * 100) / 100; out.stunTaken = stunHit > plainHit * 1.08;
      out.finisher = out.finCount === 1 && out.stillStunned && out.finRatio > D.STAGGER.finisher * .7 && P.finishers - f0 === 1;
      // A hit the guardian lands (not blocked or parried) steadies it: its stagger bar drops.
      b.stag = .8; P.invuln = 0; P.rollT = 0; ctl.guard = false; P.blocking = false; P.parryT = 0; D.sim(1); D.hurtP(5, 'boss', { from: b, by: b }); out.recover = b.stag < .8 - D.STAGGER.recover * .9;
      b.stag = 0;
      // Channels (BOSS.channel, phase 2): it roots and channels; filling its stagger first cancels it and staggers it (finisher ready).
      const C = D.BOSS.channel, chanAt = () => { b.stun = 0; b.stag = 0; b.channel = null; b.cast = null; b.phase2 = true; b.hp = b.maxHp * .3; b.rot = 0; b.abilT = 0; b.atkT = 99; Object.assign(P, { invuln: 0, rollT: 0, blocking: false, parryT: 0, parryCd: 0, life: S.maxLife }); ctl.guard = false; D.sim(1); b.atkT = 99; };
      b.chanN = 0; chanAt(); out.chanUp = !!b.channel && b.channel.fx === C.effects[0];
      const br0 = P.chanBroken; for (let i = 0; i < 4 && b.channel; i++) { P.parryCd = 0; ctl.tap.guard = true; D.sim(1); D.hurtP(10, 'boss', { from: b, by: b }); }
      out.chanBroken = !b.channel && b.stun > 0 && b.finisher && P.chanBroken === br0 + 1;
      // A channel left alone completes: the first is an unblockable burst you have to roll, the next mends and summons.
      b.chanN = 0; chanAt(); const lb = P.life; D.sim(Math.ceil(C.t / .033) + 2); out.burstUp = b.cast && b.cast.kind === 'burst' && !b.channel;
      D.sim(Math.ceil(C.burst.t / .033) + 2); out.burstHit = Math.round(lb - P.life); out.burst = out.burstUp && lb - P.life > b.dmg * C.burst.dmg * (1 - S.dr) * .8;
      chanAt(); const h0 = b.hp, runners0 = G.enemies.filter(e => e.type === D.BOSS.summonType && !e.deathT).length; D.sim(Math.ceil(C.t / .033) + 2);
      out.mend = !b.channel && b.hp > h0 + b.maxHp * C.mend.heal * .9 && G.enemies.filter(e => e.type === D.BOSS.summonType && !e.deathT).length >= runners0 + C.mend.summon - 1;
      G.enemies.forEach(e => { if (e !== b) { e.deathT = 1; e.gone = true; } });
      // Surge fills stagger faster during a channel: the same swing fills more surging, and more in a channel than out of one.
      Math.random = () => .5; S.crit = 0;
      const stagOf = (surge, chan) => { b.stun = 0; b.stag = 0; b.cast = null; b.abilT = 99; b.atkT = 99; b.channel = chan ? { t: 0, fx: 'burst' } : null; P.riposteT = 0; P.surge = S.surgeMax; P.spent = false; ctl.surge = surge; D.sim(2); const s0 = b.stag; bswing(); const ds = b.stag - s0; ctl.surge = false; b.channel = null; return ds; };
      const sc = stagOf(true, true), pc = stagOf(false, true), so = stagOf(true, false);
      S.crit = crit; Math.random = rnd;
      out.chanSurge = [sc, pc, so].map(v => Math.round(v * 1000) / 1000).join(','); out.surgeFaster = sc > pc * 2 && sc > so * 2;
      // RIDE: a short effort spike while it channels fills its stagger (RIDE.spike); steady riding doesn't.
      const spike = rel => { b.stun = 0; b.stag = 0; b.abilT = 99; b.atkT = 99; b.channel = { t: 0, fx: 'burst' }; ctl.effort = { pw: rel * 250, rel, cad: 90 }; D.sim(30); const v = b.stag; ctl.effort = null; b.channel = null; return v; };
      const sp = spike(1.6), steady = spike(.75); out.spike = Math.round(sp * 100) / 100; out.rideSpike = sp > .2 && steady === 0;
      b.stun = 0; b.stag = 0;
      // Bloaters: killed before the fuse runs out, no blast; a fuse that runs out blows up.
      clear(); const bl = foe('bloater', 0, 4); D.kill(bl); out.defused = !G.queue.some(q => q.k === 'bloat');
      const bl2 = foe('bloater', 0, 1); bl2.spd = 0; D.sim(40); out.fused = bl2.deathT > 0 && bl2.fused;
      // A rare's heavy swing (RARE.heavy): after a few parryable swings it winds up a longer red one that hits harder; a parry press
      // only blocks it (like the guardian's slam), and a roll avoids it.
      const H = D.RARE.heavy, rareFoe = () => { clear(); const e = D.spawnEnemy('zombie', P.x, P.z + 1.4, null, 2); e.awake = true; e.spd = 0; e.hp = e.maxHp = 1e6; e.aff = []; e.fireAura = null; e.cd = .5; e.atkT = .1; e.rise = 0; return e; };
      let rr = rareFoe(); const swings = []; let sawHeavy = null, lastSeq = 0;
      for (let i = 0; i < 600 && swings.length < 8; i++) {
        P.life = S.maxLife; P.invuln = 0; const l = P.life, wasHeavy = rr.heavy, w0 = rr.windup; D.sim(1);
        if (rr.atkSeq !== lastSeq) { lastSeq = rr.atkSeq; if (rr.heavy && !sawHeavy) sawHeavy = { windup: Math.round(rr.windup * 100) / 100 }; }
        if (w0 > 0 && rr.windup <= 0 && l > P.life) swings.push({ heavy: wasHeavy, dmg: l - P.life });
      }
      const plainS = swings.filter(x => !x.heavy), heavyS = swings.filter(x => x.heavy);
      out.rareHeavy = { seen: !!sawHeavy, windup: sawHeavy && sawHeavy.windup, plain: plainS.length, heavy: heavyS.length, ratio: heavyS.length && plainS.length ? Math.round(heavyS[0].dmg / plainS[0].dmg * 100) / 100 : 0 };
      out.rareHeavyOk = !!sawHeavy && sawHeavy.windup > D.SK.block.parry * 2 && heavyS.length > 0 && plainS.length >= H.every[0] && out.rareHeavy.ratio > H.dmg * .8;
      // At the heavy's landing: a parry press doesn't parry it (it's blocked for less), a roll takes nothing.
      const toHeavy = () => { rr = rareFoe(); rr.heavyIn = 0; rr.atkT = .05; for (let i = 0; i < 10 && !(rr.windup > 0); i++) D.sim(1); return rr.heavy; };
      out.heavyStarts = toHeavy(); while (rr.windup > D.SK.block.parry * .5) D.sim(1);
      ctl.tap.guard = true; const lp = P.life; D.sim(8); out.heavyParry = P.life < lp && P.life > lp - rr.dmg * H.dmg * (1 - S.dr) * .7 && P.lastCast !== 'parry' && !(rr.stun > 0);
      ctl.guard = false; P.blocking = false;
      toHeavy(); while (rr.windup > D.SK.roll.invuln * .5) D.sim(1); ctl.tap.evade = true; const lr = P.life; D.sim(8); out.heavyRoll = P.life === lr;
      // Flame Dash goes through the monster you aim at and ends beyond it, hitting it on the way.
      clear(); const fz = foe('zombie', 0, 3); D.sim(1); ctl.aim = [fz.x, fz.z]; const pz0 = P.z; D.castDash(); ctl.aim = null;
      out.dashEnd = Math.round((P.z - fz.z) * 100) / 100; out.dashThrough = P.z > fz.z + fz.r && fz.hp < fz.maxHp && P.z - pz0 <= D.SK.dash.range + .01;
      // The guardian's swings and slams carry a telegraph cue over the hero.
      clear(); ctl.guard = false;
      return out;
    });
    console.log('  fight:', JSON.stringify(r));
    check(r.parry, 'fight: a press just before a hit parries it: no damage, the attacker is stunned, a riposte is ready');
    check(r.block && r.behind, `fight: holding Guard blocks a hit from the front (${r.blockTaken} of 20 taken) and fills posture, but not one from behind`);
    check(r.drains, 'fight: posture drains when you stop taking blocked hits');
    check(r.broken && r.brokenHurts, 'fight: a full posture bar breaks your guard: stunned, and hits land harder');
    check(r.unblockable && r.heavyBlock, 'fight: unblockable hits break a block; a blocked heavy still hurts more than a blocked hit');
    check(r.cancelled, 'fight: raising the shield cancels the swing being wound up');
    check(r.riposte, 'fight: the first swing after a parry is a riposte that hits harder');
    check(r.rollPause && r.rollMiss && r.rollAway, 'fight: Roll (Evade) moves you away from the threat, untouchable, and the autopilot holds still after it');
    check(r.stunned && r.stunTaken, `fight: parries fill the guardian's stagger bar (${r.stagSteps}); full, it's stunned, its ability cancelled, and takes more damage`);
    check(r.finisher, `fight: the first hit on a staggered guardian is a finisher (${r.finRatio}× the next stunned hit), once per stagger`);
    check(r.recover, 'fight: a hit the guardian lands on you (not blocked or parried) knocks its stagger bar back');
    check(r.chanUp && r.chanBroken, 'fight: the guardian channels in phase 2; filling its stagger bar first cancels the channel and staggers it, finisher ready');
    check(r.burst && r.mend, `fight: a completed channel does its effect: an unblockable burst (${r.burstHit} taken), then a mend that heals and summons`);
    check(r.surgeFaster, `fight: Surge fills stagger faster during a channel (stagger per swing: surging in a channel, not surging in one, surging outside one: ${r.chanSurge})`);
    check(r.rideSpike, `fight: in RIDE mode a short effort spike fills a channelling guardian's stagger (${r.spike} in 1 s at 160% FTP), steady riding doesn't`);
    check(r.defused && r.fused, 'fight: a bloater killed before its fuse runs out doesn\'t blow up; one whose fuse runs out does');
    check(r.rareHeavyOk, `fight: a rare eventually winds up a red heavy swing (${JSON.stringify(r.rareHeavy)}): a longer windup and it hits harder`);
    check(r.heavyStarts && r.heavyParry && r.heavyRoll, `fight: a rare's heavy swing can't be parried (a parry press blocks it for less) and a roll avoids it (${r.heavyStarts}, ${r.heavyParry}, ${r.heavyRoll})`);
    check(r.dashThrough, `fight: Flame Dash goes through the monster you aim at, hitting it, and ends beyond it (${r.dashEnd} past its centre)`);
    check(errors.length === 0, `fight: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Flame Totem and Meteor (Flex gems): damage, milestone, cleanup on map clear ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, ctl = D.ctl, out = {};
      D.start(true); D.placeGem(D.addGem('cleave').id, 'main'); document.getElementById('mShrine').classList.remove('show');
      P.lvl = 8; D.recalc(); D.newMap(1); const pk = G.packs[0]; P.x = pk.x - 7; P.z = pk.z; D.sim(3);
      // A tough stand-in monster five units away, kept in place so the skills have something to hit.
      const dummy = () => { const e = G.enemies.find(x => !x.deathT); e.x = P.x + 5; e.z = P.z; e.vx = e.vz = 0; e.hp = e.maxHp = 1e6; e.awake = true; ctl.aim = [e.x, e.z]; return e; };
      const run = (e, n) => { for (let i = 0; i < n; i++) { e.x = P.x + 5; e.z = P.z; e.vx = e.vz = 0; P.life = S.maxLife; D.sim(1); } };
      const useSlot = (gem, lvl) => { const g = D.addGem(gem, lvl); D.placeGem(g.id, 'flexA'); return g; };
      const count = () => D.scene.children.length;
      // Flame Totem
      const g = useSlot('totem', 4); out.slotOk = P.bar.flexA === g.id;
      let e = dummy(), hp0 = e.hp; const c0 = count();
      ctl.tap.flexA = true; D.sim(1); out.placed = count() > c0;
      run(e, 60); out.totemDmg = hp0 - e.hp; out.noMile = !S.mile.totem;
      run(e, 250); out.expired = count() <= c0 + 1; // gone after its duration (a stray fx mesh at most)
      g.lvl = 5; D.recalc(); out.mile = !!S.mile.totem;
      P.cd.flexA.cd = 0; ctl.tap.flexA = true; D.sim(1); const c1 = count();
      D.newMap(1); out.clearedTotem = count() < c1;
      // Meteor
      const m = useSlot('meteor', 4); const pk2 = G.packs[0]; P.x = pk2.x - 7; P.z = pk2.z; D.sim(3); e = dummy(); hp0 = e.hp; const nP = G.patches.length;
      ctl.tap.flexA = true; D.sim(1); run(e, 5); out.early = hp0 - e.hp; // the 0.8 s delay: nothing yet
      run(e, 25); out.meteorDmg = hp0 - e.hp; out.patch = G.patches.length > nP;
      m.lvl = 5; D.recalc(); out.mileM = !!S.mile.meteor;
      return out;
    });
    console.log('  totem/meteor:', JSON.stringify(r));
    check(r.slotOk && r.placed, 'totem: casting plants a totem');
    check(r.totemDmg > 0 && r.noMile, `totem: it shoots the nearest monster (${Math.round(r.totemDmg)} damage)`);
    check(r.expired && r.mile, 'totem: it expires, and the level 5 milestone is read');
    check(r.clearedTotem, 'totem: clearing the map removes it');
    check(r.early === 0 && r.meteorDmg > 0 && r.patch && r.mileM, `meteor: lands after the delay (${Math.round(r.early)} early, ${Math.round(r.meteorDmg)} after), leaves burning ground`);
    check(errors.length === 0, `totem/meteor: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Melee Main gems (src/game/sk/strike.js) and the auto-attack (game/gems.js autoTarget) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, ctl = D.ctl, out = {};
      D.start(true); D.placeGem(D.addGem('cleave').id, 'main'); document.getElementById('mShrine').classList.remove('show');
      D.arena({ tier: 1, fight: [], maxT: .1, sock: {} }); // an open floor with no monsters, Ember Cleave in Main
      D.setAutoAtk(false); // scripted swings only, until the auto-attack checks below
      const clear = () => { for (const e of G.enemies) { e.deathT = 1; e.gone = true; } D.sim(1); };
      const foe = (dx, dz, awake = true) => { const e = D.spawnEnemy('zombie', P.x + dx, P.z + dz, null, 0); e.hp = e.maxHp = 1e6; e.spd = 0; e.atkT = 99; e.awake = awake; return e; };
      const swing = (gem, at = [P.x, P.z + 5]) => { P.aimAt = at; D.strike(gem); P.aimAt = null; D.sim(15); };
      const hurt = e => e.hp < e.maxHp;
      // Each gem: hits what's in its shape in front, not behind.
      out.shape = {};
      for (const gem of ['cleave', 'fstrike', 'slam']) {
        clear(); const front = foe(0, 1.5), side = foe(1.6, .3), back = foe(0, -1.8);
        swing(gem); out.shape[gem] = [hurt(front), hurt(side), hurt(back)].map(Number).join('');
      }
      // Frost Strike chills; its level 5 milestone freezes on every 3rd strike.
      clear(); let e = foe(0, 1.5); swing('fstrike'); out.chill = e.chill > 0;
      const g = P.gems.find(x => x.id === P.bar.main); g.gem = 'fstrike'; g.lvl = 5; D.recalc(); P.atkN = 0;
      swing('fstrike'); const f1 = e.freeze > 0; swing('fstrike'); const f2 = e.freeze > 0; swing('fstrike'); out.freeze3 = !f1 && !f2 && e.freeze > 0;
      // The Sword's level 5 milestone: every 3rd swing is a heavy cut (more damage and more stagger). Crits and the spread are pinned.
      { const crit = S.crit, rnd = Math.random; g.gem = 'sword'; g.lvl = 5; D.recalc(); S.crit = 0; Math.random = () => .5; clear();
        const rz = D.spawnEnemy('zombie', P.x, P.z + 1.5, null, 2); rz.awake = true; rz.spd = 0; rz.atkT = 99; rz.hp = rz.maxHp = 5000; rz.aff = []; rz.fireAura = null; P.atkN = 0;
        const cuts = []; for (let i = 0; i < 3; i++) { const h = rz.hp, st = rz.stag; swing('sword'); cuts.push([h - rz.hp, rz.stag - st]); }
        g.lvl = 4; D.recalc(); P.atkN = 2; const h4 = rz.hp; swing('sword'); const l4 = h4 - rz.hp; S.crit = crit; Math.random = rnd;
        const Ms = D.GEMS.sword.mile; out.cut = cuts.map(c => Math.round(c[0])).join(',') + ' · L4 3rd: ' + Math.round(l4);
        out.heavyCut = Math.abs(cuts[2][0] / cuts[0][0] - Ms.mult) < .05 && Math.abs(cuts[1][0] - cuts[0][0]) < 1 && cuts[2][1] > cuts[0][1] * (Ms.stagger - .1) && Math.abs(l4 - cuts[0][0]) < 1; g.gem = 'fstrike'; g.lvl = 5; D.recalc(); }
      // Thunder Slam knocks back harder than Cleave.
      clear(); e = foe(0, 1.8); e.hp = e.maxHp = 1e6; const z0 = e.z; P.aimAt = [P.x, P.z + 5]; D.strike('slam'); P.aimAt = null; D.sim(14); out.kbSlam = e.z - z0;
      clear(); e = foe(0, 1.5); const z1 = e.z; P.aimAt = [P.x, P.z + 5]; D.strike('cleave'); P.aimAt = null; D.sim(9); out.kbCleave = e.z - z1;
      // Supports: Brittle marks (more damage taken), Aftershock hits again, Ignite burns.
      g.gem = 'fstrike'; g.lvl = 1; D.recalc(); const sup = id => { const x = D.addGem(id); D.socketGem(x.id, 'main'); return x; };
      clear(); const br = sup('brittle'); e = foe(0, 1.5); swing('fstrike'); out.brittle = e.shock > 0 && e.shockMore === D.SUPPORTS.brittle.taken; D.unsocket('main', 0);
      g.gem = 'slam'; D.recalc(); clear(); sup('aftershock'); e = foe(0, 1.6); P.aimAt = [P.x, P.z + 5]; D.strike('slam'); P.aimAt = null;
      D.sim(12); const h1 = e.maxHp - e.hp; D.sim(20); out.aftershock = h1 > 0 && e.maxHp - e.hp > h1 * 1.2; D.unsocket('main', 0);
      g.gem = 'cleave'; D.recalc(); clear(); sup('ignite'); e = foe(0, 1.5); swing('cleave'); out.ignite = e.burnT > 0; D.unsocket('main', 0); D.recalc();
      // Auto-attack: swings at an awake monster in reach, never at a sleeping one or one out of reach; steering away pauses it; HOLD turns it off.
      const auto = () => { const c = P.castSeq; P.castT = 0; D.sim(20); return P.castSeq - c; };
      clear(); D.setAutoAtk(true); ctl.mx = ctl.mz = 0;
      const sleeper = foe(0, 1.4, false); out.noSleeper = auto() === 0; sleeper.deathT = 1; sleeper.gone = true;
      const far = foe(0, 6); out.noFar = auto() === 0; far.deathT = 1; far.gone = true;
      const near = foe(0, 1.4); out.swings = auto(); out.hitNear = hurt(near);
      ctl.mz = -1; out.awayPaused = auto() === 0; ctl.mz = 1; const toward = auto(); ctl.mz = 0; P.x = 0; P.z = 0; near.x = 0; near.z = 1.4; out.toward = toward > 0;
      D.setAutoAtk(false); out.holdOff = auto() === 0;
      ctl.main = true; ctl.aim = [P.x, P.z + 3]; out.holdSwings = auto() > 0; ctl.main = false; ctl.aim = null; D.setAutoAtk(true);
      out.btn = document.getElementById('bAtk').textContent;
      // Priority: a rare in reach before a nearer normal monster.
      clear(); const n1 = foe(.9, .9), rare = D.spawnEnemy('zombie', P.x - 1.6, P.z, null, 2); rare.awake = true; rare.spd = 0;
      out.rareFirst = D.autoTarget('cleave') === rare;
      return out;
    });
    console.log('  melee:', JSON.stringify(r));
    check(r.shape.cleave === '110' && r.shape.fstrike === '100' && r.shape.slam === '110', `melee: Cleave hits the wide front, Frost Strike a narrow one, Slam a circle ahead; none hit behind (${JSON.stringify(r.shape)})`);
    check(r.chill && r.freeze3, 'melee: Frost Strike chills, and at level 5 every 3rd strike freezes');
    check(r.heavyCut, `melee: at level 5 every 3rd Sword swing is a heavy cut, hitting harder and staggering more (damage ${r.cut})`);
    check(r.kbSlam > r.kbCleave && r.kbCleave >= 0 && r.kbCleave < .6, `melee: Thunder Slam knocks back, Cleave only nudges (${r.kbSlam.toFixed(2)} vs ${r.kbCleave.toFixed(2)})`);
    check(r.brittle && r.aftershock && r.ignite, `melee: Brittle marks, Aftershock hits again, Ignite burns (${r.brittle}, ${r.aftershock}, ${r.ignite})`);
    check(r.noSleeper && r.noFar && r.swings > 0 && r.hitNear, `melee: auto-attack swings at an awake monster in reach, not a sleeping or distant one (${r.swings} swings)`);
    check(r.awayPaused && r.toward, 'melee: steering away by hand pauses the auto-attack; walking toward it keeps swinging');
    check(r.holdOff && r.holdSwings && r.btn === 'ATTACK: AUTO', `melee: ATTACK: HOLD stops the auto-attack and holding the button still swings (${r.btn})`);
    check(r.rareFirst, 'melee: the auto-attack goes for a rare before a nearer normal monster');
    check(errors.length === 0, `melee: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Raise Skeletons: a support gem; the socketed skill's kills rise (src/game/sk/skeletons.js) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, G = D.G, out = {};
      D.start(true); D.placeGem(D.addGem('cleave').id, 'main'); document.getElementById('mShrine').classList.remove('show');
      D.arena({ tier: 1, fight: [], maxT: .1, main: 'cleave', sock: { main: ['raise'] } }); // an open floor, Ember Cleave + Raise Skeletons
      D.setAutoAtk(false); // scripted swings only
      out.socketed = D.S.sk.cleave.raise;
      const sk = () => D.minions().filter(m => !m.deathT).length;
      const R = D.SUPPORTS.raise, chance = R.chance; out.cap = D.skel.cap();
      // Kills by the socketed skill raise skeletons, up to the cap.
      R.chance = 1;
      for (let i = 0; i < 6; i++) { const z = D.spawnEnemy('zombie', P.x, P.z + 1.4, null, 0); z.awake = true; z.hp = 1; P.aimAt = [P.x, P.z + 5]; D.strike('cleave'); P.aimAt = null; D.sim(12); }
      out.raised = sk(); out.capped = out.raised === out.cap;
      // Kills by another skill don't count.
      D.newMap(1); D.arena({ tier: 1, fight: [], maxT: .1, main: 'cleave', sock: { main: ['raise'] } }); D.setAutoAtk(false); D.sim(2);
      const z2 = D.spawnEnemy('zombie', P.x + 2, P.z, null, 0); z2.awake = true; z2.hp = 1; D.sim(1); D.castNova(); D.sim(5); out.otherSkill = !!z2.deathT && sk() === 0;
      // A raised skeleton fights: it kills a zombie on its own, the kill counts for you, and doesn't raise another.
      D.skel.raise(P.x + 1, P.z, 'cleave'); R.chance = 1;
      const k0 = P.kills, z = D.spawnEnemy('zombie', P.x + 6, P.z, null, 0); z.awake = true;
      let t = 0; while (!z.deathT && t < 900) { P.x = -30; P.z = 0; D.sim(10); t += 10; } // stay out of it so only the skeleton fights
      R.chance = chance;
      out.killed = !!z.deathT; out.killT = Math.round(t * .033 * 10) / 10; out.kills = P.kills - k0; out.noChain = sk() === 1;
      out.hurtOne = D.minions().some(m => m.hp < m.maxHp); // it swung at a skeleton before dying
      out.rigged = D.minions().every(m => m.model.rigged === D.chars.ready);
      // Taking the support off the bar: the army crumbles. A new map clears them.
      D.skel.raise(P.x + 1, P.z, 'cleave'); D.unsocket('main', 0); D.sim(5); out.crumbled = sk() === 0;
      D.newMap(1); out.cleared = D.minions().length === 0; D.setAutoAtk(true);
      return out;
    });
    console.log('  skeletons:', JSON.stringify(r));
    check(r.socketed && r.cap === 3 && r.capped, `skeletons: kills by the socketed skill rise as skeletons, up to the cap (${r.raised} of ${r.cap})`);
    check(r.otherSkill, 'skeletons: kills by a skill without the support raise nothing');
    check(r.killed && r.kills === 1 && r.noChain, `skeletons: a skeleton kills a monster on its own, the kill counts for you and raises no more (${r.killT}s)`);
    check(r.hurtOne, 'skeletons: monsters in reach attack the minions');
    check(r.rigged, 'skeletons: minions use the rigged skeleton when characters loaded');
    check(r.crumbled && r.cleared, 'skeletons: they crumble when the support leaves the bar and are cleared with the map');
    check(errors.length === 0, `skeletons: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- No mana; the Surge gauge (data/skills.js SURGE, game/update.js updSurge) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, ctl = D.ctl, out = {};
      D.start(true); D.placeGem(D.addGem('cleave').id, 'main'); document.getElementById('mShrine').classList.remove('show');
      out.noMana = P.mana === undefined && S.maxMana === undefined && !D.SK.cleave.cost && !document.getElementById('manaF');
      D.arena({ tier: 1, fight: [], maxT: .1 }); // an open floor with no monsters
      const z = D.spawnEnemy('zombie', P.x + 6, P.z, null, 0); z.hp = z.maxHp = 1e9; z.spd = 0; ctl.aim = [z.x, z.z];
      // Ember Cleave held for 10 s, without and with Surge: no mana means the plain rate never stops, Surge is faster.
      const casts = surge => { P.surge = S.surgeMax; P.spent = false; P.surgeWait = 0; ctl.surge = surge; const c = P.castSeq; ctl.main = true; D.sim(300); ctl.main = false; ctl.surge = false; return P.castSeq - c; };
      out.plain = casts(false); out.surged = casts(true);
      out.drained = Math.round((S.surgeMax - P.surge) * 10) / 10; // about 10 s used
      // Run it dry: spent until it refills to SURGE.restart, and refilling waits SURGE.delay after you stop.
      P.surge = .2; ctl.surge = true; D.sim(15); out.spent = P.spent && P.surge === 0; out.offWhenSpent = P.surgeK === 0 && !ctl.surge;
      ctl.surge = false; D.sim(30); out.waits = P.surge === 0; D.sim(120); out.refills = P.surge > 0;
      while (P.spent && G.gt < 1e4) D.sim(30); out.restartAt = Math.round(P.surge / S.surgeMax * 100) / 100;
      // RIDE: hard riding surges, endurance pace doesn't, easy riding casts slower.
      D.setRide(true); P.surge = S.surgeMax; P.spent = false;
      const pedal = rel => { ctl.effort = { pw: D.ride.ftp * rel, rel, cad: 80 }; D.sim(5); }; // what pollRide writes each frame
      pedal(1.1); out.rideHard = P.surgeK;
      pedal(.7); out.rideEnd = P.surgeK; out.castEnd = P.eff.cast;
      pedal(.3); out.castEasy = P.eff.cast;
      D.setRide(false);
      // Loot: no uniques in the Crypt (tiers 1–5), even with a guardian's boost; they can drop from the next region.
      const rolls = (il, boost) => Array.from({ length: 400 }, () => D.rollItem(il, boost).rar);
      out.cryptUniques = [1, 5].flatMap(t => rolls(t, .6)).filter(r => r === 3).length;
      out.laterUniques = rolls(6, .6).filter(r => r === 3).length;
      return out;
    });
    console.log('  surge:', JSON.stringify(r));
    check(r.noMana, 'surge: there is no mana (no pool, no costs, no orb)');
    check(r.plain >= 11, `surge: held Ember Cleave never runs dry (${r.plain} swings in 10 s)`);
    check(r.surged >= r.plain * 1.25, `surge: surging casts faster (${r.surged} vs ${r.plain})`);
    check(r.drained > 9 && r.drained < 11, `surge: the gauge drains about 1 s per second (${r.drained})`);
    check(r.spent && r.offWhenSpent, 'surge: an empty gauge stops the bonus and switches Surge off (spent)');
    check(r.cryptUniques === 0 && r.laterUniques > 0, `loot: no uniques in the Crypt, they start in the next region (${r.laterUniques} of 400 at tier 6)`);
    check(r.waits && r.refills, 'surge: the gauge refills after a short wait');
    check(r.restartAt >= .29 && r.restartAt < .4, `surge: spent until it refills to about 30% (${r.restartAt})`);
    check(r.rideHard === 1 && r.rideEnd === 0, 'surge: RIDE surges above endurance pace only');
    check(r.castEnd === 1 && r.castEasy < 1, `surge: RIDE casts slower when riding easy (${r.castEasy})`);
    check(errors.length === 0, `surge: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- ARPG in RIDE mode (simulated Zwift Ride + KICKR) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, out = {};
      D.setRide(true); D.start(true); D.placeGem(D.addGem('cleave').id, 'main'); document.getElementById('mShrine').classList.remove('show');
      // Not pedalling: the hero must not move even with the D-pad held.
      D.ride.pw = 0; D.ride.held.right = true; const x0 = P.x; D.sim(60); out.stillAt0W = Math.abs(P.x - x0) < .01;
      D.ride.held.right = false;
      // Pedalling at ~80% FTP with autopilot on: the hero walks into packs and the auto-attack clears them, no buttons.
      D.ride.pw = 200; D.ctl.auto = true; D.setAutoAtk(true);
      // Measure the path walked, not distance from the start: the autopilot can loop back toward the entrance.
      let walked = 0, lx = P.x, lz = P.z;
      for (let i = 0; i < 150; i++) {
        P.life = Math.max(P.life, 60);
        for (let k = 0; k < 15; k++) { D.sim(1); const step = Math.hypot(P.x - lx, P.z - lz); if (step < 1) walked += step; /* skip respawn and dash jumps */ lx = P.x; lz = P.z; }
      }
      out.kills = P.kills; out.travelled = walked;
      D.setRide(false);
      return out;
    });
    console.log('  ride:', JSON.stringify(r));
    check(r.stillAt0W, 'ride: hero stands still at 0 W');
    check(r.travelled > 10, `ride: autopilot moves the hero (${r.travelled.toFixed(1)} units walked)`);
    check(r.kills >= 10, `ride: autopilot + auto-attack clears monsters (${r.kills} kills)`);
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

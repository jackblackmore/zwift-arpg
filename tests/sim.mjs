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
  // ---------- Data: the text players read matches the numbers in src/data (supports and milestones) ----------
  {
    const pc = v => Math.round(v * 100) + '%', less = v => pc(1 - v) + ' less', U = SUPPORTS, M = id => GEMS[id].mile;
    const want = {
      twin: ['+' + U.twin.proj + ' projectile', less(U.twin.more)], searing: ['+' + U.searing.pierce + ' enemy'], ignite: [pc(U.ignite.share), U.ignite.dur + 's'],
      chainboom: [pc(U.chainboom.chance)], shatter: [pc(U.shatter.pct)], forked: ['+' + U.forked.chains], conduit: [pc(U.conduit.shockMore)], warding: [pc(U.warding.shieldPct)],
      split: [U.split.lances + ' lances', less(U.split.mult)], army: ['+' + U.army.cap + ' skeleton', less(U.army.more)], volley: [U.volley.targets === 2 ? 'two' : String(U.volley.targets), less(U.volley.mult)],
      twinmeteor: [less(U.twinmeteor.mult)], quickstep: ['+' + U.quickstep.ch + ' charge'], lingering: [pc(U.lingering.dur)],
    };
    const mile = {
      fireball: ['Pierces ' + M('fireball').add.pierce], frostlance: [M('frostlance').pierce + ' more'], arc: ['+' + M('arc').add.chains + ' chains'], nova: ['+' + pc(M('nova').add.novaR)],
      totem: [pc(M('totem').dur - 1)], meteor: ['+' + pc(M('meteor').radius - 1)], skeletons: ['+' + M('skeletons').cap + ' skeleton'], shield: [pc(M('shield').add.shieldPct)],
      ward: ['+' + pc(M('ward').radius - 1)], dash: ['+' + M('dash').add.dashCh + ' charge'],
    };
    const bad = [...Object.entries(want).filter(([k, w]) => w.some(t => !U[k].d.includes(t))).map(([k]) => k), ...Object.entries(mile).filter(([k, w]) => w.some(t => !GEMS[k].ms[5].includes(t))).map(([k]) => k + ' (milestone)')];
    const missing = Object.keys(U).filter(k => !want[k]);
    check(!bad.length && !missing.length, `data: support and milestone text matches their numbers${bad.length ? ' · out of step: ' + bad.join(', ') : ''}${missing.length ? ' · no text check for: ' + missing.join(', ') : ''}`);
  }

  // ---------- ARPG ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, out = {};
      D.start(true);
      out.packs = D.packs().length;
      // A fresh character: the Main shrine is open; take Fireball.
      out.shrineOpen = document.getElementById('mShrine').classList.contains('show') && document.querySelectorAll('#shrineCards .pc').length === 3;
      document.querySelector('#shrineCards .pc[data-k="fireball"]').click();
      // Scripted player: walk toward the nearest living pack, hold the Main gem (Fireball), raise Magic Shield on a rhythm.
      D.ctl.aim = null; // a stray headless pointer event can leave a mouse aim point; auto-aim like touch does
      D.ctl.main = true; var px = 1e9, pz = 1e9;
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
        if (step % 60 === 0) D.ctl.tap.guard = true;
        var px = P.x, pz = P.z; P.life = Math.max(P.life, 60); D.sim(10);
      }
      D.ctl.main = false; D.ctl.mx = D.ctl.mz = 0;
      out.mainGem = P.gems.find(g => g.id === P.bar.main).lvl;
      out.rigged = D.chars.ready && D.G.heroM.rigged && D.enemies().some(e => e.model.rigged);
      out.dressed = D.G.dressed && D.G.obst.length > 40 && D.G.torches.length > 10;
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
    check(r.shrineOpen, 'arpg: a new character is offered the Main shrine (3 gems)');
    check(r.mainGem >= 2, `arpg: the Main gem levelled from kills (gem level ${r.mainGem})`);
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

  // ---------- Balance guard rails (arena: real fights, scripted player; full table via `npm run arena`) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg; D.start(true);
      return {
        pack: D.arena({ tier: 1, fight: [['zombie', 3], ['archer', 1]] }),
        boss: D.arena({ tier: 1, guardian: true, maxT: 240 }),
        under: D.arena({ tier: 2, gear: 'start', guardian: true, maxT: 120 }),
        shield: (() => { D.castShield(); const a = D.P.shield / D.S.maxLife; const l = D.P.life; return { result: a > .3 ? 'ok' : 'none', t: Math.round(a * 100) / 100, lowest: l }; })(),
      };
    });
    console.log('  balance:', JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, `${v.result} ${v.t}s lowest ${v.lowest}`]))));
    check(r.pack.result === 'clear' && r.pack.t > 3 && r.pack.t < 20, `balance: a tier 1 pack takes a few seconds with the starter staff (${r.pack.t}s)`);
    check(r.boss.result === 'clear' && r.boss.t > 45 && r.boss.t < 180, `balance: tier 1 guardian can't be burned down (${r.boss.t}s)`);
    check(r.under.result !== 'clear', `balance: starter staff can't beat the tier 2 guardian in 2 minutes (${r.under.result})`);
    check(r.shield.result === 'ok' && r.boss.shields > 0, `balance: Magic Shield absorbs ${Math.round(r.shield.t * 100)}% of max life and the bot uses it (${r.boss.shields} casts)`);
    check(errors.length === 0, `balance: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Skill gems: the bar, shrines, gem levels, milestones, saves ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, out = {};
      const filled = () => Object.keys(P.bar).filter(s => P.bar[s]).sort().join(',');
      D.start(true); P.shrined.guard = 1; // the Frost Ward shrine has its own check below
      out.freshBar = filled(); // only Guard until the Main shrine is taken
      out.guardGem = P.gems.find(g => g.id === P.bar.guard).gem;
      D.takeShrine('main', 'fireball'); document.getElementById('mShrine').classList.remove('show');
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
      // Level 5 milestone: Fireball pierces 1 more.
      const c0 = S.sk.fireball.pierce; arc.lvl = 5; D.recalc(); out.pierceGain = S.sk.fireball.pierce - c0;
      // Save round-trip.
      D.save(); const sv = D.load();
      out.saved = sv.bar && sv.bar.main === P.bar.main && sv.gems.length === P.gems.length && sv.shrined.flexA === 1;
      D.begin(false); document.getElementById('mShrine').classList.remove('show');
      out.loaded = filled() === 'flexA,guard,main' && P.gems.find(g => g.id === P.bar.main).lvl === 5;
      // An old save without gems is treated as fresh for gems: Main shrine on load.
      const old = { ...sv }; delete old.gems; delete old.bar; delete old.shrined; localStorage.setItem('wd-arpg-1', JSON.stringify(old));
      D.begin(false); out.oldSave = filled() === 'guard' && document.getElementById('mShrine').classList.contains('show');
      return out;
    });
    console.log('  gems:', JSON.stringify(r));
    check(r.freshBar === 'guard' && r.guardGem === 'shield' && r.afterMain === 'guard,main', `gems: a fresh character has exactly Main and Guard (Magic Shield) filled (${r.afterMain})`);
    check(r.lockedFlex, 'gems: Flex A is locked below level 5');
    check(r.shrineSlot === 'flexA' && r.ask === 'flexA', `gems: at level 5 a Flex A shrine appears and opens when walked into (${r.shrineSlot}, ${r.ask})`);
    check(r.flexOffer.split(',').length === 3 && !r.flexOffer.split(',').includes('fireball') && r.afterFlex === 'flexA,guard,main' && r.flexGem === r.flexPick && r.shrineGone, `gems: the Flex shrine offers 3 gems you don't own and picking one fills the slot (offered ${r.flexOffer})`);
    check(r.barXp > 0 && r.bagXp > 0 && Math.abs(r.bagXp - r.barXp * .1) < 1, `gems: kills give bar gems XP and bag gems 10% (${r.barXp} / ${r.bagXp})`);
    check(r.pierceGain === 1, `gems: Fireball's level 5 milestone pierces 1 more enemy (+${r.pierceGain})`);
    check(r.saved && r.loaded, 'gems: saves round-trip the skill bar and the gem bag');
    check(r.oldSave, 'gems: an old save without gems gets Magic Shield and the Main shrine');
    check(errors.length === 0, `gems: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Gems v2: support gems and sockets, gem drops, feeding (step 3) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, out = {};
      D.start(true); P.shrined.guard = 1; D.takeShrine('main', 'fireball'); document.getElementById('mShrine').classList.remove('show');
      P.lvl = 5; P.shrined.flexA = 1; D.recalc();
      const fb = P.gems.find(g => g.id === P.bar.main), arc = D.addGem('arc'); D.placeGem(arc.id, 'flexA');
      out.socks = [D.sockCount('main'), D.sockCount('flexA'), D.sockCount('flexB'), D.sockCount('main', 15)].join(',');
      const base = { proj: S.sk.fireball.proj, chains: S.sk.arc.chains, pierce: S.sk.fireball.pierce };
      // Twin Flame fits Fireball, not Arc; socketed with Fireball it changes Fireball only.
      const tw = D.addGem('twin');
      out.twinOnArc = D.socketGem(tw.id, 'flexA');
      out.twinOnFb = D.socketGem(tw.id, 'main');
      out.afterTwin = { proj: S.sk.fireball.proj - base.proj, chains: S.sk.arc.chains - base.chains };
      const fk = D.addGem('forked'); out.forkedOnFb = D.socketGem(fk.id, 'main'); out.forkedOnArc = D.socketGem(fk.id, 'flexA');
      out.afterForked = { proj: S.sk.fireball.proj - base.proj, chains: S.sk.arc.chains - base.chains, pierce: S.sk.fireball.pierce - base.pierce };
      // The real cast: two fireballs leave the staff.
      G.proj.length = 0; D.castFireball(); out.shots = G.proj.length;
      // Socketed supports earn full XP, like the gem they support.
      const x0 = { fb: fb.xp, tw: tw.xp };
      D.kill({ deathT: 0, x: P.x, z: P.z, xp: 30, rar: 0, type: 'zombie', aff: [], freeze: 0, h: 1, model: { g: {} } });
      out.supXp = tw.xp - x0.tw === fb.xp - x0.fb && tw.xp > x0.tw;
      // Saves round-trip the sockets.
      D.save(); const sv = D.load(); out.savedSock = sv.sock && sv.sock.main[0] === tw.id && sv.sock.flexA[0] === fk.id;
      D.begin(false); document.getElementById('mShrine').classList.remove('show');
      out.loaded = S.sk.fireball.proj === base.proj + 1 && S.sk.arc.chains === base.chains + 2;
      // Old saves: notable passives that became supports give the points back and the gem (once).
      const old = D.load(); old.passives = { multi: 2, inferno: 1, pyre: 1 }; old.pts = 0; localStorage.setItem('wd-arpg-1', JSON.stringify(old));
      D.begin(false); document.getElementById('mShrine').classList.remove('show');
      out.refund = P.pts === 3 && P.passives.pyre === 1 && !P.passives.multi && P.gems.filter(g => g.gem === 'twin').length === 1 && P.gems.some(g => g.gem === 'chainboom');
      out.noNotables = !['multi', 'pierce', 'chain', 'ward', 'ignite', 'shatter', 'conduit', 'inferno'].some(k => D.PASS[k]);
      // A guardian always drops a gem; walking over it puts it in the gem bag.
      const n0 = P.gems.length, boss = D.spawnEnemy('boss', P.x + 3, P.z, null, 0); D.kill(boss);
      const gd = G.ground.find(d => d.gem); out.bossGem = !!gd && (gd.gem.lvl >= 1);
      D.sim(40); if (gd) { P.x = gd.x; P.z = gd.z; D.sim(2); }
      out.pickedGem = P.gems.length === n0 + 1 && P.newGems > 0 && gd && P.gems[P.gems.length - 1].gem === gd.gem.gem;
      // Feeding: a duplicate goes in at 100% and is used up; your last copy of a gem stays behind at level 1.
      const bar = P.gems.find(g => g.id === P.bar.flexA), tot = g => { let n = g.xp; for (let l = 1; l < g.lvl; l++) n += 40 * Math.pow(l, 1.55) | 0; return n; };
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
        const gem = def.for[0], slot = D.GEMS[gem].kind === 'guard' ? 'guard' : D.GEMS[gem].kind === 'evade' ? 'evade' : 'flexB';
        const g = D.addGem(gem, 3), sg = D.addGem(sup); D.placeGem(g.id, slot);
        if (!D.socketGem(sg.id, slot) || !D.S.sk[gem].sup.includes(sup)) { bad.push(sup + ':socket'); continue; }
        const k = S.sk[gem]; if ({ split: !k.split, volley: !k.volley, twinmeteor: !k.twin, lingering: k.dur !== 1.5, quickstep: k.ch !== 1, army: k.army !== 1 }[sup]) bad.push(sup + ':stats');
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
    check(!r.twinOnArc && r.twinOnFb && r.afterTwin.proj === 1 && r.afterTwin.chains === 0, `gems v2: Twin Flame only fits Fireball and adds a projectile to it alone (${JSON.stringify(r.afterTwin)})`);
    check(!r.forkedOnFb && r.forkedOnArc && r.afterForked.chains === 2 && r.afterForked.proj === 1 && r.afterForked.pierce === 0, `gems v2: Forked Sky in Flex A changes Arc only (${JSON.stringify(r.afterForked)})`);
    check(r.shots === 2, `gems v2: a Fireball with Twin Flame fires 2 projectiles (${r.shots})`);
    check(r.supXp, 'gems v2: a socketed support earns the same XP as its skill gem');
    check(r.savedSock && r.loaded, 'gems v2: supports and sockets round-trip through saves');
    check(r.refund && r.noNotables, 'gems v2: old notable passives are gone from the cards; old saves get the points back and the support gems');
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
      D.start(true); D.takeShrine('main', 'fireball'); document.getElementById('mShrine').classList.remove('show');
      // Frost Ward shrine: appears at level 3, takes Ward into the bag, Magic Shield stays in Guard.
      out.noShrineEarly = !D.shrineDue().includes('guard');
      P.lvl = 3; D.recalc(); out.due = D.shrineDue().includes('guard');
      const w = D.takeShrine('guard', 'ward');
      out.wardInBag = !!w && P.gems.find(g => g.id === P.bar.guard).gem === 'shield' && !D.shrineDue().includes('guard');
      D.placeGem(w.id, 'guard'); out.wardSlotted = P.gems.find(g => g.id === P.bar.guard).gem === 'ward';
      // Evade slot (level 8): offered Flame Dash and Blink.
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
      // Frost Ward: chills and damages a monster inside, not one far away, and cuts damage taken.
      clear(); P.x = G.start.x; P.z = G.start.z;
      const a = D.spawnEnemy('zombie', P.x + 2, P.z, null, 0), b = D.spawnEnemy('zombie', P.x + 9, P.z, null, 0); a.awake = b.awake = true; a.hp = a.maxHp = b.hp = b.maxHp = 1e6; a.spd = b.spd = 0; // held in place, so only the radius decides
      const life0 = P.life; D.CAST.ward(); D.sim(30);
      out.wardChill = a.chill > 0 && !(b.chill > 0); out.chills = [a.chill, b.chill].map(c => Math.round((c || 0) * 100) / 100); out.wardDmg = a.hp < 1e6 && b.hp === 1e6;
      P.invuln = 0; const h0 = P.life; D.hurtP(100); out.wardDr = Math.abs((h0 - P.life) - 100 * (1 - S.dr) * .7) < .5;
      D.sim(200); out.wardEnds = !(P.wardT > 0);
      clear();
      return out;
    });
    console.log('  skills D:', JSON.stringify(r));
    check(r.noShrineEarly && r.due && r.wardInBag && r.wardSlotted, `skills D: Frost Ward shrine at level 3 gives Ward to the bag, swappable into Guard`);
    check(r.evadeOffer.split(',').sort().join() === 'blink,dash', `skills D: the Evade shrine offers Flame Dash and Blink (${r.evadeOffer})`);
    check(r.blinked && r.blinkAway && r.blinkClear, `skills D: Blink moves the player away from a nearby monster, with invulnerability`);
    check(r.wallBad === 0 && r.wallMoved > 5, `skills D: Blink never lands in a wall (${r.wallBad} bad of ${r.wallMoved})`);
    check(r.wardChill && r.wardDmg && r.wardDr && r.wardEnds, `skills D: Frost Ward chills and damages monsters inside only, cuts damage taken, and ends (${JSON.stringify(r)})`);
    check(errors.length === 0, `skills D: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Flame Totem and Meteor (Flex gems): damage, milestone, cleanup on map clear ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, ctl = D.ctl, out = {};
      D.start(true); D.takeShrine('main', 'fireball'); document.getElementById('mShrine').classList.remove('show');
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

  // ---------- Skill gems: Frost Lance (package A) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, out = {};
      D.start(true); D.takeShrine('main', 'fireball'); document.getElementById('mShrine').classList.remove('show');
      const gem = D.addGem('frostlance'); D.placeGem(gem.id, 'main');
      out.onBar = P.gems.find(g => g.id === P.bar.main).gem;
      // Find a direction with 14 clear units in front of the hero, line monsters up along it.
      let dir = [0, 1]; for (const d of [[0, 1], [1, 0], [0, -1], [-1, 0], [.7, .7], [-.7, .7], [.7, -.7], [-.7, -.7]]) { let ok = true; for (let t = 1; t < 15; t += .5) if (D.blocked(P.x + d[0] * t, P.z + d[1] * t, .5)) ok = false; if (ok) { dir = d; break; } }
      const line = () => { G.enemies.length = 0; const es = []; for (let i = 0; i < 7; i++) { const e = D.spawnEnemy('zombie', P.x + dir[0] * (4 + i * 1.2), P.z + dir[1] * (4 + i * 1.2), null, 0); e.hp = e.maxHp = 1e6; es.push(e); } D.ctl.aim = [P.x + dir[0] * 10, P.z + dir[1] * 10]; D.sim(1); return es; };
      const fire = () => { const ok = D.cast('frostlance'); out.cast = out.cast || ok; D.sim(30); };
      let es = line(); fire();
      out.hit = es.filter(e => e.hp < e.maxHp).length; out.chilled = es.filter(e => e.chill > 0 || e.hp < e.maxHp).length;
      gem.lvl = 5; D.recalc(); es = line(); fire(); out.hit5 = es.filter(e => e.hp < e.maxHp).length;
      D.ctl.aim = null; return out;
    });
    console.log('  frostlance:', JSON.stringify(r));
    check(r.onBar === 'frostlance' && r.cast, 'frostlance: goes on the Main slot and casts');
    check(r.hit >= 3 && r.hit <= 5, `frostlance: pierces a line of monsters but not all of them (${r.hit} of 7 hit)`);
    check(r.hit5 === r.hit + 2, `frostlance: level 5 pierces 2 more (${r.hit5})`);
    check(errors.length === 0, `frostlance: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Raise Skeletons: the minion Main gem (src/game/sk/skeletons.js) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, G = D.G, out = {};
      D.start(true); D.takeShrine('main', 'skeletons'); document.getElementById('mShrine').classList.remove('show');
      D.arena({ tier: 1, fight: [], maxT: .1, main: 'skeletons' }); // an open floor with no monsters
      const sk = () => D.minions().filter(m => !m.deathT).length;
      out.cap = D.skel.cap();
      for (let i = 0; i < 8; i++) { D.ctl.tap.main = true; D.sim(12); }
      out.raised = sk(); out.capped = out.raised === out.cap;
      { const before = D.minions().filter(m => !m.deathT); D.ctl.tap.main = true; D.sim(1); const after = D.minions().filter(m => !m.deathT); out.kept = after.length === out.cap && before.every(m => after.includes(m)); } // at the cap with a healthy army a recast does nothing
      // A zombie walks in: the skeletons kill it, and the kill counts for the player.
      const k0 = P.kills, z = D.spawnEnemy('zombie', P.x + 5, P.z, null, 0); z.awake = true;
      let t = 0; while (!z.deathT && t < 900) { D.sim(10); t += 10; }
      out.killed = !!z.deathT; out.killT = Math.round(t * .033 * 10) / 10; out.kills = P.kills - k0;
      out.hurtOne = D.minions().some(m => m.hp < m.maxHp); // it swung at a skeleton before dying
      out.rigged = D.minions().every(m => m.model.rigged === D.chars.ready);
      D.newMap(1); out.cleared = D.minions().length === 0;
      return out;
    });
    console.log('  skeletons:', JSON.stringify(r));
    check(r.cap === 3 && r.capped, `skeletons: raising respects the cap (${r.raised} of ${r.cap})`);
    check(r.kept, 'skeletons: recasting with a full, healthy army replaces nobody');
    check(r.killed && r.kills === 1, `skeletons: minions kill a monster on their own and the kill counts (${r.killT}s)`);
    check(r.hurtOne, 'skeletons: monsters in reach attack the minions');
    check(r.rigged, 'skeletons: minions use the rigged skeleton when characters loaded');
    check(r.cleared, 'skeletons: minions are cleared with the map');
    check(errors.length === 0, `skeletons: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- No mana; the Surge gauge (data/skills.js SURGE, game/update.js updSurge) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, ctl = D.ctl, out = {};
      D.start(true); D.takeShrine('main', 'fireball'); document.getElementById('mShrine').classList.remove('show');
      out.noMana = P.mana === undefined && S.maxMana === undefined && !D.SK.fireball.cost && !document.getElementById('manaF');
      D.arena({ tier: 1, fight: [], maxT: .1 }); // an open floor with no monsters
      const z = D.spawnEnemy('zombie', P.x + 6, P.z, null, 0); z.hp = z.maxHp = 1e9; z.spd = 0; ctl.aim = [z.x, z.z];
      // Fireballs held for 6 s, without and with Surge: no mana means the plain rate never stops, Surge is faster.
      const casts = surge => { P.surge = S.surgeMax; P.spent = false; P.surgeWait = 0; ctl.surge = surge; const c = P.castSeq; ctl.main = true; D.sim(180); ctl.main = false; ctl.surge = false; return P.castSeq - c; };
      out.plain = casts(false); out.surged = casts(true);
      out.drained = Math.round((S.surgeMax - P.surge) * 10) / 10; // about 6 s used
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
      // An old save: mana affixes go (a ring's mana implicit becomes life), Blood Magic's point comes back.
      localStorage.setItem('wd-arpg-1', JSON.stringify({ lvl: 3, xp: 0, pts: 0, tier: 1, inv: [], passives: { blood: 1, pyre: 1 },
        gear: { ring: { slot: 'ring', rar: 1, base: 'Iron Ring', name: 'Old Ring', il: 1, mods: [['manaF', 14], ['mregen', 2], ['crit', .03]] } } }));
      D.start(false); document.getElementById('mShrine').classList.remove('show');
      out.oldRing = JSON.stringify(P.gear.ring.mods); out.oldPts = P.pts; out.oldPass = Object.keys(P.passives).join();
      return out;
    });
    console.log('  surge:', JSON.stringify(r));
    check(r.oldRing === '[["lifeF",10],["crit",0.03]]' && r.oldPts === 1 && r.oldPass === 'pyre', `surge: old saves lose mana affixes and get Blood Magic's point back (${r.oldRing}, ${r.oldPts} pt)`);
    check(r.noMana, 'surge: there is no mana (no pool, no costs, no orb)');
    check(r.plain >= 7, `surge: held Fireball never runs dry (${r.plain} casts in 6 s)`);
    check(r.surged >= r.plain * 1.25, `surge: surging casts faster (${r.surged} vs ${r.plain})`);
    check(r.drained > 5 && r.drained < 7, `surge: the gauge drains about 1 s per second (${r.drained})`);
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
      D.setRide(true); D.start(true); D.takeShrine('main', 'fireball'); document.getElementById('mShrine').classList.remove('show');
      // Not pedalling: the hero must not move even with the D-pad held.
      D.ride.pw = 0; D.ride.held.right = true; const x0 = P.x; D.sim(60); out.stillAt0W = Math.abs(P.x - x0) < .01;
      D.ride.held.right = false;
      // Pedalling at ~80% FTP with autopilot on and A (Fireball) held: the hero should go and clear packs alone.
      D.ride.pw = 200; D.ctl.auto = true; D.ctl.main = true;
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

// Headless playtest. Builds nothing itself: run `npm run build` first. Serves dist/, then:
//   1. ARPG (/): the level flow (beats, ambush, survival, death, guardian, portal), loot, equipment and passives.
//   2. Pedal demo (/pedal/): two 12-minute simulated rides, as before.
//   3. Asset gallery (/gallery/): every character, animation set and model pack loads and shows.
// Usage: npm test  (needs Chrome; set CHROME_PATH if not found; SEED=n changes the fixed random seed). SCREENSHOT=/tmp/shot.png saves an ARPG mid-fight shot
// (and /tmp/shot-gallery-*.png, gallery views).
import { preview } from 'vite';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chrome) { console.error('No Chrome found. Set CHROME_PATH.'); process.exit(1); }

const PORT = Number(process.env.PORT) || 4173; // set PORT to run two test suites at once
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
  await page.goto(`http://localhost:${PORT}` + path, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__gal || (window.__dbg && (!window.__dbg.ready || window.__dbg.ready())), { timeout: 20000 });
  return { page, errors };
}

try {
  // ---------- ARPG ----------
  {
    const { page, errors } = await open('/');
    // Test helpers, living in the page. slay() stands in for the skills: it damages nearby monsters through combat.hit,
    // so this block doesn't depend on the skill API. tick() also keeps the hero alive (death has its own checks).
    await page.evaluate(() => {
      const D = window.__dbg, P = D.P;
      window.T = {
        slay(r = 12) { for (const e of D.enemies()) if (!e.deathT && e.ai !== 'boss' && Math.hypot(e.x - P.x, e.z - P.z) < r) D.hit(e, 8, 'fire'); },
        tick(n, slay = true) { for (let i = 0; i < n; i++) { if (slay) this.slay(); P.life = D.S.maxLife; D.sim(1); } },
        loot: () => P.inv.length + D.items().length,
        // Run beat i from its trigger to done, recording the states it passes through and what the banner said at the signal.
        run(i, opts = {}) {
          const b = D.startBeat(i), seq = [b.state], r = { loot0: this.loot() };
          for (let n = 0; n < (opts.max || 4000) && b.state !== 'done'; n++) {
            this.tick(1, opts.slay !== false);
            if (b.state !== seq[seq.length - 1]) seq.push(b.state);
            if (b.state === 'signal' && !r.banner) r.banner = document.getElementById('bT').textContent;
            if (opts.each) opts.each(b, n);
          }
          r.seq = seq.join('>'); r.type = b.type; r.state = b.state; r.signalFirst = b.signalT !== undefined && b.activeT !== undefined && b.signalT < b.activeT; r.lootGain = this.loot() - r.loot0;
          r.leftovers = D.enemies().filter(e => e.beat === b && !e.deathT).length;
          return r;
        },
      };
    });

    // 1. Structure of a fresh level, and the scripted player walking its route with levelGoal().
    const r1 = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, G = D.G, T = window.T, out = {};
      D.start(true);
      const L = D.level();
      out.slots = L.beats.map(b => b.slot).join(','); out.types = L.beats.map(b => b.type);
      out.name = L.name; out.packs = D.packs().length; out.depth = G.depth;
      const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
      // The beats run in order along the route: each one sits further along it than the one before.
      const idxs = L.route.map((p, k) => p.beat ? k : -1).filter(k => k >= 0);
      out.routeOrdered = idxs.length === L.beats.length && idxs.every((k, n) => L.route[k].beat === L.beats[n]);
      out.guardSpot = dist(L.beats[L.beats.length - 1], G.bossSpot) < .01;
      out.sitesClear = L.beats.every(b => G.obst.every(o => dist(o, b) > o.r + .8)) && G.obst.every(o => dist(o, G.start) > o.r + 2);
      out.routeDist = L.route.reduce((a, p, k) => k ? a + dist(p, L.route[k - 1]) : 0, 0);
      out.noPacksNearBreather = D.packs().every(p => dist(p, L.beats.find(b => b.type === 'breather')) > 12);
      out.goal0 = D.levelGoal();
      // Genuine play: the autopilot follows levelGoal() through the warm-up packs to the first beat and plays it out.
      D.ctl.auto = true; out.kinds = []; out.seen = [];
      const b0 = L.beats[0];
      for (let n = 0; n < 700 && b0.state !== 'done'; n++) {
        const g = D.levelGoal(); if (g && !out.kinds.includes(g.kind)) out.kinds.push(g.kind);
        if (!out.seen.length) out.seen.push(b0.state);
        for (let k = 0; k < 6; k++) { T.tick(1); if (out.seen[out.seen.length - 1] !== b0.state) out.seen.push(b0.state); }
      } D.ctl.auto = false; D.ctl.mx = D.ctl.mz = 0;
      out.b0 = b0.type; out.i = L.i; out.kills = P.kills; out.moved = dist(P, G.start);
      out.rigged = D.chars.ready && G.heroM.rigged && D.enemies().some(e => e.model.rigged);
      out.dressed = G.dressed && G.obst.length > 40 && G.torches.length > 10;
      out.signalFirst = b0.signalT < b0.activeT;
      return out;
    });
    console.log('  arpg level:', JSON.stringify({ ...r1, routeDist: Math.round(r1.routeDist) }));
    const ALLOWED = { small: ['treasure', 'gamble'], elite: ['elite'], breather: ['breather'], ambush: ['ambush'], big: ['survival', 'doubleElite'], release: ['release'], guardian: ['guardian'] };
    const slotOrder = Object.keys(ALLOWED);
    check(r1.name === 'Crypt Halls' && r1.depth === 1, `arpg: one level, Crypt Halls at depth 1`);
    check(r1.slots === slotOrder.join(',') && r1.types.every((t, k) => ALLOWED[slotOrder[k]].includes(t)), `arpg: full beat sequence in order (${r1.types.join(' > ')})`);
    check(r1.routeOrdered && r1.guardSpot, 'arpg: beats sit in order along the route and the guardian holds the arena');
    check(r1.sitesClear, 'arpg: no obstacles on the beat sites or the entrance');
    check(r1.routeDist > 90 && r1.packs >= 8 && r1.noPacksNearBreather, `arpg: a long route with packs along it (${Math.round(r1.routeDist)} units, ${r1.packs} packs), none near the breather`);
    check(r1.goal0 && r1.goal0.kind === 'pack', `arpg: levelGoal starts with the warm-up packs (${r1.goal0 && r1.goal0.kind})`);
    check(r1.kinds.includes('pack') && r1.kinds.includes('beat') && r1.seen.join('>') === 'idle>signal>active>done', `arpg: the autopilot walked levelGoal through packs to beat 1 (${r1.b0}: ${r1.seen.join('>')})`);
    check(r1.signalFirst && r1.i === 1, 'arpg: beat 1 showed its signal before going active, and the level moved on to beat 2');
    check(r1.rigged, 'arpg: KayKit character models loaded for hero and monsters');
    check(r1.dressed, 'arpg: map built from the KayKit dungeon pieces');
    check(r1.kills > 12, `arpg: warm-up packs and beat 1 were fought (${r1.kills} kills)`);

    // 2. The short beats: idle > signal > active > done, with a banner, a payoff and a checkpoint.
    const MINLOOT = { treasure: 3, gamble: 3, elite: 2, breather: 0, doubleElite: 3, release: 3 };
    const r2 = await page.evaluate(() => {
      const D = window.__dbg, T = window.T, G = D.G, out = [];
      for (let i = 0; i < 7; i++) {
        const b = D.level().beats[i];
        if (['ambush', 'survival', 'guardian'].includes(b.type)) continue; // checked on their own below
        const r = T.run(i); r.checkpoint = Math.hypot(G.level.cp.x - b.x, G.level.cp.z - b.z) < .1; out.push(r);
      }
      return out;
    });
    for (const r of r2) {
      check(r.seq === 'idle>signal>active>done' && r.signalFirst, `arpg: ${r.type}: ${r.seq}, signal shown first (banner "${r.banner}")`);
      check(r.banner && r.banner.length > 3 && r.checkpoint && r.leftovers === 0 && r.lootGain >= (MINLOOT[r.type] ?? 0), `arpg: ${r.type}: banner, payoff (${r.lootGain} items) and checkpoint`);
    }

    // 3. Ambush: seals the room, holds the hero in the ring, unseals when the waves are dead.
    const r3 = await page.evaluate(i => {
      const D = window.__dbg, P = D.P, T = window.T, out = { escapes: 0, checks: 0 };
      const b = D.level().beats[i];
      const r = T.run(i, { each(b, n) {
        if (b.state === 'active' && n % 7 === 0) {
          out.sealed = out.sealed || !!b.wall;
          P.x = b.x + 40; P.z = b.z + 40; D.sim(1); // try to leave: jump far outside the ring
          out.checks++; if (Math.hypot(P.x - b.x, P.z - b.z) > 9) out.escapes++;
          out.maxWave = Math.max(out.maxWave || 0, b.wave);
        }
      } });
      out.run = r; out.unsealed = !b.wall; out.waves = b.waves;
      return out;
    }, slotOrder.indexOf('ambush'));
    console.log('  ambush:', JSON.stringify(r3));
    check(r3.run.seq === 'idle>signal>active>done' && r3.sealed && r3.checks > 5, `arpg: ambush seals the room (${r3.run.seq}, ${r3.checks} escape attempts)`);
    check(r3.escapes === 0, `arpg: the hero can't leave the ambush ring while it's active (${r3.escapes} escapes)`);
    check(r3.maxWave === r3.waves && r3.waves >= 2 && r3.unsealed && r3.run.leftovers === 0 && r3.run.lootGain >= 3, `arpg: ambush sends ${r3.waves} waves, then unseals and pays out`);

    // 4. Survival: reroll the big slot until it is one.
    const r4 = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, T = window.T, out = {};
      let b = D.level().beats[4];
      for (let k = 0; k < 40 && b.type !== 'survival'; k++) { D.newLevel(); b = D.level().beats[4]; }
      out.type = b.type;
      if (b.type !== 'survival') return out;
      D.startBeat(4);
      let n = 0; while (b.state !== 'active' && n++ < 300) T.tick(1);
      out.timer0 = b.timer; D.hud(); out.hud = document.getElementById('surv').style.display;
      // leaving the circle pauses the timer
      const t1 = b.timer; for (let k = 0; k < 40; k++) { P.x = b.x + 15; P.z = b.z; T.tick(1, false); }
      D.hud(); out.paused = Math.abs(b.timer - t1) < .001; out.pausedHud = document.getElementById('surv').textContent;
      let ticks = 0, prev = b.timer, mono = true, maxAlive = 0;
      while (b.state === 'active' && ticks < 4000) { P.x = b.x; P.z = b.z; T.tick(1); ticks++; if (b.timer > prev) mono = false; prev = b.timer; maxAlive = Math.max(maxAlive, D.enemies().filter(e => e.beat === b && !e.deathT).length); }
      out.ticks = ticks; out.state = b.state; out.timer = b.timer; out.mono = mono; out.maxAlive = maxAlive; out.secs = ticks * .033;
      D.hud(); out.hudAfter = document.getElementById('surv').style.display; out.leftovers = D.enemies().filter(e => e.beat === b && !e.deathT).length;
      return out;
    });
    console.log('  survival:', JSON.stringify(r4));
    check(r4.type === 'survival', 'arpg: a survival beat can be rolled for the big slot');
    check(r4.paused && /RETURN/.test(r4.pausedHud || ''), 'arpg: leaving the survival circle pauses the timer');
    check(r4.hud === 'flex' && r4.timer0 > 60 && r4.state === 'done' && r4.timer === 0 && r4.mono && r4.hudAfter === 'none', `arpg: survival countdown ran to zero (${r4.timer0} s timer, ${(r4.secs || 0).toFixed(0)} s played inside, up to ${r4.maxAlive} at once)`);
    check(r4.secs > r4.timer0 - 2 && r4.secs < r4.timer0 + 3 && r4.leftovers === 0, 'arpg: the timer counts real time inside the circle and the horde collapses at the end');

    // 5. Death: back to the last checkpoint; a beat in progress resets to idle; the guardian returns to full health.
    const r5 = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, T = window.T, out = {};
      D.newLevel(); const L = D.level();
      T.run(0); const cp = { ...L.cp };
      D.startBeat(1); let n = 0; while (L.beats[1].state !== 'active' && n++ < 300) T.tick(1, false);
      out.mobs = D.enemies().filter(e => e.beat === L.beats[1] && !e.deathT).length;
      D.hurt(1e6); D.sim(100);
      out.at = Math.hypot(P.x - cp.x, P.z - cp.z) < .1; out.alive = P.life > 0 && P.dead <= 0;
      out.state = L.beats[1].state; out.left = D.enemies().filter(e => e.beat === L.beats[1]).length; out.i = L.i;
      D.startBeat(6); n = 0; while (!D.enemies().some(e => e.guardian) && n++ < 400) T.tick(1, false);
      const g = D.enemies().find(e => e.guardian); out.g0 = !!g;
      if (g) {
        D.hit(g, 5, 'fire'); out.hurt = g.hp < g.maxHp; D.hurt(1e6); D.sim(100); out.gState = L.beats[6].state; out.gLeft = D.enemies().filter(e => e.guardian).length;
        D.startBeat(6); n = 0; while (!D.enemies().some(e => e.guardian) && n++ < 400) T.tick(1, false);
        const g2 = D.enemies().find(e => e.guardian); out.gFull = !!g2 && g2.hp === g2.maxHp;
      }
      return out;
    });
    console.log('  death:', JSON.stringify(r5));
    check(r5.mobs > 0 && r5.at && r5.alive, 'arpg: dying mid-beat respawns the hero at the last completed beat');
    check(r5.state === 'idle' && r5.left === 0 && r5.i === 1, 'arpg: the beat in progress reset to idle and its monsters despawned');
    check(r5.g0 && r5.hurt && r5.gState === 'idle' && r5.gLeft === 0 && r5.gFull, 'arpg: dying to the guardian resets it to full health');

    // 6. Guardian: wakes with a banner and its bar, uses abilities; its death clears the level and opens the portal.
    const r6 = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, T = window.T, G = D.G, out = {};
      D.newLevel(0); const L = D.level();
      const b = L.beats[6]; D.startBeat(6);
      let n = 0; while (!D.enemies().some(e => e.guardian && e.awake) && n++ < 400) T.tick(1, false);
      const g = D.enemies().find(e => e.guardian); out.spawned = !!g && g.type === 'guardian' && g.guardian === true;
      out.signalBanner = b.banner; out.wakeBanner = document.getElementById('bT').textContent;
      D.sim(3); D.hud(); out.bar = document.getElementById('bossbar').style.display; out.barName = document.getElementById('bossName').textContent;
      out.scale = g.look && g.scale; out.hp = g.maxHp;
      for (let k = 0; k < 600 && !(g.rot > 1); k++) T.tick(1, false);
      out.ability = g.rot > 0;
      const loot0 = T.loot(); D.kill(g); D.sim(5); D.hud();
      out.cleared = L.cleared; out.portal = !!G.portal; out.banner = document.getElementById('bT').textContent; out.loot = T.loot() - loot0;
      out.barAfter = document.getElementById('bossbar').style.display; out.clears0 = L.clears; out.i = L.i;
      const sig = L.beats.map(b => b.x.toFixed(1) + ',' + b.z.toFixed(1)).join('|');
      P.x = G.portal.x; P.z = G.portal.z; D.sim(3);
      const L2 = D.level(); out.newLevel = L2 !== L && !L2.cleared && !G.portal; out.clears1 = L2.clears;
      out.rhythm = L2.beats.map(b => b.slot).join(',') === L.beats.map(b => b.slot).join(',');
      out.differs = L2.beats.map(b => b.x.toFixed(1) + ',' + b.z.toFixed(1)).join('|') !== sig;
      out.atStart = Math.hypot(P.x - G.start.x, P.z - G.start.z) < .1;
      return out;
    });
    console.log('  guardian:', JSON.stringify(r6));
    check(r6.spawned && r6.hp < 600, `arpg: the guardian is a smaller, weaker boss (${r6.hp} hp)`);
    check(/GUARDIAN/.test(r6.signalBanner) && /OSSRIC/.test(r6.wakeBanner) && r6.bar === 'block' && /OSSRIC/.test(r6.barName), `arpg: guardian signals, then wakes with a banner and its bar ("${r6.wakeBanner}")`);
    check(r6.ability, 'arpg: guardian used its abilities');
    check(r6.cleared && r6.portal && r6.i === 7 && r6.banner === 'LEVEL CLEARED' && r6.loot >= 5 && r6.barAfter === 'none', `arpg: guardian death clears the level, drops loot (${r6.loot}) and opens the portal`);
    check(r6.newLevel && r6.clears0 === 0 && r6.clears1 === 1 && r6.atStart, 'arpg: taking the portal rerolls a fresh Crypt Halls with clears === 1');
    check(r6.rhythm && r6.differs, 'arpg: the new level has a different layout with the same beat rhythm');

    // 7. A batch of levels: every one keeps the rhythm, differs from the others and keeps sites and packs clear of rocks.
    const r7 = await page.evaluate(() => {
      const D = window.__dbg, G = D.G, out = { sigs: [], slots: new Set(), bad: [], types: {} };
      const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
      for (let k = 0; k < 8; k++) {
        const L = D.newLevel(0);
        out.sigs.push(L.beats.map(b => b.x.toFixed(0) + b.z.toFixed(0)).join('')); out.slots.add(L.beats.map(b => b.slot).join(','));
        L.beats.forEach(b => { out.types[b.type] = (out.types[b.type] || 0) + 1; if (G.obst.some(o => dist(o, b) < o.r + .8)) out.bad.push('obstacle on ' + b.type); });
        if (G.obst.some(o => dist(o, G.start) < o.r + 2 || dist(o, G.bossSpot) < o.r + 2)) out.bad.push('obstacle on start/guardian');
        if (!D.packs().length || D.packs().some(p => G.obst.some(o => dist(o, p) < o.r + 1))) out.bad.push('pack in rock');
      }
      out.distinct = new Set(out.sigs).size; out.slots = out.slots.size; delete out.sigs; return out;
    });
    console.log('  levels:', JSON.stringify(r7));
    check(r7.distinct === 8 && r7.slots === 1 && r7.bad.length === 0, `arpg: 8 more levels all differ, keep one rhythm, sites and packs clear (${r7.bad.join(', ') || 'ok'})`);
    check(Object.keys(r7.types).length >= 6, `arpg: random slot picks vary (${JSON.stringify(r7.types)})`);

    // 8. Loot, equipment and passives.
    const r8 = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, T = window.T, out = {};
      D.newLevel(0); D.ctl.auto = true; T.tick(900); D.ctl.auto = false; D.ctl.mx = D.ctl.mz = 0;
      out.kills = P.kills; out.loot = P.inv.length + D.items().length;
      for (let i = 0; i < 4; i++) D.dropItem(P.x, P.z, .5);
      D.sim(40); out.inv = P.inv.length;
      const before = JSON.stringify(P.gear); D.equip(0); out.equipped = JSON.stringify(P.gear) !== before;
      P.pts = 1; D.openPass(); out.cards = document.querySelectorAll('.pc').length; document.querySelector('.pc').click();
      out.passives = Object.keys(P.passives).length;
      document.getElementById('passClose').click();
      return out;
    });
    check(r8.loot > 0, `arpg: monsters dropped loot (${r8.loot})`);
    check(r8.inv >= 4, `arpg: loot picked up into the bag (${r8.inv})`);
    check(r8.equipped, 'arpg: equipping an item changes gear');
    check(r8.cards === 3 && r8.passives >= 1, `arpg: passive offer shows 3 cards and allocates`);
    const lvl = await page.evaluate(() => window.__dbg.P.lvl);
    check(lvl >= 3, `arpg: player levelled up (level ${lvl})`);
    if (process.env.SCREENSHOT) {
      // The ambush ring mid-fight.
      await page.evaluate(() => { const D = window.__dbg; D.newLevel(0); D.startBeat(3); window.T.tick(160, false); });
      await new Promise(r => setTimeout(r, 300)); await page.screenshot({ path: process.env.SCREENSHOT });
    }
    check(errors.length === 0, `arpg: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
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
      for (let i = 0; i < 60; i++) {
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

// Headless playtest. Builds nothing itself: run `npm run build` first. Serves dist/, then:
//   1. ARPG (/): the level flow (beats, ambush, survival, death, guardian, portal), loot, equipment and passives.
//   2. Full level run: from newLevel() the autopilot (ctl.auto, KEYS mode) follows levelGoal() with Main auto-attacking, through every
//      beat to the guardian kill, the clear and the open portal; records the order the beats finish in and the simulated minutes.
//   3. ARPG in RIDE mode: 0 W stops the hero, endurance gives the base attack rate, Surge drains and refills, autopilot clears packs.
//   4. Skill bar (Main auto-attack, cooldowns, Ward, Blink) and 5. gems (AP, levels, Fireball milestones, save/load, HUD badges).
//   6. Pedal demo (/pedal/): two 12-minute simulated rides, as before.   7. Asset gallery (/gallery/): every model and animation shows.
// Every block also asserts that the page raised no errors.
// Usage: npm test  (needs Chrome; set CHROME_PATH if not found; SEED=n changes the fixed random seed; PORT=n for parallel runs).
// SCREENSHOT=/tmp/x.png also saves x.png (ambush ring, kept for compatibility), x-mid.png (a pack fight on the route), x-beat.png (the sealed
// ambush with a wave), x-guardian.png (guardian fight and bar), x-ride.png (RIDE mode, surging, skill bar and Surge gauge), x-phone.png
// (390x844 touch viewport) and x-gallery-*.png (gallery views).
import { preview } from 'vite';
import puppeteer from 'puppeteer-core';
import { existsSync, readdirSync } from 'node:fs';

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
    check(r1.routeDist > 90 && r1.packs >= 9 && r1.noPacksNearBreather, `arpg: a long route with packs along it (${Math.round(r1.routeDist)} units, ${r1.packs} packs), none near the breather`);
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
      // Main auto-attacks now, so keep the guardian alive while we watch its rotation; the kill below is explicit.
      for (let k = 0; k < 600 && !(g.rot > 1); k++) { g.hp = g.maxHp; T.tick(1, false); }
      out.ability = g.rot > 0; out.aliveForKill = !g.deathT;
      const loot0 = T.loot(); D.kill(g); D.sim(5); D.hud();
      out.cleared = L.cleared; out.portal = !!G.portal; out.banner = document.getElementById('bT').textContent; out.loot = T.loot() - loot0;
      out.barAfter = document.getElementById('bossbar').style.display; out.clears0 = L.clears; out.i = L.i;
      const sig = L.beats.map(b => b.x.toFixed(1) + ',' + b.z.toFixed(1)).join('|');
      P.x = G.portal.x; P.z = G.portal.z; D.sim(3);
      out.wayOpen = document.getElementById('mWay').classList.contains('show') && G.paused; D.enterLevel(1); // the portal opens the waypoint screen; Crypt 1 again is a fresh level
      const L2 = D.level(); out.newLevel = L2 !== L && !L2.cleared && !G.portal; out.clears1 = L2.clears;
      out.rhythm = L2.beats.map(b => b.slot).join(',') === L.beats.map(b => b.slot).join(',');
      out.differs = L2.beats.map(b => b.x.toFixed(1) + ',' + b.z.toFixed(1)).join('|') !== sig;
      out.atStart = Math.hypot(P.x - G.start.x, P.z - G.start.z) < .1;
      return out;
    });
    console.log('  guardian:', JSON.stringify(r6));
    check(r6.spawned && r6.hp < 1500, `arpg: the guardian is a smaller, weaker boss (${r6.hp} hp)`);
    check(/GUARDIAN/.test(r6.signalBanner) && /OSSRIC/.test(r6.wakeBanner) && r6.bar === 'block' && /OSSRIC/.test(r6.barName), `arpg: guardian signals, then wakes with a banner and its bar ("${r6.wakeBanner}")`);
    check(r6.ability, 'arpg: guardian used its abilities');
    check(r6.cleared && r6.portal && r6.i === 7 && r6.banner === 'LEVEL CLEARED' && r6.loot >= 5 && r6.barAfter === 'none', `arpg: guardian death clears the level, drops loot (${r6.loot}) and opens the portal`);
    check(r6.wayOpen && r6.newLevel && r6.clears0 === 0 && r6.clears1 === 1 && r6.atStart, 'arpg: the portal opens the waypoint; entering Crypt 1 again rerolls a fresh Crypt Halls with clears === 1');
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
      P.pts = 1; D.openPass(); out.cards = document.querySelectorAll('#treeG .ring').length; D.treeAlloc('core1'); // the tree: nodes next to the start glow, then one is taken
      out.passives = Object.keys(P.tree).length;
      document.getElementById('passClose').click();
      return out;
    });
    check(r8.loot > 0, `arpg: monsters dropped loot (${r8.loot})`);
    check(r8.inv >= 4, `arpg: loot picked up into the bag (${r8.inv})`);
    check(r8.equipped, 'arpg: equipping an item changes gear');
    check(r8.cards >= 3 && r8.passives >= 1, `arpg: passive tree highlights the nodes next to the start and allocates one (${r8.cards})`);
    const lvl = await page.evaluate(() => window.__dbg.P.lvl);
    check(lvl >= 3, `arpg: player levelled up (level ${lvl})`);
    if (process.env.SCREENSHOT) {
      const base = process.env.SCREENSHOT.replace(/\.png$/, ''), shot = async suffix => { await new Promise(r => setTimeout(r, 700)); await page.screenshot({ path: suffix ? `${base}-${suffix}.png` : process.env.SCREENSHOT }); };
      // The real-time loop keeps running between shots, so keep the hero safe while the frame renders.
      const safe = () => page.evaluate(() => { const D = window.__dbg; D.P.invuln = 60; D.P.life = D.S.maxLife; });
      // Mid-level: the autopilot walks the route until a normal pack is on it, in a fight.
      await page.evaluate(() => {
        const D = window.__dbg, P = D.P, S = D.S; D.newLevel(0); D.ctl.auto = true;
        for (let n = 0; n < 3000; n++) { P.life = S.maxLife; D.sim(1); if (n > 150 && D.enemies().filter(e => !e.deathT && !e.beat && Math.hypot(e.x - P.x, e.z - P.z) < 9).length >= 3) break; }
        D.ctl.auto = false; D.ctl.mx = D.ctl.mz = 0; D.hud();
      });
      await safe(); await shot('mid');
      // A beat in progress: the sealed ambush ring with a wave.
      await page.evaluate(() => { const D = window.__dbg; D.newLevel(0); D.startBeat(3); window.T.tick(160, false); });
      await safe(); await shot(''); await shot('beat');
      // The guardian fight with its bar.
      await page.evaluate(() => { const D = window.__dbg; D.newLevel(0); D.startBeat(6); let n = 0; while (!D.enemies().some(e => e.guardian && e.awake) && n++ < 400) window.T.tick(1, false); D.sim(40); D.hud(); });
      await safe(); await shot('guardian');
      // Phone-sized viewport with touch (changing isMobile/hasTouch reloads the page, so start a game again; a pack fight, then a banner).
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      await page.waitForFunction(() => window.__dbg && window.__dbg.ready(), { timeout: 20000 });
      await page.evaluate(() => {
        const D = window.__dbg, P = D.P, S = D.S; D.start(true); D.newLevel(0); D.ctl.auto = true;
        for (let n = 0; n < 3000; n++) { P.life = S.maxLife; D.sim(1); if (n > 150 && D.enemies().filter(e => !e.deathT && !e.beat && Math.hypot(e.x - P.x, e.z - P.z) < 9).length >= 3) break; }
        D.ctl.auto = false; D.ctl.mx = D.ctl.mz = 0; D.hud();
      });
      await safe(); await shot('phone');
      await page.setViewport({ width: 1100, height: 700, isMobile: false, hasTouch: false });
    }
    check(errors.length === 0, `arpg: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Full level run: autopilot plays newLevel() through every beat to the guardian ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, out = { order: [], kinds: new Set() };
      D.start(true); D.newLevel(0); const L = D.level(); D.ctl.auto = true;
      const done = new Set(); let t = 0;
      // No help beyond keeping the hero alive (life topped up each tick); the level's own damage numbers are used as they are.
      for (; t < 40000 && !L.cleared; t++) {
        P.life = S.maxLife; D.sim(1);
        const g = D.levelGoal(); if (g) out.kinds.add(g.kind);
        for (const b of L.beats) if (b.state === 'done' && !done.has(b)) { done.add(b); out.order.push(b.type); }
      }
      D.ctl.auto = false; D.sim(5);
      out.template = L.beats.map(b => b.type); out.ticks = t; out.minutes = t * .033 / 60; out.cleared = L.cleared; out.portal = !!G.portal; out.kills = P.kills;
      out.kinds = [...out.kinds]; out.guardianDead = !D.enemies().some(e => e.guardian && !e.deathT);
      return out;
    });
    console.log('  full run:', JSON.stringify({ ...r, minutes: +r.minutes.toFixed(1) }));
    check(r.cleared && r.portal && r.ticks < 40000, `run: the autopilot cleared the level and opened the portal (${r.ticks} ticks, ${r.minutes.toFixed(1)} simulated minutes, ${r.kills} kills)`);
    check(r.order.join() === r.template.join() && r.order[r.order.length - 1] === 'guardian' && r.guardianDead, `run: beats finished in template order, ending with the guardian (${r.order.join(' > ')})`);
    check(['pack', 'beat', 'guardian', 'portal'].every(k => k === 'portal' || r.kinds.includes(k)), `run: levelGoal led through ${r.kinds.join(', ')}`);
    check(errors.length === 0, `run: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- ARPG in RIDE mode (simulated Zwift Ride + KICKR) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, ctl = D.ctl, out = {};
      D.setRide(true); D.start(true);
      const FTP = D.ride.ftp = 250;
      // One tick of the device (reads pad + sliders into ctl) then one game tick.
      const tick = n => { for (let i = 0; i < n; i++) { D.pollRide(.033); D.sim(1); } };
      const keepAlive = () => { P.life = S.maxLife; P.invuln = 5; };
      // Autopilot with Flex A pressed now and then: the hero should go and clear packs alone (before enemies are wiped below).
      D.ride.pw = 200; ctl.auto = true;
      let walked = 0, lx = P.x, lz = P.z;
      for (let i = 0; i < 60; i++) {
        P.life = Math.max(P.life, 60); if (i % 6 === 0) ctl.flexA = true;
        for (let k = 0; k < 15; k++) { tick(1); const step = Math.hypot(P.x - lx, P.z - lz); if (step < 1) walked += step; /* skip respawn and blink jumps */ lx = P.x; lz = P.z; }
      }
      out.kills = P.kills; out.travelled = walked;
      ctl.auto = false; ctl.flexA = false;
      const speed = (pw, dir) => { // units/s walking in `dir` for 1 s from a fixed spot
        D.enemies().length = 0; D.ride.pw = pw; D.ride.held = { [dir]: true };
        const x = P.x, z = P.z; tick(30); const d = Math.hypot(P.x - x, P.z - z) / (30 * .033); P.x = x; P.z = z;
        D.ride.held = {}; return d;
      };
      // Pick the direction with the most open floor.
      let dir = 'right', best = -1;
      for (const d of ['right', 'left', 'up', 'down']) { const v = speed(FTP, d); if (v > best) { best = v; dir = d; } }
      out.full = speed(FTP * 1.0, dir); out.at0 = speed(0, dir); out.at20 = speed(FTP * .2, dir); out.at40 = speed(FTP * .4, dir);
      // Main's fire interval: hold Main toward a fixed aim and count casts.
      const fireRate = rel => {
        D.ride.pw = FTP * rel; D.ride.held = {}; ctl.main = true; ctl.auto = false; D.surge().v = D.surge().max;
        P.cd.main = 0; tick(2); const n0 = P.fbN, T = 300; // ~10 s
        for (let i = 0; i < T; i++) { ctl.aim = [P.x + 5, P.z]; keepAlive(); D.pollRide(.033); ctl.aim = [P.x + 5, P.z]; D.sim(1); }
        ctl.main = false; ctl.aim = null;
        return { atk: P.eff.atk, interval: T * .033 / (P.fbN - n0) };
      };
      const endu = fireRate(.675), slow = fireRate(.4);
      out.enduAtk = endu.atk; out.enduInt = endu.interval; out.expInt = D.SK.fireball.rate / S.cast; out.slowAtk = slow.atk; out.cast = S.cast;
      // Surge at 130% FTP: bonus, drain, empty, then back to 1.0 while still at 130%.
      D.enemies().length = 0; D.ride.pw = FTP * 1.3; D.surge().v = D.surge().max; tick(1);
      out.surgeAtk = P.eff.atk; out.surging = P.eff.surging; const v0 = D.surge().v; tick(30); out.drained = D.surge().v < v0;
      let n = 0; while (D.surge().v > 0 && n < 4000) { keepAlive(); tick(1); n++; } out.emptySec = n * .033;
      tick(2); out.emptyAtk = P.eff.atk; out.emptySurging = P.eff.surging; out.emptyMaxEq = D.surge().max;
      // Easy riding refills: ~50% FTP.
      D.ride.pw = FTP * .5; tick(60); const vr = D.surge().v; out.rises = vr > 0;
      n = 0; while (D.surge().v < D.surge().max - 1e-6 && n < 8000) { keepAlive(); tick(1); n++; } out.refillSec = n * .033;
      // FTP change resizes the gauge and keeps the fill fraction.
      D.surge().v = D.surge().max / 2; D.ride.ftp = 300; tick(1); out.resize = D.surge().v / D.surge().max;
      D.ride.ftp = FTP;
      // Autopilot's keep distance follows Main's range.
      const k0 = D.autopilotRanges(); const r0 = D.SK.fireball.range; D.SK.fireball.range = r0 * 2; const k1 = D.autopilotRanges(); D.SK.fireball.range = r0;
      out.keep0 = k0.keep; out.keep1 = k1.keep; out.kite0 = k0.kite;
      D.setRide(false);
      return out;
    });
    console.log('  ride:', JSON.stringify(r));
    check(r.at0 < .01, `ride: hero stands still at 0 W with the D-pad held (${r.at0.toFixed(2)} u/s)`);
    check(r.at20 > r.full * .15 && r.at20 < r.full * .6, `ride: 20% FTP walks slowly (${r.at20.toFixed(2)} vs full ${r.full.toFixed(2)} u/s)`);
    check(r.full > 1 && Math.abs(r.at40 - r.full) < r.full * .02, `ride: 40% and 100% FTP move equally fast (${r.at40.toFixed(2)} / ${r.full.toFixed(2)})`);
    check(Math.abs(r.enduAtk - 1) < .02, `ride: atk is 1.0 at endurance (${r.enduAtk.toFixed(3)})`);
    check(Math.abs(r.enduInt / r.expInt - 1) < .1, `ride: Main fires every ${r.enduInt.toFixed(3)} s at endurance (expected ${r.expInt.toFixed(3)})`);
    check(Math.abs(r.slowAtk - .5) < .03, `ride: atk is about .5 at 40% FTP (${r.slowAtk.toFixed(3)})`);
    check(r.surging && r.surgeAtk > 1.3, `ride: surging at 130% FTP raises atk (${r.surgeAtk.toFixed(2)})`);
    check(r.drained, 'ride: the Surge gauge drains while surging');
    check(r.emptySec > 30 && r.emptySec < 60, `ride: the gauge empties in 30-60 s at 130% (${r.emptySec.toFixed(1)} s)`);
    check(r.emptyAtk === 1 && !r.emptySurging, `ride: atk back to 1.0 with an empty gauge at 130% (${r.emptyAtk})`);
    check(r.rises && r.refillSec < 180, `ride: easy riding refills the gauge in under 3 min (${r.refillSec.toFixed(0)} s)`);
    check(Math.abs(r.resize - .5) < .01, `ride: FTP change keeps the fill fraction (${r.resize.toFixed(3)})`);
    check(Math.abs(r.keep1 / r.keep0 - 2) < .01 && r.kite0 < r.keep0, `ride: autopilot keep follows Main range (${r.keep0.toFixed(2)} -> ${r.keep1.toFixed(2)})`);
    check(r.travelled > 10, `ride: autopilot moves the hero (${r.travelled.toFixed(1)} units walked)`);
    check(r.kills >= 10, `ride: autopilot + auto-attacking Fireball clears monsters (${r.kills} kills)`);
    if (process.env.SCREENSHOT) {
      // RIDE mode mid-fight, surging: 130% FTP, autopilot on, a pack in front.
      await page.evaluate(() => {
        const D = window.__dbg, P = D.P, S = D.S; D.setRide(true); D.start(true); D.newLevel(0); D.ride.ftp = 250; D.ride.pw = 325; D.ctl.auto = true;
        for (let n = 0; n < 3000; n++) { P.life = S.maxLife; D.pollRide(.033); D.sim(1); if (n > 150 && D.enemies().filter(e => !e.deathT && !e.beat && Math.hypot(e.x - P.x, e.z - P.z) < 9).length >= 3) break; }
        D.surge().v = D.surge().max * .7; D.hud();
      });
      await page.evaluate(() => { const D = window.__dbg; D.P.invuln = 60; D.ride.pw = 325; });
      await new Promise(r => setTimeout(r, 700)); await page.screenshot({ path: process.env.SCREENSHOT.replace(/\.png$/, '-ride.png') });
    }
    check(errors.length === 0, `ride: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Skill bar ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, out = {};
      const clear = () => { G.enemies.forEach(e => { e.gone = true; e.deathT = 1; }); G.enemies = []; };
      const free = (x, z) => !D.blocked(x, z, .6);
      D.start(true); D.kit();
      // Main auto-attacks: hero near a pack, no input held.
      const pk = D.packs()[0]; let ok = false;
      for (let k = 0; k < 16 && !ok; k++) { const a = k * .4; const x = pk.x + Math.cos(a) * 6, z = pk.z + Math.sin(a) * 6; if (free(x, z) && D.los(x, z, pk.x, pk.z)) { P.x = x; P.z = z; ok = true; } }
      // Sturdy targets of our own (warm-up packs die to a single explosion, which leaves nothing to measure).
      const dummies = [0, 1, 2].map(k => { const e = D.spawnEnemy('zombie', pk.x + k - 1, pk.z, null, 0); e.hp = e.maxHp = 5000; e.spd = 0; return e; });
      const fb0 = P.fbN;
      for (let i = 0; i < 60; i++) { P.life = S.maxLife; D.sim(3); }
      out.autoFired = P.fbN - fb0; out.autoDamage = dummies.reduce((a, e) => a + e.maxHp - e.hp, 0);
      out.autoHeld = D.ctl.main;
      // mainTarget prefers an elite over a nearer normal enemy, and respects range.
      D.start(true); D.kit(); clear();
      for (let k = 0; k < 400; k++) { const x = (Math.random() - .5) * 50, z = (Math.random() - .5) * 50; if (free(x, z) && free(x + 2, z - 1) && free(x + 7, z - 1) && D.los(x, z, x + 2, z - 1) && D.los(x, z, x + 7, z - 1)) { P.x = x; P.z = z; break; } }
      const norm = D.spawnEnemy('runner', P.x + 2, P.z - 1, null, 0), elite = D.spawnEnemy('runner', P.x + 7, P.z - 1, null, 2);
      out.losOk = D.los(P.x, P.z, norm.x, norm.z) && D.los(P.x, P.z, elite.x, elite.z);
      out.pickElite = D.mainTarget() === elite;
      elite.deathT = 1; out.pickNormal = D.mainTarget() === norm;
      norm.x = P.x + D.mainRange() + 4; out.outOfRange = D.mainTarget() === null;
      clear();
      // Manual fire: holding main fires toward aim even with nothing to target.
      D.ctl.main = true; D.ctl.aim = [P.x + 5, P.z]; const f1 = P.fbN; D.sim(30); D.ctl.main = false; D.ctl.aim = null; out.manualFired = P.fbN - f1;
      // Cooldowns gate casts; cdr shortens them, capped at 40%.
      P.cd.flexA = 0; out.cast1 = D.castSlot('flexA'); out.cast2 = D.castSlot('flexA'); out.cd1 = P.cd.flexA;
      for (let i = 0; i < 10; i++) { P.life = S.maxLife; D.sim(20); } out.cdDone = P.cd.flexA === 0; out.cast3 = D.castSlot('flexA');
      P.gear.ring = { slot: 'ring', rar: 1, name: 't', mods: [['cdr', .1]] }; D.recalc(); P.cd.flexA = 0; D.castSlot('flexA'); out.cd10 = P.cd.flexA; out.cdr10 = S.cdr;
      P.gear.ring = { slot: 'ring', rar: 1, name: 't', mods: [['cdr', .9]] }; D.recalc(); P.cd.flexA = 0; D.castSlot('flexA'); out.cd90 = P.cd.flexA; out.cdr90 = S.cdr;
      P.gear.ring = null; D.recalc();
      // Ward absorbs damage first.
      P.life = S.maxLife; P.invuln = 0; P.cd.guard = 0; out.wardCast = D.castSlot('guard'); const w = P.ward, wmax = w && w.hp;
      D.hurtP(10); out.wardLife = P.life === S.maxLife; out.wardHp = w ? wmax - w.hp : -1; out.wardVisible = !!(w && w.g.parent);
      D.hurtP(S.maxLife * .6); out.wardBroke = P.ward === null && P.life < S.maxLife && P.life > 0;
      // Blink: away from the nearest enemy, never into an obstacle.
      D.start(true); D.kit(); clear(); P.invuln = 0;
      const foe = D.spawnEnemy('runner', 0, 0, null, 0); foe.awake = true;
      let trials = 0, moved = 0, bad = 0, nocast = 0;
      for (let i = 0; i < 80; i++) {
        const x = (Math.random() - .5) * 60, z = (Math.random() - .5) * 60; if (D.blocked(x, z, P.r)) continue;
        const a = Math.random() * 6.28; P.x = x; P.z = z; P.dead = 0; P.cd.evade = 0;
        foe.x = x + Math.cos(a) * 2.5; foe.z = z + Math.sin(a) * 2.5; foe.awake = true; foe.deathT = 0;
        const d0 = Math.hypot(foe.x - P.x, foe.z - P.z); trials++;
        if (!D.castSlot('evade')) { nocast++; continue; }
        if (D.blocked(P.x, P.z, P.r)) bad++;
        if (Math.hypot(foe.x - P.x, foe.z - P.z) > d0 + 2) moved++;
      }
      out.blink = { trials, moved, bad, nocast };
      out.blinkInvuln = P.invuln > 0;
      P.cd.evade = 0; out.blinkCd = D.castSlot('evade') && P.cd.evade > 4 && !D.castSlot('evade');
      // Nothing threatening: blink along the facing direction.
      clear(); P.x = G.start.x + 8; P.z = G.start.z - 8; P.face = Math.PI / 2; P.cd.evade = 0; const bx = P.x; out.blinkFree = D.castSlot('evade') && Math.hypot(P.x - bx, 0) > 2;
      // No mana.
      out.noMana = P.mana === undefined && S.maxMana === undefined && !document.getElementById('orbR');
      out.slots = ['sMain', 'sFlexA', 'sFlexB', 'sGuard', 'sEvade', 'sFl'].every(id => document.getElementById(id) && document.querySelector('#' + id + ' .gem') && document.querySelector('#' + id + ' .cd'));
      return out;
    });
    console.log('  skill bar:', JSON.stringify(r));
    check(r.autoFired > 5 && r.autoDamage > 0 && !r.autoHeld, `skills: Main auto-attacks with no input (${r.autoFired} fireballs, ${Math.round(r.autoDamage)} damage)`);
    check(r.losOk && r.pickElite && r.pickNormal && r.outOfRange, 'skills: mainTarget prefers elites, then nearest, within range');
    check(r.manualFired > 2, `skills: holding Main fires toward the aim point (${r.manualFired})`);
    check(r.cast1 && !r.cast2 && r.cdDone && r.cast3 && Math.abs(r.cd1 - 6) < .1, `skills: cooldown gates Flex A (cd ${r.cd1 && r.cd1.toFixed(2)})`);
    check(Math.abs(r.cd10 - 5.4) < .05 && r.cdr10 === .1 && r.cdr90 === .4 && Math.abs(r.cd90 - 3.6) < .05, `skills: cdr shortens cooldowns, capped at 40% (${r.cd10.toFixed(2)}, ${r.cd90.toFixed(2)})`);
    check(r.wardCast && r.wardLife && Math.abs(r.wardHp - 10) < .01 && r.wardVisible && r.wardBroke, 'skills: Ward absorbs damage, then breaks');
    check(r.blink.trials > 40 && r.blink.moved === r.blink.trials - r.blink.nocast && r.blink.bad === 0 && r.blink.nocast < r.blink.trials * .1, `skills: Blink moves away from threats and never lands in an obstacle (${JSON.stringify(r.blink)})`);
    check(r.blinkInvuln && r.blinkCd && r.blinkFree, 'skills: Blink grants invulnerability, has a cooldown, and works with no threat');
    check(r.noMana && r.slots, 'skills: no mana remains; skill bar slots present');
    check(errors.length === 0, `skills: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Gems ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(async () => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, out = {};
      const clear = () => { G.enemies.forEach(e => { e.gone = true; e.deathT = 1; }); G.enemies = []; };
      const free = (x, z) => !D.blocked(x, z, .6);
      const gm = id => P.gems.find(g => g.id === id);
      const resetGems = () => { for (const g of P.gems) { g.lvl = 1; g.ap = 0; } };
      D.start(true); D.kit(); clear(); P.cd.main = 1e6; // no auto-fire in these tests
      out.start = P.gems.map(g => g.id + ':' + g.lvl).join(',');
      // Kills grant AP to equipped gems; an unequipped gem (Blink, with Nova on the Evade slot) gets 10%.
      const bar0 = { ...P.bar }; D.unequip('evade'); resetGems();
      D.kill(D.spawnEnemy('runner', P.x + 3, P.z, null, 0));
      out.killAp = [gm('fireball').ap, gm('blink').ap];
      D.kill(D.spawnEnemy('runner', P.x + 3, P.z, null, 2)); out.rareAp = gm('fireball').ap - out.killAp[0];
      D.equipGem('evade', bar0.evade);
      // Time grants AP.
      resetGems(); clear(); G.packs = []; D.sim(300); out.timeAp = gm('fireball').ap;
      // Level 5 pierces: a line of two enemies, 4 apart (outside one explosion's radius).
      let spot = null;
      for (let k = 0; k < 600 && !spot; k++) { const x = (Math.random() - .5) * 50, z = (Math.random() - .5) * 50; if (free(x, z) && free(x + 3, z) && free(x + 7, z) && D.los(x, z, x + 3, z) && D.los(x, z, x + 7, z) && D.los(x + 3, z, x + 7, z)) spot = [x, z]; }
      const line = lvl => {
        resetGems(); gm('fireball').lvl = lvl; clear(); P.x = spot[0]; P.z = spot[1]; G.proj.forEach(p => { p.dead = true; }); G.proj = [];
        const a = D.spawnEnemy('runner', spot[0] + 3, spot[1], null, 0), b = D.spawnEnemy('runner', spot[0] + 7, spot[1], null, 0);
        for (const e of [a, b]) { e.hp = e.maxHp = 1e6; e.awake = false; }
        D.castFireball(spot[0] + 7, spot[1]); D.sim(20);
        return [a.hp < 1e6, b.hp < 1e6];
      };
      out.line1 = line(1);
      resetGems(); D.gainAP(580); out.lvl5 = gm('fireball').lvl; out.has5 = D.gemHas('fireball', 'pierce'); out.has10a = D.gemHas('fireball', 'burn');
      const fire5 = gm('fireball').lvl; out.line5 = line(fire5);
      // Level 10 caps, leaves burning ground, and AP can't push past it.
      resetGems(); D.gainAP(1e6); out.lvl10 = gm('fireball').lvl; D.gainAP(5000); out.capLvl = gm('fireball').lvl; out.capAp = gm('fireball').ap; out.has10 = D.gemHas('fireball', 'burn');
      clear(); G.patches = []; P.x = spot[0]; P.z = spot[1]; P.dead = 0; P.life = S.maxLife;
      const e = D.spawnEnemy('runner', spot[0] + 3, spot[1], null, 0); e.hp = e.maxHp = 1e6; e.awake = false;
      D.castFireball(spot[0] + 3, spot[1]); D.sim(40); out.patches = G.patches.length;
      // Gem base drives damage: lv10 hit ~3x a lv1 hit with the same gear (no gear flat, no crit).
      const gear = P.gear; P.gear = {}; D.recalc(); const crit = S.crit; S.crit = 0; clear();
      const t = D.spawnEnemy('runner', spot[0] + 3, spot[1], null, 0); t.hp = t.maxHp = 1e9; t.awake = false;
      const avg = lvl => { gm('fireball').lvl = lvl; let s = 0; for (let i = 0; i < 60; i++) s += D.hit(t, 1, 'fire', { sk: 'fireball', dot: 1 }); return s / 60; };
      out.dmgRatio = avg(10) / avg(1); P.gear = gear; D.recalc(); S.crit = crit;
      // Gems survive save -> load; old saves with no gems start at lv1.
      resetGems(); Object.assign(gm('fireball'), { lvl: 7, ap: 33 }); gm('blink').lvl = 3; D.save();
      D.start(false); out.loaded = [gm('fireball').lvl, Math.round(gm('fireball').ap), gm('blink').lvl];
      const sv = JSON.parse(localStorage.getItem('wd-arpg-1')); delete sv.gems; localStorage.setItem('wd-arpg-1', JSON.stringify(sv));
      D.start(false); out.oldSave = P.gems.length >= 4 && P.gems.every(g => g.lvl === 1 && g.ap === 0);
      // HUD: the badge and AP bar render in each slot.
      D.kit(); gm('fireball').lvl = 4; gm('fireball').ap = 50; gm('nova').lvl = 10;
      for (let i = 0; i < 40 && !document.querySelector('#sMain .gem b'); i++) await new Promise(r => setTimeout(r, 100));
      await new Promise(r => setTimeout(r, 300));
      out.badge = document.querySelector('#sMain .gem b').textContent; out.badgeMax = document.querySelector('#sFlexA .gem b').textContent;
      out.bar = document.querySelector('#sMain .gem u').style.width;
      return out;
    });
    console.log('  gems:', JSON.stringify(r));
    check(r.start === 'fireball:1,nova:1,ward:1,blink:1', 'gems: the kit makes all four at level 1');
    check(r.killAp[0] === 1 && Math.abs(r.killAp[1] - .1) < 1e-9 && r.rareAp === 10, `gems: kills give AP (rare 10x); unequipped gem gets 10% (${r.killAp})`);
    check(r.timeAp > .5 && r.timeAp < 2, `gems: time grants AP (${r.timeAp.toFixed(2)} in 10 s)`);
    check(r.line1[0] && !r.line1[1], `gems: lv1 Fireball explodes on the first enemy (${r.line1})`);
    check(r.lvl5 === 5 && r.has5 && !r.has10a && r.line5[0] && r.line5[1], `gems: lv5 Fireball pierces and hits both enemies (${r.line5})`);
    check(r.lvl10 === 10 && r.capLvl === 10 && r.capAp === 0 && r.has10, 'gems: level 10 is the cap; AP cannot push past it');
    check(r.patches > 0, `gems: lv10 Fireball leaves burning ground (${r.patches})`);
    check(r.dmgRatio > 2.8 && r.dmgRatio < 3.2, `gems: lv10 Fireball hits ~3x lv1 with the same gear (${r.dmgRatio.toFixed(2)}x)`);
    check(r.loaded[0] === 7 && r.loaded[1] === 33 && r.loaded[2] === 3 && r.oldSave, `gems: survive save and load; old saves start at lv1 (${r.loaded})`);
    check(r.badge === 'Lv 4' && r.badgeMax === 'MAX' && parseFloat(r.bar) > 0, `gems: skill bar shows level badge and AP bar (${r.badge}, ${r.badgeMax}, ${r.bar})`);
    check(errors.length === 0, `gems: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Slice 2+ blocks: every tests/blocks/*.mjs, in file-name order ----------
  // Each block file exports `default async function ({ open, check, SEED, SHOT })`. Blocks own their pages and must
  // check their own page errors. Adding a file here never touches this one, so parallel work doesn't collide.
  {
    const dir = new URL('./blocks/', import.meta.url);
    const files = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.mjs')).sort() : [];
    const only = process.env.ONLY; // ONLY=name runs just the blocks whose file name contains it (plus the blocks above)
    for (const f of files) {
      if (only && !f.includes(only)) continue;
      console.log(`  -- block ${f}`);
      const mod = await import(new URL(f, dir));
      await mod.default({ open, check, SEED, SHOT: process.env.SCREENSHOT || null });
    }
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

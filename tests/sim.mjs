// Headless playtest. Builds nothing itself: run `npm run build` first. Serves dist/, then:
//   1. ARPG (/): a scripted player clears packs, loots, equips, spends passives, kills the boss and takes the portal.
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
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, out = {};
      D.start(true);
      out.packs = D.packs().length;
      // Scripted player: walk toward the nearest living pack; Fireball auto-attacks, Nova / Ward / Blink on a rhythm.
      for (let step = 0; step < 90; step++) {
        const alive = D.packs().filter(p => !p.spawned || p.list.some(e => !e.deathT));
        const tgt = alive.sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
        if (tgt) { const dx = tgt.x - P.x, dz = tgt.z - P.z, d = Math.hypot(dx, dz); D.ctl.mx = d > 6 ? dx / d : 0; D.ctl.mz = d > 6 ? dz / d : 0; }
        if (step % 4 === 0) D.ctl.flexA = true; if (step % 9 === 0) D.ctl.evade = true; if (step % 3 === 0) D.ctl.guard = true;
        P.life = Math.max(P.life, 60); D.sim(10);
      }
      D.ctl.mx = D.ctl.mz = 0;
      out.rigged = D.chars.ready && D.G.heroM.rigged && D.enemies().some(e => e.model.rigged);
      out.dressed = D.G.dressed && D.G.obst.length > 40 && D.G.torches.length > 10;
      out.kills = P.kills; out.lvl = P.lvl; out.loot = P.inv.length + D.items().length;
      for (let i = 0; i < 4; i++) D.dropItem(P.x, P.z, .5);
      D.sim(40); out.inv = P.inv.length;
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
    check(r.kills > 25, `arpg: player mowed down monsters (${r.kills} kills)`);
    check(r.lvl >= 3, `arpg: player levelled up (level ${r.lvl})`);
    check(r.loot > 0, `arpg: monsters dropped loot (${r.loot})`);
    check(r.inv >= 4, `arpg: loot picked up into the bag (${r.inv})`);
    check(r.equipped, 'arpg: equipping an item changes gear');
    check(r.cards === 3 && r.passives >= 1, `arpg: passive offer shows 3 cards and allocates`);
    check(r.boss && r.bossCast, 'arpg: boss spawned and used abilities');
    check(r.portal && r.tier === 2, `arpg: boss kill opens portal to map 2 (tier ${r.tier})`);
    if (process.env.SCREENSHOT) {
      await page.evaluate(() => { const D = window.__dbg, P = D.P; const pk = D.packs().find(p => !p.spawned); if (pk) { P.x = pk.x - 6; P.z = pk.z + 3; } D.sim(25); D.castNova(); D.castWard(); D.castFireball(); D.sim(3); });
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
      D.ride.pw = 200; D.ctl.auto = true;
      // Measure the path walked, not distance from the start: the autopilot can loop back toward the entrance.
      let walked = 0, lx = P.x, lz = P.z;
      for (let i = 0; i < 60; i++) {
        P.life = Math.max(P.life, 60); if (i % 6 === 0) D.ctl.flexA = true;
        for (let k = 0; k < 15; k++) { D.sim(1); const step = Math.hypot(P.x - lx, P.z - lz); if (step < 1) walked += step; /* skip respawn and dash jumps */ lx = P.x; lz = P.z; }
      }
      out.kills = P.kills; out.travelled = walked;
      D.setRide(false);
      return out;
    });
    console.log('  ride:', JSON.stringify(r));
    check(r.stillAt0W, 'ride: hero stands still at 0 W');
    check(r.travelled > 10, `ride: autopilot moves the hero (${r.travelled.toFixed(1)} units walked)`);
    check(r.kills >= 10, `ride: autopilot + auto-attacking Fireball clears monsters (${r.kills} kills)`);
    check(errors.length === 0, `ride: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  }

  // ---------- Skill bar ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, S = D.S, G = D.G, out = {};
      const clear = () => { G.enemies.forEach(e => { e.gone = true; e.deathT = 1; }); G.enemies = []; };
      const free = (x, z) => !D.blocked(x, z, .6);
      D.start(true);
      // Main auto-attacks: hero near a pack, no input held.
      const pk = D.packs()[0]; let ok = false;
      for (let k = 0; k < 16 && !ok; k++) { const a = k * .4; const x = pk.x + Math.cos(a) * 6, z = pk.z + Math.sin(a) * 6; if (free(x, z) && D.los(x, z, pk.x, pk.z)) { P.x = x; P.z = z; ok = true; } }
      D.sim(6); const fb0 = P.fbN, hp0 = D.enemies().reduce((a, e) => a + e.hp, 0);
      for (let i = 0; i < 60; i++) { P.life = S.maxLife; D.sim(3); }
      out.autoFired = P.fbN - fb0; out.autoDamage = hp0 - D.enemies().reduce((a, e) => a + e.hp, 0) + P.kills * 0;
      out.autoHeld = D.ctl.main;
      // mainTarget prefers an elite over a nearer normal enemy, and respects range.
      D.start(true); clear();
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
      D.start(true); clear(); P.invuln = 0;
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
      out.slots = ['sMain', 'sFlexA', 'sGuard', 'sEvade', 'sFl'].every(id => document.getElementById(id) && document.querySelector('#' + id + ' .gem') && document.querySelector('#' + id + ' .cd'));
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
      const resetGems = () => { for (const id in P.gems) P.gems[id] = { lvl: 1, ap: 0 }; };
      D.start(true); clear(); P.cd.main = 1e6; // no auto-fire in these tests
      out.start = Object.entries(P.gems).map(([k, g]) => k + ':' + g.lvl).join(',');
      // Kills grant AP to equipped gems; an unequipped gem (Blink, with Nova on the Evade slot) gets 10%.
      const bar0 = { ...P.bar }; P.bar.evade = 'nova'; resetGems();
      D.kill(D.spawnEnemy('runner', P.x + 3, P.z, null, 0));
      out.killAp = [P.gems.fireball.ap, P.gems.blink.ap];
      D.kill(D.spawnEnemy('runner', P.x + 3, P.z, null, 2)); out.rareAp = P.gems.fireball.ap - out.killAp[0];
      P.bar = bar0;
      // Time grants AP.
      resetGems(); clear(); D.sim(300); out.timeAp = P.gems.fireball.ap;
      // Level 5 pierces: a line of two enemies, 4 apart (outside one explosion's radius).
      let spot = null;
      for (let k = 0; k < 600 && !spot; k++) { const x = (Math.random() - .5) * 50, z = (Math.random() - .5) * 50; if (free(x, z) && free(x + 3, z) && free(x + 7, z) && D.los(x, z, x + 3, z) && D.los(x, z, x + 7, z) && D.los(x + 3, z, x + 7, z)) spot = [x, z]; }
      const line = lvl => {
        resetGems(); P.gems.fireball.lvl = lvl; clear(); P.x = spot[0]; P.z = spot[1]; G.proj.forEach(p => { p.dead = true; }); G.proj = [];
        const a = D.spawnEnemy('runner', spot[0] + 3, spot[1], null, 0), b = D.spawnEnemy('runner', spot[0] + 7, spot[1], null, 0);
        for (const e of [a, b]) { e.hp = e.maxHp = 1e6; e.awake = false; }
        D.castFireball(spot[0] + 7, spot[1]); D.sim(20);
        return [a.hp < 1e6, b.hp < 1e6];
      };
      out.line1 = line(1);
      resetGems(); D.gainAP(580); out.lvl5 = P.gems.fireball.lvl; out.has5 = D.gemHas('fireball', 'pierce'); out.has10a = D.gemHas('fireball', 'burn');
      const fire5 = P.gems.fireball.lvl; out.line5 = line(fire5);
      // Level 10 caps, leaves burning ground, and AP can't push past it.
      resetGems(); D.gainAP(1e6); out.lvl10 = P.gems.fireball.lvl; D.gainAP(5000); out.capLvl = P.gems.fireball.lvl; out.capAp = P.gems.fireball.ap; out.has10 = D.gemHas('fireball', 'burn');
      clear(); G.patches = []; P.x = spot[0]; P.z = spot[1]; P.dead = 0; P.life = S.maxLife;
      const e = D.spawnEnemy('runner', spot[0] + 3, spot[1], null, 0); e.hp = e.maxHp = 1e6; e.awake = false;
      D.castFireball(spot[0] + 3, spot[1]); D.sim(40); out.patches = G.patches.length;
      // Gem base drives damage: lv10 hit ~3x a lv1 hit with the same gear (no gear flat, no crit).
      const gear = P.gear; P.gear = {}; D.recalc(); const crit = S.crit; S.crit = 0; clear();
      const t = D.spawnEnemy('runner', spot[0] + 3, spot[1], null, 0); t.hp = t.maxHp = 1e9; t.awake = false;
      const avg = lvl => { P.gems.fireball.lvl = lvl; let s = 0; for (let i = 0; i < 60; i++) s += D.hit(t, 1, 'fire', { sk: 'fireball', dot: 1 }); return s / 60; };
      out.dmgRatio = avg(10) / avg(1); P.gear = gear; D.recalc(); S.crit = crit;
      // Gems survive save -> load; old saves with no gems start at lv1.
      resetGems(); P.gems.fireball = { lvl: 7, ap: 33 }; P.gems.blink.lvl = 3; D.save();
      D.start(false); out.loaded = [P.gems.fireball.lvl, Math.round(P.gems.fireball.ap), P.gems.blink.lvl];
      const sv = JSON.parse(localStorage.getItem('wd-arpg-1')); delete sv.gems; localStorage.setItem('wd-arpg-1', JSON.stringify(sv));
      D.start(false); out.oldSave = Object.values(P.gems).every(g => g.lvl === 1 && g.ap === 0);
      // HUD: the badge and AP bar render in each slot.
      P.gems.fireball.lvl = 4; P.gems.fireball.ap = 50; P.gems.nova.lvl = 10;
      for (let i = 0; i < 40 && !document.querySelector('#sMain .gem b'); i++) await new Promise(r => setTimeout(r, 100));
      await new Promise(r => setTimeout(r, 300));
      out.badge = document.querySelector('#sMain .gem b').textContent; out.badgeMax = document.querySelector('#sFlexA .gem b').textContent;
      out.bar = document.querySelector('#sMain .gem u').style.width;
      return out;
    });
    console.log('  gems:', JSON.stringify(r));
    check(r.start === 'fireball:1,nova:1,ward:1,blink:1', 'gems: all four start at level 1');
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

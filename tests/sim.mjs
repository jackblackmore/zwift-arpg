// Headless playtest. Builds nothing itself: run `npm run build` first. Serves dist/, then:
//   1. ARPG (/): a scripted player clears packs, loots, equips, spends passives, kills the boss and takes the portal.
//      Then balance guard rails: a few arena fights (src/game/arena.js) must land in sane ranges.
//   2. Pedal demo (/pedal/): two 12-minute simulated rides, as before.
//   3. Asset gallery (/gallery/): every character, animation set and model pack loads and shows.
// Usage: npm test  (needs Chrome; set CHROME_PATH if not found; SEED=n changes the fixed random seed). SCREENSHOT=/tmp/shot.png saves an ARPG mid-fight shot
// (and /tmp/shot-gallery-*.png, gallery views).
import { preview } from 'vite';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chrome) { console.error('No Chrome found. Set CHROME_PATH.'); process.exit(1); }

const server = await preview({ preview: { port: 4173, strictPort: true } });
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
  await page.goto('http://localhost:4173' + path, { waitUntil: 'load' });
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

  // ---------- Balance guard rails (arena: real fights, scripted player; full table via `npm run arena`) ----------
  {
    const { page, errors } = await open('/');
    const r = await page.evaluate(() => {
      const D = window.__dbg; D.start(true);
      return {
        pack: D.arena({ tier: 1, fight: [['zombie', 3], ['archer', 1]] }),
        boss: D.arena({ tier: 1, guardian: true, maxT: 240 }),
        under: D.arena({ tier: 2, gear: 'start', guardian: true, maxT: 120 }),
        shield: (() => { D.P.mana = 100; D.castShield(); const a = D.P.shield / D.S.maxLife; const l = D.P.life; return { result: a > .3 ? 'ok' : 'none', t: Math.round(a * 100) / 100, lowest: l }; })(),
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
      D.start(true);
      out.freshBar = filled(); // only Guard until the Main shrine is taken
      out.guardGem = P.gems.find(g => g.id === P.bar.guard).gem;
      D.takeShrine('main', 'arc'); document.getElementById('mShrine').classList.remove('show');
      out.afterMain = filled();
      out.lockedFlex = D.placeGem(P.bar.main, 'flexA') === false; // level 1: Flex A is locked
      // Reach level 5: the Flex A shrine waits at the next map entrance; walking into it opens the choice.
      P.lvl = 5; D.recalc(); D.newMap(1);
      out.shrineSlot = G.shrine && G.shrine.slot;
      P.x = G.shrine.x; P.z = G.shrine.z; D.sim(2);
      out.ask = G.shrineAsk; G.shrineAsk = null;
      D.openShrine('flexA'); out.flexOffer = [...document.querySelectorAll('#shrineCards .pc')].map(c => c.dataset.k).join(',');
      document.querySelector('#shrineCards .pc[data-k="nova"]').click();
      out.afterFlex = filled(); out.shrineGone = !G.shrine;
      out.flexGem = P.gems.find(g => g.id === P.bar.flexA).gem;
      // Gem XP: kills give bar gems full XP and bag gems 10%.
      const spare = D.addGem('fireball'), arc = P.gems.find(g => g.id === P.bar.main);
      // grant XP the way a kill does (a stand-in monster)
      const before = { arc: arc.xp + arc.lvl * 1e4, spare: spare.xp };
      window.__dbg.kill({ deathT: 0, x: P.x, z: P.z, xp: 30, rar: 0, type: 'zombie', aff: [], freeze: 0, h: 1, model: { g: {} } });
      out.barXp = arc.xp + arc.lvl * 1e4 - before.arc; out.bagXp = spare.xp - before.spare;
      // Level 5 milestone: Arc +2 chains.
      const c0 = S.chains; arc.lvl = 5; D.recalc(); out.chainsGain = S.chains - c0;
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
    check(r.flexOffer === 'fireball,nova' && r.afterFlex === 'flexA,guard,main' && r.flexGem === 'nova' && r.shrineGone, `gems: picking a shrine gem fills the slot (offered ${r.flexOffer})`);
    check(r.barXp > 0 && r.bagXp > 0 && Math.abs(r.bagXp - r.barXp * .1) < 1, `gems: kills give bar gems XP and bag gems 10% (${r.barXp} / ${r.bagXp})`);
    check(r.chainsGain === 2, `gems: Arc's level 5 milestone adds 2 chains (+${r.chainsGain})`);
    check(r.saved && r.loaded, 'gems: saves round-trip the skill bar and the gem bag');
    check(r.oldSave, 'gems: an old save without gems gets Magic Shield and the Main shrine');
    check(errors.length === 0, `gems: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
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

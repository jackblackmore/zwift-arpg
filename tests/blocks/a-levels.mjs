// Workstream A: the five Crypt levels (names, monster mixes, scaling, guardians), poison pools, corpses and the necromancer, the waypoint
// (saved clears, locked levels, leaving a level) and the "Trial awaits" ending. Screenshots with SHOT: -waypoint.png and -necro.png.
export default async function ({ open, check, SEED, SHOT }) {
  const { page, errors } = await open('/');
  const ready = () => page.waitForFunction(() => window.__dbg && window.__dbg.ready(), { timeout: 20000 });
  // Test helpers living in the page: keep the hero alive, run ticks, run a level's guardian beat.
  const install = () => page.evaluate(() => {
    const D = window.__dbg, P = D.P;
    window.A = {
      // fight: let Main auto-attack (off by default so nothing dies unless a test kills it)
      tick(n, fight = false) { for (let i = 0; i < n; i++) { P.life = D.S.maxLife; if (!fight) P.cd.main = 1e9; D.sim(1); } },
      // Crypt n with every pack marked spawned (so only what a test puts there exists), the hero invulnerable.
      fresh(n) { D.newLevel(n); D.packs().forEach(p => { p.spawned = true; }); P.invuln = 1e9; P.cd.main = 1e9; },
      // Start the guardian beat of the current level and wait for the guardian to wake.
      guardian() { D.startBeat(6); let n = 0; while (!D.enemies().some(e => e.guardian && e.awake) && n++ < 600) this.tick(1); return D.enemies().find(e => e.guardian); },
      // Remove every monster and corpse (noLoot kills leave none) and let the death animations finish.
      sweep() { for (const e of D.enemies()) if (!e.deathT) { e.noLoot = true; D.kill(e); } D.sim(100); while (D.takeCorpse(0, 0, 1e4)); },
    };
  });
  await install();
  await page.evaluate(() => { window.__dbg.start(true); window.__dbg.P.invuln = 1e9; });

  // ---------- 1. Each Crypt: name, monster mix, guardian ----------
  const NAMES = ['Crypt Halls', 'Ossuary', 'Flooded Tombs', 'Bone Gardens', 'Throne Approach'], GTYPES = ['guardian', 'captain', 'warden', 'lord', 'lieutenant'];
  const r1 = await page.evaluate(() => {
    const D = window.__dbg, G = D.G, out = [];
    for (let n = 1; n <= 5; n++) {
      const o = { n, mem: {}, rares: 0, magic: 0, packs: 0, obst: 0, beatTypes: new Set(), defMon: new Set() };
      for (let k = 0; k < 4; k++) {
        const L = D.newLevel(n);
        if (k === 0) { o.name = L.name; o.crypt = L.crypt; o.gcrypt = G.crypt; o.depth = G.depth; o.par = L.def.par; o.guardian = L.def.guardian; o.hazard = !!(L.def.hazards && L.def.hazards.pools); o.pools = D.pools().length; }
        for (const p of D.packs()) { o.packs++; p.mem.forEach(t => o.mem[t] = (o.mem[t] || 0) + 1); if (p.rare) { o.rares++; o.mem[p.rare] = (o.mem[p.rare] || 0) + 1; } if (p.magic) o.magic++; }
        o.obst += G.obst.length / 4;
        JSON.stringify(L.defs, (key, v) => { if (typeof v === 'string' && ['zombie', 'runner', 'archer', 'bloater', 'necro'].includes(v)) o.defMon.add(v); return v; });
      }
      o.defMon = [...o.defMon]; delete o.beatTypes; out.push(o);
    }
    return out;
  });
  console.log('  levels:', JSON.stringify(r1.map(o => ({ n: o.n, name: o.name, packs: o.packs, rares: o.rares, magic: o.magic, obst: Math.round(o.obst), mem: o.mem, defMon: o.defMon }))));
  check(r1.every((o, i) => o.name === NAMES[i] && o.crypt === o.n && o.gcrypt === o.n && o.depth === o.n && o.guardian === GTYPES[i]), 'levels: Crypt 1..5 generate with their own name, G.crypt / G.depth and guardian type');
  check(r1.map(o => o.par).join() === '1,4,7,10,12', `levels: par character levels ${r1.map(o => o.par)}`);
  check(!r1[0].mem.archer && !r1[0].defMon.includes('archer') && !r1[0].defMon.includes('bloater') && !r1[0].defMon.includes('necro'), 'levels: Crypt 1 has only zombies and runners (packs and beats)');
  check(r1[1].mem.archer > 0 && !r1[1].mem.necro && !r1[1].mem.bloater, `levels: the Ossuary brings archers (${r1[1].mem.archer} in packs)`);
  check(r1[2].mem.bloater > 0 && !r1[2].mem.necro && r1[2].hazard && r1[2].pools > 0, `levels: the Flooded Tombs have bloaters (${r1[2].mem.bloater}) and ambient poison pools (${r1[2].pools})`);
  check(r1[3].mem.necro > 0 && !r1[0].mem.necro && !r1[2].mem.necro, `levels: the Bone Gardens have necromancers (${r1[3].mem.necro})`);
  check(r1[0].pools === 0 && r1[1].pools === 0 && r1[3].pools === 0, 'levels: only the Flooded Tombs and Throne Approach carry ambient pools');
  check(r1[4].rares + r1[4].magic > (r1[0].rares + r1[0].magic) * 1.4 && r1[4].rares > r1[0].rares, `levels: Throne Approach is heavy on rare and magic packs (${r1[4].rares} rare, ${r1[4].magic} magic vs ${r1[0].rares}, ${r1[0].magic} in Crypt 1)`);
  check(r1[1].obst > r1[0].obst * 1.3, `levels: the Ossuary is denser with obstacles (${Math.round(r1[1].obst)} colliders vs ${Math.round(r1[0].obst)})`);

  // ---------- 2. Scaling and the damage target ----------
  const r2 = await page.evaluate(() => {
    const D = window.__dbg, P = D.P, S = D.S, out = { hp: [], dmg: [], ghp: [] };
    for (let n = 1; n <= 5; n++) { D.newLevel(n); const z = D.spawnEnemy('zombie', 0, 0, null, 0), g = D.spawnEnemy(['guardian', 'captain', 'warden', 'lord', 'lieutenant'][n - 1], 5, 5, null, 0); out.hp.push(z.maxHp); out.dmg.push(z.dmg); out.ghp.push(g.maxHp); }
    // Hits a level 1 Fireball does on a normal Crypt 1 zombie (if the build has a loadout helper, use it for a ready gem).
    D.newLevel(1); if (D.kit) D.kit();
    const hits = []; let sum = 0, cnt = 0;
    for (let k = 0; k < 40; k++) { const z = D.spawnEnemy('zombie', -50, -50, null, 0); z.awake = false; let h = 0; while (!z.deathT && h < 20) { const d = D.hit(z, 1, 'fire', { sk: 'fireball' }); sum += d; cnt++; h++; } hits.push(h); }
    out.hits = hits; out.avgDmg = sum / cnt; out.mean = hits.reduce((a, b) => a + b, 0) / hits.length;
    out.perType = {}; for (const t of ['zombie', 'runner', 'archer', 'bloater']) out.perType[t] = D.spawnEnemy(t, -50, -50, null, 0).maxHp;
    return out;
  });
  console.log('  scaling:', JSON.stringify({ hp: r2.hp.map(v => +v.toFixed(1)), dmg: r2.dmg.map(v => +v.toFixed(1)), ghp: r2.ghp.map(Math.round), meanHits: +r2.mean.toFixed(2), avgDmg: +r2.avgDmg.toFixed(1), perType: r2.perType }));
  check(r2.hp.every((v, i) => i === 0 || v > r2.hp[i - 1] * 1.25) && r2.dmg.every((v, i) => i === 0 || v > r2.dmg[i - 1] * 1.1) && r2.ghp.length === 5, 'scaling: zombie HP rises about x1.35 and damage about x1.17 per Crypt');
  check(r2.mean >= 2 && r2.mean <= 3.1 && Math.max(...r2.hits) <= 4 && Math.min(...r2.hits) >= 1, `scaling: a level 1 Fireball hit (${r2.avgDmg.toFixed(1)}) takes ${r2.mean.toFixed(2)} hits on a Crypt 1 zombie`);
  check(r2.perType.runner < r2.perType.archer && r2.perType.archer < r2.perType.zombie && r2.perType.zombie < r2.perType.bloater, `scaling: Crypt 1 HP runner < archer < zombie < bloater (${JSON.stringify(r2.perType)})`);
  check(r2.ghp[0] >= 1000 && r2.ghp[0] <= 1400, `scaling: Ossric has ${Math.round(r2.ghp[0])} HP at Crypt 1`);

  // ---------- 3. Guardians: each has its own rules, abilities and a primitive fallback ----------
  const r3 = await page.evaluate(() => {
    const D = window.__dbg, G = D.G, P = D.P, A = window.A, out = [];
    for (const rig of [true, false]) for (let n = 1; n <= 5; n++) {
      D.chars.ready = rig && D.chars.tpl && !!D.chars.tpl.warrior ? true : false;
      A.fresh(n); const g = A.guardian(), o = { n, rig: D.chars.ready, ok: !!g };
      if (g) {
        o.type = g.type; o.guardian = g.guardian === true; o.boss = g.ai === 'boss'; o.name = g.name; o.rigged = !!g.model.rigged;
        const seen = new Set(), pools0 = D.pools().length, kinds = [];
        for (let k = 0; k < 900; k++) { g.hp = g.maxHp; if (g.cast) seen.add(g.cast.kind); A.tick(1); if (D.pools().length > pools0) seen.add('poolsDropped'); }
        o.seen = [...seen]; D.kill(g); D.sim(5); o.cleared = G.level.cleared;
      }
      out.push(o);
    }
    D.chars.ready = !!D.chars.tpl && !!D.chars.tpl.warrior;
    return out;
  });
  console.log('  guardians:', JSON.stringify(r3.slice(0, 5).map(o => ({ n: o.n, type: o.type, name: o.name, seen: o.seen }))));
  check(r3.every(o => o.ok && o.guardian && o.boss && o.cleared), 'guardians: all five spawn (rigged and primitive), are guardians with boss AI, and clear the level when killed');
  check(r3.slice(0, 5).every((o, i) => o.type === GTYPES[i]) && new Set(r3.map(o => o.name)).size === 5, `guardians: own types and names (${[...new Set(r3.map(o => o.name))].join(' | ')})`);
  const seenOf = n => r3[n - 1].seen;
  check(seenOf(2).includes('volley') && seenOf(3).includes('pools') && seenOf(3).includes('poolsDropped') && seenOf(4).includes('raise') && seenOf(5).length >= 4, `guardians: new abilities used (volley ${seenOf(2)}; pools ${seenOf(3)}; raise ${seenOf(4)}; Varrek ${seenOf(5)})`);

  // ---------- 4. Poison pools ----------
  const r4 = await page.evaluate(() => {
    const D = window.__dbg, G = D.G, P = D.P, S = D.S, A = window.A, out = {};
    D.newLevel(1); out.c1 = D.pools().length;
    A.fresh(3); const pool = D.pools()[0]; out.count = D.pools().length; out.visible = !!pool.g.parent; out.r = pool.r;
    P.invuln = 0; P.ward = null; P.life = S.maxLife; P.x = pool.x; P.z = pool.z; const l0 = P.life; D.sim(45); out.hurt = l0 - P.life;
    P.x = G.start.x; P.z = G.start.z; P.life = S.maxLife; D.sim(30); out.safe = S.maxLife - P.life; // away from every pool nothing hurts
    // A bloater's burst leaves a pool.
    const n0 = D.pools().length, b = D.spawnEnemy('bloater', -40, 0, null, 0); b.awake = false; D.kill(b); D.sim(20); out.burstPools = D.pools().length - n0;
    D.newLevel(2); out.c2 = D.pools().length; P.invuln = 1e9;
    return out;
  });
  check(r4.c1 === 0 && r4.c2 === 0 && r4.count > 0 && r4.visible, `pools: only levels with the hazard have them (${r4.count} in the Flooded Tombs, drawn in the scene)`);
  check(r4.hurt > 5 && r4.safe < 1, `pools: standing in one hurts the hero (${r4.hurt.toFixed(1)} life in 1.5 s), away from them nothing does (${r4.safe.toFixed(1)})`);
  check(r4.burstPools === 1, 'pools: a bloater bursting in the Flooded Tombs leaves a pool');

  // ---------- 5. Corpses ----------
  const r5 = await page.evaluate(() => {
    const D = window.__dbg, G = D.G, P = D.P, A = window.A, out = {};
    A.fresh(1);
    const z = D.spawnEnemy('zombie', -10, 10, null, 0); z.awake = false; D.kill(z); out.after1 = D.corpses().length; const c = D.corpses()[0]; out.fields = c && c.type === 'zombie' && c.rar === 0 && c.maxHp === z.maxHp && c.t > 5 && !!c.g;
    const nl = D.spawnEnemy('zombie', -12, 10, null, 0); nl.noLoot = true; D.kill(nl); const bl = D.spawnEnemy('bloater', -14, 10, null, 0); D.kill(bl); out.skipped = D.corpses().length === 1;
    const near = D.takeCorpse(-10.5, 10.2, 2), far = D.takeCorpse(0, 0, 2); out.take = !!near && near.type === 'zombie' && far === null && D.corpses().length === 0 && !near.g;
    for (let i = 0; i < 3; i++) { const e = D.spawnEnemy('runner', -20 + i, 10, null, 0); e.awake = false; D.kill(e); } out.three = D.corpses().length;
    D.sim(Math.ceil(12 / .033)); out.expired = D.corpses().length;
    for (let i = 0; i < 40; i++) { const e = D.spawnEnemy('runner', -20, 10, null, 0); e.awake = false; D.kill(e); } out.capped = D.corpses().length;
    D.newLevel(1); out.cleared = D.corpses().length;
    // teardown also empties allies and shrines (other systems fill them)
    D.G.allies.push({ x: 0, z: 0, hp: 1 }); D.G.shrines.push({ x: 0, z: 0 }); D.newLevel(1); out.allies = D.G.allies.length; out.shrines = D.G.shrines.length;
    // level hooks
    let s = 0, c2 = 0; D.levelHooks.start.push(() => s++); D.levelHooks.clear.push(() => c2++);
    D.newLevel(1); out.startHook = s; A.guardian(); D.kill(D.enemies().find(e => e.guardian)); D.sim(3); out.clearHook = c2; D.levelHooks.start.length = 0; D.levelHooks.clear.length = 0;
    return out;
  });
  check(r5.after1 === 1 && r5.fields && r5.skipped, 'corpses: a kill leaves a corpse (type, rarity, max HP, life); noLoot kills and bloaters leave none');
  check(r5.take, 'corpses: takeCorpse returns and removes the nearest corpse in range, null when none');
  check(r5.three === 3 && r5.expired === 0 && r5.capped <= 24 && r5.cleared === 0, `corpses: they expire (${r5.three} -> ${r5.expired}), are capped (${r5.capped}) and a new level clears them`);
  check(r5.allies === 0 && r5.shrines === 0 && r5.startHook === 1 && r5.clearHook === 1, 'levels: teardown empties allies and shrines; levelHooks.start runs once per level and .clear when the guardian dies');

  // ---------- 6. The necromancer ----------
  const r6 = await page.evaluate(() => {
    const D = window.__dbg, G = D.G, P = D.P, A = window.A, out = {};
    A.fresh(4);
    const mk = (x, z) => { const e = D.spawnEnemy('necro', x, z, null, 0); e.awake = true; e.revT = 0; return e; };
    // 1. A necromancer and a corpse: it channels, then a risen zombie appears.
    let nec = mk(0, 0); D.addCorpse({ x: 2, z: 1, type: 'zombie', rar: 0, maxHp: 100, r: .4 });
    const n0 = D.enemies().filter(e => e.type === 'zombie').length; D.sim(2);
    out.channel = !!nec.cast && nec.cast.kind === 'raise' && nec.cast.beams.length === 1; out.claimed = D.corpses().length === 1 && D.corpses()[0].claimed === true;
    out.priority = nec.priority === true; out.glow = !!nec.glowS;
    for (let i = 0; i < 80 && !D.enemies().some(e => e.revived); i++) D.sim(1);
    const risen = D.enemies().find(e => e.revived); out.revived = !!risen && risen.type === 'zombie' && risen.rar === 0 && risen.awake && risen.xp === 0;
    out.corpseGone = D.corpses().length === 0; out.zombies = D.enemies().filter(e => e.type === 'zombie').length - n0;
    out.beamGone = !nec.cast;
    // a risen monster leaves no corpse of its own
    D.kill(risen); out.noChain = D.corpses().length === 0; A.sweep();
    // 2. Killing the necromancer mid-channel stops the revive.
    nec = mk(0, 0); D.addCorpse({ x: 2, z: 1, type: 'zombie', rar: 0, maxHp: 100, r: .4 }); D.sim(2);
    out.channel2 = !!nec.cast; D.kill(nec); D.sim(Math.ceil(3 / .033));
    out.stopped = !D.enemies().some(e => e.revived && !e.deathT) && D.corpses().length === 1 && D.corpses()[0].claimed === false;
    A.sweep();
    // 3. Main's auto-target prefers the necromancer over a nearer zombie.
    G.obst = []; P.x = 0; P.z = 20; const z = D.spawnEnemy('zombie', 0, 16, null, 0), n3 = D.spawnEnemy('necro', 0, 12, null, 0); z.awake = n3.awake = true; z.hp = n3.hp = 1e9; z.maxHp = n3.maxHp = 1e9;
    out.target = D.mainTarget() === n3; A.sweep();
    return out;
  });
  console.log('  necro:', JSON.stringify(r6));
  check(r6.channel && r6.claimed && r6.priority && r6.glow, 'necro: with a corpse near it channels a revive (beam, claimed corpse), is a priority target and glows');
  check(r6.revived && r6.corpseGone && r6.zombies === 1 && r6.beamGone && r6.noChain, 'necro: the channel completes: the corpse rises as a normal, awake zombie (no xp, no corpse of its own)');
  check(r6.channel2 && r6.stopped, 'necro: killing it mid-channel cancels the revive (the corpse stays)');
  check(r6.target, "necro: Main's auto-target picks the necromancer over a nearer zombie");

  // ---------- 7. Waypoint: clearing saves the furthest level; locked levels; Trial awaits ----------
  const r7 = await page.evaluate(() => {
    const D = window.__dbg, G = D.G, P = D.P, A = window.A, out = {};
    D.start(true); P.invuln = 1e9; out.fresh = { crypt: G.crypt, wp: P.waypoint, open: document.getElementById('mWay').classList.contains('show') };
    out.lockedEnter = D.enterLevel(3); out.stillCrypt1 = G.crypt === 1;
    A.fresh(2); const g = A.guardian(); D.kill(g); D.sim(5);
    out.wp = P.waypoint; out.clears = P.clears; out.portal = !!G.portal; out.banner = document.getElementById('bT').textContent;
    P.x = G.portal.x; P.z = G.portal.z; D.sim(3);
    out.open = document.getElementById('mWay').classList.contains('show') && G.paused; out.rows = [...document.querySelectorAll('#mWay .wp')].map(b => b.disabled);
    out.saved = JSON.parse(localStorage.getItem('wd-arpg-1')).waypoint;
    return out;
  });
  check(r7.fresh.crypt === 1 && r7.fresh.wp === 0 && !r7.fresh.open && !r7.lockedEnter && r7.stillCrypt1, 'waypoint: a fresh character enters Crypt 1 directly; locked levels cannot be entered');
  check(r7.wp === 2 && r7.clears === 1 && r7.portal && r7.saved === 2 && r7.open, `waypoint: killing Crypt 2's guardian sets the waypoint to ${r7.wp} (saved ${r7.saved}) and the portal opens the waypoint screen`);
  console.log('  waypoint rows disabled:', JSON.stringify(r7.rows));
  await page.reload({ waitUntil: 'load' }); await ready(); await install();
  const label = await page.evaluate(() => document.getElementById('goCont').textContent);
  const r7b = await page.evaluate(() => {
    const D = window.__dbg, G = D.G, P = D.P, out = {};
    D.start(false); out.open = document.getElementById('mWay').classList.contains('show') && G.paused; out.wp = P.waypoint; out.clears = P.clears;
    out.rows = [...document.querySelectorAll('#mWay .wp')].map(b => ({ locked: b.disabled, done: b.classList.contains('done'), next: b.classList.contains('next') }));
    out.noBack = document.getElementById('wpBackBtn') === null;
    const row3 = document.querySelector('#mWay .wp[data-n="3"]'); out.sub = document.getElementById('wpSub').textContent;
    window.__shotRow = row3; out.lock4 = D.enterLevel(4); out.still = document.getElementById('mWay').classList.contains('show');
    row3.click(); out.entered = G.crypt === 3 && G.level.name === 'Flooded Tombs' && !document.getElementById('mWay').classList.contains('show') && !G.paused;
    out.back = D.enterLevel(1) && G.crypt === 1; out.again = D.enterLevel(3) && G.level.crypt === 3;
    return out;
  });
  check(/CRYPT 2 REACHED/.test(label), `waypoint: the Continue button reads "${label}"`);
  check(r7b.open && r7b.wp === 2 && r7b.clears === 1 && r7b.noBack, 'waypoint: after a reload, Continue opens the waypoint screen with the saved progress');
  check(r7b.rows.map(r => r.locked).join() === 'false,false,false,true,true' && r7b.rows.filter(r => r.done).length === 2 && r7b.rows[2].next, 'waypoint: Crypt 1-2 cleared, Crypt 3 unlocked, Crypt 4-5 locked');
  check(!r7b.lock4 && r7b.still && r7b.entered && r7b.back && r7b.again, 'waypoint: a locked level will not start; tapping Crypt 3 enters it (and closes the screen); lower Crypts can be replayed');

  // ---------- 8. Leaving a level keeps everything earned ----------
  const r8 = await page.evaluate(() => {
    const D = window.__dbg, G = D.G, P = D.P, A = window.A, out = {};
    D.start(true); D.kit(); P.invuln = 1e9; D.newLevel(1);
    for (let i = 0; i < 3; i++) D.dropItem(P.x, P.z, .5); D.sim(40); if (P.inv.length) D.equip(0);
    D.ctl.auto = true; A.tick(300, true); D.ctl.auto = false; D.ctl.mx = D.ctl.mz = 0; D.gainAP(25); P.xp += 5;
    const snap = () => JSON.stringify({ lvl: P.lvl, xp: Math.round(P.xp * 1e3), gear: P.gear, inv: P.inv, gems: P.gems });
    out.before = snap(); out.kills = P.kills; out.hadGear = Object.values(P.gear).filter(Boolean).length;
    document.getElementById('bMenu').click(); const leave = document.getElementById('goLeave'); out.leaveShown = leave.style.display !== 'none';
    leave.click();
    out.open = document.getElementById('mWay').classList.contains('show') && G.paused && !document.getElementById('mMenu').classList.contains('show'); out.after = snap();
    out.back = !!document.getElementById('wpBackBtn'); out.saved = !!localStorage.getItem('wd-arpg-1');
    return out;
  });
  check(r8.leaveShown && r8.open && r8.back, 'leave: the menu offers LEAVE LEVEL mid-level and it opens the waypoint screen (with a way back)');
  check(r8.before === r8.after && r8.hadGear > 0 && r8.kills > 0, `leave: XP, gear, items and gem AP are untouched (${r8.kills} kills, ${r8.hadGear} gear pieces)`);
  await page.reload({ waitUntil: 'load' }); await ready(); await install();
  const r8b = await page.evaluate(() => {
    const D = window.__dbg, P = D.P; D.start(false);
    return JSON.stringify({ lvl: P.lvl, xp: Math.round(P.xp * 1e3), gear: P.gear, inv: P.inv, gems: P.gems });
  });
  check(r8b === r8.before, 'leave: XP, gear, items and gem AP are still the same after a reload and Continue');

  // ---------- 9. Autopilot smoke runs of every Crypt, and Crypt 5 ends with "The Trial awaits" ----------
  const r9 = await page.evaluate(() => {
    const D = window.__dbg, G = D.G, P = D.P, A = window.A, out = { ran: [] };
    D.start(true); D.kit(); P.invuln = 1e9;
    for (let n = 1; n <= 5; n++) { D.newLevel(n); D.ctl.auto = true; A.tick(700, true); D.ctl.auto = false; D.ctl.mx = D.ctl.mz = 0; out.ran.push([n, P.kills, D.enemies().length]); }
    A.fresh(5); const g = A.guardian(); D.kill(g); D.sim(5);
    out.banner = document.getElementById('bT').textContent; out.sub = document.getElementById('bS').textContent; out.wp = P.waypoint;
    P.x = G.portal.x; P.z = G.portal.z; D.sim(3);
    out.trial = /THE TRIAL AWAITS/.test(document.getElementById('wpTrial').textContent); out.rows = [...document.querySelectorAll('#mWay .wp')].map(b => b.disabled);
    out.replay = D.enterLevel(5) && G.crypt === 5;
    return out;
  });
  console.log('  smoke runs [crypt, kills, alive]:', JSON.stringify(r9.ran));
  check(r9.ran.every(([, k]) => k > 0), 'levels: the autopilot fights its way through the start of every Crypt');
  check(r9.wp === 5 && /LEVEL CLEARED/.test(r9.banner) && /Trial awaits/.test(r9.sub) && r9.trial && r9.rows.every(d => !d) && r9.replay, `waypoint: clearing Crypt 5 says "${r9.sub}" and the screen announces the Trial; Crypt 5 can be replayed`);

  // ---------- Screenshots ----------
  if (SHOT) {
    const base = SHOT.replace(/\.png$/, ''), shot = async name => { await new Promise(r => setTimeout(r, 900)); await page.screenshot({ path: `${base}-${name}.png` }); };
    await page.evaluate(() => { const D = window.__dbg; D.P.waypoint = 2; D.P.lvl = Math.max(D.P.lvl, 4); D.openWaypoint(); });
    await shot('waypoint');
    await page.evaluate(() => { document.getElementById('mWay').classList.remove('show'); });
    // A necromancer channelling a revive in the Bone Gardens, with the hero near.
    await page.evaluate(() => {
      const D = window.__dbg, G = D.G, P = D.P, A = window.A; D.start(true); D.kit(); A.fresh(4);
      const ux = -Math.sign(G.start.x), uz = -Math.sign(G.start.z), at = (a, b) => [P.x + ux * a, P.z + uz * b];
      const [nx, nz] = at(7, 1); const nec = D.spawnEnemy('necro', nx, nz, null, 0); nec.awake = true; nec.revT = 0; nec.face = Math.atan2(P.x - nx, P.z - nz);
      for (const [a, b, t] of [[5.2, 3.2, 'zombie'], [8.8, 3.6, 'zombie'], [8, -1.8, 'runner']]) { const [x, z] = at(a, b); D.addCorpse({ x, z, type: t, rar: 0, maxHp: 100, r: .4 }); }
      for (let i = 0; i < 4; i++) { const [x, z] = at(11 + i, 4 - i * 2); const e = D.spawnEnemy('zombie', x, z, null, 0); e.awake = true; }
      D.sim(20); P.face = Math.atan2(nx - P.x, nz - P.z); G.paused = true; window.__necro = !!nec.cast;
    });
    await shot('necro');
    await page.evaluate(() => { window.__dbg.G.paused = false; });
  }

  check(errors.length === 0, `levels: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  await page.close();
}

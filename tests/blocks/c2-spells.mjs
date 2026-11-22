// Workstream C2: Flame Totem, Arc, Meteor, Ice Trap and Corpse Explosion (game/spells.js), each from Flex A and Flex B.
// Tests drive the game with D.kit (bypasses unlocks) and D.sim ticks; Main is kept off with P.cd.main unless a test wants it.
export default async function ({ open, check, SEED, SHOT }) {
  const { page, errors } = await open('/');
  await page.evaluate(() => {
    const D = window.__dbg, P = D.P;
    window.C = {
      // A clean slate: new level, no monsters/corpses, hero invulnerable, a free direction found (this.dir = [dx, dz]) for placing targets.
      fresh(spec) {
        D.start(true); D.newLevel(1); D.packs().forEach(p => { p.spawned = true; });
        for (const e of D.enemies()) { e.noLoot = true; D.kill(e); } D.sim(100); while (D.takeCorpse(0, 0, 1e4));
        D.kit(spec); P.invuln = 1e9; P.life = D.S.maxLife; P.cd.main = 1e9; for (const k of ['flexA', 'flexB']) P.cd[k] = 0;
        let best = null, bl = -1;
        for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28, dx = Math.sin(a), dz = Math.cos(a); let l = 0; while (l < 14 && D.los(P.x, P.z, P.x + dx * (l + 1), P.z + dz * (l + 1)) && !D.blocked(P.x + dx * (l + 1), P.z + dz * (l + 1), .6)) l++; if (l > bl) { bl = l; best = [dx, dz]; } }
        this.dir = best; this.room = bl;
      },
      at(d, side = 0) { return [P.x + this.dir[0] * d - this.dir[1] * side, P.z + this.dir[1] * d + this.dir[0] * side]; },
      // A sturdy, awake-but-stationary enemy (speed 0) so it stays where it is put.
      mob(d, side = 0, type = 'zombie') { const [x, z] = this.at(d, side), e = D.spawnEnemy(type, x, z); e.hp = e.maxHp = 5000; e.spd = 0; e.awake = true; e.noLoot = true; return e; },
      settle() { D.sim(1); }, // the monster hash is rebuilt in update(): newly spawned enemies are findable after one tick
      tick(n) { for (let i = 0; i < n; i++) { P.life = D.S.maxLife; for (const e of D.enemies()) if (!e.deathT && e.hp < 1000) e.hp = e.maxHp; D.sim(1); } },
      dmg(es) { return es.map(e => Math.round(e.maxHp - e.hp)); },
    };
  });
  const run = (fn, ...a) => page.evaluate(`(${fn})(...${JSON.stringify(a)})`);

  // ---------- Flame Totem ----------
  for (const slot of ['flexA', 'flexB']) {
    const r = await run((slot) => {
      const D = window.__dbg, P = D.P, C = window.C, out = {};
      C.fresh({ [slot]: 'flameTotem', lvl: 1 });
      const e = C.mob(7); out.room = C.room;
      out.cast = D.castSlot(slot); out.cd = P.cd[slot];
      const t = D.allies().find(a => a.kind === 'totem'); out.totem = !!t && t.sk === 'flameTotem' && t.taunt === 0 && t.hp > 0 && t.t > 5;
      out.near = t && Math.hypot(t.x - P.x, t.z - P.z);
      P.x -= C.dir[0] * 2; P.z -= C.dir[1] * 2; // the hero stands away from it, Main empty
      C.tick(60); out.dmg = e.maxHp - e.hp; out.bolts = D.spellState().bolts;
      out.recast = D.castSlot(slot); // on cooldown
      P.cd[slot] = 0; D.castSlot(slot); out.one = D.allies().filter(a => a.kind === 'totem' && !a.gone).length;
      D.sim(400); out.expired = D.allies().filter(a => a.kind === 'totem' && !a.gone).length;
      return out;
    }, slot);
    check(r.cast && r.cd > 0 && r.totem && r.near < 4, `totem(${slot}): plants a taunt-0 ally totem near the hero, cooldown spent (near ${r.near && r.near.toFixed(1)})`);
    check(r.dmg > 5, `totem(${slot}): shoots a target with the hero away and Main empty (dmg ${r.dmg && r.dmg.toFixed(0)})`);
    check(!r.recast && r.one === 1, `totem(${slot}): cooldown holds, one totem at level 1 (${r.one})`);
    check(r.expired === 0, `totem(${slot}): expires after its time`);
  }
  {
    const r = await run(() => {
      const D = window.__dbg, P = D.P, C = window.C, out = {};
      C.fresh({ flexA: 'flameTotem', lvl: 5 });
      for (let i = 0; i < 3; i++) { P.cd.flexA = 0; D.castSlot('flexA'); D.sim(2); }
      out.two = D.allies().filter(a => a.kind === 'totem' && !a.gone).length;
      const t = D.allies().find(a => a.kind === 'totem'); D.hurtAlly(t, 1e9); out.broken = t.gone; return out; // a monster can break it
    });
    check(r.two === 2 && r.broken, `totem: two totems at lv5, the third replaces the oldest (${r.two}); a totem can be destroyed`);
  }

  // ---------- Arc ----------
  for (const slot of ['flexA', 'flexB']) {
    const r = await run((slot) => {
      const D = window.__dbg, P = D.P, C = window.C, out = {};
      C.fresh({ [slot]: 'arc', lvl: 1 });
      out.empty = [D.castSlot(slot), P.cd[slot]];
      const es = [C.mob(4), C.mob(6, 1.5), C.mob(8, -1), C.mob(10, 0.5), C.mob(12, 0)]; C.settle();
      out.cast = D.castSlot(slot); out.cd = P.cd[slot]; out.again = D.castSlot(slot);
      out.hit = C.dmg(es).filter(d => d > 0).length;
      D.kit({ [slot]: 'arc', lvl: 5 }); P.cd[slot] = 0; for (const e of es) e.hp = e.maxHp; D.castSlot(slot);
      out.hit5 = C.dmg(es).filter(d => d > 0).length;
      return out;
    }, slot);
    check(!r.empty[0] && r.empty[1] === 0, `arc(${slot}): no target, no cast, no cooldown`);
    check(r.cast && r.cd > 0 && !r.again, `arc(${slot}): casts and respects its cooldown (cd ${r.cd && r.cd.toFixed(2)})`);
    check(r.hit === 4 && r.hit5 === 5, `arc(${slot}): chains to 4 enemies (3 jumps), 5 at lv5 (${r.hit}, ${r.hit5})`);
  }

  // ---------- Meteor ----------
  for (const slot of ['flexA', 'flexB']) {
    const r = await run((slot) => {
      const D = window.__dbg, P = D.P, C = window.C, out = {};
      C.fresh({ [slot]: 'meteor', lvl: 1 });
      out.empty = [D.castSlot(slot), P.cd[slot]];
      const lone = C.mob(5, 6), pack = [C.mob(9), C.mob(10, 1), C.mob(10.5, -1), C.mob(11, .2)]; // the pack is the densest group
      out.cast = D.castSlot(slot); out.cd = P.cd[slot];
      const st = D.spellState(); out.meteors = st.meteors; out.spot = st.meteorList[0] && Math.hypot(st.meteorList[0].x - pack[0].x, st.meteorList[0].z - pack[0].z);
      out.telegraph = D.G.effects.length > 0;
      C.tick(15); out.early = C.dmg([...pack, lone]).reduce((a, b) => a + b, 0); // 0.5 s: nothing yet
      C.tick(25); out.late = C.dmg(pack); out.lone = C.dmg([lone])[0];
      out.patch = D.G.patches.length;
      // an enemy that walks out before it lands is spared
      P.cd[slot] = 0; for (const e of [...pack, lone]) e.x += 40; const w = C.mob(9, 6); C.settle(); D.castSlot(slot); C.tick(10); w.x += 8; w.z += 8; C.tick(30); out.walked = C.dmg([w])[0];
      return out;
    }, slot);
    check(!r.empty[0] && r.empty[1] === 0, `meteor(${slot}): no enemies, no cast, no cooldown`);
    check(r.cast && r.cd > 0 && r.meteors === 1 && r.spot < 4 && r.telegraph, `meteor(${slot}): targets the densest pack with a telegraph (${r.spot && r.spot.toFixed(1)} off)`);
    check(r.early === 0, `meteor(${slot}): no damage before the delay`);
    check(r.late.every(d => d > 50) && r.lone === 0 && r.patch >= 1, `meteor(${slot}): the pack takes big damage after the delay, burning ground left (${r.late}; lone ${r.lone})`);
    check(r.walked === 0, `meteor(${slot}): an enemy that walked out is spared`);
  }

  // ---------- Ice Trap ----------
  for (const slot of ['flexA', 'flexB']) {
    const r = await run((slot) => {
      const D = window.__dbg, P = D.P, C = window.C, out = {};
      C.fresh({ [slot]: 'iceTrap', lvl: 1 });
      const far = C.mob(9, 0), e = C.mob(6, 4);
      out.cast = D.castSlot(slot); out.cd = P.cd[slot];
      let st = D.spellState(); out.traps = st.traps; const T0 = st.trapList[0];
      for (const m of [far, e]) { m.x = T0.x + 9; m.z = T0.z + 9; } // keep the dummies well clear of the trigger
      out.armed0 = T0.armed; C.tick(25); out.armed1 = D.spellState().trapList[0].armed;
      C.tick(40); out.quiet = [D.spellState().traps, C.dmg([far, e])];
      e.x = T0.x + .6; e.z = T0.z; C.tick(3); // steps in
      out.burst = D.spellState().traps; out.dmg = C.dmg([e])[0]; out.freeze = e.freeze; out.sk = e.freezeSk;
      for (let i = 0; i < 5; i++) { P.cd[slot] = 0; D.castSlot(slot); C.tick(1); } // up to three
      out.max = D.spellState().traps;
      D.sim(700); out.expired = D.spellState().traps;
      return out;
    }, slot);
    check(r.cast && r.cd > 0 && r.traps === 1 && !r.armed0 && r.armed1, `icetrap(${slot}): throws a trap that arms after a moment`);
    check(r.quiet[0] === 1 && r.quiet[1].every(d => d === 0), `icetrap(${slot}): stays quiet with no enemy near`);
    check(r.burst === 0 && r.dmg > 10 && r.freeze > 0 && r.sk === 'iceTrap', `icetrap(${slot}): bursts when stepped on: damage ${r.dmg && r.dmg.toFixed(0)}, freeze ${r.freeze && r.freeze.toFixed(1)}, freezeSk ${r.sk}`);
    check(r.max === 3 && r.expired === 0, `icetrap(${slot}): at most 3 out (${r.max}), expire after their time (${r.expired})`);
  }

  // ---------- Corpse Explosion ----------
  for (const slot of ['flexA', 'flexB']) {
    const r = await run((slot) => {
      const D = window.__dbg, P = D.P, C = window.C, out = {};
      C.fresh({ [slot]: 'corpseExplosion', lvl: 1 });
      const es = [C.mob(7), C.mob(8, 1.2), C.mob(7, -1.5)]; C.settle();
      out.none = [D.castSlot(slot), P.cd[slot]];
      const [cx, cz] = C.at(7.5);
      D.addCorpse({ x: cx, z: cz, type: 'zombie', rar: 0, maxHp: 400, r: .4 }); D.addCorpse({ x: cx + 40, z: cz + 40, type: 'zombie', rar: 0, maxHp: 400, r: .4 });
      out.corpses0 = D.corpses().length;
      out.cast = D.castSlot(slot); out.cd = P.cd[slot]; out.corpses1 = D.corpses().length; out.dmg = C.dmg(es);
      C.fresh({ [slot]: 'corpseExplosion', lvl: 5 }); // lv5 takes two
      for (let i = 0; i < 3; i++) D.addCorpse({ x: P.x + 2 + i, z: P.z, type: 'zombie', rar: 0, maxHp: 200, r: .4 });
      D.castSlot(slot); out.left5 = D.corpses().length;
      return out;
    }, slot);
    check(!r.none[0] && r.none[1] === 0, `corpse(${slot}): no corpse nearby fails without spending the cooldown`);
    check(r.cast && r.cd > 0 && r.corpses1 === r.corpses0 - 1 && r.dmg.some(d => d > 100), `corpse(${slot}): consumes a corpse and damages enemies around it (${r.dmg})`);
    check(r.left5 === 1, `corpse(${slot}): two corpses at lv5 (${r.left5} of 3 left)`);
  }

  // ---------- Main, and Heart of the Storm's free Arc ----------
  {
    const r = await run(() => {
      const D = window.__dbg, P = D.P, C = window.C, out = {};
      C.fresh({ main: 'arc', lvl: 1 }); P.cd.main = 0; const e = C.mob(6);
      for (let i = 0; i < 40; i++) { P.life = D.S.maxLife; D.sim(1); } out.arcMain = e.maxHp - e.hp;
      C.fresh({ main: 'corpseExplosion', lvl: 1 }); P.cd.main = 0; C.mob(6); out.ceMainNoCorpse = D.castSlot('main');
      C.fresh({ main: 'flameTotem', lvl: 1 }); P.cd.main = 0; C.mob(6); D.sim(60); out.totemMain = D.allies().filter(a => a.kind === 'totem').length;
      C.fresh({ main: 'fireball', lvl: 1 }); const m = C.mob(5); const h0 = m.hp; D.castArc(P.x, P.z, true); out.free = h0 - m.hp; // free arc: the Arc gem's level (1 if not owned)
      return out;
    });
    check(r.arcMain > 20, `main: Arc in Main fires on its short rate (${r.arcMain && r.arcMain.toFixed(0)} dmg in 1.3 s)`);
    check(r.ceMainNoCorpse === false && r.totemMain === 1, `main: Corpse Explosion needs a corpse, Flame Totem works from Main (${r.totemMain})`);
    check(r.free > 0, `arc: Heart of the Storm's free castArc still works (${r.free && r.free.toFixed(0)})`);
  }

  // ---------- screenshot: totem and a meteor / trap fight ----------
  if (SHOT) {
    await run(() => {
      const D = window.__dbg, P = D.P, C = window.C; C.fresh({ flexA: 'flameTotem', flexB: 'meteor', main: 'iceTrap', lvl: 5 });
      for (const [d, s] of [[6, 0], [7, 1.5], [7.5, -1.2], [8, .4]]) C.mob(d, s);
      C.settle();
      D.castSlot('flexA'); D.sim(20); P.cd.flexB = 0; D.castSlot('flexB'); D.sim(20); P.cd.main = 0; D.castSlot('main'); D.sim(25); document.getElementById('banner').style.opacity = 0;
    });
    await page.screenshot({ path: SHOT.replace(/\.png$/, '-totem.png') });
  }

  check(errors.length === 0, `c2: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  await page.close();
}

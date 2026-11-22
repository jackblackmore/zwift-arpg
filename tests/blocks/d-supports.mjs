// Workstream D: support gems (Split, Pierce, Shatter, Conduit, Ignite, Chain Reaction, Swift Cast) change only their socketed skill,
// and skill gems drop as loot (guardian: one guaranteed; elites and beats: a small chance; picking up never needs bag space).
export default async function ({ open, check, SEED, SHOT }) {
  const { page, errors } = await open('/');
  await page.evaluate(() => {
    const D = window.__dbg, P = D.P, G = D.G;
    window.W = {
      // an enemy that stands still, hits for nothing and (by default) survives anything
      // offsets are rotated so every test spot is open floor (walls would shove a monster somewhere else)
      rot: 0, spots: [[2, 0], [3.2, 0], [12, 0], [5, 20], [5, 3], [5, 5.5], [-5, 0], [-5, 2], [8, 0], [6, 0], [5.8, 0], [4, 0], [7, 0]],
      // looks for an origin and angle where all spots are open floor inside the map, and puts the hero on the origin
      face() { for (const [ox, oz] of [[P.x, P.z], [0, 0], [-18, 18], [18, 18], [-18, -18], [18, -18], [0, 20], [0, -20]]) for (let k = 0; k < 32; k++) {
        const a = k / 32 * 6.283, c = Math.cos(a), s = Math.sin(a), at = ([x, z]) => [ox + x * c - z * s, oz + x * s + z * c];
        if (this.spots.every(sp => { const [X, Z] = at(sp); return Math.abs(X) < 30 && Math.abs(Z) < 30 && !D.blocked(X, Z, 1.2); })) { P.x = ox; P.z = oz; return (this.rot = a); } } return (this.rot = 0); },
      mk(x, z, hp = 1e7, rar = 0) { const c = Math.cos(this.rot), s = Math.sin(this.rot); [x, z] = [x * c - z * s, x * s + z * c]; const e = D.spawnEnemy('zombie', P.x + x, P.z + z, null, rar); e.hp = e.maxHp = hp; e.spd = 0; e.dmg = 0; e.awake = true; return e; },
      clear() { for (const e of D.enemies()) { e.noLoot = true; D.kill(e); } D.sim(60); G.queue = []; G.proj.forEach(p => { p.dead = true; p.g.parent && p.g.parent.remove(p.g); }); G.proj = []; },
      tick(n) { for (let i = 0; i < n; i++) { P.life = D.S.maxLife; P.cd.main = 1e9; D.sim(1); } },
      kit(spec) { D.kit(spec); D.recalc(); P.invuln = 1e9; P.cd.main = 1e9; this.face(); this.clear(); },
      gems: () => D.G.ground.filter(d => d.gem && !d.gone),
    };
    D.start(true); P.invuln = 1e9; window.W.face();
  });

  // ---------- Split / Pierce / Swift Cast: only the socketed skill ----------
  {
    const r = await page.evaluate(() => {
      const D = window.__dbg, W = window.W, P = D.P, G = D.G, o = {};
      const fire = () => { G.proj = []; D.castFireball(P.x + 6, P.z); return G.proj.map(p => ({ pierce: p.pierce, mult: p.mult })); };
      W.kit({ main: 'fireball', flexA: 'nova', sup: { main: ['split'] } });
      o.splitMain = fire(); o.cnt = [D.projCount('fireball'), D.projCount('nova'), D.projCount('frostLance'), D.projCount('arc')];
      W.kit({ main: 'fireball', flexA: 'nova' }); o.plain = fire();
      W.kit({ main: 'nova', flexA: 'fireball', sup: { flexA: ['split'] } }); o.splitFlex = fire(); o.cntFlex = [D.projCount('fireball'), D.projCount('nova')];
      W.kit({ main: 'frostLance', flexA: 'fireball', sup: { main: ['split'] } }); o.moved = [D.projCount('frostLance'), D.projCount('fireball')]; // the effect moves with the socket
      W.kit({ main: 'fireball', sup: { main: ['split'] }, lvl: 10 }); o.lessLv10 = fire()[0].mult;
      W.kit({ main: 'fireball', sup: { main: ['pierce'] } }); o.pierce1 = fire().map(p => p.pierce); o.pc = [D.pierceCount('fireball'), D.pierceCount('nova')];
      W.kit({ main: 'fireball', sup: { main: ['pierce'] }, lvl: 10 }); o.pierce10 = D.pierceCount('fireball');
      W.kit({ main: 'fireball', flexA: 'nova' }); o.pierce0 = fire().map(p => p.pierce);
      // Swift Cast: only its skill's cooldown shrinks
      W.kit({ main: 'fireball', flexA: 'nova', flexB: 'frostLance', sup: { flexA: ['swiftCast'] } });
      P.cd.flexA = 0; D.castSlot('flexA'); o.cdSwift = P.cd.flexA;
      W.kit({ main: 'fireball', flexA: 'nova' }); P.cd.flexA = 0; D.castSlot('flexA'); o.cdPlain = P.cd.flexA;
      return o;
    });
    console.log('  supports split/pierce/swift:', JSON.stringify(r));
    check(r.splitMain.length === 3 && r.splitMain.every(p => Math.abs(p.mult - .75) < 1e-9) && r.plain.length === 1 && r.plain[0].mult === 1, `supports: Split on Fireball fires three projectiles at 25% less damage, plain Fireball fires one (${r.splitMain.length}/${r.plain.length})`);
    check(r.cnt.join() === '2,0,0,0', `supports: Split on Main (Fireball) changes only Fireball (${r.cnt})`);
    check(r.splitFlex.length === 3 && r.cntFlex.join() === '2,0', `supports: Split in Flex A works on Fireball there (${r.splitFlex.length})`);
    check(r.moved.join() === '2,0', `supports: moving Split to another projectile skill's slot moves the effect (${r.moved})`);
    check(Math.abs(r.lessLv10 - .85) < 1e-9, `supports: Split gets better with level (lv10 ${r.lessLv10})`);
    check(r.pierce1.join() === '1' && r.pc.join() === '1,0' && r.pierce10 === 2 && r.pierce0.join() === '0', `supports: Pierce is +1 at lv1 and +2 at lv10, only for its skill (${r.pierce1}; ${r.pc}; ${r.pierce10}; plain ${r.pierce0})`);
    check(r.cdSwift > 0 && Math.abs(r.cdSwift / r.cdPlain - .85) < 1e-6, `supports: Swift Cast shortens its skill's cooldown by 15% at lv1 (${r.cdSwift.toFixed(2)} vs ${r.cdPlain.toFixed(2)})`);
  }

  // ---------- Ignite ----------
  {
    const r = await page.evaluate(() => {
      const D = window.__dbg, W = window.W, P = D.P, o = {};
      W.kit({ main: 'fireball', flexA: 'arc', sup: { main: ['ignite'] } });
      let a = W.mk(5, 0), b = W.mk(-5, 0), c = W.mk(0, 5);
      const d = D.hit(a, 1, 'fire', { sk: 'fireball' }); o.ign = [a.burnT, a.burnDps / d];
      D.hit(b, 1, 'fire', { sk: 'arc' }); o.other = [b.burnT, b.burnDps]; // a fire hit from a skill without Ignite
      D.hit(c, 1, 'fire', { sk: 'burn', dot: 1 }); o.dot = c.burnT;
      W.clear();
      // a real Fireball explosion burns, one with Ignite moved away doesn't
      a = W.mk(8, 0); D.sim(1); D.castFireball(a.x, a.z); D.sim(40); o.real = [a.burnT > 0 || a.burnDps > 0, a.hp < a.maxHp];
      W.clear(); W.kit({ main: 'fireball', flexA: 'arc' }); a = W.mk(8, 0); D.sim(1); D.castFireball(a.x, a.z); D.sim(40); o.realPlain = [a.burnT > 0, a.hp < a.maxHp];
      W.clear();
      return o;
    });
    console.log('  supports ignite:', JSON.stringify(r));
    check(r.ign[0] === 3 && Math.abs(r.ign[1] - .2) < 1e-6, `supports: Ignite burns fire hits for 60% of the hit over 3s (${r.ign})`);
    check(r.other.join() === '0,0' && r.dot === 0, 'supports: Ignite does nothing for other skills or damage-over-time ticks');
    check(r.real[0] && r.real[1] && !r.realPlain[0] && r.realPlain[1], `supports: a socketed Fireball burns what it hits, an unsupported one only damages (${r.real}; ${r.realPlain})`);
  }

  // ---------- Shatter ----------
  {
    const r = await page.evaluate(() => {
      const D = window.__dbg, W = window.W, P = D.P, o = {};
      const run = (spec, freezer) => {
        W.kit(spec);
        const A = W.mk(2, 0, 1000), B = W.mk(3.2, 0), C = W.mk(12, 0); D.sim(1);
        if (freezer) D.applyFreeze(A, 2, freezer); else D.castNova();
        A.hp = 1; const b0 = B.hp; D.hit(A, 1, 'fire', { sk: 'fireball' }); D.sim(3);
        const out = { sk: A.freezeSk, bLoss: b0 - B.hp, bFrozen: B.freeze > 0, c: C.hp === C.maxHp };
        W.clear(); return out;
      };
      o.shat = run({ main: 'fireball', flexA: 'nova', sup: { flexA: ['shatter'] } });
      o.plain = run({ main: 'fireball', flexA: 'nova' });
      o.otherSkill = run({ main: 'fireball', flexA: 'nova', sup: { flexA: ['shatter'] } }, 'frostLance'); // frozen by a skill that has no Shatter
      return o;
    });
    console.log('  supports shatter:', JSON.stringify(r));
    check(r.shat.sk === 'nova' && Math.abs(r.shat.bLoss - 250) < 20 && r.shat.bFrozen && r.shat.c, `supports: an enemy frozen by socketed Nova explodes on death, hurting and freezing a neighbour (${r.shat.bLoss.toFixed(0)} dmg)`);
    check(r.plain.bLoss === 0 && r.otherSkill.bLoss === 0, `supports: no Shatter without the support, nor for enemies frozen by another skill (${r.plain.bLoss}; ${r.otherSkill.bLoss})`);
  }

  // ---------- Conduit ----------
  {
    const r = await page.evaluate(() => {
      const D = window.__dbg, W = window.W, P = D.P, o = {};
      W.kit({ main: 'fireball', flexA: 'arc', sup: { flexA: ['conduit'] } });
      let a = W.mk(5, 0), b = W.mk(5, 3), c = W.mk(5, 20), f = W.mk(-5, 0), f2 = W.mk(-5, 2); D.sim(1);
      D.hit(a, 1, 'light', { sk: 'arc' }); o.hit = [a.shock, b.shock, c.shock];
      D.hit(f, 1, 'light', { sk: 'fireball' }); o.other = [f.shock, f2.shock]; // lightning damage from a skill with no Conduit
      W.clear();
      a = W.mk(5, 0); b = W.mk(5, 3); c = W.mk(5, 5.5); D.sim(1); D.castArc(P.x, P.z, true); o.arc = [a.shock > 0, b.shock > 0, c.shock > 0]; // every Arc hit shocks
      W.clear(); W.kit({ main: 'fireball', flexA: 'arc' }); a = W.mk(5, 0); b = W.mk(5, 3); D.sim(1); D.hit(a, 1, 'light', { sk: 'arc' }); o.plain = [a.shock, b.shock];
      W.clear();
      return o;
    });
    console.log('  supports conduit:', JSON.stringify(r));
    check(r.hit[0] >= 3 && r.hit[1] >= 3 && r.hit[2] === 0, `supports: Conduit shocks the hit enemy and spreads to a nearby one (${r.hit})`);
    check(r.other.join() === '0,0' && r.plain.join() === '0,0', 'supports: lightning from a skill without Conduit does not shock');
    check(r.arc.every(Boolean), `supports: every hit of a real Arc cast shocks with Conduit (${r.arc})`);
  }

  // ---------- Chain Reaction ----------
  {
    const r = await page.evaluate(() => {
      const D = window.__dbg, W = window.W, G = D.G, o = {};
      const booms = () => G.queue.filter(q => q.k === 'boom').length;
      const kills = (sk, n) => { G.queue = []; let c = 0; for (let i = 0; i < n; i++) { const e = W.mk(5, 0, 5); e.noCorpse = true; D.hit(e, 100, 'fire', { sk }); } c = booms(); G.queue = []; W.clear(); return c; };
      W.kit({ main: 'fireball', flexA: 'nova', sup: { main: ['chainReaction'] } });
      o.fireball = kills('fireball', 100); o.nova = kills('nova', 100); o.burn = kills('burn', 100); // burning ground counts as Fireball
      // a Chain Reaction blast's own kills never chain
      G.queue = []; for (let i = 0; i < 100; i++) W.mk(5, 0, 5);
      D.sim(1); const es = D.enemies().filter(e => !e.deathT);
      D.explode(es[0].x, es[0].z, 100, false, true, 'fireball', true); o.boomKills = es.filter(e => e.deathT).length; o.boomChain = booms(); G.queue = []; W.clear();
      // killed enemies explode for real: the neighbour is hurt
      W.kit({ main: 'fireball', sup: { main: ['chainReaction'] }, lvl: 10 }); // 40% at lv10
      let hurt = 0; for (let i = 0; i < 30; i++) { const a = W.mk(5, 0, 5), b = W.mk(5.8, 0); D.sim(1); D.hit(a, 100, 'fire', { sk: 'fireball' }); D.sim(2); if (b.hp < b.maxHp) hurt++; W.clear(); }
      o.hurt = hurt;
      return o;
    });
    console.log('  supports chain reaction:', JSON.stringify(r));
    check(r.fireball >= 12 && r.fireball <= 40 && r.burn >= 12 && r.nova === 0, `supports: Chain Reaction explodes ~25% of its skill's kills and none of other skills' (fireball ${r.fireball}/100, burn ${r.burn}/100, nova ${r.nova}/100)`);
    check(r.boomKills >= 1 && r.boomChain === 0, `supports: a Chain Reaction blast's kills do not chain again (${r.boomKills} killed, ${r.boomChain} queued)`);
    check(r.hurt >= 5, `supports: a Chain Reaction explosion hurts a neighbour (${r.hurt}/30 at lv10)`);
  }

  // ---------- AP, old-save notables ----------
  {
    const r = await page.evaluate(() => {
      const D = window.__dbg, P = D.P, o = {};
      D.kit({ main: 'fireball', sup: { main: ['split'] } }); D.gainAP(10); o.ap = P.gems.map(g => g.id + ':' + g.ap).join();
      // an old save's notables become support gems; socketed in Fireball's slot they act (Twin Flame = Split)
      D.kit({ main: 'fireball', sup: { main: ['split', 'ignite'] } }); o.old = [D.projCount('fireball'), !!D.supOf('fireball', 'ignite')];
      return o;
    });
    check(r.ap === 'fireball:10,split:10', `supports: socketed supports earn full AP (${r.ap})`);
    check(r.old[0] === 2 && r.old[1], 'supports: former notables (Split, Ignite) act when socketed');
  }

  // ---------- gem drops ----------
  {
    const r = await page.evaluate(() => {
      const D = window.__dbg, W = window.W, P = D.P, G = D.G, o = {};
      W.kit({ main: 'fireball' }); D.newLevel(1); D.packs().forEach(p => { p.spawned = true; }); P.invuln = 1e9; W.clear();
      // a drop on the ground, picked up with a full bag
      P.inv.length = 0; while (P.inv.length < 30) P.inv.push({ id: -P.inv.length, slot: 'ring', rar: 1, name: 'x', il: 1, mods: [] });
      const n0 = P.gems.length, d = D.dropGem(P.x + 2.5, P.z, 'split', 3); W.tick(40);
      o.landed = d.landed; o.label = d.it.name; o.col = d.col; o.on = W.gems().length;
      return o;
    });
    await new Promise(res => setTimeout(res, 400));
    r.rect = await page.evaluate(() => window.__dbg.G.labelRects.some(l => l[4].gem));
    Object.assign(r, await page.evaluate(() => {
      const D = window.__dbg, W = window.W, P = D.P, G = D.G, o = {}, n0 = P.gems.length, d = W.gems()[0];
      P.x = d.x; P.z = d.z; W.tick(3);
      o.picked = d.gone; o.gem = P.gems.slice(n0).map(g => g.id + ':' + g.lvl).join(); o.bag = P.inv.length; o.badge = P.newGems > 0;
      D.dropGem(P.x + 4, P.z); o.rolled = W.gems()[0].gem; o.inPool = o.rolled.id in D.GEM_POOLS.crypt; // rolled from the pool at the Crypt's level
      W.clear(); G.ground = [];
      return o;
    }));
    console.log('  gem drop:', JSON.stringify(r));
    check(r.landed && r.on === 1 && r.label === '◆ Split (support)' && r.col === '#ff8a3c' && r.rect, `gems: a dropped gem lands with a coloured label (${r.label}, label on screen ${r.rect})`);
    check(r.picked && r.gem === 'split:3' && r.bag === 30 && r.badge, `gems: picking it up adds the gem even with a full item bag (${r.gem}, bag ${r.bag})`);
    check(r.inPool && r.rolled.lvl === 1, `gems: a random drop rolls from the pool at Crypt level (${JSON.stringify(r.rolled)})`);
  }

  // ---------- sources: guardian, elites, beats ----------
  {
    const r = await page.evaluate(() => {
      const D = window.__dbg, W = window.W, P = D.P, G = D.G, o = {}, GD = D.GEM_DROP, saved = { ...GD };
      const fresh = n => { D.newLevel(n); W.face(); D.packs().forEach(p => { p.spawned = true; }); P.invuln = 1e9; P.cd.main = 1e9; G.ground = []; };
      // guardian: exactly one
      fresh(2); GD.elite = 0; GD.beat = 0;
      D.startBeat(6); let n = 0; while (!D.enemies().some(e => e.guardian && e.awake) && n++ < 600) W.tick(1);
      const g = D.enemies().find(e => e.guardian); o.before = W.gems().length; D.kill(g); W.tick(5);
      o.guardian = W.gems().length; o.gLvl = W.gems().map(d => d.gem.lvl).join();
      // elites: forced chance
      fresh(1); GD.elite = 1; for (let i = 0; i < 3; i++) D.kill(W.mk(4 + i, 0, 50, 2)); o.elite1 = W.gems().length;
      fresh(1); GD.elite = 0; for (let i = 0; i < 3; i++) D.kill(W.mk(4 + i, 0, 50, 2)); o.elite0 = W.gems().length;
      fresh(1); GD.elite = 1; for (let i = 0; i < 3; i++) D.kill(W.mk(4 + i, 0, 50, 0)); o.normal = W.gems().length; // only rare monsters roll
      // beats: finish a real beat with the chance forced
      GD.elite = 0; GD.beat = 1; fresh(1);
      const b = G.level.beats.find(x => x.type !== 'guardian' && x.type !== 'survival');
      o.types = G.level.beats.map(x => x.type).join(); if (!b) return o; o.beatType = b.type; D.startBeat(G.level.beats.indexOf(b)); n = 0;
      while (b.state !== 'done' && n++ < 2000) { for (const e of D.enemies()) if (e.beat === b && !e.deathT) D.kill(e); W.tick(1); }
      if (!b) return o; o.beatDone = b.state === 'done'; o.beat1 = W.gems().length;
      GD.beat = 0; fresh(1); const b2 = G.level.beats.find(x => x.type !== 'guardian' && x.type !== 'survival'); D.startBeat(G.level.beats.indexOf(b2)); n = 0;
      while (b2.state !== 'done' && n++ < 2000) { for (const e of D.enemies()) if (e.beat === b2 && !e.deathT) D.kill(e); W.tick(1); }
      o.beat0 = W.gems().length;
      Object.assign(GD, saved); o.restored = [GD.elite, GD.beat];
      return o;
    });
    console.log('  gem sources:', JSON.stringify(r));
    check(r.before === 0 && r.guardian === 1 && r.gLvl === '2', `gems: killing the guardian drops exactly one gem, at the Crypt's level (${r.before} -> ${r.guardian}, lv ${r.gLvl})`);
    check(r.elite1 === 3 && r.elite0 === 0 && r.normal === 0, `gems: elites drop gems by chance, normal monsters never (${r.elite1}/${r.elite0}/${r.normal})`);
    check(r.beatDone && r.beat1 === 1 && r.beat0 === 0, `gems: a finished ${r.beatType} beat drops a gem by chance (${r.beat1}/${r.beat0})`);
    check(r.restored.join() === '0.06,0.1', 'gems: drop chances restored');
  }

  check(errors.length === 0, `supports: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  await page.close();
}

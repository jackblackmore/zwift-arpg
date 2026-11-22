// Frost Lance, Raise Skeletons, Bone Armour and Decoy: each does what makes it play differently from Fireball.
export default async function ({ open, check, SEED, SHOT }) {
  const { page, errors } = await open('/');
  await page.evaluate(() => {
    const D = window.__dbg, P = D.P, G = D.G, S = D.S;
    // A clean arena at the entrance: no rocks, no monsters, a hero who can't die, a loadout. Returns helpers.
    window.C = {
      arena(spec) {
        D.start(true); D.kit(spec); D.newLevel(1); G.obst.length = 0; G.packs.length = 0; for (const e of G.enemies) D.kill(e); G.enemies.length = 0; G.corpses.length = 0;
        P.x = G.start.x; P.z = G.start.z; P.invuln = 1e9; P.life = S.maxLife; P.cd.main = 0; S.crit = 0; D.sim(1);
      },
      // dx, dz are measured toward the middle of the map (the entrance is in a corner, and monsters can't stand in the wall)
      mob(dx, dz, hp = 1e5, type = 'zombie') { const sx = -Math.sign(G.start.x), sz = -Math.sign(G.start.z), e = D.spawnEnemy(type, G.start.x + dx * sx, G.start.z + dz * sz, null, 0); e.hp = e.maxHp = hp; e.awake = true; return e; },
      lose: e => e.maxHp - e.hp,
    };
  });
  const r = await page.evaluate(() => {
    const D = window.__dbg, P = D.P, G = D.G, S = D.S, C = window.C, out = {};
    // ---------------- Frost Lance ----------------
    C.arena({ main: 'fireball', flexA: 'frostLance', lvl: 1 }); P.cd.main = 1e9;
    let fb = 0, fl = 0;
    for (let i = 0; i < 6; i++) {
      let e = C.mob(8, 0); e.spd = 0; D.castFireball(e.x, e.z); D.sim(40); fb += C.lose(e); D.kill(e);
      e = C.mob(8, 0); e.spd = 0; D.castLance(e.x, e.z); D.sim(40); fl += C.lose(e); out.chillSeen = (out.chillSeen || 0) + (e.chill > 0 ? 1 : 0); D.kill(e);
    }
    out.fireball = fb / 6; out.lance = fl / 6; out.ratio = fl / fb;
    // pierce: line of three. lv1 hits the first only; lv5 (pierces one more) hits two
    const line = () => { const es = [C.mob(4, 0), C.mob(6.5, 0), C.mob(9, 0)]; es.forEach(e => { e.spd = 0; }); return es; };
    for (const lvl of [1, 5]) {
      C.arena({ main: 'fireball', flexA: 'frostLance', lvl }); P.cd.main = 1e9; const es = line(); D.castLance(es[0].x, es[0].z); D.sim(40);
      out['pierce' + lvl] = es.map(e => C.lose(e) > 0 ? 1 : 0).join('');
    }
    // milestones and double damage on frozen enemies at lv10
    C.arena({ main: 'fireball', flexA: 'frostLance', lvl: 10 }); P.cd.main = 1e9;
    let a = C.mob(8, 0); a.spd = 0; D.castLance(a.x, a.z); D.sim(40); const normal = C.lose(a); D.kill(a);
    a = C.mob(8, 0); a.spd = 0; a.freeze = 5; D.castLance(a.x, a.z); D.sim(20); const frozen = C.lose(a); D.kill(a);
    out.frozenRatio = frozen / normal;
    // Main auto-fires at the highest-HP enemy in range, not the nearest
    C.arena({ main: 'frostLance', lvl: 1 }); const weak = C.mob(4, 0, 60), strong = C.mob(0, 9, 6000); weak.spd = strong.spd = 0;
    D.sim(14); out.snipe = [C.lose(weak), C.lose(strong) > 0, D.S.crit];
    // range: nothing past 13 is fired at; the range is the Main range
    C.arena({ main: 'frostLance', lvl: 1 }); const far = C.mob(0, 16); far.spd = 0; D.sim(20); out.range = [D.mainRange(), C.lose(far), D.lances().length];

    // ---------------- Raise Skeletons ----------------
    C.arena({ main: 'skeletons', lvl: 1 });
    out.cap1 = D.skeletonCap(); D.sim(40); out.sk40 = D.skeletons().length; D.sim(160); out.sk200 = D.skeletons().length;
    const first = D.skeletons()[0]; D.hurtAlly(first, 1e9); out.afterKill = D.skeletons().length; D.sim(100); out.refilled = D.skeletons().length;
    out.noMobKeep = P.life === S.maxLife;
    P.lvl = 10; D.gems().find(g => g.id === 'skeletons').lvl = 10; out.cap10 = D.skeletonCap(); D.sim(200); out.sk10 = D.skeletons().length;
    // they hunt: hero stays put with an empty Main bar, the monster is 8 away, and loses life to the army alone
    C.arena({ main: 'skeletons', lvl: 1 }); D.sim(160);
    const mob = C.mob(8, 0, 4000); mob.spd = 1.2; let hurtSk = false, tgtSk = false, minSk = 9;
    for (let i = 0; i < 260; i++) { D.sim(1); P.invuln = 1e9; if (D.skeletons().some(s => s.hp < s.maxHp)) hurtSk = true; if (mob.tgt && mob.tgt.kind === 'skeleton') tgtSk = true; minSk = Math.min(minSk, D.skeletons().length); }
    out.hunt = { lost: C.lose(mob), hurtSk, tgtSk, heroHp: P.life === S.maxLife, heroMoved: Math.hypot(P.x - G.start.x, P.z - G.start.z) < .1, minSk };
    // flex: one cast raises up to the cap at once
    C.arena({ main: 'fireball', flexA: 'skeletons', lvl: 1 }); P.cd.main = 1e9; D.castSlot('flexA'); out.flexRaise = D.skeletons().length; out.flexAgain = D.castSlot('flexA');
    // they last about 20 s
    D.sim(Math.round(21 / .033) + 30); out.expired = D.skeletons().length;
    // primitive fallback: no KayKit models
    const was = D.chars.ready; D.chars.ready = false; C.arena({ main: 'skeletons', lvl: 1 });
    D.sim(80); const m2 = C.mob(7, 0, 800); D.sim(120); out.prim = [D.skeletons().length, D.skeletons().every(s => !s.model.rigged), C.lose(m2) > 0]; D.chars.ready = was;
    out.range7 = D.mainRange();

    // ---------------- Bone Armour ----------------
    C.arena({ guard: 'boneArmour', lvl: 1 }); P.invuln = 0; P.life = S.maxLife;
    const bz = C.mob(.9, 0, 5000); bz.spd = 0; bz.awake = false;
    out.boneCast = D.castSlot('guard'); out.plates = D.BONE.n;
    const l0 = P.life, hp0 = bz.hp, seq = [];
    for (let i = 0; i < 5; i++) { D.hurtHero(12, bz); seq.push([D.BONE.n, Math.round(P.life), Math.round(bz.hp)]); }
    out.boneSeq = seq.map(s => s.join('/')).join(' ');
    out.boneLifeAfter3 = seq[2][1] === Math.round(l0); out.boneThorns = hp0 - seq[2][2]; out.boneFourth = seq[3][1] < Math.round(l0);
    // real attacks: a zombie in melee. the plates take its swings first
    C.arena({ guard: 'boneArmour', lvl: 1 }); P.invuln = 0; P.life = S.maxLife; D.castSlot('guard');
    const wz = C.mob(.9, 0, 5000); wz.spd = 0; let blockedAny = false, tookBefore = false, prev = D.BONE.n;
    for (let i = 0; i < 400; i++) { D.sim(1); P.invuln = 0; if (D.BONE.n < prev) blockedAny = true; if (D.BONE.n === prev && P.life < S.maxLife && prev > 0) tookBefore = true; prev = D.BONE.n; if (prev === 0) break; }
    out.boneReal = { blocked: blockedAny, hurtWhilePlated: tookBefore, thorned: C.lose(wz) > 0, left: D.BONE.n };
    // expiry (8 s), and the lv10 milestone gives five plates
    C.arena({ guard: 'boneArmour', lvl: 1 }); D.castSlot('guard'); D.sim(Math.round(8.5 / .033)); out.boneExpire = [D.BONE.n, D.BONE.t <= 0, document.querySelectorAll('canvas').length > 0];
    C.arena({ guard: 'boneArmour', lvl: 10 }); D.castSlot('guard'); out.plates10 = D.BONE.n;

    // ---------------- Decoy ----------------
    C.arena({ guard: 'decoy', lvl: 1 }); P.invuln = 0; P.life = S.maxLife;
    const pack = [[6, 1], [6.5, -1], [7, 0], [7.5, 2]].map(([x, z]) => C.mob(x, z, 5000)); pack.forEach(e => { e.spd = 1.8; });
    D.sim(10); out.chasingHero = pack.filter(e => e.tgt === P || !e.tgt || e.tgt === undefined).length;
    out.decoyCast = D.castSlot('guard'); const dc = D.allies().find(a => a.kind === 'decoy');
    out.decoy = dc && { taunt: dc.taunt, tauntR: dc.tauntR, hp: Math.round(dc.hp), maxLife: S.maxLife, t: dc.t, towardPack: Math.abs(dc.x - P.x) > 1 && Math.sign(dc.x - P.x) === -Math.sign(G.start.x) };
    let minLife = S.maxLife, standing = 0, onDecoy = 0;
    for (let i = 0; i < 240; i++) { D.sim(1); P.invuln = 0; if (!dc.gone) { standing++; minLife = Math.min(minLife, P.life); if (i === 60) onDecoy = pack.filter(e => e.tgt === dc).length; } }
    out.decoyRun = { standing, minLife, onDecoy, heroHit: minLife < S.maxLife, gone: !!dc.gone, packOnHeroAfter: pack.filter(e => e.tgt === P).length };
    // burst at lv5: expires with damage
    C.arena({ guard: 'decoy', lvl: 5 }); P.invuln = 0; const tank = C.mob(4, 0, 9000); tank.spd = 0; D.castSlot('guard'); const d5 = D.allies().find(a => a.kind === 'decoy'); const t0 = tank.hp;
    D.sim(Math.round(6.5 / .033)); out.burst = [C.lose(tank), !!d5.gone, d5.burst];
    C.arena({ guard: 'decoy', lvl: 1 }); const tank1 = C.mob(4, 0, 9000); tank1.spd = 0; D.castSlot('guard'); D.sim(Math.round(6.5 / .033)); out.noBurst = C.lose(tank1);
    return out;
  });
  console.log('  c1 skills:', JSON.stringify(r));
  check(r.ratio > 2.5, `lance: one Frost Lance hit is ${r.ratio.toFixed(2)}x a Fireball hit on a lone target (${r.lance.toFixed(0)} vs ${r.fireball.toFixed(0)})`);
  check(r.chillSeen === 6, `lance: it chills what it hits (${r.chillSeen}/6)`);
  check(r.pierce1 === '100' && r.pierce5 === '110', `lance: no pierce at lv1, pierces one more at lv5 (${r.pierce1} / ${r.pierce5})`);
  check(r.frozenRatio > 1.8, `lance: lv10 frozen enemies take double (${r.frozenRatio.toFixed(2)}x)`);
  check(r.snipe[0] === 0 && r.snipe[1], `lance: Main picks the toughest target, not the nearest (weak lost ${r.snipe[0]}, strong hit ${r.snipe[1]})`);
  check(r.range[0] === 13 && r.range[1] === 0, `lance: range 13, nothing fired beyond it (${r.range})`);
  check(r.cap1 === 3 && r.sk40 >= 1 && r.sk200 === 3 && r.afterKill === 2 && r.refilled === 3, `skeletons: Main raises one at a time up to the cap of 3 and refills (${r.sk40} -> ${r.sk200}, ${r.afterKill} -> ${r.refilled})`);
  check(r.cap10 === 5 && r.sk10 === 5, `skeletons: lv10 raises the cap to 5 (${r.cap10}, ${r.sk10})`);
  check(r.hunt.lost > 100 && r.hunt.hurtSk && r.hunt.tgtSk && r.hunt.heroHp && r.hunt.heroMoved, `skeletons: they walk to the monster and damage it with no hero damage; the monster fights them (${JSON.stringify(r.hunt)})`);
  check(r.flexRaise === 3 && r.flexAgain === false, `skeletons: a Flex cast raises up to the cap at once, then refuses (${r.flexRaise}, ${r.flexAgain})`);
  check(r.expired === 0, `skeletons: they expire after about 20 s (${r.expired} left)`);
  check(r.prim[0] === 3 && r.prim[1] && r.prim[2] && r.range7 === 7, `skeletons: the primitive model works (${r.prim}); autopilot standoff ${r.range7}`);
  check(r.boneCast && r.plates === 3 && r.boneLifeAfter3 && r.boneFourth && r.boneThorns > 20, `bone armour: 3 plates stop 3 hits fully, then the 4th lands; thorns hurt the attacker (${r.boneSeq}; thorns ${Math.round(r.boneThorns)})`);
  check(r.boneReal.blocked && !r.boneReal.hurtWhilePlated && r.boneReal.thorned, `bone armour: a real melee attacker is blocked and stung (${JSON.stringify(r.boneReal)})`);
  check(r.boneExpire[0] === 0 && r.boneExpire[1] && r.plates10 === 5, `bone armour: expires after 8 s; lv10 gives 5 plates (${r.boneExpire}, ${r.plates10})`);
  check(r.decoyCast && r.decoy && r.decoy.taunt === 1 && r.decoy.tauntR === 9 && r.decoy.hp > r.decoy.maxLife && r.decoy.towardPack, `decoy: drops toward the pack with taunt 1, radius 9, life above the hero's (${JSON.stringify(r.decoy)})`);
  check(r.decoyRun.onDecoy === 4 && !r.decoyRun.heroHit && r.decoyRun.standing > 150 && r.decoyRun.standing < 220 && r.decoyRun.gone && r.decoyRun.packOnHeroAfter >= 3, `decoy: the pack turns to it, the hero takes no damage while it stands (~6 s), then they come back (${JSON.stringify(r.decoyRun)})`);
  check(r.burst[0] > 40 && r.burst[1] && r.noBurst < 5, `decoy: lv5 bursts when it ends (${Math.round(r.burst[0])}), lv1 does not (${Math.round(r.noBurst)})`);
  check(errors.length === 0, `c1 skills: no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);

  if (SHOT) {
    await page.evaluate(() => { const D = window.__dbg; D.setRide(false); window.C.arena({ main: 'skeletons', flexA: 'frostLance', guard: 'boneArmour', lvl: 4 }); D.sim(200); });
    await new Promise(r => setTimeout(r, 4000)); // let the camera settle on the hero
    await page.evaluate(() => {
      const D = window.__dbg, P = D.P, C = window.C;
      for (const [x, z] of [[5, 0], [6, 2], [6, -2], [7, 1], [7.5, -1]]) { const e = C.mob(x, z, 900); e.spd = 1.4; }
      D.castSlot('guard'); for (let i = 0; i < 40; i++) { D.sim(1); P.invuln = 1e9; } D.hud(); D.hud();
    });
    await new Promise(r => setTimeout(r, 700)); await page.screenshot({ path: SHOT.replace(/\.png$/, '-skeletons.png') });
  }
  await page.close();
}

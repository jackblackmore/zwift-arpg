// Monster packs, spawning, AI (melee, ranged, bomber, boss) and crowd separation.
import * as T from 'three';
import { G, P, shake, stop } from '../core/state.js';
import { MT, TIER, PACK, RAREAFF, RN1, RN2, BOSS, GUARDIANS, RISE, ANIM, STATUS, FIGHT, BLAST, RARE, STAGGER, ELITE } from '../data/monsters.js';
import { POOLS } from '../data/dungeon.js';
import { TELL } from '../data/graphics.js';
import { rand, pick, dist, $ } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { scene } from '../render/scene.js';
import { GB, eyeMat, glowSprite, decal, aura } from '../render/assets.js';
import { buildModel } from '../render/models.js';
import { chars, makeChar } from '../render/characters.js';
import { sparks, glows, emit, burst, ringFx, flashFx, telegraph, banner, floatT, addFx } from '../render/fx.js';
import { pushOut, blocked, los, pathStep } from '../world/map.js';
import { hurtP, kill, stagger } from './combat.js';
import { RIDE } from '../data/ride.js';
import { RARITY } from '../data/balance.js';
import { tierHp, tierDmg, dmgType, mainType, packMix, guardianMt } from './formulas.js';
// An attack's damage type on this map: its own (data/monsters.js), or physical with the region's lean (LEAN).
const dtype = base => dmgType(base, G.tier);

// o.elite: an elite room's pack (data/monsters.js ELITE): its minions and one elite, which spawnEnemy makes stronger.
// Packs come from the level's mix (data/monsters.js MIX, data/dungeon.js LEVELS).
export function makePack(x, z, o = {}) {
  const sz = 1 + TIER.packSize * (G.tier - 1), mem = [], mix = packMix(G.tier);
  for (const [t, n] of o.elite ? ELITE.minions : pick(mix.packs)) for (let i = 0; i < Math.round(n * sz * rand(.85, 1.2)); i++) mem.push(t);
  const p = o.elite ? { x, z, mem, magic: Math.random() < ELITE.magic, rare: pick(ELITE.types), elite: true, spawned: false, awake: false, list: [] }
    : { x, z, mem, magic: Math.random() < PACK.magicChance, rare: Math.random() < PACK.rareChance ? pick(mix.rareTypes) : null, spawned: false, awake: false, list: [] };
  G.mapTotal += mem.length + (p.rare ? 1 : 0);
  return p;
}

// rar: 0 normal, 1 magic, 2 rare. o.guard: a guardian's id (data/monsters.js GUARDIANS; type 'boss', default the Pale Warden).
export function spawnEnemy(type, x, z, pack, rar = 0, o = {}) {
  const gid = type === 'boss' ? (GUARDIANS[o.guard] ? o.guard : 'warden') : null, b = gid ? guardianMt(gid) : MT[type], mt = tierHp(G.tier), md = tierDmg(G.tier);
  const e = { type, ...b, x, z, vx: 0, vz: 0, pack, rar, aff: [], hp: 0, atkT: rand(.2, 1.2), windup: 0, awake: false, freeze: 0, chill: 0, shock: 0, burnT: 0, burnDps: 0, burnTick: 0, flash: 0, deathT: 0, walk: rand(0, 6), shootT: rand(.5, 2), face: rand(0, 6), fuse: 0, sx: x, sz: z };
  let hpm = mt, sc = b.scale || 1;
  if (rar === 1) { const R = RARITY.magic; hpm *= R.hp; e.dmg *= R.dmg; e.spd *= R.spd; }
  if (rar === 2) {
    hpm *= RARITY.rare.hp; e.dmg *= RARITY.rare.dmg; sc *= RARE.size; e.r *= RARE.radius;
    e.aff = Object.keys(RAREAFF).sort(() => Math.random() - .5).slice(0, (G.tier >= RARE.moreFrom ? RARE.more : RARE.affixes) + (pack && pack.elite ? ELITE.affixes : 0));
    if (e.aff.includes('hasted')) { e.spd *= RARE.hasted.spd; e.cd *= RARE.hasted.cd; }
    if (e.aff.includes('frenzied')) { e.cd *= RARE.frenzied.cd; e.dmg *= RARE.frenzied.dmg; }
    if (e.aff.includes('fortified')) { hpm *= RARITY.rare.fortified; sc *= RARE.fortified.size; }
    e.name = pick(RN1) + pick(RN2);
    if (pack && pack.elite) { // an elite room's elite (data/monsters.js ELITE)
      e.elite = true; hpm *= ELITE.hp; e.dmg *= ELITE.dmg; sc *= ELITE.size; e.r *= ELITE.size; e.name += ', ' + pick(ELITE.titles);
    }
  }
  e.hp = e.maxHp = b.hp * hpm; e.dmg *= md;
  if (gid) { e.gid = gid; e.gd = GUARDIANS[gid]; e.spd0 = e.spd; e.abilT = 3; e.rot = 0; e.combo = 0; }
  if (type === 'boss' || rar === 2) { e.stagMax = 1; e.stag = 0; } // a stagger bar (data/monsters.js STAGGER)
  e.h = b.h * sc / (b.scale || 1);
  const L = b.look, rigged = chars.ready && L;
  e.model = rigged ? makeChar(L.kind, e.h, { weapon: L.weapon, offhand: L.offhand, tint: L.tint }) : buildModel({ ...b, scale: sc });
  if (rar === 2) e.model.mats.forEach(m => m.emissive.setHex(0x221a00));
  e.model.g.position.set(x, 0, z); e.model.g.rotation.y = e.face; scene.add(e.model.g);
  const inv = rigged ? 1 : 1 / sc; // primitive models scale the whole group; rigged ones scale an inner node
  if (rar) { e.aura = aura(rar === 2 ? 0xffd23f : 0x5a6aff, e.r * 5, .35); e.model.g.add(e.aura); e.aura.scale.multiplyScalar(inv); }
  if (e.aff.includes('burning')) { e.fireAura = aura(0xd8400c, 5.5, .35); e.model.g.add(e.fireAura); e.fireAura.scale.multiplyScalar(inv); }
  G.enemies.push(e); if (pack) pack.list.push(e);
  return e;
}

// Build packs only when the player gets near (keeps the scene small).
export function materialize() {
  for (const p of G.packs) {
    if (p.spawned || dist(p.x, p.z, P.x, P.z) > PACK.spawnRange) continue;
    p.spawned = true;
    const place = (t, rar) => { let x, z, k = 0; do { x = p.x + rand(-2.6, 2.6); z = p.z + rand(-2.6, 2.6); } while (blocked(x, z, .5) && ++k < 20); if (k >= 20) { x = p.x; z = p.z; } spawnEnemy(t, x, z, p, rar); }; // (never inside a wall: the pack's own spot is clear)
    p.mem.forEach(t => place(t, p.magic ? 1 : 0)); if (p.rare) place(p.rare, 2);
  }
  const bs = G.bossSpec;
  if (bs && !bs.spawned && dist(G.bossSpot.x, G.bossSpot.z, P.x, P.z) < PACK.spawnRange) {
    bs.spawned = true; bs.e = spawnEnemy('boss', G.bossSpot.x, G.bossSpot.z, null, 0, { guard: bs.id }); // the level's guardian (data/dungeon.js LEVELS)
  }
}

// Rigged skeletons get up when woken: they play their rise clip and don't act until it's done.
function rouse(o) {
  if (o.awake) return; o.awake = true;
  const R = o.model.rigged && o.look && RISE[o.look.rise], clip = R && chars.clips[R.clip];
  if (clip && !o.deathT) { o.rise = clip.duration / R.speed * .85; o.riseAnim = R; }
}
export function wake(e) {
  if (e.awake) return;
  if (e.pack) {
    if (!e.pack.awake) { e.pack.awake = true; if (e.pack.rare) SFX.roar(); const el = e.pack.elite && e.pack.list.find(m => m.elite); if (el) banner(el.name.toUpperCase(), '#ff7a3a', 'Elite · the doors seal until it falls'); }
    e.pack.list.forEach(rouse);
  }
  rouse(e);
  if (e.type === 'boss') { const gd = e.gd; banner(gd.name.toUpperCase(), hex(gd.col), gd.hint); SFX.roar(); $('bossName').textContent = gd.name.toUpperCase(); $('bossName').style.color = hex(gd.col); $('bossbar').style.display = 'block'; }
}

// ---- spatial hash for neighbour and area queries ----
const CELL = 2, HASH0 = 80, hash = new Map(); // HASH0: shifts world coordinates positive (the map spans about ±71)
export function buildHash() {
  hash.clear();
  for (const e of G.enemies) { if (e.deathT) continue; const k = ((e.x + HASH0) / CELL | 0) * 1000 + ((e.z + HASH0) / CELL | 0); let a = hash.get(k); if (!a) hash.set(k, a = []); a.push(e); }
}
// Calls cb for every living enemy whose body overlaps the circle (x, z, r).
export function near(x, z, r, cb) {
  const x0 = (x - r + HASH0) / CELL | 0, x1 = (x + r + HASH0) / CELL | 0, z0 = (z - r + HASH0) / CELL | 0, z1 = (z + r + HASH0) / CELL | 0;
  for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const a = hash.get(i * 1000 + j); if (a) for (const e of a) if (!e.deathT && (e.x - x) ** 2 + (e.z - z) ** 2 <= (r + e.r) ** 2) cb(e); }
}

// Steer toward a target, round walls (path finding) and bending around rocks ahead. The hero (the autopilot) also bends round
// poison pools (game/pools.js), unless where it's going is in or right by that pool (a fight there).
export function steer(e, tx, tz) {
  const w = pathStep(e.x, e.z, tx, tz, e.r); if (w) { tx = w[0]; tz = w[1]; }
  let dx = tx - e.x, dz = tz - e.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
  const avoid = e === P && G.pools.length ? G.pools.filter(p => Math.hypot(p.x - tx, p.z - tz) > p.r + 3).map(p => ({ x: p.x, z: p.z, r: p.r + POOLS.avoid })) : [];
  for (const o of avoid.length ? G.obst.concat(avoid) : G.obst) {
    const ox = o.x - e.x, oz = o.z - e.z, along = ox * dx + oz * dz; if (along < 0 || along > 3.5) continue;
    const perp = ox * dz - oz * dx, m = o.r + e.r + .25;
    if (Math.abs(perp) < m) { const s = perp > 0 ? 1 : -1, w = (m - Math.abs(perp)) / m * 1.6, px = -dz * s, pz = dx * s; dx += px * w; dz += pz * w; }
  }
  const l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l];
}
function moveE(e, tx, tz, spd, dt) { const [dx, dz] = steer(e, tx, tz); e.x += dx * spd * dt; e.z += dz * spd * dt; e.face = Math.atan2(dx, dz); e.walk += dt * spd * 2.6; e.moving = true; }
// A shot at you: an arrow (col 'arrow') or a glowing bolt. dt: its damage type (default the shooter's). src: what hurt you (P.takenBy).
function eShoot(e, ang, spd, dmg, col, size, dt = e.dt, src) {
  const g = new T.Group();
  if (col === 'arrow') { const m = new T.Mesh(GB, eyeMat(0xd8c890)); m.scale.set(.05, .05, .55); g.add(m); g.rotation.y = ang; }
  else g.add(glowSprite(col, size));
  g.position.set(e.x, 1.2, e.z); scene.add(g);
  G.eproj.push({ x: e.x, z: e.z, vx: Math.sin(ang) * spd, vz: Math.cos(ang) * spd, dmg, life: FIGHT.projLife, g, r: col === 'arrow' ? .3 : .45, src: src || (col === 'arrow' ? 'arrow' : 'nova'), by: e, type: dtype(dt) });
}
export function updEnemyProjectiles(dt) {
  for (const p of G.eproj) {
    p.x += p.vx * dt; p.z += p.vz * dt; p.life -= dt; p.g.position.set(p.x, 1.2, p.z);
    if (p.life <= 0 || blocked(p.x, p.z, .05)) p.dead = true;
    else if (P.dead <= 0 && dist(p.x, p.z, P.x, P.z) < p.r + P.r) { p.dead = true; hurtP(p.dmg, p.src || 'shot', { from: { x: p.x - p.vx, z: p.z - p.vz }, type: p.type }); burst(p.x, 1.2, p.z, 0xff6060, 6, 3); }
    if (p.dead) scene.remove(p.g);
  }
  G.eproj = G.eproj.filter(p => !p.dead);
}

export function updEnemy(e, dt) {
  const M = e.model;
  if (e.deathT && M.rigged) {
    // Play a death clip, leave the body a moment, then sink it into the floor.
    if (!e.deathAnim) { e.deathAnim = 1; M.play(pick(ANIM.deaths), { once: true, fade: .08, speed: 1.3 }); }
    e.deathT += dt; if (e.freeze <= 0) M.mixer.update(dt);
    if (e.deathT > 2.2) M.g.position.y = -(e.deathT - 2.2) * 1.2;
    if (e.deathT > 3) { scene.remove(M.g); M.mats.forEach(m => m.dispose()); e.gone = true; }
    return;
  }
  if (e.deathT) {
    e.deathT += dt; const k = Math.min(1, e.deathT * 5);
    if (M.body) M.g.scale.setScalar((e.rar === 2 ? 1.4 : 1) * (1 - k * .6)); else M.g.rotation.x = -k * 1.45;
    if (e.deathT > 1) M.g.position.y = -(e.deathT - 1) * 1.2;
    if (e.deathT > 1.8) { scene.remove(M.g); M.mats.forEach(m => m.dispose()); e.gone = true; }
    return;
  }
  e.moving = false;
  const d = dist(e.x, e.z, P.x, P.z);
  if (!e.awake && d < (e.type === 'boss' ? BOSS.aggro : PACK.aggro) && P.dead <= 0 && (d < PACK.aggroNear || los(e.x, e.z, P.x, P.z))) wake(e); // walls hide you: rooms wake one at a time
  // status effects
  if (e.flash > 0) e.flash -= dt;
  if (e.shock > 0) { e.shock -= dt; if (Math.random() < dt * 8) emit(sparks, e.x + rand(-.3, .3), rand(.5, e.h), e.z + rand(-.3, .3), rand(-1, 1), rand(1, 2), rand(-1, 1), .25, 0xd0b0ff, 0, 1); }
  if (e.burnT > 0) {
    e.burnT -= dt; e.burnTick -= dt;
    if (Math.random() < dt * 14) emit(sparks, e.x + rand(-.3, .3), rand(.3, 1.2), e.z + rand(-.3, .3), 0, rand(1, 2.5), 0, .4, 0xff5a10);
    if (e.burnTick <= 0) {
      e.burnTick = STATUS.burnTick; e.hp -= e.burnDps * STATUS.burnTick; e.lastElem = 'fire';
      G.floats.push({ x: e.x, y: e.h, z: e.z, txt: Math.round(e.burnDps * STATUS.burnTick), col: '#ff8a3c', size: 10, life: .6, max: .6 });
      if (e.hp <= 0) { kill(e); return; }
    }
  } else e.burnDps = 0;
  if (e.chill > 0) e.chill -= dt;
  if (e.stagMax && e.stun <= 0) { e.stagWait -= dt; if (e.stagWait <= 0) e.stag = Math.max(0, e.stag - STAGGER.drain * dt); }
  const frozen = e.freeze > 0; if (frozen) e.freeze -= dt;
  for (const m of M.mats) {
    if (frozen) { m.color.setHex(0xa8eaff); m.emissive.setHex(0x113344); }
    else { m.color.setHex(m.userData.c); m.emissive.setHex(e.flash > 0 ? 0x888888 : e.shock > 0 && Math.sin(G.gt * 30) > .3 ? 0x2a1a44 : e.chill > 0 ? 0x10384c : e.rar === 2 ? 0x221a00 : 0); }
  }
  if (Math.abs(e.vx) + Math.abs(e.vz) > .01) { e.x += e.vx * dt; e.z += e.vz * dt; const f = Math.exp(-8 * dt); e.vx *= f; e.vz *= f; }
  if (e.stun > 0) { e.stun -= dt; if (Math.random() < dt * 10) emit(sparks, e.x + rand(-.3, .3), e.h + .2, e.z + rand(-.3, .3), rand(-1, 1), rand(.5, 1.5), rand(-1, 1), .4, 0xffd23f, 0, 1); pushOut(e); return animE(e, dt); } // staggered or parried
  if (!e.awake || frozen || P.dead > 0) { pushOut(e); return animE(e, dt); }
  if (e.rise > 0) { e.rise -= dt; e.face = Math.atan2(P.x - e.x, P.z - e.z); pushOut(e); return animE(e, dt); }
  const spd = e.spd * (e.chill > 0 ? STATUS.chillSpd : 1), cdm = e.chill > 0 ? STATUS.chillCd : 1, BU = RARE.burning;
  if (e.fireAura) { // Burning rares pulse fire (heavy): a telegraphed burst every few seconds, blocked or rolled
    const was = e.auraT ?? BU.every; e.auraT = was - dt;
    if (was > BU.windup && e.auraT <= BU.windup) { telegraph(e.x, e.z, BU.r, BU.windup, 0xff6a20); if (d < BU.r + 2) cue('heavy'); }
    if (e.auraT <= 0) { e.auraT = BU.every; ringFx(e.x, e.z, BU.r, 0xff6a20, .35, .3); burst(e.x, .6, e.z, 0xff6a20, 24, 5); if (d < BU.r + P.r) hurtP(BU.dmg * tierDmg(G.tier), 'aura', { from: e, kind: 'heavy', by: e, type: dtype(BU.dt) }); }
  }
  if (e.ai === 'boss' && bossAI(e, dt)) { pushOut(e); return animE(e, dt); }
  if (e.ai === 'melee' || e.ai === 'boss') {
    const tg = meleeTarget(e, d), td = tg === P ? d : dist(e.x, e.z, tg.x, tg.z);
    if (e.windup > 0) {
      e.windup -= dt; e.face = Math.atan2(tg.x - e.x, tg.z - e.z);
      if (e.windup <= 0) {
        e.swing = 1; const hv = e.heavy, cb = e.inCombo, dmg = e.dmg * (hv ? RARE.heavy.dmg : 1) * (cb ? cb.dmg : 1); e.heavy = false; e.inCombo = null;
        if (td < e.range + e.r + tg.r + FIGHT.reach) { if (tg === P) hurtP(dmg, hv ? 'heavy' : e.type, { from: e, by: e, kind: hv ? 'heavy' : 'hit', type: dtype(e.dt) }); else tg.hurt(dmg * (e.type === 'boss' ? BOSS.vsMinion : 1)); if (e.type === 'boss' || hv) { shake(hv ? .4 : .3); SFX.slam(); hurtMinions(e.x, e.z, e.range + e.r + FIGHT.reach, dmg * BOSS.vsMinion, tg); } }
        if (hv) { ringFx(e.x, e.z, e.range + e.r + FIGHT.reach, TELL.heavy, .3, .3); burst(e.x + Math.sin(e.face) * e.range, .5, e.z + Math.cos(e.face) * e.range, TELL.heavy, 18, 5); }
        e.atkT = (e.combo > 0 ? e.comboA.gap : e.channel ? e.gd.channel.swingCd : e.cd) * cdm; // a combo's next swing comes quickly
      }
    } else if (td < e.range + e.r + tg.r) { e.face = Math.atan2(tg.x - e.x, tg.z - e.z); e.atkT -= dt; if (e.atkT <= 0) startSwing(e, tg); }
    else if (!e.channel) moveE(e, P.x, P.z, spd, dt); // channelling: rooted, but it still swings at you
  } else if (e.ai === 'ranged') {
    if (e.windup > 0) { e.windup -= dt; e.face = Math.atan2(P.x - e.x, P.z - e.z); if (e.windup <= 0) { e.swing = 1; eShoot(e, e.face + rand(-FIGHT.arrowJitter, FIGHT.arrowJitter), FIGHT.arrowSpeed, e.dmg, 'arrow'); e.shootT = e.cd * cdm * rand(FIGHT.shotJitter[0], FIGHT.shotJitter[1]); } }
    else if (d < FIGHT.flee) { const [dx, dz] = steer(e, e.x - (P.x - e.x), e.z - (P.z - e.z)); e.x += dx * spd * dt; e.z += dz * spd * dt; e.walk += dt * spd * 2.6; e.moving = true; e.face = Math.atan2(P.x - e.x, P.z - e.z); }
    else if (d > FIGHT.chase || !los(e.x, e.z, P.x, P.z)) moveE(e, P.x, P.z, spd, dt);
    else { e.face = Math.atan2(P.x - e.x, P.z - e.z); e.shootT -= dt; if (e.shootT <= 0) { e.windup = FIGHT.windup.ranged; e.atkSeq = (e.atkSeq || 0) + 1; } }
  } else if (e.ai === 'bomb') {
    if (e.fuse > 0) { e.fuse -= dt; if (e.fuse <= 0) { e.fused = true; kill(e); } } // only a fuse that runs out blows up (data/monsters.js BLAST)
    else if (d < FIGHT.bomb.trigger) { e.fuse = FIGHT.bomb.fuse; telegraph(e.x, e.z, BLAST.bloater.r, FIGHT.bomb.fuse, TELL.heavy); cue('heavy'); }
    else moveE(e, P.x, P.z, spd, dt);
  }
  pushOut(e); animE(e, dt);
}

// A melee swing begins. The guardian's and rares' swings at you are parryable (yellow); every few swings a rare winds up a heavy
// one instead (red, RARE.heavy): block it for less or roll it.
function startSwing(e, tg) {
  const H = RARE.heavy, rare = e.rar === 2 && e.type !== 'boss';
  if (rare && e.heavyIn === undefined) e.heavyIn = Math.round(rand(H.every[0], H.every[1]));
  e.heavy = rare && tg === P && e.heavyIn <= 0;
  if (e.heavy) e.heavyIn = Math.round(rand(H.every[0], H.every[1])); else if (rare && tg === P) e.heavyIn--;
  if (e.combo > 0 && tg === P) { e.inCombo = e.comboA; e.combo--; } // a guardian's combo (GUARDIANS[..].abil, kind combo)
  e.windup = e.heavy ? H.windup : e.inCombo ? e.inCombo.windup : e.type === 'boss' ? FIGHT.windup.boss : FIGHT.windup.melee; e.atkSeq = (e.atkSeq || 0) + 1;
  if (e.heavy) { cue('heavy'); flashFx(e.x, e.h * .8, e.z, TELL.heavy, e.r * 4, e.windup); telegraph(e.x, e.z, e.range + e.r + FIGHT.reach, e.windup, TELL.heavy); }
  else if ((e.type === 'boss' || rare) && tg === P) { cue('parry'); flashFx(e.x, e.h * .8, e.z, TELL.parry, e.r * 3, e.windup); }
}

// Minions (G.minions, e.g. Raise Skeletons) draw melee aggro: a monster swings at one that's in its reach and closer than
// the player (it keeps its windup's target). Minions carry hurt(damage). Otherwise the target is the player.
function meleeTarget(e, d) {
  if (e.windup > 0 && e.tgt) return e.tgt;
  let best = P, bd = Math.min(d - .5, e.range + e.r);
  for (const m of G.minions) { if (m.deathT) continue; const md = dist(e.x, e.z, m.x, m.z) - m.r; if (md < bd) { bd = md; best = m; } }
  return e.tgt = best;
}
// The guardian's swings cleave and its slams crush minions too (skip: already hit).
function hurtMinions(x, z, r, d, skip) { for (const m of G.minions) if (m !== skip && !m.deathT && dist(m.x, m.z, x, z) < r + m.r) m.hurt(d); }

// A telegraph aimed at you: a coloured '!' over the hero and a sound per kind (data/graphics.js TELL), so it reads off-screen too.
function cue(kind) { if (P.dead > 0) return; floatT(P.x, 2.9, P.z, '!', '#' + TELL[kind].toString(16).padStart(6, '0'), 26, .7); SFX.cue(kind); }

const hex = c => '#' + c.toString(16).padStart(6, '0');

// The guardian's brain (data/monsters.js GUARDIANS: its abilities, rotation, channel). Returns true while it's busy with an
// ability (so it doesn't also walk or swing). Every threat is telegraphed by how you answer it (data/graphics.js TELL).
function bossAI(e, dt) {
  const gd = e.gd;
  if (!e.phase2 && e.hp < e.maxHp * BOSS.enrage) { // phase 2
    e.phase2 = true; e.rot = 0; e.spd *= gd.enrageSpd; banner(gd.enraged || gd.short + ' IS ENRAGED', hex(gd.col), gd.hint2); SFX.roar();
    if (gd.phase2 && gd.phase2.summon) { const [ty, n] = gd.phase2.summon; summon(e, n, ty); burst(e.x, e.h * .5, e.z, gd.col, 60, 7); SFX.boom(); shake(.5); } // the plague bloat bursts
  }
  if (e.channel) { // the channel (blue): rooted, still swinging; break its stagger before the bar fills
    const C = gd.channel, ch = e.channel; ch.t += dt; e.face = Math.atan2(P.x - e.x, P.z - e.z);
    if (Math.random() < dt * 24) { const a = rand(0, 6.3), r = rand(.6, 1.6) * e.r; emit(glows, e.x + Math.cos(a) * r, rand(.3, e.h * .8), e.z + Math.sin(a) * r, -Math.cos(a) * .8, rand(1, 2.5), -Math.sin(a) * .8, .6, TELL.channel); }
    if (P.eff && P.eff.spike > 0) stagger(e, RIDE.spike.fill * P.eff.spike * dt); // RIDE: a short effort spike (stagger can end the channel here)
    if (e.channel && ch.t >= C.t) { e.channel = null; channelDone(e, ch.fx); return true; }
    return false;
  }
  if (e.charging) { // the charge (unblockable): rush along a line, hitting you once if you're in the way
    const c = e.charging, A = c.a, step = Math.min(c.left, A.speed * dt); c.left -= step;
    const nx = e.x + c.dx * step, nz = e.z + c.dz * step;
    if (!blocked(nx, nz, e.r * .6)) { e.x = nx; e.z = nz; } else c.left = 0;
    e.face = Math.atan2(c.dx, c.dz); e.moving = true; e.walk += dt * 12;
    if (Math.random() < .6) emit(sparks, e.x, .4, e.z, -c.dx * 3, rand(.5, 2), -c.dz * 3, .35, TELL.unblockable, 0, 2);
    if (!c.hit && dist(e.x, e.z, P.x, P.z) < e.r + P.r + A.hitR) { c.hit = true; const r = hurtP(e.dmg * A.dmg, 'charge', { from: e, kind: 'unblockable', by: e, type: dtype(A.dt) }); if (r !== 'miss') { shake(.5); SFX.slam(); } }
    if (c.left <= 0) e.charging = null;
    return true;
  }
  if (e.cast) {
    const c = e.cast; c.t -= dt; e.face = Math.atan2(P.x - e.x, P.z - e.z);
    if (c.kind === 'shot' && c.t > c.a.lock) { c.ax = P.x; c.az = P.z; } // the aimed shot tracks you, then locks
    if (c.t > 0) return true;
    e.cast = null; e.swing = 1; landCast(e, c);
    return true;
  }
  if (e.combo > 0 || e.inCombo) return false; // finish the combo first
  e.abilT -= dt;
  if (e.abilT <= 0) {
    const rot = e.phase2 ? gd.rotation2 : gd.rotation, k = rot[e.rot++ % rot.length]; e.abilT = e.phase2 ? gd.abilGap2 : gd.abilGap;
    if (k === 'channel') {
      const C = gd.channel; e.chanN = (e.chanN || 0) + 1; e.channel = { t: 0, fx: C.effects[(e.chanN - 1) % C.effects.length] };
      e.atkT = Math.min(e.atkT, C.firstSwing); P.chans++;
      telegraph(e.x, e.z, e.r * 2.2, C.t, TELL.channel); flashFx(e.x, e.h * .7, e.z, TELL.channel, e.r * 5, .5); floatT(e.x, e.h + 1, e.z, 'CHANNELLING', hex(TELL.channel), 16, 1.2); cue('channel');
      return false; // it swings while it channels
    }
    return startAbility(e, k, gd.abil[k]);
  }
  return false;
}
// An ability begins (data/monsters.js GUARDIANS[..].abil, or a completed channel's effect): its telegraph and cue. Returns true
// while it's busy (a cast or a charge), false when it goes on fighting (a combo).
function startAbility(e, key, A) {
  const gd = e.gd;
  if (A.kind === 'combo') { e.combo = A.n; e.comboA = A; e.atkT = Math.min(e.atkT, .15); return false; }
  if (A.kind === 'area') {
    const t = e.phase2 && A.t2 ? A.t2 : A.t, d = dist(e.x, e.z, P.x, P.z) || 1, f = e.r + A.r * .5;
    const [x, z] = A.at === 'self' ? [e.x, e.z] : A.at === 'front' ? [e.x + (P.x - e.x) / d * f, e.z + (P.z - e.z) / d * f] : [P.x, P.z];
    e.cast = { kind: 'area', key, a: A, t, x, z, r: A.r };
    const col = TELL[A.tell]; telegraph(x, z, A.r, t, col); flashFx(e.x, e.h * .7, e.z, col, e.r * (A.at === 'self' ? 6 : 4), t); cue(A.tell);
    return true;
  }
  if (A.kind === 'volley') { e.cast = { kind: 'volley', key, a: A, t: A.t }; flashFx(e.x, e.h * .55, e.z, A.col || TELL.parry, 5, A.t); cue('parry'); return true; }
  if (A.kind === 'shot') { const c = e.cast = { kind: 'shot', key, a: A, t: A.t, ax: P.x, az: P.z }; aimLine(e, c); flashFx(e.x, e.h * .7, e.z, TELL.unblockable, e.r * 4, A.t); cue('unblockable'); return true; }
  if (A.kind === 'charge') { e.cast = { kind: 'charge', key, a: A, t: A.t, x: P.x, z: P.z }; telegraph(P.x, P.z, 1.4, A.t, TELL.unblockable); flashFx(e.x, e.h * .7, e.z, TELL.unblockable, e.r * 5, A.t); cue('unblockable'); return true; }
  if (A.kind === 'summon') { e.cast = { kind: 'summon', key, a: A, t: .7 }; ringFx(e.x, e.z, 3, gd.col, .7, .2); return true; }
  return false;
}
// The cast lands.
function landCast(e, c) {
  const A = c.a, gd = e.gd;
  if (c.kind === 'area') {
    const unb = A.tell === 'unblockable', col = TELL[A.tell], tc = mainType(dtype(A.dt)) === 'poison' ? 0x8ee04a : mainType(dtype(A.dt)) === 'cold' ? TELL.channel : gd.col;
    if (A.jump && !blocked(c.x, c.z, e.r * .8)) { e.x = c.x; e.z = c.z; } // a leap: it lands there
    ringFx(c.x, c.z, c.r, col, .4, .5); burst(c.x, .5, c.z, tc, A.at === 'self' ? 70 : 50, A.at === 'self' ? 9 : 7); flashFx(c.x, .6, c.z, tc, c.r * 2.4, .3); SFX.slam(); if (A.at === 'self') SFX.boom(); shake(A.at === 'self' ? .8 : .7); stop(A.at === 'self' ? .1 : .08);
    if (dist(P.x, P.z, c.x, c.z) < c.r + P.r) hurtP(e.dmg * A.dmg, c.key, { from: e, kind: unb ? 'unblockable' : 'heavy', by: e, type: dtype(A.dt) });
    hurtMinions(c.x, c.z, c.r, e.dmg * A.dmg * BOSS.vsMinion);
  }
  // A fan of shots aimed at you: block them with the shield or roll through (more fans in phase 2, each re-aimed).
  if (c.kind === 'volley') for (let k = 0; k < (e.phase2 ? A.waves2 || 1 : 1); k++) G.queue.push({ k: 'later', t: k * A.gap, fn: () => { if (e.deathT || e.gone || e.stun > 0) return; const a0 = Math.atan2(P.x - e.x, P.z - e.z), n = A.n; for (let i = 0; i < n; i++) eShoot(e, a0 + (i / (n - 1) - .5) * A.spread, A.speed, e.dmg * A.dmg, A.look === 'arrow' ? 'arrow' : A.col, 1.1, A.dt, c.key); A.look === 'arrow' ? SFX.cue('parry') : SFX.arc(); } }); // game time, so it pauses and replays the same
  if (c.kind === 'shot') { // the aimed shot (unblockable): everything along the line, now
    const dx = c.ax - e.x, dz = c.az - e.z, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l, along = (P.x - e.x) * ux + (P.z - e.z) * uz, off = Math.abs((P.x - e.x) * uz - (P.z - e.z) * ux);
    c.fired = true; SFX.slam(); shake(.4);
    for (let k = 1; k < 14; k++) emit(sparks, e.x + ux * k * 1.5, 1.2, e.z + uz * k * 1.5, ux * 4, rand(0, 1), uz * 4, .4, TELL.unblockable, 0, 2);
    if (along > 0 && along < A.range && off < A.w + P.r) hurtP(e.dmg * A.dmg, 'shot', { from: e, kind: 'unblockable', by: e, type: dtype(A.dt) });
  }
  if (c.kind === 'charge') { const dx = c.x - e.x, dz = c.z - e.z, l = Math.hypot(dx, dz) || 1; e.charging = { a: A, dx: dx / l, dz: dz / l, left: A.range, hit: false }; SFX.roar(); }
  if (c.kind === 'summon') summon(e, e.phase2 ? A.n2 : A.n, A.type);
}
// The aimed shot's line: a purple stripe on the floor from the guardian to you, brightening as it locks, flashing as it fires.
function aimLine(e, c) {
  const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: TELL.unblockable, transparent: true, opacity: .3, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
  m.rotation.x = -Math.PI / 2;
  addFx(m, c.t + .3, () => {
    if (!c.fired && e.cast !== c) { m.visible = false; return; } // cancelled (staggered)
    const dx = c.ax - e.x, dz = c.az - e.z, l = Math.hypot(dx, dz) || 1, len = c.fired ? c.a.range : l;
    m.position.set(e.x + dx / l * len / 2, .09, e.z + dz / l * len / 2); m.rotation.z = Math.atan2(dx, dz); m.scale.set(c.a.w * (c.fired ? 2.4 : c.t <= c.a.lock ? 1.6 : .9), len, 1);
    m.material.opacity = c.fired ? .9 : c.t <= c.a.lock ? .75 : .3 + .15 * Math.sin(G.gt * 20);
  });
}
// A channel that completed (GUARDIANS[..].channel.effects): an ability (a burst you roll, an arrow rain you block or roll), or it mends and summons.
function channelDone(e, fx) {
  const C = e.gd.channel;
  if (fx !== 'mend') { startAbility(e, fx, C[fx]); return; }
  const M = C.mend, h = e.maxHp * M.heal; e.hp = Math.min(e.maxHp, e.hp + h);
  floatT(e.x, e.h + 1, e.z, '+' + Math.round(h), '#5ad890', 18, 1.4); burst(e.x, e.h * .6, e.z, 0x5ad890, 40, 5); burst(e.x, e.h * .6, e.z, TELL.channel, 30, 4); SFX.flask(); SFX.roar();
  summon(e, M.summon, M.type);
}
function summon(e, n, type) {
  for (let i = 0; i < n; i++) {
    const a = i * 1.26, x = e.x + Math.cos(a) * 2.5, z = e.z + Math.sin(a) * 2.5;
    if (!blocked(x, z, .3)) { const r = spawnEnemy(type, x, z, null, 0); r.awake = true; G.mapTotal++; burst(x, .5, z, e.gd.col, 10, 3); }
  }
}

export function animE(e, dt) { // (also animates minions, game/sk/skeletons.js)
  const M = e.model; M.g.position.set(e.x, 0, e.z);
  const dr = ((e.face - M.g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI; M.g.rotation.y += dr * Math.min(1, dt * 10);
  if (e.freeze > 0) return;
  if (M.rigged) return animRig(e, M, dt);
  if (M.body) { const s = 1 + Math.sin(G.gt * 6 + e.sx) * .06 + (e.fuse > 0 ? Math.sin(G.gt * 40) * .12 : 0) + (e.windup > 0 || (e.cast && e.cast.t > 0) ? .1 : 0) + (e.channel ? Math.sin(G.gt * 18) * .05 : 0); /* a guardian blob swells as it winds up */ M.body.scale.set(.62 * s, .55 / s, .62 * s); M.g.position.y = e.moving ? Math.abs(Math.sin(e.walk)) * .1 : 0; return; }
  const w = e.moving ? Math.sin(e.walk) : 0;
  M.legL.rotation.x = w * .7; M.legR.rotation.x = -w * .7;
  if (e.swing > 0) e.swing = Math.max(0, e.swing - dt * 4);
  const up = e.windup > 0 || (e.cast && e.cast.t > 0);
  M.armR.rotation.x = up ? -2.6 : e.swing > 0 ? -2.6 + (1 - e.swing) * 3.2 : (e.type === 'zombie' && e.awake ? -1.3 : w * .5);
  M.armL.rotation.x = up && e.type === 'boss' ? -2.6 : e.type === 'zombie' && e.awake ? -1.3 : e.type === 'archer' && e.awake ? -1.5 : -w * .5;
  M.g.position.y = e.moving ? Math.abs(Math.cos(e.walk)) * .06 : 0;
}

// Clip choice for KayKit characters (clip names live in data/monsters.js). `lock` keeps a one-shot clip
// (rise, attack, cast, flinch) playing to the end.
function animRig(e, M, dt) {
  e.lock = (e.lock || 0) - dt;
  const L = e.look;
  const once = ([n, sp], fade = .1) => { const d = M.play(n, { once: true, speed: sp, fade }); e.lock = d / sp * .85; };
  const big = e.lastHit >= e.maxHp * ANIM.minHit; e.lastHit = 0;
  if (!e.awake) {
    // Poses are single-frame clips: play them once and hold (looping a zero-length clip breaks the mixer).
    const R = RISE[L.rise], pose = R && R.pose && chars.clips[R.pose];
    if (pose) { if (M.cur !== R.pose) M.play(R.pose, { once: true, fade: 0 }); } else M.play(L.idle || 'Idle');
  }
  else if (e.riseAnim) { const R = e.riseAnim; e.riseAnim = null; once([R.clip, R.speed], .05); }
  else if (e.cast && e.castAnim !== e.cast) { e.castAnim = e.cast; const an = (e.gd && e.gd.anim && e.gd.anim[e.cast.key]) || ANIM.bossCast[e.cast.key] || ANIM.bossCast[e.cast.kind]; if (an) once(an); }
  else if (e.windup > 0 && e.swingAnim !== e.atkSeq && L.attacks) { e.swingAnim = e.atkSeq; const [n, sp] = pick(L.attacks); once([n, e.heavy ? sp * FIGHT.windup.melee / RARE.heavy.windup : sp]); } // a heavy swing plays slower
  else if (big && e.lock <= 0 && e.windup <= 0 && e.type !== 'boss') once([pick(ANIM.hits), ANIM.hitSpeed], .05);
  else if (e.lock <= 0) {
    if (e.moving) { const run = L.walk === 'Running_A'; M.play(L.walk, { speed: Math.min(1.8, Math.max(.6, e.spd * (e.chill > 0 ? .5 : 1) / (run ? 3.6 : 1.7))) }); }
    else M.play(e.channel && chars.clips[ANIM.channel] ? ANIM.channel : L.idle || 'Idle');
  }
  M.mixer.update(dt);
}

// Push overlapping monsters apart; the horde also shoves the player a little.
export function separate() {
  for (const e of G.enemies) {
    if (e.deathT) continue;
    near(e.x, e.z, e.r + .6, o => { if (o === e) return; const dx = e.x - o.x, dz = e.z - o.z, dd = Math.hypot(dx, dz), m = e.r + o.r; if (dd < m && dd > .001) { const p = (m - dd) * .5; e.x += dx / dd * p; e.z += dz / dd * p; } });
    const dx = e.x - P.x, dz = e.z - P.z, dd = Math.hypot(dx, dz), m = e.r + P.r;
    if (dd < m && dd > .001 && P.dead <= 0) { const p = m - dd; e.x += dx / dd * p * .7; e.z += dz / dd * p * .7; P.x -= dx / dd * p * .3; P.z -= dz / dd * p * .3; }
  }
  if (P.dead <= 0) pushOut(P); // a crowd can shove the hero: keep them out of walls and props
}

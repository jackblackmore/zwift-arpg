// Monster packs, spawning, AI (melee, ranged, bomber, boss) and crowd separation.
import * as T from 'three';
import { G, P, shake, stop } from '../core/state.js';
import { MT, TIER, PACKS, PACK, RAREAFF, RN1, RN2, BOSS, RISE, ANIM, STATUS, FIGHT, BLAST, RARE, STAGGER } from '../data/monsters.js';
import { TELL } from '../data/graphics.js';
import { rand, pick, dist, $ } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { scene } from '../render/scene.js';
import { GB, eyeMat, glowSprite, decal, aura } from '../render/assets.js';
import { buildModel } from '../render/models.js';
import { chars, makeChar } from '../render/characters.js';
import { sparks, glows, emit, burst, ringFx, flashFx, telegraph, banner, floatT } from '../render/fx.js';
import { pushOut, blocked, los, pathStep } from '../world/map.js';
import { hurtP, kill, stagger } from './combat.js';
import { RIDE } from '../data/ride.js';
import { RARITY } from '../data/balance.js';
import { tierHp } from './formulas.js';

export function makePack(x, z) {
  const sz = 1 + TIER.packSize * (G.tier - 1), mem = [];
  for (const [t, n] of pick(PACKS)) for (let i = 0; i < Math.round(n * sz * rand(.85, 1.2)); i++) mem.push(t);
  const p = { x, z, mem, magic: Math.random() < PACK.magicChance, rare: Math.random() < PACK.rareChance ? pick(PACK.rareTypes) : null, spawned: false, awake: false, list: [] };
  G.mapTotal += mem.length + (p.rare ? 1 : 0);
  return p;
}

// rar: 0 normal, 1 magic, 2 rare
export function spawnEnemy(type, x, z, pack, rar = 0) {
  const b = MT[type], mt = tierHp(G.tier), md = 1 + TIER.dmg * (G.tier - 1);
  const e = { type, ...b, x, z, vx: 0, vz: 0, pack, rar, aff: [], hp: 0, atkT: rand(.2, 1.2), windup: 0, awake: false, freeze: 0, chill: 0, shock: 0, burnT: 0, burnDps: 0, burnTick: 0, flash: 0, deathT: 0, walk: rand(0, 6), shootT: rand(.5, 2), face: rand(0, 6), fuse: 0, sx: x, sz: z };
  let hpm = mt, sc = b.scale || 1;
  if (rar === 1) { const R = RARITY.magic; hpm *= R.hp; e.dmg *= R.dmg; e.spd *= R.spd; }
  if (rar === 2) {
    hpm *= RARITY.rare.hp; e.dmg *= RARITY.rare.dmg; sc *= RARE.size; e.r *= RARE.radius;
    e.aff = Object.keys(RAREAFF).sort(() => Math.random() - .5).slice(0, G.tier >= RARE.moreFrom ? RARE.more : RARE.affixes);
    if (e.aff.includes('hasted')) { e.spd *= RARE.hasted.spd; e.cd *= RARE.hasted.cd; }
    if (e.aff.includes('frenzied')) { e.cd *= RARE.frenzied.cd; e.dmg *= RARE.frenzied.dmg; }
    if (e.aff.includes('fortified')) { hpm *= RARITY.rare.fortified; sc *= RARE.fortified.size; }
    e.name = pick(RN1) + pick(RN2);
  }
  e.hp = e.maxHp = b.hp * hpm; e.dmg *= md;
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
    bs.spawned = true; const b = spawnEnemy('boss', G.bossSpot.x, G.bossSpot.z, null, 0); b.abilT = 3; b.rot = 0; bs.e = b;
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
  if (e.pack) { if (!e.pack.awake) { e.pack.awake = true; if (e.pack.rare) SFX.roar(); } e.pack.list.forEach(rouse); }
  rouse(e);
  if (e.type === 'boss') { banner('THE PALE WARDEN', '#ff4fd8', 'Parry its swings · block or roll the slams'); SFX.roar(); $('bossbar').style.display = 'block'; }
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

// Steer toward a target, round walls (path finding) and bending around rocks ahead.
export function steer(e, tx, tz) {
  const w = pathStep(e.x, e.z, tx, tz, e.r); if (w) { tx = w[0]; tz = w[1]; }
  let dx = tx - e.x, dz = tz - e.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
  for (const o of G.obst) {
    const ox = o.x - e.x, oz = o.z - e.z, along = ox * dx + oz * dz; if (along < 0 || along > 3.5) continue;
    const perp = ox * dz - oz * dx, m = o.r + e.r + .25;
    if (Math.abs(perp) < m) { const s = perp > 0 ? 1 : -1, w = (m - Math.abs(perp)) / m * 1.6, px = -dz * s, pz = dx * s; dx += px * w; dz += pz * w; }
  }
  const l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l];
}
function moveE(e, tx, tz, spd, dt) { const [dx, dz] = steer(e, tx, tz); e.x += dx * spd * dt; e.z += dz * spd * dt; e.face = Math.atan2(dx, dz); e.walk += dt * spd * 2.6; e.moving = true; }
function eShoot(e, ang, spd, dmg, col, size) {
  const g = new T.Group();
  if (col === 'arrow') { const m = new T.Mesh(GB, eyeMat(0xd8c890)); m.scale.set(.05, .05, .55); g.add(m); g.rotation.y = ang; }
  else g.add(glowSprite(col, size));
  g.position.set(e.x, 1.2, e.z); scene.add(g);
  G.eproj.push({ x: e.x, z: e.z, vx: Math.sin(ang) * spd, vz: Math.cos(ang) * spd, dmg, life: FIGHT.projLife, g, r: col === 'arrow' ? .3 : .45, src: col === 'arrow' ? 'arrow' : 'nova', by: e });
}
export function updEnemyProjectiles(dt) {
  for (const p of G.eproj) {
    p.x += p.vx * dt; p.z += p.vz * dt; p.life -= dt; p.g.position.set(p.x, 1.2, p.z);
    if (p.life <= 0 || blocked(p.x, p.z, .05)) p.dead = true;
    else if (P.dead <= 0 && dist(p.x, p.z, P.x, P.z) < p.r + P.r) { p.dead = true; hurtP(p.dmg, p.src || 'shot', { from: { x: p.x - p.vx, z: p.z - p.vz } }); burst(p.x, 1.2, p.z, 0xff6060, 6, 3); }
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
    else { m.color.setHex(m.userData.c); m.emissive.setHex(e.flash > 0 ? 0x888888 : e.shock > 0 && Math.sin(G.gt * 30) > .3 ? 0x2a1a44 : e.rar === 2 ? 0x221a00 : 0); }
  }
  if (Math.abs(e.vx) + Math.abs(e.vz) > .01) { e.x += e.vx * dt; e.z += e.vz * dt; const f = Math.exp(-8 * dt); e.vx *= f; e.vz *= f; }
  if (e.stun > 0) { e.stun -= dt; if (Math.random() < dt * 10) emit(sparks, e.x + rand(-.3, .3), e.h + .2, e.z + rand(-.3, .3), rand(-1, 1), rand(.5, 1.5), rand(-1, 1), .4, 0xffd23f, 0, 1); pushOut(e); return animE(e, dt); } // staggered or parried
  if (!e.awake || frozen || P.dead > 0) { pushOut(e); return animE(e, dt); }
  if (e.rise > 0) { e.rise -= dt; e.face = Math.atan2(P.x - e.x, P.z - e.z); pushOut(e); return animE(e, dt); }
  const spd = e.spd * (e.chill > 0 ? STATUS.chillSpd : 1), cdm = e.chill > 0 ? STATUS.chillCd : 1, BU = RARE.burning;
  if (e.fireAura) { // Burning rares pulse fire (heavy): a telegraphed burst every few seconds, blocked or rolled
    const was = e.auraT ?? BU.every; e.auraT = was - dt;
    if (was > BU.windup && e.auraT <= BU.windup) { telegraph(e.x, e.z, BU.r, BU.windup, 0xff6a20); if (d < BU.r + 2) cue('heavy'); }
    if (e.auraT <= 0) { e.auraT = BU.every; ringFx(e.x, e.z, BU.r, 0xff6a20, .35, .3); burst(e.x, .6, e.z, 0xff6a20, 24, 5); if (d < BU.r + P.r) hurtP(BU.dmg * (1 + TIER.dmg * (G.tier - 1)), 'aura', { from: e, kind: 'heavy', by: e }); }
  }
  if (e.ai === 'boss' && bossAI(e, dt)) { pushOut(e); return animE(e, dt); }
  if (e.ai === 'melee' || e.ai === 'boss') {
    const tg = meleeTarget(e, d), td = tg === P ? d : dist(e.x, e.z, tg.x, tg.z);
    if (e.windup > 0) {
      e.windup -= dt; e.face = Math.atan2(tg.x - e.x, tg.z - e.z);
      if (e.windup <= 0) { e.swing = 1; if (td < e.range + e.r + tg.r + FIGHT.reach) { if (tg === P) hurtP(e.dmg, e.type, { from: e, by: e }); else tg.hurt(e.dmg * (e.type === 'boss' ? BOSS.vsMinion : 1)); if (e.type === 'boss') { shake(.3); SFX.slam(); hurtMinions(e.x, e.z, e.range + e.r + FIGHT.reach, e.dmg * BOSS.vsMinion, tg); } } e.atkT = (e.channel ? BOSS.channel.swingCd : e.cd) * cdm; }
    } else if (td < e.range + e.r + tg.r) { e.face = Math.atan2(tg.x - e.x, tg.z - e.z); e.atkT -= dt; if (e.atkT <= 0) { e.windup = e.type === 'boss' ? FIGHT.windup.boss : FIGHT.windup.melee; e.atkSeq = (e.atkSeq || 0) + 1; if ((e.type === 'boss' || e.rar === 2) && tg === P) { cue('parry'); flashFx(e.x, e.h * .8, e.z, TELL.parry, e.r * 3, e.windup); } } }
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

// Returns true while the boss is busy with an ability (so it doesn't also walk or swing).
function bossAI(e, dt) {
  if (!e.phase2 && e.hp < e.maxHp * BOSS.enrage) { e.phase2 = true; e.rot = 0; e.spd *= BOSS.enrageSpd; banner('THE WARDEN IS ENRAGED', '#ff4fd8', 'Purple: roll · blue: break it before the bar fills'); SFX.roar(); }
  if (e.channel) { // the channel (blue, BOSS.channel): rooted, still swinging; break its stagger before the bar fills
    const C = BOSS.channel, ch = e.channel; ch.t += dt; e.face = Math.atan2(P.x - e.x, P.z - e.z);
    if (Math.random() < dt * 24) { const a = rand(0, 6.3), r = rand(.6, 1.6) * e.r; emit(glows, e.x + Math.cos(a) * r, rand(.3, e.h * .8), e.z + Math.sin(a) * r, -Math.cos(a) * .8, rand(1, 2.5), -Math.sin(a) * .8, .6, TELL.channel); }
    if (P.eff && P.eff.spike > 0) stagger(e, RIDE.spike.fill * P.eff.spike * dt); // RIDE: a short effort spike (stagger can end the channel here)
    if (e.channel && ch.t >= C.t) { e.channel = null; channelDone(e, ch.fx); return true; }
    return false;
  }
  if (e.charging) { // the charge (unblockable): rush along a line, hitting you once if you're in the way
    const c = e.charging, step = Math.min(c.left, BOSS.charge.speed * dt); c.left -= step;
    const nx = e.x + c.dx * step, nz = e.z + c.dz * step;
    if (!blocked(nx, nz, e.r * .6)) { e.x = nx; e.z = nz; } else c.left = 0;
    e.face = Math.atan2(c.dx, c.dz); e.moving = true; e.walk += dt * 12;
    if (Math.random() < .6) emit(sparks, e.x, .4, e.z, -c.dx * 3, rand(.5, 2), -c.dz * 3, .35, TELL.unblockable, 0, 2);
    if (!c.hit && dist(e.x, e.z, P.x, P.z) < e.r + P.r + BOSS.charge.hitR) { c.hit = true; const r = hurtP(e.dmg * BOSS.charge.dmg, 'charge', { from: e, kind: 'unblockable', by: e }); if (r !== 'miss') { shake(.5); SFX.slam(); } }
    if (c.left <= 0) e.charging = null;
    return true;
  }
  if (e.cast) {
    const c = e.cast; c.t -= dt; e.face = Math.atan2(P.x - e.x, P.z - e.z);
    if (c.t > 0) return true;
    e.cast = null; e.swing = 1;
    if (c.kind === 'slam') {
      ringFx(c.x, c.z, c.r, 0xff3030, .4, .5); burst(c.x, .4, c.z, 0xff4fd8, 50, 7); flashFx(c.x, .5, c.z, 0xff2bd6, c.r * 2.4, .3); SFX.slam(); shake(.7); stop(.08);
      if (dist(P.x, P.z, c.x, c.z) < c.r + P.r) hurtP(e.dmg * BOSS.slamDmg, 'slam', { from: e, kind: 'heavy', by: e });
      hurtMinions(c.x, c.z, c.r, e.dmg * BOSS.slamDmg * BOSS.vsMinion);
    }
    // A fan of bolts aimed at you: block them with the shield or roll through (a second fan in phase 2, re-aimed).
    if (c.kind === 'nova') for (let k = 0; k < (e.phase2 ? 2 : 1); k++) G.queue.push({ k: 'later', t: k * BOSS.novaGap, fn: () => { if (e.deathT || e.gone || e.stun > 0) return; const a0 = Math.atan2(P.x - e.x, P.z - e.z), n = BOSS.novaBolts; for (let i = 0; i < n; i++) eShoot(e, a0 + (i / (n - 1) - .5) * BOSS.novaSpread, BOSS.novaSpeed, e.dmg * BOSS.novaDmg, 0xff2bd6, 1.1); SFX.arc(); } }); // game time, so it pauses and replays the same
    if (c.kind === 'charge') { const dx = c.x - e.x, dz = c.z - e.z, l = Math.hypot(dx, dz) || 1; e.charging = { dx: dx / l, dz: dz / l, left: BOSS.charge.range, hit: false }; SFX.roar(); }
    if (c.kind === 'summon') summon(e, e.phase2 ? BOSS.summon2 : BOSS.summon);
    if (c.kind === 'burst') { // a completed channel's burst (unblockable): roll it
      const B = BOSS.channel.burst; ringFx(e.x, e.z, B.r, TELL.unblockable, .5, .2); burst(e.x, 1, e.z, TELL.channel, 70, 9); burst(e.x, 1, e.z, TELL.unblockable, 50, 7); flashFx(e.x, 1, e.z, TELL.channel, B.r * 2, .35); SFX.boom(); SFX.slam(); shake(.8); stop(.1);
      if (dist(P.x, P.z, e.x, e.z) < B.r + P.r) hurtP(e.dmg * B.dmg, 'burst', { from: e, kind: 'unblockable', by: e });
      hurtMinions(e.x, e.z, B.r, e.dmg * B.dmg * BOSS.vsMinion);
    }
    return true;
  }
  e.abilT -= dt;
  if (e.abilT <= 0) {
    const rot = e.phase2 ? BOSS.rotation2 : BOSS.rotation, k = rot[e.rot++ % rot.length]; e.abilT = e.phase2 ? BOSS.abilGap2 : BOSS.abilGap;
    if (k === 'slam') { e.cast = { kind: k, t: e.phase2 ? BOSS.slamT2 : BOSS.slamT, x: P.x, z: P.z, r: BOSS.slamR }; telegraph(P.x, P.z, BOSS.slamR, e.cast.t, TELL.heavy); cue('heavy'); }
    else if (k === 'nova') { e.cast = { kind: k, t: BOSS.novaT }; flashFx(e.x, 3, e.z, 0xff2bd6, 5, BOSS.novaT); cue('parry'); }
    else if (k === 'charge') { const C = BOSS.charge; e.cast = { kind: k, t: C.t, x: P.x, z: P.z }; telegraph(P.x, P.z, 1.4, C.t, TELL.unblockable); flashFx(e.x, e.h * .7, e.z, TELL.unblockable, e.r * 5, C.t); cue('unblockable'); }
    else if (k === 'channel') {
      const C = BOSS.channel; e.chanN = (e.chanN || 0) + 1; e.channel = { t: 0, fx: C.effects[(e.chanN - 1) % C.effects.length] };
      e.atkT = Math.min(e.atkT, C.firstSwing); P.chans++;
      telegraph(e.x, e.z, e.r * 2.2, C.t, TELL.channel); flashFx(e.x, e.h * .7, e.z, TELL.channel, e.r * 5, .5); floatT(e.x, e.h + 1, e.z, 'CHANNELLING', '#' + TELL.channel.toString(16).padStart(6, '0'), 16, 1.2); cue('channel');
      return false; // it swings while it channels
    }
    else { e.cast = { kind: k, t: .7 }; ringFx(e.x, e.z, 3, 0xff4fd8, .7, .2); }
    return true;
  }
  return false;
}
// A channel that completed (BOSS.channel.effects): an unblockable burst after a purple wind-up, or it mends and summons.
function channelDone(e, fx) {
  const C = BOSS.channel;
  if (fx === 'burst') { e.cast = { kind: 'burst', t: C.burst.t }; telegraph(e.x, e.z, C.burst.r, C.burst.t, TELL.unblockable); flashFx(e.x, e.h * .7, e.z, TELL.unblockable, e.r * 6, C.burst.t); cue('unblockable'); return; }
  const h = e.maxHp * C.mend.heal; e.hp = Math.min(e.maxHp, e.hp + h);
  floatT(e.x, e.h + 1, e.z, '+' + Math.round(h), '#5ad890', 18, 1.4); burst(e.x, e.h * .6, e.z, 0x5ad890, 40, 5); burst(e.x, e.h * .6, e.z, TELL.channel, 30, 4); SFX.flask(); SFX.roar();
  summon(e, C.mend.summon);
}
function summon(e, n) {
  for (let i = 0; i < n; i++) {
    const a = i * 1.26, x = e.x + Math.cos(a) * 2.5, z = e.z + Math.sin(a) * 2.5;
    if (!blocked(x, z, .3)) { const r = spawnEnemy(BOSS.summonType, x, z, null, 0); r.awake = true; G.mapTotal++; burst(x, .5, z, 0xff4fd8, 10, 3); }
  }
}

export function animE(e, dt) { // (also animates minions, game/sk/skeletons.js)
  const M = e.model; M.g.position.set(e.x, 0, e.z);
  const dr = ((e.face - M.g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI; M.g.rotation.y += dr * Math.min(1, dt * 10);
  if (e.freeze > 0) return;
  if (M.rigged) return animRig(e, M, dt);
  if (M.body) { const s = 1 + Math.sin(G.gt * 6 + e.sx) * .06 + (e.fuse > 0 ? Math.sin(G.gt * 40) * .12 : 0); M.body.scale.set(.62 * s, .55 / s, .62 * s); M.g.position.y = e.moving ? Math.abs(Math.sin(e.walk)) * .1 : 0; return; }
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
  else if (e.cast && e.castAnim !== e.cast) { e.castAnim = e.cast; once(ANIM.bossCast[e.cast.kind]); }
  else if (e.windup > 0 && e.swingAnim !== e.atkSeq && L.attacks) { e.swingAnim = e.atkSeq; once(pick(L.attacks)); }
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

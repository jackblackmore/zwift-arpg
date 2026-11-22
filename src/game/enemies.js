// Monster packs, spawning, AI (melee, ranged, bomber, boss) and crowd separation.
import * as T from 'three';
import { G, P, shake, stop } from '../core/state.js';
import { MT, TIER, PACKS, PACK, RAREAFF, RN1, RN2, BOSS, RISE, ANIM } from '../data/monsters.js';
import { rand, pick, dist } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { scene } from '../render/scene.js';
import { GB, eyeMat, glowSprite, decal, aura } from '../render/assets.js';
import { buildModel } from '../render/models.js';
import { chars, makeChar } from '../render/characters.js';
import { sparks, emit, burst, ringFx, flashFx, telegraph, banner } from '../render/fx.js';
import { pushOut, blocked, los } from '../world/map.js';
import { hurtP, kill } from './combat.js';

// opts: size scales the headcount; magicChance / rareChance override the PACK defaults (levels.js sets them).
export function makePack(x, z, opts = {}) {
  const sz = (1 + TIER.packSize * (G.depth - 1)) * (opts.size || 1), mem = [];
  const mc = opts.magicChance ?? PACK.magicChance, rc = opts.rareChance ?? PACK.rareChance;
  for (const [t, n] of pick(PACKS)) for (let i = 0; i < Math.max(1, Math.round(n * sz * rand(.85, 1.2))); i++) mem.push(t);
  return { x, z, mem, magic: Math.random() < mc, rare: Math.random() < rc ? pick(PACK.rareTypes) : null, spawned: false, awake: false, list: [] };
}

// rar: 0 normal, 1 magic, 2 rare
export function spawnEnemy(type, x, z, pack, rar = 0) {
  const b = MT[type], mt = 1 + TIER.hp * (G.depth - 1), md = 1 + TIER.dmg * (G.depth - 1);
  const e = { type, ...b, x, z, vx: 0, vz: 0, pack, rar, aff: [], hp: 0, atkT: rand(.2, 1.2), windup: 0, awake: false, freeze: 0, chill: 0, shock: 0, burnT: 0, burnDps: 0, burnTick: 0, flash: 0, deathT: 0, walk: rand(0, 6), shootT: rand(.5, 2), face: rand(0, 6), fuse: 0, sx: x, sz: z };
  let hpm = mt, sc = b.scale || 1;
  if (rar === 1) { hpm *= 1.8; e.dmg *= 1.15; e.spd *= 1.08; }
  if (rar === 2) {
    hpm *= 5; e.dmg *= 1.4; sc *= 1.4; e.r *= 1.35;
    e.aff = Object.keys(RAREAFF).sort(() => Math.random() - .5).slice(0, G.depth >= 3 ? 3 : 2);
    if (e.aff.includes('hasted')) { e.spd *= 1.5; e.cd *= .7; }
    if (e.aff.includes('frenzied')) { e.cd *= .55; e.dmg *= 1.1; }
    if (e.aff.includes('fortified')) { hpm *= 1.8; sc *= 1.12; }
    e.name = pick(RN1) + pick(RN2);
  }
  e.hp = e.maxHp = b.hp * hpm; e.dmg *= md;
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
    const place = (t, rar) => { let x, z, k = 0; do { x = p.x + rand(-2.6, 2.6); z = p.z + rand(-2.6, 2.6); } while (blocked(x, z, .5) && ++k < 20); spawnEnemy(t, x, z, p, rar); };
    p.mem.forEach(t => place(t, p.magic ? 1 : 0)); if (p.rare) place(p.rare, 2);
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
  if (e.ai === 'boss') { banner((e.name || 'BOSS').toUpperCase(), '#ff4fd8', e.sub || ''); SFX.roar(); } // the guardian bar shows itself (ui/levelhud.js)
}

// ---- spatial hash for neighbour and area queries ----
const CELL = 2, hash = new Map();
export function buildHash() {
  hash.clear();
  for (const e of G.enemies) { if (e.deathT) continue; const k = ((e.x + 60) / CELL | 0) * 1000 + ((e.z + 60) / CELL | 0); let a = hash.get(k); if (!a) hash.set(k, a = []); a.push(e); }
}
// Calls cb for every living enemy whose body overlaps the circle (x, z, r).
export function near(x, z, r, cb) {
  const x0 = (x - r + 60) / CELL | 0, x1 = (x + r + 60) / CELL | 0, z0 = (z - r + 60) / CELL | 0, z1 = (z + r + 60) / CELL | 0;
  for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const a = hash.get(i * 1000 + j); if (a) for (const e of a) if (!e.deathT && (e.x - x) ** 2 + (e.z - z) ** 2 <= (r + e.r) ** 2) cb(e); }
}

// Steer toward a target, bending around rocks ahead.
export function steer(e, tx, tz) {
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
  G.eproj.push({ x: e.x, z: e.z, vx: Math.sin(ang) * spd, vz: Math.cos(ang) * spd, dmg, life: 3, g, r: col === 'arrow' ? .3 : .45 });
}
export function updEnemyProjectiles(dt) {
  for (const p of G.eproj) {
    p.x += p.vx * dt; p.z += p.vz * dt; p.life -= dt; p.g.position.set(p.x, 1.2, p.z);
    if (p.life <= 0 || blocked(p.x, p.z, .05)) p.dead = true;
    else if (P.dead <= 0 && dist(p.x, p.z, P.x, P.z) < p.r + P.r) { p.dead = true; hurtP(p.dmg); burst(p.x, 1.2, p.z, 0xff6060, 6, 3); }
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
  if (!e.awake && d < (e.ai === 'boss' ? 13 : PACK.aggro) && P.dead <= 0) wake(e);
  // status effects
  if (e.flash > 0) e.flash -= dt;
  if (e.shock > 0) { e.shock -= dt; if (Math.random() < dt * 8) emit(sparks, e.x + rand(-.3, .3), rand(.5, e.h), e.z + rand(-.3, .3), rand(-1, 1), rand(1, 2), rand(-1, 1), .25, 0xd0b0ff, 0, 1); }
  if (e.burnT > 0) {
    e.burnT -= dt; e.burnTick -= dt;
    if (Math.random() < dt * 14) emit(sparks, e.x + rand(-.3, .3), rand(.3, 1.2), e.z + rand(-.3, .3), 0, rand(1, 2.5), 0, .4, 0xff5a10);
    if (e.burnTick <= 0) {
      e.burnTick = .5; e.hp -= e.burnDps * .5; e.lastElem = 'fire';
      G.floats.push({ x: e.x, y: e.h, z: e.z, txt: Math.round(e.burnDps * .5), col: '#ff8a3c', size: 10, life: .6, max: .6 });
      if (e.hp <= 0) { kill(e); return; }
    }
  } else e.burnDps = 0;
  if (e.chill > 0) e.chill -= dt;
  const frozen = e.freeze > 0; if (frozen) e.freeze -= dt;
  for (const m of M.mats) {
    if (frozen) { m.color.setHex(0xa8eaff); m.emissive.setHex(0x113344); }
    else { m.color.setHex(m.userData.c); m.emissive.setHex(e.flash > 0 ? 0x888888 : e.shock > 0 && Math.sin(G.gt * 30) > .3 ? 0x2a1a44 : e.rar === 2 ? 0x221a00 : 0); }
  }
  if (Math.abs(e.vx) + Math.abs(e.vz) > .01) { e.x += e.vx * dt; e.z += e.vz * dt; const f = Math.exp(-8 * dt); e.vx *= f; e.vz *= f; }
  if (!e.awake || frozen || P.dead > 0) { pushOut(e); return animE(e, dt); }
  if (e.rise > 0) { e.rise -= dt; e.face = Math.atan2(P.x - e.x, P.z - e.z); pushOut(e); return animE(e, dt); }
  const spd = e.spd * (e.chill > 0 ? .5 : 1), cdm = e.chill > 0 ? 1.6 : 1;
  if (e.fireAura && d < 2.75) { e.auraT = (e.auraT || 0) - dt; if (e.auraT <= 0) { e.auraT = .5; hurtP(3 * (1 + TIER.dmg * (G.depth - 1))); } }
  if (e.ai === 'boss' && bossAI(e, dt)) { pushOut(e); return animE(e, dt); }
  if (e.ai === 'melee' || e.ai === 'boss') {
    if (e.windup > 0) {
      e.windup -= dt; e.face = Math.atan2(P.x - e.x, P.z - e.z);
      if (e.windup <= 0) { e.swing = 1; if (d < e.range + e.r + P.r + .45) { hurtP(e.dmg); if (e.ai === 'boss') { shake(.3); SFX.slam(); } } e.atkT = e.cd * cdm; }
    } else if (d < e.range + e.r + P.r) { e.face = Math.atan2(P.x - e.x, P.z - e.z); e.atkT -= dt; if (e.atkT <= 0) { e.windup = e.ai === 'boss' ? .55 : .32; e.atkSeq = (e.atkSeq || 0) + 1; } }
    else moveE(e, P.x, P.z, spd, dt);
  } else if (e.ai === 'ranged') {
    if (e.windup > 0) { e.windup -= dt; e.face = Math.atan2(P.x - e.x, P.z - e.z); if (e.windup <= 0) { e.swing = 1; eShoot(e, e.face + rand(-.05, .05), 11, e.dmg, 'arrow'); e.shootT = e.cd * cdm * rand(.85, 1.2); } }
    else if (d < 4.5) { const [dx, dz] = steer(e, e.x - (P.x - e.x), e.z - (P.z - e.z)); e.x += dx * spd * dt; e.z += dz * spd * dt; e.walk += dt * spd * 2.6; e.moving = true; e.face = Math.atan2(P.x - e.x, P.z - e.z); }
    else if (d > 9 || !los(e.x, e.z, P.x, P.z)) moveE(e, P.x, P.z, spd, dt);
    else { e.face = Math.atan2(P.x - e.x, P.z - e.z); e.shootT -= dt; if (e.shootT <= 0) { e.windup = .45; e.atkSeq = (e.atkSeq || 0) + 1; } }
  } else if (e.ai === 'bomb') {
    if (e.fuse > 0) { e.fuse -= dt; if (e.fuse <= 0) kill(e); }
    else if (d < 1.9) { e.fuse = .85; telegraph(e.x, e.z, 2.2, .85, 0x9ad060); }
    else moveE(e, P.x, P.z, spd, dt);
  }
  pushOut(e); animE(e, dt);
}

// Returns true while the boss is busy with an ability (so it doesn't also walk or swing).
function bossAI(e, dt) {
  const B = e.abil || BOSS;
  if (!e.phase2 && e.hp < e.maxHp * .5) { e.phase2 = true; e.spd *= 1.3; banner((e.name || 'BOSS').toUpperCase() + ' IS ENRAGED', '#ff4fd8', 'Faster slams · double nova'); SFX.roar(); }
  if (e.cast) {
    const c = e.cast; c.t -= dt; e.face = Math.atan2(P.x - e.x, P.z - e.z);
    if (c.t > 0) return true;
    e.cast = null; e.swing = 1;
    if (c.kind === 'slam') {
      ringFx(c.x, c.z, c.r, 0xff3030, .4, .5); burst(c.x, .4, c.z, 0xff4fd8, 50, 7); flashFx(c.x, .5, c.z, 0xff2bd6, c.r * 2.4, .3); SFX.slam(); shake(.7); stop(.08);
      if (dist(P.x, P.z, c.x, c.z) < c.r + P.r) hurtP(e.dmg * 2);
    }
    if (c.kind === 'nova') for (let k = 0; k < (e.phase2 ? 2 : 1); k++) setTimeout(() => { if (e.deathT || e.gone) return; for (let i = 0; i < B.novaBolts; i++) eShoot(e, i / B.novaBolts * 6.283 + k * .22, 6.5, e.dmg * .7, 0xff2bd6, 1.1); SFX.arc(); }, k * 380);
    if (c.kind === 'summon') for (let i = 0; i < (e.phase2 ? B.summon2 : B.summon); i++) {
      const a = i * 1.26, x = e.x + Math.cos(a) * 2.5, z = e.z + Math.sin(a) * 2.5;
      if (!blocked(x, z, .3)) { const r = spawnEnemy('runner', x, z, null, 0); r.awake = true; r.beat = e.beat; burst(x, .5, z, 0xff4fd8, 10, 3); }
    }
    return true;
  }
  e.abilT -= dt;
  if (e.abilT <= 0) {
    const k = B.rotation[e.rot++ % B.rotation.length]; e.abilT = e.phase2 ? B.abilGap2 : B.abilGap;
    if (k === 'slam') { e.cast = { kind: k, t: e.phase2 ? .75 : 1, x: P.x, z: P.z, r: B.slamR }; telegraph(P.x, P.z, B.slamR, e.cast.t); }
    else if (k === 'nova') { e.cast = { kind: k, t: .6 }; flashFx(e.x, 3, e.z, 0xff2bd6, 5, .6); }
    else { e.cast = { kind: k, t: .7 }; ringFx(e.x, e.z, 3, 0xff4fd8, .7, .2); }
    return true;
  }
  return false;
}

function animE(e, dt) {
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
  M.armL.rotation.x = up && e.ai === 'boss' ? -2.6 : e.type === 'zombie' && e.awake ? -1.3 : e.type === 'archer' && e.awake ? -1.5 : -w * .5;
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
  else if (big && e.lock <= 0 && e.windup <= 0 && e.ai !== 'boss') once([pick(ANIM.hits), ANIM.hitSpeed], .05);
  else if (e.lock <= 0) {
    if (e.moving) { const run = L.walk === 'Running_A'; M.play(L.walk, { speed: Math.min(1.8, Math.max(.6, e.spd * (e.chill > 0 ? .5 : 1) / (run ? 3.6 : 1.7))) }); }
    else M.play(L.idle || 'Idle');
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
}

// Player skills. The skill bar (P.bar) maps slots to skills: Main (Fireball, auto-attacks), Flex A (Frost Nova),
// Guard (Ward), Evade (Blink), plus the life flask. No mana: Flex / Guard / Evade run on cooldowns (P.cd).
import * as T from 'three';
import { G, P, S, shake } from '../core/state.js';
import { SK } from '../data/skills.js';
import { ctl } from '../input/input.js';
import { rand, pick, dist } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { scene, flashLight } from '../render/scene.js';
import { glowSprite, GS } from '../render/assets.js';
import { sparks, glows, emit, ringFx, flashFx, boltFx } from '../render/fx.js';
import { blocked, los } from '../world/map.js';
import { near } from './enemies.js';
import { hit } from './combat.js';
import { gemMile, gemScale } from './gems.js';

// Where the player is aiming: the device's aim point, else the nearest awake enemy, else straight ahead.
export function aim() {
  if (ctl.aim) return ctl.aim;
  let best = null, bd = 13 * 13;
  for (const e of G.enemies) { if (e.deathT || !e.awake) continue; const d = (e.x - P.x) ** 2 + (e.z - P.z) ** 2; if (d < bd) { bd = d; best = e; } }
  if (best) return [best.x, best.z];
  return [P.x + P.moveX * 6, P.z + P.moveZ * 6];
}

// ---- Main: auto-target ----
export const mainRange = () => SK[P.bar.main].range;
const isElite = e => e.rar === 2 || e.guardian || e.ai === 'boss';
// Elites first, then the nearest enemy; within range and in line of sight.
export function mainTarget() {
  const R = mainRange(); let elite = null, ed = 1e9, norm = null, nd = 1e9;
  for (const e of G.enemies) {
    if (e.deathT || e.gone) continue;
    const d = dist(e.x, e.z, P.x, P.z); if (d > R || !los(P.x, P.z, e.x, e.z)) continue;
    if (isElite(e)) { if (d < ed) { ed = d; elite = e; } } else if (d < nd) { nd = d; norm = e; }
  }
  return elite || norm;
}

// Fire Fireball toward a world point.
export function castFireball(ax, az) {
  const F = SK.fireball;
  if (ax === undefined) [ax, az] = aim();
  const base = Math.atan2(ax - P.x, az - P.z), n = S.proj;
  P.face = base; P.castAnim = .12; P.castSeq++; P.lastCast = 'shoot';
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * F.spread, g = new T.Group(); g.add(glowSprite(0xff6a1a, 1.4), glowSprite(0xffe0a0, .55));
    g.position.set(P.x + Math.sin(a) * .7, 1.2, P.z + Math.cos(a) * .7); scene.add(g);
    G.proj.push({ x: g.position.x, z: g.position.z, dx: Math.sin(a), dz: Math.cos(a), sp: F.speed, life: F.life, pierce: S.pierce + gemMile('fireball', 'pierce', 'pierce'), hitS: new Set(), g, storm: false });
  }
  P.fbN++; if (S.storm && P.fbN % 4 === 0) G.proj[G.proj.length - 1].storm = true;
  SFX.fire(); return true;
}

// Main attack: holding ctl.main fires toward the aim point, otherwise it auto-fires at mainTarget(). Paced by attack rate.
function castMain() {
  if (P.cd.main > 0) return false;
  let t = null;
  if (ctl.main && ctl.aim) t = ctl.aim;
  else { const e = mainTarget(); if (e) t = [e.x, e.z]; else if (ctl.main) t = aim(); }
  if (!t) return false;
  castFireball(t[0], t[1]);
  P.cd.main = SK[P.bar.main].rate / (S.cast * P.eff.atk); return true;
}

// Arc: instant chain lightning, only cast by effects (Heart of the Storm) from fx/fz. `free` stays for the call sites.
export function castArc(fx = P.x, fz = P.z, free = true) {
  const A = SK.arc, tx = fx, tz = fz;
  let first = null, bd = 1e9;
  for (const e of G.enemies) { if (e.deathT || dist(e.x, e.z, fx, fz) > A.range) continue; const d = dist(e.x, e.z, tx, tz); if (d < bd) { bd = d; first = e; } }
  const pts = [{ x: fx, z: fz }];
  if (!first) return true;
  const hitS = new Set(); let cur = first;
  for (let k = 0; k <= A.chains && cur; k++) {
    hitS.add(cur); pts.push({ x: cur.x, z: cur.z });
    hit(cur, A.mult, 'light', { sk: 'arc' }); if (Math.random() < A.shockChance) cur.shock = A.shockT;
    for (let i = 0; i < 4; i++) emit(sparks, cur.x, 1.1, cur.z, rand(-4, 4), rand(1, 4), rand(-4, 4), .3, 0xe0c8ff, 4, 2);
    let nx = null, nd = A.chainRange; const c = cur;
    near(c.x, c.z, A.chainRange, e => { if (hitS.has(e)) return; const d = dist(e.x, e.z, c.x, c.z); if (d < nd) { nd = d; nx = e; } });
    cur = nx;
  }
  boltFx(pts, 0xb06bff); flashLight(first.x, first.z, 0xb06bff, 2.5, .15); SFX.arc(); return true;
}

// ---- Flex A: Frost Nova ----
export function castNova(free = false) {
  const N = SK.nova;
  if (!free) { P.castAnim = .25; P.castSeq++; P.lastCast = 'nova'; }
  const r = N.radius * S.aoe;
  near(P.x, P.z, r, e => {
    const d = dist(e.x, e.z, P.x, P.z) || 1; hit(e, N.mult, 'cold', { kx: (e.x - P.x) / d, kz: (e.z - P.z) / d, sk: 'nova' });
    if (!e.deathT) { if (e.ai === 'boss') e.chill = 3; else e.freeze = N.freeze * S.freeze; }
  });
  ringFx(P.x, P.z, r, 0x9fe8ff, .45, .1); ringFx(P.x, P.z, r * .7, 0xffffff, .3, .1); flashFx(P.x, .6, P.z, 0x7fd8ff, r * 2.2, .35);
  for (let i = 0; i < 60; i++) { const a = rand(0, 6.28), s = rand(5, 11) * S.aoe; emit(sparks, P.x, rand(.3, 1.2), P.z, Math.cos(a) * s, rand(0, 2), Math.sin(a) * s, rand(.35, .5), pick([0xbff0ff, 0xffffff, 0x7fd8ff]), 2, 3); }
  flashLight(P.x, P.z, 0x7fd8ff, 4, .35); SFX.nova(); shake(.12); return true;
}

// ---- Guard: Ward (absorb shield) ----
export function endWard() { const w = P.ward; if (!w) return; scene.remove(w.g); w.g.material.dispose(); P.ward = null; }
export function castWard() {
  const W = SK.ward; endWard();
  const g = new T.Mesh(GS, new T.MeshBasicMaterial({ color: 0x8fe0ff, transparent: true, opacity: .2, depthWrite: false, blending: T.AdditiveBlending }));
  g.scale.setScalar(W.radius); g.position.set(P.x, 1, P.z); scene.add(g);
  const hp = S.maxLife * W.absorb * gemScale('ward'); P.ward = { hp, max: hp, t: W.dur, flash: 0, g };
  P.castAnim = .3; P.castSeq++; P.lastCast = 'ward';
  ringFx(P.x, P.z, W.radius * 1.6, 0x8fe0ff, .4, .3); flashFx(P.x, 1, P.z, 0x8fe0ff, 3.4, .3); flashLight(P.x, P.z, 0x8fe0ff, 3, .3); SFX.nova();
  for (let i = 0; i < 16; i++) emit(glows, P.x + rand(-.6, .6), rand(.2, 1.8), P.z + rand(-.6, .6), 0, rand(.5, 2), 0, rand(.4, .7), 0x8fe0ff);
  return true;
}
export function updWard(dt) {
  const w = P.ward; if (!w) return;
  w.t -= dt; w.flash = Math.max(0, w.flash - dt);
  if (w.t <= 0 || w.hp <= 0 || P.dead > 0) { endWard(); return; }
  w.g.position.set(P.x, 1, P.z);
  w.g.material.opacity = (.1 + .12 * w.hp / w.max + Math.sin(G.gt * 6) * .02 + w.flash * 1.5) * Math.min(1, w.t * 2);
}

// ---- Evade: Blink (away from the nearest threat) ----
export function castBlink() {
  const B = SK.blink, th = [], range = B.range * gemScale('blink');
  for (const e of G.enemies) if (!e.deathT && e.awake) { const d = dist(e.x, e.z, P.x, P.z); if (d < B.threat) th.push([e.x, e.z, 1 / (1 + d) ** 2]); }
  for (const p of G.eproj) { const d = dist(p.x, p.z, P.x, P.z); if (d < B.threat) th.push([p.x, p.z, 1 / (1 + d) ** 2]); }
  let best = null, bs = -1e9;
  for (let i = 0; i < B.tries; i++) {
    const a = P.face + i / B.tries * Math.PI * 2;
    for (const L of [range, range * .8, range * .6, B.minRange]) {
      const x = P.x + Math.sin(a) * L, z = P.z + Math.cos(a) * L;
      if (blocked(x, z, P.r + .25)) continue;
      let s;
      if (th.length) { let sw = 0, sd = 0, md = 1e9; for (const [tx, tz, w] of th) { const d = dist(x, z, tx, tz); sw += w; sd += w * d; md = Math.min(md, d); } s = sd / sw + md * .5; }
      else s = Math.cos(a - P.face) * 3 + L * .1; // nothing threatening: keep going the way we face
      if (s > bs) { bs = s; best = [x, z, a]; }
    }
  }
  if (!best) return false;
  const sx = P.x, sz = P.z;
  P.x = best[0]; P.z = best[1]; P.face = Math.atan2(best[0] - sx, best[1] - sz);
  P.invuln = Math.max(P.invuln, B.invuln); P.castSeq++; P.lastCast = 'dash';
  for (const [x, z] of [[sx, sz], [P.x, P.z]]) {
    flashFx(x, 1, z, 0xb08aff, 3, .3); ringFx(x, z, 1.6, 0xd0b0ff, .3, .2); flashLight(x, z, 0xb08aff, 3, .3);
    for (let i = 0; i < 14; i++) emit(glows, x + rand(-.3, .3), rand(.3, 1.6), z + rand(-.3, .3), 0, rand(.5, 2), 0, rand(.3, .6), 0xc8a0ff);
  }
  SFX.dash(); return true;
}

// Cast whatever skill sits in a bar slot. Flex / Guard / Evade are gated by their cooldown; Main by its attack timer.
const CAST = { fireball: castMain, nova: () => castNova(), ward: castWard, blink: castBlink };
export function castSlot(slot) {
  const id = P.bar[slot]; if (!id || P.dead > 0) return false;
  if (slot === 'main') return castMain();
  if (P.cd[slot] > 0 || !CAST[id]()) return false;
  P.cd[slot] = SK[id].cd * (1 - S.cdr); return true;
}

export function useFlask() {
  const F = SK.flask; if (P.flask < 1 || P.life >= S.maxLife) return;
  P.flask--; P.flaskT = F.dur; P.flaskRate = S.maxLife * F.heal / F.dur; SFX.flask();
  for (let i = 0; i < 20; i++) emit(glows, P.x + rand(-.4, .4), rand(.2, 1.5), P.z + rand(-.4, .4), 0, rand(1, 3), 0, rand(.4, .8), 0xff3a5a);
}

// Move Fireballs; explode on contact, walls or end of range.
export function updProjectiles(dt, explode) {
  for (const p of G.proj) {
    p.x += p.dx * p.sp * dt; p.z += p.dz * p.sp * dt; p.life -= dt; p.g.position.set(p.x, 1.2, p.z);
    emit(sparks, p.x, 1.2, p.z, rand(-.6, .6), rand(0, 1), rand(-.6, .6), .3, pick([0xff8a3c, 0xffc060]), 0, 2);
    if (Math.random() < .5) emit(glows, p.x, 1.2, p.z, 0, .3, 0, .22, 0xff4a10);
    let boom = p.life <= 0 || blocked(p.x, p.z, .15);
    if (!boom) {
      let tgt = null; near(p.x, p.z, .45, e => { if (!tgt && !p.hitS.has(e)) tgt = e; });
      if (tgt) { if (p.pierce > 0) { p.pierce--; p.hitS.add(tgt); hit(tgt, SK.fireball.pierceMult, 'fire', { kx: p.dx, kz: p.dz, sk: 'fireball' }); } else boom = true; }
    }
    if (boom) { p.dead = true; scene.remove(p.g); explode(p.x, p.z, 1, p.storm); }
  }
  G.proj = G.proj.filter(p => !p.dead);
}

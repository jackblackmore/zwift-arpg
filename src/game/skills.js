// Player skills, one cast function per skill gem (game/gems.js casts them from the skill bar), plus the life flask.
// Cast functions do the effect (skills cost nothing: held skills are limited by cast time, press skills by their slot); cooldowns and charges belong to the bar slot (game/gems.js).
import * as T from 'three';
import { G, P, S, shake } from '../core/state.js';
import { SK } from '../data/skills.js';
import { SUPPORTS } from '../data/gems.js';
import { EXTRA } from '../data/items.js';
import { ctl } from '../input/input.js';
import { rand, pick, dist } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { scene, flashLight } from '../render/scene.js';
import { glowSprite } from '../render/assets.js';
import { sparks, glows, emit, ringFx, flashFx, boltFx } from '../render/fx.js';
import { blocked } from '../world/map.js';
import { near } from './enemies.js';
import { hit, addPatch } from './combat.js';

// Where the player is aiming: the device's aim point, else the nearest awake enemy, else straight ahead.
export function aim() {
  if (ctl.aim) return ctl.aim;
  let best = null, bd = 13 * 13;
  for (const e of G.enemies) { if (e.deathT || !e.awake) continue; const d = (e.x - P.x) ** 2 + (e.z - P.z) ** 2; if (d < bd) { bd = d; best = e; } }
  if (best) return [best.x, best.z];
  return [P.x + P.moveX * 6, P.z + P.moveZ * 6];
}

export function castFireball() {
  const F = SK.fireball;
  const [ax, az] = aim(), base = Math.atan2(ax - P.x, az - P.z), k = S.sk.fireball, n = k.proj;
  P.face = base; P.castAnim = .22; P.castSeq++; P.lastCast = 'shoot';
  for (let i = 0; i < n; i++) {
    const a = base + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * F.spread, g = new T.Group(); // the first flies at the aim point, extras fan out either side g.add(glowSprite(0xff6a1a, 1.4), glowSprite(0xffe0a0, .55));
    g.position.set(P.x + Math.sin(a) * .7, 1.2, P.z + Math.cos(a) * .7); scene.add(g);
    G.proj.push({ x: g.position.x, z: g.position.z, dx: Math.sin(a), dz: Math.cos(a), sp: F.speed, life: F.life, pierce: k.pierce, hitS: new Set(), g, storm: false });
  }
  P.fbN++; if (S.storm && P.fbN % EXTRA.storm.every === 0) G.proj[G.proj.length - 1].storm = true;
  SFX.fire(); return true;
}

// Arc: instant chain lightning. free = cast by an effect (no cast animation, starts from fx/fz).
export function castArc(fx = P.x, fz = P.z, free = false) {
  const A = SK.arc;
  let tx, tz;
  if (free) { tx = fx; tz = fz; } else { [tx, tz] = aim(); P.face = Math.atan2(tx - P.x, tz - P.z); P.castAnim = .25; P.castSeq++; P.lastCast = 'arc'; }
  let first = null, bd = 1e9;
  for (const e of G.enemies) { if (e.deathT || dist(e.x, e.z, fx, fz) > A.range) continue; const d = dist(e.x, e.z, tx, tz); if (d < bd && (free || d < 4.5)) { bd = d; first = e; } }
  if (!first && !free) for (const e of G.enemies) { if (e.deathT) continue; const d = dist(e.x, e.z, P.x, P.z); if (d < 7 && d < bd) { bd = d; first = e; } }
  const pts = [{ x: fx, z: fz }];
  if (!first) {
    if (!free) { const L = Math.min(6, dist(tx, tz, fx, fz)), a = Math.atan2(tx - fx, tz - fz); pts.push({ x: fx + Math.sin(a) * L, z: fz + Math.cos(a) * L }); boltFx(pts, 0xb06bff); SFX.arc(); }
    return true;
  }
  const hitS = new Set(), K = S.sk.arc; let cur = first;
  for (let k = 0; k <= K.chains && cur; k++) {
    hitS.add(cur); pts.push({ x: cur.x, z: cur.z });
    hit(cur, A.mult, 'light', { gem: 'arc' }); if (K.conduit || Math.random() < A.shockChance) { cur.shock = A.shockT; cur.shockMore = K.conduit ? SUPPORTS.conduit.shockMore : A.shockMore; }
    for (let i = 0; i < 4; i++) emit(sparks, cur.x, 1.1, cur.z, rand(-4, 4), rand(1, 4), rand(-4, 4), .3, 0xe0c8ff, 4, 2);
    let nx = null, nd = A.chainRange; const c = cur;
    near(c.x, c.z, A.chainRange, e => { if (hitS.has(e)) return; const d = dist(e.x, e.z, c.x, c.z); if (d < nd) { nd = d; nx = e; } });
    cur = nx;
  }
  boltFx(pts, 0xb06bff); flashLight(first.x, first.z, 0xb06bff, 2.5, .15); SFX.arc(); return true;
}

export function castNova(free = false) {
  const N = SK.nova;
  if (!free) { P.castAnim = .25; P.castSeq++; P.lastCast = 'nova'; }
  const K = S.sk.nova, r = N.radius * S.aoe * K.novaR;
  near(P.x, P.z, r, e => {
    const d = dist(e.x, e.z, P.x, P.z) || 1; hit(e, N.mult, 'cold', { gem: 'nova', kx: (e.x - P.x) / d, kz: (e.z - P.z) / d });
    if (!e.deathT) { if (e.type === 'boss') e.chill = N.bossChill; else { e.freeze = N.freeze * S.freeze; e.shatter = K.shatter; } }
  });
  ringFx(P.x, P.z, r, 0x9fe8ff, .45, .1); ringFx(P.x, P.z, r * .7, 0xffffff, .3, .1); flashFx(P.x, .6, P.z, 0x7fd8ff, r * 2.2, .35);
  for (let i = 0; i < 60; i++) { const a = rand(0, 6.28), s = rand(5, 11) * S.aoe; emit(sparks, P.x, rand(.3, 1.2), P.z, Math.cos(a) * s, rand(0, 2), Math.sin(a) * s, rand(.35, .5), pick([0xbff0ff, 0xffffff, 0x7fd8ff]), 2, 3); }
  flashLight(P.x, P.z, 0x7fd8ff, 4, .35); SFX.nova(); shake(.12); return true;
}

export function castShield() {
  const H = SK.shield;
  P.shield = S.maxLife * H.absorb * S.sk.shield.shieldMul; P.shieldT = H.dur;
  P.castAnim = .2; P.castSeq++; P.lastCast = 'shield';
  ringFx(P.x, P.z, 1.3, 0x7fb8ff, .35, .1); flashFx(P.x, 1, P.z, 0x7fb8ff, 3, .3);
  for (let i = 0; i < 24; i++) { const a = rand(0, 6.28); emit(glows, P.x + Math.cos(a) * .9, rand(.2, 1.8), P.z + Math.sin(a) * .9, 0, rand(.3, 1), 0, rand(.3, .6), 0x9fc8ff); }
  SFX.nova(); return true;
}

export function castDash() {
  const D = SK.dash;
  // Toward the aim point if the device gives one, else the way the player is moving, else facing.
  let a, L = D.range;
  if (ctl.aim) { a = Math.atan2(ctl.aim[0] - P.x, ctl.aim[1] - P.z); L = Math.min(D.range, dist(ctl.aim[0], ctl.aim[1], P.x, P.z) || D.range); }
  else a = Math.hypot(ctl.mx, ctl.mz) > .1 ? Math.atan2(ctl.mx, ctl.mz) : P.face;
  const sx = P.x, sz = P.z; let lastPatch = -1;
  for (let t = 0; t <= L; t += .2) {
    const nx = sx + Math.sin(a) * t, nz = sz + Math.cos(a) * t; if (blocked(nx, nz, P.r)) break;
    P.x = nx; P.z = nz;
    if (t - lastPatch >= D.patchEvery) { lastPatch = t; addPatch(nx, nz, D.patchR * S.aoe, SK.burn.life, 'dash'); }
    for (let i = 0; i < 2; i++) emit(glows, nx + rand(-.2, .2), rand(.4, 1.4), nz + rand(-.2, .2), 0, rand(.5, 2), 0, rand(.3, .6), 0xff5a10, 0, 1);
  }
  P.face = a; P.invuln = D.invuln; P.castSeq++; P.lastCast = 'dash';
  flashFx(sx, 1, sz, 0xff6a1a, 3, .3); flashFx(P.x, 1, P.z, 0xffa060, 3, .3); flashLight(P.x, P.z, 0xff6a1a, 3, .3); SFX.dash();
  return true;
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
      if (tgt) { if (p.pierce > 0) { p.pierce--; p.hitS.add(tgt); hit(tgt, SK.fireball.pierceMult, 'fire', { gem: 'fireball', kx: p.dx, kz: p.dz }); } else boom = true; }
    }
    if (boom) { p.dead = true; scene.remove(p.g); explode(p.x, p.z, 1, p.storm); }
  }
  G.proj = G.proj.filter(p => !p.dead);
}

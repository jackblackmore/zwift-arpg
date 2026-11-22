// Corpses and the necromancer's revive channel.
// combat.kill() calls addCorpse(e) for real kills of non-boss monsters (data/monsters.js CORPSE: life, max). A corpse is { x, z, type, rar, maxHp, t, g }
// with a small bone-pile decal g; it expires after t seconds. takeCorpse(x, z, r) hands the nearest one in range to whoever wants it
// (revives, and later Corpse Explosion / Raise Skeletons). The necromancer (ai 'necro') and the bosses' 'raise' ability revive them through a
// telegraphed channel: beginRaise (a ring on every claimed corpse and a beam to it), tickRaise, finishRaise; endChannel cancels (the caster died).
import * as T from 'three';
import { G, P } from '../core/state.js';
import { CORPSE } from '../data/monsters.js';
import { rand, dist } from '../core/util.js';
import { scene } from '../render/scene.js';
import { GB, GS, decal } from '../render/assets.js';
import { burst, telegraph, ringFx, flashFx } from '../render/fx.js';
import { dbg } from '../core/dbg.js';
import { los } from '../world/map.js';
import { spawnEnemy, rouse, steer, eShoot } from './enemies.js';

const boneMat = new T.MeshLambertMaterial({ color: 0xb8ae96 });
const REVIVE = 0xb060ff;

// ---------------------------------------------------------------- corpses

// src: the dead monster (or anything with x, z, type, rar, maxHp, r).
export function addCorpse(src) {
  const g = new T.Group(), k = Math.min(1.6, (src.r || .4) / .38);
  for (let i = 0; i < 4; i++) { const b = new T.Mesh(GB, boneMat); b.scale.set(.42, .06, .07); b.position.set(rand(-.3, .3), .05 + i * .02, rand(-.3, .3)); b.rotation.y = rand(0, 3); g.add(b); }
  const s = new T.Mesh(GS, boneMat); s.scale.setScalar(.13); s.position.set(rand(-.15, .15), .13, rand(-.15, .15)); g.add(s);
  g.add(decal(0x6a1a10, 1.5 * k)); g.scale.setScalar(k);
  g.position.set(src.x, 0, src.z); scene.add(g);
  const c = { x: src.x, z: src.z, type: src.type, rar: src.rar || 0, maxHp: src.maxHp, t: CORPSE.life, g, k };
  G.corpses.push(c);
  while (G.corpses.length > CORPSE.max) dropCorpse(G.corpses[0]);
  return c;
}
function dropCorpse(c) { if (c.g) { scene.remove(c.g); c.g = null; } const i = G.corpses.indexOf(c); if (i >= 0) G.corpses.splice(i, 1); }
// Ticked from game/update.js. Corpses being channelled on stay until the channel ends; the others shrink away over their last second.
export function updCorpses(dt) {
  for (const c of G.corpses) {
    if (!c.claimed) c.t -= dt;
    if (c.g) c.g.scale.setScalar(c.k * Math.min(1, Math.max(.01, c.t)));
  }
  for (const c of G.corpses.slice()) if (c.t <= 0) dropCorpse(c);
}
// The nearest corpse within r of (x, z), removed from the world and returned (null if none).
export function takeCorpse(x, z, r) {
  let best = null, bd = r * r;
  for (const c of G.corpses) { const d = (c.x - x) ** 2 + (c.z - z) ** 2; if (d <= bd) { bd = d; best = c; } }
  if (best) dropCorpse(best);
  return best;
}
export function clearCorpses() { for (const c of G.corpses.slice()) dropCorpse(c); G.corpses = []; }
// Up to n unclaimed corpses within r of (x, z), nearest first.
export function corpsesNear(x, z, r, n) {
  return G.corpses.filter(c => !c.claimed && dist(c.x, c.z, x, z) <= r).sort((a, b) => dist(a.x, a.z, x, z) - dist(b.x, b.z, x, z)).slice(0, n);
}

// ---------------------------------------------------------------- reviving

// A risen monster of the corpse's type: normal rarity, awake, part of the caster's beat, helpless for a moment. No xp and no corpse of its own.
export function revive(c, beat, rise) {
  const r = spawnEnemy(c.type, c.x, c.z, null, 0);
  r.beat = beat; r.revived = true; r.xp = 0; r.awake = false; rouse(r); if (!(r.rise > 0)) r.rise = rise;
  burst(c.x, .4, c.z, REVIVE, 14, 3); flashFx(c.x, 1, c.z, REVIVE, 2.4, .4);
  return r;
}

function beam() {
  const m = new T.Mesh(GB, new T.MeshBasicMaterial({ color: REVIVE, transparent: true, opacity: .8, depthWrite: false, blending: T.AdditiveBlending }));
  m.scale.set(.1, .1, 1); scene.add(m); return m;
}
// Starts a channel on the caster's cast slot: a ring on each corpse in list (its telegraph, for t seconds) and a beam from the caster to it.
export function beginRaise(e, list, t, extra = {}) {
  e.cast = { kind: 'raise', t, max: t, list, beams: list.map(beam), ...extra };
  for (const c of list) { c.claimed = true; telegraph(c.x, c.z, 1.2, t, REVIVE); }
  ringFx(e.x, e.z, 2.4, REVIVE, t, .3); flashFx(e.x, 2, e.z, REVIVE, 3, t);
  tickRaise(e);
}
// Keeps the beams on their corpses (called every tick while the channel runs).
export function tickRaise(e) {
  const c = e.cast; if (!c || !c.beams) return;
  const k = 1 - Math.max(0, c.t) / c.max;
  c.beams.forEach((m, i) => {
    const t = c.list[i], live = t && t.g && G.corpses.includes(t); m.visible = !!live; if (!live) return;
    const dx = t.x - e.x, dz = t.z - e.z, dy = .25 - 1.5, len = Math.hypot(dx, dy, dz);
    m.position.set(e.x + dx / 2, 1.5 + dy / 2, e.z + dz / 2); m.lookAt(t.x, .25, t.z); m.scale.set(.06 + .1 * k, .06 + .1 * k, len);
    m.material.opacity = .45 + .4 * Math.sin(G.gt * 30) ** 2;
  });
}
function dropBeams(c) { if (c && c.beams) { c.beams.forEach(m => { scene.remove(m); m.material.dispose(); }); c.beams = null; } }
// The channel completed: the corpses still on the ground rise. Returns how many did.
export function finishRaise(e, c, rise) {
  dropBeams(c); let n = 0;
  for (const t of c.list) { t.claimed = false; if (G.corpses.includes(t)) { dropCorpse(t); revive(t, e.beat, rise); n++; } }
  return n;
}
// The caster died (or its level ended): the channel stops, nothing rises, the corpses stay.
export function endChannel(e) {
  const c = e.cast; if (!c || c.kind !== 'raise') return;
  dropBeams(c); for (const t of c.list || []) t.claimed = false; e.cast = null;
}

// ---------------------------------------------------------------- the necromancer

// AI for ai 'necro': keeps its distance like an archer, plinks with a weak bolt and, whenever a corpse lies within rev.range and the revive
// is ready, stands still and channels. Called from enemies.js updEnemy with the distance to the hero.
export function necroAI(e, dt, d, spd, cdm, moveE) {
  const N = e.rev, face = () => { e.face = Math.atan2(P.x - e.x, P.z - e.z); };
  if (e.revT === undefined) e.revT = N.first;
  const c = e.cast;
  if (c && c.kind === 'raise') {
    c.t -= dt; face(); tickRaise(e);
    if (c.t <= 0) { e.cast = null; e.swing = 1; finishRaise(e, c, N.rise); e.revT = N.cd; }
    return;
  }
  e.revT -= dt;
  if (e.windup > 0) { e.windup -= dt; face(); if (e.windup <= 0) { e.swing = 1; eShoot(e, e.face + rand(-.05, .05), 8, e.dmg, REVIVE, 1); e.shootT = e.cd * cdm * rand(.85, 1.2); } return; }
  if (e.revT <= 0) { const list = corpsesNear(e.x, e.z, N.range, N.n); if (list.length) { beginRaise(e, list, N.channel); return; } }
  if (d < N.keepMin) { const [dx, dz] = steer(e, e.x - (P.x - e.x), e.z - (P.z - e.z)); e.x += dx * spd * dt; e.z += dz * spd * dt; e.walk += dt * spd * 2.6; e.moving = true; face(); }
  else if (d > N.keepMax || !los(e.x, e.z, P.x, P.z)) moveE(e, P.x, P.z, spd, dt);
  else { face(); e.shootT -= dt; if (e.shootT <= 0) { e.windup = .45; e.atkSeq = (e.atkSeq || 0) + 1; } }
}

Object.assign(dbg, { takeCorpse, addCorpse, corpses: () => G.corpses, corpsesNear });

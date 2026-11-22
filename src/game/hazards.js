// Level hazards: poison pools. Ground pools that hurt the hero while he stands in them (visible: a green ring and a bubbling glow).
// Ambient pools are placed along the route when a level with hazards.pools is built (buildHazards, called from level.js); more drop where
// bloaters burst (combat.js, if the level's hazards.pools.bloat is set) and from the Drowned Warden's 'pools' ability.
// Tuning: data/levels.js POOL (defaults) and a level's hazards.pools. Damage is dps x the level's dmg scale, every `tick` seconds, through hurtP.
import * as T from 'three';
import { G, P } from '../core/state.js';
import { POOL, LEVEL, lvDef, lvScale } from '../data/levels.js';
import { rand, dist, clamp } from '../core/util.js';
import { scene } from '../render/scene.js';
import { GRING, aura } from '../render/assets.js';
import { emit, glows } from '../render/fx.js';
import { dbg } from '../core/dbg.js';
import { blocked, inClear } from '../world/map.js';
import { hurtP } from './combat.js';

export const pools = []; // { x, z, r, life (Infinity = whole level), dps, tick, t, g }
const ringMat = new T.MeshBasicMaterial({ color: 0xa8e050, transparent: true, opacity: .75, depthWrite: false, side: T.DoubleSide });

// o: { r, life, dps }, each defaulting to POOL (dps is per second at Crypt 1; the level's dmg scale is applied here).
export function addPool(x, z, o = {}) {
  const r = o.r || POOL.r, g = new T.Group();
  g.add(aura(0x2f8a24, r * 2.5, .6), aura(0x8be04a, r * 1.5, .3));
  const ring = new T.Mesh(GRING, ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = .12; ring.scale.set(r, r, 1); g.add(ring);
  g.position.set(x, 0, z); scene.add(g);
  const p = { x, z, r, life: o.life ?? POOL.life, dps: (o.dps ?? POOL.dps) * lvScale().dmg, tick: POOL.tick, t: .2, g, age: 0 };
  pools.push(p); return p;
}
export function clearPools() { for (const p of pools) scene.remove(p.g); pools.length = 0; }

// Per tick: pools bubble, expire (dropped ones shrink away at the end) and hurt the hero standing inside.
export function updPools(dt) {
  for (const p of pools) {
    p.age += dt; if (p.life !== Infinity) p.life -= dt;
    p.g.scale.setScalar(Math.min(1, p.age * 3, p.life === Infinity ? 1 : Math.max(.01, p.life)));
    if (Math.random() < dt * 5 * p.r) emit(glows, p.x + rand(-p.r, p.r) * .7, .2, p.z + rand(-p.r, p.r) * .7, 0, rand(.4, 1), 0, rand(.5, 1), 0x8be04a);
    p.t -= dt;
    if (p.t <= 0) { p.t = p.tick; if (P.dead <= 0 && dist(P.x, P.z, p.x, p.z) < p.r + P.r * .5) hurtP(p.dps * p.tick); }
  }
  for (let i = pools.length - 1; i >= 0; i--) if (pools[i].life <= 0) { scene.remove(pools[i].g); pools.splice(i, 1); }
}

// Ambient pools for the current level: spread along the route, off the entrance, the beat sites and the guardian's arena.
// route: the level's route points (with arc length s), pts: its positions as [x, z] helper from level.js.
export function buildHazards(routeAt, len) {
  clearPools();
  const H = lvDef().hazards && lvDef().hazards.pools; if (!H) return;
  const [rmin, rmax] = H.r, [l0, l1] = H.lateral || [-3, 3];
  for (let tries = 0, n = 0; tries < H.count * 30 && n < H.count; tries++) {
    const r = rand(rmin, rmax), s = rand(len * .06, len * .94), p = routeAt(s), off = rand(l0, l1), x = p.x - p.dz * off, z = p.z + p.dx * off;
    if (blocked(x, z, r * .6) || pools.some(q => dist(q.x, q.z, x, z) < q.r + r + 2)) continue;
    if (G.clear.some((c, i) => i < 1 + G.level.beats.length && dist(x, z, c.x, c.z) < c.r + r)) continue; // the entrance and the beat clearings
    if (dist(x, z, G.bossSpot.x, G.bossSpot.z) < LEVEL.start.clear + r) continue;
    addPool(x, z, { r, life: Infinity, dps: H.dps }); n++;
  }
}

Object.assign(dbg, { pools: () => pools, addPool });

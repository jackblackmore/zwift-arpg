// Poison pools (Flooded Tombs; data/dungeon.js POOLS, laid out by world/gen.js): green pools on the floor that hurt you while you
// stand in them. It's the floor, so the shield doesn't stop it; poison resistance does, and a roll's invulnerability skips a tick.
// The autopilot walks round them (game/enemies.js steer) and steps out of one when what it's fighting stands outside it
// (game/autopilot.js). Their meshes live in G.world, rebuilt with the map.
import * as T from 'three';
import { G, P } from '../core/state.js';
import { POOLS } from '../data/dungeon.js';
import { GDISC, GRING, decal } from '../render/assets.js';
import { glows, emit } from '../render/fx.js';
import { rand } from '../core/util.js';
import { hurtP } from './combat.js';
import { tierDmg, dmgType } from './formulas.js';

const COL = 0x6ad040, EDGE = 0xb8ff60, DARK = 0x1c3a10;

// Called by newMap after the map is built: one pool per G.layout.pools entry.
export function initPools() {
  G.pools = [];
  const L = G.layout; if (!L || !L.pools) return;
  for (const p of L.pools) {
    const g = new T.Group(); g.position.set(p.x, 0, p.z);
    const base = new T.Mesh(GDISC, new T.MeshBasicMaterial({ color: DARK, transparent: true, opacity: .75, depthWrite: false })); base.rotation.x = -Math.PI / 2; base.position.y = .045; base.scale.set(p.r, p.r, 1); g.add(base);
    const top = new T.Mesh(GDISC, new T.MeshBasicMaterial({ color: COL, transparent: true, opacity: .35, depthWrite: false, blending: T.AdditiveBlending })); top.rotation.x = -Math.PI / 2; top.position.y = .05; top.scale.set(p.r * .92, p.r * .92, 1); g.add(top);
    const rim = new T.Mesh(GRING, new T.MeshBasicMaterial({ color: EDGE, transparent: true, opacity: .55, depthWrite: false })); rim.rotation.x = -Math.PI / 2; rim.position.y = .055; rim.scale.set(p.r, p.r, 1); g.add(rim);
    g.add(decal(COL, p.r * 2.8));
    G.world.add(g);
    G.pools.push({ x: p.x, z: p.z, r: p.r, tick: 0, top, rim, ph: rand(0, 6) });
  }
}

// The pool you're standing in (your centre inside it), or null. pad: a margin (positive: a little outside counts too).
export function poolAt(x, z, pad = 0) { for (const p of G.pools) if ((x - p.x) ** 2 + (z - p.z) ** 2 < (p.r + pad) ** 2) return p; return null; }

export function updPools(dt) {
  if (!G.pools.length) return;
  for (const p of G.pools) {
    p.top.material.opacity = .3 + .08 * Math.sin(G.gt * 2.2 + p.ph); p.rim.material.opacity = .45 + .15 * Math.sin(G.gt * 3 + p.ph);
    if (Math.random() < dt * p.r * 3) { const a = rand(0, 6.3), d = Math.sqrt(Math.random()) * p.r * .9; emit(glows, p.x + Math.cos(a) * d, .1, p.z + Math.sin(a) * d, 0, rand(.4, 1), 0, rand(.4, .8), Math.random() < .5 ? COL : EDGE); } // bubbles
  }
  const p = P.dead > 0 ? null : poolAt(P.x, P.z);
  for (const q of G.pools) if (q !== p) q.tick = 0; // stepping in bites at once
  if (!p) return;
  p.tick -= dt; if (p.tick > 0) return;
  p.tick = POOLS.tick;
  hurtP(POOLS.dps * POOLS.tick * tierDmg(G.tier), 'pool', { type: dmgType(POOLS.dt, G.tier) }); // no `from`: the floor, so the shield can't block it
}

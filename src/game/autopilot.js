// Autopilot for RIDE mode: steer toward the nearest fight, then loot, then wherever levelGoal() says (next pack, beat, guardian, portal).
// Holds at casting range and backs off when monsters get too close, so the rider only pedals and casts.
import { G, P } from '../core/state.js';
import { RIDE } from '../data/ride.js';
import { dist } from '../core/util.js';
import { steer } from './enemies.js';
import { levelGoal } from './level.js';
import { los } from '../world/map.js';

// Stuck detection: if we've been trying to move but haven't, sidestep for a moment.
const ST = { x: 0, z: 0, t: 0, side: 0, sideT: 0 };

const toward = (x, z) => steer(P, x, z);
const away = (x, z) => steer(P, P.x * 2 - x, P.z * 2 - z);

export function autopilot(dt = .033) {
  const d = pick();
  if (Math.hypot(d[0], d[1]) < .01) { ST.t = 0; return d; }
  if (ST.sideT > 0) { ST.sideT -= dt; return [d[0] * .3 - d[1] * ST.side, d[1] * .3 + d[0] * ST.side]; }
  if (dist(P.x, P.z, ST.x, ST.z) < .05) { ST.t += dt; if (ST.t > .8) { ST.t = 0; ST.sideT = .9; ST.side = Math.random() < .5 ? 1 : -1; } } else ST.t = 0;
  ST.x = P.x; ST.z = P.z;
  return d;
}

function pick() {
  const A = RIDE.autopilot;
  let best = null, bd = A.engage;
  for (const e of G.enemies) { if (e.deathT) continue; const d = dist(e.x, e.z, P.x, P.z); if (d < bd) { bd = d; best = e; } }
  if (best) {
    if (bd > A.keep || !los(P.x, P.z, best.x, best.z)) return toward(best.x, best.z); // close in, or get round the rock
    if (bd < A.kite) return away(best.x, best.z);
    return [0, 0];
  }
  let loot = null, ld = A.loot;
  for (const d of G.ground) { if (!d.landed || d.gone) continue; const dd = dist(d.x, d.z, P.x, P.z); if (dd < ld) { ld = dd; loot = d; } }
  if (loot) return toward(loot.x, loot.z);
  const g = levelGoal();
  if (g && dist(P.x, P.z, g.x, g.z) > g.r) return toward(g.x, g.z);
  return [0, 0];
}

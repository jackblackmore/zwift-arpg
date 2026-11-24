// Autopilot for RIDE mode: steer toward the nearest fight, then loot, then the next room. At a room with more than one way on, it
// stops and lets you pick with the D-pad (game/route.js); otherwise it clears everything along the route (`steer` finds the way
// round walls), then the boss / portal.
// A melee hero: it walks into the fight and stays in swing reach (the Main gem auto-attacks), so the rider pedals and times the
// Guard, Evade, Flex and Surge buttons. No kiting.
import { G, P } from '../core/state.js';
import { RIDE } from '../data/ride.js';
import { dist } from '../core/util.js';
import { steer } from './enemies.js';
import { los } from '../world/map.js';
import { barGem, meleeReach } from './gems.js';
import { GEMS } from '../data/gems.js';
import { routeTarget } from './route.js';

// Stuck detection: if we've been trying to move but haven't got anywhere, sidestep for a moment.
const ST = { x: 0, z: 0, t: 0, side: 0, sideT: 0, n: 0, at: -9 }; // n: sidesteps in a row (within 3 s of the last)

// A fresh start (the level run, game/levelrun.js, so a run doesn't inherit the last one's sidestep).
export function resetAutopilot() { Object.assign(ST, { x: P.x, z: P.z, t: 0, side: 0, sideT: 0, n: 0, at: -9 }); }

const toward = (x, z) => steer(P, x, z);

export function autopilot(dt = .033) {
  if (P.apPause > 0) return [0, 0]; // just evaded: don't walk straight back into it
  const d = pick(dt);
  if (Math.hypot(d[0], d[1]) < .01) { ST.t = 0; return d; }
  // Sidestepping: a little forward at first; on a second try in a row, backing off a little too (a prop in a doorway's corner can
  // pin you against the wall, where a forward sidestep never gets round it), and to the other side each time.
  if (ST.sideT > 0) { ST.sideT -= dt; const f = ST.n > 1 ? -.4 : .3; return [d[0] * f - d[1] * ST.side, d[1] * f + d[0] * ST.side]; }
  // Stuck: trying to move for 0.8 s but got less than 0.8 units from where it started (also catches jittering in place, pushed
  // back and forth between a wall and a prop).
  if (ST.t <= 0) { ST.x = P.x; ST.z = P.z; }
  ST.t += dt;
  if (ST.t > .8) { ST.t = 0; if (dist(P.x, P.z, ST.x, ST.z) < .8) { ST.sideT = .9; ST.n = G.gt - ST.at < 3 ? ST.n + 1 : 1; ST.at = G.gt; ST.side = ST.n > 1 ? -ST.side || 1 : Math.random() < .5 ? 1 : -1; } }
  return d;
}

function pick(dt) {
  const A = RIDE.autopilot;
  let best = null, bd = A.engage;
  for (const e of G.enemies) { if (e.deathT) continue; const d = dist(e.x, e.z, P.x, P.z); if (d < bd && (e.awake || los(P.x, P.z, e.x, e.z))) { bd = d; best = e; } } // not sleepers behind walls
  if (best) {
    // Fight the guardian or a rare in reach before the nearest; walk in until it's inside the Main gem's reach, then stand.
    const g = barGem('main'), reach = g && GEMS[g.gem].melee ? meleeReach(g.gem) * A.reach : A.keep;
    for (const e of G.enemies) if (!e.deathT && e.awake && (e.type === 'boss' || e.rar === 2) && dist(e.x, e.z, P.x, P.z) < A.focus) { best = e; bd = dist(e.x, e.z, P.x, P.z); break; }
    if (bd > reach + best.r || !los(P.x, P.z, best.x, best.z)) return toward(best.x, best.z);
    return [0, 0];
  }
  let loot = null, ld = A.loot;
  for (const d of G.ground) { if (!d.landed || d.gone) continue; const dd = dist(d.x, d.z, P.x, P.z); if (dd < ld) { ld = dd; loot = d; } }
  if (loot) return toward(loot.x, loot.z);
  if (G.portal) return toward(G.portal.x, G.portal.z);
  // Room levels: the route choice at junctions (game/route.js) decides where next.
  const r = routeTarget(dt); if (r === 'wait') return [0, 0]; if (r) return toward(r.x, r.z);
  let pack = null, pr = 1e9, pd = 1e9;
  for (const p of G.packs) { if (p.spawned && !p.list.some(e => !e.deathT)) continue; const d = dist(p.x, p.z, P.x, P.z), r = p.rank || 0; if (r < pr || (r === pr && d < pd)) { pr = r; pd = d; pack = p; } }
  if (pack) return toward(pack.x, pack.z);
  const boss = G.bossSpec && G.bossSpec.e;
  if (!boss || !boss.deathT) return toward(G.bossSpot.x, G.bossSpot.z);
  return [0, 0];
}

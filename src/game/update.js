// One game tick: player, monsters, enemy projectiles, ground effects, loot.
import { G, P, S } from '../core/state.js';
import { ctl } from '../input/input.js';
import { dist } from '../core/util.js';
import { pushOut } from '../world/map.js';
import { materialize, buildHash, updEnemy, separate, updEnemyProjectiles } from './enemies.js';
import { castNova, useFlask } from './skills.js';
import { updSlots, updShrine } from './gems.js';
import { TICK } from './casts.js';
import { updPatches, processQueue } from './combat.js';
import { pickUp, updItems } from './items.js';
import { newMap, respawn } from './maps.js';
import { save } from './save.js';
import { autopilot } from './autopilot.js';
import { RIDE } from '../data/ride.js';
import { EXTRA } from '../data/items.js';
import { SURGE } from '../data/skills.js';
import { clamp } from '../core/util.js';

// Effort (RIDE mode): how %FTP and cadence scale movement and casting, and how hard you want to surge (0..1).
// Not riding: everything 1 and surge from the Surge button (ctl.surge).
export function effortMods(E) {
  if (!E) return { move: 1, cast: 1, surge: ctl.surge ? 1 : 0 };
  const M = RIDE.move, W = RIDE.power, U = RIDE.surge, rel = E.rel;
  const move = rel < M.stop ? 0 : rel < M.full ? (rel - M.stop) / (M.full - M.stop) : Math.min(M.max, 1 + (rel - M.full) * .5);
  const power = rel >= W.endurance ? 1 : W.slowest + (1 - W.slowest) * clamp((rel - W.low) / (W.endurance - W.low), 0, 1);
  const cast = power * (1 + clamp((E.cad - RIDE.cadence.from) * RIDE.cadence.per, 0, RIDE.cadence.max));
  return { move, cast, surge: clamp((rel - U.from) / (U.full - U.from), 0, 1) };
}

// The Surge gauge (data/skills.js SURGE). Sets P.surgeK (how hard you're surging now, 0..1) and returns the speed multiplier.
export function updSurge(want, dt) {
  if (P.spent && P.surge >= S.surgeMax * SURGE.restart) P.spent = false;
  if (want > 0 && !P.spent && P.surge > 0) {
    P.surgeK = want; P.surge = Math.max(0, P.surge - want * dt); P.surgeWait = SURGE.delay;
    if (P.surge <= 0) { P.spent = true; ctl.surge = false; } // a tapped-on (touch) or held Surge has to be pressed again
  } else {
    P.surgeK = 0; P.surgeWait -= dt;
    if (P.surgeWait <= 0) P.surge = Math.min(S.surgeMax, P.surge + S.surgeRe * dt);
  }
  return 1 + SURGE.bonus * P.surgeK;
}

function updPlayer(dt) {
  const fx = P.eff = effortMods(ctl.effort);
  let mx = ctl.mx, mz = ctl.mz;
  if (ctl.auto && Math.hypot(mx, mz) < .08) [mx, mz] = autopilot(dt);
  const ml = Math.hypot(mx, mz), spd = S.ms * fx.move * (P.castAnim > 0 ? .65 : 1);
  P.moving = ml > .08 && spd > .05;
  if (P.moving) {
    P.x += mx * spd * dt; P.z += mz * spd * dt; P.walkT += dt * spd * 2.3;
    P.moveX = mx / ml; P.moveZ = mz / ml; if (P.castAnim <= 0) P.face = Math.atan2(mx, mz);
  }
  pushOut(P);
  P.life = Math.min(S.maxLife, P.life + (S.lregen + (P.flaskT > 0 ? P.flaskRate : 0)) * dt); if (P.flaskT > 0) P.flaskT -= dt;
  fx.cd = updSurge(fx.surge, dt); fx.cast *= fx.cd;
  P.castT -= dt; P.castAnim -= dt; P.invuln -= dt;
  if (P.shieldT > 0) { P.shieldT -= dt; if (P.shieldT <= 0) P.shield = 0; }
  updSlots(dt, fx);
  if (ctl.flask) { ctl.flask = false; useFlask(); }
  if (S.autoNova) { P.autoNovaT -= dt; if (P.autoNovaT <= 0) { P.autoNovaT = EXTRA.autoNova.every; castNova(true); } }
  for (const d of G.ground) if (d.landed && !d.gone && dist(d.x, d.z, P.x, P.z) < 1.3) pickUp(d);
  updShrine();
  if (G.portal && dist(P.x, P.z, G.portal.x, G.portal.z) < 1.3) { save(G.tier + 1); newMap(G.tier + 1); }
}

export function update(dt) {
  G.gt += dt;
  if (P.dead > 0) { P.dead -= dt; if (P.dead <= 0) respawn(); } else updPlayer(dt);
  materialize(); buildHash();
  for (const e of G.enemies) updEnemy(e, dt);
  separate();
  updEnemyProjectiles(dt);
  updPatches(dt);
  for (const f of TICK) f(dt);
  updItems(dt);
  processQueue(dt);
  G.enemies = G.enemies.filter(e => !e.gone);
  G.saveT -= dt; if (G.saveT <= 0) { G.saveT = 30; save(); }
}

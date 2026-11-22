// One game tick: player, monsters, projectiles, ground effects, loot.
import { G, P, S } from '../core/state.js';
import { SK } from '../data/skills.js';
import { ctl } from '../input/input.js';
import { dist } from '../core/util.js';
import { pushOut } from '../world/map.js';
import { materialize, buildHash, updEnemy, separate, updEnemyProjectiles } from './enemies.js';
import { castFireball, castArc, castNova, castDash, useFlask, updProjectiles } from './skills.js';
import { explode, updPatches, processQueue } from './combat.js';
import { pickUp, updItems } from './items.js';
import { updLevel, respawn } from './level.js';
import { save } from './save.js';
import { autopilot } from './autopilot.js';
import { RIDE } from '../data/ride.js';
import { clamp } from '../core/util.js';

// Effort (RIDE mode): how %FTP and cadence scale movement, mana and casting. 1 when not riding.
export function effortMods(E) {
  if (!E) return { move: 1, mana: 1, cast: 1 };
  const M = RIDE.move, rel = E.rel;
  const move = rel < M.stop ? 0 : rel < M.full ? (rel - M.stop) / (M.full - M.stop) : Math.min(M.max, 1 + (rel - M.full) * .5);
  const mana = Math.min(RIDE.mana.max, RIDE.mana.base + RIDE.mana.perFtp * rel);
  const cast = 1 + clamp((E.cad - RIDE.cadence.from) * RIDE.cadence.per, 0, RIDE.cadence.max);
  return { move, mana, cast };
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
  if (!S.blood) P.mana = Math.min(S.maxMana, P.mana + S.mregen * fx.mana * dt);
  P.castT -= dt; P.castAnim -= dt; P.novaCd -= dt; P.invuln -= dt;
  if (P.dashCh < S.dashMax) { P.dashT += dt; if (P.dashT >= SK.dash.recharge) { P.dashT = 0; P.dashCh++; } } else P.dashT = 0;
  if (P.castT <= 0) {
    if (ctl.fb) { if (castFireball()) P.castT = SK.fireball.cast / (S.cast * fx.cast); }
    else if (ctl.arc) { if (castArc()) P.castT = SK.arc.cast / (S.cast * fx.cast); }
  }
  if (ctl.nova) { ctl.nova = false; castNova(); }
  if (ctl.dash) { ctl.dash = false; castDash(); }
  if (ctl.flask) { ctl.flask = false; useFlask(); }
  if (S.autoNova) { P.autoNovaT -= dt; if (P.autoNovaT <= 0) { P.autoNovaT = 5; castNova(true); } }
  for (const d of G.ground) if (d.landed && !d.gone && dist(d.x, d.z, P.x, P.z) < 1.3) pickUp(d);
}

export function update(dt) {
  G.gt += dt;
  if (P.dead > 0) { P.dead -= dt; if (P.dead <= 0) respawn(); } else updPlayer(dt);
  materialize(); buildHash(); updLevel(dt);
  for (const e of G.enemies) updEnemy(e, dt);
  separate();
  updProjectiles(dt, explode);
  updEnemyProjectiles(dt);
  updPatches(dt);
  updItems(dt);
  processQueue(dt);
  G.enemies = G.enemies.filter(e => !e.gone);
  G.saveT -= dt; if (G.saveT <= 0) { G.saveT = 30; save(); }
}

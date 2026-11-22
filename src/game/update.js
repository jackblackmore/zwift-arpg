// One game tick: player, monsters, projectiles, ground effects, loot.
import { G, P, S } from '../core/state.js';
import { SLOT_ORDER } from '../data/skills.js';
import { ctl } from '../input/input.js';
import { dist } from '../core/util.js';
import { pushOut } from '../world/map.js';
import { materialize, buildHash, updEnemy, separate, updEnemyProjectiles } from './enemies.js';
import { castSlot, castNova, useFlask, updProjectiles, updWard } from './skills.js';
import { explode, updPatches, processQueue } from './combat.js';
import { pickUp, updItems } from './items.js';
import { updLevel, respawn } from './level.js';
import { save } from './save.js';
import { gemsTick } from './gems.js';
import { autopilot } from './autopilot.js';
import { effortMods, tickSurge } from './surge.js';

export { effortMods };

function updPlayer(dt) {
  const fx = P.eff = effortMods(ctl.effort); tickSurge(dt, ctl.effort);
  let mx = ctl.mx, mz = ctl.mz;
  if (ctl.auto && Math.hypot(mx, mz) < .08) [mx, mz] = autopilot(dt);
  const ml = Math.hypot(mx, mz), spd = S.ms * fx.move * (P.castAnim > 0 && P.lastCast !== 'shoot' ? .65 : 1);
  P.moving = ml > .08 && spd > .05;
  if (P.moving) {
    P.x += mx * spd * dt; P.z += mz * spd * dt; P.walkT += dt * spd * 2.3;
    P.moveX = mx / ml; P.moveZ = mz / ml; if (P.castAnim <= 0) P.face = Math.atan2(mx, mz);
  }
  pushOut(P);
  P.life = Math.min(S.maxLife, P.life + (S.lregen + (P.flaskT > 0 ? P.flaskRate : 0)) * dt); if (P.flaskT > 0) P.flaskT -= dt;
  P.castAnim -= dt; P.invuln -= dt;
  for (const k of SLOT_ORDER) P.cd[k] = Math.max(0, P.cd[k] - dt);
  castSlot('main'); // auto-attacks at mainTarget(), or toward ctl.aim while ctl.main is held
  for (const k of SLOT_ORDER) if (k !== 'main' && ctl[k]) { ctl[k] = false; castSlot(k); }
  if (ctl.flask) { ctl.flask = false; useFlask(); }
  if (S.autoNova) { P.autoNovaT -= dt; if (P.autoNovaT <= 0) { P.autoNovaT = 5; castNova(true); } }
  for (const d of G.ground) if (d.landed && !d.gone && dist(d.x, d.z, P.x, P.z) < 1.3) pickUp(d);
}

export function update(dt) {
  G.gt += dt;
  if (P.dead > 0) { P.dead -= dt; if (P.dead <= 0) respawn(); } else { updPlayer(dt); gemsTick(dt); }
  materialize(); buildHash(); updLevel(dt);
  for (const e of G.enemies) updEnemy(e, dt);
  separate();
  updProjectiles(dt, explode); updWard(dt);
  updEnemyProjectiles(dt);
  updPatches(dt);
  updItems(dt);
  processQueue(dt);
  G.enemies = G.enemies.filter(e => !e.gone);
  G.saveT -= dt; if (G.saveT <= 0) { G.saveT = 30; save(); }
}

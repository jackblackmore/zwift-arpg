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
import { newMap, respawn } from './maps.js';
import { save } from './save.js';

function updPlayer(dt) {
  const ml = Math.hypot(ctl.mx, ctl.mz), spd = S.ms * (P.castAnim > 0 ? .65 : 1);
  P.moving = ml > .08;
  if (P.moving) {
    P.x += ctl.mx * spd * dt; P.z += ctl.mz * spd * dt; P.walkT += dt * spd * 2.3;
    P.moveX = ctl.mx / ml; P.moveZ = ctl.mz / ml; if (P.castAnim <= 0) P.face = Math.atan2(ctl.mx, ctl.mz);
  }
  pushOut(P);
  P.life = Math.min(S.maxLife, P.life + (S.lregen + (P.flaskT > 0 ? P.flaskRate : 0)) * dt); if (P.flaskT > 0) P.flaskT -= dt;
  if (!S.blood) P.mana = Math.min(S.maxMana, P.mana + S.mregen * dt);
  P.castT -= dt; P.castAnim -= dt; P.novaCd -= dt; P.invuln -= dt;
  if (P.dashCh < S.dashMax) { P.dashT += dt; if (P.dashT >= SK.dash.recharge) { P.dashT = 0; P.dashCh++; } } else P.dashT = 0;
  if (P.castT <= 0) {
    if (ctl.fb) { if (castFireball()) P.castT = SK.fireball.cast / S.cast; }
    else if (ctl.arc) { if (castArc()) P.castT = SK.arc.cast / S.cast; }
  }
  if (ctl.nova) { ctl.nova = false; castNova(); }
  if (ctl.dash) { ctl.dash = false; castDash(); }
  if (ctl.flask) { ctl.flask = false; useFlask(); }
  if (S.autoNova) { P.autoNovaT -= dt; if (P.autoNovaT <= 0) { P.autoNovaT = 5; castNova(true); } }
  for (const d of G.ground) if (d.landed && !d.gone && dist(d.x, d.z, P.x, P.z) < 1.3) pickUp(d);
  if (G.portal && dist(P.x, P.z, G.portal.x, G.portal.z) < 1.3) { save(G.tier + 1); newMap(G.tier + 1); }
}

export function update(dt) {
  G.gt += dt;
  if (P.dead > 0) { P.dead -= dt; if (P.dead <= 0) respawn(); } else updPlayer(dt);
  materialize(); buildHash();
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

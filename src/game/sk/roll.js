// Roll, the starting Evade gem (design notes "Fight mechanics"; tuning SK.roll in data/skills.js). A quick roll, untouchable for
// a moment. It goes the way you steer; with no steering (autopilot, or standing still) it rolls away from the nearest threat, so it
// works without aiming on every device. Rolling cancels the swing being wound up and lowers the shield.
import { G, P, S } from '../../core/state.js';
import { SK } from '../../data/skills.js';
import { ctl } from '../../input/input.js';
import { dist } from '../../core/util.js';
import { SFX } from '../../core/audio.js';
import { glows, emit } from '../../render/fx.js';
import { pushOut, blocked } from '../../world/map.js';
import { cancelSwing } from './strike.js';

const wrap = a => ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

function cast() {
  if (P.broken > 0) return false;
  const K = SK.roll;
  let dx = ctl.mx, dz = ctl.mz;
  if (Math.hypot(dx, dz) < .2) {
    // Away from the nearest threat: a slam or charge being wound up counts from its centre, otherwise the nearest monster.
    let from = null, bd = 1e9;
    for (const e of G.enemies) {
      if (e.deathT || !e.awake) continue;
      const c = e.cast && e.cast.x !== undefined ? e.cast : e, d = dist(c.x, c.z, P.x, P.z) - (c === e ? 0 : 3);
      if (d < bd) { bd = d; from = c; }
    }
    if (from) { dx = P.x - from.x; dz = P.z - from.z; } else { dx = -Math.sin(P.face); dz = -Math.cos(P.face); }
    if (Math.hypot(dx, dz) < .05) { dx = Math.cos(P.face); dz = -Math.sin(P.face); } // standing on it: roll sideways
    // A wall that way: try sideways instead.
    const l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
    if (blocked(P.x + ux * K.range * .6, P.z + uz * K.range * .6, P.r)) { const s = blocked(P.x - uz * K.range * .6, P.z + ux * K.range * .6, P.r) ? -1 : 1; dx = -uz * s; dz = ux * s; }
  }
  const l = Math.hypot(dx, dz) || 1, sp = K.range / K.dur;
  P.rollVx = dx / l * sp; P.rollVz = dz / l * sp; P.rollT = K.dur; if (!S.rollBlock) P.invuln = Math.max(P.invuln, K.invuln * S.fight.evadeInv); // the tree's Evade nodes; Aegis of the Long Ride (a unique) blocks instead (game/sk/guard.js shieldHit)
  cancelSwing(); P.blocking = false; P.parryT = 0;
  // Which way relative to where you face picks the clip (render/draw.js).
  const rel = wrap(Math.atan2(dx, dz) - P.face);
  P.rollDir = Math.abs(rel) < Math.PI / 4 ? 'Forward' : Math.abs(rel) > Math.PI * 3 / 4 ? 'Backward' : rel > 0 ? 'Left' : 'Right';
  P.castSeq++; P.lastCast = 'roll'; SFX.dash();
  return true;
}

// Moves you along the roll (called from updPlayer instead of walking).
export function stepRoll(dt) {
  P.rollT -= dt; P.x += P.rollVx * dt; P.z += P.rollVz * dt; pushOut(P); P.moving = true;
  if (Math.random() < .5) emit(glows, P.x, .3, P.z, 0, .5, 0, .3, 0xc8e0ff, 0, 1);
}

export default { cast };

// Blink (Evade gem): teleport a fixed distance straight away from the nearest threat, with a moment of invulnerability.
// Non-aimed, so it works the same on keyboard, touch and the bike. Threat = nearest awake monster or enemy projectile
// cluster; with none about, the way you're moving, else facing. Never lands in a wall: it stops where the line meets one,
// and when cornered it tries the diagonals. Milestone (gem level 5): a frost burst where you were that damages and chills.
import { G, P, S } from '../../core/state.js';
import { SK } from '../../data/skills.js';
import { ctl } from '../../input/input.js';
import { rand, dist } from '../../core/util.js';
import { SFX } from '../../core/audio.js';
import { flashLight } from '../../render/scene.js';
import { sparks, glows, emit, ringFx, flashFx } from '../../render/fx.js';
import { blocked } from '../../world/map.js';
import { near } from '../enemies.js';
import { hit, pay } from '../combat.js';

// Direction (angle) away from the nearest threat.
function awayAngle() {
  let tx = 0, tz = 0, td = 1e9;
  for (const e of G.enemies) { if (e.deathT || !e.awake) continue; const d = dist(e.x, e.z, P.x, P.z); if (d < td && d < 14) { td = d; tx = e.x; tz = e.z; } }
  let px = 0, pz = 0, pn = 0;
  for (const p of G.eproj) if (dist(p.x, p.z, P.x, P.z) < 7) { px += p.x; pz += p.z; pn++; }
  if (pn) { px /= pn; pz /= pn; const d = dist(px, pz, P.x, P.z); if (d < td) { td = d; tx = px; tz = pz; } }
  if (td < 1e9) return Math.atan2(P.x - tx, P.z - tz);
  return Math.hypot(ctl.mx, ctl.mz) > .1 ? Math.atan2(ctl.mx, ctl.mz) : P.face;
}
// How far we can travel from (x, z) along angle a, up to L, before a wall.
function reach(x, z, a, L) {
  let t = 0;
  for (; t < L; t += .2) if (blocked(x + Math.sin(a) * (t + .2), z + Math.cos(a) * (t + .2), P.r)) break;
  return Math.min(t, L);
}

export default {
  cast() {
    const B = SK.blink, a0 = awayAngle();
    let a = a0, L = reach(P.x, P.z, a0, B.range);
    if (L < B.range - .5) for (const off of [.8, -.8, 1.6, -1.6]) { const l = reach(P.x, P.z, a0 + off, B.range); if (l > L + .3) { L = l; a = a0 + off; } }
    if (L < .6 || !pay(B.cost)) return false;
    const sx = P.x, sz = P.z;
    P.x = sx + Math.sin(a) * L; P.z = sz + Math.cos(a) * L;
    P.face = a + Math.PI; P.invuln = Math.max(P.invuln, B.invuln); P.castSeq++; P.lastCast = 'blink';
    const col = 0x9fe8ff;
    for (const [x, z] of [[sx, sz], [P.x, P.z]]) {
      flashFx(x, 1, z, col, 3.2, .3); ringFx(x, z, 1.4, col, .3, .2);
      for (let i = 0; i < 14; i++) emit(glows, x + rand(-.4, .4), rand(.2, 1.8), z + rand(-.4, .4), 0, rand(.5, 2), 0, rand(.3, .6), col);
    }
    flashLight(P.x, P.z, col, 3, .3); SFX.dash();
    if (S.mile.blink) {
      const r = B.burstR * S.aoe;
      near(sx, sz, r, e => { hit(e, B.burstMult, 'cold', { gem: 'blink' }); if (!e.deathT) e.chill = Math.max(e.chill, B.burstChill); });
      ringFx(sx, sz, r, 0xffffff, .4, .1);
      for (let i = 0; i < 24; i++) { const b = rand(0, 6.28), s = rand(3, 7); emit(sparks, sx, rand(.3, 1), sz, Math.cos(b) * s, rand(0, 2), Math.sin(b) * s, rand(.3, .5), 0xbff0ff, 2, 3); }
    }
    return true;
  },
};

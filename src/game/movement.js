import { hero } from '../core/state.js';
import { walk, astar } from '../world/map.js';

export function free(x, z, r) { return walk(Math.round(x - r), Math.round(z - r)) && walk(Math.round(x + r), Math.round(z - r)) && walk(Math.round(x - r), Math.round(z + r)) && walk(Math.round(x + r), Math.round(z + r)); }
export function step(e, dx, dz, r = .28) { if (free(e.x + dx, e.z, r)) e.x += dx; if (free(e.x, e.z + dz, r)) e.z += dz; }
export function los(ax, az, bx, bz) { const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / .25); for (let i = 1; i < n; i++) { const t = i / n; if (!free(ax + (bx - ax) * t, az + (bz - az) * t, .25)) return false; } return true; }

export function moveTo(e, tx, tz, spd, dt) {
  let gx = tx, gz = tz;
  if (!los(e.x, e.z, tx, tz)) {
    e.repathT -= dt;
    if (!e.path || e.repathT <= 0) { e.path = astar(Math.round(e.x), Math.round(e.z), Math.round(tx), Math.round(tz)); e.repathT = .6; }
    if (e.path && e.path.length) { const [px, pz] = e.path[0]; if (Math.hypot(px - e.x, pz - e.z) < .2) e.path.shift(); if (e.path.length) { gx = e.path[0][0]; gz = e.path[0][1]; } }
  } else e.path = null;
  const dx = gx - e.x, dz = gz - e.z, d = Math.hypot(dx, dz);
  if (d > .01) { const m = Math.min(d, spd * dt); step(e, dx / d * m, dz / d * m); e.face = Math.atan2(dx, dz); e.walkT += dt * spd * 2.4; return true; }
  return false;
}

export function followPath(dt, spd) {
  if (!hero.path || !hero.path.length) return true;
  const [px, pz] = hero.path[0], dx = px - hero.x, dz = pz - hero.z, d = Math.hypot(dx, dz);
  if (d < .12) { hero.path.shift(); return !hero.path.length; }
  const m = Math.min(d, spd * dt); step(hero, dx / d * m, dz / d * m, .25); hero.face = Math.atan2(dx, dz); hero.walkT += dt * spd * 2.4;
  return false;
}

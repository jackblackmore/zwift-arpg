// RIDE mode: what effort (power) does to the hero. Movement is gated, power sets Main's attack rate, and the
// Surge gauge (like W') limits how long you can run above endurance pace. The device only reports effort.
import { P } from '../core/state.js';
import { RIDE } from '../data/ride.js';

// Piecewise-linear lookup through [x, y] points, flat outside them.
function curve(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  return pts[pts.length - 1][1];
}

// Effort -> { move, atk, surging }. All 1 / false when not riding (E null).
export function effortMods(E) {
  if (!E) return { move: 1, atk: 1, surging: false };
  const M = RIDE.move;
  const move = E.pw < M.stopW ? 0 : E.rel < M.fullAt ? M.walk : 1;
  let atk = curve(RIDE.atk.curve, E.rel), surging = false;
  if (atk > 1) { if (P.surge.v > 0) surging = true; else atk = 1; }
  return { move, atk, surging };
}

// Gauge full (level start, RIDE toggle). `ftp` in watts.
export function initSurge(ftp = RIDE.ftp) { const max = RIDE.surge.k * ftp; P.surge.max = max; P.surge.v = max; }

// One tick: resize on FTP change (keeping the fill fraction), then drain above endurance or refill below it.
export function tickSurge(dt, E) {
  if (!E) return;
  const R = RIDE.surge, g = P.surge, ftp = E.ftp || RIDE.ftp, max = R.k * ftp;
  if (Math.abs(max - g.max) > 1e-6) { g.v = g.v / g.max * max; g.max = max; }
  const hi = R.drainFrom * ftp, lo = R.refillBelow * ftp;
  if (E.pw > hi) g.v = Math.max(0, g.v - (E.pw - hi) * dt);
  else if (E.pw <= lo) g.v = Math.min(g.max, g.v + ((lo - E.pw) * R.refill + R.base * ftp) * dt);
}

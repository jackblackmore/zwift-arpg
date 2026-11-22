// Rider input layer.
//
// The game only ever reads `rider.pw` (watts), `rider.cad` (rpm) and `rider.sprintHeld`.
// Where those numbers come from is the job of a *source*. Today there are three:
// manual (sliders / keys), and two scripted riders used for playtesting.
// A Bluetooth FTMS source (KICKR) can be added later as one more entry in SOURCES
// without touching game code.
import { S } from '../core/state.js';
import { clamp } from '../core/util.js';
import { INTERVALS, ZONES, zoneOf } from '../data/zones.js';
import { banner } from '../render/fx.js';

export const rider = { pw: 170, cad: 88, sprintHeld: false };

export const SOURCES = [
  {
    id: 'manual', label: 'AUTO: OFF', simulated: false,
    update() {},
  },
  {
    id: 'endurance', label: 'AUTO: EASY', simulated: true,
    update(dt) {
      const { ftp, time } = S;
      const tp = ftp * (.68 + .04 * Math.sin(time / 17) + .015 * Math.sin(time * 1.3));
      rider.pw += (tp - rider.pw) * Math.min(1, dt * 1.2);
      rider.cad += (88 + 3 * Math.sin(time / 9) - rider.cad) * Math.min(1, dt);
    },
  },
  {
    id: 'intervals', label: 'AUTO: INTERVALS', simulated: true,
    update(dt) {
      const { ftp, time } = S;
      S.segT += dt;
      if (S.segT >= INTERVALS[S.seg].d) {
        S.segT = 0; S.seg = (S.seg + 1) % INTERVALS.length; const s = INTERVALS[S.seg];
        banner(s.n, ZONES[zoneOf(s.p)].col, `${Math.round(s.p * ftp)} W · ${s.c} rpm · ${s.d}s`);
      }
      const s = INTERVALS[S.seg], tp = s.p * ftp + Math.sin(time * 1.3) * ftp * .025;
      rider.pw += (tp - rider.pw) * Math.min(1, dt * 1.5);
      rider.cad += (s.c + Math.sin(time) * 2 - rider.cad) * Math.min(1, dt * 1.2);
    },
  },
];

export const isSimulated = () => !!(SOURCES[S.autoMode] && SOURCES[S.autoMode].simulated);

let onChange = () => {};
export function onSourceChange(fn) { onChange = fn; }

export function setAuto(m) {
  if (S.autoMode === m) return;
  S.autoMode = m;
  if (m === 2) { S.seg = 0; S.segT = 0; }
  onChange(m);
}

export function updateRider(dt) {
  const { ftp, time, keys } = S;
  if (SOURCES[S.autoMode]) SOURCES[S.autoMode].update(dt);
  // Scripted riders answer tells (most of the time) so playtests exercise the reactions.
  const ov = S.autoOv;
  if (isSimulated() && ov && time < ov.until && time > ov.from) {
    if (ov.kind === 'surge') rider.pw = ftp * 1.4; else if (ov.kind === 'brace') rider.pw = ftp * .55;
    else if (ov.kind === 'spin') rider.cad = 112; else if (ov.kind === 'hold') rider.pw = ftp * .93;
  }
  if (keys.q) { setAuto(0); rider.pw = clamp(rider.pw - 200 * dt, 0, 900); }
  if (keys.e) { setAuto(0); rider.pw = clamp(rider.pw + 200 * dt, 0, 900); }
  if (keys.z) { setAuto(0); rider.cad = clamp(rider.cad - 30 * dt, 40, 140); }
  if (keys.c) { setAuto(0); rider.cad = clamp(rider.cad + 30 * dt, 40, 140); }
}

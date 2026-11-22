// Keyboard + mouse and touch devices. They write into `ctl` (input/input.js) and never touch game state.
import * as T from 'three';
import { ctl } from './input.js';
import { cam, o2d, V } from '../render/scene.js';
import { G, P } from '../core/state.js';
import { $, dist } from '../core/util.js';
import { audio } from '../core/audio.js';
import { pickUp } from '../game/items.js';
import { toast } from '../render/fx.js';
import { ride, rideKey, pollRide } from './ridesim.js';

const keys = {};
const mouse = { ndc: new T.Vector2(), has: false };
export const joy = { on: false, id: null, bx: 0, by: 0, x: 0, y: 0 };
const ray = new T.Raycaster(), gplane = new T.Plane(new T.Vector3(0, 1, 0), 0), TV = new T.Vector3();
const UI = {}; // hooks for opening panels, set by main.js

export function setTouch(v) { if (ctl.touch === v) return; ctl.touch = v; document.body.classList.toggle('touch', v); }
if (matchMedia('(pointer:coarse)').matches) setTouch(true);

// Called once per frame before the game update.
export function pollInput(dt) {
  if (ride.on) { pollRide(dt); return; }
  let mx = 0, mz = 0;
  if (keys.w || keys.arrowup) mz -= 1; if (keys.s || keys.arrowdown) mz += 1; if (keys.a || keys.arrowleft) mx -= 1; if (keys.d || keys.arrowright) mx += 1;
  if (joy.on) { mx += joy.x; mz += joy.y; }
  const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
  ctl.mx = mx; ctl.mz = mz;
  ctl.aim = null;
  if (!ctl.touch && mouse.has) { ray.setFromCamera(mouse.ndc, cam); if (ray.ray.intersectPlane(gplane, TV)) ctl.aim = [TV.x, TV.z]; }
}

const setMouse = e => mouse.ndc.set(e.clientX / V.W * 2 - 1, -(e.clientY / V.H) * 2 + 1);

export function initDevices(ui) {
  Object.assign(UI, ui);
  o2d.addEventListener('contextmenu', e => e.preventDefault());
  o2d.addEventListener('pointerdown', e => {
    audio(); if (G.paused) return;
    setTouch(e.pointerType === 'touch');
    for (const [x, y, w, h, d] of G.labelRects) if (e.clientX >= x && e.clientX <= x + w && e.clientY >= y && e.clientY <= y + h) {
      if (dist(d.x, d.z, P.x, P.z) < 5) pickUp(d); else toast('Walk closer to pick that up');
      return;
    }
    if (ride.on) return; // RIDE mode uses its own pad
    if (e.pointerType === 'touch') { if (e.clientX < V.W * .55 && !joy.on) Object.assign(joy, { on: true, id: e.pointerId, bx: e.clientX, by: e.clientY, x: 0, y: 0 }); return; }
    mouse.has = true; setMouse(e);
    if (e.button === 0) ctl.main = true; if (e.button === 2) ctl.flexA = true;
  });
  addEventListener('pointermove', e => {
    if (joy.on && e.pointerId === joy.id) { let dx = (e.clientX - joy.bx) / 50, dy = (e.clientY - joy.by) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.x = dx; joy.y = dy; }
    if (e.pointerType === 'mouse') { mouse.has = true; setMouse(e); }
  });
  const endPtr = e => {
    if (joy.on && e.pointerId === joy.id) { joy.on = false; joy.x = joy.y = 0; }
    if (e.pointerType === 'mouse') { if (e.button === 0) ctl.main = false; }
  };
  addEventListener('pointerup', endPtr); addEventListener('pointercancel', endPtr);

  const skillBtn = (id, down, up) => {
    const el = $(id);
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audio(); if (G.paused) return; try { el.setPointerCapture(e.pointerId); } catch (_) {} down(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => el.addEventListener(ev, () => up && up()));
  };
  skillBtn('sMain', () => ctl.main = true, () => ctl.main = false); skillBtn('sFlexA', () => ctl.flexA = true);
  skillBtn('sGuard', () => ctl.guard = true); skillBtn('sEvade', () => ctl.evade = true); skillBtn('sFl', () => ctl.flask = true);

  addEventListener('keydown', e => {
    const k = e.key.toLowerCase(); if (k === ' ') e.preventDefault();
    if (e.repeat && !'wasd'.includes(k)) return;
    keys[k] = true; audio();
    if (k === 'i' || k === 'b') { if (G.started) UI.toggleInv(); return; }
    if (k === 'p') { if (G.started) UI.togglePass(); return; }
    if (k === 'escape') { UI.closeAll(); return; }
    if (rideKey(k, true)) return;
    if (G.paused) return;
    if (k === 'q' || k === '2') ctl.flexA = true; if (k === 'e' || k === '3') ctl.guard = true; if (k === ' ' || k === '4') ctl.evade = true;
    if (k === 'f' || k === '5') ctl.flask = true; if (k === '1') ctl.main = true;
  });
  addEventListener('keyup', e => { const k = e.key.toLowerCase(); keys[k] = false; if (rideKey(k, false)) return; if (k === '1') ctl.main = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; ctl.main = false; });
}

import * as T from 'three';
import { S } from '../core/state.js';
import { $, rand } from '../core/util.js';
import { scene, cam, V } from './scene.js';

export function shake(a) { S.shakeAmt = Math.max(S.shakeAmt, a); }
export function stop(t) { S.hitStop = Math.max(S.hitStop, t); }

const ptGeo = new T.BoxGeometry(.08, .08, .08);
export function burst(x, y, z, col, n, spd = 3) {
  for (let i = 0; i < n && S.parts.length < 260; i++) {
    const m = new T.Mesh(ptGeo, new T.MeshBasicMaterial({ color: col, transparent: true }));
    m.position.set(x, y, z); scene.add(m);
    const a = rand(0, 6.28), s = rand(.3, 1) * spd;
    S.parts.push({ m, vx: Math.cos(a) * s, vy: rand(1, 4), vz: Math.sin(a) * s, life: rand(.4, .8), max: .8 });
  }
}
export function ring(x, z, r, col, life, grow = true) {
  const m = new T.Mesh(new T.RingGeometry(r * .82, r, 40), new T.MeshBasicMaterial({ color: col, transparent: true, side: T.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, .06, z); scene.add(m);
  S.effects.push({ mesh: m, life, max: life, upd: (f, t) => { if (grow) m.scale.setScalar(.3 + .7 * (1 - t)); m.material.opacity = t; } });
}
export function bolt(x1, y1, z1, x2, y2, z2, col) {
  const pts = []; const n = 7;
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new T.Vector3(x1 + (x2 - x1) * t + (i && i < n ? rand(-.3, .3) : 0), y1 + (y2 - y1) * t, z1 + (z2 - z1) * t + (i && i < n ? rand(-.3, .3) : 0))); }
  const m = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: col, transparent: true }));
  scene.add(m); S.effects.push({ mesh: m, life: .35, max: .35, upd: (f, t) => { m.material.opacity = t; } });
}
const PV = new T.Vector3();
export function toScreen(x, y, z) { PV.set(x, y, z).project(cam); return [(PV.x + 1) / 2 * V.W, (1 - PV.y) / 2 * V.H]; }
export function floatText(x, y, z, text, col, size = 13) {
  if (S.floats.length > 40) return;
  const d = document.createElement('div'); d.className = 'flt'; d.textContent = text; d.style.color = col; d.style.fontSize = size + 'px';
  $('flts').appendChild(d); S.floats.push({ d, x: x + rand(-.2, .2), y, z: z + rand(-.2, .2), life: .9, max: .9 });
}
export function banner(t, col, sub = '') { $('bT').textContent = t; $('bT').style.color = col; $('bS').textContent = sub; $('banner').style.opacity = 1; S.bannerT = 2.4; }
export function toast(html) { const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = html; $('toasts').prepend(d); setTimeout(() => d.remove(), 4200); while ($('toasts').children.length > 4) $('toasts').lastChild.remove(); }

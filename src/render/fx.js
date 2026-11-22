// Particles, transient effects, floating text, banners and toasts.
import * as T from 'three';
import { scene, updLights } from './scene.js';
import { glowTex, GRING, GDISC, isShared } from './assets.js';
import { G } from '../core/state.js';
import { rand, $ } from '../core/util.js';

// ---- particles: one THREE.Points per system, recycled ring buffer ----
function makePS(n, size) {
  const geo = new T.BufferGeometry(), pos = new Float32Array(n * 3).fill(-999), col = new Float32Array(n * 3);
  geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
  const pts = new T.Points(geo, new T.PointsMaterial({ size, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  pts.frustumCulled = false; scene.add(pts);
  const P = []; for (let i = 0; i < n; i++) P.push({ life: 0 });
  return { geo, pos, col, P, n, i: 0 };
}
export const sparks = makePS(1600, .28), glows = makePS(500, 1.1);
const TC = new T.Color();
export function emit(ps, x, y, z, vx, vy, vz, life, hex, grav = 0, drag = 0) {
  const p = ps.P[ps.i]; ps.i = (ps.i + 1) % ps.n; TC.setHex(hex);
  Object.assign(p, { x, y, z, vx, vy, vz, life, max: life, r: TC.r, g: TC.g, b: TC.b, grav, drag });
}
export function burst(x, y, z, hex, n, spd = 4, life = .6, grav = 6) {
  for (let i = 0; i < n; i++) { const a = rand(0, 6.28), s = rand(.3, 1) * spd; emit(sparks, x, y, z, Math.cos(a) * s, rand(.5, 1.5) * spd * .6, Math.sin(a) * s, rand(.5, 1) * life, hex, grav, 1.5); }
}
function updPS(ps, dt) {
  for (let i = 0; i < ps.n; i++) {
    const p = ps.P[i], k = i * 3;
    if (p.life <= 0) { if (ps.pos[k + 1] !== -999) ps.pos[k + 1] = -999; continue; }
    p.life -= dt; p.vy -= p.grav * dt; const dr = Math.max(0, 1 - p.drag * dt); p.vx *= dr; p.vy *= dr; p.vz *= dr;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < .05) { p.y = .05; p.vy *= -.3; }
    const f = Math.max(0, p.life / p.max); ps.pos[k] = p.x; ps.pos[k + 1] = p.y; ps.pos[k + 2] = p.z;
    ps.col[k] = p.r * f; ps.col[k + 1] = p.g * f; ps.col[k + 2] = p.b * f;
  }
  ps.geo.attributes.position.needsUpdate = true; ps.geo.attributes.color.needsUpdate = true;
}

// ---- transient meshes: upd(t) gets t going 1 → 0 over life ----
export function addFx(mesh, life, upd) { scene.add(mesh); G.effects.push({ mesh, life, max: life, upd }); }
export function ringFx(x, z, r, col, life, from = .2) {
  const m = new T.Mesh(GRING, new T.MeshBasicMaterial({ color: col, transparent: true, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, .07, z);
  addFx(m, life, t => { const s = r * (from + (1 - from) * (1 - t * t)); m.scale.set(s, s, 1); m.material.opacity = t; });
}
export function flashFx(x, y, z, col, size, life) {
  const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: col, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
  s.position.set(x, y, z); addFx(s, life, t => { const k = size * (1.2 - t * .6); s.scale.set(k, k, 1); s.material.opacity = t; });
}
export function boltFx(pts, col, life = .18) {
  for (let pass = 0; pass < 2; pass++) {
    const v = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], n = 6;
      for (let j = 0; j <= n; j++) { const t = j / n, j0 = j && j < n ? .35 : 0; v.push(new T.Vector3(a.x + (b.x - a.x) * t + rand(-j0, j0), 1.1 + rand(-j0, j0) * .6, a.z + (b.z - a.z) * t + rand(-j0, j0))); }
    }
    const m = new T.Line(new T.BufferGeometry().setFromPoints(v), new T.LineBasicMaterial({ color: pass ? 0xffffff : col, transparent: true, blending: T.AdditiveBlending }));
    addFx(m, life, t => { m.material.opacity = t; });
  }
}
export function telegraph(x, z, r, dur, col = 0xff2020) {
  const m = new T.Mesh(GDISC, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .25, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, .06, z); m.scale.set(r, r, 1);
  const rg = new T.Mesh(GRING, new T.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false })); rg.rotation.x = -Math.PI / 2; rg.position.set(x, .07, z);
  addFx(m, dur, t => { m.material.opacity = .15 + .25 * (1 - t); });
  addFx(rg, dur, t => { const s = Math.max(.01, r * (1 - t)); rg.scale.set(s, s, 1); });
}

export function floatT(x, y, z, txt, col, size = 13, life = .8) {
  if (G.floats.length > 70) G.floats.shift();
  G.floats.push({ x: x + rand(-.25, .25), y, z: z + rand(-.25, .25), txt, col, size, life, max: life });
}

export function updFx(dt) {
  updPS(sparks, dt); updPS(glows, dt);
  for (const f of G.effects) {
    f.life -= dt; f.upd(Math.max(0, f.life / f.max));
    if (f.life <= 0) {
      scene.remove(f.mesh);
      if (f.mesh.geometry && f.mesh.geometry !== GRING && f.mesh.geometry !== GDISC) f.mesh.geometry.dispose();
      if (f.mesh.material && !isShared(f.mesh.material)) f.mesh.material.dispose();
    }
  }
  G.effects = G.effects.filter(f => f.life > 0);
  updLights(dt);
  for (const fl of G.floats) { fl.life -= dt; fl.y += dt * 1.4; }
  G.floats = G.floats.filter(f => f.life > 0);
}

export function banner(t, col, sub = '') { $('bT').textContent = t; $('bT').style.color = col; $('bS').textContent = sub; $('banner').style.opacity = 1; G.bannerT = 2.6; }
export function toast(html) {
  const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = html; $('toasts').prepend(d);
  setTimeout(() => d.remove(), 4000); while ($('toasts').children.length > 5) $('toasts').lastChild.remove();
}

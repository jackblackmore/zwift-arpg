// Procedural textures, shared geometries and cached materials.
import * as T from 'three';
import { rand } from '../core/util.js';

function canvasTex(sz, fn) { const c = document.createElement('canvas'); c.width = c.height = sz; fn(c.getContext('2d'), sz); return new T.CanvasTexture(c); }

export const glowTex = canvasTex(64, (x, s) => {
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, '#fff'); g.addColorStop(.25, 'rgba(255,255,255,.75)'); g.addColorStop(.6, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
});
export const groundTex = canvasTex(512, (x, s) => {
  x.fillStyle = '#1c1714'; x.fillRect(0, 0, s, s);
  const n = 8, c = s / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = 26 + Math.random() * 16 | 0, off = (j % 2) * c / 2;
    x.fillStyle = `rgb(${v + 6},${v + 2},${v - 2})`; x.fillRect(i * c + off + 2, j * c + 2, c - 4, c - 4);
    for (let k = 0; k < 30; k++) { const w = Math.random() * 10 | 0; x.fillStyle = `rgba(0,0,0,${Math.random() * .25})`; x.fillRect(i * c + off + Math.random() * c, j * c + Math.random() * c, w, w); }
    if (Math.random() < .35) { x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 1.5; x.beginPath(); let px = i * c + off + Math.random() * c, py = j * c + Math.random() * c; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += rand(-20, 20); py += rand(-20, 20); x.lineTo(px, py); } x.stroke(); }
  }
  for (let k = 0; k < 40; k++) { x.fillStyle = `rgba(40,60,20,${Math.random() * .2})`; x.beginPath(); x.arc(Math.random() * s, Math.random() * s, Math.random() * 30, 0, 7); x.fill(); }
});
groundTex.wrapS = groundTex.wrapT = T.RepeatWrapping;

export const GB = new T.BoxGeometry(1, 1, 1), GS = new T.SphereGeometry(1, 12, 9), GC = new T.ConeGeometry(1, 1, 7), GCY = new T.CylinderGeometry(1, 1, 1, 10);
export const GROCK = new T.DodecahedronGeometry(1, 0), GPLANE = new T.PlaneGeometry(1, 1), GRING = new T.RingGeometry(.86, 1, 48), GDISC = new T.CircleGeometry(1, 40);

const eyeMats = {};
export const eyeMat = c => eyeMats[c] || (eyeMats[c] = new T.MeshBasicMaterial({ color: c }));
export const spMats = {};
export const spMat = c => spMats[c] || (spMats[c] = new T.SpriteMaterial({ map: glowTex, color: c, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
const decalMats = {};
const decalMat = c => decalMats[c] || (decalMats[c] = new T.MeshBasicMaterial({ map: glowTex, color: c, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
export function glowSprite(c, s) { const sp = new T.Sprite(spMat(c)); sp.scale.set(s, s, 1); return sp; }
// Flat auras use normal blending, so a pack of them overlapping stays one soft patch instead of adding up to a blown-out blob.
const auraMats = {};
const auraMat = (c, o) => auraMats[c + '/' + o] || (auraMats[c + '/' + o] = new T.MeshBasicMaterial({ map: glowTex, color: c, opacity: o, depthWrite: false, transparent: true }));
export function aura(c, s, o = .3) { const m = new T.Mesh(GPLANE, auraMat(c, o)); m.rotation.x = -Math.PI / 2; m.scale.set(s, s, 1); m.position.y = .04; return m; }
export function decal(c, s) { const m = new T.Mesh(GPLANE, decalMat(c)); m.rotation.x = -Math.PI / 2; m.scale.set(s, s, 1); m.position.y = .04; return m; }
export const isShared = m => Object.values(spMats).includes(m) || Object.values(decalMats).includes(m) || Object.values(auraMats).includes(m) || Object.values(eyeMats).includes(m);

import * as T from 'three';
import { $ } from '../core/util.js';

export const V = { W: 0, H: 0, camMul: 1 };

export const renderer = new T.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
$('view').appendChild(renderer.domElement);

export const scene = new T.Scene();
scene.background = new T.Color(0x060405);
scene.fog = new T.Fog(0x060405, 24, 44);
export const cam = new T.PerspectiveCamera(40, 1, .1, 140);
export const CAM = new T.Vector3(0, 15, 10.5); // camera offset from the player
export const hemi = new T.HemisphereLight(0x9a8fc0, 0x2a2018, .65); scene.add(hemi);
export const moon = new T.DirectionalLight(0x9fb0ff, .45); moon.position.set(-10, 20, 6); scene.add(moon);
export const plight = new T.PointLight(0xffb070, 1.5, 16, 1.5); scene.add(plight);
export const blight = new T.PointLight(0xff3ad0, 0, 14, 1.5); scene.add(blight);

// A small fixed pool of flash lights (a fixed light count avoids shader recompiles).
// Lights sit well above the floor with a gentle falloff: close to the floor an inverse-square light
// blows out into a hard-edged yellow disc, especially when several flashes overlap.
const flashL = [0, 1, 2, 3].map(() => { const l = new T.PointLight(0xff8030, 0, 11, 1); scene.add(l); return { l, t: 0, max: 1, i: 0 }; });
const fl = { next: 0 };
const FLASH_GAIN = .45;
export function flashLight(x, z, col, inten, life) { const f = flashL[fl.next++ % flashL.length]; f.l.color.setHex(col); f.l.position.set(x, 3.6, z); f.t = f.max = life; f.i = inten * FLASH_GAIN; }
export function updLights(dt) { for (const f of flashL) { if (f.t > 0) { f.t -= dt; f.l.intensity = f.i * Math.max(0, f.t / f.max); } else f.l.intensity = 0; } }

// 2D overlay canvas for health bars, item labels and damage numbers.
export const o2d = $('o2d'), ctx = o2d.getContext('2d');

export function resize() {
  V.W = innerWidth; V.H = innerHeight; const dpr = Math.min(2, devicePixelRatio || 1);
  renderer.setSize(V.W, V.H); cam.aspect = V.W / V.H; V.camMul = V.W < V.H ? 1.35 : V.W < 800 ? 1.1 : 1; cam.updateProjectionMatrix();
  o2d.width = V.W * dpr; o2d.height = V.H * dpr; o2d.style.width = V.W + 'px'; o2d.style.height = V.H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);

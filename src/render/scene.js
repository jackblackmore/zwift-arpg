import * as T from 'three';
import { $ } from '../core/util.js';

export const V = { W: 0, H: 0 };
const view = $('view'), panel = $('panel');

export const renderer = new T.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
view.appendChild(renderer.domElement);

export const scene = new T.Scene();
scene.background = new T.Color(0x07060a);
export const cam = new T.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
export const CAMOFF = new T.Vector3(9, 13, 9);
scene.add(new T.AmbientLight(0x6a5a8a, .55));
const dir = new T.DirectionalLight(0xb8a8ff, .35); dir.position.set(-5, 10, 3); scene.add(dir);
export const torch = new T.PointLight(0xffa860, 1.7, 11, 1.5); scene.add(torch);

export const panelHeight = () => panel.offsetHeight;

export function resize() {
  V.W = innerWidth; V.H = innerHeight - panel.offsetHeight;
  view.style.height = V.H + 'px';
  renderer.setSize(V.W, V.H);
  const asp = V.W / V.H, vh = Math.max(10.5, 11 / asp);
  cam.left = -vh * asp / 2; cam.right = vh * asp / 2; cam.top = vh / 2; cam.bottom = -vh / 2;
  cam.updateProjectionMatrix();
  $('choice').style.bottom = (panel.offsetHeight + 14) + 'px';
}
addEventListener('resize', resize);

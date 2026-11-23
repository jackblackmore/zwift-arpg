// Flame Totem (Flex, press): plants a totem at the aim point that spits fire bolts at the nearest monster in range.
// One totem at a time: recasting moves it. Milestone (gem level 5): lasts 50% longer. Volley support: shoots the two nearest.
import * as T from 'three';
import { P, S } from '../../core/state.js';
import { SK } from '../../data/skills.js';
import { dist, rand, pick } from '../../core/util.js';
import { SFX } from '../../core/audio.js';
import { scene, flashLight } from '../../render/scene.js';
import { glowSprite } from '../../render/assets.js';
import { emit, sparks, glows, ringFx, flashFx, addFx } from '../../render/fx.js';
import { blocked, los } from '../../world/map.js';
import { near } from '../enemies.js';
import { hit, pay } from '../combat.js';
import { aim } from '../skills.js';

let totem = null;
const stoneMat = new T.MeshLambertMaterial({ color: 0x4a4238 }), darkMat = new T.MeshLambertMaterial({ color: 0x38312a });

function build(x, z) {
  const g = new T.Group();
  const base = new T.Mesh(new T.CylinderGeometry(.5, .65, .5, 8), stoneMat); base.position.y = .25; g.add(base);
  const pole = new T.Mesh(new T.CylinderGeometry(.28, .38, 1.1, 8), stoneMat); pole.position.y = 1; g.add(pole);
  const cap = new T.Mesh(new T.ConeGeometry(.42, .45, 8), darkMat); cap.position.y = 1.78; g.add(cap);
  const gl = glowSprite(0xff6a1a, 1.5); gl.position.y = 2.25; g.add(gl);
  const core = glowSprite(0xffe0a0, .55); core.position.y = 2.25; g.add(core);
  g.position.set(x, 0, z); scene.add(g);
  return { x, z, g, gl, t: 0, life: 0, shotT: .2 };
}

function remove() { if (totem) { scene.remove(totem.g); totem = null; } }

// Where to plant: the aim point, pulled back toward the player to within range and out of walls.
function spot() {
  const K = SK.totem; let [ax, az] = aim(); const d = dist(ax, az, P.x, P.z) || 1;
  if (d > K.place) { ax = P.x + (ax - P.x) / d * K.place; az = P.z + (az - P.z) / d * K.place; }
  for (let k = 0; k < 8 && blocked(ax, az, .5); k++) { ax = P.x + (ax - P.x) * .8; az = P.z + (az - P.z) * .8; }
  return [ax, az];
}

function cast() {
  const K = SK.totem; if (!pay(K.cost)) return false;
  const [x, z] = spot();
  remove();
  totem = build(x, z); totem.life = K.dur * (S.mile.totem ? K.mileDur : 1);
  P.face = Math.atan2(x - P.x, z - P.z); P.castAnim = .3; P.castSeq++; P.lastCast = 'totem';
  ringFx(x, z, 1.8, 0xff8a3c, .4, .2); flashFx(x, 1.2, z, 0xff7a2a, 4, .35); flashLight(x, z, 0xff7a2a, 3, .3);
  for (let i = 0; i < 14; i++) { const a = rand(0, 6.28); emit(glows, x + Math.cos(a) * .6, rand(.1, .6), z + Math.sin(a) * .6, 0, rand(.8, 2.5), 0, rand(.3, .6), 0xff5a10); }
  SFX.fire(); return true;
}

function shoot(tg, from, mult = SK.totem.mult) {
  const K = SK.totem, x0 = from.x, y0 = 2.25, z0 = from.z, x1 = tg.x, z1 = tg.z, d = dist(x0, z0, x1, z1) || 1;
  const s = glowSprite(0xff8a3c, .7); s.add(glowSprite(0xffe0a0, .3));
  s.position.set(x0, y0, z0);
  addFx(s, .12, t => { const k = 1 - t; s.position.set(x0 + (x1 - x0) * k, y0 + (1.1 - y0) * k, z0 + (z1 - z0) * k); });
  hit(tg, mult, 'fire', { gem: 'totem', kx: (x1 - x0) / d, kz: (z1 - z0) / d });
  for (let i = 0; i < 4; i++) emit(sparks, x1, 1, z1, rand(-3, 3), rand(1, 4), rand(-3, 3), .3, pick([0xff8a3c, 0xffd060]), 6, 2);
}

function tick(dt) {
  const t = totem, K = SK.totem; if (!t) return;
  t.life -= dt; t.shotT -= dt; t.t += dt;
  t.gl.position.y = 2.25 + Math.sin(t.t * 5) * .06;
  const gs = Math.max(.2, 1.4 + Math.sin(t.t * 9) * .15 + (t.life < 1 ? (t.life - 1) * .8 : 0)); t.gl.scale.set(gs, gs, 1);
  if (Math.random() < dt * 14) emit(glows, t.x + rand(-.15, .15), 2.2, t.z + rand(-.15, .15), 0, rand(.8, 2), 0, rand(.3, .6), 0xff5a10);
  if (t.life <= 0) { flashFx(t.x, 1.2, t.z, 0xff7a2a, 3, .25); remove(); return; }
  if (t.shotT > 0) return;
  // The nearest monster in sight; with the Volley support, the nearest few, each bolt weaker.
  const V = K.sup.volley, n = S.sk.totem.volley ? V.n : 1, tg = [];
  near(t.x, t.z, K.range, e => { if (los(t.x, t.z, e.x, e.z)) tg.push([dist(e.x, e.z, t.x, t.z), e]); });
  tg.sort((a, b) => a[0] - b[0]);
  if (tg.length) { t.shotT = K.interval; for (const [, e] of tg.slice(0, n)) shoot(e, t, K.mult * (n > 1 ? V.mult : 1)); } else t.shotT = .1;
}

export default { cast, tick, clear: remove };

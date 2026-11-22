// The map: an open crypt floor with obstacles (circle colliders), braziers and bones.
// With the KayKit dungeon models loaded it's built by world/dungeon.js; otherwise from primitive rocks here.
import * as T from 'three';
import { scene } from '../render/scene.js';
import { groundTex, GB, GS, GCY, GROCK, glowSprite, decal } from '../render/assets.js';
import { G } from '../core/state.js';
import { rand, clamp, dist } from '../core/util.js';
import { dun, buildDungeon } from './dungeon.js';

export const HALF = 34; // map spans -HALF..HALF on x and z

const ground = new T.Mesh(new T.PlaneGeometry(HALF * 2 + 30, HALF * 2 + 30), new T.MeshLambertMaterial({ map: groundTex, color: 0xb0a090 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; groundTex.repeat.set(16, 16); scene.add(ground);
G.world = new T.Group(); scene.add(G.world);

const rockMat = new T.MeshLambertMaterial({ color: 0x4a4048, flatShading: true }), rockMat2 = new T.MeshLambertMaterial({ color: 0x3a3238, flatShading: true });
const boneMat = new T.MeshLambertMaterial({ color: 0xb8ae96 }), woodMat = new T.MeshLambertMaterial({ color: 0x3a2618 });

export function pushOut(e) {
  for (const o of G.obst) { const dx = e.x - o.x, dz = e.z - o.z, m = o.r + e.r, d2 = dx * dx + dz * dz; if (d2 < m * m) { const d = Math.sqrt(d2) || .001; e.x = o.x + dx / d * m; e.z = o.z + dz / d * m; } }
  e.x = clamp(e.x, -HALF + e.r, HALF - e.r); e.z = clamp(e.z, -HALF + e.r, HALF - e.r);
}
export const blocked = (x, z, r) => x < -HALF + r || x > HALF - r || z < -HALF + r || z > HALF - r || G.obst.some(o => (x - o.x) ** 2 + (z - o.z) ** 2 < (o.r + r) ** 2);
// True when a circle (x, z, r) touches a clearing (start, beat sites, route points, the guardian's arena).
export const inClear = (x, z, r = 0) => G.clear.some(c => (x - c.x) ** 2 + (z - c.z) ** 2 < (c.r + r) ** 2);
export function los(ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1;
  for (const o of G.obst) { const t = clamp(((o.x - ax) * dx + (o.z - az) * dz) / (L * L), 0, 1); if (dist(ax + dx * t, az + dz * t, o.x, o.z) < o.r - .1) return false; }
  return true;
}
function rock(x, z, r, solid) {
  const m = new T.Mesh(GROCK, Math.random() < .5 ? rockMat : rockMat2); m.scale.set(r, r * rand(.7, 1.3), r); m.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3)); m.position.set(x, r * .45, z); m.castShadow = m.receiveShadow = true; G.world.add(m);
  if (solid) G.obst.push({ x, z, r: r * .92 });
}

export function buildMap() {
  scene.remove(G.world); G.world = new T.Group(); scene.add(G.world); G.obst = []; G.torches = [];
  // game/level.js has already set G.start, G.bossSpot and the G.clear circles for this level
  G.dressed = dun.ready;
  if (dun.ready) buildDungeon(HALF); else primitiveMap();
  // minimap base layer
  const c = G.mmBase = document.createElement('canvas'); c.width = c.height = 300; const m = c.getContext('2d'), k = 300 / (HALF * 2);
  m.fillStyle = '#16110e'; m.fillRect(0, 0, 300, 300); m.fillStyle = '#4a4048';
  for (const o of G.obst) { m.beginPath(); m.arc((o.x + HALF) * k, (o.z + HALF) * k, Math.max(2, o.r * k), 0, 7); m.fill(); }
}

function primitiveMap() {
  for (let t = 0; t < 600 && G.obst.length < 52; t++) {
    const r = rand(.8, 2.4), x = rand(-HALF + 3, HALF - 3), z = rand(-HALF + 3, HALF - 3);
    if (inClear(x, z, r)) continue;
    if (G.obst.some(o => dist(o.x, o.z, x, z) < o.r + r + 2.2)) continue;
    rock(x, z, r, true); if (Math.random() < .7) rock(x + rand(-r, r), z + rand(-r, r), r * rand(.3, .5), false);
  }
  for (let a = -HALF - 1; a <= HALF + 1; a += 2.4) for (const [x, z] of [[a, -HALF - 1.4], [a, HALF + 1.4], [-HALF - 1.4, a], [HALF + 1.4, a]]) rock(x + rand(-.4, .4), z + rand(-.4, .4), rand(1.4, 2.4), false);
  for (let k = 0; k < 70; k++) {
    const x = rand(-HALF, HALF), z = rand(-HALF, HALF); if (blocked(x, z, .3)) continue;
    const g = new T.Group();
    for (let j = 0; j < 3; j++) { const b = new T.Mesh(GB, boneMat); b.scale.set(.34, .05, .06); b.position.set(rand(-.3, .3), .03, rand(-.3, .3)); b.rotation.y = rand(0, 3); g.add(b); }
    if (Math.random() < .5) { const s = new T.Mesh(GS, boneMat); s.scale.setScalar(.1); s.position.set(rand(-.2, .2), .08, rand(-.2, .2)); g.add(s); }
    g.position.set(x, 0, z); G.world.add(g);
  }
  for (let k = 0; k < 14; k++) {
    let x, z, tries = 0; do { x = rand(-HALF + 2, HALF - 2); z = rand(-HALF + 2, HALF - 2); } while ((blocked(x, z, .8) || inClear(x, z, .8)) && ++tries < 30);
    if (inClear(x, z, .8)) continue;
    const g = new T.Group(); const p = new T.Mesh(GCY, woodMat); p.scale.set(.12, 1.2, .12); p.position.y = .6; g.add(p);
    const bowl = new T.Mesh(GCY, rockMat); bowl.scale.set(.3, .15, .3); bowl.position.y = 1.25; g.add(bowl);
    const f = glowSprite(0xff8a30, 1.4); f.position.y = 1.55; g.add(f); g.add(decal(0xff7020, 4));
    g.position.set(x, 0, z); G.world.add(g); G.torches.push({ f, x, z }); G.obst.push({ x, z, r: .3 });
  }
}

// The map: an open crypt floor with obstacles (circle colliders), braziers and bones.
// With the KayKit dungeon models loaded it's built by world/dungeon.js; otherwise from primitive rocks here.
import * as T from 'three';
import { scene } from '../render/scene.js';
import { groundTex, GB, GS, GCY, GROCK, glowSprite, decal } from '../render/assets.js';
import { G } from '../core/state.js';
import { rand, clamp, dist } from '../core/util.js';
import { dun, buildDungeon } from './dungeon.js';
import { GEN, OBSTACLE_DENSITY } from '../data/dungeon.js';
import { generateLevel, walkField, cellOf, lineDist, solid, wallHit } from './gen.js';

export const HALF = GEN.zones * GEN.zoneCells * GEN.cell / 2; // map spans -HALF..HALF on x and z

const ground = new T.Mesh(new T.PlaneGeometry(HALF * 2 + 30, HALF * 2 + 30), new T.MeshLambertMaterial({ map: groundTex, color: 0xb0a090 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; groundTex.repeat.set(16, 16); scene.add(ground);
G.world = new T.Group(); scene.add(G.world);

const rockMat = new T.MeshLambertMaterial({ color: 0x4a4048, flatShading: true }), rockMat2 = new T.MeshLambertMaterial({ color: 0x3a3238, flatShading: true });
const boneMat = new T.MeshLambertMaterial({ color: 0xb8ae96 }), woodMat = new T.MeshLambertMaterial({ color: 0x3a2618 });

// ---- Walls: a grid lookup (G.layout.grid, see gen.js). Cells outside the grid count as wall. Props stay circles (G.obst). ----
function pushWalls(L, e) {
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    const i0 = Math.floor((e.x - e.r + L.half) / L.cell), i1 = Math.floor((e.x + e.r + L.half) / L.cell), j0 = Math.floor((e.z - e.r + L.half) / L.cell), j1 = Math.floor((e.z + e.r + L.half) / L.cell);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (!solid(L, i, j)) continue;
      const x0 = -L.half + i * L.cell, x1 = x0 + L.cell, z0 = -L.half + j * L.cell, z1 = z0 + L.cell;
      const cx = Math.max(x0, Math.min(e.x, x1)), cz = Math.max(z0, Math.min(e.z, z1)), dx = e.x - cx, dz = e.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= e.r * e.r) continue;
      moved = true;
      if (d2 > 1e-8) { const d = Math.sqrt(d2); e.x = cx + dx / d * e.r; e.z = cz + dz / d * e.r; continue; }
      // Centre inside the wall cell: leave by the nearest face that opens onto floor.
      const opts = [[e.x - x0 + e.r, -1, 0, solid(L, i - 1, j)], [x1 - e.x + e.r, 1, 0, solid(L, i + 1, j)], [e.z - z0 + e.r, 0, -1, solid(L, i, j - 1)], [z1 - e.z + e.r, 0, 1, solid(L, i, j + 1)]];
      let best = null; for (const o of opts) { const c = o[0] + (o[3] ? 100 : 0); if (!best || c < best.c) best = { c, o }; }
      e.x += best.o[1] * best.o[0]; e.z += best.o[2] * best.o[0];
    }
    if (!moved) break;
  }
}

export function pushOut(e) {
  for (const o of G.obst) { const dx = e.x - o.x, dz = e.z - o.z, m = o.r + e.r, d2 = dx * dx + dz * dz; if (d2 < m * m) { const d = Math.sqrt(d2) || .001; e.x = o.x + dx / d * m; e.z = o.z + dz / d * m; } }
  if (G.layout) pushWalls(G.layout, e);
  e.x = clamp(e.x, -HALF + e.r, HALF - e.r); e.z = clamp(e.z, -HALF + e.r, HALF - e.r);
}
export const blocked = (x, z, r) => x < -HALF + r || x > HALF - r || z < -HALF + r || z > HALF - r || (G.layout && wallHit(G.layout, x, z, r)) || G.obst.some(o => (x - o.x) ** 2 + (z - o.z) ** 2 < (o.r + r) ** 2);
// A clear shot: a projectile of radius r flies from a to b without touching a wall or prop (stricter than los, which
// only checks the centre line with some slack). The last `end` units are skipped: the target is there.
export function clearShot(ax, az, bx, bz, r = .2, end = .5) {
  const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); if (L <= end) return true;
  for (let t = .3; t < L - end; t += .3) if (blocked(ax + dx * t / L, az + dz * t / L, r)) return false;
  return true;
}
export function los(ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1;
  for (const o of G.obst) { const t = clamp(((o.x - ax) * dx + (o.z - az) * dz) / (L * L), 0, 1); if (dist(ax + dx * t, az + dz * t, o.x, o.z) < o.r - .1) return false; }
  const W = G.layout; if (W) { const n = Math.ceil(L / .35); for (let k = 1; k < n; k++) { const t = k / n; if (solid(W, Math.floor((ax + dx * t + W.half) / W.cell), Math.floor((az + dz * t + W.half) / W.cell))) return false; } }
  return true;
}

// ---- Path finding round walls: a distance field to the target cell, cached per target, then a string-pulled next point ----
// Can a circle of radius r walk the straight line from a to b without touching a wall?
function clearWalk(W, ax, az, bx, bz, r) {
  const dx = bx - ax, dz = bz - az, n = Math.ceil(Math.hypot(dx, dz) / .5);
  for (let k = 0; k <= n; k++) { const t = n ? k / n : 0; if (wallHit(W, ax + dx * t, az + dz * t, r)) return false; }
  return true;
}
const FIELDS = 6;
function fieldTo(W, ci, cj) {
  const key = cj * W.n + ci; if (!W.fields) W.fields = new Map();
  let f = W.fields.get(key); if (f) return f;
  f = walkField(W, ci, cj); W.fields.set(key, f); if (W.fields.size > FIELDS) W.fields.delete(W.fields.keys().next().value);
  return f;
}
// Where to head from (x, z) to reach (tx, tz) round the walls: null if a straight walk works (or there is no way / no walls).
export function pathStep(x, z, tx, tz, r = .4) {
  const W = G.layout; if (!W) return null;
  if (clearWalk(W, x, z, tx, tz, r)) return null;
  const f = fieldTo(W, cellOf(W, tx), cellOf(W, tz)), n = W.n;
  let ci = cellOf(W, x), cj = cellOf(W, z); if (ci < 0 || cj < 0 || ci >= n || cj >= n || f[cj * n + ci] < 0) return null;
  let out = null;
  for (let k = 0; k < 10; k++) {
    const here = f[cj * n + ci]; if (here === 0) return clearWalk(W, x, z, tx, tz, r) ? [tx, tz] : (out || [tx, tz]);
    let bi = ci, bj = cj, bd = here;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const i = ci + di, j = cj + dj; if ((!di && !dj) || i < 0 || j < 0 || i >= n || j >= n) continue;
      const d = f[j * n + i]; if (d >= 0 && d < bd && (!di || !dj || (W.grid[cj * n + i] && W.grid[j * n + ci]))) { bd = d; bi = i; bj = j; }
    }
    if (bi === ci && bj === cj) break;
    ci = bi; cj = bj;
    const px = -W.half + (ci + .5) * W.cell, pz = -W.half + (cj + .5) * W.cell;
    if (k > 0 && !clearWalk(W, x, z, px, pz, r)) break;
    out = [px, pz];
  }
  return out;
}

// ---- Fog of war for the minimap: cells you have seen are drawn onto G.mmBase ----
const MMK = 300 / (HALF * 2), REVEAL = 15;
export function seen(x, z) { const L = G.layout; if (!L) return true; const i = cellOf(L, x), j = cellOf(L, z); return i >= 0 && j >= 0 && i < L.n && j < L.n && !!L.seen[j * L.n + i]; }
export function reveal(x, z) {
  const L = G.layout, c = G.mmBase; if (!L || !c) return;
  const m = c.getContext('2d'), ci = cellOf(L, x), cj = cellOf(L, z), R = Math.ceil(REVEAL / L.cell), fresh = [];
  for (let j = Math.max(0, cj - R); j <= Math.min(L.n - 1, cj + R); j++) for (let i = Math.max(0, ci - R); i <= Math.min(L.n - 1, ci + R); i++) {
    if (L.seen[j * L.n + i]) continue;
    const bx = -L.half + (i + .5) * L.cell, bz = -L.half + (j + .5) * L.cell; if (Math.hypot(bx - x, bz - z) > REVEAL) continue;
    // Visible if the ray gets to the cell without crossing another wall cell.
    const dx = bx - x, dz = bz - z, n = Math.ceil(Math.hypot(dx, dz) / .5); let ok = true;
    for (let k = 1; k < n; k++) { const t = k / n, ii = Math.floor((x + dx * t + L.half) / L.cell), jj = Math.floor((z + dz * t + L.half) / L.cell); if ((ii !== i || jj !== j) && solid(L, ii, jj)) { ok = false; break; } }
    if (ok) fresh.push([i, j]);
  }
  for (const [i, j] of fresh) {
    L.seen[j * L.n + i] = 1; const fl = L.grid[j * L.n + i];
    m.fillStyle = fl ? '#2e2622' : '#5a4a44'; m.fillRect(Math.floor((i * L.cell) * MMK), Math.floor((j * L.cell) * MMK), Math.ceil(L.cell * MMK) + .5, Math.ceil(L.cell * MMK) + .5);
  }
  if (fresh.length) {
    m.fillStyle = '#6a5a60';
    for (const o of G.obst) { const i = cellOf(L, o.x), j = cellOf(L, o.z); if (fresh.some(f => f[0] === i && f[1] === j)) { m.beginPath(); m.arc((o.x + HALF) * MMK, (o.z + HALF) * MMK, Math.max(1.5, o.r * MMK), 0, 7); m.fill(); } }
  }
}
function rock(x, z, r, solid) {
  const m = new T.Mesh(GROCK, Math.random() < .5 ? rockMat : rockMat2); m.scale.set(r, r * rand(.7, 1.3), r); m.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3)); m.position.set(x, r * .45, z); m.castShadow = m.receiveShadow = true; G.world.add(m);
  if (solid) G.obst.push({ x, z, r: r * .92 });
}

export function buildMap() {
  scene.remove(G.world); G.world = new T.Group(); scene.add(G.world); G.obst = []; G.torches = [];
  const L = G.layout = generateLevel(); L.seen = new Uint8Array(L.n * L.n);
  G.start = { x: L.start.x, z: L.start.z }; G.bossSpot = { x: L.boss.x, z: L.boss.z };
  G.dressed = dun.ready; ground.visible = !dun.ready; // the dressed level draws its own floor, only where there is floor
  if (dun.ready) buildDungeon(L); else primitiveMap(L);
  // minimap base layer: dark until explored (reveal() paints cells as you see them)
  const c = G.mmBase = document.createElement('canvas'); c.width = c.height = 300; const m = c.getContext('2d');
  m.fillStyle = '#0c0907'; m.fillRect(0, 0, 300, 300);
  reveal(G.start.x, G.start.z);
}

// Fallback level (models not loaded): rocks in the rooms, boxes for walls, a few braziers.
function primitiveMap(L) {
  const { cell, half } = L, boxes = [];
  for (let j = 0; j < L.n; j++) for (let i = 0; i < L.n; i++) {
    if (L.grid[j * L.n + i]) continue;
    let near = false; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (!solid(L, i + di, j + dj)) near = true;
    if (near) boxes.push([i, j, !solid(L, i, j - 1) ? 1.1 : 3]); // a wall on a room's south side stays low so it can't hide the hero
  }
  const im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), rockMat, boxes.length), M = new T.Matrix4();
  boxes.forEach(([i, j, h], k) => { im.setMatrixAt(k, M.makeScale(cell, h, cell).setPosition(-half + (i + .5) * cell, h / 2, -half + (j + .5) * cell)); });
  im.castShadow = im.receiveShadow = true; im.frustumCulled = false; G.world.add(im);
  const start = L.start, free = (x, z, r) => !blocked(x, z, r) && lineDist(L, x, z) > r + 2.2;
  for (const room of L.rooms) {
    if (room.kind === 'boss') continue;
    const want = room.kind === 'start' ? 1 : Math.round(room.w * room.h * OBSTACLE_DENSITY);
    for (let t = 0, got = 0; t < 60 && got < want; t++) {
      const r = rand(.8, 1.8), x = -half + (room.i0 + rand(1, room.w - 1)) * cell, z = -half + (room.j0 + rand(1, room.h - 1)) * cell;
      if (dist(x, z, start.x, start.z) < 7 || !free(x, z, r + 1.2)) continue;
      rock(x, z, r, true); got++; if (Math.random() < .7) rock(x + rand(-r, r), z + rand(-r, r), r * rand(.3, .5), false);
    }
  }
  for (let k = 0; k < 70; k++) {
    const x = rand(-HALF, HALF), z = rand(-HALF, HALF); if (blocked(x, z, .3)) continue;
    const g = new T.Group();
    for (let j = 0; j < 3; j++) { const b = new T.Mesh(GB, boneMat); b.scale.set(.34, .05, .06); b.position.set(rand(-.3, .3), .03, rand(-.3, .3)); b.rotation.y = rand(0, 3); g.add(b); }
    if (Math.random() < .5) { const s = new T.Mesh(GS, boneMat); s.scale.setScalar(.1); s.position.set(rand(-.2, .2), .08, rand(-.2, .2)); g.add(s); }
    g.position.set(x, 0, z); G.world.add(g);
  }
  for (let k = 0; k < 14; k++) {
    let x, z, tries = 0; do { x = rand(-HALF + 2, HALF - 2); z = rand(-HALF + 2, HALF - 2); } while ((blocked(x, z, .8) || lineDist(L, x, z) < 1.6) && ++tries < 60);
    if (tries >= 60) continue;
    const g = new T.Group(); const p = new T.Mesh(GCY, woodMat); p.scale.set(.12, 1.2, .12); p.position.y = .6; g.add(p);
    const bowl = new T.Mesh(GCY, rockMat); bowl.scale.set(.3, .15, .3); bowl.position.y = 1.25; g.add(bowl);
    const f = glowSprite(0xff8a30, 1.4); f.position.y = 1.55; g.add(f); g.add(decal(0xff7020, 4));
    g.position.set(x, 0, z); G.world.add(g); G.torches.push({ f, x, z }); G.obst.push({ x, z, r: .3 });
  }
}

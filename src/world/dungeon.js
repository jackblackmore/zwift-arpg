// The crypt built from KayKit Dungeon Remastered pieces (plus bones and graves from Halloween Bits).
// world/map.js calls buildDungeon() when the models have loaded; otherwise it falls back to primitive rocks.
// Every static piece is drawn with instancing: one draw call per distinct mesh, however many copies.
import * as T from 'three';
import { G } from '../core/state.js';
import { rand, pick, dist } from '../core/util.js';
import { loadGLB, linearise } from '../render/characters.js';
import { glowSprite, decal } from '../render/assets.js';
import { DUNGEON } from '../data/graphics.js';
import { FLOOR, WALL, BANNERS, OBSTACLES, OBSTACLE_COUNT, CLUTTER, BRAZIERS } from '../data/dungeon.js';

export const dun = { ready: false, tpl: {} };

export async function loadDungeon() {
  try {
    const g = await loadGLB('dungeon.glb');
    linearise(g.scene);
    const seen = new Set();
    g.scene.traverse(o => { if (o.material && !seen.has(o.material)) { seen.add(o.material); o.material.color.multiplyScalar(DUNGEON.bright); } });
    g.scene.updateMatrixWorld(true);
    for (const node of g.scene.children) {
      // Each part's matrix relative to the model root, and the model's lowest point (to sit it on the floor).
      const inv = new T.Matrix4().copy(node.matrixWorld).invert(), parts = [];
      node.traverse(o => { if (o.isMesh) parts.push({ geo: o.geometry, mat: o.material, m: new T.Matrix4().multiplyMatrices(inv, o.matrixWorld) }); });
      const box = new T.Box3().setFromObject(node);
      dun.tpl[node.name] = { parts, minY: box.min.y };
    }
    dun.ready = true;
  } catch (e) { console.warn('Dungeon models failed to load, using primitive rocks: ' + (e && (e.stack || e.message || e))); }
  return dun.ready;
}

const weighted = list => { let r = Math.random() * list.reduce((s, [, w]) => s + w, 0); for (const [n, w] of list) if ((r -= w) <= 0) return n; return list[0][0]; };

// Collects placements, then turns them into InstancedMeshes.
function batch() {
  const placed = new Map(), M = new T.Matrix4(), Q = new T.Quaternion(), Y = new T.Vector3(0, 1, 0), S = new T.Vector3(), P = new T.Vector3();
  return {
    // y: height of the model's origin; 'floor' sits its lowest point on the floor.
    add(name, x, z, rot = 0, s = DUNGEON.scale, y = 'floor') {
      const t = dun.tpl[name]; if (!t) return;
      if (y === 'floor') y = -t.minY * s;
      Q.setFromAxisAngle(Y, rot); S.setScalar(s); P.set(x, y, z);
      if (!placed.has(name)) placed.set(name, []);
      placed.get(name).push(new T.Matrix4().compose(P, Q, S));
    },
    // tint: multiply this batch's material colours (the floor shares its texture atlas with the walls but sits darker).
    flush(group, { cast = true, tint = 1 } = {}) {
      const mats = new Map(), mat = m => { if (tint === 1) return m; if (!mats.has(m)) { const c = m.clone(); c.color.multiplyScalar(tint); mats.set(m, c); } return mats.get(m); };
      for (const [name, list] of placed) for (const part of dun.tpl[name].parts) {
        const im = new T.InstancedMesh(part.geo, mat(part.mat), list.length);
        list.forEach((m, i) => im.setMatrixAt(i, M.multiplyMatrices(m, part.m)));
        im.castShadow = cast; im.receiveShadow = true;
        im.frustumCulled = false; // r128 culls instanced meshes by the source mesh's bounds, not the instances'
        group.add(im);
      }
    },
  };
}

// Rotate a model-space offset by rot around Y (three.js convention) and scale it.
const turn = (ox, oz, rot, s) => [(ox * Math.cos(rot) + oz * Math.sin(rot)) * s, (-ox * Math.sin(rot) + oz * Math.cos(rot)) * s];

// Builds the dungeon into G.world and fills G.obst / G.torches. half: the walkable area is -half..half on x and z.
export function buildDungeon(half) {
  const s = DUNGEON.scale, tile = 4 * s, floor = batch(), solid = batch();
  const start = G.start, boss = G.bossSpot;

  // Floor tiles, a ring wider than the walls so no edge shows.
  const n = Math.ceil((half + tile) / tile);
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) floor.add(weighted(FLOOR), i * tile, j * tile, (Math.random() * 4 | 0) * Math.PI / 2, s, 0);

  // Walls on the far side and both ends; a low barrier on the near side so it never hides the hero.
  const segs = Math.ceil((2 * half + 2 * s) / tile), x0 = -(segs - 1) * tile / 2, off = half + .5 * s;
  const sides = [
    { rot: 0, at: k => [x0 + k * tile, -off], nx: 0, nz: 1 }, // north wall, faces +z
    { rot: Math.PI / 2, at: k => [-off, x0 + k * tile], nx: 1, nz: 0 }, // west wall, faces +x
    { rot: -Math.PI / 2, at: k => [off, x0 + k * tile], nx: -1, nz: 0 }, // east wall, faces -x
  ];
  for (const sd of sides) for (let k = 0; k < segs; k++) {
    const [x, z] = sd.at(k), name = weighted(WALL); solid.add(name, x, z, sd.rot, s, 0);
    if (name === 'wall_broken' || name === 'wall_arched') continue;
    if (k % 3 === 1) solid.add(pick(BANNERS), x, z, sd.rot, s, 0);
    else if (k % 3 === 0 && k > 0 && k < segs - 1) {
      // A torch mounted on the wall, with its glow just in front of the face.
      const fx = x + sd.nx * .5 * s, fz = z + sd.nz * .5 * s;
      solid.add('torch_mounted', fx, fz, sd.rot, s * DUNGEON.torch, 2.3 * s);
      const f = glowSprite(0xff8a30, .9); f.position.set(fx + sd.nx * .55 * s * DUNGEON.torch, 2.3 * s + .75 * s * DUNGEON.torch, fz + sd.nz * .55 * s * DUNGEON.torch);
      G.world.add(f); G.torches.push({ f, x: fx, z: fz, s: .9 });
      const d = decal(0xff7020, 3.4); d.position.set(fx + sd.nx * 1.2, .2, fz + sd.nz * 1.2); d.position.y = .2; G.world.add(d);
    }
  }
  for (let k = 0; k < segs; k++) solid.add('barrier_column', x0 + k * tile, half + .35 * s, Math.PI, s);
  for (const [x, z] of [[-off, -off], [off, -off]]) solid.add('pillar', x, z, 0, s * 1.15);

  // Obstacles, each with one or more circle colliders.
  const feats = [];
  const total = OBSTACLES.reduce((a, o) => a + o.w, 0);
  for (let t = 0; t < 900 && feats.length < OBSTACLE_COUNT; t++) {
    let r = Math.random() * total, ob = OBSTACLES[0];
    for (const o of OBSTACLES) if ((r -= o.w) <= 0) { ob = o; break; }
    const x = rand(-half + 3, half - 3), z = rand(-half + 3, half - 3), rot = rand(0, Math.PI * 2);
    const circles = ob.circles.map(([ox, oz, cr]) => { const [dx, dz] = turn(ox, oz, rot, s); return { x: x + dx, z: z + dz, r: cr * s }; });
    const R = Math.max(...circles.map(c => dist(c.x, c.z, x, z) + c.r));
    if (dist(x, z, start.x, start.z) < 7 + R || dist(x, z, boss.x, boss.z) < 10 + R) continue;
    if (circles.some(c => Math.abs(c.x) > half - c.r - .5 || Math.abs(c.z) > half - c.r - .5)) continue;
    if (feats.some(f => dist(f.x, f.z, x, z) < f.R + R + 2.2)) continue;
    feats.push({ x, z, R }); solid.add(ob.name, x, z, rot, s);
    G.obst.push(...circles);
  }
  const free = (x, z, r) => !G.obst.some(o => (x - o.x) ** 2 + (z - o.z) ** 2 < (o.r + r) ** 2);
  const spot = (r, edge = 1) => { for (let t = 0; t < 40; t++) { const x = rand(-half + edge, half - edge), z = rand(-half + edge, half - edge); if (free(x, z, r)) return [x, z]; } return null; };

  // Braziers: candles on a short column, glowing.
  for (let k = 0; k < BRAZIERS; k++) {
    const p = spot(.8, 2); if (!p) continue; const [x, z] = p;
    solid.add('column', x, z, rand(0, 6), s);
    solid.add('candle_triple', x, z, rand(0, 6), s * DUNGEON.torch, 1.4 * s);
    const f = glowSprite(0xff8a30, 1.4); f.position.set(x, 1.4 * s + .95 * s * DUNGEON.torch, z);
    const d = decal(0xff7020, 4); d.position.set(x, .2, z); G.world.add(f, d);
    G.torches.push({ f, x, z }); G.obst.push({ x, z, r: .32 });
  }

  // The boss's ring of skull posts and gravestones.
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * Math.PI * 2, x = boss.x + Math.cos(a) * 8, z = boss.z + Math.sin(a) * 8;
    if (Math.abs(x) > half - 1 || Math.abs(z) > half - 1 || !free(x, z, .4)) continue;
    if (k % 2) { solid.add('post_skull', x, z, -a + Math.PI / 2, s); G.obst.push({ x, z, r: .3 }); }
    else solid.add('gravestone', x, z, -a - Math.PI / 2, s);
  }

  // Clutter, and a few chests against the walls.
  for (const [name, count] of CLUTTER) for (let k = 0; k < count; k++) { const p = spot(.3); if (p) floor.add(name, p[0], p[1], rand(0, 6), s); }
  for (let k = 0; k < 4; k++) {
    const x = rand(-half + 3, half - 3), z = -half + 1.2;
    if (free(x, z, .9)) { solid.add('chest', x, z, 0, s); G.obst.push({ x, z, r: .7 }); }
  }

  floor.flush(G.world, { cast: false, tint: DUNGEON.floor }); solid.flush(G.world);
}

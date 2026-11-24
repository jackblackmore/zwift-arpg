// The crypt built from KayKit Dungeon Remastered pieces (plus bones and graves from Halloween Bits).
// world/map.js calls buildDungeon() when the models have loaded; otherwise it falls back to primitive rocks.
// Every static piece is drawn with instancing: one draw call per distinct mesh, however many copies.
import * as T from 'three';
import { G } from '../core/state.js';
import { rand, pick, dist } from '../core/util.js';
import { loadGLB, linearise } from '../render/characters.js';
import { glowSprite, decal } from '../render/assets.js';
import { DUNGEON } from '../data/graphics.js';
import { FLOOR, WALL, BANNERS, OBSTACLES, CLUTTER, OBSTACLE_DENSITY, WALL_TORCH, BRAZIER_MAX } from '../data/dungeon.js';
import { solid, wallHit, lineDist } from './gen.js';

// Door frame look: jamb pillar scale (× DUNGEON.scale), lintel height, how far it overhangs the gap, depth (× scale), lift above the wall top.
const DOOR_FRAME = { jamb: 1.05, lintel: .8, over: .9, depth: 1.25, lift: .15 };

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
    // y: height of the model's origin; 'floor' sits its lowest point on the floor. s: a scale, or [x, y, z] scales.
    add(name, x, z, rot = 0, s = DUNGEON.scale, y = 'floor') {
      const t = dun.tpl[name]; if (!t) return;
      if (y === 'floor') y = -t.minY * (Array.isArray(s) ? s[1] : s);
      Q.setFromAxisAngle(Y, rot); if (Array.isArray(s)) S.set(...s); else S.setScalar(s); P.set(x, y, z);
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

// Builds the dungeon for a layout (world/gen.js) into G.world and fills G.obst / G.torches: floor tiles only where there is
// floor, walls along every room and corridor edge, props in the rooms (never across a doorway).
export function buildDungeon(L) {
  const s = DUNGEON.scale, cell = L.cell, half = L.half, floor = batch(), solidB = batch(), start = L.start, boss = L.boss;
  const cx = i => -half + (i + .5) * cell, edgeX = i => -half + i * cell;
  const isFloor = (i, j) => !solid(L, i, j);

  // Floor: one tile per floor cell.
  const cells = [];
  for (let j = 0; j < L.n; j++) for (let i = 0; i < L.n; i++) if (isFloor(i, j)) { cells.push([i, j]); floor.add(weighted(FLOOR), cx(i), cx(j), (Math.random() * 4 | 0) * Math.PI / 2, s, 0); }

  // Walls on the north, west and east edges of floor cells; a low barrier on south edges so a wall never hides the hero.
  let k = 0, torches = 0;
  const wall = (x, z, rot, nx, nz) => {
    const name = weighted(WALL); solidB.add(name, x, z, rot, s, 0); k++;
    if (name === 'wall_broken' || name === 'wall_arched') return;
    if (k % 4 === 1) solidB.add(pick(BANNERS), x, z, rot, s, 0);
    else if (k % WALL_TORCH.every === 3 && torches < WALL_TORCH.max) {
      // A torch mounted on the wall, with its glow just in front of the face.
      torches++; const fx = x + nx * .5 * s, fz = z + nz * .5 * s;
      solidB.add('torch_mounted', fx, fz, rot, s * DUNGEON.torch, 2.3 * s);
      const f = glowSprite(0xff8a30, .9); f.position.set(fx + nx * .55 * s * DUNGEON.torch, 2.3 * s + .75 * s * DUNGEON.torch, fz + nz * .55 * s * DUNGEON.torch);
      G.world.add(f); G.torches.push({ f, x: fx, z: fz, s: .9 });
      const d = decal(0xff7020, 3.4); d.position.set(fx + nx * 1.2, .2, fz + nz * 1.2); G.world.add(d);
    }
  };
  for (const [i, j] of cells) {
    const x = cx(i), z = cx(j), w = edgeX(i), e = edgeX(i + 1), n = edgeX(j), so = edgeX(j + 1);
    if (!isFloor(i, j - 1)) wall(x, n - .5 * s, 0, 0, 1);
    if (!isFloor(i - 1, j)) wall(w - .5 * s, z, Math.PI / 2, 1, 0);
    if (!isFloor(i + 1, j)) wall(e + .5 * s, z, -Math.PI / 2, -1, 0);
    if (!isFloor(i, j + 1)) solidB.add('barrier_column', x, so + .35 * s, Math.PI, s);
  }
  // Door frames (world/gen.js room.doors): a decorated pillar each side of the gap and, on north walls (the ones the camera sees
  // face on), a stone lintel across the top. Seen from the camera's height a lintel on a side wall reads as more wall and hides
  // the doorway, and south walls stay low so they never hide the hero, so those get the pillars only. Dungeon Remastered's own doorway pieces (wall_doorway, wall_open_scaffold)
  // have one-tile openings, narrower than our two-cell doorways, and its wall_arched is a solid wall with the arch in relief, so
  // the frame is made of pieces already in dungeon.glb: the lintel is a plain wall piece squashed to a beam.
  const jambs = new Set();
  for (const r of L.rooms) for (const d of r.doors) {
    const along = d.side === 'n' || d.side === 's', line = { e: r.i0 + r.w, w: r.i0, s: r.j0 + r.h, n: r.j0 }[d.side];
    const a = Math.round(((along ? d.x : d.z) - d.w / 2 + half) / cell), b = a + Math.round(d.w / cell);
    for (const k of [a, b]) { const [vi, vj] = along ? [k, line] : [line, k]; jambs.add(vj * (L.n + 1) + vi); solidB.add('pillar_decorated', edgeX(vi), edgeX(vj), along ? 0 : Math.PI / 2, s * DOOR_FRAME.jamb); }
    if (d.side !== 'n') continue;
    const F = DOOR_FRAME; solidB.add('wall', d.x, d.z - .5 * s, 0, [(d.w + F.over) / 4, F.lintel / 4, s * F.depth], 4 * s - F.lintel + F.lift);
  }
  // Pillars where a wall turns a corner (door jambs have their own).
  for (let j = 0; j <= L.n; j++) for (let i = 0; i <= L.n; i++) {
    const a = isFloor(i - 1, j - 1), b = isFloor(i, j - 1), c = isFloor(i - 1, j), d = isFloor(i, j), cnt = a + b + c + d;
    if (cnt === 0 || cnt === 4 || (cnt === 2 && a === b) || jambs.has(j * (L.n + 1) + i)) continue; // open floor, solid rock, a straight wall or a door jamb
    solidB.add('pillar', edgeX(i), edgeX(j), 0, s * 1.15);
  }

  // Props. A spot is free when it clears walls and other props; props also keep clear of the corridor centre lines.
  const feats = [], free = (x, z, r) => !wallHit(L, x, z, r) && !G.obst.some(o => (x - o.x) ** 2 + (z - o.z) ** 2 < (o.r + r) ** 2);
  const total = OBSTACLES.reduce((a, o) => a + o.w, 0);
  for (const room of L.rooms) {
    if (room.kind === 'boss') continue;
    const want = room.kind === 'start' || room.role === 'rest' ? 1 : Math.round(room.w * room.h * OBSTACLE_DENSITY * (room.kind === 'side' ? 1.3 : 1)); // a rest room stays open and calm
    for (let t = 0, got = 0; t < 70 && got < want; t++) {
      let r = Math.random() * total, ob = OBSTACLES[0];
      for (const o of OBSTACLES) if ((r -= o.w) <= 0) { ob = o; break; }
      const x = edgeX(room.i0 + .5 + Math.random() * (room.w - 1)), z = edgeX(room.j0 + .5 + Math.random() * (room.h - 1)), rot = rand(0, Math.PI * 2);
      const circles = ob.circles.map(([ox, oz, cr]) => { const [dx, dz] = turn(ox, oz, rot, s); return { x: x + dx, z: z + dz, r: cr * s }; });
      const R = Math.max(...circles.map(c => dist(c.x, c.z, x, z) + c.r));
      if (dist(x, z, start.x, start.z) < 5 + R || lineDist(L, x, z) < R + 2.4) continue;
      if (circles.some(c => wallHit(L, c.x, c.z, c.r + 1.2))) continue;
      if (feats.some(f => dist(f.x, f.z, x, z) < f.R + R + 2.2)) continue;
      feats.push({ x, z, R }); solidB.add(ob.name, x, z, rot, s); G.obst.push(...circles); got++;
    }
  }
  const spot = r => { for (let t = 0; t < 40; t++) { const [i, j] = cells[Math.random() * cells.length | 0], x = edgeX(i + Math.random()), z = edgeX(j + Math.random()); if (free(x, z, r)) return [x, z]; } return null; };

  // Braziers: candles on a short column, glowing, tucked into room corners.
  let braziers = 0;
  for (const room of [...L.rooms].sort(() => Math.random() - .5)) {
    const corners = [[room.i0, room.j0], [room.i0 + room.w - 1, room.j0], [room.i0, room.j0 + room.h - 1], [room.i0 + room.w - 1, room.j0 + room.h - 1]].sort(() => Math.random() - .5);
    for (const [i, j] of corners) {
      if (braziers >= BRAZIER_MAX) break;
      const x = cx(i) + (i === room.i0 ? -1 : 1) * cell * .2, z = cx(j) + (j === room.j0 ? -1 : 1) * cell * .2;
      if (!isFloor(i, j) || !free(x, z, .8) || lineDist(L, x, z) < 1.8) continue;
      braziers++;
      solidB.add('column', x, z, rand(0, 6), s);
      solidB.add('candle_triple', x, z, rand(0, 6), s * DUNGEON.torch, 1.4 * s);
      const f = glowSprite(0xff8a30, 1.4); f.position.set(x, 1.4 * s + .95 * s * DUNGEON.torch, z);
      const d = decal(0xff7020, 4); d.position.set(x, .2, z); G.world.add(f, d);
      G.torches.push({ f, x, z }); G.obst.push({ x, z, r: .32 });
      if (room.w * room.h < 36) break; // a second one only in big rooms
    }
  }

  // The guardian's ring of skull posts and gravestones, inside the arena.
  const ringR = Math.min(8, L.rooms[L.route[L.route.length - 1]].w * cell / 2 - 1.8);
  for (let q = 0; q < 10; q++) {
    const a = q / 10 * Math.PI * 2, x = boss.x + Math.cos(a) * ringR, z = boss.z + Math.sin(a) * ringR;
    if (wallHit(L, x, z, 1) || !free(x, z, .4)) continue;
    if (q % 2) { solidB.add('post_skull', x, z, -a + Math.PI / 2, s); G.obst.push({ x, z, r: .3 }); }
    else solidB.add('gravestone', x, z, -a - Math.PI / 2, s);
  }

  // Clutter on the floor. (Chests are only in treasure rooms now, and open: game/rooms.js.)
  for (const [name, count] of CLUTTER) for (let q = 0; q < count; q++) { const p = spot(.3); if (p) floor.add(name, p[0], p[1], rand(0, 6), s); }

  floor.flush(G.world, { cast: false, tint: DUNGEON.floor }); solidB.flush(G.world);
}

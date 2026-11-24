// Level layout generator: rooms of varied sizes joined by corridors along a main route from the entrance to the
// guardian arena, plus a few dead-end side rooms. Pure (imports only data); pass an rng to seed it.
// Tuning is in data/dungeon.js (GEN).
//
// Returns a layout:
//   n, cell, half   grid is n × n cells, each `cell` units; world x,z = -half + (i|j) * cell
//   grid            Uint8Array, index j * n + i; 1 = floor, 0 = wall
//   rooms           [{ id, kind: start|main|side|boss, i0, j0, w, h, x, z (centre), rank }]
//   route           room ids from the entrance to the guardian
//   edges           [{ a, b, pts: [{x, z}], len, rank, mid: {x, z} }] one per corridor (a, b are room ids)
//   path            the main route as a world polyline, entrance to guardian; routeLen is its length
//   start, boss     world positions of the entrance and the guardian
//   rank            rooms and edges get an order along the route (side rooms: parent + .5) for the autopilot
import { GEN } from '../data/dungeon.js';

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function generateLevel(opts = {}, rng = Math.random) {
  const g = { ...GEN, ...opts };
  const Z = g.zones, ZC = g.zoneCells, n = Z * ZC, cell = g.cell, half = n * cell / 2, cw = g.corridor;
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const grid = new Uint8Array(n * n);
  const zk = (x, y) => y * Z + x;
  const wp = (ci, cj) => ({ x: -half + (ci + cw / 2) * cell, z: -half + (cj + cw / 2) * cell }); // centre of the cw × cw block at (ci, cj)

  // 1. Main route: a random self-avoiding walk of zones from bottom-left to top-right, at least `want` zones long.
  const sz = [0, Z - 1], ez = [Z - 1, 0], want = ri(g.route[0], g.route[1]);
  let route = null, budget = 40000;
  const seen = new Set([zk(...sz)]), walk = [sz];
  (function dfs() {
    const [x, y] = walk[walk.length - 1];
    if (x === ez[0] && y === ez[1]) { if (walk.length >= want) route = walk.slice(); return; }
    for (const [dx, dy] of shuffle(NB.slice())) {
      if (--budget < 0 || route) return;
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= Z || ny >= Z || seen.has(zk(nx, ny))) continue;
      seen.add(zk(nx, ny)); walk.push([nx, ny]); dfs(); walk.pop(); seen.delete(zk(nx, ny));
      if (route) return;
    }
  })();
  if (!route) { // fallback: a monotone staircase
    route = [sz]; let [x, y] = sz;
    while (x !== ez[0] || y !== ez[1]) { if (x < ez[0] && (y === ez[1] || rng() < .5)) x++; else y--; route.push([x, y]); }
  }

  // 2. Rooms. A room sits inside its zone with two wall cells to every side.
  const rooms = [], byZone = new Map();
  const addRoom = (zx, zy, kind, w, h) => {
    const i0 = zx * ZC + ri(2, ZC - w - 2), j0 = zy * ZC + ri(2, ZC - h - 2);
    const r = { id: rooms.length, kind, zx, zy, i0, j0, w, h, rank: 0 };
    for (let j = j0; j < j0 + h; j++) for (let i = i0; i < i0 + w; i++) grid[j * n + i] = 1;
    // An L shape: take a block out of one corner (never the middle, where the corridors meet).
    if (w >= 5 && h >= 5 && kind !== 'start' && kind !== 'boss' && rng() < g.notchChance) {
      const nw = ri(1, w - 3 >> 1), nh = ri(1, h - 3 >> 1), left = rng() < .5, top = rng() < .5;
      for (let j = 0; j < nh; j++) for (let i = 0; i < nw; i++) grid[(top ? j0 + j : j0 + h - 1 - j) * n + (left ? i0 + i : i0 + w - 1 - i)] = 0;
    }
    // Centre block: where corridors join. cw × cw cells.
    r.ci = i0 + (w - cw >> 1); r.cj = j0 + (h - cw >> 1);
    const c = wp(r.ci, r.cj); r.x = c.x; r.z = c.z;
    rooms.push(r); byZone.set(zk(zx, zy), r); return r;
  };
  route.forEach(([zx, zy], k) => {
    const first = k === 0, last = k === route.length - 1;
    const w = first ? ri(...g.startRoom) : last ? g.bossRoom : ri(...g.room), h = first ? ri(...g.startRoom) : last ? g.bossRoom : ri(...g.room);
    const r = addRoom(zx, zy, first ? 'start' : last ? 'boss' : 'main', w, h); r.rank = k;
  });
  const routeIds = rooms.map(r => r.id), edges = [];

  // 3. Side rooms: dead ends off any room but the guardian's.
  const nSide = ri(...g.side);
  for (let s = 0; s < nSide; s++) {
    const opts = [];
    for (const r of rooms) { if (r.kind === 'boss') continue; for (const [dx, dy] of NB) { const x = r.zx + dx, y = r.zy + dy; if (x >= 0 && y >= 0 && x < Z && y < Z && !byZone.has(zk(x, y))) opts.push([r, x, y]); } }
    if (!opts.length) break;
    const [par, x, y] = opts[Math.floor(rng() * opts.length)];
    const r = addRoom(x, y, 'side', ri(...g.room), ri(...g.room)); r.rank = par.rank + .5; r.parent = par.id; link(par, r, edges);
  }

  // 4. Corridors. A Z shape through the margin between the two zones: out of A along its centre row (or column), along the
  //    boundary, then into B. Points are world positions of the corridor centre line.
  function carve(i0, j0, i1, j1) { for (let j = Math.min(j0, j1); j <= Math.max(j0, j1); j++) for (let i = Math.min(i0, i1); i <= Math.max(i0, i1); i++) grid[j * n + i] = 1; }
  function link(a, b, list) {
    let pts;
    if (a.zy === b.zy) { // horizontal neighbours
      const m = Math.max(a.zx, b.zx) * ZC - (cw >> 1);
      carve(a.ci, a.cj, m + cw - 1, a.cj + cw - 1); carve(m, a.cj, m + cw - 1, b.cj + cw - 1); carve(m, b.cj, b.ci + cw - 1, b.cj + cw - 1);
      pts = [wp(a.ci, a.cj), wp(m, a.cj), wp(m, b.cj), wp(b.ci, b.cj)];
    } else { // vertical neighbours
      const m = Math.max(a.zy, b.zy) * ZC - (cw >> 1);
      carve(a.ci, a.cj, a.ci + cw - 1, m + cw - 1); carve(a.ci, m, b.ci + cw - 1, m + cw - 1); carve(b.ci, m, b.ci + cw - 1, b.cj + cw - 1);
      pts = [wp(a.ci, a.cj), wp(a.ci, m), wp(b.ci, m), wp(b.ci, b.cj)];
    }
    // The point halfway along the corridor, for chokepoint packs.
    let len = 0; const L = []; for (let k = 1; k < pts.length; k++) { L.push(Math.hypot(pts[k].x - pts[k - 1].x, pts[k].z - pts[k - 1].z)); len += L[k - 1]; }
    let h = len / 2, mid = pts[0]; for (let k = 0; k < L.length; k++) { if (h <= L[k] || k === L.length - 1) { const t = L[k] ? Math.min(1, h / L[k]) : 0; mid = { x: pts[k].x + (pts[k + 1].x - pts[k].x) * t, z: pts[k].z + (pts[k + 1].z - pts[k].z) * t }; break; } h -= L[k]; }
    list.push({ a: a.id, b: b.id, pts, len, mid, rank: Math.min(a.rank, b.rank) + .25 });
  }
  for (let k = 1; k < routeIds.length; k++) link(rooms[routeIds[k - 1]], rooms[routeIds[k]], edges);

  // The main route as one polyline.
  const path = []; let routeLen = 0;
  for (let k = 1; k < routeIds.length; k++) {
    const e = edges.find(e => e.a === routeIds[k - 1] && e.b === routeIds[k]);
    for (const p of e.pts) if (!path.length || Math.hypot(p.x - path[path.length - 1].x, p.z - path[path.length - 1].z) > .01) path.push(p);
  }
  for (let k = 1; k < path.length; k++) routeLen += Math.hypot(path[k].x - path[k - 1].x, path[k].z - path[k - 1].z);

  const start = { x: rooms[0].x, z: rooms[0].z }, boss = { x: rooms[routeIds[routeIds.length - 1]].x, z: rooms[routeIds[routeIds.length - 1]].z };
  return { n, cell, half, grid, rooms, route: routeIds, edges, path, routeLen, start, boss, zones: Z };
}

// Distance in cells from (ci, cj) to every floor cell: 8-way moves, diagonals only when both neighbours are floor. -1 = unreachable.
export function walkField(L, ci, cj) {
  const { n, grid } = L, d = new Int16Array(n * n).fill(-1);
  if (ci < 0 || cj < 0 || ci >= n || cj >= n || !grid[cj * n + ci]) return d;
  const q = new Int32Array(n * n); let h = 0, t = 0; q[t++] = cj * n + ci; d[q[0]] = 0;
  while (h < t) {
    const c = q[h++], i = c % n, j = c / n | 0, nd = d[c] + 1;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const x = i + di, y = j + dj; if (x < 0 || y < 0 || x >= n || y >= n || !grid[y * n + x] || d[y * n + x] >= 0) continue;
      if (di && dj && (!grid[j * n + x] || !grid[y * n + i])) continue;
      d[y * n + x] = nd; q[t++] = y * n + x;
    }
  }
  return d;
}

export const cellOf = (L, v) => Math.floor((v + L.half) / L.cell);

// Distance from (x, z) to the nearest corridor centre line (all edges, side rooms too). Props keep clear of these so doors never jam.
export function lineDist(L, x, z) {
  let best = 1e9;
  for (const e of L.edges) for (let k = 1; k < e.pts.length; k++) {
    const a = e.pts[k - 1], b = e.pts[k], dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2));
    best = Math.min(best, Math.hypot(x - a.x - dx * t, z - a.z - dz * t));
  }
  return best;
}
// Room containing (x, z), or null (corridors).
export function roomAt(L, x, z) {
  const i = cellOf(L, x), j = cellOf(L, z);
  for (const r of L.rooms) if (i >= r.i0 && i < r.i0 + r.w && j >= r.j0 && j < r.j0 + r.h && L.grid[j * L.n + i]) return r;
  return null;
}

export const solid = (L, i, j) => i < 0 || j < 0 || i >= L.n || j >= L.n || !L.grid[j * L.n + i];
// Does the circle (x, z, r) touch a wall cell?
export function wallHit(L, x, z, r) {
  const i0 = Math.floor((x - r + L.half) / L.cell), i1 = Math.floor((x + r + L.half) / L.cell), j0 = Math.floor((z - r + L.half) / L.cell), j1 = Math.floor((z + r + L.half) / L.cell);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    if (!solid(L, i, j)) continue;
    const cx = Math.max(-L.half + i * L.cell, Math.min(x, -L.half + (i + 1) * L.cell)), cz = Math.max(-L.half + j * L.cell, Math.min(z, -L.half + (j + 1) * L.cell));
    if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
  }
  return false;
}

// Rooms with more than one way on once you're in them (the autopilot's junctions, game/route.js): a route room with a side room
// off it, or the entrance with more than one corridor. On a full clear the autopilot stops at each once.
export function junctionRooms(L) {
  const deg = new Map(L.rooms.map(r => [r.id, 0]));
  for (const e of L.edges) { deg.set(e.a, deg.get(e.a) + 1); deg.set(e.b, deg.get(e.b) + 1); }
  return L.rooms.filter(r => r.kind !== 'side' && r.kind !== 'boss' && deg.get(r.id) >= (r.kind === 'start' ? 2 : 3));
}

// Length of a full clear's walk: from the entrance through every room (room centre to room centre along the corridors) and
// back out of each dead end, ending in the guardian arena. Each corridor is walked twice except those on the main route.
export function tourLen(L) {
  const R = L.rooms, leg = e => { const a = R[e.a], b = R[e.b], p0 = e.pts[0], p1 = e.pts[e.pts.length - 1]; return e.len + Math.min(Math.hypot(a.x - p0.x, a.z - p0.z) + Math.hypot(b.x - p1.x, b.z - p1.z), Math.hypot(a.x - p1.x, a.z - p1.z) + Math.hypot(b.x - p0.x, b.z - p0.z)); };
  const onRoute = new Set(); for (let k = 1; k < L.route.length; k++) onRoute.add(L.route[k - 1] + ',' + L.route[k]);
  return L.edges.reduce((n, e) => n + leg(e) * (onRoute.has(e.a + ',' + e.b) || onRoute.has(e.b + ',' + e.a) ? 1 : 2), 0);
}

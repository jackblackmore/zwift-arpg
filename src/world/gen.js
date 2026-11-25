// Level layout generator: rooms of varied sizes joined by corridors along a main route from the entrance to the
// guardian arena, plus a few dead-end side rooms. Pure (imports only data); pass an rng to seed it.
// Tuning is in data/dungeon.js (GEN).
//
// Returns a layout:
//   n, cell, half   grid is n × n cells, each `cell` units; world x,z = -half + (i|j) * cell
//   grid            Uint8Array, index j * n + i; 1 = floor, 0 = wall
//   rooms           [{ id, kind: start|main|side|boss, role, i0, j0, w, h, x, z (centre), rank, doors }]
//   role            what the room holds (data/dungeon.js ROLES): start, combat, elite, treasure, rest, guardian; set by the
//                   rhythm template (RHYTHM) after the layout is made, so the layout for a seed is the same with or without roles
//   doors           per room: [{ side: n|s|e|w, x, z, w, to, edge }] the real gaps in its walls, one per corridor. x, z is the middle
//                   of the gap on the room's wall line (n = smaller z, s = larger z, the camera side); w its width in units;
//                   to the room the corridor leads to; edge the corridor's index in edges
//   route           room ids from the entrance to the guardian
//   edges           [{ a, b, pts: [{x, z}], len, rank, mid: {x, z} }] one per corridor (a, b are room ids)
//   path            the main route as a world polyline, entrance to guardian; routeLen is its length
//   start, boss     world positions of the entrance and the guardian
//   rank            rooms and edges get an order along the route (side rooms: parent + .5) for the autopilot
//   set             per room, its set piece (data/dungeon.js SET) or none: { kind: arena|vault|chapel|hall, name, spot: {x, z} (the
//                   guardian's, chest's, flame's or elite's place) or null, face (rotation toward the way in), props: [{ k, x, z, rot,
//                   c: [[x, z, r]] }] (pieces and their circle colliders, world units), wall: [[i, j]] (partition cells made wall) }
//   pools           poison pools on the floor (opts.pools: a level with pools, data/dungeon.js LEVELS and POOLS): [{ x, z, r, room }]
// opts: overrides of GEN (each level's `gen`, data/dungeon.js LEVELS) and `pools`.
import { GEN, RHYTHM, SET, POOLS } from '../data/dungeon.js';

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
    const r = { id: rooms.length, kind, zx, zy, i0, j0, w, h, rank: 0, doors: [] };
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
    // Doors: where the corridor crosses each room's wall line (it leaves a room along the room's centre row or column).
    const edge = list.length;
    for (const [r, o] of [[a, b], [b, a]]) {
      const side = a.zy === b.zy ? (o.zx > r.zx ? 'e' : 'w') : (o.zy > r.zy ? 's' : 'n');
      const x = side === 'e' ? -half + (r.i0 + r.w) * cell : side === 'w' ? -half + r.i0 * cell : r.x;
      const z = side === 's' ? -half + (r.j0 + r.h) * cell : side === 'n' ? -half + r.j0 * cell : r.z;
      r.doors.push({ side, x, z, w: cw * cell, to: o.id, edge });
    }
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

  assignRoles(rooms, routeIds.length, rng);
  const L = { n, cell, half, grid, rooms, route: routeIds, edges, path, routeLen, zones: Z };
  setPieces(L, rng); // after the roles (a seed's layout and roles are the same as before set pieces); vault partitions change the grid
  L.pools = g.pools ? layPools(L, rng) : []; // last, so a seed's layout is the same with or without them
  const start = { x: rooms[0].x, z: rooms[0].z }, boss = { x: rooms[routeIds[routeIds.length - 1]].x, z: rooms[routeIds[routeIds.length - 1]].z };
  return Object.assign(L, { start, boss });
}

// Room roles by the rhythm template (data/dungeon.js RHYTHM): the entrance and the guardian's arena keep theirs, every other room
// is combat unless a beat takes it. A beat takes one combat room within its stretch of the route (a side room counts its parent's
// place), a side room when it prefers one and there is one, else a route room (side: 2, side rooms only). The warm-up stretch stays combat.
function assignRoles(rooms, nRoute, rng) {
  const last = nRoute - 1, place = r => (r.kind === 'side' ? rooms[r.parent].rank : r.rank) / last;
  for (const r of rooms) r.role = r.kind === 'start' ? 'start' : r.kind === 'boss' ? 'guardian' : 'combat';
  for (const b of RHYTHM.beats) {
    if (b.chance !== undefined && rng() >= b.chance) continue;
    const ok = r => r.role === 'combat' && place(r) >= Math.max(b.at[0], RHYTHM.warm) && place(r) <= b.at[1];
    const side = rooms.filter(r => r.kind === 'side' && ok(r)), main = rooms.filter(r => r.kind === 'main' && ok(r));
    const pool = b.side === 2 ? side : b.side && side.length ? side : main;
    if (pool.length) pool[Math.floor(rng() * pool.length)].role = b.role;
  }
}
// ---- Poison pools (data/dungeon.js POOLS; Flooded Tombs): in combat rooms, clear of walls, the corridor lines and each other ----
function layPools(L, rng) {
  const P = POOLS, X = k => -L.half + k * L.cell, out = [];
  for (const r of L.rooms) {
    if (r.role !== 'combat' || rng() >= P.rooms) continue;
    const want = P.per[0] + Math.floor(rng() * (P.per[1] - P.per[0] + 1));
    for (let t = 0, got = 0; t < 40 && got < want; t++) {
      const rad = P.r[0] + rng() * (P.r[1] - P.r[0]), x = X(r.i0 + rng() * r.w), z = X(r.j0 + rng() * r.h);
      if (roomAt(L, x, z) !== r || wallHit(L, x, z, rad + P.wallGap) || lineDist(L, x, z) < rad + P.lineGap || out.some(p => Math.hypot(p.x - x, p.z - z) < p.r + rad + P.apart)) continue;
      out.push({ x, z, r: rad, room: r.id }); got++;
    }
  }
  return out;
}
// ---- Set pieces (data/dungeon.js SET): authored dressing for the guardian arena, treasure vaults, rest chapels and elite halls ----
// Each piece is a circle collider or none; a piece goes in only where it fits (in its room, clear of walls by SET.wallGap and of
// every corridor centre line by SET.lineGap plus its radius, and of the other pieces), so doorways and the walk through stay open.
const IN = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] }; // a door's inward direction
function setPieces(L, rng) {
  const X = k => -L.half + k * L.cell;
  for (const r of L.rooms) {
    const kind = Object.keys(SET).find(k => SET[k].role === r.role); r.set = null; if (!kind) continue;
    const T = SET[kind], S = { kind, name: T.name, spot: null, face: 0, props: [], keep: [], wall: [] };
    const fits = (x, z, rad) => roomAt(L, x, z) === r && !wallHit(L, x, z, rad + SET.wallGap) && lineDist(L, x, z) >= rad + SET.lineGap
      && !S.keep.some(([px, pz, pr]) => (px - x) ** 2 + (pz - z) ** 2 < (pr + rad) ** 2)
      && !S.props.some(p => p.c.some(([px, pz, pr]) => (px - x) ** 2 + (pz - z) ** 2 < (pr + rad + .8) ** 2));
    // add: one piece if it fits; c: its colliders as [dx, dz, r] around (x, z) (default one circle of `rad`), all checked
    const add = (k, x, z, rot, rad, c = rad ? [[0, 0, rad]] : []) => {
      const cc = c.map(([dx, dz, cr]) => [x + dx, z + dz, cr]);
      if (!(cc.length ? cc.every(([cx, cz, cr]) => fits(cx, cz, cr)) : fits(x, z, .3))) return false;
      S.props.push({ k, x, z, rot, c: cc }); return true;
    };
    const R = { x0: X(r.i0), x1: X(r.i0 + r.w), z0: X(r.j0), z1: X(r.j0 + r.h) };
    if (kind === 'arena') {
      S.spot = { x: r.x, z: r.z }; S.props.push({ k: 'dais', x: r.x, z: r.z, rot: 0, s: T.dais, lift: T.lift, c: [] }); S.keep.push([r.x, r.z, T.dais]);
      for (let q = 0; q < 4; q++) { const a = (q + .5) * Math.PI / 2; add('pillarD', r.x + Math.cos(a) * T.pillar, r.z + Math.sin(a) * T.pillar, 0, .85); }
      for (const [x, z] of [[R.x0, R.z0], [R.x1, R.z0], [R.x0, R.z1], [R.x1, R.z1]]) add('brazier', x + Math.sign(r.x - x) * T.corner, z + Math.sign(r.z - z) * T.corner, rng() * 6, .35);
      for (let q = 0; q < 12; q++) { const a = q / 12 * Math.PI * 2; add(q % 2 ? 'post' : 'grave', r.x + Math.cos(a) * T.ring, r.z + Math.sin(a) * T.ring, q % 2 ? -a + Math.PI / 2 : -a - Math.PI / 2, q % 2 ? .3 : .45); }
    } else {
      // The way in: the door toward the entrance (a side room's only door), and the room's frame from it: inward u, across v.
      const d0 = r.doors.reduce((a, d) => !a || L.rooms[d.to].rank < L.rooms[a.to].rank ? d : a, null), [ux, uz] = IN[d0.side], vx = uz ? 1 : 0, vz = ux ? 1 : 0;
      const deep = ux ? r.w : r.h, across = ux ? r.h : r.w, at = (u, v) => [d0.x + ux * u + vx * v, d0.z + uz * u + vz * v];
      const vMin = ux ? R.z0 - d0.z : R.x0 - d0.x, vMax = ux ? R.z1 - d0.z : R.x1 - d0.x, D = deep * L.cell;
      if (kind === 'vault') {
        // A partition across the room with a gap on the doorway's line (the corridor's cells), both sides at least 2 cells deep.
        if (r.doors.length === 1 && deep >= T.depth && across >= T.cross) {
          // the antechamber is the 2 cells nearest the doorway, the vault behind it as deep as the room allows (deep − 3 cells)
          const k0 = ux ? r.i0 : r.j0, p = ux < 0 || uz < 0 ? k0 + deep - 3 : k0 + 2, g0 = ux ? r.cj : r.ci;
          for (let t = 0; t < across; t++) { const c = (ux ? r.j0 : r.i0) + t; if (c === g0 || c === g0 + 1) continue; const [i, j] = ux ? [p, c] : [c, p]; if (L.grid[j * L.n + i]) { L.grid[j * L.n + i] = 0; S.wall.push([i, j]); } }
          S.ante = true;
        }
        // The chest: against the wall facing the way in (else another wall without a doorway), on the room's centre line.
        const cands = [['n', r.x, R.z0 + T.wall], ['s', r.x, R.z1 - T.wall], ['w', R.x0 + T.wall, r.z], ['e', R.x1 - T.wall, r.z]]
          .filter(([sd, x, z]) => !r.doors.some(d => d.side === sd) && roomAt(L, x, z) === r && !wallHit(L, x, z, 1 + .2) && lineDist(L, x, z) >= 1 + SET.lineGap)
          .sort((a, b) => lineDist(L, b[1], b[2]) - lineDist(L, a[1], a[2]));
        if (cands.length) {
          const [sd, x, z] = cands[0], [nx, nz] = IN[sd]; S.spot = { x, z }; S.face = Math.atan2(nx, nz); S.lift = T.plinth[1];
          S.props.push({ k: 'plinth', x, z, rot: S.face, c: [[x, z, 1]] });
          for (const t of [-1, 1]) add('brazier', x + nz * t * T.flank, z + nx * t * T.flank, rng() * 6, .35);
          for (let q = 0; q < 3; q++) { const a = rng() * 6.28, cx = x + Math.cos(a) * 1.6 + nx * .4, cz = z + Math.sin(a) * 1.6 + nz * .4; if (fits(cx, cz, .2)) S.props.push({ k: 'coins', x: cx, z: cz, rot: a, c: [] }); }
        }
        if (S.ante) for (const t of [-1, 1]) { // coffins lying along the partition, on the antechamber's side
          const [x, z] = at(2 * L.cell - 1.8, t * (L.cell * 1.5 + 1.2));
          add('coffin', x, z, vx ? Math.PI / 2 : 0, .8, vx ? [[-.6, 0, .8], [.6, 0, .8]] : [[0, -.6, .8], [0, .6, .8]]);
        }
      } else if (kind === 'chapel') {
        // The quietest part of the room: of the points round the centre, the one furthest from the corridors that fits the flame.
        let best = null;
        for (const f of [1, 1.35, .75]) for (let q = 0; q < 8; q++) { const a = q * Math.PI / 4, x = r.x + Math.cos(a) * T.off * f, z = r.z + Math.sin(a) * T.off * f; if (fits(x, z, 1.4)) { const sc = lineDist(L, x, z); if (!best || sc > best[2]) best = [x, z, sc]; } }
        if (best) {
          const [x, z] = best; S.spot = { x, z }; S.keep.push([x, z, 1.7]);
          let dx = x - r.x, dz = z - r.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; // away from the corridors
          const b = T.bench, h = T.benchLen / 2 - .4;
          for (const [px, pz] of [[-dz, dx], [dz, -dx], [dx, dz]]) { // either side of the flame and behind it, each along its tangent
            const bx = x + px * b, bz = z + pz * b, tx = -pz, tz = px;
            add('bench', bx, bz, Math.atan2(-tz, tx), .45, [[tx * h, tz * h, .45], [-tx * h, -tz * h, .45]]);
          }
          for (const [cx, cz] of [[R.x0, R.z0], [R.x1, R.z0], [R.x0, R.z1], [R.x1, R.z1]]) add('candles', cx + Math.sign(r.x - cx) * 1.3, cz + Math.sign(r.z - cz) * 1.3, rng() * 6, 0);
        }
      } else if (kind === 'hall') {
        const end = D - T.end; S.spot = { x: at(end, 0)[0], z: at(end, 0)[1] }; S.face = Math.atan2(-ux, -uz); S.keep.push([S.spot.x, S.spot.z, 1.8]);
        for (const t of [-1, 1]) for (let u = T.step * .75; u < end - 1; u += T.step) { const [x, z] = at(u, t * T.side); add('pillar', x, z, 0, .65); }
        for (const t of [-1, 1]) { const [x, z] = at(end + .6, t * T.flank); add('brazier', x, z, rng() * 6, .35); }
        for (const v of [vMin + 1.75, vMax - 1.75]) { const [x, z] = at(D / 2, v); add('coffin', x, z, vx ? 0 : Math.PI / 2, .8, vx ? [[0, -.6, .8], [0, .6, .8]] : [[-.6, 0, .8], [.6, 0, .8]]); }
      }
    }
    delete S.keep; r.set = S;
  }
}
export const routePlace = (L, r) => (r.kind === 'side' ? L.rooms[r.parent].rank : r.rank) / (L.route.length - 1);

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

// The cells of a door's gap: the corridor cells just outside room r's wall line (what a fog gate fills, game/gate.js).
export function doorCells(L, r, d) {
  const along = d.side === 'n' || d.side === 's', line = d.side === 'e' ? r.i0 + r.w : d.side === 'w' ? r.i0 - 1 : d.side === 's' ? r.j0 + r.h : r.j0 - 1;
  const a = cellOf(L, (along ? d.x : d.z) - d.w / 2 + .01), b = cellOf(L, (along ? d.x : d.z) + d.w / 2 - .01), out = [];
  for (let k = a; k <= b; k++) out.push(along ? [k, line] : [line, k]);
  return out;
}

// Dungeon layout generation and pathfinding (pure grid logic, no rendering).
import { randi, pick } from '../core/util.js';

export const MAP = 46;
export const idx = (x, y) => y * MAP + x;
// grid: 1 = walkable. roomOf: room index per cell or -1. revealed: fog of war.
export const M = { grid: null, roomOf: null, rooms: [], revealed: null, pillars: [] };
export const walk = (x, y) => x >= 0 && y >= 0 && x < MAP && y < MAP && M.grid[idx(x, y)] === 1;

export function genLayout() {
  for (;;) {
    M.grid = new Uint8Array(MAP * MAP); M.roomOf = new Int16Array(MAP * MAP).fill(-1); M.rooms = [];
    const { grid, roomOf, rooms } = M;
    for (let t = 0; t < 500 && rooms.length < 10; t++) {
      const w = randi(5, 9), h = randi(5, 8), x = randi(1, MAP - w - 2), y = randi(1, MAP - h - 2);
      if (rooms.some(r => x < r.x + r.w + 3 && x + w + 3 > r.x && y < r.y + r.h + 3 && y + h + 3 > r.y)) continue;
      rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
    }
    if (rooms.length < 8) continue;
    rooms.forEach((r, i) => { for (let yy = r.y; yy < r.y + r.h; yy++) for (let xx = r.x; xx < r.x + r.w; xx++) { grid[idx(xx, yy)] = 1; roomOf[idx(xx, yy)] = i; } });
    // connect with a minimum spanning tree + a couple of loops
    const inT = [0], out = rooms.map((_, i) => i).slice(1);
    while (out.length) {
      let best = null;
      for (const a of inT) for (const b of out) { const d = Math.abs(rooms[a].cx - rooms[b].cx) + Math.abs(rooms[a].cy - rooms[b].cy); if (!best || d < best[2]) best = [a, b, d]; }
      carve(rooms[best[0]], rooms[best[1]]); inT.push(best[1]); out.splice(out.indexOf(best[1]), 1);
    }
    for (let k = 0; k < 2; k++) { const a = pick(rooms), b = pick(rooms); if (a !== b) carve(a, b); }
    M.pillars = [];
    for (const r of rooms) if (r.w >= 7 && r.h >= 7) for (const [px, py] of [[r.x + 1, r.y + 1], [r.x + r.w - 2, r.y + 1], [r.x + 1, r.y + r.h - 2], [r.x + r.w - 2, r.y + r.h - 2]]) {
      if (px === r.cx || py === r.cy || px === r.cx - 1) continue;
      grid[idx(px, py)] = 0; roomOf[idx(px, py)] = -1; M.pillars.push([px, py]);
    }
    const d0 = bfs(rooms[0].cx, rooms[0].cy);
    if (rooms.some(r => d0[idx(r.cx, r.cy)] < 0 || d0[idx(r.cx - 1, r.cy)] < 0)) continue;
    return;
  }
}
function carve(a, b) {
  let x = a.cx, y = a.cy;
  const hFirst = Math.random() < .5;
  const set = () => { M.grid[idx(x, y)] = 1; };
  if (hFirst) { while (x !== b.cx) { x += Math.sign(b.cx - x); set(); } while (y !== b.cy) { y += Math.sign(b.cy - y); set(); } }
  else { while (y !== b.cy) { y += Math.sign(b.cy - y); set(); } while (x !== b.cx) { x += Math.sign(b.cx - x); set(); } }
}
export function bfs(sx, sy) {
  const d = new Int32Array(MAP * MAP).fill(-1), q = [idx(sx, sy)]; d[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], cx = c % MAP, cy = c / MAP | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (walk(nx, ny) && d[idx(nx, ny)] < 0) { d[idx(nx, ny)] = d[c] + 1; q.push(idx(nx, ny)); } }
  }
  return d;
}

const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
export function astar(sx, sy, tx, ty) {
  if (!walk(tx, ty) || !walk(sx, sy)) return null;
  const N = MAP * MAP, g = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const s = idx(sx, sy), t = idx(tx, ty), open = [[0, s]]; g[s] = 0;
  while (open.length) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const c = open[bi][1]; open[bi] = open[open.length - 1]; open.pop();
    if (closed[c]) continue; closed[c] = 1; if (c === t) break;
    const cx = c % MAP, cy = c / MAP | 0;
    for (const [dx, dy, cost] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (!walk(nx, ny) || (dx && dy && (!walk(cx + dx, cy) || !walk(cx, cy + dy)))) continue;
      const n = idx(nx, ny), ng = g[c] + cost;
      if (ng < g[n]) { g[n] = ng; came[n] = c; open.push([ng + Math.hypot(tx - nx, ty - ny), n]); }
    }
  }
  if (s !== t && came[t] < 0) return null;
  const path = []; for (let c = t; c !== s; c = came[c]) path.push([c % MAP, c / MAP | 0]);
  return path.reverse();
}

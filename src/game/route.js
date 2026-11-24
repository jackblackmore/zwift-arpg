// Route choice at junctions (Zwift junctions, Hades doors): when the autopilot has cleared a room and picked up its loot, and the
// room has more than one way on, it stops and offers each way (Onward toward the guardian, a Side room, or Back to a room passed
// earlier). A D-pad tap toward an exit picks it. With no pick, after `wait` s it takes the default and the choice stays open for
// `grace` s more while it walks. Tuning in data/ride.js RIDE.junction; design notes "Route choice".
// The default clears everything (side rooms, then back, then onward), so a full clear keeps you on par; picking Onward is how you skip.
import { G, P } from '../core/state.js';
import { RIDE } from '../data/ride.js';
import { ctl } from '../input/input.js';
import { roomAt } from '../world/gen.js';
import { dist } from '../core/util.js';
import { SFX } from '../core/audio.js';

const ORDER = { side: 0, back: 1, onward: 2 };
export const LABEL = { side: 'Side room', back: 'Back', onward: 'Onward', boss: 'Guardian' };

// Fresh route state for a new map.
export function resetRoute() { G.jn = null; G.goal = null; G.skip = new Set(); G.jnDone = new Set(); }

function adj(L) {
  if (L._adj) return L._adj;
  const m = new Map(L.rooms.map(r => [r.id, []]));
  for (const e of L.edges) { m.get(e.a).push({ to: e.b, e }); m.get(e.b).push({ to: e.a, e }); }
  return L._adj = m;
}
const segD = (x, z, a, b) => { const dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2)); return Math.hypot(x - a.x - dx * t, z - a.z - dz * t); };
// Which room a pack belongs to: the room it stands in, or for a corridor pack the far (higher-rank) end of its corridor.
function packRoom(L, p) {
  if (p.room !== undefined) return p.room;
  const r = roomAt(L, p.x, p.z); if (r) return p.room = r.id;
  let best = null, bd = 1e9;
  for (const e of L.edges) for (let i = 1; i < e.pts.length; i++) { const d = segD(p.x, p.z, e.pts[i - 1], e.pts[i]); if (d < bd) { bd = d; best = e; } }
  const a = L.rooms[best.a], b = L.rooms[best.b]; return p.room = (a.rank > b.rank ? a : b).id;
}
const packLeft = p => !p.spawned || p.list.some(e => !e.deathT);
const bossLeft = () => !(G.bossSpec && G.bossSpec.e && G.bossSpec.e.deathT);
// Does room `id` still hold something to fight?
function pending(L, id) {
  if (L.rooms[id].kind === 'boss' && bossLeft()) return true;
  return G.packs.some(p => packLeft(p) && packRoom(L, p) === id);
}
// Rooms reachable from `start` without passing through `from`.
function subtree(L, start, from) {
  const seen = new Set([start]), q = [start];
  while (q.length) { const r = q.shift(); for (const { to } of adj(L).get(r)) if (to !== from && !seen.has(to)) { seen.add(to); q.push(to); } }
  return seen;
}
const anyPending = (L, rooms, skip) => [...rooms].some(r => pending(L, r) && !(skip && G.skip.has(r)));

// The ways on from room C that still lead somewhere worth going.
export function options(L, C) {
  const out = [];
  for (const { to, e } of adj(L).get(C.id)) {
    const rooms = subtree(L, to, C.id); if (!anyPending(L, rooms)) continue;
    const kind = [...rooms].some(r => L.rooms[r].kind === 'boss') ? 'onward' : L.rooms[to].kind === 'side' ? 'side' : 'back';
    // The doorway: the real gap in this room's wall that this corridor leaves by (world/gen.js room.doors).
    const door = C.doors.find(d => d.edge === L.edges.indexOf(e));
    out.push({ to, kind, rooms, label: L.rooms[to].kind === 'boss' ? LABEL.boss : LABEL[kind], door });
  }
  return out.sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
}
// The default: clear everything, nearest dead ends first, skipping what you chose to skip; else onward.
const defaultPick = (L, opts) => { const i = opts.findIndex(o => o.kind !== 'onward' && anyPending(L, o.rooms, true)); return i >= 0 ? i : opts.findIndex(o => o.kind === 'onward'); };

function choose(L, i, picked) {
  const J = G.jn, o = J.opts[i]; if (!o) return;
  J.sel = i; G.goal = { to: o.to, rooms: o.rooms };
  // Picking Onward by hand skips the other ways for the rest of the map (they stay visitable by picking them later).
  if (picked && o.kind === 'onward') for (const x of J.opts) if (x !== o) for (const r of x.rooms) if (!o.rooms.has(r)) G.skip.add(r);
  if (picked) { J.picked = true; SFX.cue('parry'); }
}
// A D-pad tap: the exit whose direction from you best matches it.
function tapPick(L) {
  const t = ctl.tapDir; ctl.tapDir = null; if (!t || !G.jn) return;
  let best = -1, bs = -2;
  G.jn.opts.forEach((o, i) => { const dx = o.door.x - P.x, dz = o.door.z - P.z, l = Math.hypot(dx, dz) || 1, s = (dx * t[0] + dz * t[1]) / l; if (s > bs) { bs = s; best = i; } });
  if (best >= 0) { choose(L, best, true); if (G.jn.mode === 'wait') { G.jn.mode = 'go'; G.jn.t = RIDE.junction.grace; } }
}
// Nearest leftover pack in a set of rooms (lowest route rank first), or the guardian.
function targetIn(L, rooms, skip) {
  let best = null, br = 1e9, bd = 1e9;
  for (const p of G.packs) {
    if (!packLeft(p)) continue; const r = packRoom(L, p); if (!rooms.has(r) || (skip && G.skip.has(r))) continue;
    const d = dist(p.x, p.z, P.x, P.z), k = p.rank || 0; if (k < br || (k === br && d < bd)) { br = k; bd = d; best = p; }
  }
  if (best) return best;
  if (bossLeft() && [...rooms].some(r => L.rooms[r].kind === 'boss' && !(skip && G.skip.has(r)))) return G.bossSpot;
  return null;
}

// Called by the autopilot when nothing is left to fight or pick up nearby. Returns 'wait' (stand still: choosing),
// a point to walk to, or null (nothing left: the autopilot falls back to its own route).
export function routeTarget(dt) {
  const L = G.layout; if (!L) return null;
  const J = RIDE.junction;
  if (G.jn) {
    G.jn.t -= dt; tapPick(L);
    if (G.jn.mode === 'wait') { if (G.jn.t > 0) return 'wait'; choose(L, G.jn.sel, false); G.jn.mode = 'go'; G.jn.t = J.grace; }
    else if (G.jn.t <= 0) G.jn = null;
  } else ctl.tapDir = null;
  const C = roomAt(L, P.x, P.z);
  if (C && !G.jn) {
    const here = targetIn(L, new Set([C.id]));
    if (here) return here;
    if (!G.jnDone.has(C.id)) {
      G.jnDone.add(C.id);
      const opts = options(L, C);
      if (opts.length >= 2) { G.jn = { room: C.id, opts, sel: Math.max(0, defaultPick(L, opts)), t: J.wait, mode: 'wait', picked: false }; SFX.cue('parry'); return 'wait'; }
      if (opts.length === 1) G.goal = { to: opts[0].to, rooms: opts[0].rooms };
    }
  }
  if (G.goal) { const t = targetIn(L, G.goal.rooms); if (t) return t; G.goal = null; }
  return targetIn(L, new Set(L.rooms.map(r => r.id)), true) || targetIn(L, new Set(L.rooms.map(r => r.id)));
}

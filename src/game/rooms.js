// Room roles in play (data/dungeon.js ROLES; world/gen.js assigns them by the rhythm template): treasure chests and the rest
// room's flame. Elite rooms are a pack (game/maps.js placePacks, game/enemies.js makePack) behind a fog gate (game/gate.js);
// resetRoles puts a living elite back when you die. Numbers: CHEST and DROP.chest (data/items.js), REST (data/dungeon.js).
import * as T from 'three';
import { G, P, S } from '../core/state.js';
import { CHEST, DROP } from '../data/items.js';
import { REST } from '../data/dungeon.js';
import { SK } from '../data/skills.js';
import { DUNGEON } from '../data/graphics.js';
import { dun } from '../world/dungeon.js';
import { wallHit, lineDist, roomAt } from '../world/gen.js';
import { blocked } from '../world/map.js';
import { GB, GCY, glowSprite, decal } from '../render/assets.js';
import { burst, floatT, banner } from '../render/fx.js';
import { SFX } from '../core/audio.js';
import { dropItem } from './items.js';
import { randi, dist } from '../core/util.js';

// A dungeon piece as its own (not instanced) mesh, so it can move: sits its lowest point on the floor.
function piece(name, s) {
  const t = dun.tpl[name], g = new T.Group(); if (!t) return g;
  const inner = new T.Group(); for (const p of t.parts) { const m = new T.Mesh(p.geo, p.mat); m.applyMatrix4(p.m); m.castShadow = true; m.receiveShadow = true; inner.add(m); }
  inner.scale.setScalar(s); inner.position.y = -t.minY * s; g.add(inner); return g;
}
const packLeft = p => p && G.packs.includes(p) && (!p.spawned || p.list.some(e => !e.deathT)); // a guard pack that's gone from the map (tests) doesn't count

// A spot in room r: `wall` wants one against a wall (a chest), otherwise in the open; always clear of props and the corridor lines.
function spotIn(L, r, rad, wall) {
  const X = k => -L.half + k * L.cell;
  for (let t = 0; t < 80; t++) {
    const x = X(r.i0 + .5 + Math.random() * (r.w - 1)), z = X(r.j0 + .5 + Math.random() * (r.h - 1));
    if (roomAt(L, x, z) !== r || blocked(x, z, rad) || lineDist(L, x, z) < rad + 1.6) continue;
    if (wall && t < 60 && (!wallHit(L, x, z, rad + 1.3) || wallHit(L, x, z, rad + .5))) continue;
    return [x, z];
  }
  return null;
}

// Called by newMap after the map is built, before the packs (a chest's guard stands by it).
export function initRooms() {
  G.chests = []; G.rest = null; const L = G.layout; if (!L) return;
  for (const r of L.rooms) {
    if (r.role === 'treasure') {
      const sp = r.set && r.set.spot, lift = sp ? r.set.lift || 0 : 0; // a vault's plinth (world/gen.js set pieces)
      const [x, z] = sp ? [sp.x, sp.z] : spotIn(L, r, .8, true) || [r.x + L.cell, r.z];
      const g = dun.ready ? piece('chest', DUNGEON.scale * 1.25) : (() => { const b = new T.Group(), m = new T.Mesh(GB, new T.MeshLambertMaterial({ color: 0x8a5a2a })); m.scale.set(1.1, .7, .7); m.position.y = .35; b.add(m); return b; })();
      g.rotation.y = Math.atan2(r.x - x, r.z - z); g.position.set(x, lift, z);
      const glow = glowSprite(0xffd23f, 2.6); glow.material = glow.material.clone(); glow.position.set(x, 1 + lift, z); const dc = decal(0xffc040, 3.2); dc.position.set(x, .05 + lift, z);
      G.world.add(g, glow, dc); G.obst.push({ x, z, r: .7 });
      const fl = Math.hypot(r.x - x, r.z - z) || 1, front = lift ? 1.7 : 0; // loot flies from in front of a plinth, not out of it
      G.chests.push({ room: r.id, x, z, dropX: x + (r.x - x) / fl * front, dropZ: z + (r.z - z) / fl * front, g, glow, dc, open: false, guarded: Math.random() < CHEST.guarded, guard: null, t: 0 });
    }
    if (r.role === 'rest' && !G.rest) {
      const sp = r.set && r.set.spot, [x, z] = sp ? [sp.x, sp.z] : spotIn(L, r, 1.6, false) || [r.x + L.cell * .8, r.z + L.cell * .8], s = DUNGEON.scale, g = new T.Group(); // a rest chapel's flame (world/gen.js set pieces)
      if (dun.ready) {
        const col = piece('column', s), cand = piece('candle_triple', s * DUNGEON.torch); cand.position.y = 1.4 * s; g.add(col, cand);
        for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, c = piece('candle_lit', s); c.position.set(Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5); g.add(c); }
      } else { const m = new T.Mesh(GCY, new T.MeshLambertMaterial({ color: 0x6a5a58 })); m.scale.set(.35, 1.4, .35); m.position.y = .7; g.add(m); }
      const glow = glowSprite(0xffb060, 2.4); glow.material = glow.material.clone(); glow.position.y = 1.4 * s + 1; g.add(glow);
      const calm = decal(0x5ad0c0, 7.5), warm = decal(0xff9a40, 4.5); calm.position.y = .04; warm.position.y = .06; g.add(calm, warm);
      g.position.set(x, 0, z); G.world.add(g); G.obst.push({ x, z, r: .45 }); G.torches.push({ f: glow, x, z, s: 2.4 });
      G.rest = { room: r.id, x, z, g, glow, calm, used: false };
    }
  }
}

function openChest(c) {
  c.open = true; c.t = 0; const D = DROP.chest, n = randi(D.n[0], D.n[1]);
  for (let i = 0; i < n; i++) G.queue.push({ k: 'later', t: .25 + i * .12, fn: () => dropItem(c.dropX, c.dropZ, D.boost) });
  burst(c.x, 1, c.z, 0xffd23f, 40, 5); floatT(c.x, 2.4, c.z, 'TREASURE', '#ffd23f', 18, 1.4); SFX.loot(2);
  if (dun.ready) { const coins = piece('coin_stack_small', DUNGEON.scale * 1.4); coins.position.set(c.dropX + .9, 0, c.dropZ + .5); G.world.add(coins); }
}

// Every tick: open chests you reach (once their guards are dead), rest at the flame.
export function updRooms(dt) {
  for (const c of G.chests) {
    c.t += dt;
    if (c.open) { const k = Math.max(0, 1 - c.t * 1.5); c.glow.material.opacity = k * .8; c.dc.visible = k > 0; continue; }
    c.glow.material.opacity = .55 + .25 * Math.sin(G.gt * 2.6);
    if (P.dead > 0 || dist(P.x, P.z, c.x, c.z) > CHEST.reach + .7) continue;
    if (packLeft(c.guard)) { if (c.t > 2) { c.t = 0; floatT(c.x, 2.2, c.z, 'GUARDED', '#ff9a6a', 14, 1); } continue; }
    openChest(c);
  }
  const R = G.rest, L = G.layout; if (!R || !L) return;
  R.glow.material.opacity = R.used ? .25 + .05 * Math.sin(G.gt * 3) : .8 + .15 * Math.sin(G.gt * 2.1);
  if (R.used || P.dead > 0) return;
  const r = roomAt(L, P.x, P.z); if (!r || r.id !== R.room) return;
  if (G.enemies.some(e => !e.deathT && e.awake && dist(e.x, e.z, P.x, P.z) < REST.calm)) return;
  if (P.life >= S.maxLife - .5 && P.flask >= SK.flask.max && !(P.posture > 0)) return; // nothing to mend: it waits for when you need it
  R.used = true; P.life = S.maxLife; P.flask = SK.flask.max; P.posture = 0;
  burst(R.x, 1.2, R.z, 0x5ad0c0, 40, 4); burst(P.x, 1, P.z, 0xffd090, 24, 3); floatT(P.x, 2.6, P.z, 'RESTED', '#5ad0c0', 18, 1.6); SFX.loot(1);
  banner('A QUIET FLAME', '#5ad0c0', 'Life and flasks restored · it burns once');
}

// You died: a living elite goes back to its spot, healed and asleep (its fog gate reopens, game/gate.js).
export function resetRoles() {
  for (const e of G.enemies) if (!e.deathT && e.elite) { Object.assign(e, { hp: e.maxHp, awake: false, x: e.sx, z: e.sz, vx: 0, vz: 0, stag: 0, stun: 0, windup: 0, heavy: false }); if (e.pack) e.pack.awake = false; }
}

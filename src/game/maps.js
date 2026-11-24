// Map lifecycle: new map per tier, the boss portal, clearing and respawning.
import { resetRoute } from './route.js';
import * as T from 'three';
import { G, P, S } from '../core/state.js';
import { COMBAT } from '../data/balance.js';
import { SK } from '../data/skills.js';
import { dist, $ } from '../core/util.js';
import { scene } from '../render/scene.js';
import { glowSprite, decal } from '../render/assets.js';
import { banner } from '../render/fx.js';
import { buildMap, blocked } from '../world/map.js';
import { PACK_SPACING } from '../data/dungeon.js';
import { makePack } from './enemies.js';
import { packCount, tierHp } from './formulas.js';
import { refreshShrine, readySlots } from './gems.js';
import { CLEAR } from './casts.js';
import { initGate } from './gate.js';
import { initRooms, resetRoles } from './rooms.js';
import { roomAt } from '../world/gen.js';

export function makePortal(x, z) {
  const g = new T.Group();
  const tor = new T.Mesh(new T.TorusGeometry(1.1, .12, 8, 36), new T.MeshBasicMaterial({ color: 0xb06bff })); tor.position.y = 1.3; g.add(tor);
  const inner = glowSprite(0x9a5aff, 2.6); inner.position.y = 1.3; g.add(inner); g.add(decal(0xb06bff, 5));
  g.position.set(x, 0, z); scene.add(g); G.portal = { x, z, g, tor };
}

export function clearMap() {
  for (const e of G.enemies) { scene.remove(e.model.g); e.model.mats.forEach(m => m.dispose()); }
  G.enemies = [];
  [...G.eproj, ...G.patches, ...G.ground].forEach(o => scene.remove(o.g));
  G.eproj = []; G.patches = []; G.ground = [];
  for (const f of CLEAR) f();
  G.effects.forEach(f => scene.remove(f.mesh)); G.effects = []; G.queue = []; G.floats = [];
  if (G.portal) { scene.remove(G.portal.g); G.portal = null; }
  if (G.shrine) { scene.remove(G.shrine.g); G.shrine = null; }
  G.gate = null; G.gates = []; G.chests = []; G.rest = null; // their meshes live in G.world, rebuilt with the map
  $('bossbar').style.display = 'none';
}

// Packs go in combat rooms (one each first, then more in the big ones) and at chokepoints (corridor midpoints on the way), after
// the room roles' own (data/dungeon.js ROLES): an elite pack in each elite room, and a guard pack by some treasure chests (game/rooms.js
// places the chests). Rest rooms, the entrance and the guardian's arena get none, and no chokepoint pack sits next to a rest room.
// Each pack carries `rank`, its place along the route (side rooms count as their parent + .5), for the autopilot; the role packs
// also carry `room`.
function placePacks(n) {
  const L = G.layout, PS = PACK_SPACING, { start, boss } = L;
  const ok = (x, z, gap) => dist(x, z, start.x, start.z) >= PS.fromStart && dist(x, z, boss.x, boss.z) >= PS.fromBoss && !blocked(x, z, 1.5) && !G.packs.some(p => dist(p.x, p.z, x, z) < gap);
  const add = (x, z, rank, o) => { const p = makePack(x, z, o); p.rank = rank; G.packs.push(p); return p; };
  const spotIn = (r, gap, near) => { for (let k = 0; k < 60; k++) { const x = near && k < 20 ? near.x + (Math.random() - .5) * 5 : -L.half + (r.i0 + 1 + Math.random() * (r.w - 2)) * L.cell, z = near && k < 20 ? near.z + (Math.random() - .5) * 5 : -L.half + (r.j0 + 1 + Math.random() * (r.h - 2)) * L.cell; if (ok(x, z, k < 30 ? gap : 0) && roomAt(L, x, z) === r) return [x, z]; } return [r.x, r.z]; }; // never on the chest itself
  for (const r of L.rooms) {
    if (r.role === 'elite') { const sp = r.set && r.set.spot, [x, z] = sp && ok(sp.x, sp.z, PS.relaxed) ? [sp.x, sp.z] : spotIn(r, PS.relaxed); add(x, z, r.rank, { elite: true }).room = r.id; } // an elite hall's far end (world/gen.js set pieces)
    const c = G.chests.find(c => c.room === r.id);
    if (c && c.guarded) { const [x, z] = spotIn(r, PS.relaxed, c); const p = add(x, z, r.rank); p.room = r.id; c.guard = p; }
  }
  const rooms = L.rooms.filter(r => r.role === 'combat').sort(() => Math.random() - .5);
  const inRoom = (r, gap) => { for (let k = 0; k < 30; k++) { const x = -L.half + (r.i0 + 1 + Math.random() * (r.w - 2)) * L.cell, z = -L.half + (r.j0 + 1 + Math.random() * (r.h - 2)) * L.cell; if (ok(x, z, gap)) return add(x, z, r.rank); } };
  for (const r of rooms) if (G.packs.length < n) inRoom(r, PS.room);
  const calm = e => L.rooms[e.a].role !== 'rest' && L.rooms[e.b].role !== 'rest';
  for (const e of [...L.edges].sort(() => Math.random() - .5).slice(0, Math.ceil(n / 6))) if (G.packs.length < n && calm(e) && ok(e.mid.x, e.mid.z, PS.relaxed)) add(e.mid.x, e.mid.z, e.rank);
  const big = [...rooms].sort((a, b) => b.w * b.h - a.w * a.h);
  for (let pass = 0; pass < 6 && G.packs.length < n; pass++) for (const r of big) if (G.packs.length < n) inRoom(r, pass < 2 ? PS.room : PS.relaxed);
}

export function newMap(t) {
  G.tier = t; clearMap(); buildMap(); G.mapKills = 0; G.mapTotal = 0; G.packs = []; resetRoute();
  initRooms(); placePacks(packCount(t)); initGate();
  G.bossSpec = { spawned: false }; G.mapTotal++;
  P.x = G.start.x; P.z = G.start.z; P.dead = 0; P.life = S.maxLife; P.surge = S.surgeMax; P.spent = false; P.flask = SK.flask.max; readySlots();
  refreshShrine();
  banner('MAP ' + t, '#c8a25a', t === 1 ? 'The Ashen Crypt · the boss waits in the far corner' : `Monsters are ${Math.round((tierHp(t) - 1) * 100)}% tougher · better loot`);
}

// After death: back to the entrance at full health. Monsters keep their damage; the boss resets.
export function respawn() {
  P.x = G.start.x; P.z = G.start.z; P.life = S.maxLife; P.surge = S.surgeMax; P.spent = false; P.flask = SK.flask.max; P.invuln = COMBAT.respawnInvuln; Object.assign(P, { blocking: false, parryT: 0, posture: 0, broken: 0, riposteT: 0, rollT: 0, apPause: 0 });
  G.eproj.forEach(o => scene.remove(o.g)); G.eproj = [];
  resetRoles(); // an elite that was fighting you goes back to its spot, healed (game/rooms.js)
  for (const e of G.enemies) if (!e.deathT && e.type === 'boss') { e.hp = e.maxHp; e.awake = false; e.x = e.sx; e.z = e.sz; e.cast = null; e.charging = null; e.stag = 0; e.stun = 0; e.rot = 0; e.phase2 = false; $('bossbar').style.display = 'none'; }
}

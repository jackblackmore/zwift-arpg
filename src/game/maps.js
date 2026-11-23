// Map lifecycle: new map per tier, the boss portal, clearing and respawning.
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

export function makePortal(x, z) {
  const g = new T.Group();
  const tor = new T.Mesh(new T.TorusGeometry(1.1, .12, 8, 36), new T.MeshBasicMaterial({ color: 0xb06bff })); tor.position.y = 1.3; g.add(tor);
  const inner = glowSprite(0x9a5aff, 2.6); inner.position.y = 1.3; g.add(inner); g.add(decal(0xb06bff, 5));
  g.position.set(x, 0, z); scene.add(g); G.portal = { x, z, g, tor };
}

export function clearMap() {
  for (const e of G.enemies) { scene.remove(e.model.g); e.model.mats.forEach(m => m.dispose()); }
  G.enemies = [];
  [...G.proj, ...G.eproj, ...G.patches, ...G.ground].forEach(o => scene.remove(o.g));
  G.proj = []; G.eproj = []; G.patches = []; G.ground = [];
  for (const f of CLEAR) f();
  G.effects.forEach(f => scene.remove(f.mesh)); G.effects = []; G.queue = []; G.floats = [];
  if (G.portal) { scene.remove(G.portal.g); G.portal = null; }
  if (G.shrine) { scene.remove(G.shrine.g); G.shrine = null; }
  $('bossbar').style.display = 'none';
}

// Packs go in rooms (one each first, then more in the big ones) and at chokepoints (corridor midpoints on the way).
// Each pack carries `rank`, its place along the route (side rooms count as their parent + .5), for the autopilot.
function placePacks(n) {
  const L = G.layout, PS = PACK_SPACING, { start, boss } = L;
  const ok = (x, z, gap) => dist(x, z, start.x, start.z) >= PS.fromStart && dist(x, z, boss.x, boss.z) >= PS.fromBoss && !blocked(x, z, 1.5) && !G.packs.some(p => dist(p.x, p.z, x, z) < gap);
  const add = (x, z, rank) => { const p = makePack(x, z); p.rank = rank; G.packs.push(p); return p; };
  const rooms = L.rooms.filter(r => r.kind !== 'start' && r.kind !== 'boss').sort(() => Math.random() - .5);
  const inRoom = (r, gap) => { for (let k = 0; k < 30; k++) { const x = -L.half + (r.i0 + 1 + Math.random() * (r.w - 2)) * L.cell, z = -L.half + (r.j0 + 1 + Math.random() * (r.h - 2)) * L.cell; if (ok(x, z, gap)) return add(x, z, r.rank); } };
  for (const r of rooms) if (G.packs.length < n) inRoom(r, PS.room);
  for (const e of [...L.edges].sort(() => Math.random() - .5).slice(0, Math.ceil(n / 6))) if (G.packs.length < n && ok(e.mid.x, e.mid.z, PS.relaxed)) add(e.mid.x, e.mid.z, e.rank);
  const big = [...rooms].sort((a, b) => b.w * b.h - a.w * a.h);
  for (let pass = 0; pass < 6 && G.packs.length < n; pass++) for (const r of big) if (G.packs.length < n) inRoom(r, pass < 2 ? PS.room : PS.relaxed);
}

export function newMap(t) {
  G.tier = t; clearMap(); buildMap(); G.mapKills = 0; G.mapTotal = 0; G.packs = [];
  placePacks(packCount(t));
  G.bossSpec = { spawned: false }; G.mapTotal++;
  P.x = G.start.x; P.z = G.start.z; P.dead = 0; P.life = S.maxLife; P.mana = S.maxMana; P.flask = SK.flask.max; readySlots();
  refreshShrine();
  banner('MAP ' + t, '#c8a25a', t === 1 ? 'The Ashen Crypt · the boss waits in the far corner' : `Monsters are ${Math.round((tierHp(t) - 1) * 100)}% tougher · better loot`);
}

// After death: back to the entrance at full health. Monsters keep their damage; the boss resets.
export function respawn() {
  P.x = G.start.x; P.z = G.start.z; P.life = S.maxLife; P.mana = S.maxMana; P.flask = SK.flask.max; P.invuln = COMBAT.respawnInvuln;
  G.eproj.forEach(o => scene.remove(o.g)); G.eproj = [];
  for (const e of G.enemies) if (!e.deathT && e.type === 'boss') { e.hp = e.maxHp; e.awake = false; e.x = e.sx; e.z = e.sz; e.cast = null; e.phase2 = false; $('bossbar').style.display = 'none'; }
}

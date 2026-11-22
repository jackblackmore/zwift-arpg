// Map lifecycle: new map per tier, the boss portal, clearing and respawning.
import * as T from 'three';
import { G, P, S } from '../core/state.js';
import { SK } from '../data/skills.js';
import { rand, dist, $ } from '../core/util.js';
import { scene } from '../render/scene.js';
import { glowSprite, decal } from '../render/assets.js';
import { banner } from '../render/fx.js';
import { HALF, buildMap, blocked } from '../world/map.js';
import { makePack } from './enemies.js';
import { packCount, tierHp } from './formulas.js';
import { refreshShrine, readySlots } from './gems.js';

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
  G.effects.forEach(f => scene.remove(f.mesh)); G.effects = []; G.queue = []; G.floats = [];
  if (G.portal) { scene.remove(G.portal.g); G.portal = null; }
  if (G.shrine) { scene.remove(G.shrine.g); G.shrine = null; }
  $('bossbar').style.display = 'none';
}

export function newMap(t) {
  G.tier = t; clearMap(); buildMap(); G.mapKills = 0; G.mapTotal = 0; G.packs = [];
  const n = packCount(t);
  for (let k = 0; k < 800 && G.packs.length < n; k++) {
    const x = rand(-HALF + 3, HALF - 3), z = rand(-HALF + 3, HALF - 3);
    if (dist(x, z, G.start.x, G.start.z) < 13 || dist(x, z, G.bossSpot.x, G.bossSpot.z) < 9 || blocked(x, z, 1.5) || G.packs.some(p => dist(p.x, p.z, x, z) < 7)) continue;
    G.packs.push(makePack(x, z));
  }
  G.bossSpec = { spawned: false }; G.mapTotal++;
  P.x = G.start.x; P.z = G.start.z; P.dead = 0; P.life = S.maxLife; P.mana = S.maxMana; P.flask = SK.flask.max; readySlots();
  refreshShrine();
  banner('MAP ' + t, '#c8a25a', t === 1 ? 'The Ashen Crypt · the boss waits in the far corner' : `Monsters are ${Math.round((tierHp(t) - 1) * 100)}% tougher · better loot`);
}

// After death: back to the entrance at full health. Monsters keep their damage; the boss resets.
export function respawn() {
  P.x = G.start.x; P.z = G.start.z; P.life = S.maxLife; P.mana = S.maxMana; P.flask = SK.flask.max; P.invuln = 2;
  G.eproj.forEach(o => scene.remove(o.g)); G.eproj = [];
  for (const e of G.enemies) if (!e.deathT && e.type === 'boss') { e.hp = e.maxHp; e.awake = false; e.x = e.sx; e.z = e.sz; e.cast = null; e.phase2 = false; $('bossbar').style.display = 'none'; }
}

// Shrines: four, once per character, only in the Crypt (data/shrines.js). At the start of every level the first pending shrine whose
// character level is met stands at the entrance, a few units along the route (a pedestal, a beam and a glow in G.shrines). Walking up to
// it opens the choice (ui/shrine.js registers itself in shrineUI so game code never imports UI); picking grants the gem, equips it into
// the shrine's slot when that is empty, and records P.shrines[slot] (saved). A shrine whose level is reached mid-level waits for the next entrance.
import * as T from 'three';
import { G, P } from '../core/state.js';
import { SHRINES, SHRINE_ORDER, SHRINE_AT, FLEX_DROP } from '../data/shrines.js';
import { GEMS } from '../data/gems.js';
import { LEVEL } from '../data/levels.js';
import { GCY, GB, GRING, glowSprite, decal } from '../render/assets.js';
import { scene } from '../render/scene.js';
import { banner, ringFx, flashFx, burst } from '../render/fx.js';
import { SFX } from '../core/audio.js';
import { blocked } from '../world/map.js';
import { dist } from '../core/util.js';
import { dbg } from '../core/dbg.js';
import { levelHooks } from './level.js';
import { addTicker } from './tick.js';
import { addGem, equipGem, slotGem, slotUnlocked } from './gems.js';
import { save } from './save.js';

export const shrineUI = { open: null, close: null }; // ui/shrine.js fills these in

const pending = () => SHRINE_ORDER.filter(k => !P.shrines[k] && P.lvl >= SHRINES[k].lvl);
export const activeShrine = () => G.shrines.find(s => !s.taken) || null;
const hex = c => '#' + c.toString(16).padStart(6, '0');
export const shrineColor = s => hex(SHRINES[s.slot].color);
// The level a Flex shrine gem starts at: the Main gem's level minus FLEX_DROP, never below 1.
export const flexStart = () => { const m = slotGem('main'); return Math.max(1, (m ? m.lvl : 1) - FLEX_DROP); };

// A glowing altar: stone pedestal, a floating orb, a beam of light and a ring on the floor, all in the shrine's colour.
function build(def, x, z) {
  const g = new T.Group(); g.position.set(x, 0, z);
  const stone = new T.MeshLambertMaterial({ color: 0x4a4048 }), glow = new T.MeshBasicMaterial({ color: def.color, transparent: true, opacity: .24, blending: T.AdditiveBlending, depthWrite: false });
  const part = (geo, m, sx, sy, sz, y) => { const o = new T.Mesh(geo, m); o.scale.set(sx, sy, sz); o.position.y = y; o.castShadow = true; g.add(o); return o; };
  part(GCY, stone, 1.1, .35, 1.1, .17); part(GCY, stone, .7, .9, .7, .7); part(GB, stone, 1.3, .12, 1.3, 1.2);
  const beam = part(GCY, glow, .2, 10, .2, 5.2), orb = glowSprite(def.color, 1.1); orb.position.y = 1.9; g.add(orb);
  const ring = new T.Mesh(GRING, new T.MeshBasicMaterial({ color: def.color, transparent: true, opacity: .55, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .07; ring.scale.set(2.4, 2.4, 1); g.add(ring); g.add(decal(def.color, 4.5));
  scene.add(g); return { g, beam, orb, ring };
}

// Where a shrine stands: toward the first bend of the route from the entrance, inside the start clearing and off the rocks. A second one
// at the same entrance moves sideways (alternating sides) until it finds free ground.
function spot() {
  const R = G.level.route, a = R[0], b = R[1] || R[0], d = Math.hypot(b.x - a.x, b.z - a.z) || 1, dx = (b.x - a.x) / d, dz = (b.z - a.z) / d;
  const lim = LEVEL.start.clear - 1.2;
  for (let k = 0; k < 40; k++) {
    const side = Math.ceil(k / 2) * SHRINE_AT.gap * (k & 1 ? 1 : -1), r = SHRINE_AT.dist * (1 - .04 * (k >> 2));
    const x = G.start.x + dx * r - dz * side, z = G.start.z + dz * r + dx * side;
    if (dist(x, z, G.start.x, G.start.z) <= lim && !blocked(x, z, 1.3) && !G.shrines.some(s => !s.taken && dist(s.x, s.z, x, z) < 2.5)) return [x, z];
  }
  return [G.start.x + dx * 3, G.start.z + dz * 3];
}

// Put the next pending shrine (if any) at the entrance.
export function placeShrine() {
  if (!G.level || G.shrines.some(s => !s.taken)) return null;
  const slot = pending()[0]; if (!slot) return null;
  const def = SHRINES[slot], [x, z] = spot(), v = build(def, x, z);
  const s = { slot, x, z, ...v, offer: [...def.offer], taken: false };
  G.shrines.push(s);
  banner('A SHRINE OF POWER', hex(def.color), def.banner); SFX.loot(2); flashFx(x, 2, z, def.color, 4, .6);
  return s;
}
levelHooks.start.push(() => { placeShrine(); });

// Take gem `id` from shrine s: add it, equip it into the shrine's slot if empty (the main shrine also gives Blink for Evade), record and save.
export function pickShrine(s, id) {
  if (!s || s.taken || !s.offer.includes(id)) return false;
  const def = SHRINES[s.slot], slot = def.slot;
  const g = addGem(id, def.flex ? flexStart() : 1);
  if (!P.bar[slot] && slotUnlocked(slot)) equipGem(slot, g.uid);
  for (const [bs, bid] of Object.entries(def.bonus || {})) { const b = addGem(bid, 1); if (!P.bar[bs]) equipGem(bs, b.uid); }
  P.shrines[s.slot] = id; s.taken = true;
  ringFx(s.x, s.z, 5, def.color, .6, .1); flashFx(s.x, 2, s.z, def.color, 8, .7); burst(s.x, 1.6, s.z, def.color, 40, 6); SFX.lvl();
  banner(GEMS[id].name.toUpperCase(), GEMS[id].color, 'Gem gained · ' + (def.flex ? `starts at level ${g.lvl}` : 'level 1'));
  scene.remove(s.g); s.g = null;
  save(); if (shrineUI.close) shrineUI.close();
  placeShrine(); // a second pending shrine appears at once, beside this one
  return true;
}

// Per tick: pulse the beacons; the hero walking up to the open shrine opens the choice.
addTicker(dt => {
  for (const s of G.shrines) {
    if (s.taken || !s.g) continue;
    const k = 1 + Math.sin(G.gt * 3) * .12; s.orb.scale.set(1.1 * k, 1.1 * k, 1); s.orb.position.y = 1.9 + Math.sin(G.gt * 2) * .12; s.beam.material.opacity = .22 + Math.sin(G.gt * 2.4) * .05;
    s.ring.rotation.z += dt * .4;
    if (P.dead <= 0 && dist(P.x, P.z, s.x, s.z) < SHRINE_AT.trigger && shrineUI.open) { shrineUI.open(s); return; }
  }
});

// Debug / tests. kit() hands out a ready loadout, so it also counts every shrine as taken (it would otherwise pop up on the way).
function noShrines() {
  for (const k of SHRINE_ORDER) if (!P.shrines[k]) P.shrines[k] = 'kit';
  for (const s of G.shrines) { s.taken = true; if (s.g) { scene.remove(s.g); s.g = null; } }
  if (shrineUI.close) shrineUI.close();
}
const kit0 = dbg.kit;
Object.assign(dbg, {
  kit: spec => { const r = kit0(spec); noShrines(); return r; }, noShrines, shrines: () => G.shrines, placeShrine,
  // pickShrine(idOrIndex): picks from the pending shrine (by gem id or index into its offer); returns the gem id or null.
  pickShrine: v => { const s = activeShrine(); if (!s) return null; const id = typeof v === 'number' ? s.offer[v] : v; return pickShrine(s, id) ? id : null; },
});

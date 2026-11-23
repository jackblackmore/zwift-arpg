// Skill gems and the skill bar: owning, slotting, casting from slots, gem XP and shrines.
// Data in data/gems.js. Design: "Gem model in detail" in docs/design-notes.md.
import * as T from 'three';
import { G, P, S } from '../core/state.js';
import { GEMS, SLOT_DEFS, BAR, SHRINES, START_GUARD, GEM } from '../data/gems.js';
import { SK } from '../data/skills.js';
import { ctl } from '../input/input.js';
import { dist } from '../core/util.js';
import { scene } from '../render/scene.js';
import { glowSprite, decal } from '../render/assets.js';
import { toast, banner } from '../render/fx.js';
import { SFX } from '../core/audio.js';
import { blocked } from '../world/map.js';
import { xpNeedFor } from './formulas.js';
import { recalc } from './stats.js';
import { CAST } from './casts.js';

export const gemById = id => P.gems.find(g => g.id === id) || null;
export const unlocked = slot => P.lvl >= SLOT_DEFS[slot].unlock;
export const barGem = slot => (unlocked(slot) && gemById(P.bar[slot])) || null;
export const fits = (gem, slot) => SLOT_DEFS[slot].kinds.includes(GEMS[gem].kind);
export const slotOf = g => BAR.find(s => P.bar[s] === g.id) || null;
export const ownsGem = gem => P.gems.some(g => g.gem === gem);
// { gemId: level } for the gems on unlocked slots: what computeStats needs.
export function barLevels() { const o = {}; for (const s of BAR) { const g = barGem(s); if (g) o[g.gem] = Math.max(o[g.gem] || 0, g.lvl); } return o; }

export function addGem(gem, lvl = 1) {
  const g = { id: P.gems.reduce((m, x) => Math.max(m, x.id), 0) + 1, gem, lvl, xp: 0 };
  P.gems.push(g); return g;
}

// A brand-new character (or an old save from before gems): Magic Shield in Guard, everything else from shrines.
export function freshGems() {
  P.gems = []; P.bar = {}; P.cd = {}; P.shrined = {};
  P.bar.guard = addGem(START_GUARD).id;
  recalc(); readySlots();
}

const slotState = slot => P.cd[slot] || (P.cd[slot] = { cd: 0, ch: 0, t: 0 });
// Charge gems (SK[...].charges, e.g. Flame Dash): how many charges the slot's gem holds. Flame Dash's milestone and gear add S.dashMax − 1.
export function chargeMax(slot) { const g = barGem(slot), K = g && SK[GEMS[g.gem].sk]; return K && K.charges ? K.charges + (g.gem === 'dash' ? S.dashMax - 1 : 0) : 0; }
function readySlot(slot) { const st = slotState(slot); st.cd = 0; st.t = 0; st.ch = chargeMax(slot); }
export function readySlots() { for (const s of BAR) readySlot(s); }

// Put gem `id` in `slot`. Moving a gem from another slot swaps the two when the other one fits there.
export function placeGem(id, slot) {
  const g = gemById(id); if (!g || !unlocked(slot) || !fits(g.gem, slot)) return false;
  const from = slotOf(g), prev = gemById(P.bar[slot]);
  P.bar[slot] = id;
  if (from && from !== slot) P.bar[from] = prev && fits(prev.gem, from) ? prev.id : null;
  recalc(); readySlot(slot); if (from) readySlot(from); return true;
}
export function clearSlot(slot) { P.bar[slot] = null; recalc(); }

// ---- casting ----
const cast = gem => CAST[gem] ? CAST[gem]() : false;
// Press gems: one cast per tap; holding the button recasts whenever it's ready.
function tryPress(slot, g) {
  const st = slotState(slot), K = SK[GEMS[g.gem].sk];
  if (st.cd > 0) return;
  if (K.charges) { if (st.ch < 1 || !cast(g.gem)) return; st.ch--; return; }
  if (cast(g.gem) && K.cd) st.cd = K.cd;
}
// Called every tick from updPlayer. fx: effort modifiers (cast speed).
export function updSlots(dt, fx) {
  for (const slot of BAR) {
    const st = slotState(slot), max = chargeMax(slot); st.cd -= dt; if (!max) continue;
    const g = barGem(slot), K = SK[GEMS[g.gem].sk];
    if (st.ch < max) { st.t += dt; if (st.t >= K.recharge) { st.t = 0; st.ch++; } } else { st.t = 0; st.ch = max; }
  }
  // Held gems share one cast timer; the first held button in bar order wins.
  if (P.castT <= 0) for (const slot of BAR) {
    const g = barGem(slot); if (!g || !GEMS[g.gem].held || !ctl[slot]) continue;
    if (cast(g.gem)) P.castT = SK[GEMS[g.gem].sk].cast / (S.cast * fx.cast);
    break;
  }
  for (const slot of BAR) {
    const want = ctl.tap[slot] || ctl[slot]; ctl.tap[slot] = false;
    const g = barGem(slot); if (!want || !g || GEMS[g.gem].held) continue;
    tryPress(slot, g);
  }
}

// ---- gem XP: bar gems earn what the character earns, gems in the bag a share ----
export function gemXp(n) {
  let changed = false;
  for (const g of P.gems) {
    if (g.lvl >= GEM.cap) { g.xp = 0; continue; }
    const on = !!slotOf(g) && unlocked(slotOf(g));
    g.xp += n * (on ? 1 : GEM.offBar);
    while (g.lvl < GEM.cap && g.xp >= xpNeedFor(g.lvl)) {
      g.xp -= xpNeedFor(g.lvl); g.lvl++; changed = changed || on;
      const D = GEMS[g.gem], ms = D.ms[g.lvl];
      toast(`<span style="color:${D.col}">${D.icon} ${D.n}</span> reached gem level ${g.lvl}${ms ? ` · <b style="color:#ffd23f">${ms}</b>` : ''}`);
      if (ms && on) { banner(D.n.toUpperCase() + ' ' + g.lvl, D.col, ms); SFX.lvl(); }
    }
    if (g.lvl >= GEM.cap) g.xp = 0;
  }
  if (changed) recalc();
}

// ---- shrines: one per slot unlock (data/gems.js SHRINES) ----
export const shrineDue = () => BAR.filter(s => SHRINES[s] && P.lvl >= (SLOT_DEFS[s].shrineLvl || SLOT_DEFS[s].unlock) && !P.shrined[s]);
export function shrineOffer(slot) {
  const all = SHRINES[slot], fresh = all.filter(id => !ownsGem(id));
  return (fresh.length ? fresh : all).slice(0, 3);
}
export function takeShrine(slot, gem) {
  if (!SHRINES[slot] || P.shrined[slot] || !shrineOffer(slot).includes(gem)) return null;
  const main = gemById(P.bar.main), lvl = slot !== 'main' && main && GEMS[gem].kind === 'attack' ? Math.max(1, main.lvl - GEM.flexStart) : 1;
  const g = addGem(gem, lvl); P.shrined[slot] = 1;
  if (slot !== 'guard') placeGem(g.id, slot); // the Guard shrine gives Frost Ward to the bag: Magic Shield stays until you swap
  SFX.lvl();
  refreshShrine();
  return g;
}

// The shrine in the world: at the map entrance, for the first slot that's due (Main is offered straight away instead).
export function refreshShrine() {
  const due = shrineDue().filter(s => s !== 'main');
  if (!due.length) { if (G.shrine) { scene.remove(G.shrine.g); G.shrine = null; } return; }
  if (G.shrine) { G.shrine.slot = due[0]; return; }
  let x = G.start.x + 2.5, z = G.start.z - 2.5;
  if (blocked(x, z, .8)) { x = G.start.x; z = G.start.z; }
  const g = new T.Group(), col = 0xffd23f;
  const stone = new T.Mesh(new T.CylinderGeometry(.45, .6, 1, 8), new T.MeshLambertMaterial({ color: 0x4a4238 })); stone.position.y = .5; g.add(stone);
  const gl = glowSprite(col, 1.6); gl.position.y = 1.5; g.add(gl); g.add(decal(col, 3.5));
  g.position.set(x, 0, z); scene.add(g);
  G.shrine = { x, z, g, gl, slot: due[0], near: false };
}
// The shrine for a slot that unlocked on this map waits at the next map's entrance.
export function onLevelUp(prev) {
  const fresh = BAR.filter(s => SLOT_DEFS[s].unlock > prev && SLOT_DEFS[s].unlock <= P.lvl);
  if (fresh.length) toast(`<b style="color:#ffd23f">${fresh.map(s => SLOT_DEFS[s].n).join(', ')} slot unlocked</b> · a shrine waits at the next map entrance`);
  return fresh;
}
// Walking into the shrine asks the UI to show its choice (main.js opens the panel).
export function updShrine() {
  const sh = G.shrine; if (!sh) return;
  sh.gl.position.y = 1.5 + Math.sin(G.gt * 2) * .12;
  const d = dist(P.x, P.z, sh.x, sh.z);
  if (d < 1.6 && !sh.near) { sh.near = true; G.shrineAsk = sh.slot; }
  if (d > 2.6) sh.near = false;
}

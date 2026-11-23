// Skill gems and the skill bar: owning, slotting, casting from slots, gem XP and shrines.
// Data in data/gems.js. Design: "Gem model in detail" in docs/design-notes.md.
import * as T from 'three';
import { G, P, S } from '../core/state.js';
import { GEMS, SUPPORTS, SLOT_DEFS, BAR, SHRINES, START_MAIN, START_GUARD, START_EVADE, GEM, supFits, gemDef } from '../data/gems.js';
import { RIDE } from '../data/ride.js';
import { SK } from '../data/skills.js';
import { ctl } from '../input/input.js';
import { dist } from '../core/util.js';
import { scene } from '../render/scene.js';
import { glowSprite, decal } from '../render/assets.js';
import { toast, banner } from '../render/fx.js';
import { SFX } from '../core/audio.js';
import { blocked } from '../world/map.js';
import { xpNeedFor, gemTotalXp, feedShare } from './formulas.js';
import { recalc } from './stats.js';
import { CAST } from './casts.js';
import { shape } from './sk/strike.js';

export const gemById = id => P.gems.find(g => g.id === id) || null;
export const unlocked = slot => P.lvl >= SLOT_DEFS[slot].unlock;
export const barGem = slot => (unlocked(slot) && gemById(P.bar[slot])) || null;
export const isSupport = g => !!g && !!SUPPORTS[g.gem];
export const fits = (gem, slot) => !!GEMS[gem] && SLOT_DEFS[slot].kinds.includes(GEMS[gem].kind);
export const slotOf = g => BAR.find(s => P.bar[s] === g.id) || null;
export const ownsGem = gem => P.gems.some(g => g.gem === gem);
// { gemId: level } for the gems on unlocked slots: what computeStats needs.
export function barLevels() { const o = {}; for (const s of BAR) { const g = barGem(s); if (g) o[g.gem] = Math.max(o[g.gem] || 0, g.lvl); } return o; }

// ---- support sockets: they live on the skill bar slot (P.sock[slot] = [gem id or null, ...]), not on the gem ----
// Sockets a slot has at the character's level (data/gems.js SLOT_DEFS sock); 0 while the slot is locked.
export function sockCount(slot, lvl = P.lvl) { if (lvl < SLOT_DEFS[slot].unlock) return 0; let n = 0; for (const [l, c] of SLOT_DEFS[slot].sock) if (lvl >= l) n = c; return n; }
// The next socket a slot gains, as [level, count], or null.
export const nextSock = slot => SLOT_DEFS[slot].sock.find(([l]) => l > P.lvl) || null;
const sockArr = slot => P.sock[slot] || (P.sock[slot] = []);
// Support gems in a slot's open sockets (gem objects; null for an empty socket).
export const socketed = slot => Array.from({ length: sockCount(slot) }, (_, i) => gemById(sockArr(slot)[i]));
export const sockOf = g => { for (const s of BAR) { const i = (P.sock[s] || []).indexOf(g.id); if (i >= 0 && i < sockCount(s)) return [s, i]; } return null; };
// Is this support doing something: socketed in an unlocked slot whose gem it fits?
export function supActive(g) { const at = sockOf(g), sg = at && barGem(at[0]); return !!sg && supFits(g.gem, sg.gem); }
// { gemId: [supportId, ...] } for the bar: what computeStats needs (it ignores supports that don't fit).
export function sockMap() {
  const o = {};
  for (const s of BAR) { const g = barGem(s); if (!g) continue; for (const x of socketed(s)) if (x) (o[g.gem] || (o[g.gem] = [])).push(x.gem); }
  return o;
}
// Put support gem `id` into socket `i` of `slot` (default: the first empty one, else the last). It leaves any other socket.
// Refused if it isn't a support, the slot has no such socket, it doesn't fit the slot's gem, or that slot already has the same support.
export function socketGem(id, slot, i = null) {
  const g = gemById(id), n = sockCount(slot), sg = barGem(slot); if (!isSupport(g) || !n || !sg || !supFits(g.gem, sg.gem)) return false;
  const arr = sockArr(slot), cur = socketed(slot);
  if (i === null) { i = cur.findIndex(x => !x); if (i < 0) i = n - 1; }
  if (i < 0 || i >= n || cur.some((x, k) => x && k !== i && x.gem === g.gem && x.id !== id)) return false;
  const from = sockOf(g); if (from) P.sock[from[0]][from[1]] = null;
  arr[i] = id; recalc(); return true;
}
export function unsocket(slot, i) { const arr = sockArr(slot); if (arr[i] == null) return false; arr[i] = null; recalc(); return true; }
// Where a gem is: on the bar, in a socket, or in the bag.
export const inBag = g => !(slotOf(g) && unlocked(slotOf(g))) && !sockOf(g);

export function addGem(gem, lvl = 1) {
  const g = { id: P.gems.reduce((m, x) => Math.max(m, x.id), 0) + 1, gem, lvl, xp: 0 };
  P.gems.push(g); return g;
}

// A brand-new character: the Sword in Main, the Knight's Shield in Guard and Roll in Evade; everything else from shrines.
export function freshGems() {
  P.gems = []; P.bar = {}; P.sock = {}; P.cd = {}; P.shrined = { main: 1 };
  P.bar.main = addGem(START_MAIN).id; P.bar.guard = addGem(START_GUARD).id; P.bar.evade = addGem(START_EVADE).id;
  recalc(); readySlots();
}

const slotState = slot => P.cd[slot] || (P.cd[slot] = { cd: 0, ch: 0, t: 0 });
// Charge gems (SK[...].charges, e.g. Flame Dash): how many charges the slot's gem holds; milestones, supports and gear add S.sk[gem].ch.
export function chargeMax(slot) { const g = barGem(slot), K = g && SK[GEMS[g.gem].sk]; return K && K.charges ? K.charges + ((S.sk && S.sk[g.gem] && S.sk[g.gem].ch) || 0) : 0; }
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
  if (K.charges) { if (st.ch < 1 || !cast(g.gem)) return; st.ch--; pressed(slot); return; }
  if (cast(g.gem)) { if (K.cd) st.cd = K.cd; pressed(slot); }
}
// Fired after any press gem goes off from a slot: an Evade makes the autopilot hold still for a moment.
function pressed(slot) { if (slot === 'evade') P.apPause = RIDE.autopilot.evadePause; }
// Called every tick from updPlayer. fx: effort modifiers (cast speed).
export function updSlots(dt, fx) {
  for (const slot of BAR) {
    const st = slotState(slot), max = chargeMax(slot), rec = dt * (fx.cd || 1); st.cd -= rec; if (!max) continue; // surging recovers faster
    const g = barGem(slot), K = SK[GEMS[g.gem].sk];
    if (st.ch < max) { st.t += rec; if (st.t >= K.recharge) { st.t = 0; st.ch++; } } else { st.t = 0; st.ch = max; }
  }
  // Held gems share one cast timer; the first held button in bar order wins. With none held, a melee Main gem auto-attacks.
  // Nothing swings or casts while you block, roll or are guard broken (game/sk/guard.js, game/sk/roll.js).
  const busy = P.blocking || P.rollT > 0 || P.broken > 0;
  if (P.castT <= 0 && !busy) {
    let held = false;
    for (const slot of BAR) {
      const g = barGem(slot); if (!g || !GEMS[g.gem].held || !ctl[slot]) continue;
      held = true; if (cast(g.gem)) P.castT = SK[GEMS[g.gem].sk].cast / (S.cast * fx.cast);
      break;
    }
    const g = !held && barGem('main'), tg = g && autoTarget(g.gem);
    if (tg) { P.aimAt = [tg.x, tg.z]; if (cast(g.gem)) P.castT = SK[GEMS[g.gem].sk].cast / (S.cast * fx.cast); P.aimAt = null; }
  }
  for (const slot of BAR) {
    const want = ctl.tap[slot] || (ctl[slot] && slot !== 'evade'); ctl.tap[slot] = false; // one Evade per press, never held
    const g = barGem(slot); if (!want || !g || GEMS[g.gem].held || GEMS[g.gem].shield || P.broken > 0) continue;
    if (P.rollT > 0 || (P.blocking && GEMS[g.gem].kind !== 'evade')) continue; // you can roll out of a block, not cast from one
    tryPress(slot, g);
  }
}

// ---- auto-attack: the melee Main gem swings on its own at an awake monster in reach (ctl.autoAtk, the ATTACK toggle) ----
// How far a melee gem's swing reaches from you.
export function meleeReach(gem) { const sh = shape(gem); return sh.cone ? sh.cone[0] : sh.circle[0] + sh.circle[1] * .8; }
// What to swing at: the guardian and rares first, then the nearest; null if nothing's in reach, auto-attack is off, or you're
// steering away from it by hand (autopilot steering doesn't count). Sleeping monsters are left alone so you don't pull rooms.
export function autoTarget(gem) {
  if (!GEMS[gem] || !GEMS[gem].melee || !ctl.autoAtk || P.dead > 0) return null;
  const reach = meleeReach(gem), mx = ctl.mx, mz = ctl.mz, steering = Math.hypot(mx, mz) > .08;
  let best = null, bs = -1e9;
  for (const e of G.enemies) {
    if (e.deathT || !e.awake || e.rise > 0) continue;
    const d = dist(e.x, e.z, P.x, P.z); if (d > reach + e.r) continue;
    if (steering && (e.x - P.x) * mx + (e.z - P.z) * mz < 0) continue;
    const sc = (e.type === 'boss' ? 200 : e.rar === 2 ? 100 : 0) - d;
    if (sc > bs) { bs = sc; best = e; }
  }
  return best;
}

// ---- gem XP: bar gems and active supports earn what the character earns, gems in the bag a share ----
// Level a gem up from its XP. on: it's in use (a banner for a milestone). Returns true if it levelled.
function levelUp(g, on) {
  let up = false;
  while (g.lvl < GEM.cap && g.xp >= xpNeedFor(g.lvl)) {
    g.xp -= xpNeedFor(g.lvl); g.lvl++; up = true;
    const D = gemDef(g.gem), ms = D.ms[g.lvl];
    toast(`<span style="color:${D.col}">${D.icon} ${D.n}</span> reached gem level ${g.lvl}${ms ? ` · <b style="color:#ffd23f">${ms}</b>` : ''}`);
    if (ms && on) { banner(D.n.toUpperCase() + ' ' + g.lvl, D.col, ms); SFX.lvl(); }
  }
  if (g.lvl >= GEM.cap) g.xp = 0;
  return up;
}
export function gemXp(n) {
  let changed = false;
  for (const g of P.gems) {
    if (g.lvl >= GEM.cap) { g.xp = 0; continue; }
    const on = isSupport(g) ? !!sockOf(g) && !!barGem(sockOf(g)[0]) : !!slotOf(g) && unlocked(slotOf(g));
    g.xp += n * (on ? 1 : GEM.offBar);
    if (levelUp(g, on) && on) changed = true;
  }
  if (changed) recalc();
}

// ---- feeding: a spare gem's XP goes into another gem (data/gems.js FEED). You never lose a skill: feeding your
// last copy of a gem leaves a level 1 copy in the bag. Only gems in the bag can be fed; the target can be anywhere. ----
export function feedPreview(foodId, intoId) {
  const food = gemById(foodId), into = gemById(intoId);
  if (!food || !into || food === into || !inBag(food) || into.lvl >= GEM.cap) return null;
  const last = !P.gems.some(g => g !== food && g.gem === food.gem), ap = gemTotalXp(food);
  if (!ap) return null; // nothing to give (a fresh level 1 gem)
  const share = feedShare(food, into), gain = ap * share, t = { lvl: into.lvl, xp: into.xp + gain };
  while (t.lvl < GEM.cap && t.xp >= xpNeedFor(t.lvl)) { t.xp -= xpNeedFor(t.lvl); t.lvl++; }
  return { food, into, ap, share, gain, last, lvl: t.lvl, waste: t.lvl >= GEM.cap ? t.xp : 0 };
}
export function feedGem(foodId, intoId) {
  const f = feedPreview(foodId, intoId); if (!f) return null;
  if (f.last) { f.food.lvl = 1; f.food.xp = 0; } else P.gems = P.gems.filter(g => g !== f.food);
  f.into.xp += f.gain; const on = !inBag(f.into); levelUp(f.into, on);
  recalc(); SFX.lvl(); return f;
}

// ---- shrines: one per slot unlock (data/gems.js SHRINES) ----
export const shrineDue = () => BAR.filter(s => SHRINES[s] && P.lvl >= (SLOT_DEFS[s].shrineLvl || SLOT_DEFS[s].unlock) && !P.shrined[s]);
export function shrineOffer(slot) {
  const all = SHRINES[slot], fresh = all.filter(id => !ownsGem(id));
  // Stable until the character's gem count changes: rotate the list by it, so different shrines show different options.
  const pool = fresh.length ? fresh : all, k = P.gems.length % pool.length;
  return [...pool.slice(k), ...pool.slice(0, k)].slice(0, 3);
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

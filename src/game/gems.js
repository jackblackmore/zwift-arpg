// Skill gems: instances in a bag (P.gems = [{ uid, id, lvl, ap }]), the five-slot skill bar (P.bar: slot -> uid) and support
// sockets (P.sockets: slot -> [uid|null]). Gems earn AP and level; equipped means on the bar or in a socket.
// Slot rules (unlock level, accepted kinds, socket counts) are data in data/gems.js BAR_SLOTS. Everything here is free to do any time.
import { P, S } from '../core/state.js';
import { GEMS, GEM_FALLBACK, BAR_SLOTS, SLOT_ORDER, SLICE1_KIT, apNeed, AP_KILL, AP_PER_SEC, UNEQUIPPED_SHARE } from '../data/gems.js';
import { banner, toast } from '../render/fx.js';
import { SFX } from '../core/audio.js';
import { dbg } from '../core/dbg.js';

export { apNeed };
let bypass = false; // set by kit(): gems it placed ignore the unlock rules (debug only); initCharacter clears it via resetKit()
export const resetKit = () => { bypass = false; };

// ---- instances ----
export const byUid = uid => (uid == null ? null : P.gems.find(g => g.uid === uid) || null);
const nextUid = () => P.gems.reduce((m, g) => Math.max(m, g.uid), 0) + 1;
// A new gem instance in the bag, silently (migration, kit). addGem is the one that announces it.
export function makeGem(id, lvl = 1) {
  const g = { uid: nextUid(), id, lvl: Math.max(1, Math.min(GEMS[id].cap, Math.floor(lvl) || 1)), ap: 0 };
  P.gems.push(g); return g;
}
// A gem found or earned: into the bag, with a toast and the GEMS button badge. Returns the instance.
export function addGem(id, lvl = 1) {
  const g = makeGem(id, lvl), d = GEMS[id];
  P.newGems++; toast(`New gem: <b style="color:${d.color}">${d.name}</b>`); SFX.loot(1); return g;
}

// ---- where gems are ----
export const slotGem = slot => byUid(P.bar[slot]);
export const slotSkill = slot => { const g = slotGem(slot); return g ? g.id : null; };
export const slotOf = id => SLOT_ORDER.find(s => slotSkill(s) === id) || null;
export const socketList = slot => P.sockets[slot] || [];
// [slot, index] of the socket holding this gem, or null.
export function socketOf(uid) { for (const s of SLOT_ORDER) { const i = socketList(s).indexOf(uid); if (i >= 0) return [s, i]; } return null; }
export const barSlotOf = uid => SLOT_ORDER.find(s => P.bar[s] === uid) || null;
export const isEquipped = uid => !!barSlotOf(uid) || !!socketOf(uid);
// The instance of this gem id that is on the bar or socketed, if any.
const equippedOf = id => { const s = slotOf(id); if (s) return slotGem(s); for (const sl of SLOT_ORDER) for (const u of socketList(sl)) { const g = byUid(u); if (g && g.id === id) return g; } return null; };

// ---- rules ----
export const slotUnlocked = slot => P.lvl >= BAR_SLOTS[slot].unlock;
export function socketCount(slot) { let n = 0; for (const [l, c] of BAR_SLOTS[slot].sockets) if (P.lvl >= l) n = c; return n; }
export const slotAccepts = slot => (S.slotKinds && S.slotKinds[slot]) || BAR_SLOTS[slot].accepts;
export const supportFits = (supportId, skillId) => !!skillId && GEMS[supportId].tags.some(t => GEMS[skillId].tags.includes(t));

// Why a gem can't go in a slot / socket (a sentence for the UI), or null when it can.
export function equipReason(slot, uid) {
  const g = byUid(uid), B = BAR_SLOTS[slot]; if (!g || !B) return 'No such gem';
  if (!slotUnlocked(slot)) return `Unlocks at level ${B.unlock}`;
  const kind = GEMS[g.id].kind;
  if (kind === 'support') return 'Support gems go in sockets';
  const acc = slotAccepts(slot); if (!acc.includes(kind)) return `${B.name} slot: ${acc.join(' / ')} gems only`;
  for (const s of SLOT_ORDER) if (s !== slot && P.bar[s] !== uid && slotSkill(s) === g.id) return `${GEMS[g.id].name} is already on the bar`;
  return null;
}
export function socketReason(slot, i, uid) {
  const g = byUid(uid), B = BAR_SLOTS[slot]; if (!g || !B) return 'No such gem';
  if (!slotUnlocked(slot)) return `Unlocks at level ${B.unlock}`;
  if (GEMS[g.id].kind !== 'support') return 'Only support gems fit sockets';
  if (i >= Math.max(socketCount(slot), socketList(slot).length)) return 'No such socket yet';
  const sk = slotSkill(slot); if (!sk) return 'Put a skill in this slot first';
  if (!supportFits(g.id, sk)) return `${GEMS[g.id].name} needs a ${GEMS[g.id].tags.join(' or ')} skill`;
  if (socketList(slot).some((u, j) => j !== i && u !== uid && byUid(u) && byUid(u).id === g.id)) return `${GEMS[g.id].name} is already socketed here`;
  return null;
}

// ---- changing the bar (all return true when something was done) ----
// Put an attack / guard / evade gem in a slot. A gem already on the bar swaps places with what was there (or sends it to the bag).
export function equipGem(slot, uid) {
  if (equipReason(slot, uid)) return false;
  const src = barSlotOf(uid), old = P.bar[slot];
  if (src === slot) return true;
  if (src) P.bar[src] = null;
  P.bar[slot] = uid;
  if (src && old && !equipReason(src, old)) P.bar[src] = old;
  validateBar(); return true;
}
export function unequip(slot) { if (!P.bar[slot]) return false; P.bar[slot] = null; validateBar(); return true; }
export function socketGem(slot, i, uid) {
  if (socketReason(slot, i, uid)) return false;
  const was = socketOf(uid); if (was) P.sockets[was[0]][was[1]] = null;
  const a = P.sockets[slot] || (P.sockets[slot] = []); while (a.length <= i) a.push(null);
  a[i] = uid; return true;
}
export function unsocket(slot, i) { if (!socketList(slot)[i]) return false; P.sockets[slot][i] = null; return true; }

// After recalc() or a level change: gems that no longer belong go back to the bag, socket arrays match the unlocked counts.
export function validateBar() {
  const used = new Set(), ids = new Set();
  for (const slot of SLOT_ORDER) {
    const u = P.bar[slot], g = byUid(u), d = g && GEMS[g.id];
    if (g && d && !used.has(u) && !ids.has(g.id) && slotAccepts(slot).includes(d.kind) && (slotUnlocked(slot) || bypass)) { used.add(u); ids.add(g.id); continue; }
    if (g && d) toast(`${d.name} returned to the bag`);
    P.bar[slot] = null;
  }
  for (const slot of SLOT_ORDER) {
    const arr = socketList(slot), sk = slotSkill(slot), have = new Set(); let len = socketCount(slot);
    if (bypass) for (let i = arr.length - 1; i >= len; i--) if (arr[i]) { len = i + 1; break; }
    const out = [];
    for (let i = 0; i < len; i++) {
      const u = arr[i], g = byUid(u);
      if (g && GEMS[g.id].kind === 'support' && sk && !used.has(u) && !have.has(g.id) && supportFits(g.id, sk)) { out.push(u); used.add(u); have.add(g.id); } else out.push(null);
    }
    P.sockets[slot] = out;
  }
  for (const k of Object.keys(P.sockets)) if (!BAR_SLOTS[k]) delete P.sockets[k];
}

// ---- gem numbers, by skill id (what is equipped, else the best owned, else level 1) ----
export function gemLvl(id) {
  const e = equippedOf(id); if (e) return e.lvl;
  let best = 0; for (const g of P.gems) if (g.id === id && g.lvl > best) best = g.lvl;
  return best || 1;
}
// Base damage of the skill's gem at its level; skills without a gem borrow one (burn).
export function gemBase(id) {
  const own = GEMS[id], fb = own ? null : (GEM_FALLBACK[id] || GEM_FALLBACK.none), g = own || GEMS[fb.gem], l = gemLvl(own ? id : fb.gem);
  if (g.base1 === undefined) return 0;
  return (g.base1 + (g.baseCap - g.base1) * (l - 1) / (g.cap - 1)) * (fb ? fb.frac : 1);
}
// Gentle per-level scale for non-damage stats (ward absorb, blink range, a support's strength).
export const gemScale = id => 1 + (GEMS[id].scale || 0) * (gemLvl(id) - 1);
// Has the gem reached the milestone with this key?
export function gemHas(id, key) { const m = GEMS[id] && GEMS[id].milestones.find(m => m.key === key); return !!m && gemLvl(id) >= m.lvl; }
// A numeric field of a reached milestone (e.g. its pierce count), 0 if not reached.
export function gemMile(id, key, field) { const m = GEMS[id].milestones.find(m => m.key === key); return m && gemLvl(id) >= m.lvl ? m[field] || 0 : 0; }
// The supports socketed with a skill: [{ id, lvl }] (empty when the skill isn't on the bar). Effects look supports up here.
export function supportsOf(skillId) {
  const slot = slotOf(skillId); if (!slot) return [];
  return socketList(slot).map(byUid).filter(Boolean).map(g => ({ id: g.id, lvl: g.lvl }));
}

// ---- AP ----
export function gainAP(n) {
  const eq = new Set([...Object.values(P.bar), ...Object.values(P.sockets).flat()]);
  for (const g of P.gems) {
    const def = GEMS[g.id]; if (!def || g.lvl >= def.cap) continue;
    g.ap += n * (eq.has(g.uid) ? 1 : UNEQUIPPED_SHARE);
    while (g.lvl < def.cap && g.ap >= apNeed(g.lvl)) {
      g.ap -= apNeed(g.lvl); g.lvl++;
      const m = def.milestones.find(m => m.lvl === g.lvl), msg = `${def.name} reaches level ${g.lvl}` + (m ? `: ${m.text}` : '');
      toast(`<b style="color:#ffd23f">${msg}</b>`); SFX.lvl();
      if (m) banner(def.name.toUpperCase() + ' · LV ' + g.lvl, def.color, m.text);
    }
    if (g.lvl >= def.cap) g.ap = 0; // capped: AP stops accumulating
  }
}
export function gemsOnKill(e) { gainAP(AP_KILL[e.guardian || e.ai === 'boss' ? 'guardian' : e.rar === 2 ? 'rare' : e.rar === 1 ? 'magic' : 'normal']); }
export const gemsTick = dt => gainAP(AP_PER_SEC * dt);

// ---- debug loadout (tests) ----
// kit({ main: 'fireball', flexA: 'nova', guard: 'ward', evade: 'blink', lvl: 1, sup: { main: ['split'] } }) replaces the gem bag with
// exactly these gems at that level, on the bar and in sockets, ignoring unlock levels and socket counts. kit() = the Slice 1 loadout.
export function kit(spec = SLICE1_KIT) {
  P.gems = []; P.bar = Object.fromEntries(SLOT_ORDER.map(k => [k, null])); P.sockets = {}; bypass = true;
  for (const slot of SLOT_ORDER) if (spec[slot]) P.bar[slot] = makeGem(spec[slot], spec.lvl || 1).uid;
  for (const [slot, ids] of Object.entries(spec.sup || {})) ids.forEach((id, i) => { (P.sockets[slot] || (P.sockets[slot] = []))[i] = makeGem(id, spec.lvl || 1).uid; });
  validateBar(); return { ...P.bar };
}

Object.assign(dbg, { slotGem, slotSkill, slotOf, gemLvl, gemBase, gemScale, gemHas, gemMile, addGem, equipGem, unequip, socketGem, unsocket, slotUnlocked, socketCount, slotAccepts, validateBar, supportsOf, equipReason, socketReason, kit });

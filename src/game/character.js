// The character: restoring P from a save (with migration of old saves) or making a fresh one.
// Called once from main.js begin(), before startRun() (game/waypoint.js) decides where the hero enters.
import { G, P } from '../core/state.js';
import { PASS } from '../data/passives.js';
import { GEMS, SLOT_ORDER, NOTABLE_TO_SUPPORT } from '../data/gems.js';
import { cleanItem } from './items.js';
import { makeGem, resetKit, equipGem, socketGem, validateBar, slotUnlocked } from './gems.js';

// Old saves: drop retired passives and mods (mana, Flame Dash charges, Arc chains, Blood Magic ...).
function cleanSave(sv) {
  for (const k of Object.keys(sv.passives || {})) if (!PASS[k]) delete sv.passives[k];
  Object.values(sv.gear || {}).forEach(cleanItem); (sv.inv || []).forEach(cleanItem);
  return sv;
}

// A Slice 1 save (gems = { skillId: { lvl, ap } }, or none at all): every gem becomes an instance keeping its level and AP.
// Fireball -> Main, Blink -> Evade, Frost Nova -> Flex A and Ward -> Guard when those slots are unlocked, else the bag.
// The old notables (sv.passives) become support gems at their stack count, their points are refunded, and the first one
// that fits is socketed into Main. P.lvl must already be set. Returns the passives that stay.
function migrateSlice1(sv) {
  const old = sv.gems && !Array.isArray(sv.gems) ? sv.gems : {}, made = {};
  for (const id of ['fireball', 'nova', 'ward', 'blink']) {
    const s = old[id], g = makeGem(id, s ? s.lvl : 1); g.ap = s && g.lvl < GEMS[id].cap ? Math.max(0, +s.ap || 0) : 0; made[id] = g;
  }
  equipGem('main', made.fireball.uid); equipGem('evade', made.blink.uid);
  if (slotUnlocked('flexA')) equipGem('flexA', made.nova.uid);
  if (slotUnlocked('guard')) equipGem('guard', made.ward.uid);
  P.shrines = { ...P.shrines, main: 'fireball' }; // they already have their Main gem
  let first = true;
  for (const k of Object.keys(NOTABLE_TO_SUPPORT)) {
    const n = P.passives[k]; if (!n) continue;
    const g = makeGem(NOTABLE_TO_SUPPORT[k], n); delete P.passives[k]; P.pts += n;
    if (first && socketGem('main', 0, g.uid)) first = false;
  }
}

// Saved gems / bar / sockets (v2): clamp levels, drop unknown ids and duplicate uids; the bar and sockets only keep gems that exist.
function restoreGems(sv) {
  const seen = new Set(); P.gems = [];
  for (const g of Array.isArray(sv.gems) ? sv.gems : []) {
    const d = g && GEMS[g.id]; if (!d || !Number.isFinite(g.uid) || seen.has(g.uid)) continue;
    const lvl = Math.max(1, Math.min(d.cap, Math.floor(g.lvl) || 1)); seen.add(g.uid);
    P.gems.push({ uid: g.uid, id: g.id, lvl, ap: lvl < d.cap ? Math.max(0, +g.ap || 0) : 0 });
  }
  P.bar = Object.fromEntries(SLOT_ORDER.map(k => [k, seen.has(sv.bar && sv.bar[k]) ? sv.bar[k] : null]));
  P.sockets = {};
  for (const k of SLOT_ORDER) if (sv.sockets && Array.isArray(sv.sockets[k])) P.sockets[k] = sv.sockets[k].map(u => (seen.has(u) ? u : null));
}

// sv: the loaded save, or null for a fresh character. Sets every saved P field (and G.itemId); recalc() runs after.
export function initCharacter(sv) {
  resetKit(); P.gems = []; P.bar = Object.fromEntries(SLOT_ORDER.map(k => [k, null])); P.sockets = {}; P.newGems = 0;
  if (!sv) {
    Object.assign(P, { lvl: 1, xp: 0, gear: {}, inv: [], passives: {}, pts: 0, offer: null, newItems: 0, kills: 0, clears: 0, waypoint: 0, shrines: {}, tree: {} });
    P.gear.weapon = { id: G.itemId++, slot: 'weapon', rar: 1, base: 'Ashwood Staff', name: 'Smouldering Ashwood Staff', il: 1, impl: 1, mods: [['spell', 5], ['fire', .12]] };
    // No gems until the Ride 1 shrine at the entrance of Crypt 1 (game/shrines.js); __dbg.kit() gives tests a loadout.
    return;
  }
  const passives = { ...(sv.passives || {}) }; // read before cleanSave drops the retired notables
  cleanSave(sv);
  Object.assign(P, { lvl: sv.lvl, xp: sv.xp, gear: sv.gear || {}, inv: sv.inv || [], passives: { ...(sv.passives || {}) }, pts: sv.pts || 0, offer: null,
    clears: sv.clears ?? Math.max(0, (sv.tier || 1) - 1), waypoint: sv.waypoint || 0, shrines: sv.shrines || {}, tree: sv.tree || {} });
  G.itemId = sv.itemId || 100;
  if (Array.isArray(sv.gems)) restoreGems(sv);
  else { P.passives = passives; migrateSlice1(sv); for (const k of Object.keys(P.passives)) if (!PASS[k]) delete P.passives[k]; }
  validateBar();
}

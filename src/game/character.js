// The character: restoring P from a save (with migration of old saves) or making a fresh one.
// Called once from main.js begin(), before startRun() (game/waypoint.js) decides where the hero enters.
import { G, P } from '../core/state.js';
import { PASS } from '../data/passives.js';
import { cleanItem } from './items.js';
import { initGems } from './gems.js';

// Old saves: drop retired passives and mods (mana, Flame Dash charges, Arc chains, Blood Magic ...).
function cleanSave(sv) {
  for (const k of Object.keys(sv.passives || {})) if (!PASS[k]) delete sv.passives[k];
  Object.values(sv.gear || {}).forEach(cleanItem); (sv.inv || []).forEach(cleanItem);
  return sv;
}

// sv: the loaded save, or null for a fresh character. Sets every saved P field (and G.itemId); recalc() runs after.
export function initCharacter(sv) {
  P.gems = initGems(null);
  if (!sv) {
    Object.assign(P, { lvl: 1, xp: 0, gear: {}, inv: [], passives: {}, pts: 0, offer: null, newItems: 0, kills: 0, clears: 0, waypoint: 0, shrines: {}, tree: {} });
    P.gear.weapon = { id: G.itemId++, slot: 'weapon', rar: 1, base: 'Ashwood Staff', name: 'Smouldering Ashwood Staff', il: 1, impl: 1, mods: [['spell', 5], ['fire', .12]] };
    return;
  }
  cleanSave(sv);
  Object.assign(P, { lvl: sv.lvl, xp: sv.xp, gear: sv.gear || {}, inv: sv.inv || [], passives: sv.passives || {}, pts: sv.pts || 0, offer: null,
    clears: sv.clears ?? Math.max(0, (sv.tier || 1) - 1), waypoint: sv.waypoint || 0, shrines: sv.shrines || {}, tree: sv.tree || {} });
  P.gems = initGems(sv.gems); G.itemId = sv.itemId || 100;
}

// Character save in localStorage (one viewer, one device). Always optional.
// Not released yet, so there's no save migration: when the save format or content changes, bump the version in KEY and old
// saves are ignored (the menu offers only NEW).
import { G, P } from '../core/state.js';

export const KEY = 'wd-arpg-8';
let store = null; try { store = window.localStorage; store.getItem('x'); } catch (e) { store = null; }

export function save(nextTier) {
  if (!store) return;
  try { store.setItem(KEY, JSON.stringify({ lvl: P.lvl, xp: P.xp, gear: P.gear, inv: P.inv, tree: P.tree, gems: P.gems, bar: P.bar, sock: P.sock, shrined: P.shrined, tier: nextTier || G.tier, itemId: G.itemId })); } catch (e) {}
}
export function load() { if (!store) return null; try { return JSON.parse(store.getItem(KEY)); } catch (e) { return null; } }

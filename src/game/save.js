// Character save in localStorage (one viewer, one device). Always optional.
import { G, P } from '../core/state.js';

const KEY = 'wd-arpg-1';
let store = null; try { store = window.localStorage; store.getItem('x'); } catch (e) { store = null; }

export function save(nextTier) {
  if (!store) return;
  try { store.setItem(KEY, JSON.stringify({ lvl: P.lvl, xp: P.xp, gear: P.gear, inv: P.inv, passives: P.passives, pts: P.pts, tier: nextTier || G.tier, itemId: G.itemId, gems: P.gems })); } catch (e) {}
}
export function load() { if (!store) return null; try { return JSON.parse(store.getItem(KEY)); } catch (e) { return null; } }

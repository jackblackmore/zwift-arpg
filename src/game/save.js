// Character save in localStorage (one viewer, one device). Always optional.
import { G, P } from '../core/state.js';

const KEY = 'wd-arpg-1';
let store = null; try { store = window.localStorage; store.getItem('x'); } catch (e) { store = null; }

// clears: levels cleared so far (defaults to the current level's count)
export function save(clears) {
  if (!store) return;
  try { store.setItem(KEY, JSON.stringify({ lvl: P.lvl, xp: P.xp, gear: P.gear, inv: P.inv, passives: P.passives, pts: P.pts, clears: clears ?? (G.level ? G.level.clears : 0), itemId: G.itemId })); } catch (e) {}
}
export function load() { if (!store) return null; try { return JSON.parse(store.getItem(KEY)); } catch (e) { return null; } }

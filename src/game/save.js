// Character save in localStorage (one viewer, one device). Always optional.
import { G, P } from '../core/state.js';

const KEY = 'wd-arpg-1';
let store = null; try { store = window.localStorage; store.getItem('x'); } catch (e) { store = null; }

// Every saved field of P, by name. New systems add their field here (and to P in core/state.js, and restore it in
// game/character.js initCharacter, migrating old saves there). `v` is the save format version.
export const SAVE_VERSION = 2;
export const SAVED = ['lvl', 'xp', 'gear', 'inv', 'passives', 'pts', 'gems', 'bar', 'sockets', 'shrines', 'tree', 'waypoint', 'clears'];
// clears: optional, sets P.clears first (kept for older call sites)
export function save(clears) {
  if (clears !== undefined) P.clears = clears;
  if (!store) return;
  const o = { v: SAVE_VERSION, itemId: G.itemId }; for (const k of SAVED) o[k] = P[k];
  try { store.setItem(KEY, JSON.stringify(o)); } catch (e) {}
}
export function load() { if (!store) return null; try { return JSON.parse(store.getItem(KEY)); } catch (e) { return null; } }

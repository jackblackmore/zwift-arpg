// Where a run starts: a fresh character enters Crypt 1; a loaded one (today) rerolls its level.
// Workstream A turns this into the waypoint (pick any level up to the furthest cleared + 1).
import { P } from '../core/state.js';
import { newLevel } from './level.js';
import { save } from './save.js';

// sv: the loaded save, or null for a fresh character (initCharacter has already run).
export function startRun(sv) {
  newLevel(P.clears || 0);
  if (!sv) save();
}

// The passive tree in play: points, taking and giving back nodes, respecs (data/tree.js; the graph helpers are in game/formulas.js).
// P.tree: the nodes you hold (the start node is implied). Points come from character level (formulas.js treePoints); nothing
// else is stored, so a point can't be lost or doubled. P.treeNew: nodes taken since the tree panel was opened, which can always be
// given back (a misclick isn't a respec). A full reset is free in a safe place (canRespec).
import { G, P } from '../core/state.js';
import { TREE, RESPEC } from '../data/tree.js';
import { treeCanTake, treeCanDrop, treePoints } from './formulas.js';
import { dist } from '../core/util.js';
import { roomAt } from '../world/gen.js';
import { recalc } from './stats.js';

export const treeLeft = () => treePoints(P.lvl) - P.tree.length;
export const canTake = id => treeLeft() > 0 && treeCanTake(P.tree, id);
export function take(id) { if (!canTake(id)) return false; P.tree.push(id); P.treeNew.push(id); recalc(); return true; }
// Give back one node: free if you took it since opening the tree, or anywhere a full reset would be free. The rest must stay joined.
export const canDrop = id => treeCanDrop(P.tree, id) && (P.treeNew.includes(id) || canRespec());
export function drop(id) { if (!canDrop(id)) return false; P.tree = P.tree.filter(x => x !== id); P.treeNew = P.treeNew.filter(x => x !== id); recalc(); return true; }

// A safe place for a free full reset: the room you enter the map by, or the rest room (its flame, used or not), with no monster
// awake nearby. Anywhere in the arena (no layout).
export function canRespec() {
  if (G.enemies.some(e => !e.deathT && e.awake && dist(e.x, e.z, P.x, P.z) < RESPEC.calm)) return false;
  const L = G.layout; if (!L) return true;
  const r = roomAt(L, P.x, P.z); if (!r) return false;
  return r.id === roomAt(L, G.start.x, G.start.z)?.id || (!!G.rest && r.id === G.rest.room);
}
export const respecWhere = () => 'the room you enter a map by or a rest room';
export function respec() { if (!canRespec() || !P.tree.length) return false; P.tree = []; P.treeNew = []; recalc(); return true; }

// Spend free points along a preset (data/balance.js TREE_PRESETS: an ordered list of nodes), skipping what you hold or can't reach yet.
export function spendPreset(list) {
  let n = 0;
  for (let again = true; again && treeLeft() > 0;) { again = false; for (const id of list) if (treeLeft() > 0 && canTake(id)) { take(id); n++; again = true; break; } }
  return n;
}
export const nodeName = id => TREE[id] ? TREE[id].n : id;

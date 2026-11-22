// Passive tree logic: which nodes are allocated (P.tree), allocating and refunding with points (P.pts), reset, and the
// summed stats of the allocated nodes. One point per character level (stats.js gainXp). Data and tuning: data/tree.js.
// The start node is always allocated (implicitly; it never costs a point). Respecs are free (data RESPEC).
import { P } from '../core/state.js';
import { TREE, TREE_START } from '../data/tree.js';
import { recalc } from './stats.js';
import { save } from './save.js';
import { dbg } from '../core/dbg.js';

export const isAlloc = id => id === TREE_START || !!P.tree[id];
export const allocatedIds = () => Object.keys(TREE).filter(id => id !== TREE_START && P.tree[id]);
export const spent = () => allocatedIds().length;
const neighbours = id => TREE[id].links;

// Nodes reachable from the start through allocated nodes, optionally pretending `without` is not allocated.
function connected(without) {
  const seen = new Set([TREE_START]), q = [TREE_START];
  while (q.length) for (const l of neighbours(q.pop())) if (!seen.has(l) && l !== without && isAlloc(l)) { seen.add(l); q.push(l); }
  return seen;
}
// Can this node be taken? null when yes, else a sentence for the UI.
export function allocReason(id) {
  if (!TREE[id]) return 'No such node';
  if (isAlloc(id)) return 'Already allocated';
  if (!neighbours(id).some(isAlloc)) return 'Not connected to your tree yet';
  if (P.pts < 1) return 'No points to spend';
  return null;
}
// Can this node be refunded? Only if everything else stays connected to the start.
export function refundReason(id) {
  if (id === TREE_START) return 'The start node stays';
  if (!isAlloc(id)) return 'Not allocated';
  const keep = connected(id);
  if (allocatedIds().some(o => o !== id && !keep.has(o))) return 'Other nodes depend on this one';
  return null;
}
const done = () => { recalc(); save(); return true; };
export function alloc(id) { if (allocReason(id)) return false; P.tree[id] = 1; P.pts--; return done(); }
export function refund(id) { if (refundReason(id)) return false; delete P.tree[id]; P.pts++; return done(); }
// Refund every point (free; the UI asks for a confirm tap first).
export function resetTree() {
  const n = spent(); P.tree = { [TREE_START]: 1 }; P.pts += n; recalc(); save(); return n;
}
// Loaded or migrated trees: drop unknown and disconnected nodes (their points come back), keep the start.
export function sanitizeTree() {
  const t = { [TREE_START]: 1 }; P.tree = P.tree && typeof P.tree === 'object' ? P.tree : {};
  const all = Object.keys(P.tree).filter(id => id !== TREE_START && P.tree[id]), want = all.filter(id => TREE[id]);
  for (let moved = true; moved;) { moved = false; for (const id of want) if (!t[id] && neighbours(id).some(l => t[l])) { t[id] = 1; moved = true; } }
  P.pts += all.length - (Object.keys(t).length - 1); P.tree = t;
}
// Sum of the stats of every allocated non-keystone node, and the keys of the allocated keystones.
export function treeSums() {
  const s = {}, keys = [];
  for (const id of Object.keys(TREE)) {
    if (!isAlloc(id)) continue;
    const n = TREE[id]; for (const [st, v] of Object.entries(n.stats)) s[st] = (s[st] || 0) + v;
    if (n.key) keys.push(n.key);
  }
  return { s, keys };
}

Object.assign(dbg, { TREE, treeAlloc: alloc, treeRefund: refund, treeReset: resetTree, treeAllocReason: allocReason, treeRefundReason: refundReason, treeIsAlloc: isAlloc });

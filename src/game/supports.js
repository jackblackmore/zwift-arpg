// Support gems (workstream D): effects that modify only the skill they are socketed with. A support lives in a socket of the bar slot
// holding its skill (gems.js supportsOf); skill code asks these helpers with its own skill id, combat.js calls onHit / onKill.
// Sub-effects with no gem (Fireball's burning ground, sk 'burn') count as their parent via PARENT in data/supports.js.
// Numbers: data/supports.js. Gem drops (guardian / beat; elites roll in combat.kill) also live here; the pools are data.
import { G } from '../core/state.js';
import { SUP, supVal, PARENT, GEM_DROP, GEM_POOLS, poolOf } from '../data/supports.js';
import { supportsOf } from './gems.js';
import { near } from './enemies.js';
import { dropGem } from './items.js';
import { levelHooks } from './level.js';
import { addTicker } from './tick.js';
import { rand, dist } from '../core/util.js';
import { dbg } from '../core/dbg.js';

export const parentSk = sk => PARENT[sk] || sk;
// The socketed support with this id on a skill (its parent skill for sub-effects): { id, lvl } or null.
export const supOf = (sk, id) => (sk ? supportsOf(parentSk(sk)).find(s => s.id === id) || null : null);
const val = (sk, id, key) => { const s = supOf(sk, id); return s ? supVal(id, key, s.lvl) : 0; };

// Split: extra projectiles for the skill, and the damage multiplier its projectiles carry because of it.
export const projCount = sk => (supOf(sk, 'split') ? SUP.split.extra : 0);
export const projLess = sk => (supOf(sk, 'split') ? 1 - val(sk, 'split', 'less') : 1);
// Pierce: extra enemies a projectile passes through.
export const pierceCount = sk => (supOf(sk, 'pierce') ? Math.round(val(sk, 'pierce', 'n')) : 0);
// Swift Cast: multiplier on the skill's cooldown / attack interval.
export const swiftCd = sk => 1 - val(sk, 'swiftCast', 'cd');
// applyFreeze(e, t, sk): freeze monster e for t seconds on behalf of skill sk (bosses are chilled instead). Every freeze goes
// through here so Shatter can tell which skill froze it (e.freezeSk).
export function applyFreeze(e, t, sk) {
  if (e.deathT) return;
  if (e.ai === 'boss') { e.chill = Math.max(e.chill || 0, t); return; }
  e.freeze = Math.max(e.freeze || 0, t); e.freezeSk = sk;
}

// Called by combat.hit after damage d landed on a living enemy: Ignite (fire hits burn) and Conduit (lightning hits shock, and the shock jumps
// to the nearest other enemy). Damage-over-time ticks (src.dot) never trigger either.
export function onHit(e, d, elem, src) {
  if (!src.sk || src.dot || e.deathT) return;
  if (elem === 'fire') {
    const s = supOf(src.sk, 'ignite');
    if (s) { e.burnT = Math.max(e.burnT, SUP.ignite.dur); e.burnDps = Math.max(e.burnDps, d * supVal('ignite', 'frac', s.lvl)); }
  } else if (elem === 'light') {
    const s = supOf(src.sk, 'conduit');
    if (s) {
      const t = supVal('conduit', 'shockT', s.lvl); e.shock = Math.max(e.shock, t);
      let best = null, bd = supVal('conduit', 'spread', s.lvl);
      near(e.x, e.z, bd, o => { if (o === e || o.deathT) return; const dd = dist(o.x, o.z, e.x, e.z); if (dd < bd) { bd = dd; best = o; } });
      if (best) best.shock = Math.max(best.shock, t);
    }
  }
}
// Called by combat.kill (after a real kill): queues Shatter (an enemy this skill froze) and Chain Reaction (the killing skill's chance).
// The blasts run from combat.processQueue next frame; a Chain Reaction blast's own kills never chain again.
export function onKill(e) {
  if (e.freeze > 0 && e.freezeSk) { const s = supOf(e.freezeSk, 'shatter'); if (s) G.queue.push({ k: 'shatter', x: e.x, z: e.z, hp: e.maxHp * supVal('shatter', 'frac', s.lvl) }); }
  const sk = e.lastSk, s = !e.lastBoom && supOf(sk, 'chainReaction');
  if (s && Math.random() < supVal('chainReaction', 'chance', s.lvl)) G.queue.push({ k: 'boom', x: e.x, z: e.z, sk: parentSk(sk), mult: SUP.chainReaction.mult });
}

// ---- gem drops (dropGem itself is in items.js) ----
// Hooks: the guardian's guaranteed gem at its beat site on level clear, a chance per finished beat.
function installHooks() {
  levelHooks.clear.push(L => { const b = L.beats.find(o => o.type === 'guardian'); if (b) for (let i = 0; i < GEM_DROP.guardian; i++) dropGem(b.x + rand(-1, 1), b.z + rand(-1, 1)); });
  levelHooks.beat.push(b => { if (b.type !== 'guardian' && Math.random() < GEM_DROP.beat) dropGem(b.x + rand(-1, 1), b.z + rand(-1, 1)); });
  installHooks.done = true;
}
// level.js, combat.js and this file import each other, so levelHooks may not exist yet at load time: install now if it does, else on the first tick.
try { installHooks(); } catch (_) { addTicker(() => { if (!installHooks.done) installHooks(); }); }
Object.assign(dbg, { projCount, pierceCount, projLess, applyFreeze, dropGem, supOf, GEM_DROP, GEM_POOLS, SUP });

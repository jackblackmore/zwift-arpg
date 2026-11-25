// Derived stats from level, gear, the passive tree and the skill bar, plus experience and levelling.
import { G, P, S } from '../core/state.js';
import { computeStats as calcStats, gemDps, xpNeedFor, ehp, gearValue } from './formulas.js';
import { PAR_MAIN } from '../data/balance.js';
import { GEMS } from '../data/gems.js';
import { barLevels, barSlots, sockMap, barGem, gemXp, onLevelUp } from './gems.js';
import { $, rand } from '../core/util.js';
import { banner, emit, glows } from '../render/fx.js';
import { SFX } from '../core/audio.js';

// computeStats lives in formulas.js (pure, shared with the balance tools); this wraps it for the current hero, skill bar and sockets.
export const computeStats = (gear, tree = P.tree, lvl = P.lvl) => calcStats(gear, tree, lvl, barLevels(), sockMap(), barSlots());
export function recalc() {
  Object.assign(S, computeStats(P.gear));
  P.life = Math.min(P.life, S.maxLife); P.surge = Math.min(P.surge, S.surgeMax);
}
// The bag's numbers for a set of stats: the Main gem's DPS against a pack (the par Main gem if the slot is empty), life, effective
// life against this map's typical hits (formulas.js ehp: armour and resistances through the real defence maths), move speed,
// armour and resistances. vs: stats to compare with; then `value` is formulas.js gearValue (above ESTIMATE.value.upgrade: an upgrade).
export function estimate(st, vs = null) {
  const g = barGem('main'), id = g ? g.gem : PAR_MAIN, t = G.tier || 1;
  return { dps: gemDps(st, id).packDps, life: st.maxLife, ehp: ehp(st, t), ms: st.ms, gem: GEMS[id].n, armour: st.armour, res: st.res, value: vs ? gearValue(st, vs, id, t) : 1 };
}

export const xpNeed = xpNeedFor;
export function gainXp(n) {
  P.xp += n; gemXp(n);
  while (P.xp >= xpNeed(P.lvl)) {
    P.xp -= xpNeed(P.lvl); P.lvl++; recalc(); P.life = S.maxLife; P.surge = S.surgeMax; P.spent = false;
    banner('LEVEL ' + P.lvl, '#ffd23f', 'A passive tree point · press P'); SFX.lvl();
    onLevelUp(P.lvl - 1);
    for (let i = 0; i < 40; i++) emit(glows, P.x + rand(-.5, .5), rand(0, .5), P.z + rand(-.5, .5), 0, rand(3, 6), 0, rand(.6, 1.1), 0xffd23f);
  }
}

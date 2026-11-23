// Derived stats from level, gear and passives, plus experience and levelling.
import { P, S } from '../core/state.js';
import { computeStats as calcStats, gemDps, xpNeedFor } from './formulas.js';
import { PAR_MAIN } from '../data/balance.js';
import { GEMS } from '../data/gems.js';
import { barLevels, sockMap, barGem, gemXp, onLevelUp } from './gems.js';
import { $, rand } from '../core/util.js';
import { banner, emit, glows } from '../render/fx.js';
import { SFX } from '../core/audio.js';

// computeStats lives in formulas.js (pure, shared with the balance tools); this wraps it for the current hero, skill bar and sockets.
export const computeStats = (gear, passives = P.passives, lvl = P.lvl) => calcStats(gear, passives, lvl, barLevels(), sockMap());
export function recalc() {
  Object.assign(S, computeStats(P.gear));
  P.life = Math.min(P.life, S.maxLife); P.surge = Math.min(P.surge, S.surgeMax);
}
// Rough DPS of the Main gem against a pack (Ember Cleave if the slot is empty), used by the bag to compare items.
export function estimate(st) {
  const g = barGem('main'), id = g ? g.gem : PAR_MAIN;
  return { dps: gemDps(st, id).packDps, life: st.maxLife, ms: st.ms, gem: GEMS[id].n };
}

export const xpNeed = xpNeedFor;
export function gainXp(n) {
  P.xp += n; gemXp(n);
  while (P.xp >= xpNeed(P.lvl)) {
    P.xp -= xpNeed(P.lvl); P.lvl++; P.pts++; recalc(); P.life = S.maxLife; P.surge = S.surgeMax; P.spent = false;
    banner('LEVEL ' + P.lvl, '#ffd23f', 'Passive point gained · press P'); SFX.lvl();
    onLevelUp(P.lvl - 1);
    for (let i = 0; i < 40; i++) emit(glows, P.x + rand(-.5, .5), rand(0, .5), P.z + rand(-.5, .5), 0, rand(3, 6), 0, rand(.6, 1.1), 0xffd23f);
  }
}

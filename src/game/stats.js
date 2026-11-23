// Derived stats from level, gear and passives, plus experience and levelling.
import { P, S } from '../core/state.js';
import { computeStats as calcStats, avgHit, xpNeedFor } from './formulas.js';
import { SK } from '../data/skills.js';
import { GEMS } from '../data/gems.js';
import { barLevels, barGem, gemXp, onLevelUp } from './gems.js';
import { $, rand } from '../core/util.js';
import { banner, emit, glows } from '../render/fx.js';
import { SFX } from '../core/audio.js';

// computeStats lives in formulas.js (pure, shared with the balance tools); this wraps it for the current hero and skill bar.
export const computeStats = (gear, passives = P.passives, lvl = P.lvl) => calcStats(gear, passives, lvl, barLevels());
export function recalc() {
  Object.assign(S, computeStats(P.gear));
  P.life = Math.min(P.life, S.maxLife); P.mana = Math.min(P.mana, S.maxMana);
  $('orbL').classList.toggle('blood', S.blood);
}
// Rough DPS of the Main gem (Fireball if the slot is empty), used by the bag to compare items.
export function estimate(st) {
  const g = barGem('main'), id = g ? g.gem : 'fireball', D = GEMS[id], K = SK[D.sk];
  const rate = D.held ? st.cast / K.cast : 1 / K.cd, extra = id === 'fireball' ? 1 + (st.proj - 1) * .55 : id === 'arc' ? 1 + st.chains * .3 : id === 'frostlance' ? 1.6 : 1;
  return { dps: avgHit(st, K.mult || 1, D.elem, id) * rate * extra, life: st.maxLife, ms: st.ms, gem: D.n };
}

export const xpNeed = xpNeedFor;
export function gainXp(n) {
  P.xp += n; gemXp(n);
  while (P.xp >= xpNeed(P.lvl)) {
    P.xp -= xpNeed(P.lvl); P.lvl++; P.pts++; recalc(); P.life = S.maxLife; P.mana = S.maxMana;
    banner('LEVEL ' + P.lvl, '#ffd23f', 'Passive point gained · press P'); SFX.lvl();
    onLevelUp(P.lvl - 1);
    for (let i = 0; i < 40; i++) emit(glows, P.x + rand(-.5, .5), rand(0, .5), P.z + rand(-.5, .5), 0, rand(3, 6), 0, rand(.6, 1.1), 0xffd23f);
  }
}

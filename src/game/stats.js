// Derived stats from level, gear and passives, plus experience and levelling.
import { P, S } from '../core/state.js';
import { PASS } from '../data/passives.js';
import { $, rand } from '../core/util.js';
import { banner, emit, glows } from '../render/fx.js';
import { SFX } from '../core/audio.js';

export function computeStats(gear) {
  const s = { lifeF: 0, lifePct: 0, manaF: 0, lregen: 0, mregen: 0, dmg: 0, fire: 0, cold: 0, light: 0, cast: 0, ms: 0, crit: 0, aoe: 0, proj: 0, chains: 0, lok: 0, mok: 0, spell: 0, pierce: 0, dashCh: 0, freeze: 0, dr: 0 };
  for (const k in gear) { const it = gear[k]; if (it) for (const [st, v] of it.mods) s[st] = (s[st] || 0) + v; }
  for (const id in P.passives) if (PASS[id]) PASS[id].fn(s, P.passives[id]);
  return {
    maxLife: Math.max(20, Math.round((90 + 12 * (P.lvl - 1) + s.lifeF) * (1 + s.lifePct))), maxMana: Math.round(60 + 5 * (P.lvl - 1) + s.manaF),
    lregen: 1 + s.lregen, mregen: 7 + s.mregen, base: 9 + 2.4 * (P.lvl - 1) + s.spell, dmg: 1 + s.dmg, fire: s.fire, cold: s.cold, light: s.light,
    cast: 1 + s.cast, ms: 5.4 * (1 + s.ms), crit: .05 + s.crit, aoe: 1 + s.aoe, proj: 1 + s.proj, chains: 3 + s.chains, lok: s.lok, mok: s.mok, pierce: s.pierce,
    dashMax: 1 + s.dashCh, freeze: 1 + s.freeze, dr: Math.min(.6, s.dr), blood: !!s.blood, ignite: !!s.ignite, shatter: !!s.shatter, conduit: !!s.conduit, chainboom: !!s.chainboom,
    burnGround: !!s.burnGround, storm: !!s.storm, autoNova: !!s.autoNova,
  };
}
export function recalc() {
  Object.assign(S, computeStats(P.gear));
  P.life = Math.min(P.life, S.maxLife); P.mana = Math.min(P.mana, S.maxMana); P.dashCh = Math.min(P.dashCh, S.dashMax);
  $('orbL').classList.toggle('blood', S.blood);
}
// Rough Fireball DPS, used by the bag to compare items.
export function estimate(st) { const h = st.base * (st.dmg + st.fire) * (1 + st.crit * .75); return { dps: h * st.cast / .4 * (1 + (st.proj - 1) * .55), life: st.maxLife, ms: st.ms }; }

export const xpNeed = l => Math.round(40 * Math.pow(l, 1.55));
export function gainXp(n) {
  P.xp += n;
  while (P.xp >= xpNeed(P.lvl)) {
    P.xp -= xpNeed(P.lvl); P.lvl++; P.pts++; recalc(); P.life = S.maxLife; P.mana = S.maxMana;
    banner('LEVEL ' + P.lvl, '#ffd23f', 'Passive point gained · press P'); SFX.lvl();
    for (let i = 0; i < 40; i++) emit(glows, P.x + rand(-.5, .5), rand(0, .5), P.z + rand(-.5, .5), 0, rand(3, 6), 0, rand(.6, 1.1), 0xffd23f);
  }
}

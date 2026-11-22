import { S, hero, ride } from '../core/state.js';
import { rand, pick } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { RMAG, NAMES, PRE } from '../data/combat.js';
import { toast } from '../render/fx.js';
import { renderGear } from '../ui/hud.js';
import { addGold, maxHp } from './stats.js';

export function rollItem(bonus = 0) {
  const r = Math.random() + bonus;
  const rar = r > 1.1 ? 3 : r > .88 ? 2 : r > .55 ? 1 : 0;
  const slot = pick(['weapon', 'armor', 'relic']), mag = RMAG[rar] * (1 + .25 * (S.floorN - 1)) * rand(.85, 1.15);
  const name = rar === 3 ? pick(NAMES[slot].leg) : `${pick(PRE[rar])} ${pick(NAMES[slot].base)}`;
  const it = { slot, rar, name };
  if (slot === 'weapon') { it.dmg = .12 * mag; it.desc = `+${Math.round(it.dmg * 100)}% dmg`; it.score = it.dmg; }
  if (slot === 'armor') { it.hp = Math.round(14 * mag); it.def = .035 * mag; it.desc = `+${it.hp} hp, ${Math.round(it.def * 100)}% armour`; it.score = it.hp / 120 + it.def; }
  if (slot === 'relic') { it.crit = .025 * mag; it.as = .05 * mag; it.desc = `+${Math.round(it.crit * 100)}% crit, +${Math.round(it.as * 100)}% atk spd`; it.score = it.crit + it.as; }
  return it;
}
export function giveLoot(bonus) {
  const it = rollItem(bonus), cur = hero.gear[it.slot];
  SFX.loot(it.rar);
  if (!ride.best || it.rar > ride.best.rar || (it.rar === ride.best.rar && it.score > ride.best.score)) ride.best = it;
  if (!cur || it.score > cur.score) {
    hero.gear[it.slot] = it;
    if (it.slot === 'armor') hero.hp = Math.min(maxHp(), hero.hp + it.hp);
    toast(`<span class="r${it.rar}">${it.name}</span> · ${it.desc} · equipped`);
  } else { const g = addGold(8 * (it.rar + 1) * S.floorN); toast(`<span class="r${it.rar}">${it.name}</span> · salvaged for ${g} gold`); }
  renderGear();
}

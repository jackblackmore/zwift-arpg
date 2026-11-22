// Derived hero stats: how power, cadence, gear and boons turn into combat numbers.
import { S, hero, ride } from '../core/state.js';
import { clamp } from '../core/util.js';
import { rider } from '../input/rider.js';

export const has = k => hero.boons.includes(k);
export const dieselBonus = () => has('diesel') ? Math.min(.4, Math.floor(hero.dieselT / 8) * .04) : 0;
export const metroOn = () => has('metronome') && hero.metT >= 15;
export const goldMul = () => has('fever') ? 1.5 : 1;
export function addGold(g) { g = Math.round(g * goldMul()); S.gold += g; ride.goldEarned += g; return g; }

export const gearV = (slot, k) => hero.gear[slot] ? hero.gear[slot][k] || 0 : 0;
export const maxHp = () => 100 + gearV('armor', 'hp');
export const defense = () => Math.min(.6, gearV('armor', 'def'));
export const rel = () => hero.pow / S.ftp;
export const exhausted = () => hero.wbal <= 0;
export const critChance = () => .05 + gearV('relic', 'crit') + (rel() >= 1.06 && !exhausted() ? .3 : 0);
export const atkRate = () => 1.05 * (.65 + rider.cad / 150) * (1 + gearV('relic', 'as')) * (metroOn() ? 1.3 : 1);
export const baseDmg = () => 12 * (1 + gearV('weapon', 'dmg')) * (1 + .06 * hero.str) * (.85 + .3 * clamp(rel(), 0, 1.5)) * (1 + dieselBonus()) * (has('spark') && rel() >= 1.5 ? 3 : 1);
export const floorScale = () => 1 + .4 * (S.floorN - 1);

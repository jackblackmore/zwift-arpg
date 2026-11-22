// Skill tuning. `mult` is a multiplier on the player's base spell damage (see game/stats.js).
// Skills use cooldowns, not mana. Flex / Guard / Evade cooldowns are `cd * (1 - S.cdr)`.
// Main is paced by attack rate instead: `rate / (S.cast * P.eff.atk)` seconds between attacks.
export const SK = {
  // range: auto-target range for Main (world units). rate: base seconds between Main attacks.
  fireball: { range: 10, rate: .42, speed: 17, life: .8, spread: .17, pierceMult: .8, radius: 1.9 },
  arc: { mult: .9, range: 11, chainRange: 5.5, shockChance: .3, shockT: 3, chains: 3 }, // only cast for free (Heart of the Storm)
  nova: { cd: 6, radius: 4.2, mult: 1.4, freeze: 1.3 },
  ward: { cd: 12, absorb: .35, dur: 5, radius: 1.25 }, // absorbs `absorb` x max life for `dur` seconds
  blink: { cd: 5, range: 6.5, invuln: .35, threat: 9, tries: 16, minRange: 3 },
  burn: { mult: .22, tick: .25, life: 2.4 },
  flask: { heal: .6, dur: 2.5, max: 3, perKill: .1, perRare: 1 },
};
// Default skill bar: slot -> skill id.
export const BAR = { main: 'fireball', flexA: 'nova', guard: 'ward', evade: 'blink' };
export const SLOT_ORDER = ['main', 'flexA', 'guard', 'evade'];
export const CDR_CAP = .4; // maximum cooldown reduction

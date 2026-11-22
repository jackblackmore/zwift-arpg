// Skill tuning. `mult` is a multiplier on the player's base spell damage (see game/stats.js).
// Skills use cooldowns, not mana. Flex / Guard / Evade cooldowns are `cd * (1 - S.cdr)` (a skill with no cd uses its `rate`).
// Main is paced by attack rate instead: `rate / (S.cast * P.eff.atk)` seconds between attacks.
// The slot rules and gems live in data/gems.js.
export const SK = {
  // range: auto-target range for Main (world units). rate: base seconds between Main attacks.
  fireball: { range: 10, rate: .42, speed: 17, life: .8, spread: .17, pierceMult: .8, radius: 1.9 },
  nova: { cd: 6, radius: 4.2, mult: 1.4, freeze: 1.3 },
  ward: { cd: 12, absorb: .35, dur: 5, radius: 1.25 }, // absorbs `absorb` x max life for `dur` seconds
  blink: { cd: 5, range: 6.5, invuln: .35, threat: 9, tries: 16, minRange: 3 },
  burn: { mult: .22, tick: .25, life: 2.4 },
  // --- C1 skills (Frost Lance, Raise Skeletons, Bone Armour, Decoy) ---
  frostLance: { rate: .9, mult: 2.2, range: 11, speed: 20, life: .7 },
  skeletons: { cd: 10, range: 9 },
  boneArmour: { cd: 14 },
  decoy: { cd: 12 },
  // --- end C1 skills ---
  // --- C2 skills (Flame Totem, Arc, Meteor, Ice Trap, Corpse Explosion) ---
  // arc has a rate and no cd so that Main paces it quickly (castSlot uses cd before rate); in a Flex slot that is its cooldown too.
  arc: { rate: .7, mult: .9, range: 11, chainRange: 5.5, shockChance: .3, shockT: 3, chains: 3 }, // also cast free by Heart of the Storm
  // totem: plants `plant` ahead toward the aim point, lasts `life` s, hp = hpFrac x max life; fires a bolt every `rate` s at range
  flameTotem: { cd: 8, range: 10, plant: 2.5, life: 10, hpFrac: .6, rate: .5, mult: .45, speed: 15, boltLife: .9, r: .5 },
  // meteor: telegraph circle for `delay` s, then a radius x S.aoe blast and burning ground (patch = share of radius, patchT seconds)
  meteor: { cd: 9, range: 12, delay: 1, radius: 3.2, mult: 4.5, packR: 3, patch: .75, patchT: 4 },
  // trap: thrown to a spot, arms after `arm` s, bursts when an enemy is within `trigger`; max `max` out, each lasts `life` s
  iceTrap: { cd: 2.5, range: 10, arm: .6, life: 20, max: 3, trigger: 1.3, radius: 3.4, mult: 1.6, freeze: 2 },
  // corpse explosion: mult x gem base + frac x the corpse's max hp, radius x S.aoe; aimR = how close to the aim point a corpse must be
  corpseExplosion: { cd: 5, range: 10, mult: 1.2, frac: .6, radius: 3.2, aimR: 3.5 },
  // --- end C2 skills ---
  flask: { heal: .6, dur: 2.5, max: 3, perKill: .1, perRare: 1 },
};
export const MAIN_RANGE = 8; // Main's range when its skill defines none (and with nothing in Main)
// Blood Rite keystone (S.bloodRite): Flex / Guard / Evade casts cost life instead of cooldown:
// life cost = bloodRite x max life x (skill cd, or rate) / cdRef.
export const BLOOD = { cdRef: 6 };
export const CDR_CAP = .4; // maximum cooldown reduction

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
  // Frost Lance: a slow, heavy, long-range single-target lance. rate: seconds between shots (Main) / cooldown (Flex). mult: x gem base + flat
  // spell (about 3.5x a Fireball hit). speed/life: flight (range ~ speed x life). chill: seconds of half speed on what it hits.
  // frozenMult: damage multiplier on frozen enemies once the gem has its lv10 milestone. spread: fan angle with Split.
  frostLance: { rate: .9, mult: 2.2, range: 13, speed: 26, life: .65, chill: 2.5, spread: .17, hitR: .45, frozenMult: 2 },
  // Raise Skeletons: rate paces Main (one raise per `rate` s while below the cap) and the Flex cooldown (a Flex cast raises up to the cap).
  // cap: army size at lv1 (+ the lv10 milestone). life: seconds a skeleton lasts. hp: x max life. spd: move speed. mult/swing/reach: its hit.
  // engage: how far from the hero it will chase a monster; leash: it drops the chase when the hero is further than this; warp: it
  // teleports to the hero beyond this. follow: formation radius round the hero when idle. range: autopilot standoff (hang back behind the army).
  skeletons: { rate: 1.6, range: 7, cap: 3, life: 20, hp: .5, spd: 4.8, mult: 1, swing: .95, reach: .5, engage: 12, leash: 17, warp: 26, follow: 2.4, r: .38, height: 1.7, rise: .7, hpMile: 2 },
  // Bone Armour: plates each stop one whole hit; thorn = damage back as a multiple of the blocked hit (at least minThorn x spell damage).
  boneArmour: { cd: 14, dur: 8, plates: 3, thorn: 1.5, minThorn: 3, orbit: 1.15, spin: 2.2, thornMile: 2 },
  // Decoy: a dummy that draws every monster within tauntR (bosses ignore it). hp: x max life. forward: how far toward the nearest pack it lands.
  // burst: radius and hit (x its max life) when it ends, once the gem has its lv5 milestone.
  decoy: { cd: 12, dur: 6, hp: 2.5, r: .5, tauntR: 9, forward: 3, packRange: 15, burstR: 3.6, burstF: .5, hpMile: 2 },
  // --- end C1 skills ---
  // --- C2 skills (Flame Totem, Arc, Meteor, Ice Trap, Corpse Explosion) ---
  arc: { cd: 4, rate: .6, mult: .9, range: 11, chainRange: 5.5, shockChance: .3, shockT: 3, chains: 3 }, // also cast free by Heart of the Storm
  flameTotem: { cd: 8, range: 10 },
  meteor: { cd: 9, range: 12 },
  iceTrap: { cd: 7, range: 10 },
  corpseExplosion: { cd: 5, range: 10 },
  // --- end C2 skills ---
  flask: { heal: .6, dur: 2.5, max: 3, perKill: .1, perRare: 1 },
};
export const MAIN_RANGE = 8; // Main's range when its skill defines none (and with nothing in Main)
// Blood Rite keystone (S.bloodRite): Flex / Guard / Evade casts cost life instead of cooldown:
// life cost = bloodRite x max life x (skill cd, or rate) / cdRef.
export const BLOOD = { cdRef: 6 };
export const CDR_CAP = .4; // maximum cooldown reduction

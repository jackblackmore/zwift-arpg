// Skill tuning. `mult` is a multiplier on the player's base spell damage (see game/stats.js).
export const SK = {
  fireball: { cost: 6, cast: .4, speed: 17, life: .8, spread: .17, pierceMult: .8, radius: 1.9 },
  arc: { cost: 9, cast: .5, mult: .9, range: 11, chainRange: 5.5, shockChance: .3, shockT: 3 },
  nova: { cost: 14, cd: 2.2, radius: 4.2, mult: 1.4, freeze: 1.3 },
  dash: { cost: 6, range: 7.5, recharge: 1.5, patchEvery: 1.1, invuln: .3 },
  burn: { mult: .22, tick: .25, life: 2.4 },
  flask: { heal: .6, dur: 2.5, max: 3, perKill: .1, perRare: 1 },
};

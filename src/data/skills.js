// Skill tuning, one entry per skill gem (data/gems.js `sk`). `mult` scales the hit: (gem base + flat spell from gear) × mult (game/formulas.js).
export const SK = {
  fireball: { cost: 7, cast: .55, speed: 17, life: .8, spread: .17, pierceMult: .8, radius: 1.9 },
  arc: { cost: 10, cast: .6, mult: .9, range: 11, chainRange: 5.5, shockChance: .3, shockT: 3 },
  nova: { cost: 18, cd: 6, radius: 4.2, mult: 1.4, freeze: 1.3 },
  // Magic Shield: absorbs `absorb` × max life (more with shieldPct) for `dur` seconds. The starting Guard skill.
  shield: { cost: 15, absorb: .35, dur: 5, cd: 10 },
  // Flame Dash: the first Evade gem (level 8 shrine). Charges recharge one at a time.
  dash: { cost: 8, range: 7.5, recharge: 4, patchEvery: 1.1, invuln: .3 },
  burn: { mult: .22, tick: .25, life: 2.4 },
  flask: { heal: .6, dur: 2.5, max: 3, perKill: .1, perRare: 1 },
};

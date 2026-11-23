// Skill tuning, one entry per skill gem (data/gems.js `sk`). `mult` scales the hit: (gem base + flat spell from gear) × mult (game/formulas.js).
// Milestone and support numbers live with the gem in data/gems.js (`mile`, SUPPORTS).
export const SK = {
  fireball: { cost: 7, cast: .55, speed: 17, life: .8, spread: .17, pierceMult: .8, radius: 1.9 },
  // Frost Lance: slow, fast-flying, pierces `pierce` enemies (more at level 5) and chills for `chill` seconds.
  frostlance: { cost: 11, cast: 1.1, mult: 1.75, speed: 34, life: .75, pierce: 3, chill: 2.5, bot: { range: 14 } },
  // Arc: shocks `shockChance` of the time for `shockT` s; shocked enemies take `shockMore` more damage from everything.
  arc: { cost: 10, cast: .6, mult: .9, range: 11, chainRange: 5.5, shockChance: .3, shockT: 3, shockMore: .2 },
  // Frost Nova: freezes for `freeze` s (× freeze duration); guardians can't be frozen and are chilled for `bossChill` s instead.
  nova: { cost: 18, cd: 6, radius: 4.2, mult: 1.4, freeze: 1.3, bossChill: 3, bot: { crowd: 2 } },
  // Flame Totem: lasts `dur` s, a bolt every `interval` s at the nearest monster within `range` of the totem; placed within `place` of you.
  totem: { cost: 18, cd: 9, dur: 6, interval: .45, mult: .5, range: 9, place: 9, bot: { range: 9, crowd: 1 } },
  // Meteor: lands `delay` s after the cast, within `range`; hits `radius`, leaves burning ground for `burn` s.
  meteor: { cost: 24, cd: 10, delay: .8, mult: 1.7, radius: 2.6, range: 13, burn: 3, bot: { range: 9, crowd: 2 } },
  // Raise Skeletons: each cast raises one minion (game/sk/skeletons.js); at the cap a recast replaces the most hurt one if it's below `replace` life (else it does nothing, free).
  //   cap: skeletons at once, +1 for each gem level in capAt (more from the level 5 milestone and Bigger Army). life: at gem level 1, × lifeGrow per level.
  //   Hits are `mult` × the gem's base (physical: only generic % damage applies), every `atk` seconds after a `windup` (both faster with cast speed).
  //   They rise up to `raiseAt` toward your aim, can't act for `riseT` of their rise clip, chase awake monsters within `leash` of you, return when you're `leash` + 2 away, and jump back to you beyond `warp`.
  skeletons: {
    cost: 9, cd: .3, replace: .6, cap: 3, capAt: [8], life: 45, lifeGrow: 1.06, mult: 1.05, atk: 1.05, windup: .28, reach: .7, spd: 5.6, r: .32, h: 1.45, raiseAt: 3, riseT: .5,
    leash: 10, follow: 2.2, warp: 24, bot: { range: 14 },
    look: { kind: 'minion', weapon: 'blade', tint: 0xb8ffd8, glow: 0x0c3a26, walk: 'Running_A', idle: 'Skeletons_Idle', rise: 'floor',
      attacks: [['Melee_1H_Attack_Chop', 1.9], ['Melee_1H_Attack_Stab', 1.9], ['Melee_1H_Attack_Slice_Diagonal', 1.8]] },
    model: { col: 0x9adfc0, head: 0xd8ffe8, eye: 0x40ffb0, scale: .8 },
  },
  // Magic Shield: absorbs `absorb` × max life (more with shieldPct) for `dur` seconds. The starting Guard skill.
  shield: { cost: 15, absorb: .35, dur: 5, cd: 10 },
  // Flame Dash: the first Evade gem (level 8 shrine). Gems with `charges` hold that many casts, recharging one per `recharge` seconds.
// Optional `bot: { range, crowd }` tells the arena bot when to use a Flex or Main press gem: an enemy within `range` (default: radius or range, else 9), `crowd` of them (default 1).
  // Flame Dash leaves a patch of burning ground (radius patchR) every patchEvery units.
  dash: { cost: 8, charges: 1, range: 7.5, recharge: 4, patchEvery: 1.1, patchR: .95, invuln: .3 },
  // Blink: teleports `range` away from the nearest threat (its milestone's frost burst is in data/gems.js).
  blink: { cost: 10, charges: 2, range: 6.5, recharge: 5, invuln: .45 },
  // Frost Ward: radius, duration, cold damage per tick, and `dr` less damage taken for you. Monsters inside stay chilled (`chill` s, topped up every tick).
  ward: { cost: 18, cd: 12, radius: 4, dur: 5, tick: .5, mult: .12, dr: .3, chill: .35 },
  // Burning ground (Flame Dash, Meteor, Wattbringer): `mult` × the gem's base every `tick` s, lasting `life` s.
  burn: { mult: .22, tick: .25, life: 2.4 },
  flask: { heal: .6, dur: 2.5, max: 3, perKill: .1, perRare: 1 },
};

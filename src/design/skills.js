// SKILLS. Four active slots + Flame Dash + flask (fits the Zwift Ride: A, B, Z, Y-hold, shifters).
//
// dmg: average hit at skill level 1, by damage type. growth: damage × (1 + growth) per skill level.
// eff: "added damage effectiveness", how much of flat added damage from gear the skill gets (1 = all).
// cast: seconds per cast at 0% cast speed. cost: mana at level 1, × (1 + costGrowth) per level.
// crit: base critical strike chance. cd: cooldown seconds (0 = none).
// targets: how many monsters one cast hits in a typical pack (for the clear-speed sim), and
//   single: hits on one target (a boss) per cast, e.g. Frost Nova 1, three Fireballs into a boss ~1.6.
// tags: which 'inc' stats apply (stats.js `tag`). shape: game behaviour numbers (radius, speed...), the rules code reads these.
// unlock: where you get it (areas.js reward ids).

export const SKILLS = {
  fireball: {
    name: 'Fireball', tags: ['spell', 'proj', 'aoe'], dmg: { fire: 11 }, growth: .175, eff: 1, cast: .4, cost: 5, costGrowth: .05, crit: .06,
    targets: 2.6, single: 1, unlock: 'start',
    shape: { speed: 17, life: .8, radius: 1.9, spread: .17, pierceMult: .8 },
    about: 'Projectile that explodes in an area. The workhorse.',
  },
  arc: {
    name: 'Arc', tags: ['spell', 'chain'], dmg: { light: 9 }, growth: .17, eff: .8, cast: .5, cost: 9, costGrowth: .05, crit: .05,
    targets: 3.2, single: 1, unlock: 'act1.ossuary',
    shape: { range: 11, chains: 2, chainRange: 5.5, shockChance: .3, shockT: 3 },
    about: 'Lightning that chains between enemies. Great in tight packs, weak on bosses.',
  },
  frostNova: {
    name: 'Frost Nova', tags: ['spell', 'aoe'], dmg: { cold: 16 }, growth: .17, eff: 1.2, cast: .55, cost: 14, costGrowth: .05, crit: .05, cd: 2.2,
    targets: 4, single: 1, unlock: 'act1.vault',
    shape: { radius: 4.2, freeze: 1.3 },
    about: 'Freezing burst around you. The "get off me" button.',
  },
  iceSpear: {
    name: 'Ice Spear', tags: ['spell', 'proj'], dmg: { cold: 13 }, growth: .18, eff: 1, cast: .6, cost: 8, costGrowth: .05, crit: .09,
    targets: 1.6, single: 1, unlock: 'act1.boss',
    shape: { speed: 26, pierce: 2, critBonusAfterPierce: 1 },
    about: 'Fast piercing shard with high crit. The single-target cold option.',
  },
  firewall: {
    name: 'Firewall', tags: ['spell', 'aoe', 'dot'], dmg: { fire: 8 }, growth: .17, eff: .5, cast: .6, cost: 12, costGrowth: .05, crit: 0,
    targets: 3, single: 2.5, unlock: 'act2.bog',
    shape: { length: 7, dur: 4, tick: .25 },
    about: 'A line of fire that burns everything crossing it. Ride-friendly: drop it and kite.',
  },
  ballLightning: {
    name: 'Ball Lightning', tags: ['spell', 'proj', 'aoe'], dmg: { light: 4 }, growth: .17, eff: .4, cast: .7, cost: 15, costGrowth: .05, crit: .05,
    targets: 3, single: 4, unlock: 'act2.witchfen',
    shape: { speed: 4, life: 2.5, zapEvery: .15, radius: 2.2 },
    about: 'Slow orb that zaps everything near it many times.',
  },
  raiseSkeleton: {
    name: 'Raise Skeleton', tags: ['spell', 'minion'], dmg: { phys: 7 }, growth: .17, eff: 0, cast: .8, cost: 18, costGrowth: .08, crit: .05,
    targets: 1.5, single: 3, unlock: 'act2.boss',
    shape: { maxMinions: 4, minionLife: 2.2, attack: 1.1 },
    about: 'Summons skeletons to fight for you (your crypt, your rules). Opens a minion build.',
  },
  meteor: {
    name: 'Meteor', tags: ['spell', 'aoe'], dmg: { fire: 40, phys: 12 }, growth: .18, eff: 2, cast: 1.2, cost: 30, costGrowth: .05, crit: .07, cd: 4,
    targets: 4.5, single: 1, unlock: 'act3.tower',
    shape: { delay: .9, radius: 3.4 },
    about: 'Huge, slow, telegraphed. Big numbers on bosses.',
  },
  stormBrand: {
    name: 'Storm Brand', tags: ['spell', 'chain'], dmg: { light: 7 }, growth: .17, eff: .6, cast: .5, cost: 10, costGrowth: .05, crit: .06,
    targets: 2.2, single: 2.4, unlock: 'act3.market',
    shape: { maxBrands: 3, dur: 4, tick: .4, chains: 1 },
    about: 'Sticks to an enemy and zaps nearby foes. Jumps to a new host when it dies.',
  },
  bladeVortex: {
    name: 'Blade Vortex', tags: ['spell', 'aoe'], dmg: { phys: 5 }, growth: .17, eff: .35, cast: .45, cost: 8, costGrowth: .05, crit: .06,
    targets: 3, single: 5, unlock: 'act3.boss',
    shape: { maxBlades: 10, radius: 2.4, hitEvery: .6, dur: 5 },
    about: 'Stacking spinning blades around you. Perfect while pedalling: just keep moving.',
  },
};

// Flame Dash is fixed on the shifter, not a slot.
export const DASH = { cost: 6, range: 7.5, charges: 1, recharge: 1.5, invuln: .3, burn: { dmg: { fire: 3 }, growth: .17, tick: .25, dur: 2.4 } };

// Ailments (all skills).
export const AILMENTS = {
  ignite: { dur: 4, ofHit: .9 },        // ignite deals 90% of the hit's fire damage over 4s
  freeze: { minHit: .05, baseDur: 1 },   // a cold hit dealing at least 5% of a monster's life can freeze it
  shock: { more: .2, dur: 3 },           // shocked enemies take 20% more damage
};

// RUNES: each skill has 2 rune slots (opening at skill level 5 and 15). Runes drop as items (loot.js) and are reusable.
// mods: stats added to that skill only (stats.js ids). Where a rune trades damage for shape, it's a 'dmgMore' below 0.
// clear: multiplier on the skill's `targets` in the clear sim; single: on `single`.
export const RUNES = {
  multiProj:  { name: 'Rune of Many', for: ['proj'], mods: [['proj', 2], ['dmgMore', -.25]], clear: 1.6, single: 1.15, dropLevel: 6 },
  pierce:     { name: 'Rune of Piercing', for: ['proj'], mods: [['pierce', 2], ['projDmgInc', .2]], clear: 1.35, single: 1, dropLevel: 4 },
  concentrate:{ name: 'Rune of Focus', for: ['aoe'], mods: [['aoeInc', -.3], ['dmgMore', .3]], clear: .85, single: 1, dropLevel: 8 },
  widen:      { name: 'Rune of Reach', for: ['aoe'], mods: [['aoeInc', .35], ['dmgMore', -.1]], clear: 1.3, single: 1, dropLevel: 3 },
  fork:       { name: 'Rune of Forking', for: ['chain', 'proj'], mods: [['chains', 2]], clear: 1.4, single: 1, dropLevel: 10 },
  added:      { name: 'Rune of Embers', for: ['spell'], mods: [['dmgMore', .22]], clear: 1, single: 1, dropLevel: 1, note: 'Adds fire damage equal to 22% of the hit' },
  haste:      { name: 'Rune of Haste', for: ['spell'], mods: [['castInc', .25], ['dmgMore', -.05]], clear: 1, single: 1, dropLevel: 5 },
  echo:       { name: 'Rune of Echoes', for: ['spell'], mods: [['castInc', .7], ['dmgMore', -.3]], clear: 1, single: 1, dropLevel: 22, note: 'Casts repeat once' },
  elemFocus:  { name: 'Rune of Purity', for: ['spell'], mods: [['dmgMore', .3], ['noCrit', 1]], clear: 1, single: 1, dropLevel: 28, note: 'More damage, no ailments' },
  penetrate:  { name: 'Rune of Piercing Cold', for: ['spell'], mods: [['pen', .25]], clear: 1, single: 1, dropLevel: 30 },
  totem:      { name: 'Rune of the Totem', for: ['spell'], mods: [['dmgMore', -.2], ['castInc', -.1]], clear: 1, single: 1, dropLevel: 14, note: 'A totem casts the skill for you; you can keep riding' },
  ignite:     { name: 'Rune of Kindling', for: ['spell'], mods: [['igniteChance', .4], ['ailmentInc', .3]], clear: 1, single: 1, dropLevel: 12 },
  crit:       { name: 'Rune of Precision', for: ['spell'], mods: [['critInc', .8], ['critMulti', .3]], clear: 1, single: 1, dropLevel: 18 },
};

// PASSIVE TREE. One point per level + quest points (70 by level 60). The tree has ~100 nodes (the balance report counts them),
// so a build takes about 70% of it and has to choose.
//
// The tree is a hub (CORE) with six wings. Each wing is a list of paths leading out from the hub; each path is a list of
// nodes in order (you must take them in order). 's' is a small node using the wing's `small` stats; any other string is
// a notable or keystone id from NOTABLES / KEYSTONES. The layout (positions on screen) is generated from this structure.

export const WINGS = {
  core: {
    name: 'Heart', col: '#e6dcc6',
    small: [['life', 8], ['mana', 6]],
    paths: [
      ['s', 's', 'vitalSpark', 's', 's', 'bloodMagic'],
      ['s', 's', 'clarity', 's', 's', 'heartbeat'],
    ],
  },
  fire: {
    name: 'Pyre', col: '#ff8a3c', small: [['fireInc', .1]],
    paths: [
      ['s', 's', 's', 'twinFlame', 's', 's', 'searingLance'],
      ['s', 's', 'ignite', 's', 's', 'chainReaction', 's', 'heartOfFlame'],
      ['s', 's', 'kindled'],
    ],
  },
  cold: {
    name: 'Rime', col: '#7fd8ff', small: [['coldInc', .1]],
    paths: [
      ['s', 's', 's', 'rime', 's', 's', 'shatter'],
      ['s', 's', 'iceLance', 's', 's', 'deepFreeze', 's', 'winterHeart'],
      ['s', 's', 'glacial'],
    ],
  },
  light: {
    name: 'Storm', col: '#c98bff', small: [['lightInc', .1]],
    paths: [
      ['s', 's', 's', 'forkedSky', 's', 's', 'conduit'],
      ['s', 's', 'staticFlow', 's', 's', 'overcharge', 's', 'eyeOfStorm'],
      ['s', 's', 'thunderous'],
    ],
  },
  ward: {
    name: 'Bulwark', col: '#9ab0c0', small: [['life', 10], ['armourInc', .08]],
    paths: [
      ['s', 's', 'ironSkin', 's', 's', 'prismatic', 's', 'unbroken'],
      ['s', 'windDancer', 's', 's', 'mindOverMatter'],
      ['s', 's', 'elementalWard', 's'],
    ],
  },
  rider: {
    name: 'Rider', col: '#5fe39a', small: [['castInc', .03], ['ms', .02]],
    paths: [
      ['s', 's', 'secondWind', 's', 's', 'cadence'],
      ['s', 's', 'soulHunger', 's', 'longHaul'],
    ],
  },
  bone: {
    name: 'Ossuary', col: '#e6dfcc', small: [['minionInc', .12]],
    paths: [['s', 's', 'boneLegion', 's', 's', 'gravewalker', 's', 'necromancer']],
  },
};

// Notables: bigger nodes on the paths. Skill-shaping notables carry `effect` text for the rules code.
export const NOTABLES = {
  vitalSpark:   { name: 'Vital Spark', mods: [['lifeInc', .1], ['mana', 20]] },
  clarity:      { name: 'Clarity', mods: [['manaRegenInc', .3], ['mana', 20]] },
  heartbeat:    { name: 'Heartbeat', mods: [['lifeRegenPct', .008], ['life', 20]] },
  kindled:      { name: 'Kindled', mods: [['fireInc', .2], ['castInc', .05]] },
  glacial:      { name: 'Glacial', mods: [['coldInc', .2], ['durInc', .1]] },
  thunderous:   { name: 'Thunderous', mods: [['lightInc', .2], ['critInc', .2]] },
  elementalWard:{ name: 'Elemental Ward', mods: [['allRes', .08], ['life', 20]] },
  twinFlame:    { name: 'Twin Flame', mods: [['proj', 1], ['fireInc', .1]] },
  searingLance: { name: 'Searing Lance', mods: [['pierce', 1], ['projDmgInc', .2]] },
  ignite:       { name: 'Ignite', mods: [['igniteChance', .3], ['ailmentInc', .2]] },
  chainReaction:{ name: 'Chain Reaction', mods: [['fireInc', .15]], effect: 'Enemies killed by fire have a 30% chance to explode' },
  rime:         { name: 'Rime', mods: [['coldInc', .2], ['freezeChance', .15], ['durInc', .15]] },
  shatter:      { name: 'Shatter', mods: [['coldInc', .1]], effect: 'Frozen enemies explode on death, freezing and damaging foes nearby' },
  iceLance:     { name: 'Ice Lance', mods: [['critInc', .4], ['coldInc', .1]] },
  deepFreeze:   { name: 'Deep Freeze', mods: [['freezeChance', .2], ['critMulti', .2]] },
  forkedSky:    { name: 'Forked Sky', mods: [['chains', 2]] },
  conduit:      { name: 'Conduit', mods: [['shockChance', 1]], effect: 'Shocked enemies take 35% more damage instead of 20%' },
  staticFlow:   { name: 'Static Flow', mods: [['castInc', .08], ['lightInc', .1]] },
  overcharge:   { name: 'Overcharge', mods: [['critMulti', .3], ['shockChance', .2]] },
  ironSkin:     { name: 'Iron Skin', mods: [['armourInc', .3], ['life', 25]] },
  prismatic:    { name: 'Prismatic Ward', mods: [['allRes', .12]] },
  windDancer:   { name: 'Wind Dancer', mods: [['evasionInc', .4], ['ms', .04]] },
  secondWind:   { name: 'Second Wind', mods: [['flaskEffect', .25], ['flaskCharges', .3]] },
  soulHunger:   { name: 'Soul Hunger', mods: [['lifeOnKill', 6], ['manaOnKill', 3]] },
  boneLegion:   { name: 'Bone Legion', mods: [['minionInc', .2]], effect: '+1 maximum skeleton' },
  gravewalker:  { name: 'Gravewalker', mods: [['minionInc', .15]], effect: 'Minions have 30% increased life and move speed' },
};

// Keystones: build-defining trades at the end of paths.
export const KEYSTONES = {
  bloodMagic:     { name: 'Blood Magic', mods: [['bloodMagic', 1], ['dmgMore', .2], ['lifeInc', .3]], effect: 'Skills cost life instead of mana' },
  heartOfFlame:   { name: 'Heart of Flame', mods: [['dmgMore', .25]], effect: 'All damage is converted to fire. You take 15% more cold damage' },
  winterHeart:    { name: 'Winter\'s Heart', mods: [['freezeChance', .25]], effect: 'Hits against frozen enemies are always critical. 20% less cast speed' },
  eyeOfStorm:     { name: 'Eye of the Storm', mods: [['critInc', 1]], effect: 'Critical strikes shock. Non-critical strikes deal 30% less damage' },
  unbroken:       { name: 'Unbroken', mods: [['dmgTakenLess', .1], ['armourInc', .4]], effect: 'Cannot be stunned or slowed. 10% less movement speed' },
  mindOverMatter: { name: 'Mind over Matter', mods: [], effect: '30% of damage taken is taken from mana before life' },
  cadence:        { name: 'Cadence', mods: [['castInc', .1]], effect: 'RIDE: cast speed from cadence is doubled. Off the bike: 10% more cast speed while moving' },
  longHaul:       { name: 'The Long Haul', mods: [['lifeRegenPct', .01]], effect: 'Every 10 seconds without being hit: 5% more damage, up to 30%' },
  necromancer:    { name: 'Necromancer', mods: [['minionInc', .4], ['dmgMore', -.3]], effect: 'Your own spells deal 30% less damage. +2 maximum skeletons' },
};

// MONSTERS: how they scale with level, the archetypes in each family, rarities, rare mods and bosses.
//
// A monster at level L has:  life = SCALE.life.base × (1 + SCALE.life.growth)^(L-1) × archetype.life × rarity.life
//                            hit  = SCALE.dmg.base  × (1 + SCALE.dmg.growth)^(L-1)  × archetype.dmg  × rarity.dmg
//                            xp   = SCALE.xp.base   × (1 + SCALE.xp.growth)^(L-1)   × archetype.xp   × rarity.xp
// Monster level = area level (areas.js). The balance report checks these against the par player (targets.js).

export const SCALE = {
  life:  { base: 25, growth: .103 },
  dmg:   { base: 14, growth: .062 },
  xp:    { base: 8, growth: .105 },
  armour:{ base: 8, growth: .1 },
  accuracy: { base: 18, growth: .085 }, // vs your evasion (stats.js BASE.evadeK)     // monster armour vs physical spells (rarely matters for a mage)
  attackRate: 1 / 1.4,                // default attacks per second (archetype `cd` overrides)
};

// Rarities. packs: how a pack of that rarity is made (areas.js decides which packs a zone gets).
export const RARITY = {
  normal: { life: 1, dmg: 1, xp: 1, speed: 1 },
  magic:  { life: 3.3, dmg: 1.2, xp: 3, speed: 1.05, packSize: [3, 5] },
  rare:   { life: 13, dmg: 1.5, xp: 9, speed: 1.1, mods: [1, 2], minions: [3, 6], modsFromLevel: { 2: 20, 3: 40 } }, // a 3rd mod from AL 40
  unique: { life: 1, dmg: 1, xp: 1, speed: 1 }, // bosses set their own multipliers below
};

// Rare monster mods. Each multiplies the base numbers; the report uses the average.
export const RARE_MODS = {
  hasted:    { name: 'Hasted', speed: 1.4, attackRate: 1.25 },
  fortified: { name: 'Fortified', life: 1.4, dmgTaken: .85 },
  burning:   { name: 'Burning', addDmg: { fire: .4 }, effect: 'Leaves burning ground' },
  frozen:    { name: 'Rimebound', addDmg: { cold: .4 }, effect: 'Hits chill' },
  shocking:  { name: 'Stormcalled', addDmg: { light: .4 }, effect: 'Pulses lightning' },
  splitting: { name: 'Splitting', effect: 'Splits into 3 smaller copies on death', lifeEquiv: 1.3 },
  volatile:  { name: 'Volatile', effect: 'Spawns exploding orbs', dmg: 1.1 },
  frenzied:  { name: 'Frenzied', attackRate: 1.6, dmg: .85 },
  vampiric:  { name: 'Vampiric', effect: 'Heals 2% of life per hit', lifeEquiv: 1.15, fromLevel: 20 },
  warded:    { name: 'Warded', effect: 'Immune for 2s every 8s', lifeEquiv: 1.2, fromLevel: 30 },
};

// ARCHETYPES by family. ai: the behaviour the rules code runs (today: melee, ranged, bomb, boss).
// life/dmg/xp: multipliers on SCALE. spd: m/s. cd: seconds between attacks. range: attack reach in m.
// type: damage split of its hits. res: its resistances to your damage. look: model (render/characters.js).
export const FAMILIES = {
  skeletons: {
    name: 'The Restless Dead', act: 1,
    zombie:  { name: 'Skeleton Warrior', life: 1, dmg: 1.1, xp: 1, spd: 1.8, cd: 1.4, range: .75, ai: 'melee', type: { phys: 1 }, look: 'skel_warrior' },
    runner:  { name: 'Bone Scuttler', life: .5, dmg: .55, xp: .7, spd: 4, cd: .8, range: .6, ai: 'melee', type: { phys: 1 }, look: 'skel_minion' },
    archer:  { name: 'Skeleton Archer', life: .75, dmg: 1.1, xp: 1, spd: 2.3, cd: 2.2, range: 8, ai: 'ranged', type: { phys: 1 }, look: 'skel_rogue' },
    bloater: { name: 'Bloated Corpse', life: 1.7, dmg: 3.2, xp: 1.4, spd: 1.6, cd: 0, ai: 'bomb', type: { phys: .5, chaos: .5 }, look: 'blob' },
    mage:    { name: 'Bone Caller', life: .8, dmg: 1.45, xp: 1.3, spd: 2, cd: 2.6, range: 9, ai: 'caster', type: { cold: 1 }, look: 'skel_mage', from: 5, effect: 'Raises fallen skeletons' },
  },
  rot: {
    name: 'The Rot', act: 2,
    ghoul:   { name: 'Ghoul', life: 1.1, dmg: 1, xp: 1, spd: 2.6, cd: 1.1, range: .8, ai: 'melee', type: { phys: .7, chaos: .3 }, look: 'skel_warrior' },
    spider:  { name: 'Fen Spider', life: .85, dmg: .7, xp: .8, spd: 4.2, cd: .9, range: .7, ai: 'leaper', type: { phys: .5, chaos: .5 }, look: 'spider', effect: 'Leaps 6 m' },
    wisp:    { name: 'Marsh Wisp', life: .6, dmg: 1.2, xp: 1, spd: 3, cd: 2, range: 7, ai: 'blinker', type: { cold: 1 }, res: { cold: .5 }, look: 'wisp', effect: 'Teleports when hit' },
    bloater: { name: 'Bog Bloater', life: 1.8, dmg: 3, xp: 1.4, spd: 1.5, cd: 0, ai: 'bomb', type: { chaos: 1 }, look: 'blob', effect: 'Leaves a poison pool' },
    witch:   { name: 'Fen Witch', life: 1, dmg: 1.3, xp: 1.5, spd: 2, cd: 3, range: 9, ai: 'caster', type: { chaos: 1 }, look: 'skel_mage', effect: 'Hexes: you take 20% more damage' },
  },
  cult: {
    name: 'The Ashen Court', act: 3,
    knight:   { name: 'Ash Knight', life: 1.5, dmg: 1.68, xp: 1.3, spd: 2, cd: 1.5, range: 1, ai: 'blocker', type: { phys: .6, fire: .4 }, res: { fire: .3 }, look: 'knight', effect: 'Blocks frontal hits 50%' },
    cultist:  { name: 'Cinder Cultist', life: .85, dmg: 1.75, xp: 1, spd: 3, cd: 1, range: .8, ai: 'melee', type: { phys: .5, fire: .5 }, res: { fire: .2 }, look: 'rogue_hooded' },
    pyromancer:{ name: 'Pyromancer', life: .8, dmg: 1.82, xp: 1.3, spd: 2.2, cd: 2.4, range: 9, ai: 'caster', type: { fire: 1 }, res: { fire: .4 }, look: 'mage' },
    stormcaller:{ name: 'Stormcaller', life: .8, dmg: 1.82, xp: 1.3, spd: 2.2, cd: 2.4, range: 9, ai: 'caster', type: { light: 1 }, res: { light: .4 }, look: 'mage', effect: 'Shields allies' },
    hound:    { name: 'Cinder Hound', life: .7, dmg: 1, xp: .7, spd: 4.5, cd: .7, range: .6, ai: 'melee', type: { phys: .6, fire: .4 }, look: 'hound' },
  },
  // The endgame mixes every family; waystone biomes choose which.
};

// BOSSES. life/dmg: multipliers on a normal monster of the boss's level. abilities: the rules code's moves
// with each one's hit as a multiple of the boss's hit (`x`) and how often it's used per minute (`perMin`).
export const BOSSES = {
  paleWarden: {
    name: 'The Pale Warden', act: 1, life: 80, dmg: 2.2, xp: 60, look: 'skel_warrior', res: {},
    abilities: { swing: { x: 1, perMin: 20, type: { phys: 1 } }, slam: { x: 2.2, perMin: 4, type: { phys: 1 }, telegraph: 1.1 }, nova: { x: .7, perMin: 3, type: { cold: 1 } }, summon: { perMin: 2, adds: 5 } },
    enrage: { at: .5, speed: 1.3 }, drops: { items: 5, rareMin: 1, uniques: ['wattbringer'], recipes: ['benchFireRes'] },
  },
  rotmother: {
    name: 'The Rotmother', act: 2, life: 90, dmg: 2.3, xp: 70, look: 'blob_large', res: { chaos: .5 },
    abilities: { spit: { x: .8, perMin: 15, type: { chaos: 1 } }, pods: { perMin: 3, adds: 4 }, pool: { x: .25, perMin: 6, type: { chaos: 1 }, dot: 1 }, burrow: { x: 2.3, perMin: 2, type: { phys: 1 }, telegraph: 1.3 } },
    enrage: { at: .3, speed: 1.2 }, drops: { items: 6, rareMin: 1, uniques: ['rotmotherBelt'], recipes: ['benchChaosRes'] },
  },
  ashenKing: {
    name: 'The Ashen King', act: 3, life: 110, dmg: 2.4, xp: 90, look: 'knight', res: { fire: .3 },
    phases: [{ at: 1, abilities: ['swing', 'charge'] }, { at: .66, abilities: ['swing', 'fireWave', 'summon'] }, { at: .33, abilities: ['swing', 'fireWave', 'meteorRain'] }],
    abilities: { swing: { x: 1, perMin: 22, type: { phys: .5, fire: .5 } }, charge: { x: 2, perMin: 4, telegraph: 1 }, fireWave: { x: 1.5, perMin: 4, type: { fire: 1 } }, meteorRain: { x: 2.6, perMin: 3, type: { fire: 1 }, telegraph: 1.2 }, summon: { perMin: 2, adds: 6 } },
    drops: { items: 8, rareMin: 2, uniques: ['aegis'], recipes: ['benchSkillLevel'] },
  },
  waystoneGuardian: { // generic map boss; waystones pick a look and ability set from the biome
    name: 'Map Guardian', life: 100, dmg: 1.7, xp: 40, abilities: { swing: { x: 1, perMin: 20 }, big: { x: 1.6, perMin: 4, telegraph: 1.1 } },
    drops: { items: 4, rareMin: 1, waystoneUp: 1 },
  },
  pinnacle: {
    name: 'The Unending Climb', life: 220, dmg: 2.8, xp: 400, look: 'knight', res: { fire: .2, cold: .2, light: .2 },
    abilities: { swing: { x: 1, perMin: 24 }, gradient: { x: 3, perMin: 4, telegraph: 1.2 }, sprint: { x: 1.5, perMin: 3, effect: 'Arena shrinks; outrun it' } },
    drops: { items: 10, rareMin: 4, uniques: ['longRide'] },
  },
};

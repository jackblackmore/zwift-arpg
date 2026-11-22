// EQUIPMENT: slots, bases, affixes (with tiers gated by item level), rarities and uniques.
// Item level (ilvl) = the area level it dropped in. It decides which bases and affix tiers can roll.

export const SLOTS = {
  weapon:  { name: 'Weapon', unlock: 'start' },
  offhand: { name: 'Off-hand', unlock: 'act1.steps' },  // shield or orb
  helm:    { name: 'Helmet', unlock: 'start' },
  chest:   { name: 'Body Armour', unlock: 'start' },
  gloves:  { name: 'Gloves', unlock: 'act1.ossuary' },
  boots:   { name: 'Boots', unlock: 'start' },
  belt:    { name: 'Belt', unlock: 'act1.vault' },
  amulet:  { name: 'Amulet', unlock: 'start' },
  ring1:   { name: 'Ring', type: 'ring', unlock: 'start' },
  ring2:   { name: 'Ring', type: 'ring', unlock: 'act1.chapel' },
};
// Slot types (ring1 and ring2 both take rings).
export const slotType = s => SLOTS[s].type || s;
export const ARMOUR_SLOTS = ['helm', 'chest', 'gloves', 'boots'];

// RARITY: how many affixes each rolls. Prefixes are mostly power, suffixes mostly defence and utility.
export const RARITY = {
  normal: { prefix: [0, 0], suffix: [0, 0], total: [0, 0], col: '#c8c8c8' },
  magic:  { prefix: [0, 1], suffix: [0, 1], total: [1, 2], col: '#8888ff' },
  rare:   { prefix: [1, 3], suffix: [1, 3], total: [4, 6], col: '#ffff77' },
  unique: { col: '#ff9a3c' },
};

// BASES. [name, dropLevel, implicit or defence]. Level requirement = dropLevel (rounded down to the act band).
// A better base appears only when you reach its drop level: a new base dropping is an event.
// Armour pieces come in three lines: armour (heavier, more hits taken), evasion (dodge attacks) and hybrid.
export const BASES = {
  weapon: [ // one-handed: spell damage implicit
    ['Ashwood Wand', 1, [['spellInc', .1]]], ['Bone Wand', 9, [['spellInc', .14]]], ['Ember Sceptre', 18, [['elemInc', .2]]],
    ['Ironwood Wand', 28, [['spellInc', .22]]], ['Runed Sceptre', 38, [['elemInc', .3]]], ['Starforged Wand', 50, [['spellInc', .32], ['critInc', .2]]],
  ],
  offhand: [ // shields (block, armour) and orbs (crit, spell damage)
    ['Plank Shield', 1, [['block', .2], ['armour', 14]]], ['Glass Orb', 3, [['critInc', .2]]],
    ['Bronze Kite Shield', 16, [['block', .22], ['armour', 60]]], ['Quartz Orb', 18, [['critInc', .3], ['spellInc', .08]]],
    ['Tower Shield', 34, [['block', .24], ['armour', 160]]], ['Void Orb', 40, [['critInc', .4], ['spellInc', .15]]],
  ],
  helm: [
    ['Leather Cap', 1, [['evasion', 12]]], ['Iron Hat', 1, [['armour', 14]]], ['Bone Circlet', 6, [['armour', 8], ['evasion', 8], ['mana', 10]]],
    ['Hunter Hood', 15, [['evasion', 60]]], ['Barbute', 15, [['armour', 70]]], ['Ritual Mask', 24, [['armour', 45], ['evasion', 45]]],
    ['Shade Cowl', 38, [['evasion', 150]]], ['Great Helm', 38, [['armour', 170]]], ['Lich Crown', 52, [['armour', 120], ['evasion', 120], ['skillLevel', 1]]],
  ],
  chest: [
    ['Rag Tunic', 1, [['evasion', 18]]], ['Scale Vest', 1, [['armour', 22]]], ['Silk Robe', 4, [['mana', 20], ['armour', 10], ['evasion', 10]]],
    ['Leather Jerkin', 14, [['evasion', 110]]], ['Chainmail', 14, [['armour', 120]]], ['Ritual Wrap', 22, [['armour', 80], ['evasion', 80]]],
    ['Shadow Garb', 36, [['evasion', 280]]], ['Plate Cuirass', 36, [['armour', 300]]], ['Archmage Vestment', 55, [['armour', 220], ['evasion', 220], ['lifeInc', .08]]],
  ],
  gloves: [
    ['Wool Gloves', 3, [['evasion', 8]]], ['Iron Gauntlets', 3, [['armour', 10]]], ['Silk Wraps', 8, [['castInc', .04]]],
    ['Shagreen Gloves', 18, [['evasion', 45]]], ['Steel Gauntlets', 18, [['armour', 50]]], ['Runed Wraps', 30, [['castInc', .06], ['armour', 30], ['evasion', 30]]],
    ['Shade Gloves', 44, [['evasion', 110]]], ['Titan Gauntlets', 44, [['armour', 120]]],
  ],
  boots: [
    ['Wool Shoes', 1, [['evasion', 10]]], ['Leather Boots', 1, [['armour', 12]]], ['Pilgrim Sandals', 8, [['ms', .05]]],
    ['Strider Boots', 16, [['evasion', 55]]], ['Iron Greaves', 16, [['armour', 60]]], ['Runed Treads', 28, [['ms', .08], ['armour', 30], ['evasion', 30]]],
    ['Shade Boots', 42, [['evasion', 130]]], ['Titan Greaves', 42, [['armour', 140]]],
  ],
  belt: [
    ['Rope Belt', 5, [['life', 15]]], ['Leather Belt', 12, [['life', 30]]], ['Chain Belt', 25, [['armour', 60]]], ['Vanguard Belt', 40, [['life', 40], ['armour', 80]]],
  ],
  amulet: [
    ['Jade Amulet', 1, [['dmgInc', .08]]], ['Amber Amulet', 8, [['lifeRegen', 3]]], ['Coral Amulet', 12, [['mana', 25]]],
    ['Onyx Amulet', 26, [['allRes', .1]]], ['Gold Amulet', 34, [['rarity', .15]]], ['Lapis Amulet', 45, [['castInc', .08]]],
  ],
  ring: [
    ['Iron Ring', 1, [['spellFire', 2]]], ['Coral Ring', 1, [['life', 15]]], ['Ruby Ring', 10, [['fireRes', .2]]],
    ['Sapphire Ring', 12, [['coldRes', .2]]], ['Topaz Ring', 14, [['lightRes', .2]]], ['Two-Stone Ring', 30, [['allRes', .1]]],
    ['Gold Ring', 22, [['rarity', .12]]], ['Moonstone Ring', 40, [['mana', 30], ['castInc', .04]]],
  ],
};

// AFFIXES. Tiers are generated: `tiers` steps from ilvl `from` to ilvl `to`, values from `lo` [min, max] to `hi` [min, max].
//   Tier 1 is the best. Each tier's ilvl gate = from + (to - from) × step / (tiers - 1).
// slots: slot types it rolls on. slotMult: a smaller version on some slots (e.g. rings get 40% of a weapon's added damage).
// w: weight (how often it rolls, default 100). int: whole numbers.
export const AFFIXES = {
  // ---- Prefixes ----
  life:        { pre: 1, lo: [8, 12], hi: [90, 100], tiers: 9, from: 1, to: 64, slots: ['helm', 'chest', 'gloves', 'boots', 'belt', 'ring', 'amulet', 'offhand'], slotMult: { chest: 1.2, belt: 1.1 } },
  lifeInc:     { pre: 1, lo: [.04, .06], hi: [.1, .12], tiers: 4, from: 22, to: 60, slots: ['chest', 'belt', 'amulet'], w: 50 },
  mana:        { pre: 1, lo: [8, 12], hi: [60, 68], tiers: 8, from: 1, to: 60, slots: ['helm', 'gloves', 'boots', 'belt', 'ring', 'amulet', 'weapon', 'offhand'] },
  armour:      { pre: 1, lo: [5, 10], hi: [150, 190], tiers: 8, from: 1, to: 60, slots: ['helm', 'chest', 'gloves', 'boots', 'offhand', 'belt'], slotMult: { chest: 1.5 } },
  evasion:     { pre: 1, lo: [5, 10], hi: [150, 190], tiers: 8, from: 1, to: 60, slots: ['helm', 'chest', 'gloves', 'boots'], slotMult: { chest: 1.5 } },
  armourInc:   { pre: 1, lo: [.1, .16], hi: [.7, .8], tiers: 7, from: 3, to: 60, slots: ['helm', 'chest', 'gloves', 'boots', 'offhand'] },
  evasionInc:  { pre: 1, lo: [.1, .16], hi: [.7, .8], tiers: 7, from: 3, to: 60, slots: ['helm', 'chest', 'gloves', 'boots'] },
  spellFire:   { pre: 1, lo: [2, 4], hi: [52, 62], tiers: 9, from: 1, to: 62, slots: ['weapon', 'offhand', 'ring', 'amulet', 'gloves'], slotMult: { offhand: .6, amulet: .5, ring: .4, gloves: .35 } },
  spellCold:   { pre: 1, lo: [2, 4], hi: [48, 58], tiers: 9, from: 1, to: 62, slots: ['weapon', 'offhand', 'ring', 'amulet', 'gloves'], slotMult: { offhand: .6, amulet: .5, ring: .4, gloves: .35 } },
  spellLight:  { pre: 1, lo: [1, 6], hi: [20, 96], tiers: 9, from: 1, to: 62, slots: ['weapon', 'offhand', 'ring', 'amulet', 'gloves'], slotMult: { offhand: .6, amulet: .5, ring: .4, gloves: .35 } },
  spellPhys:   { pre: 1, lo: [2, 3], hi: [40, 48], tiers: 8, from: 5, to: 60, slots: ['weapon', 'offhand', 'ring', 'amulet'], slotMult: { offhand: .6, amulet: .5, ring: .4 }, w: 60 },
  spellInc:    { pre: 1, lo: [.1, .14], hi: [.7, .79], tiers: 8, from: 1, to: 60, slots: ['weapon', 'offhand', 'amulet'], slotMult: { amulet: .5 } },
  elemInc:     { pre: 1, lo: [.06, .1], hi: [.3, .35], tiers: 6, from: 4, to: 58, slots: ['amulet', 'ring', 'gloves', 'belt'] },
  fireInc:     { pre: 1, lo: [.1, .14], hi: [.45, .5], tiers: 6, from: 1, to: 56, slots: ['weapon', 'offhand', 'amulet', 'ring'], slotMult: { ring: .6 } },
  coldInc:     { pre: 1, lo: [.1, .14], hi: [.45, .5], tiers: 6, from: 1, to: 56, slots: ['weapon', 'offhand', 'amulet', 'ring'], slotMult: { ring: .6 } },
  lightInc:    { pre: 1, lo: [.1, .14], hi: [.45, .5], tiers: 6, from: 1, to: 56, slots: ['weapon', 'offhand', 'amulet', 'ring'], slotMult: { ring: .6 } },
  minionInc:   { pre: 1, lo: [.1, .14], hi: [.6, .7], tiers: 6, from: 20, to: 58, slots: ['weapon', 'offhand', 'amulet', 'helm'], w: 50 },

  // ---- Suffixes ----
  fireRes:     { suf: 1, lo: [.08, .12], hi: [.42, .46], tiers: 8, from: 1, to: 60, slots: ['helm', 'chest', 'gloves', 'boots', 'belt', 'ring', 'amulet', 'offhand'] },
  coldRes:     { suf: 1, lo: [.08, .12], hi: [.42, .46], tiers: 8, from: 1, to: 60, slots: ['helm', 'chest', 'gloves', 'boots', 'belt', 'ring', 'amulet', 'offhand'] },
  lightRes:    { suf: 1, lo: [.08, .12], hi: [.42, .46], tiers: 8, from: 1, to: 60, slots: ['helm', 'chest', 'gloves', 'boots', 'belt', 'ring', 'amulet', 'offhand'] },
  allRes:      { suf: 1, lo: [.03, .05], hi: [.15, .18], tiers: 5, from: 12, to: 60, slots: ['ring', 'amulet', 'offhand'], w: 50 },
  chaosRes:    { suf: 1, lo: [.05, .1], hi: [.31, .35], tiers: 5, from: 18, to: 62, slots: ['helm', 'chest', 'gloves', 'boots', 'belt', 'ring', 'amulet'], w: 40 },
  castInc:     { suf: 1, lo: [.04, .06], hi: [.26, .28], tiers: 7, from: 1, to: 60, slots: ['weapon', 'offhand', 'amulet', 'ring', 'gloves'], slotMult: { ring: .5, gloves: .5, offhand: .6 } },
  critInc:     { suf: 1, lo: [.1, .19], hi: [.8, .99], tiers: 6, from: 5, to: 58, slots: ['weapon', 'offhand', 'amulet', 'gloves'], slotMult: { gloves: .5 } },
  critMulti:   { suf: 1, lo: [.08, .12], hi: [.38, .42], tiers: 6, from: 8, to: 60, slots: ['weapon', 'amulet', 'gloves', 'offhand'], slotMult: { gloves: .6 } },
  ms:          { suf: 1, lo: [.05, .08], hi: [.3, .35], tiers: 6, from: 1, to: 55, slots: ['boots'] },
  lifeRegen:   { suf: 1, lo: [1, 2], hi: [26, 32], tiers: 8, from: 1, to: 60, slots: ['helm', 'chest', 'belt', 'ring', 'amulet', 'offhand'] },
  manaRegenInc:{ suf: 1, lo: [.1, .19], hi: [.7, .79], tiers: 7, from: 1, to: 60, slots: ['weapon', 'offhand', 'ring', 'amulet', 'helm'] },
  lifeOnKill:  { suf: 1, lo: [1, 3], hi: [20, 25], tiers: 6, from: 1, to: 58, slots: ['weapon', 'gloves', 'ring', 'amulet'], int: 1 },
  manaOnKill:  { suf: 1, lo: [1, 2], hi: [8, 10], tiers: 5, from: 1, to: 55, slots: ['weapon', 'gloves', 'ring', 'amulet'], int: 1 },
  aoeInc:      { suf: 1, lo: [.05, .08], hi: [.18, .2], tiers: 4, from: 6, to: 50, slots: ['helm', 'amulet', 'weapon'] },
  rarity:      { suf: 1, lo: [.06, .1], hi: [.24, .28], tiers: 4, from: 3, to: 52, slots: ['helm', 'boots', 'ring', 'amulet'], w: 60 },
  flaskEffect: { suf: 1, lo: [.1, .14], hi: [.3, .35], tiers: 4, from: 8, to: 50, slots: ['belt'] },
  skillLevel:  { suf: 1, lo: [1, 1], hi: [2, 2], tiers: 2, from: 25, to: 55, slots: ['amulet', 'weapon'], w: 15, int: 1, rareOnly: 1 },
  proj:        { suf: 1, lo: [1, 1], hi: [1, 1], tiers: 1, from: 30, to: 30, slots: ['weapon'], w: 10, int: 1, rareOnly: 1 },
};

// UNIQUES. Fixed mods (values at the unique's level; they don't scale). source: where it drops (areas.js ids or 'any').
export const UNIQUES = {
  // Act 1
  wattbringer: { slot: 'weapon', base: 'Ember Sceptre', lvl: 8, source: 'act1.boss', mods: [['spellFire', 9], ['fireInc', .3], ['proj', 1]], effect: 'Fireball explosions leave burning ground', fl: 'Every turn of the crank feeds the flame.' },
  glassCrown:  { slot: 'helm', base: 'Bone Circlet', lvl: 6, source: 'act1', mods: [['dmgInc', .6], ['lifeInc', -.35], ['critInc', .5]], fl: 'Everything hits harder. Including them.' },
  emberstride: { slot: 'boots', base: 'Pilgrim Sandals', lvl: 8, source: 'act1', mods: [['ms', .22], ['fireInc', .15]], effect: 'Flame Dash has +2 charges', fl: 'Never the same road twice.' },
  // Act 2
  heartStorm:  { slot: 'amulet', base: 'Coral Amulet', lvl: 18, source: 'act2', mods: [['lightInc', .3], ['castInc', .08]], effect: 'Every 4th Fireball also casts Arc where it explodes', fl: 'It hums at a steady ninety.' },
  frostLoop:   { slot: 'ring', base: 'Sapphire Ring', lvl: 16, source: 'act2', mods: [['coldInc', .35], ['coldRes', .3]], effect: 'Casts Frost Nova every 5 seconds', fl: 'Cold comes in waves.' },
  rotmotherBelt:{ slot: 'belt', base: 'Leather Belt', lvl: 22, source: 'act2.boss', mods: [['life', 60], ['chaosRes', .3], ['flaskEffect', .25]], effect: 'Flasks also cure poison and grant 10% less damage taken', fl: 'Drink deep of the green.' },
  // Act 3
  aegis:       { slot: 'chest', base: 'Plate Cuirass', lvl: 36, source: 'act3.boss', mods: [['life', 120], ['dmgTakenLess', .15], ['lifeRegen', 15]], fl: 'Zone two forever.' },
  bellToll:    { slot: 'offhand', base: 'Tower Shield', lvl: 34, source: 'act3', mods: [['block', .08], ['armour', 200], ['allRes', .15]], effect: 'Blocking casts Frost Nova', fl: 'Ring once for peace.' },
  // Endgame (waystones). minTier: the lowest waystone tier it drops in.
  cadence:     { slot: 'gloves', base: 'Runed Wraps', lvl: 45, source: 'waystone', minTier: 3, mods: [['castInc', .2], ['manaOnKill', 8]], effect: 'Cast speed rises with cadence above 80 rpm (up to +20%)', fl: 'Spin to win.' },
  ftpCrown:    { slot: 'helm', base: 'Lich Crown', lvl: 55, source: 'waystone', minTier: 6, mods: [['skillLevel', 2], ['life', 80]], effect: 'Damage rises with power above FTP (up to 40% more)', fl: 'Threshold is a state of mind.' },
  longRide:    { slot: 'amulet', base: 'Lapis Amulet', lvl: 58, source: 'pinnacle', mods: [['skillLevel', 1], ['allRes', .2], ['dmgInc', .4]], effect: 'Every minute in the map: +2% damage, up to 40%', fl: 'The century is the warm-up.' },
  zeroDrop:    { slot: 'ring', base: 'Two-Stone Ring', lvl: 50, source: 'waystone', minTier: 8, mods: [['pen', .15], ['elemInc', .25]], effect: 'Kills while above 250 W explode', fl: 'Zero gradient. Zero mercy.' },
};

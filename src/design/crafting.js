// CRAFTING at the Smith in town: materials (random crafts), bench recipes (deterministic, found in the world),
// and the waystone mods that crafting also rolls.

// MATERIALS. use: what it does. Drop rates are in loot.js. sell: gold value at the trader.
export const CURRENCY = {
  scrap:        { name: 'Scrap', use: 'Bench recipe costs and flask quality', sell: 1 },
  kindling:     { name: 'Kindling', use: 'Normal → magic (rolls 1–2 affixes)', sell: 4 },
  shiftingAsh:  { name: 'Shifting Ash', use: 'Reroll all affixes on a magic or rare item', sell: 6 },
  emberCore:    { name: 'Ember Core', use: 'Magic → rare (keeps its affixes, adds until 4); also a full passive respec', sell: 15 },
  temperingOil: { name: 'Tempering Oil', use: 'Reroll the values of every affix, keeping the affixes', sell: 10 },
  anvilShard:   { name: 'Anvil Shard', use: 'Add one random affix to a rare with room', sell: 30 },
  voidSalt:     { name: 'Void Salt', use: 'Remove one random affix', sell: 30 },
  corruptEye:   { name: 'Eye of Ash', use: 'Corrupt: 25% add an implicit, 25% reroll as a rare, 25% nothing, 25% brick. Then the item can\'t be changed', sell: 50 },
};

// BENCH RECIPES. Found from quests, bosses and side rooms (areas.js / monsters.js `recipes`), then usable forever.
// Adds the mod `mod` at `value` into a free prefix (pre) or suffix (suf). An item can carry only ONE bench mod.
// cost: scales with item level: n × (1 + ilvl / 20).
export const RECIPES = {
  benchLife:       { name: 'Hale', slots: ['helm', 'chest', 'gloves', 'boots', 'belt', 'ring', 'amulet', 'offhand'], pre: 1, mod: ['life', 30], cost: { scrap: 8 } },
  benchFireRes:    { name: 'of the Kiln', slots: ['helm', 'chest', 'gloves', 'boots', 'belt', 'ring', 'amulet', 'offhand'], suf: 1, mod: ['fireRes', .25], cost: { scrap: 8 } },
  benchColdRes:    { name: 'of the Hearth', slots: ['helm', 'chest', 'gloves', 'boots', 'belt', 'ring', 'amulet', 'offhand'], suf: 1, mod: ['coldRes', .25], cost: { scrap: 8 } },
  benchLightRes:   { name: 'of Grounding', slots: ['helm', 'chest', 'gloves', 'boots', 'belt', 'ring', 'amulet', 'offhand'], suf: 1, mod: ['lightRes', .25], cost: { scrap: 8 } },
  benchChaosRes:   { name: 'of the Antidote', slots: ['helm', 'chest', 'gloves', 'boots', 'belt'], suf: 1, mod: ['chaosRes', .2], cost: { scrap: 12, temperingOil: 1 } },
  benchCast:       { name: 'of Celerity', slots: ['weapon', 'amulet', 'ring', 'gloves'], suf: 1, mod: ['castInc', .1], cost: { scrap: 12, emberCore: 1 } },
  benchSpellDmg:   { name: 'Arcane', slots: ['weapon', 'offhand'], pre: 1, mod: ['spellInc', .3], cost: { scrap: 15, emberCore: 1 }, source: 'act3.sideRooms' },
  benchMs:         { name: 'of the Breakaway', slots: ['boots'], suf: 1, mod: ['ms', .15], cost: { scrap: 15, temperingOil: 1 }, source: 'act2.sideRooms' },
  benchSkillLevel: { name: 'of the Adept', slots: ['amulet'], suf: 1, mod: ['skillLevel', 1], cost: { scrap: 30, anvilShard: 1 } },
  benchProj:       { name: 'of Splitting', slots: ['weapon'], suf: 1, mod: ['proj', 1], cost: { scrap: 40, anvilShard: 2 }, source: 'waystone.t5' },
  benchChains:     { name: 'of Forking', slots: ['weapon', 'amulet'], suf: 1, mod: ['chains', 1], cost: { scrap: 30, anvilShard: 1 }, source: 'waystone.t3' },
};

// WAYSTONE MODS. Waystones roll these like gear (normal 0, magic 1–2, rare 3–5; materials work on waystones too).
// Each prefix makes the map harder; its reward is added to the map's item quantity / rarity / pack size.
// The report's endgame numbers assume a rare waystone with `PAR.waystoneMods` average mods.
export const WAYSTONE_MODS = {
  // prefixes: monsters
  extraFire:   { pre: 1, t: 'Monsters deal 25% extra damage as fire', monsterDmg: 1.25, quantity: .1 },
  extraCold:   { pre: 1, t: 'Monsters deal 25% extra damage as cold', monsterDmg: 1.25, quantity: .1 },
  hasted:      { pre: 1, t: 'Monsters have 20% increased speed', monsterSpeed: 1.2, quantity: .12 },
  tough:       { pre: 1, t: 'Monsters have 40% more life', monsterLife: 1.4, quantity: .14 },
  armoured:    { pre: 1, t: 'Monsters have +30% elemental resistance', monsterRes: .3, quantity: .14 },
  rareHeavy:   { pre: 1, t: 'Area has 2 extra rare packs', rares: 2, quantity: .08, rarity: .1 },
  dense:       { pre: 1, t: '30% increased pack size', packSize: 1.3, quantity: .2 },
  // suffixes: player
  lessRegen:   { suf: 1, t: 'Players have 40% less life regeneration', quantity: .08 },
  lessRes:     { suf: 1, t: 'Players have -15% to all resistances', playerRes: -.15, quantity: .12 },
  noFlask:     { suf: 1, t: 'Flasks gain 50% fewer charges', quantity: .1 },
  burning:     { suf: 1, t: 'Area has patches of burning ground', quantity: .1 },
  bloodlines:  { suf: 1, t: 'Magic packs have a rare leader', rares: 1, quantity: .1, rarity: .15 },
  bossUnique:  { suf: 1, t: 'Map boss drops an additional unique', rarity: .2, rare: 1 },
};

// The atlas: one bonus point the first time you complete each tier in each biome (10 × 3).
export const ATLAS = {
  biomes: ['crypt', 'forest', 'town'],
  bonuses: { waystoneDrop: .05, quantity: .02, rarity: .03 }, // per point
};

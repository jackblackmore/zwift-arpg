// LOOT: how much drops, at what rarity, and where materials, runes and waystones come from.
// The balance report shows what this adds up to per zone (targets.js has the goals).

// Chance a monster drops an item, and how many extra rolls rarer monsters get.
export const ITEM_DROPS = {
  normal: { chance: .045 },
  magic:  { chance: .11 },
  rare:   { chance: 1, extra: .5 },   // one item always, a 50% chance of a second
  // bosses: monsters.js BOSSES[id].drops
};

// Rarity of a dropped item (weights). Rare monsters and bosses roll with `fromRare`.
// Item rarity (the `rarity` stat) multiplies the magic, rare and unique weights.
export const ITEM_RARITY = {
  base:     { normal: 68, magic: 29, rare: 2.6, unique: .4 },
  fromRare: { normal: 25, magic: 60, rare: 13, unique: 2 },
  fromBoss: { normal: 0, magic: 60, rare: 35, unique: 5 },
};

// Gold: per monster kill, scales with area level.
export const GOLD = { chance: .2, amount: al => Math.round(3 + al * 1.2) };

// Crafting materials (crafting.js CURRENCY ids). chance: per normal monster; rares × 6, bosses guaranteed `boss` rolls.
// from: lowest area level it drops in.
export const MATERIAL_DROPS = {
  chance: .03, rareMult: 6, bossRolls: 4,
  weights: { kindling: 40, shiftingAsh: 18, emberCore: 10, temperingOil: 12, anvilShard: 3, voidSalt: 3, corruptEye: 1 },
  from: { kindling: 1, shiftingAsh: 4, emberCore: 8, temperingOil: 10, anvilShard: 15, voidSalt: 20, corruptEye: 36 },
};

// Runes (skills.js RUNES): chance per rare monster and side-room chest; must be at or above the rune's dropLevel.
export const RUNE_DROPS = { perRare: .12, perChest: .3, perBoss: 1 };

// Side rooms (areas.js sideRooms): what each kind contains, and how often it's that kind.
export const SIDE_ROOMS = {
  chest:  { w: 50, items: [2, 4], rarity: 'fromRare', materials: [1, 3] },
  shrine: { w: 30, effect: 'A 60s buff: 30% more damage, or 30% more speed, or fully restore' },
  elite:  { w: 20, rares: 1, extraLoot: 1 },
};

// Salvage: what breaking down an item gives (crafting.js CURRENCY ids).
export const SALVAGE = {
  normal: { scrap: [1, 2] },
  magic:  { scrap: [2, 3], kindling: [0, 1] },
  rare:   { scrap: [3, 5], emberCore: [0, 1], shiftingAsh: [0, 1] },
  unique: { scrap: [6, 8], anvilShard: [0, 1] },
};

// Loot filter defaults (players can change them). hideBelow: hide items whose base is this many tiers below your best.
export const FILTER = { hideNormalFromLevel: 6, hideMagicFromLevel: 30, alwaysShow: ['rare', 'unique', 'rune', 'waystone', 'material'], autoSalvage: false };

// Bag and stash.
export const STORAGE = { bag: 40, stashTabs: 4, stashTabSize: 48 };

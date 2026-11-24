// Item bases, affixes and uniques. Each item carries `mods`: [stat, value] pairs summed by game/stats.js.
export const SLOTS = ['weapon', 'helm', 'chest', 'boots', 'ring', 'amulet'];
export const GLY = { weapon: '†', helm: '◓', chest: '▣', boots: '▙', ring: '○', amulet: '◈' };
export const BASES = {
  weapon: ['Rusted Sword', 'Bone Axe', 'Ember Mace', 'Knight\'s Blade'], helm: ['Iron Hat', 'Bone Circlet', 'Deep Hood', 'Great Helm'],
  chest: ['Silk Robe', 'Scale Vest', 'Plate Cuirass', 'Ritual Wrap'], boots: ['Wool Shoes', 'Leather Boots', 'Iron Greaves'],
  ring: ['Iron Ring', 'Coral Ring', 'Gold Ring'], amulet: ['Jade Amulet', 'Amber Amulet', 'Onyx Amulet'],
};
// Implicit mods every base of that slot carries ([stat, value] pairs; flat values grow with item level, ms and dmg don't).
// Armour (design notes "Defence") comes only from these for now: helms, body armour and boots. Gear rework (build order step 6)
// gives each base its own implicits.
export const IMPL = { weapon: [['spell', 5]], helm: [['lifeF', 14], ['armour', 7]], chest: [['lifeF', 28], ['armour', 14]], boots: [['ms', .06], ['armour', 5]], ring: [['lifeF', 10]], amulet: [['dmg', .08]] };
export const IMPL_FIXED = ['ms', 'dmg']; // implicit stats that don't grow with item level
// t: text (# = value), pct: shown as %, dec: 1 decimal, int: whole number, slots: allowed slots, rare: rolls less often, mp: magic item prefix.
export const AFF = [
  { st: 'spell', t: 'Adds # damage to skills', a: 2, b: 4, slots: ['weapon', 'ring', 'amulet'], mp: 'Brutal' },
  { st: 'dmg', t: '#% increased damage', pct: 1, a: .06, b: .14, slots: ['weapon', 'amulet', 'helm'], mp: 'Potent' },
  { st: 'fire', slots: ['weapon', 'ring', 'amulet'], t: '#% increased fire damage', pct: 1, a: .1, b: .25, mp: 'Smouldering' },
  { st: 'cold', slots: ['weapon', 'ring', 'amulet'], t: '#% increased cold damage', pct: 1, a: .1, b: .25, mp: 'Icy' },
  { st: 'light', slots: ['weapon', 'ring', 'amulet'], t: '#% increased lightning damage', pct: 1, a: .1, b: .25, mp: 'Static' },
  { st: 'cast', t: '#% increased attack and cast speed', pct: 1, a: .05, b: .12, slots: ['weapon', 'ring', 'amulet', 'helm'], mp: 'Nimble' },
  { st: 'lifeF', t: '+# to maximum life', a: 10, b: 28, mp: 'Hale' },
  { st: 'lregen', t: 'Regenerate # life per second', dec: 1, a: .8, b: 2.5, mp: 'Mending' },
  { st: 'ms', t: '#% increased movement speed', pct: 1, a: .05, b: .12, slots: ['boots'], mp: 'Runner\'s' },
  { st: 'crit', t: '+#% critical strike chance', pct: 1, a: .02, b: .05, mp: 'Keen' },
  { st: 'aoe', t: '#% increased area of effect', pct: 1, a: .06, b: .15, slots: ['helm', 'amulet', 'weapon'], mp: 'Vast' },
  { st: 'lok', t: 'Gain # life per kill', a: 1, b: 4, int: 1, mp: 'Hungering' },
  { st: 'chains', t: 'Arc chains +# times', a: 1, b: 2, int: 1, slots: ['weapon', 'amulet', 'helm'], rare: 1, mp: 'Forking' },
  { st: 'freeze', t: '#% increased freeze duration', pct: 1, a: .15, b: .35, mp: 'Frigid' },
  // Resistances (design notes "Defence"): each capped at DEFENCE.resCap (data/balance.js). resElem adds to fire, cold and lightning.
  { st: 'resElem', t: '+#% to fire, cold and lightning resistance', pct: 1, a: .06, b: .12, slots: ['helm', 'chest', 'boots', 'ring', 'amulet'], mp: 'Warded' },
  { st: 'resPoison', t: '+#% to poison resistance', pct: 1, a: .1, b: .2, slots: ['helm', 'chest', 'boots', 'ring', 'amulet'], mp: 'Purifying' },
];
export const AFFBY = Object.fromEntries(AFF.map(a => [a.st, a]));
// Mods that only uniques carry.
export const EXTRA = {
  armour: { t: '+# armour' }, // implicit only (IMPL) until the gear rework
  lifePct: { t: '#% to maximum life', pct: 1, sign: 1 }, dr: { t: '#% less damage taken', pct: 1 }, dashCh: { t: 'Flame Dash has +# charges', int: 1 }, shieldPct: { t: 'Magic Shield\'s barrier absorbs #% more', pct: 1 },
  // Rule-bending unique mods, with their numbers (keep the text in step). burnGround: a patch of radius r where a melee swing lands, lasting dur s.
  burnGround: { t: 'Your melee hits leave burning ground', flag: 1, r: 1.2, dur: 2.5 }, storm: { t: 'Every 4th melee attack also casts Arc at the target', flag: 1, every: 4 },
  autoNova: { t: 'Casts Frost Nova automatically every 5 seconds', flag: 1, every: 5 },
};
export const UNIQ = [
  { id: 'watt', slot: 'weapon', name: 'Wattbringer', base: 'Ember Mace', mods: [['spell', 9], ['fire', .3], ['burnGround', 1]], fl: 'Every turn of the crank feeds the flame.' },
  { id: 'storm', slot: 'amulet', name: 'Heart of the Storm', base: 'Onyx Amulet', mods: [['light', .3], ['cast', .08], ['storm', 1]], fl: 'It hums at a steady ninety.' },
  { id: 'ember', slot: 'boots', name: 'Emberstride', base: 'Iron Greaves', mods: [['ms', .22], ['shieldPct', .4], ['fire', .15]], fl: 'Never the same road twice.' },
  { id: 'glass', slot: 'helm', name: 'The Glass Crown', base: 'Bone Circlet', mods: [['dmg', .6], ['lifePct', -.35], ['crit', .05]], fl: 'Everything hits harder. Including them.' },
  { id: 'frost', slot: 'ring', name: 'Frostbound Loop', base: 'Coral Ring', mods: [['cold', .35], ['freeze', .3], ['autoNova', 1]], fl: 'Cold comes in waves.' },
  { id: 'aegis', slot: 'chest', name: 'Aegis of the Long Ride', base: 'Plate Cuirass', mods: [['lifeF', 90], ['dr', .15], ['lregen', 4]], fl: 'Zone two forever.' },
];
export const RAREN1 = ['Doom', 'Storm', 'Grim', 'Soul', 'Blood', 'Rune', 'Dusk', 'Ember', 'Hate', 'Glyph', 'Rapture', 'Pandemonium'];
export const RAREN2 = ['Grasp', 'Song', 'Brand', 'Ward', 'Veil', 'Crown', 'Spire', 'Bite', 'Coil', 'Weaver', 'Mark', 'Knell'];
export const RCOL = [0xc8c8c8, 0x8888ff, 0xffff77, 0xff9a3c], RCSS = ['#c8c8c8', '#8888ff', '#ffff77', '#ff9a3c'];
// Drop chances and rarity rolls.
// normal/magic: chance a monster of that rarity drops an item (rares always drop 1–2, guardians 5).
// gem: chance a rare also drops a gem (not an elite: DROP.elite) (guardians always drop one; pool and level in data/gems.js GEM_POOL, GEM_DROP).
// rare: a rare's items (the first always, a second at `second` chance) and their rarity boosts. boss: the guardian's items and boosts (first, rest), one every `gap` s.
// uniqueBase, rareBase, magicBase: chance a drop is unique, rare or magic (the rest are plain items: implicit only); a boost adds to
// rareBase and magicBase, and uniqueBoost × it to uniqueBase.
// uniqueFrom: the first map tier where uniques can drop (tier 6 = the region after the Crypt). Gear is meant to be sparse:
// normal packs mostly give XP; rares and guardians are where the items are.
// affixes: [min, max] rolled per rarity. rareAffixSkip: chance an affix marked `rare` is skipped on a magic and a rare item.
export const DROP = { normal: .012, magic: .04, uniqueBase: .025, uniqueBoost: .4, uniqueFrom: 6, rareBase: .07, magicBase: .35, bagSize: 30, gem: .25,
  affixes: { magic: [1, 2], rare: [3, 5] }, rareAffixSkip: { magic: .85, rare: .4 },
  rare: { boost: .1, second: .1, boost2: .05 }, boss: { n: 2, first: .5, rest: .15, gap: .12 },
  // Room roles (data/dungeon.js ROLES). elite: the elite's items (n, the first with `first` boost, the rest `rest`, one every
  // `gap` s), instead of a rare's; no gem. chest: a treasure chest's items when opened (n [min, max], boost), no gem.
  elite: { n: 3, first: .35, rest: .12, gap: .12 }, chest: { n: [2, 3], boost: .15 } };
// Treasure chests (game/rooms.js): open when you're within `reach` units (and its guards, if any, are dead). guarded: chance a
// chest has a pack guarding it (it counts as one of the map's packs).
export const CHEST = { reach: 2, guarded: .4 };

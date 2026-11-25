// Item bases, affixes and uniques. Each item carries `mods`: [stat, value] pairs summed by game/stats.js.
export const SLOTS = ['weapon', 'helm', 'chest', 'boots', 'ring', 'amulet'];
export const GLY = { weapon: '†', helm: '◓', chest: '▣', boots: '▙', ring: '○', amulet: '◈' };
// Item bases (build order step 6). Each base has its own implicits ([stat, value] pairs, shown first on the item; flat values grow with
// item level, IMPL_FIXED stats don't) and a weight: heavy bases trade move speed or life for armour, light ones the other way round,
// so picking a base is a choice (design notes "Gear"). The first base of each slot is the middle one the balance tools' par gear uses.
//   w: 'light' | 'medium' | 'heavy' (shown on the item). Weapons trade flat damage against speed or crit instead.
export const BASE = {
  // weapon
  'Rusted Sword': { slot: 'weapon', w: 'medium', impl: [['spell', 5]] },
  "Knight's Blade": { slot: 'weapon', w: 'light', impl: [['spell', 4], ['crit', .03]] },
  'Bone Axe': { slot: 'weapon', w: 'heavy', impl: [['spell', 7], ['cast', -.06]] },
  'Ember Mace': { slot: 'weapon', w: 'medium', impl: [['spell', 5], ['fire', .1]] },
  // helm
  'Iron Hat': { slot: 'helm', w: 'medium', impl: [['lifeF', 14], ['armour', 7]] },
  'Great Helm': { slot: 'helm', w: 'heavy', impl: [['lifeF', 8], ['armour', 14]] },
  'Bone Circlet': { slot: 'helm', w: 'light', impl: [['lifeF', 20], ['armour', 2]] },
  'Deep Hood': { slot: 'helm', w: 'light', impl: [['lifeF', 12], ['armour', 3], ['resPoison', .08]] },
  // body armour
  'Scale Vest': { slot: 'chest', w: 'medium', impl: [['lifeF', 28], ['armour', 14]] },
  'Plate Cuirass': { slot: 'chest', w: 'heavy', impl: [['lifeF', 18], ['armour', 30], ['ms', -.05]] },
  'Silk Robe': { slot: 'chest', w: 'light', impl: [['lifeF', 24], ['armour', 4], ['ms', .04]] },
  'Ritual Wrap': { slot: 'chest', w: 'light', impl: [['lifeF', 42], ['armour', 4]] },
  // boots
  'Leather Boots': { slot: 'boots', w: 'medium', impl: [['ms', .06], ['armour', 5]] },
  'Iron Greaves': { slot: 'boots', w: 'heavy', impl: [['ms', .02], ['armour', 11]] },
  'Wool Shoes': { slot: 'boots', w: 'light', impl: [['ms', .1], ['armour', 1]] },
  // rings and amulets: no weight, a different implicit each
  'Iron Ring': { slot: 'ring', impl: [['lifeF', 10]] },
  'Coral Ring': { slot: 'ring', impl: [['resPoison', .1]] },
  'Gold Ring': { slot: 'ring', impl: [['resElem', .06]] },
  'Jade Amulet': { slot: 'amulet', impl: [['dmg', .08]] },
  'Amber Amulet': { slot: 'amulet', impl: [['lifeF', 16]] },
  'Onyx Amulet': { slot: 'amulet', impl: [['crit', .03]] },
};
export const BASES = Object.fromEntries(SLOTS.map(s => [s, Object.keys(BASE).filter(b => BASE[b].slot === s)]));
export const IMPL_FIXED = ['ms', 'dmg', 'crit', 'cast', 'fire', 'resPoison', 'resElem']; // implicit stats that don't grow with item level
// Affixes. t: text (# = value), tn: text for a negative value (shown without the minus), pct: shown as %, dec: 1 decimal, int: whole
// number, slots: allowed slots, rare: rolls less often (DROP.rareAffixSkip), minRar: only on items of at least this rarity (2 = rare),
// mp: magic item prefix.
// Ownership (design notes "Stats"): gear owns flat damage and most defence (armour, resistances, flat life); the tree owns % and
// survival; gems own behaviour (chains, pierce, projectiles are support gems). Gem levels and sockets on gear feed the gems.
export const AFF = [
  { st: 'spell', t: 'Adds # damage to skills', a: 2, b: 4, slots: ['weapon', 'ring', 'amulet'], mp: 'Brutal' },
  { st: 'dmg', t: '#% increased damage', pct: 1, a: .06, b: .14, slots: ['weapon', 'amulet', 'helm'], mp: 'Potent' },
  { st: 'fire', slots: ['weapon', 'ring', 'amulet'], t: '#% increased fire damage', pct: 1, a: .1, b: .25, mp: 'Smouldering' },
  { st: 'cold', slots: ['weapon', 'ring', 'amulet'], t: '#% increased cold damage', pct: 1, a: .1, b: .25, mp: 'Icy' },
  { st: 'light', slots: ['weapon', 'ring', 'amulet'], t: '#% increased lightning damage', pct: 1, a: .1, b: .25, mp: 'Static' },
  { st: 'cast', t: '#% increased attack and cast speed', tn: '#% reduced attack and cast speed', pct: 1, a: .05, b: .12, slots: ['weapon', 'ring', 'amulet', 'helm'], mp: 'Nimble' },
  { st: 'crit', t: '+#% critical strike chance', pct: 1, a: .02, b: .05, slots: ['weapon', 'ring', 'amulet', 'helm'], mp: 'Keen' },
  { st: 'aoe', t: '#% increased area of effect', pct: 1, a: .06, b: .15, slots: ['helm', 'amulet'], mp: 'Vast' },
  // +gem levels (rare): added to the gem in that bar slot; they can take it past the gem level cap (game/formulas.js computeStats).
  { st: 'gemMain', t: '+# to the level of your Main gem', a: 1, b: 1, int: 1, slots: ['weapon', 'amulet'], rare: 1, mp: 'Masterful' },
  { st: 'gemFlex', t: '+# to the level of your Flex gems', a: 1, b: 1, int: 1, slots: ['helm', 'ring', 'amulet'], rare: 1, mp: 'Versatile' },
  // A support socket on the Main slot (game/gems.js sockCount): rare items only.
  { st: 'sockMain', t: '+# support socket on your Main skill', a: 1, b: 1, int: 1, slots: ['weapon'], rare: 1, minRar: 2, mp: 'Socketed' },
  // Defence: flat life, armour and resistances (each capped at DEFENCE.resCap, data/balance.js). resElem adds to fire, cold and lightning.
  { st: 'lifeF', t: '+# to maximum life', a: 10, b: 28, mp: 'Hale' },
  { st: 'armour', t: '+# armour', a: 8, b: 20, slots: ['helm', 'chest', 'boots'], mp: 'Reinforced' },
  { st: 'resFire', t: '+#% to fire resistance', pct: 1, a: .1, b: .2, slots: ['helm', 'chest', 'boots', 'ring', 'amulet'], mp: 'Fireproof' },
  { st: 'resCold', t: '+#% to cold resistance', pct: 1, a: .1, b: .2, slots: ['helm', 'chest', 'boots', 'ring', 'amulet'], mp: 'Furred' },
  { st: 'resLight', t: '+#% to lightning resistance', pct: 1, a: .1, b: .2, slots: ['helm', 'chest', 'boots', 'ring', 'amulet'], mp: 'Grounded' },
  { st: 'resPoison', t: '+#% to poison resistance', pct: 1, a: .1, b: .2, slots: ['helm', 'chest', 'boots', 'ring', 'amulet'], mp: 'Purifying' },
  { st: 'resElem', t: '+#% to fire, cold and lightning resistance', pct: 1, a: .06, b: .12, slots: ['helm', 'chest', 'boots', 'ring', 'amulet'], rare: 1, mp: 'Warded' },
  { st: 'lregen', t: 'Regenerate # life per second', dec: 1, a: .8, b: 2.5, slots: ['helm', 'chest', 'boots', 'ring', 'amulet'], mp: 'Mending' },
  { st: 'lok', t: 'Gain # life per kill', a: 1, b: 4, int: 1, slots: ['weapon', 'ring', 'amulet'], mp: 'Hungering' },
  { st: 'ms', t: '#% increased movement speed', tn: '#% reduced movement speed', pct: 1, a: .05, b: .12, slots: ['boots'], mp: 'Runner\'s' },
];
export const AFFBY = Object.fromEntries(AFF.map(a => [a.st, a]));
// Uniques (build order step 6): each bends a rule rather than adding numbers. A unique carries its base's implicits, a few plain
// mods, and one rule mod from EXTRA. EXTRA holds each rule's numbers next to its text (npm test checks every number is in the text).
//   flag: a rule (shown as its text). Other fields are the rule's numbers, read by the code named in the comment.
export const EXTRA = {
  // Wattbringer (game/sk/strike.js): a patch of radius r where a melee swing lands, lasting dur s.
  burnGround: { t: 'Your melee hits set the ground burning within 1.2 units for 2.5s', flag: 1, r: 1.2, dur: 2.5 },
  // Heart of the Storm (game/sk/strike.js): every `every`th plain melee swing also casts Arc at the target, free.
  storm: { t: 'Every 4th melee attack also casts Arc at the target', flag: 1, every: 4 },
  // Frostbound Loop (game/update.js): a free Frost Nova every `every` s.
  autoNova: { t: 'Casts Frost Nova automatically every 5 seconds', flag: 1, every: 5 },
  // The Answering Bell (game/sk/guard.js): a parry also releases a shockwave of `mult` × your Main gem's hit at monsters within r.
  parryNova: { t: 'Your parries release a shockwave dealing 80% of your Main attack\'s damage to monsters within 3 units', flag: 1, mult: .8, r: 3 },
  // Breakaway Treads (game/update.js updSurge, game/sk/guard.js blockStats): Surge drains `save` slower; holding Guard doesn't block.
  surgeSave: { t: 'Surge drains 40% slower, but you can\'t block: holding Guard does nothing (parries still work)', flag: 1, save: .4 },
  // Headsman's Seal (game/combat.js hit): a finisher also deals `share` of its damage to every other monster within r.
  finBlast: { t: 'Your finishers explode, dealing 50% of their damage to other monsters within 3.5 units', flag: 1, share: .5, r: 3.5 },
  // Aegis of the Long Ride (game/sk/roll.js, guard.js shieldHit): a roll keeps your shield up instead of making you untouchable.
  rollBlock: { t: 'You keep your shield up while you roll: hits during a roll are blocked from any side, unblockable ones as heavies, but rolls aren\'t untouchable', flag: 1 },
};
export const UNIQ = [
  { id: 'watt', slot: 'weapon', name: 'Wattbringer', base: 'Ember Mace', mods: [['spell', 6], ['burnGround', 1]], fl: 'Every turn of the crank feeds the flame.' },
  { id: 'bell', slot: 'helm', name: 'The Answering Bell', base: 'Great Helm', mods: [['lifeF', 20], ['parryNova', 1]], fl: 'Strike it, and it strikes back.' },
  { id: 'aegis', slot: 'chest', name: 'Aegis of the Long Ride', base: 'Plate Cuirass', mods: [['armour', 20], ['rollBlock', 1]], fl: 'Zone two forever.' },
  { id: 'treads', slot: 'boots', name: 'Breakaway Treads', base: 'Wool Shoes', mods: [['ms', .08], ['surgeSave', 1]], fl: 'Go early. Never look back.' },
  { id: 'frost', slot: 'ring', name: 'Frostbound Loop', base: 'Coral Ring', mods: [['cold', .2], ['autoNova', 1]], fl: 'Cold comes in waves.' },
  { id: 'seal', slot: 'ring', name: 'Headsman\'s Seal', base: 'Iron Ring', mods: [['crit', .03], ['finBlast', 1]], fl: 'One falls; the rest flinch.' },
  { id: 'storm', slot: 'amulet', name: 'Heart of the Storm', base: 'Onyx Amulet', mods: [['light', .2], ['storm', 1]], fl: 'It hums at a steady ninety.' },
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

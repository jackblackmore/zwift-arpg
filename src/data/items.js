// Item bases, affixes and uniques. Each item carries `mods`: [stat, value] pairs summed by game/stats.js.
export const SLOTS = ['weapon', 'helm', 'chest', 'boots', 'ring', 'amulet'];
export const GLY = { weapon: '†', helm: '◓', chest: '▣', boots: '▙', ring: '○', amulet: '◈' };
export const BASES = {
  weapon: ['Ashwood Staff', 'Bone Wand', 'Ember Sceptre', 'Ironwood Staff'], helm: ['Iron Hat', 'Bone Circlet', 'Deep Hood', 'Great Helm'],
  chest: ['Silk Robe', 'Scale Vest', 'Plate Cuirass', 'Ritual Wrap'], boots: ['Wool Shoes', 'Leather Boots', 'Iron Greaves'],
  ring: ['Iron Ring', 'Coral Ring', 'Gold Ring'], amulet: ['Jade Amulet', 'Amber Amulet', 'Onyx Amulet'],
};
// Implicit mod every base of that slot carries.
export const IMPL = { weapon: ['spell', 5], helm: ['lifeF', 14], chest: ['lifeF', 28], boots: ['ms', .06], ring: ['manaF', 14], amulet: ['dmg', .08] };
// t: text (# = value), pct: shown as %, dec: 1 decimal, int: whole number, slots: allowed slots, rare: rolls less often, mp: magic item prefix.
export const AFF = [
  { st: 'spell', t: 'Adds # spell damage', a: 2, b: 4, slots: ['weapon', 'ring', 'amulet'], mp: 'Sorcerous' },
  { st: 'dmg', t: '#% increased damage', pct: 1, a: .06, b: .14, slots: ['weapon', 'amulet', 'helm'], mp: 'Potent' },
  { st: 'fire', slots: ['weapon', 'ring', 'amulet'], t: '#% increased fire damage', pct: 1, a: .1, b: .25, mp: 'Smouldering' },
  { st: 'cold', slots: ['weapon', 'ring', 'amulet'], t: '#% increased cold damage', pct: 1, a: .1, b: .25, mp: 'Icy' },
  { st: 'light', slots: ['weapon', 'ring', 'amulet'], t: '#% increased lightning damage', pct: 1, a: .1, b: .25, mp: 'Static' },
  { st: 'cast', t: '#% increased cast speed', pct: 1, a: .05, b: .12, slots: ['weapon', 'ring', 'amulet', 'helm'], mp: 'Nimble' },
  { st: 'lifeF', t: '+# to maximum life', a: 10, b: 28, mp: 'Hale' },
  { st: 'manaF', t: '+# to maximum mana', a: 8, b: 22, mp: 'Mystic' },
  { st: 'lregen', t: 'Regenerate # life per second', dec: 1, a: .8, b: 2.5, mp: 'Mending' },
  { st: 'mregen', t: 'Regenerate # mana per second', dec: 1, a: .8, b: 2.4, mp: 'Flowing' },
  { st: 'ms', t: '#% increased movement speed', pct: 1, a: .05, b: .12, slots: ['boots'], mp: 'Runner\'s' },
  { st: 'crit', t: '+#% critical strike chance', pct: 1, a: .02, b: .05, mp: 'Keen' },
  { st: 'aoe', t: '#% increased area of effect', pct: 1, a: .06, b: .15, slots: ['helm', 'amulet', 'weapon'], mp: 'Vast' },
  { st: 'lok', t: 'Gain # life per kill', a: 1, b: 4, int: 1, mp: 'Hungering' },
  { st: 'mok', t: 'Gain # mana per kill', a: 1, b: 3, int: 1, mp: 'Thirsting' },
  { st: 'proj', t: 'Fireball fires +# projectile', a: 1, b: 1, int: 1, slots: ['weapon'], rare: 1, mp: 'Splitting' },
  { st: 'chains', t: 'Arc chains +# times', a: 1, b: 2, int: 1, slots: ['weapon', 'amulet', 'helm'], rare: 1, mp: 'Forking' },
  { st: 'pierce', t: 'Fireball pierces # enemy', a: 1, b: 1, int: 1, slots: ['weapon', 'ring'], rare: 1, mp: 'Piercing' },
  { st: 'freeze', t: '#% increased freeze duration', pct: 1, a: .15, b: .35, mp: 'Frigid' },
];
export const AFFBY = Object.fromEntries(AFF.map(a => [a.st, a]));
// Mods that only uniques carry.
export const EXTRA = {
  lifePct: { t: '#% to maximum life', pct: 1, sign: 1 }, dr: { t: '#% less damage taken', pct: 1 }, dashCh: { t: 'Flame Dash has +# charges', int: 1 }, shieldPct: { t: 'Magic Shield absorbs #% more', pct: 1 },
  burnGround: { t: 'Fireball explosions leave burning ground', flag: 1 }, storm: { t: 'Every 4th Fireball also casts Arc where it explodes', flag: 1 },
  autoNova: { t: 'Casts Frost Nova automatically every 5 seconds', flag: 1 },
};
export const UNIQ = [
  { id: 'watt', slot: 'weapon', name: 'Wattbringer', base: 'Ember Sceptre', mods: [['spell', 9], ['fire', .3], ['proj', 1], ['burnGround', 1]], fl: 'Every turn of the crank feeds the flame.' },
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
// gem: chance a rare also drops a gem (guardians always drop one; pool and level in data/gems.js GEM_POOL, GEM_DROP).
export const DROP = { normal: .07, magic: .2, uniqueBase: .025, rareBase: .25, bagSize: 30, gem: .25 };

// THE STAT DICTIONARY. Every number on gear, passives, runes, skills and monster mods is one of these ids.
//
// How stats combine (see formulas.js `total`):
//   final = (base + sum of 'flat') × (1 + sum of 'inc') × product of (1 + each 'more')
//   'inc' stats name the stat they increase in `of`. 'more' stats are multiplied one by one (runes, keystones, uniques).
//   'flag' stats are on/off (keystones, unique effects). 'count' stats add whole numbers (+1 projectile).
// fmt: how the game shows it (# = value; pct values are fractions, .25 shows as 25%).
// cap: hard cap on the final value.

export const DAMAGE_TYPES = ['phys', 'fire', 'cold', 'light', 'chaos'];
export const ELEMENTS = ['fire', 'cold', 'light'];

export const STATS = {
  // ---- Life, mana, recovery ----
  life:        { kind: 'flat', fmt: '+# to maximum life' },
  lifeInc:     { kind: 'inc', of: 'life', pct: 1, fmt: '#% increased maximum life' },
  mana:        { kind: 'flat', fmt: '+# to maximum mana' },
  manaInc:     { kind: 'inc', of: 'mana', pct: 1, fmt: '#% increased maximum mana' },
  lifeRegen:   { kind: 'flat', dec: 1, fmt: 'Regenerate # life per second' },
  lifeRegenPct:{ kind: 'flat', pct: 1, fmt: 'Regenerate #% of life per second' },
  manaRegenInc:{ kind: 'inc', of: 'manaRegen', pct: 1, fmt: '#% increased mana regeneration' },
  lifeOnKill:  { kind: 'flat', fmt: 'Gain # life per enemy killed' },
  manaOnKill:  { kind: 'flat', fmt: 'Gain # mana per enemy killed' },
  manaCostInc: { kind: 'inc', of: 'manaCost', pct: 1, fmt: '#% increased mana cost of skills' },

  // ---- Defence ----
  armour:      { kind: 'flat', fmt: '+# to armour' },
  armourInc:   { kind: 'inc', of: 'armour', pct: 1, fmt: '#% increased armour' },
  evasion:     { kind: 'flat', fmt: '+# to evasion' },
  evasionInc:  { kind: 'inc', of: 'evasion', pct: 1, fmt: '#% increased evasion' },
  fireRes:     { kind: 'flat', pct: 1, fmt: '+#% to fire resistance' },
  coldRes:     { kind: 'flat', pct: 1, fmt: '+#% to cold resistance' },
  lightRes:    { kind: 'flat', pct: 1, fmt: '+#% to lightning resistance' },
  chaosRes:    { kind: 'flat', pct: 1, fmt: '+#% to chaos resistance' },
  allRes:      { kind: 'flat', pct: 1, fmt: '+#% to all elemental resistances', expands: ['fireRes', 'coldRes', 'lightRes'] },
  maxRes:      { kind: 'flat', pct: 1, fmt: '+#% to all maximum elemental resistances' },
  block:       { kind: 'flat', pct: 1, cap: .5, fmt: '+#% chance to block' },
  dmgTakenLess:{ kind: 'more', less: 1, of: 'dmgTaken', pct: 1, fmt: '#% less damage taken' },

  // ---- Offence: added damage to spells (average per hit; the game rolls a min-max around it) ----
  spellPhys:   { kind: 'flat', type: 'phys', fmt: 'Adds # physical damage to spells' },
  spellFire:   { kind: 'flat', type: 'fire', fmt: 'Adds # fire damage to spells' },
  spellCold:   { kind: 'flat', type: 'cold', fmt: 'Adds # cold damage to spells' },
  spellLight:  { kind: 'flat', type: 'light', fmt: 'Adds # lightning damage to spells' },

  // ---- Offence: increased damage (all sum into one pool for a hit, filtered by the skill's tags and damage types) ----
  dmgInc:      { kind: 'inc', of: 'damage', pct: 1, fmt: '#% increased damage' },
  spellInc:    { kind: 'inc', of: 'damage', tag: 'spell', pct: 1, fmt: '#% increased spell damage' },
  elemInc:     { kind: 'inc', of: 'damage', types: ['fire', 'cold', 'light'], pct: 1, fmt: '#% increased elemental damage' },
  physInc:     { kind: 'inc', of: 'damage', types: ['phys'], pct: 1, fmt: '#% increased physical damage' },
  fireInc:     { kind: 'inc', of: 'damage', types: ['fire'], pct: 1, fmt: '#% increased fire damage' },
  coldInc:     { kind: 'inc', of: 'damage', types: ['cold'], pct: 1, fmt: '#% increased cold damage' },
  lightInc:    { kind: 'inc', of: 'damage', types: ['light'], pct: 1, fmt: '#% increased lightning damage' },
  aoeDmgInc:   { kind: 'inc', of: 'damage', tag: 'aoe', pct: 1, fmt: '#% increased area damage' },
  projDmgInc:  { kind: 'inc', of: 'damage', tag: 'proj', pct: 1, fmt: '#% increased projectile damage' },
  minionInc:   { kind: 'inc', of: 'damage', tag: 'minion', pct: 1, fmt: 'Minions deal #% increased damage' },
  dmgMore:     { kind: 'more', of: 'damage', pct: 1, fmt: '#% more damage' },
  pen:         { kind: 'flat', pct: 1, fmt: 'Damage penetrates #% elemental resistances' },

  // ---- Offence: speed and crit ----
  castInc:     { kind: 'inc', of: 'castSpeed', pct: 1, fmt: '#% increased cast speed' },
  critInc:     { kind: 'inc', of: 'critChance', pct: 1, fmt: '#% increased critical strike chance' },
  critMulti:   { kind: 'flat', pct: 1, fmt: '+#% to critical strike multiplier' },
  skillLevel:  { kind: 'count', fmt: '+# to level of all spell skills' },

  // ---- Skill shape ----
  aoeInc:      { kind: 'inc', of: 'area', pct: 1, fmt: '#% increased area of effect' },
  proj:        { kind: 'count', fmt: 'Skills fire +# projectiles' },
  chains:      { kind: 'count', fmt: 'Chaining skills chain +# times' },
  pierce:      { kind: 'count', fmt: 'Projectiles pierce +# enemies' },
  durInc:      { kind: 'inc', of: 'duration', pct: 1, fmt: '#% increased skill effect duration' },

  // ---- Ailments ----
  igniteChance:{ kind: 'flat', pct: 1, cap: 1, fmt: '#% chance to ignite' },
  freezeChance:{ kind: 'flat', pct: 1, cap: 1, fmt: '#% chance to freeze' },
  shockChance: { kind: 'flat', pct: 1, cap: 1, fmt: '#% chance to shock' },
  ailmentInc:  { kind: 'inc', of: 'ailment', pct: 1, fmt: '#% increased damage with ailments' },

  // ---- Utility ----
  ms:          { kind: 'inc', of: 'moveSpeed', pct: 1, fmt: '#% increased movement speed' },
  flaskCharges:{ kind: 'flat', pct: 1, fmt: '#% increased flask charges gained' },
  flaskEffect: { kind: 'inc', of: 'flask', pct: 1, fmt: '#% increased flask effect' },
  rarity:      { kind: 'flat', pct: 1, fmt: '#% increased rarity of items found' },
  quantity:    { kind: 'flat', pct: 1, fmt: '#% increased quantity of items found' },

  // ---- Flags (keystones and uniques) ----
  bloodMagic:  { kind: 'flag', fmt: 'Skills cost life instead of mana' },
  noCrit:      { kind: 'flag', fmt: 'Never deal critical strikes' },
};

// Player base values before any gear or passives. Per-level growth is in progression.js.
export const BASE = {
  manaRegen: 5,         // flat mana regenerated per second
  manaRegenPct: .04,    // plus this fraction of max mana per second
  critMulti: 1.5,       // a crit deals 150%
  maxRes: .75,          // resistance cap
  moveSpeed: 6.2,       // metres per second (today's P speed)
  flaskCharges: 3,
  // Mitigation rules (formulas.js):
  armourK: 12,          // physical damage reduction = armour / (armour + armourK × hit), capped at armourCap
  armourCap: .9,
  evadeK: 4,            // chance to evade an attack = evasion / (evasion + evadeK × monster accuracy), capped at evadeCap
  evadeCap: .6,         // spells (caster monsters) and explosions can't be evaded
};

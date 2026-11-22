// TARGETS: how the game should feel, as numbers. The balance report (npm run balance) checks every zone against these
// and flags anything outside its [low, high] band. Change a target when the feel you want changes; change the other
// design files when the game misses a target.
//
// PAR: the "typical player" the report simulates: the gear, passives and skill choices a normal run would have.
// It isn't optimal play; a good player beats par, a careless one falls behind.

export const TARGETS = {
  // Seconds to kill one monster with the par main skill, single target.
  ttk: { normal: [.25, 1.2], magic: [.8, 3], rare: [4, 12], boss: [40, 120] },
  // Swings of a monster it takes to kill the par player (life / damage per landed hit, counting evade and block).
  hitsToDie: { normal: [10, 35], rare: [4, 18], bossBig: [2.5, 6] },
  // Minutes to clear one zone or map (fights + walking).
  zoneMinutes: [4.5, 10],
  mapMinutes: [7, 15],
  // Mana: (regen + mana on kill) / spending at the par casting uptime. Below 1 you dip and have to pause in long fights.
  manaSustain: [.75, 4],
  // Resistances of the par player after the act penalty (fire/cold/lightning, the lowest of the three).
  minRes: { act1: [0, .75], act2: [.2, .75], act3: [.4, .75], endgame: [.6, .75] },
  // Character level when leaving each act, and hours played by then.
  // Par hours: a real first playthrough (deaths, town trips, reading loot) runs about 1.5× these.
  levelAfter: { act1: [10, 13], act2: [19, 25], act3: [32, 37] },
  hoursAfter: { act1: [.35, .8], act2: [.9, 1.6], act3: [1.4, 2.6], level50: [5, 12], level60: [20, 50] },
  // Loot per zone (expected counts across all sources).
  itemsPerZone: [6, 24],
  itemsPerMap: [15, 40],
  raresPerZone: [.6, 2.5],   // boss zones are allowed up to 2× this
  uniquesPerAct: [.5, 3],
  materialsPerZone: [2, 10],
};

export const PAR = {
  mainSkill: 'fireball',
  // Rune choice by slot (opening at skill level 5 and 15).
  runes: ['added', 'haste'],
  // Fraction of fight time spent casting (the rest is moving, dodging, looting).
  uptime: .7, bossUptime: .55,
  // Walking: seconds per combat room and per side room, and per zone for town trips and the loading screen.
  travel: { room: 18, sideRoom: 25, zone: 40 },
  // Gear: worn items are `lag` levels behind the area, with `affixes` affixes rolled `tierBehind` below the best tier
  // available, at `quality` × the average roll. Bands apply from their `al` up.
  gear: [
    { al: 1,  lag: 1, affixes: 1, tierBehind: 0, quality: .9 },
    { al: 4,  lag: 2, affixes: 2, tierBehind: 0, quality: .9 },
    { al: 10, lag: 3, affixes: 3, tierBehind: 1, quality: .9 },
    { al: 20, lag: 3, affixes: 4, tierBehind: 1, quality: .9 },
    { al: 40, lag: 4, affixes: 5, tierBehind: 1, quality: .95 },
    { al: 50, lag: 4, affixes: 5, tierBehind: 0, quality: 1 },
  ],
  // Which base line par wears (the implicit stat it looks for, newest base with it wins).
  // Keyed by slot first (ring1, ring2), then slot type.
  basePref: { weapon: 'spellInc', offhand: 'block', helm: 'armour', chest: 'armour', gloves: 'armour', boots: 'armour', belt: 'life', amulet: 'allRes', ring1: 'lightRes', ring2: 'fireRes', ring: 'life' },
  // Affix priorities per slot type: par takes the first ones that can roll there, respecting prefix/suffix limits.
  loadout: {
    weapon:  ['spellFire', 'spellInc', 'fireInc', 'castInc', 'critInc', 'critMulti'],
    offhand: ['life', 'spellFire', 'fireRes', 'coldRes', 'lightRes', 'castInc'],
    helm:    ['life', 'fireRes', 'coldRes', 'armour', 'lightRes', 'armourInc'],
    chest:   ['life', 'coldRes', 'lightRes', 'armour', 'armourInc', 'fireRes'],
    gloves:  ['life', 'lightRes', 'fireRes', 'spellFire', 'castInc', 'coldRes'],
    boots:   ['life', 'ms', 'lightRes', 'coldRes', 'fireRes', 'armour'],
    belt:    ['life', 'lightRes', 'fireRes', 'armour', 'coldRes', 'lifeInc'],
    amulet:  ['spellFire', 'life', 'fireInc', 'castInc', 'critMulti', 'allRes'],
    ring:    ['life', 'coldRes', 'spellFire', 'fireRes', 'manaRegenInc', 'lightRes'],
  },
  // Passive order: wing.path[:nodes]. Par walks these in order, one point at a time.
  passives: ['core.0:3', 'fire.0:4', 'ward.0:3', 'fire.1:3', 'rider.0:3', 'fire.0', 'ward.0:6', 'fire.1:6', 'rider.1:3', 'core.0:5',
             'ward.1:4', 'fire.1', 'rider.0:5', 'cold.0:4', 'ward.0', 'rider.1', 'light.0:4', 'cold.1:3'],
  // Rare waystone the par player runs: average effect of its mods.
  waystone: { life: 1.15, dmg: 1.12, quantity: .45, rarity: .2, packSize: 1.1, res: -.05 },
};

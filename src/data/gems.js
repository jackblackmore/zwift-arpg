// Skill gems and the skill bar (docs/design-notes.md "Gem model in detail", docs/build-order.md step 1).
// A gem gives a skill; its numbers (cost, cast time, cooldown, radius...) stay in data/skills.js under `sk`.
//   kind: attack | guard | evade (which slots take it). held: casts repeatedly while the button is down,
//   else one cast per press (holding recasts when ready). elem: damage type. ms: milestone level → text (effects in game/formulas.js).

export const GEMS = {
  fireball: { n: 'Fireball', kind: 'attack', held: 1, sk: 'fireball', elem: 'fire', icon: '✹', col: '#ff8a3c', d: 'Hurls a fireball that explodes on impact', ms: { 5: 'Pierces 1 enemy' } },
  arc: { n: 'Arc', kind: 'attack', held: 1, sk: 'arc', elem: 'light', icon: 'ϟ', col: '#c98bff', d: 'Lightning that chains between enemies', ms: { 5: '+2 chains' } },
  nova: { n: 'Frost Nova', kind: 'attack', held: 0, sk: 'nova', elem: 'cold', icon: '❄', col: '#7fd8ff', d: 'A ring of frost that damages and freezes everything around you', ms: { 5: '+25% radius' } },
  shield: { n: 'Magic Shield', kind: 'guard', held: 0, sk: 'shield', icon: '◎', col: '#7fb8ff', d: 'A barrier that absorbs damage for a few seconds', ms: { 5: 'Absorbs 25% more' } },
  dash: { n: 'Flame Dash', kind: 'evade', held: 0, sk: 'dash', elem: 'fire', icon: '➶', col: '#ff6a1a', d: 'Dash forward, leaving burning ground', ms: { 5: '+1 charge' } },
};

// Skill bar, in button order. unlock: character level. kinds: gem kinds the slot takes.
export const SLOT_DEFS = {
  main: { n: 'Main', unlock: 1, kinds: ['attack'], key: 'LMB' },
  flexA: { n: 'Flex A', unlock: 5, kinds: ['attack'], key: 'RMB' },
  flexB: { n: 'Flex B', unlock: 12, kinds: ['attack'], key: 'Q' },
  guard: { n: 'Guard', unlock: 1, kinds: ['guard'], key: 'SPACE' },
  evade: { n: 'Evade', unlock: 8, kinds: ['evade'], key: 'E' },
};
export const BAR = Object.keys(SLOT_DEFS);

// Shrines: one per slot unlock, pick 1 of the offered gems. Guard is filled with Magic Shield automatically.
// Flex shrines skip attack gems you already own while there are others to offer (Frost Lance and friends arrive in step 2).
export const SHRINES = { main: ['fireball', 'arc', 'nova'], flexA: ['fireball', 'arc', 'nova'], flexB: ['fireball', 'arc', 'nova'], evade: ['dash'] };
export const START_GUARD = 'shield';

// Gem levels. Base damage = base × grow^(level − 1), for every gem (skill `mult` in data/skills.js scales it per skill).
// Gems earn the same XP as the character from kills (`offBar` share when not on the bar) and level on the character's curve.
// Shrine gems for Flex slots start `flexStart` levels below your Main gem.
export const GEM = { cap: 10, base: 4, grow: 1.1, offBar: .1, flexStart: 2 };

// Skill gems and the skill bar (docs/design-notes.md "Gem model in detail", docs/build-order.md step 1).
// A gem gives a skill; its numbers (cost, cast time, cooldown, radius...) stay in data/skills.js under `sk`.
//   kind: attack | guard | evade (which slots take it). held: casts repeatedly while the button is down,
//   else one cast per press (holding recasts when ready). elem: damage type. ms: milestone level → text.
//   mile: the level 5 milestone's numbers. `add` goes into that skill's stat sums (game/formulas.js computeStats); the other
//   fields are read by the skill's own code (src/game/sk/). Keep the `ms` text in step with them.

export const GEMS = {
  fireball: { n: 'Fireball', kind: 'attack', held: 1, sk: 'fireball', elem: 'fire', icon: '✹', col: '#ff8a3c', d: 'Hurls a fireball that explodes on impact', ms: { 5: 'Pierces 1 enemy' }, mile: { add: { pierce: 1 } } },
  frostlance: { n: 'Frost Lance', kind: 'attack', held: 1, sk: 'frostlance', elem: 'cold', icon: '↟', col: '#9fe8ff', d: 'Hurls a fast lance of ice that pierces enemies and chills them', ms: { 5: 'Pierces 2 more enemies' }, mile: { pierce: 2 } },
  arc: { n: 'Arc', kind: 'attack', held: 1, sk: 'arc', elem: 'light', icon: 'ϟ', col: '#c98bff', d: 'Lightning that chains between enemies', ms: { 5: '+2 chains' }, mile: { add: { chains: 2 } } },
  nova: { n: 'Frost Nova', kind: 'attack', held: 0, sk: 'nova', elem: 'cold', icon: '❄', col: '#7fd8ff', d: 'A ring of frost that damages and freezes everything around you', ms: { 5: '+25% radius' }, mile: { add: { novaR: .25 } } },
  totem: { n: 'Flame Totem', kind: 'attack', held: 0, sk: 'totem', elem: 'fire', icon: '♨', col: '#ff7a2a', d: 'Plants a totem that shoots fire bolts at the nearest monster for a few seconds', ms: { 5: 'Lasts 50% longer' }, mile: { dur: 1.5 } },
  meteor: { n: 'Meteor', kind: 'attack', held: 0, sk: 'meteor', elem: 'fire', icon: '☄', col: '#ff5a1a', d: 'Calls a meteor down on the aimed spot: a big fire hit and burning ground', ms: { 5: '+30% radius' }, mile: { radius: 1.3 } },
  skeletons: { n: 'Raise Skeletons', kind: 'attack', held: 0, sk: 'skeletons', elem: 'phys', icon: '☠', col: '#9be8c0', d: 'Raises a skeleton that follows you and fights nearby monsters', ms: { 5: '+1 skeleton' }, mile: { cap: 1 } },
  shield: { n: 'Magic Shield', kind: 'guard', held: 0, sk: 'shield', icon: '◎', col: '#7fb8ff', d: 'A barrier that absorbs damage for a few seconds', ms: { 5: 'Absorbs 25% more' }, mile: { add: { shieldPct: .25 } } },
  blink: { n: 'Blink', kind: 'evade', held: 0, sk: 'blink', elem: 'cold', icon: '⇝', col: '#9fe8ff', d: 'Teleport away from the nearest threat, untouchable for a moment', ms: { 5: 'Leaves a frost burst behind that chills' }, mile: { burstR: 3, burstMult: .9, burstChill: 3 } },
  ward: { n: 'Frost Ward', kind: 'guard', held: 0, sk: 'ward', elem: 'cold', icon: '❅', col: '#8fe0ff', d: 'A ring of frost around you: monsters inside are slowed and chilled, and you take less damage', ms: { 5: '+25% radius' }, mile: { radius: 1.25 } },
  dash: { n: 'Flame Dash', kind: 'evade', held: 0, sk: 'dash', elem: 'fire', icon: '➶', col: '#ff6a1a', d: 'Dash forward, leaving burning ground', ms: { 5: '+1 charge' }, mile: { add: { dashCh: 1 } } },
};

// Skill bar, in button order. unlock: character level. kinds: gem kinds the slot takes.
// sock: support sockets as [character level, sockets from then on] (design notes, skill bar table). Levels past the Crypt are data only for now.
export const SLOT_DEFS = {
  main: { n: 'Main', unlock: 1, kinds: ['attack'], key: 'LMB', sock: [[1, 1], [15, 2], [30, 3], [45, 4]] },
  flexA: { n: 'Flex A', unlock: 5, kinds: ['attack'], key: 'RMB', sock: [[5, 1], [25, 2]] },
  flexB: { n: 'Flex B', unlock: 12, kinds: ['attack'], key: 'Q', sock: [[12, 1], [25, 2]] },
  guard: { n: 'Guard', unlock: 1, shrineLvl: 3, kinds: ['guard'], key: 'SPACE', sock: [[1, 1]] },
  evade: { n: 'Evade', unlock: 8, kinds: ['evade'], key: 'E', sock: [[8, 1]] },
};
export const BAR = Object.keys(SLOT_DEFS);

// Shrines: one per slot unlock, pick 1 of the offered gems. Guard is filled with Magic Shield automatically.
// Flex shrines skip attack gems you already own while there are others to offer (Frost Lance and friends arrive in step 2).
export const SHRINES = { main: ['fireball', 'frostlance', 'skeletons'], flexA: ['arc', 'nova', 'totem', 'meteor', 'fireball', 'frostlance'], flexB: ['arc', 'nova', 'totem', 'meteor', 'fireball', 'frostlance'], evade: ['dash', 'blink'], guard: ['ward'] };
export const START_GUARD = 'shield';

// Gem levels. Base damage = base × grow^(level − 1), for every gem (skill `mult` in data/skills.js scales it per skill).
// Gems earn the same XP as the character from kills (`offBar` share when not on the bar) and level on the character's curve.
// Shrine gems for Flex slots start `flexStart` levels below your Main gem.
export const GEM = { cap: 10, base: 4, grow: 1.1, offBar: .1, flexStart: 2 };

// Support gems (step 3): socketed on a skill bar slot, they change only the skill gem in that slot.
//   for: gem ids or gem kinds it works with. Every number a support uses is a field of its entry (keep the `d` text in step).
//   fn(s, v) adds to the raw stat sums like a passive does (game/formulas.js computeStats), on that skill's own copy of the
//   sums, so it never touches another skill; v is the entry itself. Fields fn doesn't use are read by the skill's own code.
//   more: a damage multiplier for that skill. Supports level like skill gems (feeding fuel, fusing later); their effect doesn't grow with level yet.
// The first eight were level-up notables before step 3 (OLD_NOTABLES maps them, for old saves).
export const SUPPORTS = {
  twin: { n: 'Twin Flame', for: ['fireball'], icon: '⁑', col: '#ff8a3c', d: 'Fireball fires +1 projectile, but deals 40% less damage', proj: 1, more: .6, fn: (s, v) => { s.proj += v.proj; s.more *= v.more; } },
  searing: { n: 'Searing Lance', for: ['fireball'], icon: '➹', col: '#ffb070', d: 'Fireball pierces +1 enemy before exploding', pierce: 1, fn: (s, v) => s.pierce += v.pierce },
  // Ignite: a burn of `share` × the hit, spread over `dur` seconds.
  ignite: { n: 'Ignite', for: ['fireball', 'meteor'], icon: '♆', col: '#ff5a2a', d: 'Its hits burn enemies for 60% of the hit over 3s', share: .6, dur: 3, fn: s => s.ignite = 1 },
  // Chain Reaction: `chance` that a Fireball kill explodes for `mult` × a Fireball explosion, in `radius`.
  chainboom: { n: 'Chain Reaction', for: ['fireball'], icon: '✺', col: '#ff5a2a', d: 'Enemies killed by Fireball have a 30% chance to explode', chance: .3, mult: .6, radius: 1.4, fn: s => s.chainboom = 1 },
  forked: { n: 'Forked Sky', for: ['arc'], icon: 'ψ', col: '#c98bff', d: 'Arc chains +2 more times', chains: 2, fn: (s, v) => s.chains += v.chains },
  // Conduit: Arc always shocks, and its shocks add `shockMore` damage taken (a normal shock adds SK.arc.shockMore).
  conduit: { n: 'Conduit', for: ['arc'], icon: '⌁', col: '#c98bff', d: 'Arc always shocks, and its shocked enemies take 35% more damage instead of 20%', shockMore: .35, fn: s => s.conduit = 1 },
  // Shatter: a frozen enemy's death deals `pct` of its max life to enemies within `radius`, and freezes them for `freeze` s.
  shatter: { n: 'Shatter', for: ['nova'], icon: '✳', col: '#7fd8ff', d: 'Enemies frozen by Frost Nova explode on death, dealing 30% of their life to foes nearby and freezing them', pct: .3, radius: 2.4, freeze: .9, fn: s => s.shatter = 1 },
  warding: { n: 'Warding', for: ['shield'], icon: '⊚', col: '#7fb8ff', d: 'Magic Shield absorbs 30% more', shieldPct: .3, fn: (s, v) => s.shieldPct += v.shieldPct },
  // Split: `n` lances `spread` radians apart, each `mult` × the damage.
  split: { n: 'Split', for: ['frostlance'], icon: '⋔', col: '#9fe8ff', d: 'Frost Lance fires 3 lances in a fan, each dealing 60% less damage', lances: 3, spread: .2, mult: .4, fn: s => s.split = 1 },
  army: { n: 'Bigger Army', for: ['skeletons'], icon: '☗', col: '#9be8c0', d: '+1 skeleton, but skeletons deal 20% less damage', cap: 1, more: .8, fn: (s, v) => { s.army += v.cap; s.more *= v.more; } },
  // Volley: the totem shoots the `targets` nearest monsters at once, each bolt `mult` × the damage.
  volley: { n: 'Volley', for: ['totem'], icon: '⋰', col: '#ff7a2a', d: 'Flame Totem shoots the two nearest monsters at once, each bolt dealing 20% less damage', targets: 2, mult: .8, fn: s => s.volley = 1 },
  // Twin Meteor: a second meteor `delay` s later, `off` radii away, `mult` × the damage.
  twinmeteor: { n: 'Twin Meteor', for: ['meteor'], icon: '⁂', col: '#ffb070', d: 'A second meteor lands beside the first, dealing 30% less damage', delay: .3, off: 1.1, mult: .7, fn: s => s.twin = 1 },
  quickstep: { n: 'Quick Step', for: ['blink', 'dash'], icon: '»', col: '#9fe8ff', d: '+1 charge', ch: 1, fn: (s, v) => s.ch += v.ch },
  lingering: { n: 'Lingering Frost', for: ['ward'], icon: '❆', col: '#8fe0ff', d: 'Frost Ward lasts 50% longer', dur: .5, fn: (s, v) => s.dur += v.dur },
};
for (const k in SUPPORTS) Object.assign(SUPPORTS[k], { kind: 'support', ms: {} });
// Does support `sup` work with skill gem `gem`?
export const supFits = (sup, gem) => !!SUPPORTS[sup] && !!GEMS[gem] && (SUPPORTS[sup].for.includes(gem) || SUPPORTS[sup].for.includes(GEMS[gem].kind));
// Any gem's definition, skill or support.
export const gemDef = id => GEMS[id] || SUPPORTS[id];
// Passive notables that became support gems: old saves get the point back and the gem in the bag.
export const OLD_NOTABLES = { multi: 'twin', pierce: 'searing', chain: 'forked', ward: 'warding', ignite: 'ignite', shatter: 'shatter', conduit: 'conduit', inferno: 'chainboom' };

// Gem drops: guardians always drop one, rares sometimes (DROP.gem in data/items.js). One pool per region.
//   supportBias: weight of a support that fits a skill gem you own (everything else weighs 1), so drops are usually usable.
//   lvlUnder: a dropped gem's level is the tier's par Main gem level (PAR_GEM) minus this, at least 1.
export const GEM_POOL = {
  crypt: ['fireball', 'frostlance', 'arc', 'nova', 'totem', 'meteor', 'skeletons', 'blink', 'ward', 'dash', ...Object.keys(SUPPORTS)],
};
export const GEM_DROP = { supportBias: 3, lvlUnder: 3 };
// Feeding a spare gem into another (design notes, feeding table): share of the fed gem's XP that moves.
// same: the same gem; kind: the same kind (attack, guard, evade, support); other: anything else. mastery: extra share when the fed gem is maxed.
export const FEED = { same: 1, kind: .5, other: .25, mastery: .25 };

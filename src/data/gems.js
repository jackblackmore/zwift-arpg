// Skill gems and the skill bar (docs/design-notes.md "Gem model in detail", docs/build-order.md step 1).
// A gem gives a skill; its numbers (cost, cast time, cooldown, radius...) stay in data/skills.js under `sk`.
//   kind: attack | guard | evade (which slots take it). held: casts repeatedly while the button is down,
//   else one cast per press (holding recasts when ready). elem: damage type. ms: milestone level → text.
//   mile: the level 5 milestone's numbers. `add` goes into that skill's stat sums (game/formulas.js computeStats); the other
//   fields are read by the skill's own code (src/game/sk/). Keep the `ms` text in step with them.

export const GEMS = {
  // Melee attacks (src/game/sk/strike.js): `melee` marks them. The Main gem auto-attacks what's in reach (game/gems.js).
  // Sword: the plain starting attack (physical). Its milestone: every `every`th swing is a heavy cut, `mult` × the damage and
  // `stagger` × a normal swing's stagger fill.
  sword: { n: 'Sword', kind: 'attack', held: 1, melee: 1, sk: 'sword', elem: 'phys', icon: '🗡', col: '#d8dce8', d: 'A plain sword swing at whatever is in front of you', ms: { 5: 'Every 3rd swing is a heavy cut: 20% more damage and 3× the stagger' }, mile: { every: 3, mult: 1.2, stagger: 3 } },
  cleave: { n: 'Ember Cleave', kind: 'attack', held: 1, melee: 1, sk: 'cleave', elem: 'fire', icon: '⚔', col: '#ff8a3c', d: 'A wide burning swing that hits everything in front of you', ms: { 5: 'Swings 25% wider and reaches 15% further' }, mile: { arc: 1.25, reach: 1.15 } },
  fstrike: { n: 'Frost Strike', kind: 'attack', held: 1, melee: 1, sk: 'fstrike', elem: 'cold', icon: '✦', col: '#9fe8ff', d: 'A quick, narrow, hard-hitting strike that chills', ms: { 5: 'Every 3rd strike freezes what it hits for 0.8s' }, mile: { every: 3, freeze: .8 } },
  slam: { n: 'Thunder Slam', kind: 'attack', held: 1, melee: 1, sk: 'slam', elem: 'light', icon: '⚒', col: '#c98bff', d: 'A slow overhead slam: a big hit in a circle in front of you that knocks back and can shock', ms: { 5: '+25% radius' }, mile: { radius: 1.25 } },
  arc: { n: 'Arc', kind: 'attack', held: 1, sk: 'arc', elem: 'light', icon: 'ϟ', col: '#c98bff', d: 'Lightning that chains between enemies', ms: { 5: '+2 chains' }, mile: { add: { chains: 2 } } },
  nova: { n: 'Frost Nova', kind: 'attack', held: 0, sk: 'nova', elem: 'cold', icon: '❄', col: '#7fd8ff', d: 'A ring of frost that damages and freezes everything around you', ms: { 5: '+25% radius' }, mile: { add: { novaR: .25 } } },
  totem: { n: 'Flame Totem', kind: 'attack', held: 0, sk: 'totem', elem: 'fire', icon: '♨', col: '#ff7a2a', d: 'Plants a totem that shoots fire bolts at the nearest monster for a few seconds', ms: { 5: 'Lasts 50% longer' }, mile: { dur: 1.5 } },
  meteor: { n: 'Meteor', kind: 'attack', held: 0, sk: 'meteor', elem: 'fire', icon: '☄', col: '#ff5a1a', d: 'Calls a meteor down on the aimed spot: a big fire hit and burning ground', ms: { 5: '+30% radius' }, mile: { radius: 1.3 } },
  // The knight's shield (src/game/sk/guard.js): hold Guard to block, press just before a hit to parry. The starting Guard gem.
  block: { n: "Knight's Shield", kind: 'guard', held: 0, shield: 1, sk: 'block', icon: '🛡', col: '#e8d8a8', d: 'Hold to block hits from the front. Press just before a hit lands to parry: no damage, and the attacker staggers', ms: {}, mile: {} },
  // Roll (src/game/sk/roll.js): the starting Evade gem. Untouchable for a moment.
  roll: { n: 'Roll', kind: 'evade', held: 0, sk: 'roll', icon: '↻', col: '#c8e0ff', d: 'Roll out of the way, untouchable for a moment. Rolls the way you steer, or away from the nearest threat', ms: {}, mile: {} },
  // Shield arts (src/game/sk/arts.js; numbers in SK.shield and SK.ward): Guard gems that keep the block and parry and change them.
  // `art` names the art; `d` carries its numbers (npm test checks them against SK).
  shield: { n: 'Magic Shield', kind: 'guard', held: 0, shield: 1, art: 'shield', sk: 'shield', icon: '◎', col: '#7fb8ff', d: 'A shield art: block and parry as with the Knight\'s Shield. A parry wraps you in a barrier worth 12% of your life (stacking up to 30%, for 5s), and blocks take off a little more, but its riposte is weaker', ms: { 5: 'Its barrier absorbs 25% more' }, mile: { add: { shieldPct: .25 } } },
  blink: { n: 'Blink', kind: 'evade', held: 0, sk: 'blink', elem: 'cold', icon: '⇝', col: '#9fe8ff', d: 'Teleport away from the nearest threat, untouchable for a moment', ms: { 5: 'Leaves a frost burst behind that chills' }, mile: { burstR: 3, burstMult: .9, burstChill: 3 } },
  ward: { n: 'Frost Ward', kind: 'guard', held: 0, shield: 1, art: 'ward', sk: 'ward', elem: 'cold', icon: '❅', col: '#8fe0ff', d: 'A shield art: block and parry as with the Knight\'s Shield. A parry chills the attacker for 2.5s (a guardian more briefly) and leaves a frost ring for 3s that chills and bites monsters inside, but blocks take off less', ms: { 5: 'Frost rings +25% radius' }, mile: { radius: 1.25 } },
  dash: { n: 'Flame Dash', kind: 'evade', held: 0, sk: 'dash', elem: 'fire', icon: '➶', col: '#ff6a1a', d: 'Dash through the monster you aim at, hitting everything you pass and leaving burning ground', ms: { 5: '+1 charge' }, mile: { add: { dashCh: 1 } } },
};

// Skill bar, in button order. unlock: character level. kinds: gem kinds the slot takes.
// sock: support sockets as [character level, sockets from then on] (design notes, skill bar table). Levels past the Crypt are data only for now.
export const SLOT_DEFS = {
  main: { n: 'Main', unlock: 1, kinds: ['attack'], key: 'LMB', sock: [[1, 1], [15, 2], [30, 3], [45, 4]] },
  flexA: { n: 'Flex A', unlock: 5, kinds: ['attack'], key: 'RMB', sock: [[5, 1], [25, 2]] },
  flexB: { n: 'Flex B', unlock: 10, kinds: ['attack'], key: 'Q', sock: [[10, 1], [25, 2]] },
  guard: { n: 'Guard', unlock: 1, shrineLvl: 3, kinds: ['guard'], key: 'SPACE', sock: [[1, 1]] },
  evade: { n: 'Evade', unlock: 1, shrineLvl: 8, kinds: ['evade'], key: 'E', sock: [[8, 1]] },
};
export const BAR = Object.keys(SLOT_DEFS);

// Shrines: one per slot unlock, pick 1 of the offered gems. A new character starts with the Sword, the Knight's Shield and Roll
// (START_*), so Main has no shrine. Evade's shrine at level 8 (shrineLvl) offers a gem to replace Roll; Guard's at level 3 puts
// a shield art (Frost Ward or Magic Shield) in the bag. Flex shrines skip attack gems you already own while there are others to offer.
export const SHRINES = { flexA: ['nova', 'arc', 'meteor', 'totem', 'cleave', 'fstrike', 'slam'], flexB: ['nova', 'arc', 'meteor', 'totem', 'cleave', 'fstrike', 'slam'], evade: ['dash', 'blink'], guard: ['ward', 'shield'] };
export const START_MAIN = 'sword', START_GUARD = 'block', START_EVADE = 'roll';

// Gem levels. Base damage = base × grow^(level − 1), for every gem (skill `mult` in data/skills.js scales it per skill).
// Gems earn the same XP as the character from kills (`offBar` share when not on the bar) and level on the character's curve.
// Shrine gems for Flex slots start `flexStart` levels below your Main gem.
export const GEM = { cap: 10, base: 4, grow: 1.18, offBar: .1, flexStart: 2 };

// Support gems (step 3): socketed on a skill bar slot, they change only the skill gem in that slot.
//   for: gem ids or gem kinds it works with. Every number a support uses is a field of its entry (keep the `d` text in step).
//   fn(s, v) adds to the raw stat sums like a passive does (game/formulas.js computeStats), on that skill's own copy of the
//   sums, so it never touches another skill; v is the entry itself. Fields fn doesn't use are read by the skill's own code.
//   more: a damage multiplier for that skill. Supports level like skill gems (feeding fuel, fusing later); their effect doesn't grow with level yet.
export const SUPPORTS = {
  // Sweep: Ember Cleave hits all the way round you, each hit `more` × the damage.
  sweep: { n: 'Sweep', for: ['cleave'], icon: '◌', col: '#ff8a3c', d: 'Ember Cleave hits all the way round you, but deals 25% less damage', more: .75, fn: (s, v) => { s.sweep = 1; s.more *= v.more; } },
  // Brittle: enemies hit take `taken` more damage from everything for `dur` s (the shock status).
  brittle: { n: 'Brittle', for: ['fstrike'], icon: '❖', col: '#9fe8ff', d: 'Enemies hit by Frost Strike take 20% more damage from everything for 3s', taken: .2, dur: 3, fn: s => s.brittle = 1 },
  // Aftershock: a second slam on the same spot `delay` s later, `mult` × the damage.
  aftershock: { n: 'Aftershock', for: ['slam'], icon: '≋', col: '#c98bff', d: 'Thunder Slam hits the same spot again 0.4s later for 35% of the damage', delay: .4, mult: .35, fn: s => s.aftershock = 1 },
  // Raise Skeletons: a kill by the socketed skill has `chance` to rise as a skeleton that fights for you, up to `cap` at once.
  // The skeleton's own numbers (life, hits, speed) are SK.skeletons in data/skills.js; it scales with the socketed gem's level.
  raise: { n: 'Raise Skeletons', for: ['attack'], icon: '☠', col: '#9be8c0', d: 'Enemies killed by this skill have a 25% chance to rise as a skeleton that fights for you (up to 3)', chance: .25, cap: 3, fn: s => s.raise = 1 },
  // Ignite: a burn of `share` × the hit, spread over `dur` seconds.
  ignite: { n: 'Ignite', for: ['cleave', 'meteor'], icon: '♆', col: '#ff5a2a', d: 'Its hits burn enemies for 20% of the hit over 3s', share: .2, dur: 3, fn: s => s.ignite = 1 },
  forked: { n: 'Forked Sky', for: ['arc'], icon: 'ψ', col: '#c98bff', d: 'Arc chains +2 more times', chains: 2, fn: (s, v) => s.chains += v.chains },
  // Conduit: Arc always shocks, and its shocks add `shockMore` damage taken (a normal shock adds SK.arc.shockMore).
  conduit: { n: 'Conduit', for: ['arc'], icon: '⌁', col: '#c98bff', d: 'Arc always shocks, and its shocked enemies take 35% more damage instead of 20%', shockMore: .35, fn: s => s.conduit = 1 },
  // Shatter: a frozen enemy's death deals `pct` of its max life to enemies within `radius`, and freezes them for `freeze` s.
  shatter: { n: 'Shatter', for: ['nova'], icon: '✳', col: '#7fd8ff', d: 'Enemies frozen by Frost Nova explode on death, dealing 30% of their life to foes nearby and freezing them', pct: .3, radius: 2.4, freeze: .9, fn: s => s.shatter = 1 },
  // Warding: Magic Shield's parry barrier (and its cap) is `shieldPct` bigger.
  warding: { n: 'Warding', for: ['shield'], icon: '⊚', col: '#7fb8ff', d: 'Magic Shield\'s parry barrier absorbs 30% more', shieldPct: .3, fn: (s, v) => s.shieldPct += v.shieldPct },
  // Volley: the totem shoots the `targets` nearest monsters at once, each bolt `mult` × the damage.
  volley: { n: 'Volley', for: ['totem'], icon: '⋰', col: '#ff7a2a', d: 'Flame Totem shoots the two nearest monsters at once, each bolt dealing 20% less damage', targets: 2, mult: .8, fn: s => s.volley = 1 },
  // Twin Meteor: a second meteor `delay` s later, `off` radii away, `mult` × the damage.
  twinmeteor: { n: 'Twin Meteor', for: ['meteor'], icon: '⁂', col: '#ffb070', d: 'A second meteor lands beside the first, dealing 30% less damage', delay: .3, off: 1.1, mult: .7, fn: s => s.twin = 1 },
  quickstep: { n: 'Quick Step', for: ['blink', 'dash'], icon: '»', col: '#9fe8ff', d: '+1 charge', ch: 1, fn: (s, v) => s.ch += v.ch },
  // Lingering Frost: Frost Ward's parry chill and frost rings last `dur` longer.
  lingering: { n: 'Lingering Frost', for: ['ward'], icon: '❆', col: '#8fe0ff', d: 'Frost Ward\'s parry chill and frost rings last 50% longer', dur: .5, fn: (s, v) => s.dur += v.dur },
};
for (const k in SUPPORTS) Object.assign(SUPPORTS[k], { kind: 'support', ms: {} });
// Does support `sup` work with skill gem `gem`?
export const supFits = (sup, gem) => !!SUPPORTS[sup] && !!GEMS[gem] && (SUPPORTS[sup].for.includes(gem) || SUPPORTS[sup].for.includes(GEMS[gem].kind));
// Any gem's definition, skill or support.
export const gemDef = id => GEMS[id] || SUPPORTS[id];

// Gem drops: guardians always drop one, rares sometimes (DROP.gem in data/items.js). One pool per region.
//   supportBias: weight of a support that fits a skill gem you own (everything else weighs 1), so drops are usually usable.
//   lvlUnder: a dropped gem's level is the tier's par Main gem level (PAR_GEM) minus this, at least 1.
export const GEM_POOL = {
  crypt: ['cleave', 'fstrike', 'slam', 'arc', 'nova', 'totem', 'meteor', 'blink', 'ward', 'dash', ...Object.keys(SUPPORTS)],
};
export const GEM_DROP = { supportBias: 3, lvlUnder: 3 };
// Feeding a spare gem into another (design notes, feeding table): share of the fed gem's XP that moves.
// same: the same gem; kind: the same kind (attack, guard, evade, support); other: anything else. mastery: extra share when the fed gem is maxed.
export const FEED = { same: 1, kind: .5, other: .25, mastery: .25 };

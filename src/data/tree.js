// The passive tree (build order step 4; design notes "Passive tree"). One point per character level after the first; it replaced
// the pick-1-of-3 level-up cards. The tree owns % increases and survival; gems own skill behaviour, gear flat damage and most defence.
//
// Each node: n name, at [column, row] on a 7 × 15 grid (drawn tall on a phone held upright, turned on its side when the screen is wide),
// kind: start | small | notable | key, links: neighbours (listed once, either end), d: the text players read, v: its numbers.
// fn(s, v) adds v to the raw stat sums in game/formulas.js computeStats (the default adds every field of v). A keystone (kind key)
// instead switches a rule on: computeStats puts its v in st.ks[id], and the fight code reads it.
// npm test checks that every number in v appears in d (see TREE_UNIT), so keep the text in step with the numbers.
//
// Stat sums the nodes add to (all "increased", added together):
//   dmg (all damage), fire / cold / light, cast (attack and cast speed), crit (chance), aoe (area), ms (movement speed),
//   lifePct (maximum life), lregen (life per second), lok (life per kill), surge (Surge capacity), surgeRe (Surge refill speed),
//   flask (flask healing), freeze (freeze duration),
//   fight (game/sk/guard.js, roll.js, combat.js): block (share of a normal hit a block takes off, added), heavy (the same for heavy
//   and elemental hits), posture (blocked hits fill posture this much slower; at most TREE_CAP.posture), drain (posture drains
//   faster), parry (parry window longer), riposte (riposte damage), stagger (your hits and parries fill stagger faster), finisher
//   (finisher damage), evadeInv (Evade skills keep you untouchable longer), evadeCh (+ charges for the Evade gem).

const add = (s, v) => { for (const k in v) s[k] = (s[k] || 0) + v[k]; };

export const TREE = {
  // ---- the core (middle row): where every path starts, life on the left, Surge on the right ----
  oath: { n: "Knight's Oath", at: [3, 7], kind: 'start', links: ['hardy', 'breath', 'steady', 'focus', 'keen', 'hands', 'power', 'precise'], d: 'Where every path begins', v: {} },
  keen: { n: 'Keen Edge', at: [2, 6], kind: 'small', links: ['mend', 'counter'], d: '+6% damage', v: { dmg: .06 } },
  power: { n: 'Raw Power', at: [2, 8], kind: 'small', links: ['hunger', 'fire1'], d: '+6% damage', v: { dmg: .06 } },
  hands: { n: 'Quick Hands', at: [4, 6], kind: 'small', links: ['recover', 'brace'], d: '+4% attack and cast speed', v: { cast: .04 } },
  precise: { n: 'Precision', at: [4, 8], kind: 'small', links: ['medic', 'light1'], d: '+2% critical strike chance', v: { crit: .02 } },
  hardy: { n: 'Hardy', at: [2, 7], kind: 'small', links: ['iron'], d: '+6% maximum life', v: { lifePct: .06 } },
  iron: { n: 'Iron Body', at: [1, 7], kind: 'notable', links: ['mend', 'hunger'], d: '+12% maximum life and +1 life regenerated per second', v: { lifePct: .12, lregen: 1 } },
  mend: { n: 'Mending', at: [1, 6], kind: 'small', links: [], d: '+1 life regenerated per second', v: { lregen: 1 } },
  hunger: { n: 'Soul Hunger', at: [1, 8], kind: 'small', links: ['pact'], d: '+3 life per kill', v: { lok: 3 } },
  pact: { n: 'Blood Pact', at: [0, 8], kind: 'small', links: ['blood'], d: '+6% maximum life', v: { lifePct: .06 } },
  blood: { n: 'Blood Rite', at: [0, 9], kind: 'key', links: [], d: 'Your Main and Flex skills have no cooldowns or charges: at most one cast every 0.5s. Every cast costs 5% of your maximum life', v: { gap: .5, cost: .05 } },
  breath: { n: 'Deep Breath', at: [4, 7], kind: 'small', links: ['wind'], d: '+8% Surge capacity', v: { surge: .08 } },
  wind: { n: 'Second Wind', at: [5, 7], kind: 'notable', links: ['recover', 'reserve', 'medic'], d: '+15% Surge capacity and the gauge refills 15% faster', v: { surge: .15, surgeRe: .15 } },
  recover: { n: 'Recovery', at: [5, 6], kind: 'small', links: [], d: 'The Surge gauge refills 10% faster', v: { surgeRe: .1 } },
  reserve: { n: 'Deep Reserves', at: [6, 7], kind: 'small', links: [], d: '+10% Surge capacity', v: { surge: .1 } },
  medic: { n: 'Field Medic', at: [5, 8], kind: 'small', links: ['fleet'], d: 'Flasks heal 15% more', v: { flask: .15 } },
  fleet: { n: 'Fleet Foot', at: [6, 8], kind: 'small', links: [], d: '+6% movement speed', v: { ms: .06 } },

  // ---- the shield (top): riposte on the left, parry in the middle, block and posture on the right; roll and finisher between ----
  steady: { n: 'Steady Stance', at: [3, 6], kind: 'small', links: ['counter', 'reflex', 'brace'], d: 'Blocked hits fill your posture 10% slower', v: { posture: .1 } },
  counter: { n: 'Counterstroke', at: [2, 5], kind: 'small', links: ['sharpen'], d: 'Ripostes deal 15% more damage', v: { riposte: .15 } },
  sharpen: { n: 'Sharpened Steel', at: [1, 4], kind: 'small', links: ['venge'], d: '+6% damage', v: { dmg: .06 } },
  venge: { n: 'Vengeance', at: [1, 3], kind: 'notable', links: ['punish', 'nimble'], d: 'Ripostes deal 25% more damage and +6% damage', v: { riposte: .25, dmg: .06 } },
  punish: { n: 'Punish', at: [1, 2], kind: 'small', links: ['wound', 'tumbler'], d: 'Ripostes deal 15% more damage', v: { riposte: .15 } },
  wound: { n: 'Open Guard', at: [0, 1], kind: 'small', links: ['riposte'], d: 'Your hits and parries fill stagger 10% faster', v: { stagger: .1 } },
  riposte: { n: 'Riposte', at: [0, 0], kind: 'key', links: [], d: 'Every parry ripostes at once: you strike the attacker back with your Main attack. Blocked hits fill your posture 50% faster', v: { posture: .5 } },
  reflex: { n: 'Quick Reflexes', at: [3, 5], kind: 'small', links: ['trigger'], d: 'Your parry window is 10% longer', v: { parry: .1 } },
  trigger: { n: 'Hair Trigger', at: [3, 4], kind: 'notable', links: ['measure'], d: 'Your parry window is 20% longer and your hits and parries fill stagger 10% faster', v: { parry: .2, stagger: .1 } },
  measure: { n: 'Measured', at: [3, 3], kind: 'small', links: ['poise', 'nimble', 'cut'], d: 'Your hits and parries fill stagger 10% faster', v: { stagger: .1 } },
  poise: { n: 'Poise', at: [3, 2], kind: 'small', links: ['master'], d: 'Your parry window is 10% longer', v: { parry: .1 } },
  master: { n: 'Swordmaster', at: [3, 1], kind: 'notable', links: ['duelist'], d: 'Your parry window is 10% longer and ripostes deal 20% more damage', v: { parry: .1, riposte: .2 } },
  duelist: { n: 'Duelist', at: [3, 0], kind: 'key', links: [], d: 'Your parry window is 60% longer. You can\'t block: holding Guard does nothing, so only a parry or a roll stops a hit', v: { parry: .6 } },
  brace: { n: 'Brace', at: [4, 5], kind: 'small', links: ['settle'], d: 'Blocks take off 4% more of a hit', v: { block: .04 } },
  settle: { n: 'Settle', at: [5, 4], kind: 'small', links: ['wall'], d: 'Your posture drains 20% faster', v: { drain: .2 } },
  wall: { n: 'Shieldwall', at: [5, 3], kind: 'notable', links: ['stout', 'cut'], d: 'Blocks take off 6% more of a hit and 10% more of a heavy one, and blocked hits fill your posture 10% slower', v: { block: .06, heavy: .1, posture: .1 } },
  stout: { n: 'Stout', at: [5, 2], kind: 'small', links: ['anchor'], d: 'Blocked hits fill your posture 10% slower', v: { posture: .1 } },
  anchor: { n: 'Anchored', at: [6, 1], kind: 'small', links: ['bulwark'], d: 'Blocks take off 10% more of a heavy hit', v: { heavy: .1 } },
  bulwark: { n: 'Bulwark', at: [6, 0], kind: 'key', links: [], d: 'Blocking doesn\'t slow you, and blocked hits fill your posture 25% slower. You can\'t parry: a Guard press only blocks', v: { posture: .25 } },
  nimble: { n: 'Light Feet', at: [2, 3], kind: 'small', links: ['tumbler'], d: 'Evade skills keep you untouchable 20% longer', v: { evadeInv: .2 } },
  tumbler: { n: 'Tumbler', at: [2, 2], kind: 'notable', links: [], d: '+1 Evade charge and Evade skills keep you untouchable 10% longer', v: { evadeCh: 1, evadeInv: .1 } },
  cut: { n: 'Clean Cut', at: [4, 3], kind: 'small', links: ['headsman'], d: 'Finishers deal 15% more damage', v: { finisher: .15 } },
  headsman: { n: 'Headsman', at: [4, 2], kind: 'notable', links: ['execute'], d: 'Finishers deal 25% more damage and your hits and parries fill stagger 10% faster', v: { finisher: .25, stagger: .1 } },
  execute: { n: 'Executioner', at: [4, 1], kind: 'small', links: ['master'], d: 'Finishers deal 15% more damage', v: { finisher: .15 } },

  // ---- the elements (bottom): fire on the left, cold in the middle, lightning on the right. They feed every skill of that element ----
  focus: { n: 'Elemental Focus', at: [3, 8], kind: 'small', links: ['fire1', 'cold1', 'light1'], d: '+6% fire, cold and lightning damage', v: { fire: .06, cold: .06, light: .06 } },
  fire1: { n: 'Kindle', at: [2, 9], kind: 'small', links: ['fire2', 'vast'], d: '+10% fire damage', v: { fire: .1 } },
  vast: { n: 'Magnitude', at: [2, 10], kind: 'small', links: [], d: '+8% area of effect', v: { aoe: .08 } },
  fire2: { n: 'Heat', at: [1, 10], kind: 'small', links: ['pyro'], d: '+10% fire damage', v: { fire: .1 } },
  pyro: { n: 'Pyromancy', at: [1, 11], kind: 'notable', links: ['fire3', 'steam'], d: '+20% fire damage and +8% area of effect', v: { fire: .2, aoe: .08 } },
  fire3: { n: 'Cinders', at: [0, 12], kind: 'small', links: ['fire4'], d: '+10% fire damage', v: { fire: .1 } },
  fire4: { n: 'Blaze', at: [0, 13], kind: 'small', links: ['wildfire'], d: '+10% fire damage', v: { fire: .1 } },
  wildfire: { n: 'Wildfire', at: [0, 14], kind: 'notable', links: [], d: '+25% fire damage and +3 life per kill', v: { fire: .25, lok: 3 } },
  steam: { n: 'Steam', at: [2, 12], kind: 'small', links: ['cold4'], d: '+8% fire and cold damage', v: { fire: .08, cold: .08 } },
  cold1: { n: 'Chill', at: [3, 9], kind: 'small', links: ['cold2'], d: '+10% cold damage', v: { cold: .1 } },
  cold2: { n: 'Deep Freeze', at: [3, 10], kind: 'small', links: ['rime'], d: 'Freezes last 15% longer', v: { freeze: .15 } },
  rime: { n: 'Rime', at: [3, 11], kind: 'notable', links: ['cold4'], d: '+20% cold damage and freezes last 15% longer', v: { cold: .2, freeze: .15 } },
  cold4: { n: 'Hoarfrost', at: [3, 12], kind: 'small', links: ['cold5', 'spark'], d: '+10% cold damage', v: { cold: .1 } },
  cold5: { n: 'Glacier', at: [3, 13], kind: 'small', links: ['winter'], d: '+10% cold damage', v: { cold: .1 } },
  winter: { n: "Winter's Heart", at: [3, 14], kind: 'notable', links: [], d: '+25% cold damage and +6% maximum life', v: { cold: .25, lifePct: .06 } },
  light1: { n: 'Static', at: [4, 9], kind: 'small', links: ['light2', 'arcing'], d: '+10% lightning damage', v: { light: .1 } },
  arcing: { n: 'Arcing', at: [4, 10], kind: 'small', links: [], d: '+2% critical strike chance', v: { crit: .02 } },
  light2: { n: 'Charge', at: [5, 10], kind: 'small', links: ['volt'], d: '+10% lightning damage', v: { light: .1 } },
  volt: { n: 'Voltaics', at: [5, 11], kind: 'notable', links: ['light3', 'spark'], d: '+20% lightning damage and +4% attack and cast speed', v: { light: .2, cast: .04 } },
  light3: { n: 'Surge Line', at: [6, 12], kind: 'small', links: ['light4'], d: '+10% lightning damage', v: { light: .1 } },
  light4: { n: 'Storm Step', at: [6, 13], kind: 'small', links: ['thunder'], d: '+10% lightning damage', v: { light: .1 } },
  thunder: { n: 'Thunderlord', at: [6, 14], kind: 'notable', links: [], d: '+25% lightning damage and +3% critical strike chance', v: { light: .25, crit: .03 } },
  spark: { n: 'Spark', at: [4, 12], kind: 'small', links: [], d: '+8% cold and lightning damage', v: { cold: .08, light: .08 } },
};
for (const id in TREE) if (!TREE[id].fn && TREE[id].kind !== 'key') TREE[id].fn = add;
export const TREE_START = 'oath';
// Caps on summed tree stats (so stacking posture can't make blocking free).
export const TREE_CAP = { posture: .5, block: .95 };
// How each number of v is written in its node's text (npm test): a share as a percent (.15 → 15%), `n` as a plain number, `s` as seconds.
export const TREE_UNIT = { lregen: 'n', lok: 'n', evadeCh: 'n', gap: 's' };

// Respec (game/tree.js): a full reset is free in a safe place, the room you enter a map by or a rest room's flame, while no monster
// is awake within `calm` units. Anywhere, points you took since you opened the tree can be taken back (a misclick isn't a respec).
export const RESPEC = { calm: 14 };

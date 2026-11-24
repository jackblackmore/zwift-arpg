// Skills cost nothing (there is no mana): held skills are limited by `cast` (seconds per cast), press skills by `cd` or `charges`.
// Skill tuning, one entry per skill gem (data/gems.js `sk`). `mult` scales the hit: (gem base + flat spell from gear) × mult (game/formulas.js).
// Milestone and support numbers live with the gem in data/gems.js (`mile`, SUPPORTS).
export const SK = {
  // Melee attacks (src/game/sk/strike.js). cast: seconds per swing (faster with cast speed and Surge). The hit lands `windup` s into it.
  //   cleave/fstrike: everything within `reach` (+ the monster's radius) of you and inside a cone `arc` degrees wide.
  //   slam: a circle of `radius` centred `reach` in front of you. kb: knockback (× the default), stop: hit-stop on a connecting swing.
  //   Ember Cleave can ignite (support). Frost Strike chills for `chill` s. Thunder Slam shocks `shockChance` of the time (Arc's shock).
  sword: { cast: .7, mult: 1, windup: .12, reach: 2.2, arc: 110, kb: .3, stop: .035 },
  cleave: { cast: .8, mult: .93, windup: .12, reach: 2.4, arc: 150, kb: .35, stop: .035 },
  fstrike: { cast: .62, mult: .95, windup: .1, reach: 2.1, arc: 90, kb: .2, stop: .03, chill: 2 },
  slam: { cast: 1.3, mult: 1.5, windup: .3, reach: 1.5, radius: 1.9, kb: 1, stop: .07, shockChance: .35 },
  // Arc: shocks `shockChance` of the time for `shockT` s; shocked enemies take `shockMore` more damage from everything.
  arc: { cast: .8, mult: .9, range: 11, chainRange: 5.5, shockChance: .3, shockT: 3, shockMore: .2 },
  // Frost Nova: freezes for `freeze` s (× freeze duration); guardians can't be frozen and are chilled for `bossChill` s instead.
  nova: { cd: 6, radius: 4.2, mult: 1.4, freeze: 1.3, bossChill: 3, bot: { crowd: 2 } },
  // Flame Totem: lasts `dur` s, a bolt every `interval` s at the nearest monster within `range` of the totem; placed within `place` of you.
  totem: { cd: 9, dur: 6, interval: .45, mult: .5, range: 9, place: 9, bot: { range: 9, crowd: 1 } },
  // Meteor: lands `delay` s after the cast, within `range`; hits `radius`, leaves burning ground for `burn` s.
  meteor: { cd: 10, delay: .8, mult: 1.7, radius: 2.6, range: 13, burn: 3, bot: { range: 9, crowd: 2 } },
  // Skeletons raised by the Raise Skeletons support (data/gems.js SUPPORTS.raise: chance and cap; game/sk/skeletons.js).
  //   life: at gem level 1 of the skill that raised it, × lifeGrow per level. Hits are `mult` × that gem's base (physical: only generic % damage applies),
  //   every `atk` seconds after a `windup` (both faster with cast speed). They can't act for `riseT` of their rise clip, chase awake
  //   monsters within `leash` of you, return when you're `leash` + 2 away, and jump back to you beyond `warp`.
  skeletons: {
    life: 45, lifeGrow: 1.06, mult: 1.05, atk: 1.05, windup: .28, reach: .7, spd: 5.6, r: .32, h: 1.45, riseT: .5,
    leash: 10, follow: 2.2, warp: 24,
    look: { kind: 'minion', weapon: 'blade', tint: 0xb8ffd8, glow: 0x0c3a26, walk: 'Running_A', idle: 'Skeletons_Idle', rise: 'floor',
      attacks: [['Melee_1H_Attack_Chop', 1.9], ['Melee_1H_Attack_Stab', 1.9], ['Melee_1H_Attack_Slice_Diagonal', 1.8]] },
    model: { col: 0x9adfc0, head: 0xd8ffe8, eye: 0x40ffb0, scale: .8 },
  },
  // Knight's Shield (src/game/sk/guard.js; design notes "Fight mechanics"). Blocking covers hits from within `arc` degrees of where
  //   you face (you turn to the nearest threat while blocking) and moves you at `move` × speed. A block takes off `block` of a normal
  //   hit, `heavy` of a heavy one and `elem` of an elemental one. Posture (0..1): a blocked hit adds `posture` × its damage as a share
  //   of max life; a parry adds `parryPosture` of that. It drains `drain` per second once `drainDelay` s pass without a blocked hit.
  //   Full posture breaks your guard: stunned for `breakT` s, taking `brokenMul` × damage. A press opens a `parry` s window (not again
  //   for `parryCd` s unless a parry lands). A parry makes your next swing within `riposteT` s a riposte: `riposte` × its damage.
  block: { arc: 150, move: .45, block: .75, heavy: .5, elem: .5, posture: 1.5, parryPosture: .1, drain: .3, drainDelay: 1, breakT: 1.6, brokenMul: 1.5,
    parry: .35, parryCd: .7, riposteT: 2, riposte: 1.8 },
  // Roll: the starting Evade gem (src/game/sk/roll.js). Covers `range` in `dur` s, untouchable for `invuln` s; `charges` charges.
  roll: { charges: 2, recharge: 2.2, range: 4, dur: .42, invuln: .4 },
  // Shield arts (src/game/sk/arts.js; design notes "Fight mechanics"): Guard gems that keep the Knight's Shield's block and parry
  //   and change what they do. `guard` overrides fields of SK.block while that gem is in Guard. Sidegrades: each gives something
  //   and costs something, so the Knight's Shield stays a fine choice.
  // Magic Shield: a parry wraps you in a barrier of `barrier` × max life (× shieldMul: Warding, its milestone, gear), stacking up
  //   to `cap` × max life and lasting `dur` s from the last parry. Blocks take off a little more, but a parry gives no riposte.
  shield: { barrier: .12, cap: .3, dur: 5, guard: { block: .82, heavy: .6, riposte: 1 } },
  // Flame Dash: the first Evade gem (level 8 shrine). Gems with `charges` hold that many casts, recharging one per `recharge` seconds.
// Optional `bot: { range, crowd }` tells the arena bot when to use a Flex or Main press gem: an enemy within `range` (default: radius or range, else 9), `crowd` of them (default 1).
  // Flame Dash leaves a patch of burning ground (radius patchR) every patchEvery units.
  dash: { charges: 1, range: 7.5, recharge: 4, patchEvery: 1.1, patchR: .95, invuln: .3 },
  // Blink: teleports `range` away from the nearest threat (its milestone's frost burst is in data/gems.js).
  blink: { charges: 2, range: 6.5, recharge: 5, invuln: .45 },
  // Frost Ward: a parry chills the attacker for `chill` s and leaves a frost ring of `radius` where you stand for `dur` s (both × the
  //   gem's dur: Lingering Frost). Monsters inside stay chilled (data/monsters.js STATUS) and take `mult` × the Frost Ward gem's
  //   base as cold damage every `tick` s, and stay chilled `ringChill` s after leaving. At most `rings` at once (the oldest goes). Its block is lighter: blocks take off less.
  ward: { chill: 2.5, radius: 2.6, dur: 3, tick: .5, mult: .15, ringChill: .6, rings: 3, guard: { block: .65, heavy: .4 } },
  // Burning ground (Flame Dash, Meteor, Wattbringer): `mult` × the gem's base every `tick` s, lasting `life` s.
  burn: { mult: .22, tick: .25, life: 2.4 },
  flask: { heal: .6, dur: 2.5, max: 3, perKill: .05, perRare: 1 },
};
// Surge gauge: the only resource. While surging, casts are `bonus` faster and cooldowns and charges recover `bonus` faster.
// It holds `max` seconds of full surge (more with surge capacity) and drains 1 per second at full surge (RIDE: less on a small surge).
// When it runs dry you're spent: no surging until it refills to `restart` of full. It refills `refill` per second, starting
// `delay` s after you stop surging. Keyboard: hold Shift; touch: tap ⚡ on and off (it switches off when spent); RIDE: ride above endurance pace (data/ride.js).
export const SURGE = { max: 30, bonus: .4, refill: .35, delay: 2, restart: .3 };

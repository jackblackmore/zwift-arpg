// Monster types. look: which KayKit character and weapon to use (render/characters.js) and its clips; bloaters stay procedural.
//   walk/idle: looping clips; attacks: [clip, speed] picked at random per swing; rise: how it wakes (RISE below).
// Monster types. hp/dmg are tier-1 values; maps scale them per tier (TIER below).
export const MT = {
  zombie: { hp: 48, dmg: 8, spd: 2.5, r: .38, cd: 1.4, range: .75, ai: 'melee', xp: 4, col: 0x5f6f4a, head: 0x8a9a6a, eye: 0xff3020, h: 1.8, look: { kind: 'warrior', weapon: 'blade', walk: 'Skeletons_Walking', idle: 'Skeletons_Idle', rise: 'floor', attacks: [['Melee_1H_Attack_Chop', 1.7], ['Melee_1H_Attack_Slice_Diagonal', 1.6], ['Melee_1H_Attack_Slice_Horizontal', 2.1]] } },
  runner: { hp: 24, dmg: 5.5, spd: 4.0, r: .3, cd: .8, range: .6, ai: 'melee', xp: 3, col: 0x7a2a24, head: 0x9a3a2a, eye: 0xffd000, h: 1.35, scale: .75, look: { kind: 'minion', walk: 'Running_A', idle: 'Skeletons_Idle', rise: 'standing', attacks: [['Melee_Unarmed_Attack_Punch_A', 2.2], ['Melee_Unarmed_Attack_Kick', 1.8]] } },
  archer: { hp: 32, dmg: 10, spd: 2.3, r: .34, cd: 1.8, range: 8, ai: 'ranged', xp: 4, col: 0xb8ae96, head: 0xe6dfcc, eye: 0xff3020, h: 1.8, bow: 1, look: { kind: 'rogue', weapon: 'crossbow', walk: 'Running_A', idle: 'Skeletons_Idle', rise: 'standing', attacks: [['Ranged_2H_Shoot', 1.3]] } },
  bloater: { hp: 55, dmg: 22, spd: 1.6, r: .6, cd: 0, ai: 'bomb', xp: 5, col: 0x6aa040, head: 0x9ad060, eye: 0xffff60, h: 1.6, blob: 1 },
  boss: { hp: 1040, dmg: 10.5, spd: 2.4, r: 1.1, cd: 1.7, range: 1.8, ai: 'boss', xp: 160, col: 0x2a2236, head: 0x5a4a70, eye: 0xff2bd6, h: 5.6, scale: 2.6, horns: 1, look: { kind: 'warrior', weapon: 'axe', offhand: 'shield', walk: 'Walking_A', idle: 'Melee_2H_Idle', rise: 'taunt', tint: 0xb090d0, attacks: [['Melee_2H_Attack_Chop', 1.6], ['Melee_2H_Attack_Slice', 1.1]] } },
};

// Waking up. Until a pack is woken, its skeletons hold `pose`; on waking they play `clip` and can't act for its length.
export const RISE = {
  floor: { pose: 'Skeletons_Inactive_Floor_Pose', clip: 'Skeletons_Awaken_Floor', speed: 2 },
  standing: { pose: 'Skeletons_Inactive_Standing_Pose', clip: 'Skeletons_Awaken_Standing', speed: 1.5 },
  taunt: { clip: 'Skeletons_Taunt', speed: 1 },
};
// Other clips: deaths (picked at random), hit reactions (when a hit takes at least `minHit` of max life), boss casts, stagger.
export const ANIM = {
  deaths: ['Death_A', 'Death_B', 'Skeletons_Death'], hits: ['Hit_A', 'Hit_B'], hitSpeed: 1.6, minHit: .12,
  bossCast: { slam: ['Melee_2H_Attack_Spin', 1], nova: ['Ranged_Magic_Shoot', .8], summon: ['Ranged_Magic_Summon', 1.8], charge: ['Skeletons_Taunt', 1.2] },
  stun: ['Hit_B', .5], // staggered (STAGGER)
};

// Per-tier scaling. hp: monster life multiplier per map tier (index 0 = tier 1), then +hpAfter per tier.
// Tier 2 jumps because by then you've swapped the starter sword for magic gear (see `npm run balance`).
// dmg, xp, packSize: fraction added per tier on top of tier 1.
export const TIER = { hp: [1, 2.5, 2.9, 3.4, 3.9], hpAfter: .5, dmg: .25, xp: 1, packSize: .2 };

// Pack templates: [type, count] pairs. Counts scale with tier.
export const PACKS = [
  [['zombie', 4]], [['runner', 5]], [['zombie', 3], ['archer', 1]], [['bloater', 2], ['zombie', 2]],
  [['runner', 3], ['archer', 1], ['bloater', 1]], [['archer', 2], ['zombie', 2]], [['zombie', 2], ['runner', 3]],
];
// count: packs per map = min(max, base + perTier × tier).
export const PACK = { count: [18, 2, 28], magicChance: .25, rareChance: .15, rareTypes: ['zombie', 'archer', 'bloater', 'zombie'], aggro: 9, aggroNear: 3.5, spawnRange: 27 };

export const RAREAFF = { hasted: 'Hasted', fortified: 'Fortified', burning: 'Burning', splitting: 'Splitting', volatile: 'Volatile', frenzied: 'Frenzied' };
export const RN1 = ['Gut', 'Rot', 'Grim', 'Bile', 'Ash', 'Hollow', 'Mire', 'Dread', 'Blight', 'Cinder', 'Gloom', 'Wretch'];
export const RN2 = ['maw', 'tooth', 'spine', 'gnaw', 'husk', 'grip', 'fang', 'skull', 'hide', 'bone'];

// Boss ability rotation and timings. vsMinion: damage multiplier on its swings and slams against minions (Raise Skeletons).
//   aggro: wake range. enrage: below this share of life it enters phase 2 (enrageSpd × speed, abilGap2 between abilities, double nova, summon2 runners).
//   slam (heavy): `slamDmg` × its damage in slamR around where you stood, telegraphed slamT (slamT2 in phase 2) seconds.
//   nova: after novaT s, a fan of novaBolts bolts `novaSpread` radians wide aimed at you, at novaSpeed, for novaDmg × its damage
//   each (blockable from the front; phase 2: a second fan novaGap s later). Phase 2 uses rotation2, which adds the charge
//   (unblockable): a `t` s purple wind-up, then it rushes `range` at `speed` through where you stood for `dmg` × its damage.
export const BOSS = { vsMinion: 1.4, aggro: 13, rotation: ['slam', 'nova', 'slam', 'summon'], rotation2: ['slam', 'charge', 'nova', 'slam', 'summon', 'charge'], abilGap: 3.8, abilGap2: 2.6, enrage: .5, enrageSpd: 1.3,
  slamR: 2.9, slamDmg: 4.5, slamT: 1.2, slamT2: .95, novaBolts: 7, novaSpread: .9, novaDmg: .8, novaSpeed: 7, novaGap: .45, novaT: .7, summon: 3, summon2: 5, summonType: 'runner',
  charge: { t: 1.1, dmg: 4.5, speed: 16, range: 9, hitR: .5 } };

// Stagger (design notes "Fight mechanics"): guardians and rares have a stagger bar (0..1). A parry adds `parry` (`parryRare` on a
// rare), a hit adds `dmg` × the share of max life it took, more while you surge (× 1 + `surge` × how hard). Full: stunned for
// `stunT` s, taking `taken` more damage, and the first hit you land on it is a finisher (Sekiro's deathblow) that deals `finisher` ×
// that. A hit it lands on you (not blocked or parried) knocks the bar back by `recover`: it steadies, so a broken guard
// is earned by timing, not by trading hits. The bar drains `drain` per second once `delay` s pass without adding to it.
// A parried normal monster is stunned for `minorStun` s.
export const STAGGER = { parry: .5, parryRare: .5, dmg: .5, surge: 1, stunT: 3, taken: .15, finisher: 3, recover: .6, drain: .06, delay: 2.5, minorStun: .9 };
// Status effects on monsters. chill: speed × chillSpd, attack and shot cooldowns × chillCd. Burns tick every burnTick s.
export const STATUS = { chillSpd: .5, chillCd: 1.6, burnTick: .5 };
// How monsters fight. windup: seconds from starting a swing to the hit (melee, boss, ranged). reach: extra hit range on top of
//   range + both radii when the swing lands. Archers: arrows at arrowSpeed (aim jitter ± arrowJitter), flee inside flee, close in beyond
//   chase or without sight, shot cooldown × shotJitter. Enemy projectiles live projLife s. Bloaters: start a `fuse` s fuse within `trigger`.
export const FIGHT = { windup: { melee: .42, boss: .7, ranged: .45 }, reach: .45, arrowSpeed: 11, arrowJitter: .05, flee: 4.5, chase: 9, shotJitter: [.85, 1.2], projLife: 3, bomb: { trigger: 1.9, fuse: .85 } };
// Death blasts. bloater: a bloater's own (radius r, `dmg` × its damage, after `delay` s), only when its fuse runs out (kill it first
// to defuse it); volatile: a rare's affix, on any death. `kind`: how you answer it (heavy: block or roll; unblockable: roll).
// Both also hurt nearby monsters for `vsMonsters` × the tier's life multiplier.
export const BLAST = { bloater: { r: 2.2, dmg: .7, delay: .15, kind: 'heavy' }, volatile: { r: 2.6, dmg: 1.2, delay: .9, kind: 'unblockable' }, vsMonsters: 20 };
// Rare monsters: size and radius multipliers, affixes rolled (more from tier `moreFrom`), and what each affix does.
//   fortified's life is in data/balance.js RARITY.rare. burning: a fire pulse (heavy) every `every` s within r for `dmg` (× the tier's damage growth), telegraphed `windup` s.
export const RARE = { size: 1.4, radius: 1.35, affixes: 2, moreFrom: 3, more: 3,
  hasted: { spd: 1.5, cd: .7 }, frenzied: { cd: .55, dmg: 1.1 }, fortified: { size: 1.12 }, burning: { r: 2.75, dmg: 16, every: 3.2, windup: .8 }, splitting: { n: 3, type: 'runner' } };

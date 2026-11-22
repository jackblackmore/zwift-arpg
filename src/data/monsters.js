// Monster types. look: which KayKit character and weapon to use (render/characters.js) and its clips; bloaters stay procedural.
//   walk/idle: looping clips; attacks: [clip, speed] picked at random per swing; rise: how it wakes (RISE below).
// Monster types. hp/dmg are depth-1 values; deeper levels scale them (TIER below, G.depth).
export const MT = {
  zombie: { hp: 16, dmg: 6, spd: 1.8, r: .38, cd: 1.4, range: .75, ai: 'melee', xp: 3, col: 0x5f6f4a, head: 0x8a9a6a, eye: 0xff3020, h: 1.8, look: { kind: 'warrior', weapon: 'blade', walk: 'Skeletons_Walking', idle: 'Skeletons_Idle', rise: 'floor', attacks: [['Melee_1H_Attack_Chop', 1.7], ['Melee_1H_Attack_Slice_Diagonal', 1.6], ['Melee_1H_Attack_Slice_Horizontal', 2.1]] } },
  runner: { hp: 8, dmg: 3, spd: 4.0, r: .3, cd: .8, range: .6, ai: 'melee', xp: 2, col: 0x7a2a24, head: 0x9a3a2a, eye: 0xffd000, h: 1.35, scale: .75, look: { kind: 'minion', walk: 'Running_A', idle: 'Skeletons_Idle', rise: 'standing', attacks: [['Melee_Unarmed_Attack_Punch_A', 2.2], ['Melee_Unarmed_Attack_Kick', 1.8]] } },
  archer: { hp: 12, dmg: 7, spd: 2.3, r: .34, cd: 2.2, range: 8, ai: 'ranged', xp: 3, col: 0xb8ae96, head: 0xe6dfcc, eye: 0xff3020, h: 1.8, bow: 1, look: { kind: 'rogue', weapon: 'crossbow', walk: 'Running_A', idle: 'Skeletons_Idle', rise: 'standing', attacks: [['Ranged_2H_Shoot', 1.3]] } },
  bloater: { hp: 28, dmg: 22, spd: 1.6, r: .6, cd: 0, ai: 'bomb', xp: 4, col: 0x6aa040, head: 0x9ad060, eye: 0xffff60, h: 1.6, blob: 1 },
  // Guardian (the level's mini-boss, game/level.js). Boss AI: `abil` overrides the BOSS rotation below.
  guardian: { hp: 400, dmg: 11, spd: 2.5, r: .85, cd: 1.7, range: 1.6, ai: 'boss', guardian: true, xp: 90, col: 0x3a4256, head: 0xcfd6e6, eye: 0xff2bd6, h: 3.9, scale: 1.8, name: 'Ossric, the Hollow Knight', sub: 'Dodge the slams · it calls skeletons',
    abil: { rotation: ['slam', 'summon', 'slam', 'nova'], abilGap: 4.4, abilGap2: 3.2, slamR: 2.3, novaBolts: 10, summon: 3, summon2: 5 },
    look: { kind: 'warrior', weapon: 'blade', offhand: 'shield', walk: 'Skeletons_Walking', idle: 'Skeletons_Idle', rise: 'taunt', tint: 0xb8c4e0, attacks: [['Melee_1H_Attack_Chop', 1.4], ['Melee_1H_Attack_Slice_Diagonal', 1.3]] } },
};

// Waking up. Until a pack is woken, its skeletons hold `pose`; on waking they play `clip` and can't act for its length.
export const RISE = {
  floor: { pose: 'Skeletons_Inactive_Floor_Pose', clip: 'Skeletons_Awaken_Floor', speed: 2 },
  standing: { pose: 'Skeletons_Inactive_Standing_Pose', clip: 'Skeletons_Awaken_Standing', speed: 1.5 },
  taunt: { clip: 'Skeletons_Taunt', speed: 1 },
};
// Other clips: deaths (picked at random), hit reactions (when a hit takes at least `minHit` of max life), boss casts.
export const ANIM = {
  deaths: ['Death_A', 'Death_B', 'Skeletons_Death'], hits: ['Hit_A', 'Hit_B'], hitSpeed: 1.6, minHit: .12,
  bossCast: { slam: ['Melee_2H_Attack_Spin', 1], nova: ['Ranged_Magic_Shoot', .8], summon: ['Ranged_Magic_Summon', 1.8] },
};

// Per-depth scaling: each level of depth adds this fraction on top of depth 1.
export const TIER = { hp: .45, dmg: .3, xp: .35, packSize: .08 };

// Pack templates: [type, count] pairs. Counts scale with depth.
export const PACKS = [
  [['zombie', 9]], [['runner', 12]], [['zombie', 6], ['archer', 3]], [['bloater', 3], ['zombie', 5]],
  [['runner', 7], ['archer', 2], ['bloater', 2]], [['archer', 5], ['zombie', 4]], [['zombie', 5], ['runner', 6]],
];
export const PACK = { magicChance: .3, rareChance: .4, rareTypes: ['zombie', 'archer', 'bloater', 'zombie'], aggro: 11.5, spawnRange: 27 };

export const RAREAFF = { hasted: 'Hasted', fortified: 'Fortified', burning: 'Burning', splitting: 'Splitting', volatile: 'Volatile', frenzied: 'Frenzied' };
export const RN1 = ['Gut', 'Rot', 'Grim', 'Bile', 'Ash', 'Hollow', 'Mire', 'Dread', 'Blight', 'Cinder', 'Gloom', 'Wretch'];
export const RN2 = ['maw', 'tooth', 'spine', 'gnaw', 'husk', 'grip', 'fang', 'skull', 'hide', 'bone'];

// Default boss ability rotation and timings (a monster's own `abil` overrides them).
export const BOSS = { rotation: ['slam', 'nova', 'slam', 'summon'], abilGap: 3.8, abilGap2: 2.6, slamR: 2.9, novaBolts: 14, summon: 5, summon2: 7 };

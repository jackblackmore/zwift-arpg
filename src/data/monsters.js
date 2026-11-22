// Monster types. look: which KayKit character and weapon to use (render/characters.js) and its clips; bloaters stay procedural.
//   walk/idle: looping clips; attacks: [clip, speed] picked at random per swing; rise: how it wakes (RISE below).
// hp/dmg here are Crypt 1 values; each Crypt multiplies them by its LEVELS[n].scale (data/levels.js, game/enemies.js spawnEnemy).
// BALANCE TARGET (Crypt 1): a level 1 Fireball gem hit is about 17 (gem base 10 + the starting staff's 5 flat spell, x1.12 fire), so
// a normal monster should take 2-3 hits: zombie 40 (~2.4 hits), runner 22 (~1.3, so 2 on a low roll), archer 32, bloater 55.
// Guardians: about 1000-1400 HP so a level 1-3 gem needs ~25-40 s at ~2.4 casts/s. Rares are x5 HP, magic x1.8 (enemies.js).
export const MT = {
  zombie: { hp: 40, dmg: 6, spd: 1.8, r: .38, cd: 1.4, range: .75, ai: 'melee', xp: 3, col: 0x5f6f4a, head: 0x8a9a6a, eye: 0xff3020, h: 1.8, look: { kind: 'warrior', weapon: 'blade', walk: 'Skeletons_Walking', idle: 'Skeletons_Idle', rise: 'floor', attacks: [['Melee_1H_Attack_Chop', 1.7], ['Melee_1H_Attack_Slice_Diagonal', 1.6], ['Melee_1H_Attack_Slice_Horizontal', 2.1]] } },
  runner: { hp: 22, dmg: 3, spd: 4.0, r: .3, cd: .8, range: .6, ai: 'melee', xp: 2, col: 0x7a2a24, head: 0x9a3a2a, eye: 0xffd000, h: 1.35, scale: .75, look: { kind: 'minion', walk: 'Running_A', idle: 'Skeletons_Idle', rise: 'standing', attacks: [['Melee_Unarmed_Attack_Punch_A', 2.2], ['Melee_Unarmed_Attack_Kick', 1.8]] } },
  archer: { hp: 32, dmg: 7, spd: 2.3, r: .34, cd: 2.2, range: 8, ai: 'ranged', xp: 3, col: 0xb8ae96, head: 0xe6dfcc, eye: 0xff3020, h: 1.8, bow: 1, look: { kind: 'rogue', weapon: 'crossbow', walk: 'Running_A', idle: 'Skeletons_Idle', rise: 'standing', attacks: [['Ranged_2H_Shoot', 1.3]] } },
  // blast: HP its burst takes off other monsters (x the Crypt's hp scale). noCorpse: leaves no corpse (it bursts).
  bloater: { hp: 55, dmg: 22, spd: 1.6, r: .6, cd: 0, ai: 'bomb', xp: 4, col: 0x6aa040, head: 0x9ad060, eye: 0xffff60, h: 1.6, blob: 1, noCorpse: true, blast: 18 },
  // Necromancer (Bone Gardens on): keeps its distance like an archer and, every few seconds, channels a revive on up to `n` corpses
  // within `range` of it (a ring on each corpse and a beam from the necromancer show it). Killing it mid-channel cancels the revive.
  // priority: Main's auto-target treats it like an elite. glow: a purple halo so it stands out in a crowd. Its bolt is weak.
  // rev: first = seconds before its first revive; cd = between revives; channel = how long the telegraphed channel lasts; rise = how long
  // the risen are helpless. Risen monsters give no xp and leave no corpse (no endless loops).
  necro: { hp: 44, dmg: 5, spd: 2.0, r: .34, cd: 2.6, range: 9, ai: 'necro', xp: 8, col: 0x5a3a7a, head: 0xd8c8ee, eye: 0xc060ff, h: 1.9, hood: 1, staffy: 1, priority: true, noCorpse: true, glow: 0xb060ff,
    rev: { first: 2.5, cd: 6.5, channel: 1.8, n: 3, range: 13, keepMin: 6.5, keepMax: 11, rise: .9 },
    look: { kind: 'mage', walk: 'Skeletons_Walking', idle: 'Skeletons_Idle', rise: 'standing', attacks: [['Ranged_Magic_Shoot', 1.3]] } },
  // Guardians (each level's mini-boss, game/level.js). Boss AI: `abil` overrides the BOSS rotation below. Always ai 'boss' and guardian: true
  // (only Ossric keeps the type key 'guardian'). hp is the Crypt 1 equivalent: the level scale multiplies it (Crypt 5 is about x3.3).
  // Abilities: slam (telegraphed circle), nova (ring of bolts), summon (adds of `summonType`), volley (arrow fan), raise (revive corpses
  // within `raiseRange`, topping up with `fill` adds), pools (poison pools around you). kite/hold: the boss backs off inside `kite` units
  // and stays put inside `hold` instead of walking up to melee.
  guardian: { hp: 1200, dmg: 11, spd: 2.5, r: .85, cd: 1.7, range: 1.6, ai: 'boss', guardian: true, xp: 90, col: 0x3a4256, head: 0xcfd6e6, eye: 0xff2bd6, h: 3.9, scale: 1.8, name: 'Ossric, the Hollow Knight', sub: 'Dodge the slams · it calls skeletons',
    abil: { rotation: ['slam', 'summon', 'slam', 'nova'], abilGap: 4.4, abilGap2: 3.2, slamR: 2.3, novaBolts: 10, summon: 3, summon2: 5 },
    look: { kind: 'warrior', weapon: 'blade', offhand: 'shield', walk: 'Skeletons_Walking', idle: 'Skeletons_Idle', rise: 'taunt', tint: 0xb8c4e0, attacks: [['Melee_1H_Attack_Chop', 1.4], ['Melee_1H_Attack_Slice_Diagonal', 1.3]] } },
  captain: { hp: 1000, dmg: 9, spd: 2.7, r: .8, cd: 1.6, range: 1.4, ai: 'boss', guardian: true, xp: 110, col: 0xb8ae96, head: 0xe6dfcc, eye: 0xff8a20, h: 3.6, scale: 1.7, name: 'Vael, the Bone Captain', sub: 'Dodge the volleys · it calls archers',
    abil: { rotation: ['volley', 'summon', 'volley', 'slam', 'nova'], abilGap: 3.8, abilGap2: 2.8, slamR: 2.2, novaBolts: 12, summon: 2, summon2: 4, summonType: 'archer', volleyN: 9, volleySpread: 1.1, volleySpeed: 9, kite: 5, hold: 9 },
    look: { kind: 'rogue', weapon: 'crossbow', walk: 'Running_A', idle: 'Skeletons_Idle', rise: 'taunt', tint: 0xe0d0b0, attacks: [['Ranged_2H_Shoot', 1.3]] } },
  warden: { hp: 1100, dmg: 11, spd: 2.4, r: .85, cd: 1.7, range: 1.6, ai: 'boss', guardian: true, xp: 130, col: 0x3a6a6a, head: 0xa8d8d0, eye: 0x60ffc0, h: 3.9, scale: 1.8, name: 'The Drowned Warden', sub: 'Stay out of the poison · bloaters rise',
    abil: { rotation: ['pools', 'slam', 'summon', 'pools', 'nova'], abilGap: 4.2, abilGap2: 3.0, slamR: 2.4, novaBolts: 10, summon: 2, summon2: 4, summonType: 'bloater', poolN: 4, poolN2: 6, poolSpread: 6 },
    look: { kind: 'warrior', weapon: 'axe', walk: 'Skeletons_Walking', idle: 'Skeletons_Idle', rise: 'taunt', tint: 0x80c8b8, attacks: [['Melee_1H_Attack_Chop', 1.4], ['Melee_1H_Attack_Slice_Diagonal', 1.3]] } },
  lord: { hp: 1000, dmg: 10, spd: 2.3, r: .8, cd: 1.8, range: 1.5, ai: 'boss', guardian: true, xp: 160, col: 0x5a3a7a, head: 0xd8c8ee, eye: 0xc060ff, h: 3.8, scale: 1.75, name: 'Maldrec, Lord of the Bone Gardens', sub: 'Kill what he raises · or he raises it again',
    abil: { rotation: ['raise', 'nova', 'slam', 'raise', 'summon'], abilGap: 4.0, abilGap2: 3.0, slamR: 2.3, novaBolts: 12, summon: 2, summon2: 4, summonType: 'zombie', raise: 4, raise2: 6, raiseRange: 18, fill: 'zombie', kite: 4.5, hold: 8 },
    look: { kind: 'mage', walk: 'Skeletons_Walking', idle: 'Skeletons_Idle', rise: 'taunt', tint: 0xc8a0ff, attacks: [['Ranged_Magic_Shoot', 1.2]] } },
  lieutenant: { hp: 1300, dmg: 13, spd: 2.5, r: .95, cd: 1.6, range: 1.8, ai: 'boss', guardian: true, xp: 200, col: 0x4a3a3a, head: 0xd8c0b0, eye: 0xff5020, h: 4.2, scale: 2.0, name: "Varrek, the Ashen King's Lieutenant", sub: 'The last guard before the throne',
    abil: { rotation: ['slam', 'volley', 'summon', 'raise', 'nova', 'slam', 'pools'], abilGap: 3.6, abilGap2: 2.6, slamR: 2.6, novaBolts: 14, summon: 3, summon2: 5, summonType: 'runner', volleyN: 7, volleySpread: .9, volleySpeed: 9.5, raise: 3, raise2: 5, raiseRange: 16, fill: 'zombie', poolN: 3, poolN2: 5, poolSpread: 5 },
    look: { kind: 'warrior', weapon: 'blade', offhand: 'shield', walk: 'Skeletons_Walking', idle: 'Skeletons_Idle', rise: 'taunt', tint: 0xd89070, attacks: [['Melee_1H_Attack_Chop', 1.3], ['Melee_1H_Attack_Slice_Diagonal', 1.2]] } },
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
  bossCast: { slam: ['Melee_2H_Attack_Spin', 1], nova: ['Ranged_Magic_Shoot', .8], summon: ['Ranged_Magic_Summon', 1.8], volley: ['Ranged_2H_Shoot', 1], raise: ['Ranged_Magic_Summon', 1.5], pools: ['Ranged_Magic_Summon', 1.8] },
};

// Pack templates, rare types and the scaling per Crypt live in data/levels.js (LEVELS). Shared pack behaviour:
export const PACK = { aggro: 11.5, spawnRange: 27 };
// Corpses (game/corpses.js): a real kill of a non-boss monster leaves one for `life` seconds (at most `max` at once; the oldest goes first).
// The necromancer and Maldrec revive them; Corpse Explosion and Raise Skeletons (later) use them.
export const CORPSE = { life: 10, max: 24 };

export const RAREAFF = { hasted: 'Hasted', fortified: 'Fortified', burning: 'Burning', splitting: 'Splitting', volatile: 'Volatile', frenzied: 'Frenzied' };
export const RN1 = ['Gut', 'Rot', 'Grim', 'Bile', 'Ash', 'Hollow', 'Mire', 'Dread', 'Blight', 'Cinder', 'Gloom', 'Wretch'];
export const RN2 = ['maw', 'tooth', 'spine', 'gnaw', 'husk', 'grip', 'fang', 'skull', 'hide', 'bone'];

// Default boss ability rotation and timings (a monster's own `abil` overrides them).
export const BOSS = { rotation: ['slam', 'nova', 'slam', 'summon'], abilGap: 3.8, abilGap2: 2.6, slamR: 2.9, novaBolts: 14, summon: 5, summon2: 7 };

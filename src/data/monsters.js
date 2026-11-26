// Monster types. look: which KayKit character and weapon to use (render/characters.js) and its clips; bloaters stay procedural.
//   walk/idle: looping clips; attacks: [clip, speed] picked at random per swing; rise: how it wakes (RISE below).
// Monster types. hp/dmg are tier-1 values; maps scale them per tier (TIER below). dt: the damage type of its attacks (DMG_TYPES;
//   default phys); attacks with their own type are in GUARDIANS (each ability's dt), BLAST and RARE.burning.
export const MT = {
  zombie: { hp: 48, dmg: 8, spd: 2.5, r: .38, cd: 1.4, range: .75, ai: 'melee', xp: 4, col: 0x5f6f4a, head: 0x8a9a6a, eye: 0xff3020, h: 1.8, look: { kind: 'warrior', weapon: 'blade', walk: 'Skeletons_Walking', idle: 'Skeletons_Idle', rise: 'floor', attacks: [['Melee_1H_Attack_Chop', 1.7], ['Melee_1H_Attack_Slice_Diagonal', 1.6], ['Melee_1H_Attack_Slice_Horizontal', 2.1]] } },
  runner: { hp: 24, dmg: 5.5, spd: 4.0, r: .3, cd: .8, range: .6, ai: 'melee', xp: 3, col: 0x7a2a24, head: 0x9a3a2a, eye: 0xffd000, h: 1.35, scale: .75, look: { kind: 'minion', walk: 'Running_A', idle: 'Skeletons_Idle', rise: 'standing', attacks: [['Melee_Unarmed_Attack_Punch_A', 2.2], ['Melee_Unarmed_Attack_Kick', 1.8]] } },
  archer: { hp: 32, dmg: 8.5, spd: 2.3, r: .34, cd: 1.8, range: 8, ai: 'ranged', xp: 4, col: 0xb8ae96, head: 0xe6dfcc, eye: 0xff3020, h: 1.8, bow: 1, look: { kind: 'rogue', weapon: 'crossbow', walk: 'Running_A', idle: 'Skeletons_Idle', rise: 'standing', attacks: [['Ranged_2H_Shoot', 1.3]] } },
  bloater: { hp: 55, dmg: 22, spd: 1.6, r: .6, cd: 0, ai: 'bomb', dt: 'poison', xp: 5, col: 0x6aa040, head: 0x9ad060, eye: 0xffff60, h: 1.6, blob: 1 },
  // Bone Gardens: the necromancer (the mage skeleton with a staff) keeps its distance, spits slow poison bolts you block, and
  // raises the fallen (RAISE below): kill it first. Throne Approach: the bone knight (sword and the large shield) blocks what you
  // hit it with from the front until a parry, a heavy hit or enough blows open its guard (BKNIGHT below). prim: the primitive
  // model's extras (render/models.js) when the KayKit models aren't loaded. flee: it backs off inside this (else FIGHT.flee).
  necro: { hp: 40, dmg: 6, spd: 2.3, r: .36, cd: 3, range: 8, ai: 'necro', dt: 'poison', xp: 7, col: 0x3a4a3a, head: 0xc8d8b8, eye: 0x60ff90, h: 1.85, flee: 3.5, bolt: { speed: 7, col: 0x60ff90 }, prim: { staff: 1, hood: 1 },
    look: { kind: 'mage', weapon: 'staff', walk: 'Walking_A', idle: 'Skeletons_Idle', rise: 'standing', tint: 0xa8d0a8, attacks: [['Ranged_Magic_Shoot', 1.3]] } },
  bknight: { hp: 62, dmg: 8.5, spd: 2.1, r: .42, cd: 1.7, range: .8, ai: 'melee', xp: 7, col: 0x4a5260, head: 0xb8c4d0, eye: 0x60c0ff, h: 1.95, shield: true, prim: { sword: 1, shield: 1 },
    look: { kind: 'warrior', weapon: 'blade', offhand: 'shield', walk: 'Skeletons_Walking', idle: 'Skeletons_Idle', guard: 'Melee_Blocking', rise: 'floor', tint: 0xa8b8d0, attacks: [['Melee_1H_Attack_Chop', 1.5], ['Melee_1H_Attack_Slice_Diagonal', 1.4], ['Melee_Block_Attack', 1.3]] } },
  boss: { hp: 1100, dmg: 10.5, spd: 2.4, r: 1.1, cd: 1.7, range: 1.8, ai: 'boss', xp: 160, col: 0x2a2236, head: 0x5a4a70, eye: 0xff2bd6, h: 5.6, scale: 2.6, horns: 1, look: { kind: 'warrior', weapon: 'axe', offhand: 'shield', walk: 'Walking_A', idle: 'Melee_2H_Idle', rise: 'taunt', tint: 0xb090d0, attacks: [['Melee_2H_Attack_Chop', 1.6], ['Melee_2H_Attack_Slice', 1.1]] } },
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
  bossCast: { area: ['Melee_2H_Attack_Spin', 1], volley: ['Ranged_Magic_Shoot', .8], shot: ['Ranged_2H_Shoot', .6], summon: ['Ranged_Magic_Summon', 1.8], charge: ['Skeletons_Taunt', 1.2], burst: ['Ranged_Magic_Raise', 1.4] }, // guardian casts by kind (GUARDIANS[..].anim overrides by ability),
  stun: ['Hit_B', .5], // staggered (STAGGER)
  channel: 'Ranged_Magic_Spellcasting', // the guardian's stance while it channels (GUARDIANS[..].channel), between swings
};

// Per-tier scaling. hp: monster life multiplier per map tier (index 0 = tier 1), then +hpAfter per tier.
// Tier 2 jumps because by then you've swapped the starter sword for magic gear (see `npm run balance`).
// dmg: monster damage multiplier per tier (the same way), then +dmgAfter per tier. It steps up at tier 2 for the same reason:
//   by then your gear has armour and some resistance (step 5, design notes "Defence"), so what reaches your life stays where it was.
// xp, packSize: fraction added per tier on top of tier 1.
export const TIER = { hp: [1, 2.79, 3.54, 4.59, 6.02], hpAfter: .6, dmg: [1, 1.54, 1.87, 2.21, 2.54], dmgAfter: .34, xp: 1, packSize: .2 };

// Damage types (design notes "Defence"). Physical is cut by armour, the others by the matching resistance (data/balance.js DEFENCE).
// Fire, cold and lightning are elemental (a block takes off SK.block.elem of them); poison isn't.
export const DMG_TYPES = { phys: 'physical', fire: 'fire', cold: 'cold', light: 'lightning', poison: 'poison' };
// Region leans (design notes "Game outline"): on map tiers `tiers` [first, last], `mix` of every physical attack becomes that type
// (a hit that's 30% poison is cut 70% by armour and 30% by poison resistance). Attacks with their own type keep it. The Crypt has
// no lean: its monsters are physical, with poison bloaters, the guardian's poison bolts, fire from burning and volatile rares
// and the guardian's cold burst. Later regions are first guesses until they're built.
export const LEAN = [
  { region: 'Crypt', tiers: [1, 5], mix: {} },
  { region: 'Forest', tiers: [6, 10], mix: { poison: .3 } },
  { region: 'Mines', tiers: [11, 15], mix: { fire: .3 } },
  { region: 'Frozen Keep', tiers: [16, 20], mix: { cold: .3 } },
  { region: 'Storm Spire', tiers: [21, 25], mix: { light: .3 } },
  { region: 'Abyss', tiers: [26, 1e9], mix: { fire: .1, cold: .1, light: .1, poison: .1 } },
];

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

// Guardians (design notes "Fight mechanics" and "The Crypt in detail"): one per level (data/dungeon.js LEVELS names which). BOSS is
// what they share; GUARDIANS holds each one. Every guardian has a stagger bar, parryable swings (🟡), a phase 2 below `enrage` of its
// life and a channel (🔵) in phase 2; its abilities are data (`abil`), each answered by a button:
//   vsMinion: damage multiplier on its swings and area hits against minions (Raise Skeletons). aggro: wake range. enrage: phase 2
//   below this share of life (then × enrageSpd speed, abilGap2 between abilities, rotation2 from its top: the first is a channel).
// A guardian: name, short (its banners), col (its colour: banners, minimap, cast flashes), hint/hint2 (banner lines on waking and in
//   phase 2), mt (its MT entry on top of MT.boss: life, damage, size, look), rotation/rotation2 (ability keys in turn), abilGap/abilGap2
//   (seconds between abilities), enrageSpd, phase2 (on entering phase 2: `summon` [type, n] at once), abil, channel, anim (cast clips
//   by ability key, else ANIM.bossCast by kind), summonCap (at most this many of its summons alive at once; none: no cap).
// Ability kinds (abil[key].kind), each with its telegraph (data/graphics.js TELL) and its answer:
//   area: after `t` s (t2 in phase 2) a hit within `r` for `dmg` × its damage. at: 'you' (where you stood when it began), 'front'
//     (in front of it, toward you) or 'self' (round it). tell: 'heavy' (🔴 red ground: block for less, or roll) or 'unblockable'
//     (🟣 purple: roll). jump: it lands there (a leap).
//   volley: after `t` s a fan of `n` shots `spread` radians wide aimed at you at `speed`, `dmg` × its damage each, `waves2` fans in
//     phase 2 (`gap` s apart); look: 'arrow' or a glow of `col`. Blockable from the front (🟡 cue, like the parry: raise the shield).
//   shot: an aimed shot (🟣 unblockable): a purple line tracks you for `t` s, locks `lock` s before it fires, then hits anything
//     within `w` of the line (to `range`) for `dmg` × its damage. Roll it.
//   charge: a `t` s purple wind-up (🟣), then a rush `range` at `speed` through where you stood, `dmg` × its damage within hitR.
//   combo: its next `n` swings come `gap` s apart with a `windup` s wind-up, `dmg` × its damage each, every one parryable (🟡).
//   summon: `n` (n2 in phase 2) of `type`, awake, round it.
// dt: each ability's damage type (its swings are mt.dt, physical by default).
// channel (🔵, phase 2): it stands still and a blue bar fills over `t` s. It keeps swinging while it channels (`swingCd` s between
//   swings instead of its cooldown, the first `firstSwing` s in), so there are parries to make. Breaking its stagger bar before the
//   bar fills cancels the channel and staggers it (so the finisher applies). While it channels, parries fill × `parry` and hits
//   × `hits` the usual stagger, and Surge adds × (1 + `surge` × how hard) on hits (instead of STAGGER.surge); in RIDE mode a short
//   effort spike fills it too (data/ride.js RIDE.spike). A channel that completes does the next of `effects` in turn: an ability
//   spec in the channel (burst, rain: an `area`), or mend: it heals `heal` of its max life and summons `summon` of `type`.
//   revive (the high necromancer): `n` of the corpses within `r` of it rise again (RAISE), and if fewer than `min` lie there it
//     raises fresh `type` from the ground to make up `min`. A channel effect; its corpses glow green while it channels.
//   combo `seq` (`seq2` in phase 2): the kind of each swing in turn: 'hit' (🟡 parry), 'heavy' (🔴 block for less or roll; its
//     `heavy` { windup, dmg }) or 'unblockable' (🟣 roll; `unblockable` { windup, dmg }). A mixed combo (the lieutenant).
export const BOSS = { vsMinion: 1.4, aggro: 13, enrage: .5 };
const CH = { t: 3, swingCd: .8, firstSwing: .2, parry: 1.25, hits: 3, surge: 6 }; // every guardian's channel timing and how it breaks
export const GUARDIANS = {
  // The Pale Warden: the first guardian built. Tiers 4–5 until Bone Gardens' high necromancer and the lieutenant (step 9 part B).
  warden: { name: 'The Pale Warden', short: 'THE WARDEN', col: 0xff4fd8, hint: 'Parry its swings · block or roll the slams', hint2: 'Purple: roll · blue: break it before the bar fills',
    mt: {}, rotation: ['slam', 'nova', 'slam', 'summon'], rotation2: ['channel', 'slam', 'charge', 'nova', 'slam', 'channel', 'summon', 'charge'], abilGap: 3.8, abilGap2: 2.2, enrageSpd: 1.3,
    abil: {
      slam: { kind: 'area', at: 'you', tell: 'heavy', r: 2.9, dmg: 4.5, t: 1.2, t2: .95, dt: 'phys' },
      nova: { kind: 'volley', n: 7, spread: .9, dmg: .8, speed: 7, gap: .45, t: .7, waves2: 2, col: 0xff2bd6, dt: 'poison' },
      summon: { kind: 'summon', type: 'runner', n: 3, n2: 5 },
      charge: { kind: 'charge', t: 1.1, dmg: 4.5, speed: 16, range: 9, hitR: .5, dt: 'phys' },
    },
    channel: { ...CH, effects: ['burst', 'mend'], burst: { kind: 'area', at: 'self', tell: 'unblockable', t: .7, dmg: 5, r: 8, dt: 'cold' }, mend: { heal: .15, summon: 4, type: 'runner' } } },
  // Crypt Halls: the skeleton knight. Sword and shield: a three-swing combo you parry, a shield bash (heavy), a lunge (phase 2,
  // unblockable), and it calls skeleton warriors. Its channel rallies: a shockwave (roll) or a mend that calls more.
  knight: { name: 'The Skeleton Knight', short: 'THE KNIGHT', col: 0x7ab8ff, hint: 'Parry the sword combo · block or roll the shield bash', hint2: 'It lunges (purple: roll) · blue: break its rally',
    mt: { hp: 1100, dmg: 10.5, spd: 2.6, r: 1, cd: 1.6, range: 1.7, h: 4.9, scale: 2.3, horns: 0, col: 0x3a4250, head: 0xb8c4d0, eye: 0x60c0ff,
      look: { kind: 'warrior', weapon: 'blade', offhand: 'shield', walk: 'Walking_A', idle: 'Melee_2H_Idle', rise: 'taunt', tint: 0xb8c8e0, attacks: [['Melee_1H_Attack_Chop', 1.4], ['Melee_1H_Attack_Slice_Diagonal', 1.3], ['Melee_1H_Attack_Slice_Horizontal', 1.6]] } },
    rotation: ['combo', 'bash', 'combo', 'summon'], rotation2: ['channel', 'bash', 'lunge', 'combo', 'bash', 'channel', 'summon', 'lunge'], abilGap: 3.3, abilGap2: 2.2, enrageSpd: 1.25,
    abil: {
      combo: { kind: 'combo', n: 3, gap: .3, windup: .55, dmg: 1 },
      bash: { kind: 'area', at: 'front', tell: 'heavy', r: 2.4, dmg: 4.5, t: 1.05, t2: .85, dt: 'phys' },
      lunge: { kind: 'charge', t: 1, dmg: 4.5, speed: 15, range: 8, hitR: .5, dt: 'phys' },
      summon: { kind: 'summon', type: 'zombie', n: 3, n2: 4 },
    },
    anim: { bash: ['Melee_Block_Attack', 1], lunge: ['Melee_1H_Attack_Stab', .8], summon: ['Skeletons_Taunt', 1.4] },
    channel: { ...CH, effects: ['burst', 'mend'], burst: { kind: 'area', at: 'self', tell: 'unblockable', t: .7, dmg: 5, r: 7.5, dt: 'phys' }, mend: { heal: .15, summon: 3, type: 'zombie' } } },
  // Ossuary: the bone archer captain. Volleys of arrows you block from the front, an aimed shot you roll (unblockable), a kick you
  // parry when you're close, and it calls archers. Its channel is a rain of arrows (heavy, on you) or a mend that calls more.
  captain: { name: 'The Bone Archer Captain', short: 'THE CAPTAIN', col: 0xffc860, hint: 'Block the volleys · roll the aimed shot · parry its kicks', hint2: 'Blue: break the arrow rain before the bar fills',
    mt: { hp: 1100, dmg: 10.5, spd: 2.5, r: 1, cd: 1.7, range: 1.6, h: 4.7, scale: 2.2, horns: 0, col: 0x5a4a32, head: 0xe6dcc0, eye: 0xffc040, bow: 1,
      look: { kind: 'rogue', weapon: 'crossbow', walk: 'Walking_A', idle: 'Skeletons_Idle', rise: 'taunt', tint: 0xe8d8b0, attacks: [['Melee_Unarmed_Attack_Kick', 1.3], ['Melee_Unarmed_Attack_Punch_A', 1.5]] } },
    rotation: ['volley', 'shot', 'volley', 'summon'], rotation2: ['channel', 'shot', 'volley', 'shot', 'channel', 'summon', 'volley'], abilGap: 3.6, abilGap2: 2.3, enrageSpd: 1.2, summonCap: 2,
    abil: {
      volley: { kind: 'volley', n: 5, spread: .7, dmg: .7, speed: 13, gap: .5, t: .8, waves2: 2, look: 'arrow', dt: 'phys' },
      shot: { kind: 'shot', t: 1.1, lock: .25, dmg: 4.2, w: .8, range: 30, dt: 'phys' },
      summon: { kind: 'summon', type: 'archer', n: 1, n2: 2 },
    },
    anim: { volley: ['Ranged_2H_Shoot', .9], shot: ['Ranged_2H_Shoot', .55], summon: ['Skeletons_Taunt', 1.4] },
    channel: { ...CH, effects: ['rain', 'mend'], rain: { kind: 'area', at: 'you', tell: 'heavy', t: .8, dmg: 5, r: 3.4, dt: 'phys' }, mend: { heal: .15, summon: 2, type: 'archer' } } },
  // Flooded Tombs: the plague bloat (procedural, like the bloaters). A heavy belly slam, poison spew you block, pustules that burst
  // into bloaters; in phase 2 it bursts (bloaters at once) and leaps on you (unblockable). Its channel gorges: a poison burst (roll)
  // or a mend that spawns bloaters.
  plague: { name: 'The Plague Bloat', short: 'THE PLAGUE BLOAT', col: 0x8ee04a, hint: 'Block or roll the belly slam · block the spew · kill the bloaters', hint2: 'It bursts! Purple leap: roll · blue: break its gorging',
    mt: { hp: 1100, dmg: 10.5, spd: 1.9, r: 1.4, cd: 1.8, range: 1.5, h: 3.8, scale: 3.4, horns: 0, blob: 1, col: 0x5a8a30, head: 0xa8d860, eye: 0xffff60, look: null },
    rotation: ['slam', 'spew', 'slam', 'summon'], rotation2: ['channel', 'slam', 'leap', 'spew', 'slam', 'channel', 'summon', 'leap'], abilGap: 3.8, abilGap2: 2.3, enrageSpd: 1.25,
    phase2: { summon: ['bloater', 2] },
    abil: {
      slam: { kind: 'area', at: 'you', tell: 'heavy', r: 3.1, dmg: 4.5, t: 1.25, t2: 1, dt: 'phys' },
      spew: { kind: 'volley', n: 6, spread: .85, dmg: .8, speed: 7, gap: .5, t: .8, waves2: 2, col: 0x8ee04a, dt: 'poison' },
      leap: { kind: 'area', at: 'you', tell: 'unblockable', jump: true, r: 2.6, dmg: 4.5, t: 1.15, dt: 'phys' },
      summon: { kind: 'summon', type: 'bloater', n: 1, n2: 2 },
    },
    channel: { ...CH, effects: ['burst', 'mend'], burst: { kind: 'area', at: 'self', tell: 'unblockable', t: .7, dmg: 5, r: 7.5, dt: 'poison' }, mend: { heal: .15, summon: 2, type: 'bloater' } } },
  // Bone Gardens: the high necromancer (the mage skeleton with a staff, grown and robed). A staff strike you parry, bone hands
  // from the floor under you (heavy), a curse it aims at you (unblockable: roll), poison skulls you block; it raises skeleton
  // warriors in waves, and its channel raises every corpse round it at once (break it!) or ends in a soul burst (roll).
  lich: { name: 'The High Necromancer', short: 'THE HIGH NECROMANCER', col: 0x60ff90, hint: 'Parry the staff · block or roll the bone hands · roll the curse', hint2: 'Blue: break it before the dead rise · purple: roll',
    mt: { hp: 1250, dmg: 13, spd: 2.3, r: 1, cd: 1.8, range: 1.7, h: 4.9, scale: 2.4, horns: 0, col: 0x2a3a2a, head: 0xd0e0c0, eye: 0x60ff90, prim: { staff: 1, hood: 1 },
      look: { kind: 'mage', weapon: 'staff', walk: 'Walking_A', idle: 'Skeletons_Idle', rise: 'taunt', tint: 0x9ac8a0, attacks: [['Melee_2H_Attack_Chop', 1.4], ['Melee_1H_Attack_Chop', 1.3], ['Melee_2H_Attack_Slice', 1.2]] } },
    rotation: ['skulls', 'grasp', 'raise', 'curse'], rotation2: ['channel', 'grasp', 'curse', 'skulls', 'grasp', 'channel', 'raise', 'curse'], abilGap: 3.6, abilGap2: 2.3, enrageSpd: 1.2, summonCap: 5,
    phase2: { summon: ['zombie', 2] },
    abil: {
      grasp: { kind: 'area', at: 'you', tell: 'heavy', r: 2.6, dmg: 4.5, t: 1.15, t2: .95, dt: 'phys' },
      curse: { kind: 'shot', t: 1.1, lock: .25, dmg: 4.2, w: .8, range: 30, dt: 'poison' },
      skulls: { kind: 'volley', n: 5, spread: .8, dmg: .75, speed: 7.5, gap: .5, t: .75, waves2: 2, col: 0x60ff90, dt: 'poison' },
      raise: { kind: 'summon', type: 'zombie', n: 1, n2: 2 },
    },
    anim: { grasp: ['Ranged_Magic_Raise', 1.2], curse: ['Ranged_Magic_Shoot', .7], skulls: ['Ranged_Magic_Shoot', .9], raise: ['Ranged_Magic_Summon', 1.6] },
    channel: { ...CH, effects: ['revive', 'burst'], revive: { kind: 'revive', n: 8, r: 14, min: 3, type: 'zombie' }, burst: { kind: 'area', at: 'self', tell: 'unblockable', t: .7, dmg: 5, r: 7.5, dt: 'poison' } } },
  // Throne Approach: the King's lieutenant, the Ashen King's sword arm (step 11). Sword and shield, the toughest guardian: a four-swing
  // combo that mixes parries with a heavy (phase 2 also an unblockable), a cleaving heavy in front of it, an ashen brand under you
  // (unblockable: roll) and a lunge in phase 2; it calls bone knights. Its channel ends in an ash nova (roll) or a mend that calls more.
  lieutenant: { name: "The King's Lieutenant", short: 'THE LIEUTENANT', col: 0xffa040, hint: 'Parry the yellow swings · block or roll the red · roll the purple', hint2: 'The combo turns deadly · blue: break it before the bar fills',
    mt: { hp: 1500, dmg: 13, spd: 2.6, r: 1.05, cd: 1.6, range: 1.8, h: 5.2, scale: 2.5, horns: 1, col: 0x3a2a22, head: 0xc8b090, eye: 0xffa040,
      look: { kind: 'warrior', weapon: 'axe', offhand: 'shield', walk: 'Walking_A', idle: 'Melee_2H_Idle', rise: 'taunt', tint: 0xd8b890, attacks: [['Melee_1H_Attack_Chop', 1.4], ['Melee_1H_Attack_Slice_Diagonal', 1.3], ['Melee_1H_Attack_Slice_Horizontal', 1.6]] } },
    rotation: ['combo', 'cleave', 'brand', 'combo', 'summon'], rotation2: ['channel', 'combo', 'lunge', 'brand', 'cleave', 'channel', 'combo', 'summon', 'lunge'], abilGap: 3, abilGap2: 2, enrageSpd: 1.25, summonCap: 2,
    phase2: { summon: ['bknight', 1] },
    abil: {
      combo: { kind: 'combo', n: 4, gap: .3, windup: .45, dmg: 1, seq: ['hit', 'hit', 'heavy', 'hit'], seq2: ['hit', 'heavy', 'hit', 'unblockable'], heavy: { windup: .95, dmg: 3 }, unblockable: { windup: .9, dmg: 3.2 } },
      cleave: { kind: 'area', at: 'front', tell: 'heavy', r: 2.8, dmg: 4.5, t: 1, t2: .85, dt: 'phys' },
      brand: { kind: 'area', at: 'you', tell: 'unblockable', r: 2.2, dmg: 4.2, t: 1.15, t2: 1, dt: 'fire' },
      lunge: { kind: 'charge', t: 1, dmg: 4.5, speed: 16, range: 9, hitR: .5, dt: 'phys' },
      summon: { kind: 'summon', type: 'bknight', n: 1, n2: 1 },
    },
    anim: { cleave: ['Melee_2H_Attack_Spin', 1.1], brand: ['Ranged_Magic_Raise', 1.2], lunge: ['Melee_1H_Attack_Stab', .8], summon: ['Skeletons_Taunt', 1.4] },
    channel: { ...CH, effects: ['burst', 'mend'], burst: { kind: 'area', at: 'self', tell: 'unblockable', t: .7, dmg: 5, r: 8, dt: 'fire' }, mend: { heal: .15, summon: 2, type: 'bknight' } } },
};

// Raising the dead (the necromancer, MT.necro; the high necromancer's revive). Normal monsters of `types` leave a corpse where they
// fall (a dark mark on the floor) for `keep` s; a raised monster leaves none and gives no XP or loot. A necromancer within `r` of
// corpses starts raising after `every` [min, max] s (`first` s after it wakes): it stands still and channels for `t` s, a green
// ring under it and on each corpse it reaches (data/graphics.js TELL.raise, its own cue sound), then up to `n` of them rise with
// `hp` of their life, getting up for `rise` s. Any hit you land on it interrupts the raise; killing it ends them. On a rare
// necromancer the raise reaches twice as many corpses.
export const RAISE = { types: ['zombie', 'runner', 'archer', 'bknight'], keep: 40, r: 10, every: [3.5, 5], first: 1.5, t: 2, n: 3, hp: .5, rise: .9 };
// The bone knight's shield (MT.bknight). While its guard is up (not swinging, stunned or frozen) it blocks hits from in front of it
// (within `arc` degrees: it always turns to face you, so in practice every hit): it takes `taken` of the damage and a hit fills
// a third of a normal hit's knockback; a steel-blue flash and "BLOCKED" with a clang (data/graphics.js TELL.guard). Its guard opens
// for `open` s (a yellow "GUARD OPEN", shield lowered) when you parry its swing, land a heavy hit on it (the Sword's heavy cut, a
// riposte, a finisher), or for `hitOpen` s after `hits` blocked hits; while open it takes full damage. Burns and other damage over
// time go round the shield. Its swings flash yellow like a rare's: parry them.
export const BKNIGHT = { arc: 140, taken: .15, open: 2.6, hits: 5, hitOpen: 1.6 };

// Each level's pack mix (data/dungeon.js LEVELS: `mix` names one): pack templates ([type, count] pairs, counts grown per tier) and
// the types a pack's rare can be. Levels without one use PACKS and PACK.rareTypes.
export const MIX = {
  // Crypt Halls: skeleton warriors and runners only, in packs of 3–5.
  halls: { packs: [[['zombie', 4]], [['zombie', 3], ['runner', 2]], [['runner', 5]], [['zombie', 2], ['runner', 3]], [['zombie', 5]]], rareTypes: ['zombie'] },
  // Ossuary: archers arrive (4–5 a pack); most packs have one, fewer than at first: with up to three archers to a pack the Ossuary
  // cost about twice the life of the levels either side of it.
  ossuary: { packs: [[['zombie', 3], ['archer', 1]], [['archer', 1], ['zombie', 4]], [['zombie', 4], ['archer', 1]], [['runner', 3], ['archer', 1]], [['zombie', 4]], [['zombie', 2], ['runner', 3]]], rareTypes: ['zombie', 'archer', 'zombie'] },
  // Flooded Tombs: bloaters (5–7 a pack with growth); everything so far.
  tombs: { packs: [[['bloater', 2], ['zombie', 3]], [['runner', 3], ['archer', 1], ['bloater', 1]], [['zombie', 3], ['bloater', 1], ['archer', 1]], [['bloater', 2], ['runner', 3]], [['zombie', 4], ['archer', 1]], [['zombie', 2], ['runner', 3]]], rareTypes: ['zombie', 'bloater', 'archer', 'zombie'] },
  // Bone Gardens: a necromancer in most packs, behind skeleton warriors (5–8 a pack with growth): kill it first or the pack gets up again.
  gardens: { packs: [[['zombie', 3], ['necro', 1]], [['runner', 2], ['zombie', 2], ['necro', 1]], [['zombie', 2], ['necro', 1]], [['zombie', 3], ['archer', 1]], [['bloater', 1], ['zombie', 2], ['necro', 1]], [['zombie', 2], ['runner', 2]]], rareTypes: ['zombie', 'necro', 'zombie'] },
  // Throne Approach: bone knights in every pack but one, with everything else the Crypt has (6–8 a pack), and more rares and elites:
  // rareChance and magicChance replace PACK's; eliteTypes replaces ELITE.types.
  throne: { packs: [[['bknight', 1], ['zombie', 2]], [['bknight', 1], ['archer', 1], ['zombie', 2]], [['bknight', 2], ['runner', 2]], [['necro', 1], ['zombie', 2], ['bknight', 1]], [['runner', 2], ['bknight', 1]], [['bloater', 1], ['bknight', 1], ['zombie', 2]], [['zombie', 3]]],
    rareTypes: ['bknight', 'zombie', 'bknight', 'zombie'], rareChance: .22, magicChance: .3, eliteTypes: ['bknight', 'zombie', 'zombie', 'archer'] },
};

// Stagger (design notes "Fight mechanics"): guardians and rares have a stagger bar (0..1). A parry adds `parry` (`parryRare` on a
// rare), a hit adds `dmg` × the share of max life it took, more while you surge (× 1 + `surge` × how hard). Full: stunned for
// `stunT` s, taking `taken` more damage, and the first hit you land on it is a finisher (Sekiro's deathblow) that deals `finisher` ×
// that. A hit it lands on you (not blocked or parried) knocks the bar back by `recover`: it steadies, so a broken guard
// is earned by timing, not by trading hits. The bar drains `drain` per second once `delay` s pass without adding to it.
// A parried normal monster is stunned for `minorStun` s.
export const STAGGER = { parry: .5, parryRare: .5, dmg: .5, surge: 1, stunT: 3, taken: .15, finisher: 4.2, recover: .85, drain: .06, delay: 2.5, minorStun: .9 };
// Status effects on monsters. chill: speed × chillSpd, attack and shot cooldowns × chillCd. Burns tick every burnTick s.
export const STATUS = { chillSpd: .5, chillCd: 1.6, burnTick: .5 };
// How monsters fight. windup: seconds from starting a swing to the hit (melee, boss, ranged). reach: extra hit range on top of
//   range + both radii when the swing lands. Archers: arrows at arrowSpeed (aim jitter ± arrowJitter), flee inside flee, close in beyond
//   chase or without sight, shot cooldown × shotJitter. Enemy projectiles live projLife s. Bloaters: start a `fuse` s fuse within `trigger`.
export const FIGHT = { windup: { melee: .42, boss: .7, ranged: .45 }, reach: .45, arrowSpeed: 11, arrowJitter: .05, flee: 4.5, chase: 9, shotJitter: [.85, 1.2], projLife: 3, bomb: { trigger: 1.9, fuse: .85 } };
// Death blasts. bloater: a bloater's own (radius r, `dmg` × its damage, after `delay` s), only when its fuse runs out (kill it first
// to defuse it); volatile: a rare's affix, on any death. `kind`: how you answer it (heavy: block or roll; unblockable: roll). dt: its damage type.
// Both also hurt nearby monsters for `vsMonsters` × the tier's life multiplier.
export const BLAST = { bloater: { r: 2.2, dmg: .7, delay: .15, kind: 'heavy', dt: 'poison' }, volatile: { r: 2.6, dmg: 1.2, delay: .9, kind: 'unblockable', dt: 'fire' }, vsMonsters: 20 };
// Rare monsters: size and radius multipliers, affixes rolled (more from tier `moreFrom`), and what each affix does.
//   fortified's life is in data/balance.js RARITY.rare. burning: a pulse (heavy, damage type dt) every `every` s within r for `dmg` (× the tier's damage growth), telegraphed `windup` s.
//   heavy (🔴, melee rares): after `every` [min, max] of its parryable swings, the next is a heavy swing: a `windup` s red wind-up
//   (FIGHT.windup.melee for the others), then `dmg` × its damage. It can't be parried (a parry press blocks it, like the guardian's
//   slam): block it for less (SK.block.heavy) or roll it. Staggering the rare during the wind-up cancels it.
export const RARE = { size: 1.4, radius: 1.35, affixes: 2, moreFrom: 3, more: 3, heavy: { every: [2, 3], windup: 1, dmg: 3.2 },
  hasted: { spd: 1.5, cd: .7 }, frenzied: { cd: .55, dmg: 1.1 }, fortified: { size: 1.12 }, burning: { r: 2.75, dmg: 16, every: 3.2, windup: .8, dt: 'fire' }, splitting: { n: 3, type: 'runner' } };
// Elite rooms (room role 'elite', data/dungeon.js ROLES): one named rare, stronger than a pack's rare, with minions, behind a fog
// gate. On top of a rare's numbers: hp, dmg, size multipliers, `affixes` more affixes, xp × its rare XP. types: what the elite
// is (weighted by repeats; melee ones swing heavies). minions: the pack around it ([type, count], grown per tier like any pack),
// magic: chance the minions are magic. titles: its name is a rare's name plus one of these. Its items: DROP.elite (data/items.js);
// it drops no gem (gem drops are the owner's call, design notes "Not decided yet").
export const ELITE = { hp: 2.2, dmg: 1.35, size: 1.12, affixes: 1, xp: 1.5, types: ['zombie', 'zombie', 'zombie', 'archer'],
  minions: [['zombie', 2], ['runner', 2]], magic: .5,
  titles: ['the Unburied', 'Crypt Lord', 'the Hollow King', 'Bonewarden', 'the Grave-Sworn', 'the Ashen'] };

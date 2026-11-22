// Level tuning (game/level.js). The Crypt is five levels (LEVELS, index 0 = Crypt 1) that all follow the same beat template (LEVEL.template):
// the rhythm is fixed, each level reskins it (monsters, hazards, beat flavour, map density) and is harder than the last.
// BEATS is the base beat set (= Crypt 1's); a level's `beats: { type: {...} }` is merged over it per beat type (resolveBeats).
// The slots that list several types pick one at random every time a level is generated. Monsters are [type, count] pairs.
// Beat colours are used for the world marker, its light and the minimap.
import { G } from '../core/state.js';

// ---- shared template (every level) ----
export const LEVEL = {
  // The route is a chain of points snaking from the start to the guardian's arena. `bends` switchbacks, each swinging
  // `sway` units off the straight line (alternating sides); `margin` keeps the route off the walls. `minLen`: reroll the
  // switchbacks (up to `tries` times) until the route is at least this long, so short folds don't starve it of packs.
  // `spacing`/`width`: a clearing (kept free of obstacles) every `spacing` units along the route, `width` units wide. A level's `route`
  // overrides these (the Ossuary packs clearings every 3 units, 2 wide: a continuous narrow corridor between dense obstacles).
  route: { bends: [5, 6], sway: [15, 23], margin: 6, minLen: 235, tries: 12, spacing: 6, width: 2.4 },
  start: { clear: 7 },
  respawnGrace: 4, // seconds after a respawn before a nearby beat may signal again (so the hero can step away or ready up)
  // Packs along the route: min distance between packs, how far off the line they sit, how far from any beat site.
  // min: if the template's stretches can't fit enough packs (short or tightly folded routes), top up to this many.
  packs: { gap: 7, lateral: 3.2, fromSite: 3, magicChance: .3, rareChance: .12, min: 9,
    // The top-up pass (when the stretches couldn't fit `min` packs) is looser: wider spread off the line, closer together, and nearer the beat sites (never inside their clearings or the breather's no-pack radius).
    top: { lateral: 8, gap: 5.5, fromSite: 1 } },
  // Map dressing (world/dungeon.js, world/map.js): obstacle count, minimum gap between obstacles, and which obstacle set to draw from
  // (data/dungeon.js OBSTACLE_SETS; null = all). A level's `map` overrides these.
  map: { obstacles: 46, gap: 2.2, set: null },
  // The template, in order. `at`: how far along the route the beat sits (0..1). `packs`: normal packs on the stretch
  // BEFORE it (the first stretch is the warm-up; `size` scales their headcount). `par`: minutes into a 30-minute
  // level, from the design notes (documentation only; clear time comes from kill speed and movement).
  template: [
    { slot: 'small', types: ['treasure', 'gamble'], at: .17, packs: 3, size: .75, par: 6 },
    { slot: 'elite', types: ['elite'], at: .30, packs: 2, par: 11 },
    { slot: 'breather', types: ['breather'], at: .42, packs: 1, par: 15 },
    { slot: 'ambush', types: ['ambush'], at: .55, packs: 2, par: 19 },
    { slot: 'big', types: ['survival', 'doubleElite'], at: .72, packs: 3, par: 24 },
    { slot: 'release', types: ['release'], at: .85, packs: 1, par: 27 },
    { slot: 'guardian', types: ['guardian'], at: 1, packs: 1, par: 29 },
  ],
};

// Poison pools (game/hazards.js). Base values; a level's hazards.pools and a boss's abilities override some. dps: damage per second at
// Crypt 1 (x the level's dmg scale); tick: seconds between hits; r: radius; life: seconds a dropped pool lasts (ambient pools last the level).
export const POOL = { dps: 5, tick: .5, r: 2, life: 9 };

// Per beat type. signal: how close the hero must come before the beat announces itself. windup: seconds between the
// banner (or the trigger) and the monsters appearing. trigger: the hero must also step this close to the centre before
// the wind-up starts. clear: radius kept free of obstacles and packs. loot: { n drops, boost } through items.js dropItem.
export const BEATS = {
  treasure: {
    name: 'Treasure', title: 'A LOCKED CHEST', sub: 'Its guards wake as you near', done: ['CHEST OPENED', 'Take the loot'],
    color: 0xffd23f, signal: 15, windup: 1.8, clear: 4.5, noPacks: 8,
    guards: [['zombie', 5], ['runner', 2]], guardRadius: 4, magic: true, loot: { n: 3, boost: .3 },
  },
  gamble: {
    name: 'Gamble', title: 'A BLOOD ALTAR', sub: 'Step onto it to gamble for better loot', done: ['THE ALTAR IS SATED', 'Take your reward'],
    color: 0xff3030, signal: 15, trigger: 2, windup: 1.6, clear: 4.5, noPacks: 8,
    pack: [['zombie', 7], ['runner', 6]], packRadius: 4.5, magic: true, rare: 'zombie', loot: { n: 3, boost: .5 },
  },
  elite: {
    name: 'Elite', title: 'AN ELITE STIRS', sub: 'A named rare and its retinue', done: ['THE ELITE FALLS', 'Take the loot'],
    color: 0xffa020, signal: 17, windup: 2.2, clear: 5, noPacks: 8,
    rares: [['zombie', 'runner', 'zombie']], minions: [['zombie', 4], ['runner', 4]], minionRadius: 4, loot: { n: 2, boost: .45 },
  },
  breather: {
    name: 'Breather', title: 'A QUIET FOUNTAIN', sub: 'Rest here. Life and flasks restored', done: ['REFRESHED', 'Onward'],
    color: 0x50c8ff, signal: 12, trigger: 3.2, windup: .6, clear: 5, noPacks: 12.5, restore: 2.5,
  },
  ambush: {
    name: 'Ambush', title: 'AMBUSH', sub: 'The room seals behind you', done: ['THE SEAL BREAKS', 'Take the loot'],
    color: 0xc050ff, signal: 17, radius: 9, trigger: 8, windup: 2.4, clear: 11, noPacks: 11, posts: 20, coffins: 8,
    waves: [
      [['zombie', 6], ['runner', 4]],
      [['zombie', 6], ['runner', 6]],
      [['zombie', 7], ['runner', 8]],
    ],
    waveGap: 1.4, loot: { n: 3, boost: .4 },
  },
  survival: {
    name: 'Survival', title: 'HOLD THE CIRCLE', sub: 'Survive 75 seconds inside it. Leaving pauses the timer', done: ['YOU HELD', 'The horde collapses'],
    color: 0x40ffa0, signal: 17, radius: 7.5, trigger: 7, windup: 2.4, clear: 9.5, noPacks: 11, duration: 75,
    waveGap: 5.5, wave: { base: 4, perThirty: 2, max: 10 }, maxAlive: 24,
    mix: [['zombie', 6], ['runner', 5]], ring: 2.5, loot: { n: 4, boost: .45 },
  },
  doubleElite: {
    name: 'Double Elite', title: 'TWO ELITES', sub: 'Two named rares fight as one', done: ['BOTH ELITES FALL', 'Take the loot'],
    color: 0xff7a1a, signal: 17, windup: 2.4, clear: 6, noPacks: 8,
    rares: [['zombie', 'runner', 'zombie'], ['zombie', 'zombie', 'runner']], minions: [['zombie', 5], ['runner', 5]], minionRadius: 5, loot: { n: 3, boost: .55 },
  },
  release: {
    name: 'Release', title: 'A QUIET STRETCH', sub: 'A cache waits before the guardian', done: ['CACHE OPENED', 'Catch your breath'],
    color: 0xffe08a, signal: 12, trigger: 2.6, windup: .5, clear: 4, noPacks: 10, loot: { n: 3, boost: .4 },
  },
  guardian: {
    name: 'Guardian', title: 'THE GUARDIAN STIRS', sub: 'A skeleton knight bars the way out', done: ['LEVEL CLEARED', 'The exit portal opens'],
    color: 0xff4fd8, signal: 20, windup: 2.6, clear: 11, noPacks: 11, loot: { n: 5, boost: .6, first: .8 },
  },
};

// ---- the five Crypt levels ----
// blurb: one line for the waypoint screen. scale: multipliers on monster hp / damage / xp (data/monsters.js holds the Crypt 1 numbers). Each level is ~x1.35 HP and ~x1.17 damage
// over the previous (xp follows hp). par: the character level the level is built for (design notes' Pyromancer table).
// packSize: multiplies pack headcounts. packs: overrides LEVEL.packs (magic/rare chances, minimum pack count). mix: pack templates
// (a pack picks one at random). rareTypes: what a pack's rare can be. slots: overrides of a template slot's `types`.
// beats: per-beat-type overrides (monster lists, titles, subs). hazards: pools { count, r: [min, max], lateral, dps, tick, bloat: {r, life, dps} }.
// guardian: key of the guardian in MT (data/monsters.js). route, map: overrides of LEVEL.route / LEVEL.map.
export const LEVELS = [
  { // 1: open rooms, zombies and runners
    name: 'Crypt Halls', n: 1, blurb: 'Open rooms · zombies and runners', par: 1, scale: { hp: 1, dmg: 1, xp: 1 }, packSize: 1,
    packs: {}, rareTypes: ['zombie', 'zombie', 'runner'],
    mix: [[['zombie', 9]], [['runner', 12]], [['zombie', 5], ['runner', 6]], [['zombie', 7], ['runner', 4]]],
    beats: {}, guardian: 'guardian', hazards: {},
  },
  { // 2: narrow corridors, archers arrive
    name: 'Ossuary', n: 2, blurb: 'Narrow corridors · archers arrive', par: 4, scale: { hp: 1.35, dmg: 1.17, xp: 1.35 }, packSize: 1.1,
    packs: { magicChance: .32, rareChance: .14 }, rareTypes: ['zombie', 'archer', 'archer', 'runner'],
    route: { bends: [6, 8], sway: [16, 24], minLen: 250, spacing: 3, width: 2 },
    map: { obstacles: 104, gap: 1.3, set: 'ossuary' },
    mix: [[['zombie', 6], ['archer', 3]], [['archer', 5], ['zombie', 4]], [['runner', 7], ['archer', 3]], [['zombie', 5], ['runner', 4], ['archer', 3]], [['zombie', 8]]],
    beats: {
      treasure: { title: 'A SEALED OSSUARY', sub: 'Bone archers watch from the alcoves', guards: [['zombie', 4], ['archer', 3]] },
      gamble: { title: 'A BONE ALTAR', pack: [['zombie', 6], ['runner', 4], ['archer', 4]] },
      elite: { title: 'A CRYPT-KEEPER STIRS', rares: [['zombie', 'archer', 'archer']], minions: [['zombie', 3], ['archer', 3], ['runner', 3]] },
      breather: { title: 'A SILENT CHAPEL' },
      ambush: { sub: 'The bones rattle in the walls', waves: [[['zombie', 5], ['runner', 4], ['archer', 2]], [['zombie', 5], ['archer', 4], ['runner', 4]], [['zombie', 6], ['archer', 5], ['runner', 6]]] },
      survival: { mix: [['zombie', 5], ['runner', 4], ['archer', 3]] },
      doubleElite: { rares: [['zombie', 'archer'], ['archer', 'archer', 'runner']], minions: [['zombie', 4], ['archer', 4], ['runner', 3]] },
      guardian: { sub: 'A bone captain bars the way out' },
    },
    guardian: 'captain', hazards: {},
  },
  { // 3: bloaters and poison pools
    name: 'Flooded Tombs', n: 3, blurb: 'Bloaters and poison pools', par: 7, scale: { hp: 1.82, dmg: 1.37, xp: 1.8 }, packSize: 1.2,
    packs: { magicChance: .34, rareChance: .15 }, rareTypes: ['zombie', 'bloater', 'archer', 'runner'],
    map: { obstacles: 40, gap: 2.4, set: 'flooded' },
    mix: [[['bloater', 3], ['zombie', 5]], [['runner', 7], ['archer', 2], ['bloater', 2]], [['zombie', 6], ['bloater', 3], ['archer', 2]], [['bloater', 4], ['runner', 6]], [['zombie', 7], ['archer', 3]]],
    beats: {
      treasure: { title: 'A SUNKEN CHEST', sub: 'Its guards wade out of the water', guards: [['zombie', 4], ['bloater', 2], ['runner', 2]] },
      gamble: { title: 'A DRIPPING ALTAR', pack: [['zombie', 6], ['runner', 5], ['bloater', 3]] },
      elite: { title: 'SOMETHING SURFACES', rares: [['zombie', 'bloater', 'archer']], minions: [['zombie', 3], ['bloater', 2], ['runner', 3]] },
      breather: { title: 'A CLEAR SPRING', sub: 'The only clean water here. Life and flasks restored' },
      ambush: { title: 'THE WATER CHURNS', sub: 'The coffins burst open', waves: [[['zombie', 5], ['runner', 4], ['bloater', 1]], [['zombie', 5], ['bloater', 2], ['archer', 3], ['runner', 4]], [['zombie', 5], ['bloater', 4], ['runner', 6], ['archer', 2]]] },
      survival: { mix: [['zombie', 5], ['runner', 4], ['archer', 2], ['bloater', 3]] },
      doubleElite: { rares: [['bloater', 'zombie'], ['zombie', 'archer', 'bloater']], minions: [['zombie', 4], ['bloater', 2], ['runner', 4]] },
      guardian: { sub: 'A drowned warden rises from the pool' },
    },
    guardian: 'warden',
    hazards: { pools: { count: 14, r: [1.5, 2.5], lateral: [-4, 4], dps: 5, bloat: { r: 1.7, life: 9, dps: 4 } } },
  },
  { // 4: the necromancer
    name: 'Bone Gardens', n: 4, blurb: 'A necromancer raises the dead', par: 10, scale: { hp: 2.46, dmg: 1.6, xp: 2.5 }, packSize: 1.3,
    packs: { magicChance: .36, rareChance: .16 }, rareTypes: ['zombie', 'archer', 'necro', 'runner'],
    map: { obstacles: 50, gap: 2.2, set: 'gardens' },
    mix: [[['zombie', 7], ['necro', 1]], [['zombie', 4], ['archer', 3], ['necro', 1]], [['runner', 7], ['zombie', 4], ['necro', 1]], [['zombie', 8], ['archer', 2]], [['zombie', 5], ['runner', 5], ['necro', 2]]],
    beats: {
      treasure: { title: 'A BURIED CACHE', sub: 'Its guards claw out of the soil', guards: [['zombie', 5], ['archer', 2], ['necro', 1]] },
      gamble: { title: 'A BONE SHRINE', pack: [['zombie', 7], ['runner', 5], ['necro', 1]] },
      elite: { title: 'THE GARDENER STIRS', rares: [['necro', 'zombie', 'archer']], minions: [['zombie', 4], ['runner', 3], ['necro', 1]] },
      breather: { title: 'A STONE BENCH', sub: 'Rest among the bones. Life and flasks restored' },
      ambush: { sub: 'The graves open around you', waves: [[['zombie', 6], ['runner', 4], ['necro', 1]], [['zombie', 5], ['archer', 3], ['runner', 4], ['necro', 1]], [['zombie', 6], ['runner', 6], ['archer', 3], ['necro', 2]]] },
      survival: { mix: [['zombie', 6], ['runner', 4], ['archer', 2], ['necro', 1]] },
      doubleElite: { rares: [['necro', 'zombie'], ['zombie', 'archer', 'necro']], minions: [['zombie', 5], ['runner', 4], ['necro', 1]] },
      guardian: { sub: 'A necromancer lord waits among the bones' },
    },
    guardian: 'lord', hazards: {},
  },
  { // 5: heavy on elites, tests everything
    name: 'Throne Approach', n: 5, blurb: 'Elites everywhere · the king\'s lieutenant', par: 12, scale: { hp: 3.32, dmg: 1.87, xp: 3.3 }, packSize: 1.4,
    packs: { magicChance: .5, rareChance: .3, min: 11 }, rareTypes: ['zombie', 'archer', 'bloater', 'necro', 'runner'],
    map: { obstacles: 56, gap: 2.0, set: null },
    slots: { big: ['doubleElite', 'doubleElite', 'survival'] },
    mix: [[['zombie', 7], ['runner', 4], ['archer', 2]], [['archer', 4], ['zombie', 5], ['necro', 1]], [['bloater', 3], ['zombie', 5], ['archer', 2]], [['runner', 8], ['archer', 3], ['necro', 1]], [['zombie', 6], ['bloater', 2], ['necro', 1], ['archer', 2]]],
    beats: {
      treasure: { title: 'A ROYAL VAULT', sub: 'The king\'s guards do not sleep', guards: [['zombie', 5], ['archer', 3], ['necro', 1]] },
      gamble: { title: 'A TRIBUTE ALTAR', pack: [['zombie', 6], ['runner', 5], ['archer', 3], ['necro', 1]], rare: 'archer' },
      elite: { title: 'THE KING\'S CHAMPIONS', sub: 'Two named rares and their retinue',
        rares: [['zombie', 'archer'], ['necro', 'bloater', 'zombie']], minions: [['zombie', 4], ['archer', 3], ['runner', 3]], loot: { n: 3, boost: .55 } },
      breather: { title: 'A BROKEN FOUNTAIN', sub: 'Rest while you can. Life and flasks restored' },
      ambush: { sub: 'The honour guard rises', waves: [[['zombie', 6], ['runner', 4], ['archer', 3]], [['zombie', 5], ['archer', 4], ['necro', 1], ['runner', 4]], [['zombie', 6], ['bloater', 2], ['runner', 6], ['archer', 3], ['necro', 1]]] },
      survival: { mix: [['zombie', 5], ['runner', 4], ['archer', 3], ['bloater', 2], ['necro', 1]] },
      doubleElite: { title: 'THE KING\'S CHAMPIONS', rares: [['zombie', 'archer', 'bloater'], ['necro', 'zombie'], ['archer', 'runner', 'zombie']], minions: [['zombie', 5], ['runner', 4], ['archer', 3]], loot: { n: 4, boost: .6 } },
      guardian: { sub: 'The Ashen King\'s lieutenant bars the throne room', done: ['LEVEL CLEARED', 'The Trial awaits'] },
    },
    guardian: 'lieutenant',
    hazards: { pools: { count: 6, r: [1.5, 2.2], lateral: [-4, 4], dps: 5, bloat: { r: 1.6, life: 8, dps: 4 } } },
  },
];

// The current Crypt's definition (G.crypt is set by game/level.js newLevel; before any level exists it is Crypt 1).
export const lvDef = () => LEVELS[(G.crypt || 1) - 1] || LEVELS[0];
// Monster multipliers of the current Crypt: { hp, dmg, xp }.
export const lvScale = () => lvDef().scale;
// The current level's beat definitions: BEATS merged with its overrides, per beat type.
export function resolveBeats(lv) { const o = {}; for (const t in BEATS) o[t] = { ...BEATS[t], ...(lv.beats && lv.beats[t]) }; return o; }

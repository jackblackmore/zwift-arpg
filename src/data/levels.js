// Level tuning (game/level.js): the beat template and what each beat does. The rhythm is fixed; the slots that
// list several types pick one at random every time a level is generated. Monsters are [type, count] pairs.
// Beat colours are used for the world marker, its light and the minimap.

export const LEVEL = {
  name: 'Crypt Halls',
  depth: 1, // item level and monster scaling (maps used to have tiers; levels are all depth 1 for now)
  // The route is a chain of points snaking from the start to the guardian's arena. `bends` switchbacks, each swinging
  // `sway` units off the straight line (alternating sides); `margin` keeps the route off the walls. `minLen`: reroll the
  // switchbacks (up to `tries` times) until the route is at least this long, so short folds don't starve it of packs.
  route: { bends: [5, 6], sway: [15, 23], margin: 6, minLen: 235, tries: 12, spacing: 6, width: 2.4 },
  start: { clear: 7 },
  respawnGrace: 4, // seconds after a respawn before a nearby beat may signal again (so the hero can step away or ready up)
  // Packs along the route: min distance between packs, how far off the line they sit, how far from any beat site.
  // min: if the template's stretches can't fit enough packs (short or tightly folded routes), top up to this many.
  packs: { gap: 7, lateral: 3.2, fromSite: 3, magicChance: .3, rareChance: .12, min: 9 },
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

// Per beat type. signal: how close the hero must come before the beat announces itself. windup: seconds between the
// banner (or the trigger) and the monsters appearing. trigger: the hero must also step this close to the centre before
// the wind-up starts. clear: radius kept free of obstacles and packs. loot: { n drops, boost } through items.js dropItem.
export const BEATS = {
  treasure: {
    name: 'Treasure', title: 'A LOCKED CHEST', sub: 'Its guards wake as you near', done: ['CHEST OPENED', 'Take the loot'],
    color: 0xffd23f, signal: 15, windup: 1.8, clear: 4.5, noPacks: 8,
    guards: [['zombie', 5], ['archer', 2]], guardRadius: 4, magic: true, loot: { n: 3, boost: .3 },
  },
  gamble: {
    name: 'Gamble', title: 'A BLOOD ALTAR', sub: 'Step onto it to gamble for better loot', done: ['THE ALTAR IS SATED', 'Take your reward'],
    color: 0xff3030, signal: 15, trigger: 2, windup: 1.6, clear: 4.5, noPacks: 8,
    pack: [['zombie', 7], ['runner', 6], ['archer', 3]], packRadius: 4.5, magic: true, rare: 'zombie', loot: { n: 3, boost: .5 },
  },
  elite: {
    name: 'Elite', title: 'AN ELITE STIRS', sub: 'A named rare and its retinue', done: ['THE ELITE FALLS', 'Take the loot'],
    color: 0xffa020, signal: 17, windup: 2.2, clear: 5, noPacks: 8,
    rares: [['zombie', 'archer', 'bloater', 'zombie']], minions: [['zombie', 4], ['runner', 4]], minionRadius: 4, loot: { n: 2, boost: .45 },
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
      [['zombie', 5], ['archer', 3], ['runner', 4]],
      [['zombie', 5], ['bloater', 2], ['runner', 6], ['archer', 2]],
    ],
    waveGap: 1.4, loot: { n: 3, boost: .4 },
  },
  survival: {
    name: 'Survival', title: 'HOLD THE CIRCLE', sub: 'Survive 75 seconds inside it. Leaving pauses the timer', done: ['YOU HELD', 'The horde collapses'],
    color: 0x40ffa0, signal: 17, radius: 7.5, trigger: 7, windup: 2.4, clear: 9.5, noPacks: 11, duration: 75,
    waveGap: 5.5, wave: { base: 4, perThirty: 2, max: 10 }, maxAlive: 24,
    mix: [['zombie', 5], ['runner', 4], ['archer', 2], ['bloater', 1]], ring: 2.5, loot: { n: 4, boost: .45 },
  },
  doubleElite: {
    name: 'Double Elite', title: 'TWO ELITES', sub: 'Two named rares fight as one', done: ['BOTH ELITES FALL', 'Take the loot'],
    color: 0xff7a1a, signal: 17, windup: 2.4, clear: 6, noPacks: 8,
    rares: [['zombie', 'archer', 'zombie'], ['bloater', 'zombie', 'archer']], minions: [['zombie', 5], ['runner', 5]], minionRadius: 5, loot: { n: 3, boost: .55 },
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

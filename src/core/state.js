// Shared mutable game state. Modules import these objects and mutate their fields.

// G: the world and everything in it.
export const G = {
  tier: 1, mapKills: 0, mapTotal: 0, gt: 0, paused: true, started: false,
  minions: [], // allies: Raise Skeletons (game/sk/skeletons.js)
  enemies: [], proj: [], eproj: [], patches: [], ground: [], floats: [], queue: [], effects: [],
  packs: [], obst: [], torches: [], portal: null, bossSpec: null, shrine: null, shrineAsk: null, layout: null, // layout: the level grid (world/gen.js); null = open floor (arena)
  start: { x: 0, z: 0 }, bossSpot: { x: 0, z: 0 },
  world: null, mmBase: null, heroM: null,
  vign: 0, shakeA: 0, hitStop: 0, saveT: 30, bannerT: 0, labelRects: [], itemId: 1,
};

// P: the player character (position, resources, progression, gear).
export const P = {
  x: 0, z: 0, r: .4, face: 0, life: 100, mana: 60, lvl: 1, xp: 0, kills: 0,
  castT: 0, castAnim: 0, shield: 0, shieldT: 0, wardT: 0, flask: 3, flaskT: 0, flaskRate: 0,
  inv: [], gear: {}, passives: {}, pts: 0, offer: null, newItems: 0,
  // Skill gems (game/gems.js): gems = the gem bag, every gem owned ({ id, gem, lvl, xp }); bar = slot → gem id or null;
  // cd = per-slot cooldown / charges ({ cd, ch, t }); shrined = slots whose shrine has been used.
  gems: [], bar: {}, cd: {}, shrined: {},
  dead: 0, walkT: 0, moving: false, invuln: 0, fbN: 0, autoNovaT: 5, moveX: 0, moveZ: 1, castSeq: 0, lastCast: null,
};

// S: derived stats, recomputed from level, gear and passives by game/stats.js recalc().
export const S = {};

export const shake = a => { G.shakeA = Math.max(G.shakeA, a); };
export const stop = t => { G.hitStop = Math.max(G.hitStop, t); };

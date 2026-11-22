// Shared mutable game state. Modules import these objects and mutate their fields.
import { BAR } from '../data/skills.js';

// G: the world and everything in it.
export const G = {
  depth: 1, level: null, mapKills: 0, gt: 0, paused: true, started: false,
  enemies: [], proj: [], eproj: [], patches: [], ground: [], floats: [], queue: [], effects: [],
  packs: [], obst: [], torches: [], portal: null,
  // allies: player-side units (minions, totems, decoys); corpses: bodies left by kills { x, z, type, rar, maxHp, t }; shrines: shrine objects at this level's entrance
  allies: [], corpses: [], shrines: [],
  // start: where the hero enters; bossSpot: the guardian's arena; clear: circles { x, z, r } kept free of obstacles
  start: { x: -29, z: 29 }, bossSpot: { x: 26, z: -26 }, clear: [{ x: -29, z: 29, r: 7 }, { x: 26, z: -26, r: 11 }],
  world: null, mmBase: null, heroM: null,
  vign: 0, shakeA: 0, hitStop: 0, saveT: 30, bannerT: 0, labelRects: [], itemId: 1,
};

// P: the player character (position, resources, progression, gear).
export const P = {
  x: 0, z: 0, r: .4, face: 0, life: 100, lvl: 1, xp: 0, kills: 0,
  castAnim: 0, flask: 3, flaskT: 0, flaskRate: 0,
  bar: { ...BAR }, gems: {}, cd: { main: 0, flexA: 0, guard: 0, evade: 0 }, ward: null, eff: { move: 1, atk: 1, surging: false }, surge: { v: 1, max: 1 },
  inv: [], gear: {}, passives: {}, pts: 0, offer: null, newItems: 0,
  clears: 0, waypoint: 0, shrines: {}, tree: {}, sockets: {}, // levels cleared, furthest Crypt level cleared, shrines taken, passive tree nodes, support sockets
  dead: 0, walkT: 0, moving: false, invuln: 0, fbN: 0, autoNovaT: 5, moveX: 0, moveZ: 1, castSeq: 0, lastCast: null,
};

// S: derived stats, recomputed from level, gear and passives by game/stats.js recalc().
export const S = {};

export const shake = a => { G.shakeA = Math.max(G.shakeA, a); };
export const stop = t => { G.hitStop = Math.max(G.hitStop, t); };

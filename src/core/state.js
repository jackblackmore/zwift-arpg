// Shared mutable game state. Modules import these objects and mutate their fields.

// G: the world and everything in it.
export const G = {
  tier: 1, mapKills: 0, mapTotal: 0, gt: 0, paused: true, started: false,
  minions: [], // allies: Raise Skeletons (game/sk/skeletons.js)
  enemies: [], eproj: [], patches: [], ground: [], floats: [], queue: [], effects: [],
  packs: [], obst: [], jn: null, goal: null, skip: new Set(), jnDone: new Set(), // route choice at junctions (game/route.js)
   torches: [], portal: null, gate: null, gates: [], chests: [], rest: null, bossSpec: null, shrine: null, shrineAsk: null, layout: null, // layout: the level grid (world/gen.js); null = open floor (arena). gates: fog gates (game/gate.js), gate the guardian arena's; chests, rest: room roles (game/rooms.js)
  devSeed: 0, // dev: ?seed=N fixes the level layouts (src/main.js, world/map.js)
  start: { x: 0, z: 0 }, bossSpot: { x: 0, z: 0 },
  world: null, mmBase: null, heroM: null,
  vign: 0, shakeA: 0, hitStop: 0, saveT: 30, bannerT: 0, labelRects: [], itemId: 1,
};

// P: the player character (position, resources, progression, gear).
export const P = {
  x: 0, z: 0, r: .4, face: 0, life: 100, surge: 30, spent: false, surgeK: 0, surgeWait: 0, lvl: 1, xp: 0, kills: 0,
  castT: 0, castAnim: 0, shield: 0, shieldT: 0, barrierFx: 0, flask: 3, flaskT: 0, flaskRate: 0,
  inv: [], gear: {}, newItems: 0,
  tree: [], treeNew: [], // the passive tree (game/tree.js): nodes held (points come from level), nodes taken since the tree panel opened
  // Skill gems (game/gems.js): gems = the gem bag, every gem owned ({ id, gem, lvl, xp }); bar = slot → gem id or null;
  // cd = per-slot cooldown / charges ({ cd, ch, t }); shrined = slots whose shrine has been used.
  // sock = slot → support gem ids in its sockets; newGems = gems picked up since the gem panel was last opened.
  gems: [], bar: {}, sock: {}, cd: {}, shrined: {}, newGems: 0,
  // Fight mechanics (game/sk/guard.js, game/sk/roll.js): blocking, the parry window, posture (0..1) and its drain wait, guard
  // broken stun, riposte window, the roll in progress, the swing token (a block or roll cancels the queued swing), autopilot pause.
  blocking: false, parryT: 0, parryCd: 0, posture: 0, postWait: 0, broken: 0, riposteT: 0, rollT: 0, rollVx: 0, rollVz: 0, rollDir: 'Forward', swingTok: 0, apPause: 0,
  staggers: 0, finishers: 0, chans: 0, chanBroken: 0, // monsters you've staggered, finishers landed, guardian channels started and broken (game/combat.js, game/enemies.js), counted for the arena
  dead: 0, walkT: 0, moving: false, invuln: 0, fbN: 0, autoNovaT: 5, moveX: 0, moveZ: 1, castSeq: 0, lastCast: null,
};

// S: derived stats, recomputed from level, gear, the passive tree and the skill bar by game/stats.js recalc().
export const S = {};

export const shake = a => { G.shakeA = Math.max(G.shakeA, a); };
export const stop = t => { G.hitStop = Math.max(G.hitStop, t); };

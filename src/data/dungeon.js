// Dungeon layout tuning (world/dungeon.js). Names are models in public/models/dungeon.glb (scripts/prep-models.mjs).
// Weighted picks are [name, weight] lists.
export const FLOOR = [['floor_tile_large', 1]];
export const WALL = [['wall', 55], ['wall_cracked', 16], ['wall_arched', 10], ['wall_broken', 6], ['wall_pillar', 13]];
export const BANNERS = ['banner_red', 'banner_patternA_red', 'banner_patternC_brown', 'banner_shield_white'];

// Obstacles: circles are [x, z, r] colliders in the model's own units (before scale and rotation).
export const OBSTACLES = [
  { name: 'pillar', w: 2, circles: [[0, 0, .75]] },
  { name: 'pillar_decorated', w: 1, circles: [[0, 0, .95]] },
  { name: 'barrel_large', w: 2, circles: [[0, 0, .9]] },
  { name: 'keg', w: 1, circles: [[0, 0, 1]] },
  { name: 'box_large', w: 1, circles: [[0, 0, .85]] },
  { name: 'crates_stacked', w: 2, circles: [[0, 0, 1.1]] },
  { name: 'box_stacked', w: 2, circles: [[0, 0, 1.7]] },
  { name: 'barrel_small_stack', w: 1, circles: [[-.45, 0, .55], [.45, 0, .55]] },
  { name: 'rubble_large', w: 2, circles: [[-2.7, 0, 1.4], [0, 0, 1.6], [2.7, 0, 1.4]] },
  { name: 'rubble_half', w: 1, circles: [[1, 0, 1.4], [2.9, 0, 1.2]] },
  { name: 'coffin', w: 1, circles: [[0, -.75, 1], [0, .75, 1]] },
];

// Loose clutter on the floor (no colliders), and how many of each.
export const CLUTTER = [['bone_A', 22], ['bone_B', 18], ['bone_C', 12], ['skull', 14], ['ribcage', 8], ['coin_stack_small', 5], ['candle_triple', 8], ['candle_lit', 10]];

// ---- Level layout (world/gen.js) ----
// The level is a zones × zones grid of zones, each zoneCells × zoneCells cells and holding at most one room.
// A random route of zones runs from the entrance (bottom-left) to the guardian arena (top-right); a few side
// rooms hang off it as dead ends. Rooms are joined by Z-shaped corridors laid along the gaps between zones.
export const GEN = {
  cell: 3.2, // world units per grid cell: one floor tile (4 × DUNGEON.scale in data/graphics.js)
  zones: 4, zoneCells: 11, // 44 × 44 cells = 141 units across
  route: [9, 13], // main route length in rooms, entrance and guardian included (odd numbers only fit the grid)
  room: [4, 7], // ordinary room width and height in cells (at most zoneCells − 4: two wall cells each side)
  startRoom: [4, 5], bossRoom: 7,
  side: [4, 6], // side rooms
  corridor: 2, // corridor width in cells
  notchChance: .35, // chance a room of 5+ cells loses a corner block (an L shape)
};
// Dressing density (world/dungeon.js): props per floor cell in ordinary rooms, wall torches (one per this many wall
// segments, at most `max`), and braziers (at most one per room, `max` in all).
export const OBSTACLE_DENSITY = .09;
export const WALL_TORCH = { every: 7, max: 34 };
export const BRAZIER_MAX = 16;
// Packs: how far apart (units) packs sit, and how far from the entrance.
export const PACK_SPACING = { room: 7, relaxed: 5, fromStart: 13, fromBoss: 9 };
// Fog gates (game/gate.js): a misty barrier across a room's doorways. Once you're `inside` units past them and the fight has
// started (the guardian or the elite is awake), it seals: no way out until it dies (then it opens for good) or you die (then it
// reopens and the guardian or elite resets). `rooms`: which room kinds (start, main, side, boss) or roles (ROLES) get one.
export const GATE = { rooms: ['boss', 'elite'], inside: 1.5 };

// ---- Room roles (world/gen.js assignRoles; design notes "Level generation v2" and "Beats") ----
// Every room gets a role; the role decides what's in it and what its door sign says (game/route.js). Ambush and shrine rooms
// aren't built yet (not decided). `est`: rough seconds at par for the room's content, beyond walking (the time budget, build
// order step 10 step 6, will add these up; first guesses until measured). `col`: the map viewer's and minimap's colour.
//   start: the entrance (no content).        combat: today's packs.
//   elite: one named strong rare with minions, more and better items, a fog gate (ELITE in data/monsters.js, DROP.elite in data/items.js).
//   treasure: a chest that drops items when opened, sometimes guarded (CHEST in data/items.js).
//   rest: heals, refills flasks and clears posture, once per map; no monsters (REST below).   guardian: the level's end.
export const ROLES = {
  start: { icon: '⌂', name: 'Entrance', col: '#5fe39a', est: 0 },
  combat: { icon: '⚔', name: 'Combat', col: '#a08a62', est: 20 }, // about 2 packs of 10 s (packs are shared out over the combat rooms)
  elite: { icon: '☠', name: 'Elite', col: '#ff7a3a', est: 60 },
  treasure: { icon: '✦', name: 'Treasure', col: '#ffd23f', est: 20 },
  rest: { icon: '☗', name: 'Rest', col: '#5ad0c0', est: 15 },
  guardian: { icon: '♛', name: 'Guardian', col: '#ff4fd8', est: 70 },
};
// The rhythm along the route (the "Beats" template, scaled to the route): rooms are combat unless a beat takes them. A room's
// place on the route is rank / (route rooms − 1), 0 at the entrance and 1 at the guardian; a side room counts its parent's place.
//   warm: the first part of the route is combat only (warm-up), side rooms off it too.
//   beats: in order; each takes one combat room whose place is within `at`. side: 1 prefers a side room (an optional reward:
//   choosing the branch is choosing risk and reward), falling back to a route room; 2 side rooms only (or no beat); 0 route
//   rooms only. chance: the
//   beat happens on that share of levels (default every level).
// Rest rooms: on the route only (you always pass them), mid-route, at most one per level and only on some levels, so the start
// stays hard (design notes "Harder start").
export const RHYTHM = {
  warm: .2,
  beats: [
    { role: 'elite', at: [.25, .8], side: 1 }, // medium beat
    { role: 'treasure', at: [.2, .7], side: 1 }, // small beat
    { role: 'rest', at: [.45, .7], side: 0, chance: .5 }, // breather
    { role: 'treasure', at: [.5, 1], side: 2, chance: .5 }, // a late small beat
    { role: 'elite', at: [.6, 1], side: 2, chance: .35 }, // a late big beat (a second elite)
  ],
};
// Rest rooms (game/rooms.js): the flame heals you once you're in the room with no monster awake within `calm` units.
export const REST = { calm: 10 };

// ---- Set pieces (world/gen.js setPieces; design notes "Built: set pieces") ----
// Authored dressing for the special rooms, laid out by the generator (so the map viewer draws it) and built by world/dungeon.js
// (primitive shapes in world/map.js without the models). Layout and look numbers only; no gameplay numbers. Distances in world
// units; every piece keeps `wallGap` from walls and `lineGap` (plus its own radius) from the corridor centre lines, so doorways
// and the walk through a room stay clear, and anything that can't fit is left out.
//   arena (the guardian's room): a low dais under the guardian (`dais`: half its width, `lift`: its height), four decorated pillars
//     on the diagonals (`pillar` from the guardian), a brazier in each corner (`corner` in from the walls), the ring of skull posts
//     and gravestones (`ring`).
//   vault (treasure): the chest on a plinth (`plinth`: width, height, depth) against the wall facing the way in (`wall` from it),
//     braziers either side (`flank`), coins.
//     A room with one doorway and at least `depth` cells deep gets a partition wall across it with a gap on the doorway's line:
//     an antechamber (where a guard pack waits) and the vault behind.
//   chapel (rest): the flame in the middle of the room's quietest part (the free side of the corridors, `off` from the room's
//     centre, which the corridors cross), stone benches round it (`bench` away, `benchLen` long), candles in the corners; nothing else.
//   hall (elite): a colonnade of pillars both sides of the aisle from the doorway (`side` from its line, `step` apart), the elite
//     waiting at the far end (`end` from the far wall) between two braziers, coffins along the walls.
export const SET = {
  wallGap: .9, lineGap: 1.6,
  arena: { role: 'guardian', name: 'Guardian arena', pillar: 6.8, corner: 1.5, ring: 9, dais: 3.2, lift: .1 },
  vault: { role: 'treasure', name: 'Vault', wall: 1.9, flank: 2.4, depth: 5, cross: 5, plinth: [1.9, .45, 1.5] },
  chapel: { role: 'rest', name: 'Rest chapel', off: 3.2, bench: 2.5, benchLen: 2.2 },
  hall: { role: 'elite', name: 'Elite hall', side: 4.3, step: 4.4, end: 2.6, flank: 2.6 },
};

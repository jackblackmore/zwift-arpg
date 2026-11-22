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

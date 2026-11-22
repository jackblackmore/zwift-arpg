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
export const BRAZIERS = 14;

// Obstacle sets a level's map.set can pick (levels.js): lists of OBSTACLES names; a level with set null uses them all.
// The Ossuary is bone-and-pillar clutter (small, packed tight to make corridors); the Flooded Tombs are sparse with crates and rubble;
// the Bone Gardens favour coffins, rubble and graves of stone.
export const OBSTACLE_SETS = {
  ossuary: ['pillar', 'pillar_decorated', 'coffin', 'box_stacked', 'rubble_half', 'barrel_small_stack', 'crates_stacked'],
  flooded: ['barrel_large', 'keg', 'box_large', 'crates_stacked', 'rubble_large', 'rubble_half', 'pillar'],
  gardens: ['coffin', 'rubble_large', 'rubble_half', 'pillar_decorated', 'pillar', 'box_stacked'],
};

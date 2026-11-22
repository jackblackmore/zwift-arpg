// AREAS: the campaign (three acts of zones) and the endgame (waystone tiers). Area level (al) = monster level = item level.
//
// Zone fields:
//   al: area level. biome: look (biomes below). family: monster family (monsters.js) and `mix`: archetype weights.
//   rooms: combat rooms on the path to the exit. packs: normal packs per room. size: [min, max] monsters per normal pack.
//   magic: chance a pack is magic instead. rares: rare monsters in the zone (each with minions).
//   sideRooms: optional rooms (chest, shrine, elite). boss: monsters.js BOSSES id, if the zone ends in one.
//   quest: the zone objective. rewards: given once, on completing the quest.
//     passive: points. skill: unlock id (skills.js unlock). flask: flask tier. recipe: crafting.js recipe. slot: items.js slot.

export const BIOMES = {
  crypt:   { name: 'Crypt', pack: 'dungeon', walls: 'stone', fog: [24, 44, 0x060405], light: .65, palette: ['#c8a25a', '#4a4048'] },
  flooded: { name: 'Flooded vault', pack: 'dungeon', walls: 'stone', fog: [18, 36, 0x05080a], light: .55, water: 1, palette: ['#5a8aa0', '#2a3238'] },
  forest:  { name: 'Rotwood', pack: 'forest', walls: 'trees', fog: [18, 38, 0x081008], light: .6, palette: ['#6aa040', '#2a3220'] },
  bog:     { name: 'Bog', pack: 'forest+halloween', walls: 'trees', fog: [14, 30, 0x0a100a], light: .5, poison: 1, palette: ['#8ab040', '#1a2418'] },
  town:    { name: 'Ruined town', pack: 'hexagon+halloween', walls: 'buildings', fog: [26, 50, 0x100806], light: .7, fire: 1, palette: ['#ff7a3c', '#3a2a24'] },
  tower:   { name: 'Bell tower', pack: 'hexagon+dungeon', walls: 'stone', fog: [22, 42, 0x0a0810], light: .6, palette: ['#b06bff', '#2a2236'] },
};

export const ACTS = [
  {
    id: 'act1', name: 'The Ashen Crypt', family: 'skeletons', resPenalty: 0,
    zones: [
      { id: 'steps',   name: 'Crypt Steps',   al: 1, biome: 'crypt',   mix: { zombie: 3, runner: 2 },                         rooms: 11, packs: 1, size: [4, 7],  magic: .15, rares: 2, sideRooms: 1,
        quest: 'Light the four braziers', rewards: { passive: 1 } },
      { id: 'ossuary', name: 'The Ossuary',   al: 3, biome: 'crypt',   mix: { zombie: 3, runner: 2, archer: 2 },              rooms: 12,  packs: 1, size: [5, 8],  magic: .2,  rares: 2, sideRooms: 2,
        quest: 'Recover the bone key', rewards: { skill: 'arc' } },
      { id: 'vault',   name: 'Flooded Vault', al: 5, biome: 'flooded', mix: { zombie: 2, runner: 2, archer: 2, bloater: 2 },  rooms: 13, packs: 1, size: [6, 9],  magic: .2,  rares: 2, sideRooms: 2,
        quest: 'Drain the vault', rewards: { skill: 'frostNova', flask: 1 } },
      { id: 'chapel',  name: 'Bone Chapel',   al: 7, biome: 'crypt',   mix: { zombie: 3, archer: 2, bloater: 1, mage: 2 },    rooms: 14, packs: 1, size: [6, 10], magic: .25, rares: 3, sideRooms: 2,
        quest: 'Silence the bone choir', rewards: { passive: 1, recipe: 'benchLife' } },
      { id: 'hall',    name: 'Warden\'s Hall', al: 9, biome: 'crypt',  mix: { zombie: 3, runner: 2, archer: 2, mage: 2 },     rooms: 11,  packs: 1, size: [6, 10], magic: .25, rares: 2, sideRooms: 1,
        boss: 'paleWarden', quest: 'Defeat the Pale Warden', rewards: { skill: 'iceSpear', passive: 1 } },
    ],
  },
  {
    id: 'act2', name: 'The Rotwood', family: 'rot', resPenalty: -.15,
    zones: [
      { id: 'path',     name: 'Gloomroot Path',  al: 11, biome: 'forest', mix: { ghoul: 3, spider: 2 },                  rooms: 14, packs: 1, size: [6, 10], magic: .25, rares: 3, sideRooms: 2,
        quest: 'Find the hunter\'s camp', rewards: { passive: 1 } },
      { id: 'bog',      name: 'Bog of Lanterns', al: 13, biome: 'bog',    mix: { ghoul: 2, wisp: 2, bloater: 2 },        rooms: 15, packs: 1, size: [6, 10], magic: .25, rares: 3, sideRooms: 2,
        quest: 'Relight the lanterns', rewards: { skill: 'firewall', recipe: 'benchColdRes' } },
      { id: 'hollow',   name: 'Spider Hollow',   al: 15, biome: 'forest', mix: { spider: 4, ghoul: 1, wisp: 1 },       rooms: 16, packs: 1, size: [7, 11], magic: .25, rares: 3, sideRooms: 2,
        quest: 'Burn the egg sacs', rewards: { recipe: 'benchLightRes' } },
      { id: 'witchfen', name: 'Witchfen',        al: 17, biome: 'bog',    mix: { ghoul: 2, wisp: 1, witch: 2, spider: 2 }, rooms: 15, packs: 1, size: [7, 11], magic: .3, rares: 3, sideRooms: 2,
        quest: 'Slay the Fen Witch', rewards: { skill: 'ballLightning', flask: 2 } },
      { id: 'grove',    name: 'Hanged Grove',    al: 20, biome: 'forest', mix: { ghoul: 3, spider: 2, witch: 1, bloater: 1 }, rooms: 16, packs: 1, size: [7, 11], magic: .3, rares: 4, sideRooms: 2,
        quest: 'Cut down the hanged', rewards: { passive: 1 } },
      { id: 'heartwood',name: 'The Heartwood',   al: 23, biome: 'forest', mix: { ghoul: 2, spider: 2, wisp: 1, witch: 2 }, rooms: 12, packs: 1, size: [7, 11], magic: .3, rares: 3, sideRooms: 1,
        boss: 'rotmother', quest: 'Burn the Rotmother', rewards: { skill: 'raiseSkeleton', passive: 1 } },
    ],
  },
  {
    id: 'act3', name: 'The Hollow Town', family: 'cult', resPenalty: -.3,
    zones: [
      { id: 'fields',  name: 'Burnt Fields',     al: 25, biome: 'town',  mix: { cultist: 3, hound: 2 },                        rooms: 15, packs: 1, size: [7, 11], magic: .3, rares: 3, sideRooms: 2,
        quest: 'Reach the town gate', rewards: { passive: 1 } },
      { id: 'market',  name: 'Old Market',       al: 27, biome: 'town',  mix: { cultist: 2, hound: 2, pyromancer: 2, knight: 1 }, rooms: 16, packs: 1, size: [7, 12], magic: .3, rares: 4, sideRooms: 2,
        quest: 'Free the merchants', rewards: { skill: 'stormBrand', recipe: 'benchCast' } },
      { id: 'barracks', name: 'Ash Barracks',    al: 29, biome: 'town',  mix: { knight: 3, cultist: 2, hound: 2 },         rooms: 17, packs: 1, size: [7, 12], magic: .3, rares: 4, sideRooms: 2,
        quest: 'Steal the war plans', rewards: { passive: 1 } },
      { id: 'tower',   name: 'The Bell Tower',   al: 31, biome: 'tower', mix: { knight: 2, stormcaller: 2, cultist: 2 },       rooms: 16, packs: 1, size: [7, 12], magic: .3, rares: 4, sideRooms: 2,
        quest: 'Ring the bell', rewards: { skill: 'meteor', flask: 3 } },
      { id: 'gate',    name: 'Catacomb Gate',    al: 33, biome: 'crypt', mix: { knight: 2, pyromancer: 1, stormcaller: 1, cultist: 2, hound: 1 }, rooms: 17, packs: 1, size: [8, 12], magic: .3, rares: 4, sideRooms: 2,
        quest: 'Break the seal', rewards: { passive: 1 } },
      { id: 'throne',  name: 'Throne of Ash',    al: 35, biome: 'town',  mix: { knight: 2, pyromancer: 2, stormcaller: 2 },    rooms: 12,  packs: 1, size: [8, 12], magic: .3, rares: 3, sideRooms: 1,
        boss: 'ashenKing', quest: 'Dethrone the Ashen King', rewards: { skill: 'bladeVortex', passive: 2, unlock: 'waystones' } },
    ],
  },
];

// ENDGAME: waystones. Tier t has area level al = base + perTier × (t - 1). A waystone map is like a zone,
// with `layout` sizes, any family, and rolled mods (waystones.js in crafting.js). maxTier: the pinnacle sits on top.
export const WAYSTONES = {
  base: 36, perTier: 2.5, maxTier: 10,
  layout: { rooms: 20, packs: 1, size: [9, 13], magic: .3, rares: 4, sideRooms: 2, boss: 'waystoneGuardian' },
  pinnacle: { tier: 10, boss: 'pinnacle', needs: 'atlas: complete every tier' },
  // Gating: a tier N map drops waystones of N-1..N+1 with these weights, and its boss always drops one N+1.
  drop: { perMap: 1.6, weights: { '-1': 25, '0': 55, '+1': 20 }, bossUp: 1 },
  portals: 6, // deaths allowed per map
};

// The order the progression sim plays the game in: every campaign zone once, then `runsPerTier` maps at each tier,
// then T10 until the level cap. This is the par player; real players will vary.
export const PLAY_ORDER = { runsPerTier: [3, 3, 4, 4, 5, 5, 6, 6, 8, 10], farmTier: 10 };

export const zoneById = id => { for (const a of ACTS) for (const z of a.zones) if (z.id === id) return { ...z, act: a }; return null; };
export const waystoneAL = t => Math.round(WAYSTONES.base + WAYSTONES.perTier * (t - 1));

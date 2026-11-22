# Watt Dungeon: the plan to make it a real game

Status: proposal, November 2026. Nothing here is built yet.

## Where we are

A good-feeling combat core sits inside a very thin game:

- **One map.** A 68 × 68 open crypt floor (`HALF = 34` in `src/world/map.js`) with 18–28 packs dropped at random and a boss in the far corner. Every map looks the same; the only change between tiers is +45% monster HP.
- **No home.** You never leave the dungeon. There's no stash, no vendor, nothing to do between fights.
- **Loot floods and goes flat fast.** 4–10% of kills drop gear, rares are 25% of drops, every slot and base can drop at map 1, and an item's only "level" is a multiplier on its numbers. Within an hour you've seen every kind of item.
- **No choice in skills.** Everyone has Fireball, Arc, Frost Nova and Flame Dash. Passives are "pick 1 of 3" random cards, so a build is luck, not a plan.
- **Nothing to work towards.** No gates, no recipes, no map you're trying to reach, no item you're hunting.

The fun bits to keep: the combat feel (hit-stop, shake, freeze/shatter, chain reactions), rare monster affixes, uniques that change skills, the boss fight, and RIDE mode with autopilot.

## What "a game I'd enjoy" means here

Four pillars. Every feature below has to serve at least one.

1. **A loop with a home.** Town → choose where to go → fight → come home with stuff → spend it → go somewhere harder. One loop takes 10–25 minutes, about one ride interval block or a short session.
2. **Places that feel different.** Each area has its own look, monsters, hazards and boss. You should know where you are from a screenshot.
3. **Slow, readable loot.** Fewer drops, each one worth looking at. Better gear is *gated* by area level, so going somewhere harder is how you get stronger. A few items you hunt on purpose.
4. **A build you planned.** You choose skills, shape them with runes, walk a passive tree towards a keystone you picked, and craft the last few percent.

And one constraint: **it has to stay playable on the bike.** The Zwift Ride gives us a D-pad, four face buttons and two shifters, so four active skills + dash + flask stays the ceiling. Menus must work with D-pad + A/B. Autopilot must still find its way through bigger maps.

## The shape of the game

```
                ┌──────────────── TOWN (Emberford) ────────────────┐
                │ Stash · Smith (crafting) · Trader · Skill shrine │
                │ Waystone altar (maps) · Quest board · Waypoint   │
                └───────────────┬──────────────────────────────────┘
                                │
     CAMPAIGN (levels 1–35)     │            ENDGAME (levels 35+)
  Act 1  The Ashen Crypt  ──────┤        Waystones T1 → T10
  Act 2  The Rotwood      ──────┤        rolled with map mods,
  Act 3  The Hollow Town  ──────┘        across all biomes, with
                                         pinnacle boss at T10
```

### Town: Emberford

A small, safe, hand-built hub (about 30 × 30 m), walkable, lit warm, using the **Medieval Hexagon** and **Resource Bits** packs that are already in the gallery, with Knight / Barbarian / Rogue models as NPCs. Each NPC is also reachable from a town menu so you never have to walk if you don't want to (and on the bike, the D-pad cycles NPCs).

| NPC / object | What it does |
| --- | --- |
| **Stash** | 4 tabs × 48 slots, shared by all characters. Ends the "bag is full" problem. |
| **Smith (Hilde)** | Crafting bench: salvage, rarity upgrades, rerolls, recipes (see Crafting). |
| **Trader (Osk)** | Sells flasks, a few normal bases, identify scrolls; buys junk for gold. Rotates 6 random magic items each time you come home (a gamble on good bases). |
| **Skill shrine** | Equip skills into the 4 slots, socket runes, respec passives (costs currency). |
| **Waypoint** | Travel to any zone you've reached. |
| **Waystone altar** | Opens endgame maps from a waystone item. |
| **Quest board** | The current act's objectives and their rewards. |

You return to town by portal from any zone (a scroll / the portal button), and come back through the same portal to where you left. Dying sends you to town (see Death).

### Campaign: three acts, ten zones each-ish

Each act is 4 zones + a boss arena, a distinct biome, its own monster family, one environmental hazard and one boss. Zone levels climb steadily so area level (AL) is the main gate on loot.

| Act | Biome / assets | Zones (AL) | Monsters | Hazard / twist | Boss |
| --- | --- | --- | --- | --- | --- |
| 1 · The Ashen Crypt | Dungeon Remastered | Crypt Steps (1), Ossuary (3), Flooded Vault (5), Bone Chapel (7), Warden's Hall (9) | Skeletons (today's set) | Dark rooms: braziers you light to see | The Pale Warden (today's boss, retuned) |
| 2 · The Rotwood | Forest Nature + Halloween Bits | Gloomroot Path (11), Bog of Lanterns (14), Witchfen (17), Hanged Grove (20), The Heartwood (22) | Ghouls, bloaters, spiders, wisps | Poison bog patches; cold damage starts to matter | The Rotmother (spawns adds from pods, poison pools) |
| 3 · The Hollow Town | Medieval Hexagon (ruined) + Halloween | Burnt Fields (24), Old Market (27), Bell Tower (30), Catacomb Gate (32), Throne of Ash (35) | Cultists, knights, casters (Adventurers models) | Fire-ridden streets; elemental resists required | The Ashen King (3 phases) |

Monster families are the fast win for "distinct": new behaviours (spider leap, wisp teleports, caster shields allies, knight blocks frontal hits) are additions to `src/game/enemies.js` AI types, with data in `src/data/monsters.js`.

**Quests** are one per zone, light: "light the four braziers", "find the vault key", "kill the bog witch". Each act gives fixed rewards that gate power:

- Passive points (2 per act from quests, on top of levels)
- A new skill unlock per act boss
- A flask upgrade per act
- A crafting recipe per act
- Act 2 and 3 apply a **resistance penalty** (−15% / −30% to all resists) on completion, so resist gear becomes a real need, like PoE's acts.

Campaign target: about 8–10 hours to finish Act 3 at level ~35.

### Endgame: waystones (maps with stats)

After Act 3, waystones drop. A waystone is an item with a **tier (T1–T10)**, a **biome** and **mods**, and you open it at the altar in town.

- Each tier is +3 AL: T1 = AL 36, T10 = AL 63.
- Mods come in prefixes (harder) and suffixes (more reward), rolled like gear, and rarity sets how many: normal 0, magic 1–2, rare 3–5.

  Examples: *Monsters deal 25% extra fire damage* · *Monsters are Hasted* · *Players have 30% less life regeneration* · *Area has 2 extra rare packs* · *Boss drops an additional unique* · *+35% item quantity* · *+20% item rarity*.
- Each mod shows its reward (quantity, rarity, pack size), so harder maps are visibly worth it.
- **Gating**: a waystone of tier N drops waystones of N−1 to N+1 (mostly N), and the map's boss always drops at least one tier N+1. You climb the tiers by clearing bosses, and you can't skip ahead.
- **Atlas** (light version): a screen of 10 tiers × 3 biomes. Completing each once gives a permanent bonus point (more waystone drops, more quantity, unlock T10). Gives a long-term checklist.
- **T10 pinnacle**: a guardian fight that drops the build-defining uniques.

Waystones use the same crafting materials as gear, so crafting has a second use.

## Maps: bigger and clearer

Today's map is an open square with obstacles. The fix is a **rooms-and-corridors generator**, still built from the same instanced KayKit pieces.

- **Layout**: a grid of 4 m cells (the KayKit tile size, scaled by `DUNGEON.scale`). The generator places 8–16 rooms (12–24 m across) on a critical path from entrance to boss, plus 2–5 side rooms off it (treasure, shrine, optional elite). Corridors are 2–3 cells wide. A zone is around 150–250 m end to end, roughly 3–5× today's area but with far less empty space.
- **Readability**:
  - Walls are real walls, so rooms frame the fights.
  - The minimap shows rooms as you discover them (fog of war), and a gold arrow points at the current objective.
  - Each room has one encounter (a pack, an elite, a shrine, a chest), not packs everywhere.
  - Entrance and boss door are visually unique (big archway, banners, braziers).
  - A **checkpoint** halfway through: a waypoint stone you touch, so death and town trips don't send you back to the start.
- **Biome themes** set the pieces, clutter, palette and fog for each act in a data table (`src/data/biomes.js`), so the Rotwood uses trees and roots as walls instead of stone.
- **Hand-placed set pieces**: each boss arena and quest room is a fixed template the generator slots in.
- **Seeds**: every zone has a seed (stored in the save), so it doesn't reshuffle when you reload, and a bug can be reproduced.

Technical notes:
- Colliders become **axis-aligned boxes for walls** plus the existing circles for props; `blocked`, `pushOut` and `los` in `src/world/map.js` grow a box case. Line of sight against walls is what makes rooms feel like rooms.
- Monster packs spawn when you enter a room's radius, not at map load (we already have `spawnRange`). This keeps bigger maps cheap on phones.
- Autopilot (`src/game/autopilot.js`) needs simple pathing: a grid A* on the cell grid, cached per room. Rooms + corridors make this easy.
- The primitive fallback stays: when `dun.ready` is false, walls are grey boxes.

## Loot: slower, gated, worth reading

### Drop rates

Target roughly **10–20 items per zone**, most of them normal or magic, and **one rare every 1–2 zones** from monsters (more from bosses and elites). Rarity rolls follow PoE-like weights: normal 70%, magic 26%, rare 4%, unique from specific sources only. A loot sim script (below) checks these numbers.

### Item level, bases and requirements

- **Item level = area level** of where it dropped.
- **Bases have a drop level and a level requirement.** Each slot gets 3–4 tiers of base, e.g. weapons: Ashwood Staff (1) → Bone Wand (8) → Ember Sceptre (18) → Ironwood Greatstaff (30) → Starforged Staff (45). Better bases have bigger implicits. You only see the next base when you reach the next area band, so a new base dropping is an event.
- **Affix tiers.** Each affix has 5–8 tiers with item-level gates, like *+10–14 life (ilvl 1)* … *+80–89 life (ilvl 60)*. Items show the tier (T1 best), so you can tell a good roll at a glance.
- **More slots, later**: add gloves, belt, a second ring and an offhand (shield / orb). Ten slots is the PoE-ish sweet spot and gives more upgrade targets. Unlock slots during Act 1 so the early game isn't overwhelming.
- **Defences**: add armour, evasion and elemental resists (fire, cold, lightning) as affixes, and monster elemental damage in Acts 2 and 3. Resists are the classic gate that make "do I wear this?" interesting.
- **Uniques get homes.** Each unique has a source: a specific boss, an act, a waystone tier or the pinnacle. The six we have move to Act 1–2 sources; we add ~20 more over the acts and endgame. A "unique collection" page in town tracks what you've found.

### Currency and materials

Drops shift from lots of gear to some gear plus **materials**, which feed crafting:

| Material | Source | Use |
| --- | --- | --- |
| Scrap | Salvaging normal / magic gear | Basic crafts, flask upgrades |
| Kindling | Drops, salvaging magic | Normal → magic |
| Ember Core | Drops, salvaging rares | Magic → rare |
| Shifting Ash | Drops | Reroll all affixes on a magic or rare |
| Tempering Oil | Drops (uncommon) | Reroll the values of an item's affixes |
| Anvil Shard | Rare drops, bosses | Add one affix to an item with room |
| Void Salt | Rare drops | Remove one random affix |
| Gold | Selling, drops | Trader, respec, bench recipe costs |

### Less faff

- **Loot filter** in options: hide normal items below your level, hide magic items after Act 1, always show rares, uniques, waystones and materials.
- **Auto-salvage** toggle by rarity, so on the bike you can just ride.
- **Pick up rules**: materials and gold are vacuumed up; gear needs a click / walk-over as now.

## Crafting

All at the Smith in town. Two layers:

1. **Material crafting** (the table above): random, cheap, always available. Takes items from "almost" to "good".
2. **Bench recipes**: deterministic, expensive, *unlocked by finding them*. A recipe adds a specific mod into a free affix slot, e.g. *"+1 Fireball projectile (weapon)"*, *"+25% cold resistance"*, *"Arc chains +1 time"*. Recipes drop from act bosses, quest rewards, waystone bosses and side rooms. Each one is a little gate: you're hunting the "+1 projectile" recipe that finishes your build.

Rules that keep it from being trivial:
- An item can carry only **one bench mod**.
- Costs scale with item level.
- **Corruption** (late, optional): a one-shot gamble that can add a powerful implicit, reroll into a rare, or brick the item. Endgame chase.

Crafting must work with D-pad + A/B on the bike: the bench UI is a list (item → action → confirm), not drag-and-drop.

## Character progression

### Levels

- Level cap 60. Rebalance `xpNeed` (`src/game/stats.js`) so level ~10 lands at the end of Act 1 (≈2 hours), ~35 at the end of Act 3, and 50–60 is the long endgame tail.
- Monsters more than 5 levels below you give reduced XP, so you push forward instead of farming Act 1.
- **Death in maps** costs 5% of the current level's XP (never de-levels). In the campaign, no XP loss.

### Skills

- Start with Fireball and Flame Dash. Unlock about 10 more over the campaign: Arc, Frost Nova, Ice Spear, Firewall, Ball Lightning, Raise Skeleton (minion build), Blade Vortex, Frost Shield, Meteor (slow, huge), Storm Brand.
- **Four active slots + Dash + Flask**: fits the Ride's buttons exactly. You choose which four.
- **Skill levels** go up by using the skill (like Diablo 2 / Grim Dawn use-XP, simple), capped by character level.
- **Runes** (support gems, simplified): each skill has 2 rune slots that open at skill level 5 and 15. Runes drop as items and change the skill: *Multiple Projectiles*, *Pierce*, *Added Cold*, *Faster Casting*, *Echo* (cast twice), *Concentrated Effect* (smaller, harder), *Spell Totem* (great on the bike: a totem casts while you ride). This is the main build-crafting layer and the bit that makes uniques and recipes combine in interesting ways.

### Passive tree

Replace "pick 1 of 3" with a **small authored tree**: about 80 nodes in three wings (Fire / Cold / Lightning) around a centre of life, mana and defence, with notables (the existing Twin Flame, Shatter, Conduit…) and 4–5 keystones on the outer ring (Blood Magic, plus e.g. *Elemental Overload*, *Minion Master*, *Iron Will*, *Glass Cannon*). You get 1 point per level + quest points.

- Drawn as a pannable canvas; on phone, pinch-zoom; on the bike, D-pad walks between connected nodes.
- Respec: refund one node for gold, or the whole tree for an Ember Core at the shrine.
- Existing passive data in `src/data/passives.js` becomes node data with positions and links.

### A second class (later)

Once one class is deep, add a melee class (Knight or Barbarian model, already in the gallery) with its own tree start and skills. Deliberately after Phase 6, not before.

## Death

- Campaign: respawn at the last checkpoint with full life; packs you cleared stay cleared, the boss resets.
- Waystones: 6 portals per map (lives). Run out and the map closes, loot on the ground is lost.
- Hardcore toggle (one life) for later.

## RIDE mode and bike fit

Nothing here should break RIDE mode, and some features are built for it:
- Four skill slots map to A / B / Z / Y-hold; dash and flask stay on the shifters.
- Autopilot gets real pathing through rooms and to the objective arrow, and can be told "clear room" vs "head to boss".
- Town and menus are fully D-pad navigable.
- Later, effort-based features: effort shrines (hold 110% FTP for 20 s for a buff), sprint events ("outrun the collapse"), and waystone mods like *"Monsters gain damage while your cadence is below 70"*. These go into `src/data/ride.js` and read `ctl.effort`, so they work with the simulated Ride today.

## Technical groundwork

Things the current code needs before the features above land:

1. **Game states.** `G` grows a `scene` field (`'town' | 'zone' | 'map'`) and an `area` object `{ id, al, seed, biome, mods }` replacing `G.tier`. `src/game/maps.js` becomes `src/game/areas.js`, with `enterTown()`, `enterZone(id)`, `openWaystone(item)`.
2. **Seeded RNG.** `src/core/util.js` gets a seedable generator (mulberry32) used by map generation and drops, so layouts are stable and the tests can be deterministic.
3. **Save v2.** New key `wd-arpg-2` with a version field and a migration from `wd-arpg-1` (keep level, convert gear to new bases at their nearest tier, passives refunded as points). Saves: character(s), stash, materials, gold, recipes, quests, atlas, waypoints, current area seed.
4. **Data tables.** New files in `src/data/`: `areas.js` (acts, zones, AL, biome, monster mix, quest), `biomes.js` (pieces, clutter, fog, palette), `bases.js`, `affixes.js` (tiers), `currency.js`, `recipes.js`, `runes.js`, `tree.js`, `waystones.js`.
5. **Loot sim.** `scripts/loot-sim.mjs` runs the drop code in Node (no rendering) for 1,000 zones at each AL and prints items, rarities, materials and uniques per zone, so drop rates are tuned with numbers, not guesses. Also a fast check in `npm test`.
6. **Headless tests** in `tests/sim.mjs` extended per phase: walk into town, open the stash, travel by waypoint, clear a generated zone with autopilot, craft an item, open a waystone.

## Roadmap

Each phase is one or a few PRs, each shippable and playable on its own, each checked with `npm run build && npm test` and screenshots.

| Phase | What ships | You'll notice |
| --- | --- | --- |
| **0. Groundwork** | Game states, area object, seeded RNG, save v2 + migration, data tables stubbed, loot sim | Nothing visible; saves survive the move |
| **1. Town** | Emberford hub, stash, trader, portal to/from the dungeon, waypoint, town menu | A home between runs; no more full bag |
| **2. Real maps** | Rooms-and-corridors generator, box colliders, LOS on walls, fog-of-war minimap, objective arrow, checkpoints, room-based spawning, autopilot pathing | Bigger, clearer maps that feel like places |
| **3. Loot rework** | Item level, tiered bases with requirements, affix tiers, resists/armour, new slots, slower drops, materials, salvage, loot filter | Drops become rare and exciting; gear gated by area |
| **4. Crafting** | Smith with material crafts, bench recipes (first 6), recipe drops | Something to do with all that salvage |
| **5. Build depth** | Skill unlocks + 4 slots, skill levels, runes, passive tree, respec | Your build, planned |
| **6. Campaign** | Act 1 rebuilt as 4 zones + Warden; Act 2 Rotwood; Act 3 Hollow Town; quests; new monster families and bosses; resist penalties | Distinct areas, a story arc, 8–10 hours of progression |
| **7. Endgame** | Waystones with mods, tier gating, map device, atlas bonuses, T10 pinnacle, endgame uniques | A long-term chase |
| **8. Polish & bike** | Balance pass with loot sim, second class, effort shrines and ride mods, then Bluetooth Ride + KICKR | It plays on the bike |

Suggested order is as listed. Phases 1 and 2 are where it stops feeling "super basic", and 3 is the biggest change to how it feels to play. If you want something playable sooner, a **vertical slice** of 0–4 using only Act 1 (town + 4 crypt zones + reworked loot + crafting) is a good first target before building Acts 2 and 3.

## Decisions for you

1. **Session length**: is 10–25 minutes per zone/map loop right for how you'd play, on and off the bike?
2. **Identify step**: should rares drop unidentified (identify in town, a nice ritual) or show mods straight away (simpler)?
3. **Death penalty in maps**: XP loss + limited portals, or keep it gentle?
4. **Skill runes vs. sockets in gear**: runes on skills (simpler, proposed) or PoE-style sockets in gear (deeper, more inventory faff)?
5. **Second class**: wait until after the campaign (proposed), or earlier?
6. **Names**: Emberford, Rotwood, Hollow Town, materials are placeholders. Change anything you like.

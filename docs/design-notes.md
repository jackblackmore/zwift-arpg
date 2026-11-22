# Watt Dungeon: progression design notes

A running record of the progression brainstorm. **Nothing here is locked.** "Leaning" means we like it but haven't committed; "Open" is still being discussed; "Parked" is for later.

Two ideas sit underneath everything:
- **Easy rides build your character; boss rides test it.** Progress is about stats and clears, never about collecting tokens to open things.
- **No ride is wasted.** If you die, quit early or fail a boss, you keep the XP, gear and other rewards you earned.

---

## Character

- **Leaning:** one main character, with room to add more later. If we add classes, do it the Path of Exile way: a different starting point on the same passive tree, with a different KayKit model.
- **Leaning:** three growth systems, each with its own job and no overlap:

| System | Fed by | Answers | Owns |
|---|---|---|---|
| Passive tree | XP (a point per level) | "What kind of hero am I?" | Broad stats (fire damage, life, cast speed) and rule-changing keystones. Never changes a specific skill |
| Gems (Materia-style) | AP from riding | "How do my buttons play?" | Behaviour of their own skill only. Never general stats |
| Gear | Drops, crafting, boss uniques | "How strong am I, and what rules do I break?" | Stat affixes; uniques that bend rules |

- **Why it fits the loop:** character level is the main measure of being ready for deeper levels (par levels); AP means every easy ride grows something even without a drop; gear makes beats and bosses exciting; free gem swaps and cheap respecs give one character PoE-style flexibility; few bike buttons means depth comes from supports, not more skills.
- **Leaning: passive tree.** Small and readable on a phone (~60–80 nodes): fire, cold and lightning regions around a core of defence and utility, 3–4 keystones (Blood Magic moves here). Cheap respecs.
- **Leaning: soft level cap.** Past a point, levels get slower rather than stopping.
- **Leaning: gems.** 4 skill slots plus dash. Each slot starts with 1 support socket and unlocks up to 3 with level. Sockets live on the **skill bar**, not gear (a rare gear affix could add "+1 support socket").
  - Equipped gems earn full AP; **unequipped gems earn a small trickle**.
  - Gems level into new behaviour, not just numbers (Fireball lv5 splits, lv10 leaves burning ground; Freeze support at max adds Shatter).
  - The current pick-1-of-3 level-up draft is retired; its notables become support gems (Twin Flame, Shatter, Conduit).
- **Leaning: gem tiers.** The same gem comes in better tiers (Fireball I, II, III), each with higher base power, a higher level cap and a new top milestone. Behaviour carries forward, so a build keeps working.
  - **Tiers come mostly from regions** (Tier II from the Forest onward), with **rare jackpot drops** of a higher tier anywhere. Heat could raise those odds.
- **Leaning: fusing.** Fuse a gem into a better tier of the same gem for a head start (e.g. mastered Fireball I makes Fireball II start at level 6 of 20). Never a full transfer, so there's always room to grow.
  - **Rule: an upgrade never feels like a downgrade.** A fused gem is always at least as strong as the gem put in.
  - Any gem can be fused for some AP; mastered gems give a bonus. Duplicate drops become fuel. Support gems work the same way.
- **Open:** whether fusion replaces the FF7 "mastered gem spawns a copy" idea (leaning yes, to keep one clear ending for a mastered gem).

### Gem model in detail (leaning)

Terms:

| Term | Meaning |
|---|---|
| Skill | An action on a button (Fireball, Raise Skeletons, Blink) |
| Skill gem | An item that gives a skill. **The only way to get a skill.** Has a tier, level and AP |
| Support gem | Modifies the skill it is socketed with (Split: fires three) |
| Skill bar | 5 slots: Main, Flex A, Flex B, Guard, Evade |
| Socket | A space on a slot for a support gem |
| Main gem | The skill gem in the Main slot (a special slot, not a special item) |
| Gem bag | All gems you own; unlimited; separate from the item bag |
| AP | Points gems earn from riding; level gems up |
| Gem level / milestone | 1 to the tier cap; milestone levels change how the skill works |
| Tier | I, II, III: better versions of the same gem |
| Character level | From XP; 1 tree point per level |
| Keystone | Rare tree node that changes rules, sometimes slot types |

Skill bar:

| Slot | Accepts | Unlocks | Max sockets |
|---|---|---|---|
| Main | Any attack skill gem | Level 1 | 4 (1 at L1, 2 at L15, 3 at L30, 4 at L45) |
| Flex A | Any attack or support skill gem | Level 5 | 2 (1 on unlock, 2 at L25) |
| Flex B | Any attack or support skill gem | Level 12 | 2 (1 on unlock, 2 at L25) |
| Guard | Guard skill gems (shields, wards, decoys) | Level 1 | 1 |
| Evade | Evade gems (Blink, Phase, Smoke, Decoy Swap, Flame Dash) | Level 8 | 1 |

- Main is "main" because it has the most sockets and is always on the primary button; nothing else.
- Gems can be moved between any slots that accept them at any time outside a Trial.

Where skill gems come from (they drop as loot):
- **Shrines: four, once per character, only in the first world (Crypt).** Ride 1: choose 1 of 3 Main gems (Fireball, Frost Lance, Raise Skeletons) plus Magic Shield. Level 5: Flex A. Level 8: Evade. Level 12: Flex B. Each is 1 of 3 options for that slot and appears at the entrance of the next level so it can't be missed.
- **Shrine gems for Flex slots start at Main gem level − 2** (only shrine gems).
- Guardians: 1 guaranteed gem (skill or support) from the region pool.
- Trial bosses: their own signature gems.
- Random drops from beats and elites (heat raises the chance).

Levelling:
- Equipped gems earn full AP (kills and time riding); unequipped gems earn 10%.
- Tier caps: I = 10, II = 20, III = 30. Example milestones: Fireball I lv5 pierces, lv10 leaves burning ground; Fireball II lv15 explodes twice, lv20 explosions split.
- **Feeding:** any gem can be consumed to give its AP to another gem:

| Fed into | AP transferred |
|---|---|
| Same gem (duplicate or lower tier) | 100%, plus mastery bonus if mastered |
| Same type (attack→attack, support→support) | 50% |
| Different type | 25% |

- **You never lose a skill.** Feeding spends a gem's AP and levels, not the skill: if it's your last copy, a level 1 copy of the same tier stays in the gem bag. Duplicates can be fed in completely. Fusing works the same way (mastered Fireball I fused into Fireball II leaves Fireball I at level 1).
- No exploit: feeding moves AP, it never creates it, and the copy left behind starts from zero.
- The gem bag becomes a permanent library of every skill found, so experimenting with builds is risk-free; only levels are spent.
- Tune spare-gem drop rates so feeding is a boost, not a shortcut.

Who does what (damage = (gem base + flat from gear) × (1 + increased) × each more × crit):

| | Main job | Growth through one region (illustrative) |
|---|---|---|
| Gems | Base damage and skill behaviour (kill speed) | Base ×3 (Fireball I: 10 at lv1, 30 at lv10) |
| Tree | Multipliers, survival, identity | ~13 points: ~+60% to your element, plus life |
| Gear | Flat and % damage; all defence | ~×1.5 damage, plus armour and resistances |

Example: Pyromancer through the Crypt (illustrative numbers):

| Ride | Level | Char lvl | Unlocks | Skill bar | Notes |
|---|---|---|---|---|---|
| 1 | Crypt 1 | 1→4 | Main, Guard | Fireball I lv1→3, Magic Shield I | Choose Fireball. Guardian drops Split |
| 2 | Crypt 2 | 4→7 | Flex A | Fireball lv5 (pierces), Flame Totem I | Shrine: Totem over Frost Nova/Arc |
| 3 | Crypt 3 | 7→10 | Evade | Fireball lv7, Totem, Shield, Blink I | First armour boots |
| 4 | Crypt 4 | 10→12 | Flex B | Fireball lv9, Totem, Ward, Meteor I | First rare wand; Frost Lance I to the gem bag |
| 5 | Crypt 5 | 12→14 | n/a | Fireball lv10 (mastered: burning ground) | Fire resistance chest |
| 6 | Ashen King | 14 | n/a | Same | Win: Forest, Wattbringer, modifier hand unlocks |
| 7+ | Forest 1 | 14→17 | Main socket 2 | Fireball II (fused, starts lv6) | Crafting unlocks |

- **Open:** whether random gem drops still feel exciting enough; the numbers above are untuned and the proportions are what matter.

### Evade gems

| Evade | Effect | Suits |
|---|---|---|
| Blink | Teleport away from the nearest threat | All-rounders |
| Phase | Briefly intangible; attacks pass through | Melee, close range |
| Smoke | Invisible; enemies lose track of you | Snipers, Glass Cannon |
| Decoy Swap | Leave a decoy that draws aggro | Minions, turrets |

### Stats

- **Today** (`src/game/formulas.js`, tuning in `src/data/balance.js`): one flat pool. Level gives base life, mana and spell damage; gear and passives all add into it; skill behaviour (projectiles, chains, pierce) sits in the same pool; defence is just life plus a little damage reduction; no attributes.
- **Leaning:** one stat sheet fed by the three systems, each owning different parts:

| | Gems | Passive tree | Gear |
|---|---|---|---|
| Damage | Base damage (gem tier and level) | % increases | Flat spell power + % affixes |
| Behaviour | All skill-specific behaviour | Rule-changing keystones | Rule-changing uniques |
| Survival | n/a | % life, regen, defensive keystones | Most defence: armour, resistances, flat life |
| Character level | n/a | One point per level | n/a |

- **Damage comes from the gem, not character level.** Being behind on gems means slow kills (longer clears); being behind on level or gear means more deaths.
- **Leaning: "increased" vs "more"** (PoE). `damage = (gem base + flat from gear) × (1 + sum of increased) × each more multiplier × crit`. "Increased" adds together (tree, affixes; common). "More" multiplies (keystones, gem milestones, uniques; rare). Controls power creep.
- **Leaning: no attributes** (Strength/Dex/Int) for now. Revisit if classes arrive.
- **Leaning: defence.** Life + armour (reduces hits) + elemental resistances, mostly from gear. Each region's enemies lean toward an element, so resistances matter and gear changes by region.

### Skill variety

- **Problem:** three skills that differ only by element get boring fast.
- **How others solve it:** D3 runes transform skills; Last Epoch per-skill trees; PoE hundreds of skills plus supports and triggers; D4 aspects rewrite skills; Hades god boons twist the same attacks; Vampire Survivors evolutions. Variety comes from **how a skill delivers damage, not its element**.
- **Leaning: slot layout.**

| Slot | Holds |
|---|---|
| Main skill | The skill your build revolves around; deepest gem investment and most transforms. Always the same button |
| 2 flexible slots | Any attack or support skill |
| 1 defensive slot | Guard, shield, ward, decoy |
| Evade | Non-aimed: jumps away from the nearest threat. Works on every device |

- **Leaning: rare keystones change slot types**, each with a real cost (you give up coverage to specialise):

| Keystone | Slot change | Cost |
|---|---|---|
| Legion | A flexible slot becomes a second support slot; minions stronger | Less personal damage |
| Glass Cannon | The defensive slot becomes an attack slot; big damage bonus | Much less life, no guard skill |
| Summoner's Pact | The main slot can hold a minion skill | You barely attack yourself |
| Fortress | A flexible slot becomes a second defensive slot | Slower kills |

- **Leaning: variety comes from mechanics, not element or shape.** Pull, traps, marks, corpses, turrets, clones, charge-ups. Each named skill has its own element (Fireball is fire) and the element adds flavour (burn, freeze, shock). Element conversion is a rare jackpot (uniques or rare supports), not a setup step.
- **Test for any new skill or keystone:** does a build using it play differently? Example builds that pass:

| Build | Main | Flexible | Defence | Keystone | Feels like |
|---|---|---|---|---|---|
| Pyromancer | Fireball (pierce, burning ground) | Meteor, Flame Totem | Fire ward | n/a | Aim and fire, things burn |
| Necromancer | Raise Skeletons | Corpse Explosion, Bone Armour | Decoy | Summoner's Pact | Army fights, blow up the bodies |
| Frost Sniper | Frost Lance (huge single hits) | Mark Target, Ice Trap | n/a | Glass Cannon | Pick targets, one-shot, fragile |
| Engineer | Lightning Turret | Second turret, Pull | Shield | Legion | Set up, pull enemies into the kill zone |

- **Bike angle:** minion, totem and aura builds are nearly hands-free (easy rides, tired days); hold-to-channel skills fit the Ride's hold buttons. Free gem swaps let you change style per ride.
- **Parked:** "Surge", a bike-only evade from a short effort spike. Depends on the bike link, and must not push sprinting on recovery days. Mouse and touch could keep an aimed dash as a bonus.
- **Dropped:** strict role slots (target / chain / area): chain and area did the same job, and Diablo 3 players switched strict slots off. Also dropped: a 3×3 grid of the same skills in three elements, which recreates the "fire, ice, lightning" boredom.
- **Dropped:** dash as a core skill on the bike (aiming is awkward, and pedalling already sets movement).

## Game outline

- **Leaning:** **6 regions × 5 levels + a Trial** = 36 sessions, about 18 hours at par. Character level runs from 1 to about 54 (soft cap after). One region per workout boss, so the whole game covers every workout type once.
- The Crypt is planned in detail below; later regions only need a theme, new enemy types and a boss until we build them. Each region adds about 2 new enemy types and 5 guardians and reskins the earlier types.
- In code, a map's **tier** is its place in this list (Crypt 1–5 are tiers 1–5, Forest 1 is tier 6, and so on). Par levels per tier live in `src/data/balance.js`.

| # | Region | Par level | New enemy types | Element lean | Trial boss (workout) |
|---|---|---|---|---|---|
| 1 | Crypt | 1 → 14 | Skeleton warriors, runners, archers, bloaters; then necromancer, bone knight | Physical, poison | The Ashen King (sweet spot: waves of adds) |
| 2 | Forest | 14 → 22 | Wolf packs (fast), treants (slow tanks), spore shamans | Poison | The Swarm Queen (sprints) |
| 3 | Mines | 22 → 30 | Goblin bombers, rock golems, burrowers | Fire | The Juggernaut (VO2 max) |
| 4 | Frozen Keep | 30 → 38 | Shield knights (block from the front), crossbow lines, frost mages | Cold | The Warden (threshold) |
| 5 | Storm Spire | 38 → 46 | Elementals, blinking casters | Lightning | The Storm Witch (over-unders) |
| 6 | The Abyss | 46 → 54 | Corrupted versions of everything | All | The Endless One (ramp) |

Region themes and boss pairings are **open**; the shape (6 × 5 + Trial) is leaning.

### The Crypt in detail

| Level | Tier | Par level | New this level | Pack size | Guardian |
|---|---|---|---|---|---|
| 1 Crypt Halls | 1 | 1 | Skeleton warriors, runners | 3–5 | Skeleton knight |
| 2 Ossuary | 2 | 4 | Archers | 4–6 | Bone archer captain |
| 3 Flooded Tombs | 3 | 7 | Bloaters, poison pools | 5–7 | Plague bloat (bursts into bloaters) |
| 4 Bone Gardens | 4 | 10 | Necromancer (raises the dead; kill order matters) | 5–8 | High necromancer |
| 5 Throne Approach | 5 | 12 | Bone knights (shield), more rares | 6–8 | The King's lieutenant |
| Trial | – | 14 | | | The Ashen King |

- **Today:** we have warriors (zombie), runners, archers, bloaters and one boss (the Pale Warden) that guards every map. Missing for the Crypt: necromancer, bone knight and 4 guardians.

## Balance

- **Leaning: underpowered early, loot makes the difference.** Character level adds a little damage and mostly life; gear adds most damage. A new hero has a plain starter staff and needs 4–5 Fireballs per skeleton. A full kit of magic gear roughly doubles to triples damage.
- **Leaning: sawtooth power curve.** Inside a level you outgrow the monsters as drops come in; the next level steps monster life up again. The biggest step is Crypt 1 → 2, because that's when the starter staff is expected to be gone.
- Skills cost more and cast slower than before, and mana runs out: Fireball can be held at a bit over half its full cast rate. Frost Nova has a 6 s cooldown.
- **Leaning: you start with a generic Magic Shield, not a movement skill.** It absorbs 35% of max life for 5 s on a 10 s cooldown, and fits every build (Flame Dash leaned too far toward a fire build). Movement skills come later through the Evade slot (level 8 shrine). Built as a plain skill today; it becomes the first Guard gem in gems v1.
- **Targets** (at par level with par gear; exact numbers in `src/data/balance.js`):

| Thing | Target |
|---|---|
| Normal skeleton | 3–5 Fireball hits |
| Normal pack | 4–15 s to clear |
| Rare | 8–25 s of single-target fire |
| Guardian | 45–100 s; an under-geared hero can't burn it down |
| Danger | A pack in melee kills you in 4–14 s if you stand still |
| Mana | Fireball sustains 40–75% of its full cast rate |
| Loot | A full magic kit is ×1.3–3 the starter staff's damage |

### Testing balance without playing a level

Three layers, fastest first. Levels are the final polish pass, not the only check.

1. **`npm run balance`** (instant, no browser): maths from the game's own data and formulas (`src/game/formulas.js`). For each tier at par level and with each gear profile (starter staff, average magic kit, average rare kit) it prints hits to kill, mana uptime, pack clear time, rare and guardian kill time, how long you survive standing in a pack, XP per map and the gain from loot. Anything outside the targets is flagged. Fireball only, so it's a floor on real kill speed.
2. **`npm run arena`** (about 30 s, needs `npm run build`): real game code fights one encounter at a time (packs, magic, rare, guardian, under-geared, under-levelled) with a scripted player. A kiting bot plays well; "standing still" rows play carelessly; real play sits between them. Shows clear time, damage taken, lowest life, flasks used and time spent out of mana. In the browser: `__dbg.arena({ tier: 2, fight: [['zombie', 4]], gear: 'magic' })`.
3. **`npm test`** includes balance guard rails: a tier 1 pack isn't one-shot, the tier 1 guardian can't be burned down, and the starter staff can't beat the tier 2 guardian. These catch regressions on every push.

Loop: change numbers in `src/data/` → `npm run balance` → `npm run arena` → play a level to feel it.

- **First pass results (Nov 2026):** every par number is inside target. Known gaps: melee packs barely touch a kiting player (knockback from Fireball plus slow skeletons), so the danger comes from archers, magic packs and rares; XP runs slightly behind par (fine while maps are small); maps are still one open square, so levels are quick and you can still run straight to the guardian. Next: finish the character systems (gems, skills, tree, defence, gear) and balance them together; level layout comes after (see `docs/build-order.md`).

## Regions and levels

- **Leaning:** the world is a set of regions (the Crypt first, then the Forest, and so on). Each region has **4–5 dungeon levels**, then a **Trial boss**.
- **Leaning:** each level takes **about 30 minutes at the right character level**, about 45 slightly under-levelled and about 20 over-levelled.
  - Clear time comes from kill speed (your stats against monster HP) and movement. Measure "par" at endurance pace, because RIDE movement depends on effort.
  - Tune each level with a par character level, monster HP and pack count.
- **Leaning:** levels are **rerolled every visit** (procedural layout and contents).
- **Leaning:** a **waypoint** at your furthest cleared level, so you never repeat levels you've cleared. Quitting part-way loses only that level's clear; everything earned is kept.
- **Leaning:** every level ends with a **guardian** (mini-boss). Killing it clears the level.
- **Leaning:** levels get harder on the way down and each one is distinct. Example for the Crypt:
  1. Crypt Halls: open rooms, zombies and runners. Guardian: skeleton knight.
  2. Ossuary: narrow corridors, archers arrive.
  3. Flooded Tombs: bloaters, poison pools.
  4. Bone Gardens: a necromancer that revives the dead, so kill order matters.
  5. Throne Approach: heavy on elites, tests everything. Guardian: the boss's lieutenant.
- **Leaning:** **one familiar pattern** for every region, reskinned per location (monsters, hazards, beat flavour). A new region then needs new content, not new systems.
- **Open:** whether rerolls change only the layout, or also a level's rule and hazards.

### Room-and-corridor levels (built, step 8)

- **Generator** (`src/world/gen.js`, pure, seedable with an rng; tuning in `GEN`, `src/data/dungeon.js`): the level is a 4 × 4 grid of zones, each 11 × 11 cells, one cell = one 3.2-unit floor tile (the map is about 141 units across, `HALF` 70.4). A random self-avoiding route of 9–13 zones runs from the entrance (bottom-left) to the guardian arena (top-right); each zone on it gets a room, then 4–6 dead-end side rooms hang off any free neighbouring zone. Rooms are 4–7 cells square-ish (start 4–5, guardian arena 7), a third of the bigger ones lose a corner block (L shapes). Corridors are 2 cells wide and Z-shaped, laid through the gap between two zones, so a room is always one wall thick away from its corridor except at the doorway. Over 200 seeds: route walk 53–104 s at base speed (285–560 units), shortest start-to-guardian walk at least 40 s, 13–16 rooms, every floor cell reachable.
- **Layout object:** `{ n, cell, half, grid, rooms, route, edges, path, routeLen, start, boss }` (see the header of `gen.js`). `G.layout` holds the live one (null in the balance arena, which is open floor). Rooms and corridor edges carry a `rank` (route order; side rooms are their parent + .5) which packs inherit.
- **Walls are a grid** (`pushOut`, `blocked`, `los` in `src/world/map.js`): circle-vs-cell pushes (so you slide along walls), blocked checks and a sampled ray for line of sight. Props keep their circle colliders. Cells outside the grid count as wall, and the outer ring is always wall.
- **Path finding:** monsters and the autopilot call `steer`, which asks `pathStep` first. If a straight walk (the body's radius) is clear it does nothing. Otherwise it follows a cached breadth-first distance field to the target cell and heads for the furthest cell on the way that can be walked to directly. Fields are cached per target cell (six at most), so a room of monsters chasing the hero costs one search per cell the hero crosses.
- **Dressing** (`src/world/dungeon.js`): one floor tile per floor cell, KayKit walls on north, west and east edges, a low barrier on south edges (so a wall never hides the hero from the camera), pillars at corners, torches every few segments (capped), props per room by floor area (`OBSTACLE_DENSITY`), at most one brazier in a small room and two in a big one, a chest in each side room, the guardian's ring of posts inside its arena. Props keep 2.4 units clear of the corridor centre lines, so doorways and corridors never jam. With `dun.ready === false` the same layout is built from instanced boxes (low on south edges) and rocks, on the plain ground plane.
- **Packs:** one in each ordinary room first, then at chokepoints (corridor midpoints, about a sixth of the pack count), then extra packs in the biggest rooms, never within 13 units of the entrance or 9 of the guardian. Spawn positions fall back to the pack's own (clear) spot, so nothing spawns in a wall. Aggro dropped from 11.5 to 9 and now needs line of sight beyond 3.5 units (`PACK.aggro`, `PACK.aggroNear`), so a room wakes when you walk in, not through the wall.
- **Minimap:** dark until explored. Cells within 15 units and in line of sight are painted onto `G.mmBase` as you move; packs, monsters, the guardian marker and loot only show on seen cells.
- **Autopilot:** engages monsters it can see or that are awake, then loot, then the lowest-`rank` uncleared pack (so room to room along the route, side rooms as detours), then the guardian. Walking there goes through `steer`, so it takes corners.
- **Decisions:** (1) Map grew from 68 to 141 units across; the enemy spatial hash offset went from 60 to 80 to cover it. (2) The walls are full cells for collision; the KayKit wall pieces sit on the edge of the floor cell, so the 3.2-unit-deep rock behind them is just dark. (3) The 20–30 minute target is not reached by walking: the route is about a minute to a minute and a half. The rest is fighting, so level length is now a pack count, monster HP and (later) beats question, to tune in step 7's balance pass. (4) Side rooms have no special content yet (just a chest and a few extra props); that belongs to the beats work.

### Beats (pacing inside a level)

A beat is a moment where something changes. Levels follow an interest curve: waves of intensity, with each peak higher than the last, ending on the guardian. Normal packs keep a baseline between beats.

Every beat has four parts: a **signal** (you see or hear it coming), a **challenge**, a **payoff** (clearly better than normal packs) and a **release** (a quiet stretch to loot and breathe).

Beat types:

| Type | What it is |
|---|---|
| Elite | A named rare monster with affixes, plus minions |
| Ambush | The room seals and waves spawn |
| Survival | Hold a spot or protect an object for 60–90 seconds |
| Treasure | A loot goblin, a locked vault, a trapped chest |
| Gamble | A shrine or altar: a buff, or a risk for better loot |
| Breather | A safe room: fountain, merchant, lore |
| Guardian | The level's mini-boss; always last |

Template for a 30-minute level. Rerolls change the layout and which beat fills each slot; the rhythm stays the same:

| Time | Beat |
|---|---|
| 0–5 min | Warm up, normal packs |
| ~6 | Small beat (treasure or gamble) |
| ~11 | Medium beat (elite or ambush) |
| ~15 | Breather |
| ~19 | Medium beat (a different type) |
| ~24 | Big beat (survival or double elite) |
| ~27 | Release |
| ~28–30 | Guardian |

Region skins, for example: an ambush is coffins bursting open in the Crypt and trees coming alive in the Forest. A gamble is a blood altar in the Crypt and a mushroom circle in the Forest.

Ideas: deeper levels use more intense versions of the template; beats could be where the best loot comes from, with normal packs mainly giving XP and AP.

## Modifiers (heat)

- **Leaning:** an optional **modifier hand** before each level. You're dealt 5–6 random modifier cards and choose as many as you want (none for a plain clear). Possibly one reroll of the hand per level.
- Each modifier is worth some **heat**. Higher heat means better quantity and rarity of loot, more AP and XP, and **heat thresholds that unlock special encounters** (rare beats, hidden guardians with unique drops).
- Modifier types: monster (hasted, extra damage, extra elite affixes), density, beats (extra beat slot, paired elites), hazards, player (fewer flasks, less regen), guardian (extra phase, adds).
- Traps to avoid:
  - "More HP" modifiers that only make levels longer. Add danger and events, not duration.
  - Gotcha modifiers that are no fun to play (PoE's reflect, no regen).
  - One obviously best combination.
  - Plain clears that feel bad: heat is a bonus, never required.
- Ideas: unlock new modifiers as you progress; record your best heat cleared per level; a "take everything up to X heat" button. Presets don't fit rolled hands.
- **Open:** whether high heat on levels affects that region's Trial.

## Trials (boss runs)

- **Leaning:** a Trial is a **structured workout**, and the boss fight follows the workout script. During intervals the boss is exposed or staggered; during recoveries it attacks and you survive.
- **Leaning:** targets are a **% of FTP**, not raw watts. Riding well adds damage and missing them makes the fight harder (see layer 2).
- **Leaning:** **killing the boss before the workout ends unlocks the next region**. Three deaths fail the Trial (see layer 2). If you fail, you keep your loot and retry another day. Whether you can win depends on your stats and build, and on riding the targets well enough to avoid the penalties.
- A grade (time in zone, deaths, phases broken on time) decides loot quality.
- **Leaning:** **bosses are tied to workout types**, and the rhythm of the fight matches the rhythm of the workout:

| Workout | Boss idea | Fight |
|---|---|---|
| VO2 max (5 × 3–4 min, 110–120%) | The Juggernaut | Staggered during intervals, rampages during recovery |
| Threshold (3 × 10 min, 95–100%) | The Warden | Each interval breaks a layer of armour |
| Sweet spot (2 × 20 min, 88–93%) | The Lich | Waves of adds while you wear down his phylactery |
| Over-unders | The Storm Witch | Her shield flips element between the over and under |
| Sprints (10 × 20 s) | The Swarm Queen | Each sprint wipes the swarm; it rebuilds during recovery |
| Ramp | The Endless One | Gets stronger every minute; your effort races his |

- Intervals, arena and adds are rolled within each workout type's sound ranges (procedural, but valid training).
- **Leaning:** beaten Trials can be **replayed with fight modifiers** (earlier enrage, new attacks, extra adds, stronger wards). Rewards: better odds on the boss's unique drops, empowered boss variants with their own drops at high heat, best heat per boss.
- **Open:** one boss per region (one workout type each), or several per region so you pick what to train.
- **Open:** each boss has its own modifier pool, or all bosses share one.
- **Open:** level guardians as short previews of the boss's workout type.
- **Open:** ERG mode. The trainer holds the target power, so the workout is always right but there's little to score except cadence. One idea: score time in zone and support both ERG and resistance mode.

## Loot and crafting

- **Open:** affixes that change how you play rather than plain +x%; uniques that define builds (as now); target farming via boss-specific unique drops.
- **Open:** Last Epoch-style deterministic crafting (forging potential) using materials from levels.
- **Open:** auto-salvage or a loot filter, since nobody manages a bag on a bike.

## Linking the bike to progression

### Layer 1: movement and normal mode (leaning)

- **Movement: the game drives, you decide (Zwift-style).** The autopilot follows the route through the level toward the next beat and the guardian, fights, loots and keeps your build's preferred range (from the main skill: snipers hang back, melee and Phase builds close in). At junctions the D-pad picks a direction; holding it nudges the character manually. On keyboard and touch, manual control is the default and autopilot is optional.
  - Autopilot needs route awareness (beats, junctions, guardian), not just "nearest thing", and per-build range instead of fixed `keep`/`kite` in `src/data/ride.js`.
- **Pedalling is a gate for movement, not a speed dial.** Above ~30–40% FTP you move at a fixed speed; below, a slow walk; at 0 W you stop. (Change from today, where speed keeps rising to 125% at 125% FTP.)
- **The main skill auto-attacks.** It picks the most important nearby target (elites first, then nearest). The same on every device; manual aim could be an option.
- **Power drives attack speed:** endurance pace (~65–70% FTP) = 100% attack rate; below it slows (e.g. 50% at 40% FTP); above it speeds up, draining the **Surge gauge**.
- **Surge gauge** (modelled on W′: drains when hard, refills when easy). **Everyone gets the same gauge, sized from FTP**; no calibration from the rider's real W′. Size ~30–60 s of hard effort. When empty, the bonus stops (back to 100%). Fitness shows up through choices: a rider who knows they can surge longer invests in capacity.
  - Why: it gates early content (you can't smash everything at 200%), keeps easy rides mostly easy with short surges at elites, ambushes and guardians, and makes heat a natural intensity dial (more pressure, more reason to surge).
  - **Firm rule: nothing removes the gauge's limit.** Builds reshape it, never make it endless.
- **Surge as a build axis, kept simple to start:** only **gauge capacity** (a few tree nodes, maybe one support gem).
  - Parked for later: surge strength, efficiency (diesel), on surge start / end effects, keystones such as Redline, surging speeding up cooldowns.
- **Movement speed is a stat** (gems, tree, gear): faster clears and better escapes. Cap around +50% so the autopilot and screen stay readable.
- **Skills use cooldowns, not mana.** The Surge gauge is the only resource, and it's effort-based. Cooldown reduction is a stat, capped around 40%. Blood Magic becomes **Blood Rite**: no cooldowns, every cast costs life.
### Layer 2: Trials (shape settled, details deferred until we build them)

- **A Trial is a short warm-up level** (~10–15 min, normal packs, no guardian), **then the boss arena**, where the fight is a structured workout with watt targets.
- Win, workout types and replay with modifiers as in the Trials section above.
- **No ERG mode** to start, to keep it simple. You ride the target yourself and the game shows how well you're hitting it.
- **Power is rewarded in Trials** (replaces the earlier "power never adds damage"), always against your own FTP, not raw watts. Gear sets base damage; riding well multiplies it, enough to beat slightly weak gear but not badly under-levelled gear. Options to combine (numbers need testing):
  - On-target bonus: damage scales with how close you are to the target (under = less, on target = full).
  - A small over band: up to ~5–10% over target adds damage; beyond that no extra, or overheat.
  - Clean-interval streak: holding a whole interval in range boosts damage for the next one.
  - Final interval, empty the tank: no cap; the harder you go, the more damage.
- The Surge gauge doesn't apply in Trials.
- **Under target makes the boss stronger**, escalating the longer you stay under. A few seconds' grace (gear changes, standing up), then e.g. ~5–10 s the boss gains armour, ~10–20 s extra adds spawn, 20 s+ you're slowed or frozen, or the boss heals. Effects fade once you're back on target. Each boss can have its own penalties (Warden armour plates, Lich raises extra dead, Juggernaut enrages).
- **Open:** over target. Either a mild overheat (burn damage or slower cooldowns, teaching pacing, since overcooking early intervals wrecks later ones) or neutral.
- **Death:** drop to one knee, a moment of invincibility, back to full health, fight continues. **The third death fails the Trial.** (Replaces the earlier "deaths only cost fight time".)
- **Deferred: revisit Trials properly later to settle the metrics.** Goals to reconcile: failing should be possible (failing sometimes is part of structured training), but you must not be locked out by gear alone; **a very good ride should be able to win** with slightly weak gear. Resolved in direction: power is rewarded (see above); the numbers still need testing.
- **Open:** what happens to the workout after a failure. Option: the fight ends but the workout continues (boss retreats; ride the rest as a chase or survival segment) and finishing still earns XP, AP and a small reward, keeping "no ride is wasted". Or the session simply ends.

### Earlier ideas

- Ideas before layer 1:
  - Rewards in levels come from time ridden rather than intensity, so easy rides stay easy.
  - Rewards normalised to %FTP, so riders of different strengths progress at the same rate.
  - A strong Trial result could suggest raising your FTP.
  - Beats might naturally become short efforts, since RIDE movement depends on effort.

## Parked

- Workout modifiers on Trials (+1 interval, shorter recoveries, higher %FTP).
- Seasons and ladders (would need a cloud save).
- Paragon-style endless progression past the level cap.

## Dropped

- Collecting tokens (Sigil shards) to unlock a boss: replaced by clearing the levels.
- Maps as items (PoE Waystones), a timed Greater Rift, and a weekly vault: they overlap with or conflict with the level and Trial structure.

## Research summary

Where the ideas came from:
- **Diablo 1/2:** dungeon levels down to a boss, waypoints, rarity means power.
- **Diablo 3:** Greater Rifts (an endless ladder), Torment levels (pick your difficulty), seasons. Warning: endless multiplier creep.
- **Diablo 4:** one long Paragon bar that every activity feeds; the Pit. Warning: bland launch affixes.
- **Path of Exile 1/2:** one shared passive tree with skills separate from class (flexibility), map modifiers for risk and reward, pinnacle bosses. Warning: complexity, running out of maps.
- **Last Epoch:** deterministic crafting (forging potential), per-skill trees, a built-in loot filter.
- **WoW Mythic+:** keystone levels, a weekly vault. Warning: chores.
- **Hades:** progress continues through death; Heat as a difficulty knob the player sets.
- **FF7:** materia that levels through use and spawns copies.
- **Zwift:** levels, Drops, streaks. Warning: unlocks that come too easily feel unearned.
- **Ring Fit Adventure:** once the RPG is fun, people come back for the game and not only for the exercise.

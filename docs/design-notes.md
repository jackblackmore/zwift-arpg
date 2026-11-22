# Watt Dungeon: progression design notes

A running record of the progression brainstorm. **Nothing here is locked.** "Leaning" means we like it but haven't committed; "Open" is still being discussed; "Parked" is for later.

Two ideas sit underneath everything:
- **Easy rides build your character; boss rides test it.** Progress is about stats and clears, never about collecting tokens to open things.
- **No ride is wasted.** If you die, quit early or fail a boss, you keep the XP, gear and other rewards you earned.

---

## Character

- **Leaning:** one main character, with room to add more later. If we add classes, do it the Path of Exile way: a different starting point on the same passive tree, with a different KayKit model.
- **Open:** how the character grows. Ideas so far:
  - A shared passive tree (~80 nodes: fire, cold and lightning regions, defence and utility, a few keystones such as Blood Magic) to replace the pick-1-of-3 draft.
  - Materia-style skill gems (FF7): skill gems go in the 4–5 button slots and support gems in linked sockets. Gems earn AP from riding, level into new behaviour (Fireball lv5 splits, lv10 leaves burning ground), and a mastered gem spawns a copy. Gems also drop as loot.
  - Where sockets live: on the skill bar (keeps swapping gear painless) or on gear (more authentic, but fiddly).
  - Cheap respecs, so one character can try different builds.

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
- **Leaning:** your damage scales with **how close you are to the target as a % of FTP**, not with raw watts.
- **Leaning:** **killing the boss before the workout ends unlocks the next region**, however many times you died. Dying costs a few seconds out of the fight; the workout never stops. If the boss survives, you keep your loot and retry another day. Whether you can win depends mainly on your stats and build, and partly on how well you ride.
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

- **Open:** not decided. Ideas so far:
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

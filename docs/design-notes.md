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

### Stats

- **Today** (`src/game/stats.js`): one flat pool. Level gives base life, mana and spell damage; gear and passives all add into it; skill behaviour (projectiles, chains, pierce) sits in the same pool; defence is just life plus a little damage reduction; no attributes.
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

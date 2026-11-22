# Watt Dungeon: build order

The order to build things in, written so a fresh chat can pick up any step. Read `CLAUDE.md` and the matching sections of `docs/design-notes.md` first. Every step ends with `npm run build && npm test` passing. If it touches balance, also run `npm run balance` and `npm run arena` and say what moved.

Status: ✅ done · ▶ next · ☐ later

| # | Step | Status |
|---|---|---|
| 0 | First balance pass and balance tools (`npm run balance`, `npm run arena`) | ✅ |
| 1 | Gems v1: skill bar, gem-only skills, shrines, gem levels | ▶ |
| 2 | Room-and-corridor levels | ☐ |
| 3 | Crypt content: 5 distinct levels, new enemies, guardians | ☐ |
| 4 | Beats inside a level | ☐ |
| 5 | Gems v2: supports, sockets, guardian gem drops, feeding | ☐ |
| 6 | Passive tree (replaces the level-up card draft) | ☐ |
| 7 | Defence: armour, resistances, element-leaning regions | ☐ |
| 8 | Crypt Trial boss (workout fight, RIDE mode) | ☐ |
| 9 | Bluetooth (Zwift Ride, KICKR) | ☐ |

---

## Step 1: Gems v1 ▶

**Goal:** a new character starts with **one attack and one evade**. More skills arrive as gems from shrines when slots unlock at levels 5, 8 and 12. Skills level up as you use them. Design: "Gem model in detail" in `docs/design-notes.md`.

**Today:** Fireball, Arc, Frost Nova and Flame Dash are wired straight to inputs and buttons:
- skill code: `src/game/skills.js`
- casting in `updPlayer`: `src/game/update.js`
- inputs `ctl.fb`, `ctl.arc`, `ctl.nova`, `ctl.dash`: `src/input/input.js`, `src/input/devices.js`
- RIDE buttons: `RIDE_BUTTONS` in `src/data/ride.js`
- HUD buttons `sFb`, `sAr`, `sNv`, `sDs`: `index.html`, `src/ui/hud.js`

**Scope of v1** (keep it this small):
- **Skill bar:** Main (unlocks at level 1), Evade (level 1), Flex A (level 5), Guard (level 8), Flex B (level 12). This step has no guard skills, so make Guard accept any skill for now and note that in the code.
- **Skill gems we have:**

  | Gem | Kind | Behaviour |
  |---|---|---|
  | Fireball | Attack, held | Held: casts repeatedly while pressed |
  | Arc | Attack, held | Held: casts repeatedly while pressed |
  | Frost Nova | Attack, press | Cooldown |
  | Flame Dash | Evade | Stands in for Blink until we build it |

  Frost Lance and Raise Skeletons come later.
- **Shrines:** each slot unlock offers 1 of 3 gems. On a fresh character, offer the Main choice before the first fight (Fireball, Arc or Frost Nova); Flame Dash goes in Evade automatically. When a slot unlocks, put a shrine at the start of the next map, or show it immediately if that's simpler; note which you did in the design notes.
- **Gem levels:** gems in slots earn XP from the same kills as the character. Gems outside slots earn 10%. Cap at level 10 for tier I. Each gem gets **one milestone at level 5**:

  | Gem | Level 5 milestone |
  |---|---|
  | Fireball | Pierces 1 enemy |
  | Arc | +2 chains |
  | Frost Nova | +25% radius |
  | Flame Dash | +1 charge |

  Base damage grows with gem level (roughly 1.1× per level) instead of with character level.
- **Gem bag:** every gem you own, unlimited, separate from the item bag. Swap gems between slots freely.

**Build steps:**
1. **Data.**
   - Add `src/data/gems.js`: gem definitions (kind, accepted slots, held or press, damage per level, milestones) and slot definitions (unlock level, accepted kinds).
   - Move per-skill numbers that belong to the gem out of `src/data/skills.js`, or point at them.
2. **State.**
   - Add `P.bar` (slot → gem or null) and `P.gems` (the gem bag): `{ id, gem, lvl, xp }`.
   - Save and load both in `src/game/save.js`.
   - Old saves have no gems. Treat them as fresh for gems: offer the Main shrine on load.
3. **Input.**
   - Replace `ctl.fb`, `ctl.arc`, `ctl.nova` and `ctl.dash` with slot inputs: `ctl.main`, `ctl.flexA`, `ctl.flexB`, `ctl.guard`, `ctl.evade`. Each slot is held or pressed depending on the gem in it.
   - Keyboard and mouse: LMB Main, RMB Flex A, Q Flex B, E Guard, Space Evade.
   - Touch: one button per unlocked slot.
   - RIDE (`RIDE_BUTTONS`): A = Main, B = Flex A, Z = Flex B, right shifter = Evade. Pick a free button for Guard and note it.
   - Game code still reads only `ctl` (CLAUDE.md rule).
4. **Casting.**
   - `updPlayer` walks the bar and casts each slot's gem through a lookup from gem id to cast function (the functions in `skills.js`).
   - Cooldowns become per slot instead of `P.novaCd` and `P.dashCh`.
   - Gem level feeds damage and milestones.
   - Passives that change one skill (Twin Flame, Searing Lance, Forked Sky, Ember Step) keep working for now. The design moves them to support gems in step 5.
5. **Stats.**
   - In `src/game/formulas.js`, base damage comes from the gem: `gem base(level) + flat spell from gear`. Character level stops adding spell damage (`HERO.spellPer` → 0).
   - Keep the formulas pure. The balance tools pass a gem and its level in.
6. **HUD and UI.**
   - The skill bar shows only unlocked slots. Each slot shows its gem icon, cost, cooldown and gem level. Locked slots show a padlock with the level that unlocks them.
   - Add a shrine panel (pick 1 of 3; reuse the passive-card styling in `src/ui/panels.js`).
   - Add a gem panel (bag plus slots, tap to swap), opened with `G` or a button.
7. **Balance tools.**
   - `gearProfile` gains a skill bar.
   - `npm run balance` takes the Main gem's level from the tier (add `PAR_GEM` in `src/data/balance.js`).
   - The arena bot uses whatever is on the bar.
   - Re-tune until the targets pass again. The early game should feel weaker than now: one attack and nothing else.
8. **Tests** (`tests/sim.mjs`):
   - A fresh character has exactly Main and Evade filled.
   - Flex A is locked below level 5 and a shrine appears at 5.
   - Picking a shrine gem fills the slot.
   - Gems gain levels from kills.
   - The level 5 milestone applies.
   - Saves round-trip the bar and the gem bag.
   - Update the existing scripted run, which calls `castArc` and `castNova` directly.
9. **Docs.**
   - Update the home screen text in `index.html` (it lists all four skills).
   - In `docs/design-notes.md`, mark what's built and record anything that changed while building.
   - Tick step 1 in this file.

**Done when:**
- A new character can only use one attack and Flame Dash.
- Levels 5, 8 and 12 each bring a shrine choice.
- Gems level up and hit their milestone.
- Balance targets pass.
- Tests pass.

---

## Step 2: Room-and-corridor levels ☐

**Goal:** you can't dash straight to the guardian, and a level takes about 20–30 minutes at par. Design: "Regions and levels" in the design notes.

- **New generator in `src/world/`:** rooms of different sizes joined by corridors along a main route, with a few side branches. The guardian arena is at the far end. Tuning goes in `src/data/dungeon.js`.
- **Walls are real colliders,** so line-of-sight and steering already work (`los`, `steer` in `src/world/map.js`, `src/game/enemies.js`).
  - Keep the circle colliders for props.
  - Walls need segment or grid colliders, and `pushOut`, `blocked` and `los` need to know about them.
- **Packs:**
  - Place packs in rooms and at chokepoints.
  - Shrink the aggro range so rooms wake one at a time.
- **Minimap:** reveals as you explore.
- **Fallback:** `dun.ready === false` still needs a primitive layout.
- **Autopilot** (`src/game/autopilot.js`) follows the route instead of heading for the nearest pack.
- **Balance:**
  - Re-check XP per map against par. Bigger levels should close today's small shortfall.
  - The arena is unaffected (it clears obstacles).
- **Tests:**
  - Start and guardian are a path apart.
  - Every room is reachable.
  - Walking the route takes at least N seconds.
  - Nothing spawns inside walls.

## Step 3: Crypt content ☐

The five Crypt levels from the design notes (Crypt Halls, Ossuary, Flooded Tombs, Bone Gardens, Throne Approach). For each level:
- its pack mix and rule
- poison pools on level 3
- a necromancer that raises the dead on level 4
- bone knights with shields on level 5
- 4 new guardians (skeleton knight, archer captain, plague bloat, high necromancer) plus the lieutenant, using KayKit models from the gallery

Monster data goes in `src/data/monsters.js`. Add each new enemy and guardian to the arena encounter list.

## Step 4: Beats ☐

Beats inside a level follow the 30-minute template in the design notes:
- elite
- ambush
- treasure
- gamble
- breather
- guardian last

Each beat has a signal, a payoff and a release. Beats are where most of the good loot comes from.

## Step 5: Gems v2 ☐

- **Support gems and sockets on the skill bar.** The current passive notables become supports: Twin Flame, Searing Lance, Forked Sky, Shatter, Conduit, Ignite, Chain Reaction.
- **Gem sources:** guardians always drop a gem.
- **Feeding:** move AP between gems, with the "never lose a skill" rule.
- **Gem tiers and fusing:** can wait until the Forest.

## Step 6: Passive tree ☐

- A small tree (60–80 nodes) readable on a phone, replacing the pick-1-of-3 level-up cards.
- Regions for fire, cold and lightning around a core of defence and utility.
- 3–4 keystones; Blood Magic moves here.
- Cheap respecs.

## Step 7: Defence ☐

- Armour and elemental resistances on gear, so defence comes mostly from gear.
- Each region's monsters lean toward one element.

## Step 8: Crypt Trial ☐

- A short warm-up level, then the Ashen King fought as a sweet-spot workout (design notes: "Trials" and "Layer 2").
- Beating it unlocks the Forest.

## Step 9: Bluetooth ☐

Zwift Ride and KICKR devices in `src/input/`, writing into `ctl` like the RIDE simulator does. Deliberately last.

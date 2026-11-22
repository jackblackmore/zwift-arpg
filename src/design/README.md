# Watt Dungeon game design

This folder is the whole game design as data: stats, levels, skills, gear, passives, monsters, areas, loot and crafting. It also has the maths that ties them together and a simulation that plays the game on paper. Change a number here, run `npm run balance`, and `docs/BALANCE.md` shows what that does to every zone, from level 1 to 60.

**Status:** this is the design the game is moving to. The live game still reads `src/data/`. As each phase of `docs/GAME_PLAN.md` lands, its rules code switches to importing from here, and the matching file in `src/data/` is deleted. After that, this folder is the only place tuning lives.

## How to change the game

1. Say what feels wrong, in plain words: "rares are too spongy in Act 2", "levelling is too slow after 40", "I want a cold build to be viable". Claude finds the knob below.
2. Change the number in the design file.
3. Run `npm run balance`. It prints any number that's now outside its target and rewrites `docs/BALANCE.md`.
4. If the change you wanted moved other numbers out of band, either fix those too or decide the target was wrong and change `targets.js`.

`npm test` runs the same check (without rewriting the report). It **fails if any id points at something that doesn't exist** (a stat, skill, zone, recipe or unique), so a typo can't slip in.

## Files

| File | What's in it |
| --- | --- |
| `stats.js` | The stat dictionary: every stat id, how it combines, how it's shown. Base player values and mitigation constants. |
| `progression.js` | Level cap, XP curve, life and mana per level, skill levels, rune slot levels, passive points, flasks. |
| `skills.js` | The 10 skills (damage, growth, cast time, cost, tags, unlock), Flame Dash, ailments, and the 13 runes. |
| `items.js` | 10 equipment slots, item rarities, bases per slot with drop levels, ~35 affixes with item-level tiers, uniques. |
| `passives.js` | The passive tree: a hub and 7 wings of paths, notables and keystones. |
| `monsters.js` | Monster scaling by level, rarities, rare mods, three monster families, five bosses. |
| `areas.js` | Biomes, the 3 acts with 17 zones (area level, monster mix, size, quest, rewards), waystone tiers. |
| `loot.js` | Drop chances, rarity weights, gold, materials, runes, side rooms, salvage, loot filter, bag/stash sizes. |
| `crafting.js` | Materials, bench recipes, waystone mods, atlas bonuses. |
| `targets.js` | **The feel, as numbers**: kill times, hits to die, minutes per zone, levels and hours per act, loot per zone. Also **PAR**, the typical player the sim plays. |
| `formulas.js` | The maths: damage, crit, ailments, mitigation, monster stats, XP, affix tiers. Shared by the sim and (later) the game. |
| `sim.js` | The par simulation: builds the par character at each zone and adds up fights, time, XP and loot. |
| `validate.js` | Cross-reference checks. |

## The system on one page

**Stats.** Everything is a stat id from `stats.js`. A final value is `(base + flat) × (1 + sum of increased) × each "more"`. So "increased" bonuses add together, and "more" bonuses (runes, keystones) multiply. Damage types are physical, fire, cold, lightning and chaos. Resistances cap at 75%.

**Levels.** Levels go from 1 to 60. XP to the next level is `22 × level²`. After level 32 each level costs 28% more, which makes 50–60 a long endgame tail. Monsters more than 4 levels below you give less XP. Each level gives +12 life, +5 mana and 1 passive point. Quests give 11 more points.

**Skills.** You have four skill slots, plus Flame Dash and a flask, which matches the Zwift Ride's buttons. You start with Fireball and unlock about one skill per two zones. A skill levels by use up to `1 + (character level − 1) / 3`, at most 20. Gear can add 5 more. Each skill has two rune slots, opening at skill levels 5 and 15. Runes trade damage for shape: more projectiles, piercing, area, echo or a totem.

**Equipment.** There are 10 slots: weapon, off-hand, helm, chest, gloves, boots, belt, amulet and two rings. Some open during Act 1. Item level is the area level the item dropped in. It decides:
- **Bases.** Each slot has 4–9 bases with a drop level, so a new base dropping is an event.
- **Affix tiers.** Each affix has 1–9 tiers, each gated by item level, and the tier shows on the item.

Magic items roll 1–2 affixes. Rares roll 4–6, with at most 3 prefixes and 3 suffixes. Uniques have fixed mods and a fixed source.

**Passives.** The tree has about 100 nodes in 7 wings: Heart, Pyre, Rime, Storm, Bulwark, Rider and Ossuary. By level 60 you have 70 points, so you pick about 70% of the tree. Paths run outward to notables and end in keystones.

**Monsters.** Monster life grows 10.3% per level and damage 6.2% per level. Archetypes multiply those numbers: a scuttler is fragile, a knight is tanky. Magic monsters have ×3.3 life and rares ×13, and rares get 1–3 mods. There's one family per act: skeletons, the Rot and the Ashen Court. The endgame mixes all three. Each act boss has its own abilities. The waystone guardian and the pinnacle sit on top.

**Areas.** The campaign is 3 acts and 17 zones, with area levels 1–35. Act 2 lowers your resistances by 15% and Act 3 by 30%, which is why resist gear matters. After Act 3 come waystones, tiers 1–10 at area levels 36–59. A waystone rolls mods that add difficulty and quantity. Its boss always drops the next tier.

**Loot.** About 6–20 items drop per zone. Most are normal or magic, roughly 1 rare drops per zone, and boss zones give 2–4. About 1.4–2 uniques drop per act. Materials replace most of the gear flood. Salvage turns gear into materials, and the loot filter hides junk.

**Crafting.** Materials give random crafts: upgrade rarity, reroll, retemper values, add or remove an affix, corrupt. Bench recipes are found in the world and add one chosen mod; an item can carry only one.

## Where it lands today (par player)

From the current `docs/BALANCE.md`:

- **Campaign:** each zone takes about 5–7 minutes. Act 1 ends at level 11, Act 2 at level 20 and Act 3 at level 34, about 1.8 hours of par play (real players take about 1.5× longer).
- **Fights:** normal monsters die in about 0.3–0.5 s and rares in 4–7 s. Act bosses take 50–75 s. Normal monsters need 14–35 swings to kill you and rares 7–18. A boss's biggest hit takes 20–40% of your life.
- **Endgame:** each map takes 7–9 minutes. The par player reaches T10 at about level 50, after about 9 hours. Level 60 takes about 40 hours (around 225 T10 maps).

## Cheat sheet: if X feels wrong, change Y

| Feels like | Change |
| --- | --- |
| Normal monsters too spongy / too flimsy everywhere | `monsters.js` `SCALE.life.base` (all levels) or `.growth` (gets worse with level) |
| Only rares/magic are off | `monsters.js` `RARITY.rare.life` / `RARITY.magic.life` |
| One act too easy or too hard | that family's archetype `life` / `dmg` in `monsters.js` |
| Dying too much late, fine early | `SCALE.dmg.growth` down, or par defences: `PER_LEVEL.life.per`, life affix `hi` in `items.js` |
| Bosses too long or short | `BOSSES[id].life`. Too punishing: their ability `x` |
| Levelling too slow in the campaign | `SCALE.xp.base` / `.growth` or `LEVEL.xp.base` |
| Endgame levelling too fast or slow | `LEVEL.xp.late` (and `lateFrom`) |
| Zones too long | `rooms` / `size` per zone in `areas.js`, or `PAR.travel` if walking is the issue |
| Too much or little loot | `loot.js` `ITEM_DROPS` chances. Rarer rares: `ITEM_RARITY` weights |
| Gear upgrades come too fast | affix `tiers` / `from` / `to` in `items.js` (stretch the gates), base drop levels |
| Running out of mana | `stats.js` `BASE.manaRegen` / `manaRegenPct`, skill `cost` / `costGrowth` |
| Resists are a chore / too easy | act `resPenalty` in `areas.js`, res affix ranges, ring and amulet implicits |
| A skill is weak | its `dmg`, `growth` or `cast` in `skills.js`. For clear speed, `targets` |
| A build path is weak | that wing's `small` stats and notables in `passives.js` |
| Maps too hard or too rewarding | `WAYSTONE_MODS`, `PAR.waystone`, `WAYSTONES.perTier` |

## Rules for editing

- **Ids are forever.** Renaming a stat, affix, skill or zone id breaks saves once the game reads these files. Rename the `name` and keep the id.
- **New stat?** Add it to `stats.js` first. The validator rejects unknown ids everywhere else.
- **New zone, skill or unique?** Add it, point its `unlock` / `source` / `rewards` at real ids, and run `npm run balance`.
- **Par is not a target to optimise.** It's a typical player. If the par player is unrealistic (e.g. never picks up resists), fix `PAR` in `targets.js`, not the monsters.
- The sim works on averages. It's for curves and pacing, not for exact numbers. Feel still needs playtesting.

## Decisions baked in

Some of these were open questions in `docs/GAME_PLAN.md`. They're defaults, easy to flip:

- **Runes on skills**, not sockets in gear.
- **Items drop identified.** No identify step.
- **Dying in a waystone** costs 5% of the current level's XP, and each map allows 6 portals. Campaign deaths cost nothing.
- **One class**, a mage, for now. Melee comes after the campaign. Skeletons are in the tree as a minion build.
- **Ride hooks:** Cadence (a keystone) and three endgame uniques read `ctl.effort` once the game uses this data.

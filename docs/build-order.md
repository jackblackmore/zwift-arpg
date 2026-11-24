# Watt Dungeon: build order

The order to build things in, written so a fresh chat can pick up any step. Read `CLAUDE.md` and the matching sections of `docs/design-notes.md` first. Every step ends with `npm run build && npm test` passing. If it touches balance, also run `npm run balance` and `npm run arena` and say what moved.

Status: ✅ done · ▶ next · ☐ later

**Order:** character systems first, then the world. Gems, skills, the passive tree, defence and gear all feed the stat sheet, so we finish them and balance the whole character (steps 1–7) before building levels and events on top (steps 8–11).

| # | Step | Status |
|---|---|---|
| 0 | First balance pass and balance tools (`npm run balance`, `npm run arena`) | ✅ |
| 1 | Gems v1: skill bar, gem-only skills, shrines, gem levels | ✅ |
| 2 | More skills: Frost Lance, Raise Skeletons, Blink, Flex and Guard options | ✅ |
| 3 | Gems v2: support gems, sockets, guardian gem drops, feeding | ✅ |
| 3½ | No mana: held skills limited by cast time, the Surge gauge as the only resource | ✅ |
| 3¾ | Go melee: retire the mage Main gems, melee Main gems, Raise Skeletons as a support, melee hero and autopilot | ✅ |
| 3⅞ | Fight mechanics: shield block and parry, Roll from level 1, posture and stagger, telegraphs (Sekiro and Dark Souls). Part 1 (prototype with a plain Sword) ✅, part 2 after playtesting | ▶ |
| 4 | Passive tree (replaces the level-up card draft) | ☐ |
| 5 | Defence: armour, resistances, typed monster damage | ☐ |
| 6 | Gear rework: affixes and uniques for the new stat sheet | ☐ |
| 7 | Balance pass 2: the whole character, every Crypt tier | ☐ |
| 8 | Room-and-corridor levels (built ahead of steps 2–7; level length still to tune after step 7) | ✅ |
| 9 | Crypt content: 5 distinct levels, new enemies, guardians | ☐ |
| 10 | Level generation v2: room roles, doors and fog gates, the beat rhythm, a measured 30-minute budget (do before step 9) | ☐ |
| 11 | Crypt Trial boss (workout fight, RIDE mode) | ☐ |
| 12 | Bluetooth (Zwift Ride, KICKR) | ☐ |

## Where we're up to (handover, late Nov 2026)

**The game today:** a melee knight in the Ashen Crypt (5 map tiers, room-and-corridor levels with framed doorways and room roles (combat, elite, treasure, rest) shown on the door signs, the Pale Warden guardian behind a fog gate). Fights are Sekiro-style timing: a plain Sword that auto-attacks, the Knight's Shield (hold to block, tap to parry, posture), Roll from level 1, stagger on guardians and rares, telegraphs by colour and sound. The start is deliberately hard: slow levels, sparse loot (mostly plain items), monsters that punish not defending. The owner played it: **"much better, I have to use the shield and little surges or I die."** In RIDE mode the autopilot stops at junction rooms for a D-pad choice. `/maps/` shows generated layouts by seed.

**Owner's calls since the last plan** (all in `docs/design-notes.md`): fights are Sekiro and Dark Souls ("Fight mechanics"); start underpowered ("Harder start"); route choice like Zwift junctions and Hades doors ("Route choice"); level generation v2 with room roles, door signs showing the kind of room, a measured 30-minute budget, doors and fog gates, set pieces, forks later, backtracking is fine ("Level generation v2").

**Not decided yet: don't build these without asking.**
- **Ambush rooms.** Proposal (not agreed): a swarm from every side in 3 waves, no rare in it, rewarded with XP and a guaranteed item but never gems. Open: does dying reset it; are ambushes mostly on side branches.
- **Shrine rooms (gamble).** What the buff or risk is.
- **Gem drops.** The owner wants gems **very controlled** so there's a reason to keep playing. Proposal (not agreed): gems only from the guardian (1), elite rooms (15–20%) and shrines; none from normal rares (25% today). Don't change gem drop rates until the owner confirms.
- **Elite vs ambush split** (proposal: elite is one strong named enemy for quality loot, ambush is many weak ones for quantity).

**Autopilot queue: what a session can build without asking, in order.** One PR per item, merged when `npm run build && npm test` pass (CLAUDE.md). After each item, add a line under "Built while the owner was away" below, so the owner can review it in one place: what changed, how to try it, the arena or test numbers, and anything that needs the owner's call.
1. ✅ **Stagger payoff** (step 3⅞ part 2, item 2): a finisher on staggered guardians and rares, so the arena's perfect bot is at least 15% faster than the good rider.
2. ✅ **Guardian channels** (step 3⅞ part 2, item 3), including the RIDE short-effort bonus.
3. ✅ **Shield arts** (item 4): Magic Shield and Frost Ward change the block and parry.
4. ✅ **Elites' heavy swings, Flame Dash through the target, a Sword level 5 milestone** (items 5 and 6). Step 3⅞ part 2 isn't marked done: item 1 waits for the owner's playtest, and the perfect bot is only 10% faster than the good rider on tier 4 guardians (target 15%).
5. ✅ **Measure a level** (step 10, build step 1): a headless full-level run at par reporting minutes (walking, fighting, junction waits), plus a level-time estimate in `npm run balance`. Record the number in the design notes. Don't change level length yet, just measure.
6. ✅ **Doors** (step 10, build step 2): door records in the generator, signs at the real doorways, door frames, a fog gate on the guardian's arena. Show doors in the map viewer.
7. ✅ **Room roles framework** (step 10, build step 3) with only the agreed roles: combat, elite, treasure, rest, guardian. Door signs show the role. Leave ambush and shrine out until they're decided. Show roles in the map viewer.
8. ✅ **Passive tree** (step 4), if there's time: a first version with the fight nodes and keystone ideas in its brief.

**Don't, without asking:** change gem drop rates, build ambush or shrine rooms, delete content, make big asset changes, upgrade three.js, start Bluetooth. Keep the difficulty where the owner liked it: if a change makes fights easier or harder, say so with arena numbers.

**Built while the owner was away:** (sessions add a line per merged PR, newest last)
- **Stagger payoff: the finisher** (queue item 1). Break a guardian's or rare's stagger bar and your first hit on it is a finisher: 3× damage, a white flash, big "FINISHER" text and a deep crunch. Parries now do the breaking (two parries in a row break the guardian; plain hits fill a third as much as before), and a hit the monster lands on you knocks 60% off its bar, so careless play doesn't get finishers. Try it: parry the Pale Warden's yellow swings twice in a row, then hit it. Arena guardians (mean of 6 seeds), good rider vs perfect: perfect is 20–31% faster on every tier (was about the same); the good rider wins every run, careless loses every run (it won some tier 3–5 runs before). Your call: good-rider guardian fights got about 10–25% shorter on tiers 1, 2 and 4; if they feel too short, raise guardian life rather than weaken the finisher. Numbers in `STAGGER` (`src/data/monsters.js`); details under "Built: stagger payoff" in the design notes.
- **Guardian channels** (queue item 2). In phase 2 the Pale Warden channels: a blue ring and '!', a rising hum, "CHANNELLING", and a blue bar under its life bar that fills over 3 s. It stands still but keeps swinging (faster), so there are parries to make. Break its stagger bar before the blue bar fills and the channel is cancelled and it's staggered (finisher ready). During a channel a parry fills 62% of the bar (two always break it, one plus a few hits usually does), hits fill 4× as much as usual and 28× while you Surge (2× outside a channel); in RIDE mode an effort spike above 120% FTP fills it too (25% a second at 160%). A channel that completes alternates: first an unblockable burst around the guardian after a 0.7 s purple wind-up (roll it: 5× its damage), then a mend (heals 10% and summons 4 runners). Phase 2 now opens with a channel; its rotation has two. Try it: get the Warden under half life, then parry its yellow swings while holding Shift (or tap ⚡); let one finish to see the burst and roll it. To keep phase 2 as hard as before, the guardian's phase-2 abilities come a little faster (2.2 s apart, was 2.6). Arena (seeds 1–6, guardians): the good rider breaks 48 of 66 channels (73%), the perfect bot 45 of 46, a good rider who never surges 40 of 67 (60%), careless 0. Good rider before → after 93, 66, 59, 51, 55 s → 86, 62, 59, 57, 58 s and wins every run, damage taken about the same; perfect 52, 53, 55, 48, 44 → 55, 46, 49, 52, 44 s; careless loses all 30 (was 29). Your call: if a completed channel should hurt more, raise `BOSS.channel.mend.heal` or `burst.dmg`; if breaking is too easy, lower `hits` or `surge`. The perfect bot is only 9% faster than the good rider on tier 4 (6% before on these seeds), short of the 15% target. Numbers in `BOSS.channel` (`src/data/monsters.js`) and `RIDE.spike` (`src/data/ride.js`); details under "Built: guardian channels" in the design notes.
- **Shield arts** (queue item 3). Magic Shield and Frost Ward are now shield arts: in Guard they still block and parry like the Knight's Shield, and change what a parry does. **Magic Shield:** a parry wraps you in a barrier worth 12% of your life (stacks to 30%, lasts 5 s; a blue bubble that flares, "BARRIER +N"); blocks take off a bit more (82% of a hit, was 75%; heavies 60%, was 50%); the cost is a weaker riposte (1.3×, was 1.8×). Warding now makes the barrier 30% bigger. **Frost Ward:** a parry chills the attacker for 2.5 s (the guardian 0.8 s) and leaves a frost ring for 3 s that chills monsters inside and nips them with cold; chilled monsters now glow pale blue; the cost is a lighter block (65% of a hit, 40% of a heavy). Lingering Frost makes the chill and rings last 50% longer. The level 3 Guard shrine offers Frost Ward or Magic Shield (Magic Shield wasn't obtainable before). Try it: reach level 3, take an art from the shrine, swap it into Guard in the gem panel (G), and parry a zombie. Arena, guardians, good rider, mean of 12 seeds, tiers 1–5: Knight's Shield 83, 60, 62, 58, 55 s taking 180, 141, 120, 140, 161; Magic Shield 106, 67, 66, 69, 59 s taking 64, 57, 58, 58, 74; Frost Ward 71, 60, 56, 55, 53 s taking 113, 124, 119, 168, 148 (about even with the Knight's Shield; tier 1 is a little easier, because the rings slow its runners). Every run won. Difficulty with the default Knight's Shield is unchanged. Your call: Magic Shield is the safe, slow pick and more than halves guardian damage; if that's too safe, lower `SK.shield.barrier` or `cap`. Numbers in `SK.shield`, `SK.ward` (`src/data/skills.js`); details under "Built: shield arts" in the design notes.
- **Elites' heavy swings, Flame Dash through the target, the Sword's milestone** (queue item 4). **Rares:** a melee rare still swings yellow (parry it), but every 2–3 swings it winds up a red heavy: a 1 s wind-up with a red glow, a red ring on the floor and the heavy '!' sound, then 3.2× its damage. You can't parry it (a parry press just blocks it, 50% off and a big posture cost); roll it for nothing. A missed one from a tier 1 rare is about 35 damage. **Flame Dash** now goes through the monster you aim at and ends 1.6 units beyond it, hitting everything it passes (1.2× the gem's base, fire) and knocking them aside. **Sword level 5:** every 3rd swing is a "HEAVY CUT", 20% more damage and 3× the stagger (good for breaking channels while you Surge). Try it: find a rare (gold glow) and watch for the red wind-up; roll it with E. Arena, mean of seeds 1–6, tiers 1–5: rare + pack, careless takes 267, 256, 233, 296, 235 → 274, 307, 317, 319, 408; the good rider about the same (25, 46, 30, 23, 21 → 23, 29, 24, 28, 40), because it rolls 90% of heavies. Guardians, good rider 74, 60, 56, 60, 54 s → 78, 60, 51, 51, 55 s (every run won; tiers 3–5 a little quicker from the Sword's heavy cut), perfect 52, 45, 51, 46, 47 → 54, 47, 43, 46, 41 s, careless loses all 30. Good rider channels broken 55 of 60. Your call: if rare packs should push a good rider harder, raise `RARE.heavy.dmg` or shorten its `windup`; `npm run balance` now flags zombie hits just under 4 on tiers 4–5 (4.0, 3.8; were 4.3, 4.1) because of the Sword's heavy cut: accept, or lower `GEMS.sword.mile.mult`. Step 3⅞ part 2 isn't marked done: item 1 waits for your playtest, and tier 4's perfect bot is only 10% faster than the good rider (target 15%). Numbers in `RARE.heavy` (`src/data/monsters.js`), `SK.dash` (`src/data/skills.js`), `GEMS.sword.mile` (`src/data/gems.js`); details under "Built: elites' heavy swings" in the design notes.
- **Measure a level** (queue item 5, step 10 build step 1). `npm run level` (after `npm run build`; about a minute; `npm run level -- 5 10` for 10 seeds) has the RIDE autopilot play whole generated levels, entrance to guardian killed, with the real game code at par level, gear and gems and the arena bot's reaction skill (a good rider), riding at endurance pace and surging when it wants Surge. It prints game minutes per level split into walking, loot, fighting, the guardian, junction waits, time dead and hit-stop, plus deaths, junction stops, packs left and damage taken. **A full clear at par takes about 6–7 minutes on every tier, not 30**: means of 10 seeds 6.8, 6.2, 6.1, 6.7, 6.8 minutes for tiers 1–5 (range 5.3–8.4), of which fighting packs 3.2–4.1, the guardian 1.0–1.3, walking 1.0–1.2, junction waits 0.2–0.3, hit-stop 0.4, loot 0.1; every run cleared, 2 deaths in 50 levels. `npm run balance` now ends with a level-time estimate (route tour / walking speed + packs × clear time + rares + guardian + junctions × wait): 7.0, 6.8, 7.6, 8.3, 9.1 minutes, shown next to the measured numbers (`LEVEL_TIME` in `src/data/balance.js`). `npm test` runs one tier 1 level (seed 7) and checks it clears with a sensible split. Level length and gameplay numbers are unchanged. Fixed on the way: the autopilot could get stuck for good at a doorway with a prop by the wall corner (about 1 level in 20); it now notices jittering in place and backs off round it. **Your calls:** levels are about a fifth of the 30-minute target, and walking is only about a minute, so the other 23 minutes must come from content. Which mix: (a) more rooms and packs (bigger zone grid; packs are capped at 28 today), (b) the beats (elite, ambush, rest rooms, a longer guardian), (c) tougher monsters (slower fights, which changes the feel you liked)? And is 30 minutes still the target at this fight pace, or would 15–20 feel better? A longer level also needs XP per pack to come down, or par levels move. Details under "Level generation v2" in the design notes.
- **Doors and the guardian's fog gate** (queue item 6, step 10 build step 2 and the guardian half of step 5). Every room now knows its doorways (`room.doors`: side, position, width, the room it leads to, the corridor), and the junction signs stand above the real doorway each way leaves by (a gold diamond on the threshold; a doorway off screen keeps its sign at the screen edge). Doorways have a frame: a decorated pillar each side and, on north walls, a stone lintel (side-wall lintels hid the doorway from the camera, and south walls stay low). The guardian arena's doorway has a **fog gate**: a faint mist you can see on the way in; once you're inside and the Warden wakes, it thickens and seals, and you can't leave until the Warden dies (it clears for good) or you die (it reopens and the Warden resets). The autopilot treats it as a commitment. The map viewer draws doors (gold bars) and the fog gate (white), the minimap the gate. Try it: walk into the guardian's arena, then try to walk back out; or open `/maps/`. Tests: 200 layouts' doors all sit on real wall gaps and lead where they say; the signs use the doorways; the gate seals, holds you and the autopilot, opens on the kill and on death. Level time unchanged (`npm run level -- 5 10`: 6.5, 6.2, 6.0, 6.8, 6.9 min, every level cleared, no deaths); fights unchanged. **Your calls:** (1) the frame isn't the arched wall piece: in this pack `wall_arched` is a solid wall with the arch in relief and the real doorway pieces are one tile wide, narrower than our doorways, so I built frames from pillars and a lintel with no asset change; if you'd like true arches, the doorways would need to narrow to one tile or a wider arch model. (2) The gate seals as the fight starts, not as you walk through; say if you'd rather it close the moment you step in. Details under "Built: doors and the fog gate" in the design notes.
- **Phone-friendly landing screen** (owner request, not a queue item). The start menu fitted a desktop but ran off a phone screen. Now the play buttons sit at the top, "How to play", "Controls" and "RIDE mode" are folded sections (tap to open), and the map viewer, asset gallery and pedal demo are link tiles at the bottom. Same text as before, just rearranged; a stopgap until the real landing screen. Try it: open the game on a phone. On an iPhone 13-sized screen it fits with no scrolling.

- **Room roles** (queue item 7, step 10 build steps 3–4 and the elite half of step 5). Every room now has a role, set by a rhythm template along the route: **combat** (today's packs), **elite** (a named rare, "Gloomfang, Crypt Lord", with an extra affix, 1.6× a rare's life, and 4 minions, behind a fog gate on every doorway; drops 3 items and **no gem**), **treasure** (a glowing chest against a wall that opens when you walk up to it: 2–3 items, no gem; 40% have a guard pack and stay shut until it's dead), **rest** (no monsters, a candle-ringed flame: step in and it heals you, refills flasks and clears posture, once per map) and **guardian**. Ambush and shrine are left out. How often, over 200 layouts: an elite on every level (1.08 a level, 87% on side rooms), a treasure room on every level (1.16, 59% side), **a rest room on 56% of levels, never more than one, always on the main route about halfway**; the first 20% of the route is combat only. Junction signs show the role ("☠ Elite", "Onward · ⚔ Combat", "Back · ✦ Treasure"), cleared ways grey with a ✓. The autopilot opens chests, rests on the way through and stays in a sealed elite room. The map viewer colours rooms by role with icons and a legend. The decorative chests in side rooms are gone (a chest now always opens). Try it: play `?seed=7` and follow the signs, or open `/maps/`. Level time (`npm run level -- 5 10`): 7.0, 6.5, 6.8, 7.2, 7.0 min (was 6.5, 6.2, 6.0, 6.8, 6.9), all 50 cleared, no deaths. Fixed: the `SCREENSHOT=` shot was black because the camera eases after the hero and headless Chrome draws a few frames a second (a harness timing issue, not a game bug); shots now snap the camera, and add `-sign`, `-rest` and `-treasure` views. **Your calls:** (1) gems: elites drop none for now (a normal rare's 25% chance isn't given to them); the proposal was 15–20% from elites. (2) Rest on half the levels mid-route: say if the start should have none, or every level one. (3) Elite strength (`ELITE` in `src/data/monsters.js`) is a first guess, not arena-tuned; the level run shows no deaths. Details under "Built: room roles" in the design notes.
- **Passive tree v1** (queue item 8, step 4). The pick-1-of-3 level-up cards are gone; every level after the first gives a tree point (P or the TREE button; a red badge and a glow while points are unspent). **64 nodes:** life and Surge in the middle (Second Wind, Pyromancy, Rime and Voltaics live on as nodes), the shield above (riposte, parry window, block and posture, roll invulnerability and +1 Evade charge, stagger fill, finisher damage), fire, cold and lightning below. **Four keystones**, each 6–7 points out: **Riposte** (every parry strikes back at once with your Main attack; blocking fills posture 50% faster), **Bulwark** (blocking doesn't slow you, less posture, blocks fill the attacker's stagger a little; no parry), **Duelist** (parry window 60% longer; no block), **Blood Rite** (Main and Flex skills ignore cooldowns, one cast per 0.5 s, each costing 5% of life). **Respec:** a full reset is free in the room you enter a map by and in a rest room (no monster awake nearby); anywhere, what you took since opening the tree can be given back. Tap a node to read it, tap a glowing one again to take it; SUGGEST spends points along a path for your Main gem. Upright phones scroll the tree, wide screens turn it on its side, a phone on its side puts the text beside it. The balance tools give the par hero a tree preset (`TREE_PRESETS`, `parTree` in `src/data/balance.js`; `TREE=none` turns it off). **Power vs the cards at level 10 (9 points):** the Sword's shield preset gives ×1.14 DPS, +13% life and a 30% longer parry window, +15% riposte, +10% stagger fill; the card draft (mean of simulated drafts) gave ×1.44 DPS and +8% life. Ember Cleave's fire preset ×1.43 DPS and +13% life vs the cards' ×1.69 and +6%. **Arena** (mean of seeds 1–6, no tree → tree; the tools never counted the cards): good rider guardians 67, 59, 59, 56, 52 → 67, 57, 54, 50, 40 s; perfect 55, 48, 49, 44, 43 → 55, 44, 46, 42, 37 s; **careless now survives tier 4–5 guardians** (27–33% life left, every flask; it won 2 of 12 there before) and half of tier 3; tiers 1–2 unchanged. Keystones on tiers 4/5 (guardian): Riposte 41/37 s, Duelist 43/41 s but 2–4× the damage, Bulwark 70/68 s, Blood Rite 51/53 s (par 50/40 s). `npm run balance`: zombie hits 3.5–4.0 at tiers 2–5 (flagged under 4; were 3.8–4.2). `npm run level`: 7.1, 6.6, 6.6, 6.9, 7.2 min, 2 deaths in 50. Saves: `KEY` is `wd-arpg-4` (old saves are ignored). Try it: level up, press P. **Your calls:** (1) careless play surviving tiers 4–5: lower Iron Body/Hardy if that's too kind. (2) the zombie-hits target (lower it to 3.5, or raise monster life). (3) Bulwark is the weakest keystone for a good rider (raise its `bash`). (4) the respec rule. Details under "Passive tree" in the design notes.

- **Set pieces** (step 10 build step 7). The special rooms now look special: the **guardian arena** has a low dais under the Warden with candles and a magenta sigil, four decorated pillars out by the corners, a brazier in each corner and the ring of gravestones and skull posts; a **vault** (treasure) has the chest on a stone plinth against the wall facing you, braziers either side and coins, and about a third of them have a partition wall with a gap: a small antechamber with coffins, then the vault; the **rest chapel** has the flame in the quiet part of the room with stone benches round it and candles in the corners; the **elite hall** has a colonnade of pillars down both sides of the aisle, coffins by the walls, and the elite waiting at the far end between two braziers. All built from pieces already in `dungeon.glb` (plain shapes without the models); no gameplay numbers changed. Shrine room and ambush hall are left out until those roles are decided. Try it: open `/maps/` (pieces drawn at true size, the panel lists them), or play `?seed=7` (a vault on the route, an elite hall on a side branch). Tests: 200 layouts' set-piece rooms keep their doorways valid, the hero can walk between every doorway and up to the chest, flame or elite, no piece in a wall or a corridor line; in the live game nothing spawns inside a wall or a piece. Level time (`npm run level -- 5 10`): 6.9, 6.4, 6.9, 7.1, 7.5 min (was 7.0, 6.5, 6.8, 7.2, 7.0), all 50 cleared, 2 deaths. Fixed on the way: a chest's loot now flies out in front of it (on the plinth it got stuck inside, and the autopilot froze). **Your calls:** (1) the arena pillars sit out by the walls, not round the Warden, because monster projectiles stop at props and pillars near the fight would become cover ("answer threats with a button, not where you stand"); say if you'd like them closer anyway. (2) The rest flame isn't in the room's exact centre: that's where the corridors cross, so it stands in the middle of the quiet side. Details under "Built: set pieces" in the design notes.

- **Passive tree + set pieces checked together, difficulty back** (no queue item). PRs #42 and #43 were merged back to back; together `npm test` failed one check: the boss test stood the hero inside one of the arena's new pillars, so it was pushed out of the Warden's reach. It now picks clear floor with a line of sight. The tests and the arena also restart their seeded random stream once the page has loaded (loading used it a varying number of times, so the same seed could play out differently under load: the source of the occasional flake), and the level test uses a layout with three junctions (seed 7's one junction could be passed mid-fight). **Difficulty:** the tree had made late fights easier, so the monsters were tuned back up, tree untouched: monster life per tier 2.5, 2.9, 3.4, 3.9 → 2.65, 3.2, 3.95, 4.9 (tiers 2–5), damage growth .25 → .28 per tier, and a hit a guardian or rare lands on you now knocks 85% off its stagger bar (was 60%). Arena guardians, mean of seeds 1–6, before → after: careless won 0, 0, 3, 6, 6 of 6 on tiers 1–5 → 0 on every tier; good rider 76, 57, 56, 48, 40 → 76, 61, 57, 60, 54 s and wins every run (before the tree 67, 59, 59, 56, 52); perfect is 30, 28, 25, 19, 15% → 32, 20, 16, 20, 15% faster than the good rider (35, 22, 19, 20, 20% over 12 seeds), so the 15% target is met on every tier. `npm run balance`: zombie hits 4.0, 3.8, 3.6, 3.5 → 4.2, 4.2, 4.2, 4.4 on tiers 2–5, every par number in target. `npm run level -- 5 10`: 6.9, 6.6, 7.1, 7.6, 8.6 min (was 6.9, 6.4, 6.9, 7.1, 7.5), all cleared, 4 deaths in 50 (was 2). Also: `tree.js` is in CLAUDE.md's data list, and `npm run arena` takes `ONLY=<regex>` for a few rows. **Your calls:** (1) careless play now loses every guardian, a little harsher than before the tree (it won 2 of 12 on tiers 4–5 then); `STAGGER.recover` back toward .6 is the gentlest knob. (2) Tier 5 guardian fights are about 54 s for a good rider (was 40); lower tier 5's `TIER.hp` if that drags. Details under "Difficulty back after the passive tree" in the design notes.

---

## Step 1: Gems v1 ✅

**Done (Nov 2026).** What was built and the decisions made are under "Built: gems v1" in the design notes. The brief below is kept for reference.

**Goal:** a new character starts with **one attack and Magic Shield**. More skills arrive as gems from shrines when slots unlock at levels 5, 8 and 12. Skills level up as you use them. Design: "Gem model in detail" in `docs/design-notes.md`.

**Today:** Fireball, Arc, Frost Nova and Magic Shield are wired straight to inputs and buttons (Flame Dash's code is still in `skills.js` but not on any button):
- skill code: `src/game/skills.js`
- casting in `updPlayer`: `src/game/update.js`
- inputs `ctl.fb`, `ctl.arc`, `ctl.nova`, `ctl.shield`: `src/input/input.js`, `src/input/devices.js`
- RIDE buttons: `RIDE_BUTTONS` in `src/data/ride.js`
- HUD buttons `sFb`, `sAr`, `sNv`, `sSh`: `index.html`, `src/ui/hud.js`

**Scope of v1** (keep it this small):
- **Skill bar:** Main (unlocks at level 1), Guard (level 1), Flex A (level 5), Evade (level 8), Flex B (level 12).
- **Skill gems we have:**

  | Gem | Kind | Behaviour |
  |---|---|---|
  | Fireball | Attack, held | Held: casts repeatedly while pressed |
  | Arc | Attack, held | Held: casts repeatedly while pressed |
  | Frost Nova | Attack, press | Cooldown |
  | Magic Shield | Guard, press | The starting Guard gem; already built as a plain skill |
  | Flame Dash | Evade, press | Code already exists; one of the level 8 Evade shrine options until Blink is built |

  Frost Lance and Raise Skeletons come later.
- **Shrines:** each slot unlock offers 1 of 3 gems. On a fresh character, offer the Main choice before the first fight (Fireball, Arc or Frost Nova); Magic Shield goes in Guard automatically. The level 8 Evade shrine offers Flame Dash (only option until Blink exists; show it as a single choice). When a slot unlocks, put a shrine at the start of the next map, or show it immediately if that's simpler; note which you did in the design notes.
- **Gem levels:** gems in slots earn XP from the same kills as the character. Gems outside slots earn 10%. Cap at level 10 for tier I. Each gem gets **one milestone at level 5**:

  | Gem | Level 5 milestone |
  |---|---|
  | Fireball | Pierces 1 enemy |
  | Arc | +2 chains |
  | Frost Nova | +25% radius |
  | Magic Shield | Absorbs +25% |
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
   - Replace `ctl.fb`, `ctl.arc`, `ctl.nova` and `ctl.shield` with slot inputs: `ctl.main`, `ctl.flexA`, `ctl.flexB`, `ctl.guard`, `ctl.evade`. Each slot is held or pressed depending on the gem in it.
   - Keyboard and mouse: LMB Main, RMB Flex A, Q Flex B, Space Guard, E Evade.
   - Touch: one button per unlocked slot.
   - RIDE (`RIDE_BUTTONS`): A = Main, B = Flex A, Z = Flex B, right shifter = Guard. Pick a free button for Evade and note it.
   - Game code still reads only `ctl` (CLAUDE.md rule).
4. **Casting.**
   - `updPlayer` walks the bar and casts each slot's gem through a lookup from gem id to cast function (the functions in `skills.js`).
   - Cooldowns become per slot instead of `P.novaCd`, `P.shieldCd` and `P.dashCh`.
   - Gem level feeds damage and milestones.
   - Passives that change one skill (Twin Flame, Searing Lance, Forked Sky, Warding) keep working for now. The design moves them to support gems in step 3.
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
   - A fresh character has exactly Main and Guard (Magic Shield) filled.
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
- A new character can only use one attack and Magic Shield.
- Levels 5, 8 and 12 each bring a shrine choice.
- Gems level up and hit their milestone.
- Balance targets pass.
- Tests pass.

---

## Step 2: More skills ✅

**Done (Nov 2026).** What was built and the balance results are under "Built: more skills, step 2" in the design notes. The brief below is kept for reference.

**Goal:** enough gems that every shrine is a real 1-of-3 choice, and the design's three starting builds exist. Design: "Skill variety" in the design notes.

- **Main options:**
  - Fireball, Frost Lance (a piercing cold projectile) and Raise Skeletons (a minion skill: skeletons that follow and fight).
  - Raise Skeletons needs minion AI. Reuse the monster AI in `src/game/enemies.js` pointed at monsters instead of the player.
- **Evade options:** Blink (teleport away from the nearest threat) and Flame Dash (already built).
- **Guard options:** Magic Shield (built), plus one more, e.g. a ward that slows nearby monsters.
- **Flex options:** Arc, Frost Nova, plus 1–2 new ones (e.g. Flame Totem, Meteor from the design notes' Pyromancer example).
- **Each new gem:**
  - data in `src/data/gems.js`
  - one level 5 milestone
  - an arena encounter or bot rule so `npm run arena` exercises it
  - a cast animation from the gallery
- **Balance:** each Main gem should clear a par pack in about the same time (`npm run arena` with each on the bar).

**How it's being built (Nov 2026).** A shared foundation first, then the gems in parallel, one branch each, merged and balanced together.
- **Foundation:**
  - `src/game/casts.js` maps gem id → cast function. Each new skill is its own module `src/game/sk/<gem>.js` exporting `{ cast, tick?, clear? }` and registered with one line in `MODS`; `tick(dt)` runs every game tick, `clear()` on map clear.
  - Charges are generic: any `SK` entry with `charges` and `recharge` (Flame Dash's milestone and gear still add to its own).
  - Milestones: newer gems read `S.mile[gemId]` (true at gem level 5 on the bar) instead of adding to the `MILESTONES` table.
  - Arena bot is generic: press gems fire when enough monsters are in reach (`SK[...].bot = { range, crowd }`), Guard when monsters close in, Evade when one is on top of it at low life. `MAIN=<gem> npm run arena` swaps the Main gem.
- **Parallel work packages:**

  | Package | Gems | Slot | Notes |
  |---|---|---|---|
  | A | Frost Lance | Main | Held. Slow, piercing cold lance, big single hits |
  | B | Raise Skeletons | Main | Press. Minions that follow and fight; monster AI pointed at monsters |
  | C | Flame Totem, Meteor | Flex | Press. Totem casts at nearby monsters; Meteor is a delayed big area hit |
  | D | Blink, Frost Ward | Evade, Guard | Blink teleports away from the nearest threat; Ward slows monsters near you |

- **Then:** merge, fill the shrine lists (Main: Fireball, Frost Lance, Raise Skeletons; Flex: Arc, Frost Nova, Flame Totem, Meteor and any unused Main gem; Evade: Flame Dash, Blink; Guard: Magic Shield, Frost Ward), and balance with `MAIN=<gem> npm run arena` until every Main gem clears a par pack in about the same time.

## Step 3: Gems v2 ✅

**Done (Nov 2026).** What was built and the balance results are under "Built: gems v2, step 3" in the design notes. The brief below is kept for reference.


**Goal:** support gems change how a skill works, gems drop as loot, and spare gems can be fed into the ones you use. Design: "Gem model in detail" in the design notes.

- **Support gems and sockets on the skill bar** (design notes: "Gem model in detail", skill bar table). The current passive notables become supports: Twin Flame, Searing Lance, Forked Sky, Shatter, Conduit, Ignite, Chain Reaction, Warding.
- **Gem sources:** guardians always drop a gem (skill or support) from the region pool; rares sometimes.
- **AP and feeding:** move AP between gems, with the "never lose a skill" rule.
- **Gem tiers and fusing:** can wait until the Forest.

**Build steps** (same pattern as step 2: a small foundation, then parallel packages):
1. **Foundation (one branch, first):**
   - Data: `SUPPORTS` in `src/data/gems.js`: `{ n, icon, col, d, for: [gem ids or kinds], fn(s) }`. `fn` adds to the raw stat sums like a passive's, but only for the skill it is socketed with.
   - State: `P.sock` (slot → array of support gem ids), saved in `src/game/save.js`. Socket counts per slot from the skill bar table: Main 1 at level 1, Flex 1 each. Later counts (L15+) are data only for now.
   - Stats: `computeStats` takes the sockets too, and the per-skill stats it returns (`pierce`, `proj`, `chains`, `novaR`, `shieldMul`...) come from that skill's own supports, not a global pool. Keep `formulas.js` pure.
   - Gem panel: sockets under each slot, tap a support to socket it. Supports live in the same gem bag.
2. **Parallel packages, after the foundation:**
   - **Supports:** move the eight notables out of `src/data/passives.js` into `SUPPORTS`, one each, plus one support for each step 2 gem (e.g. Frost Lance: Split; Skeletons: Bigger Army; Meteor: Twin Meteor). Remove them from the level-up cards.
   - **Gem drops:** guardians drop one gem from the region pool (`GEM_POOL` in `src/data/gems.js`); rares sometimes (`DROP.gem` in `src/data/items.js`). A gem on the ground looks different from items; picking it up goes to the gem bag with a toast.
   - **Feeding:** in the gem panel, feed a gem into another (table in the design notes: same gem 100%, same type 50%, different 25%). Never lose a skill: feeding your last copy leaves a level 1 copy behind.
3. **Balance:** the tools' par bar gains par supports (`parBar` in `src/data/balance.js`). Losing the notable passives makes level-up cards weaker; that's fine until the tree (step 4) replaces them.
4. **Tests:** socketing a support changes only its own skill; supports round-trip through saves; a guardian drops a gem; feeding moves XP and never deletes your last copy.

## Step 3½: No mana ✅

**Done (Nov 2026).** Mana is gone; held skills are limited by cast time, press skills by cooldowns, and the Surge gauge is the only resource. Details and balance results: "Built: no mana, Surge gauge" in the design notes.

## Step 3¾: Go melee ✅

**Done (Nov 2026).** What was built, the decisions made and the balance results are under "Built: go melee" and "Balance" in the design notes. Old saves weren't migrated (the owner's call: nothing is released, so the save key moved and old saves are ignored). The brief below is kept for reference.

**Decision (Nov 2026):** the hero becomes a melee fighter. Why: ranged ARPG skill is positioning (kiting, slowing, keeping range), and on the bike the autopilot does all of it, so a ranged hero on autopilot plays itself. Melee moves the skill to timing (Guard before the hit, Frost Nova when surrounded, Evade out of a bad spot, Surge when it counts), which a rider can do with button presses. The autopilot only has to walk in, which also ends it backing into corners while kiting. **Surge stays exactly as built** (faster attacks, cooldowns and charges); don't add new Surge effects in this step.

**Goal:** a new character picks a melee Main attack at the first shrine, auto-attacks what's in reach, and fights in the thick of a pack where Guard, Evade and Flex skills matter. Every fight still clears in the arena and balance targets pass.

**Keep:** every Guard, Evade and Flex gem (Magic Shield, Frost Ward, Blink, Flame Dash, Arc, Frost Nova, Flame Totem, Meteor) and their supports (Forked Sky, Conduit, Shatter, Warding, Volley, Twin Meteor, Quick Step, Lingering Frost, Ignite). Surge, sparse loot, the gem system, shrines, sockets and feeding are all unchanged.

**Retire** (delete the code; git history keeps it):
- Main gems **Fireball and Frost Lance**. **Raise Skeletons stops being a Main gem and becomes a support** (see Build, step 1b): keep its minion code. Where the retired ones live:
  - data: `GEMS`, `SHRINES` (main and both Flex lists), `GEM_POOL` in `src/data/gems.js`; `SK.fireball`, `SK.frostlance`, `SK.skeletons` in `src/data/skills.js`
  - code: `castFireball` and `updProjectiles` in `src/game/skills.js` (Fireballs are the only `G.proj` user; check the totem doesn't share it); `explode()` in `src/game/combat.js` (Fireball explosion, also used by Chain Reaction and the Storm unique); `src/game/sk/frostlance.js`; `MODS`/`CAST` in `src/game/casts.js`. Keep `src/game/sk/skeletons.js` and the minion aggro in `src/game/enemies.js` (`G.minions`, `hurtMinions`): the support uses them
  - hero clips in `HERO` in `src/render/draw.js` (shoot, lance, and the skeletons cast clip)
- Their supports: **Twin Flame, Searing Lance, Chain Reaction, Split**. **Bigger Army** goes too (it was a support for the Main gem); fold its "+1 skeleton" into the new support's numbers or a later gem if it's wanted. `OLD_NOTABLES` in `gems.js` maps old passives to some of them; point those at the new melee supports. **Ignite** stays and moves to the fire melee gem (`for: ['cleave', 'meteor']`).
- Affixes that only meant something for Fireball: `proj` ("Fireball fires +# projectile") and `pierce` in `src/data/items.js`. Generalise `OLD_MANA` into a list of retired stats so old saves drop them too (`src/main.js`).
- Uniques that need Fireball: rework **Wattbringer** (`proj`, `burnGround`: "Fireball explosions leave burning ground") and **Heart of the Storm** (`storm`: "Every 4th Fireball casts Arc") to work off the Main attack, e.g. "your Main attack's hits leave burning ground", "every 4th Main attack also casts Arc at the target". Uniques can't drop in the Crypt any more, so this only has to work, not be tuned.
- Fireball is also the default in places: `estimate()` in `src/game/stats.js` (bag compare), `ESTIMATE` and `PAR_SUPPORT`/`parBar` in `src/data/balance.js`, `scripts/balance.mjs` (Fireball-only maths), the arena bot. Grep for `fireball`, `frostlance`, `skeletons`, `proj`, `pierce`.

**Build:**
1. **Melee Main gems** (held, `kind: 'attack'`), one shared module `src/game/sk/strike.js` driven by data, each with a level 5 milestone and one support. Suggested starting set (names and numbers are a first guess; tune them):

   | Gem | Element | Shape | Feel | Support |
   |---|---|---|---|---|
   | Ember Cleave | fire | wide arc in front (~150°, reach ~2.4) | the all-rounder, hits the whole front of a pack | Sweep: hits all the way round you, less damage |
   | Frost Strike | cold | narrow arc (~90°), higher damage | single target and rares; chills | Brittle: hit enemies take more damage from everything for a few seconds (reuse the shock status) |
   | Thunder Slam | lightning | slower, a circle in front | big hits, knockback, shock chance | Aftershock: a second, weaker slam a moment later |

   - Hits land straight away (or after a short windup) with hit-stop and a small knockback, so monsters don't keep getting pushed out of reach. Feel matters: tune hit-stop, knockback and the swing clip together.
   - Flex shrines: drop Fireball and Frost Lance from the lists; the two melee gems you didn't pick can be offered there.
1b. **Raise Skeletons becomes a support gem** (`SUPPORTS` in `src/data/gems.js`, `for: ['attack']`, so it fits any Main or Flex attack): enemies killed by the socketed skill have a chance to rise as a skeleton that fights for you, up to a cap (for example 25% and 3 skeletons at first). It keeps the old minion code (`src/game/sk/skeletons.js`: rise, follow, fight, leash, warp, map-clear cleanup) but raises from a kill's position instead of from a button press. Numbers (`chance`, `cap`, life, damage) live in its `SUPPORTS` entry and `SK.skeletons`. The horde idea: build around it with more chance or a bigger cap later (tree nodes, uniques), not in this step. Put it in `GEM_POOL` so it drops. Old saves: a Raise Skeletons Main gem becomes the support (same level) in the bag.
2. **Auto-attack.** The Main gem attacks on its own when an awake monster is in reach and you aren't steering away (manual movement input pauses it; autopilot movement doesn't). Target priority: guardian and rares first, then the nearest. Desktop: holding LMB still attacks toward the cursor. A top-bar toggle ("ATTACK: AUTO / HOLD"), stored per device (localStorage), written into `ctl` by the devices like every other input. Don't attack sleeping monsters, so you don't pull rooms by accident.
3. **Autopilot** (`src/game/autopilot.js`, `RIDE.autopilot` in `src/data/ride.js`): close to the Main gem's reach and fight; no kiting. Keep `clearShot` only for ranged Flex gems (or drop it if nothing needs it).
4. **Hero model and clips.** `char_knight.glb` and `char_barbarian.glb` already exist in `public/gallery/`; the game's hero is `public/models/hero_mage.glb` (`FILES.hero` in `src/render/characters.js`), generated by `scripts/prep-models.mjs` (see its header for where the packs come from). Pick one (knight with a sword and shield reads best for Magic Shield), give it melee swing and slam clips in `HERO` in `src/render/draw.js`, and keep the primitive fallback working when `chars.ready` is false.
5. **Balance.** Melee stands in the pack, so the old "melee packs barely touch a kiting player" gap flips: expect to raise hero life or add a little life on hit, and re-tune monster melee damage. The face-tank target (a pack kills you in 4–14 s standing still) may need to become "standing still without using Guard", and the danger should come from big hits you can react to rather than chip damage. Tools:
   - `npm run balance`: Main-gem maths for the melee gems (targets hit per swing instead of `AOE_TARGETS` per explosion).
   - `npm run arena`: the bot closes in instead of kiting. Add a row per tier where the bot **never uses Guard or Evade**; it should do clearly worse than the normal bot (more damage taken, more flasks, or deaths on rares and guardians). If it doesn't, melee hasn't bought the strategy we want; say so in the design notes.
   - `MAIN=<gem> npm run arena` for each melee gem: each should clear a par pack in about the same time.
6. **Old saves.** Retired gems are filtered out on load already (`GEMS[g.gem] || SUPPORTS[g.gem]` in `src/main.js`). If that leaves the Main slot empty, re-offer the Main shrine (clear `P.shrined.main`), and let the new Main gem start at the level of the best retired Main gem so nobody loses progress. Retired supports and affixes are dropped the same way.
7. **Tests** (`tests/sim.mjs`): replace the Frost Lance block with melee ones, and turn the Raise Skeletons block into support tests (kills by the socketed skill raise skeletons up to the cap, only that skill's kills count, skeletons fight and their kills count for you, they're cleared on a new map) (a swing hits monsters in its arc and not behind; each milestone and support applies; auto-attack fires only at awake monsters in reach and pauses while steering away; the toggle turns it off). Update every test that picks Fireball at the shrine or checks Twin Flame, Searing Lance or Fireball's milestone (gems, gems v2, ride, balance guard rails, the screenshot run). Old-save test: a save with Fireball on the bar loads, re-offers the Main shrine, and the new gem keeps the level.
8. **Docs:** home screen text in `index.html` (mentions Fireball, Frost Lance, Raise Skeletons), `README.md`, the gem tables and examples in `docs/design-notes.md` (Character, Gem model, Skill variety and the Crypt walkthrough all assume a caster), `CLAUDE.md` if anything there changes. Record what was built and the balance results under "Balance" in the design notes, and tick this step.

**Done when:** a new character can only pick melee Main gems, auto-attacks in melee, the autopilot fights up close, old saves load without losing progress, every arena fight clears, the no-Guard row does visibly worse, and `npm run build && npm test` pass.

## Step 3⅞: Fight mechanics ▶

**Decision (Nov 2026):** threats that were built for a kiting caster aren't fair on a melee hero the autopilot parks in reach. Fights move toward Sekiro and Dark Souls: every big threat is answered by a button (the shield or a roll), never by where you stand. Design and the owner's calls: "Fight mechanics" in `docs/design-notes.md`. Do this before the passive tree, because tree nodes (block, posture, stagger, riposte) and step 5's defence build on it.

**Part 1 done (Nov 2026): a prototype to test the mechanics before committing more** (the owner's call: don't rework the skills yet, and start with a basic attack, no fire, ice or lightning). What was built and the arena results are under "Built: fight mechanics prototype" in the design notes. In short: a plain Sword, the Knight's Shield (block, parry, posture, guard break, riposte), Roll from level 1, stagger on guardians and rares, telegraph colours and sounds, the guardian's parryable swing, heavy slam, fanned nova and unblockable charge, defusable bloaters, unblockable volatile blasts, pulsing burning rares, and an arena bot with reaction skill.

**Part 2 ▶ (after the owner's next play).** The brief further down is the original full plan; most of it is done in prototype form. What's left, in order:

1. **Tune from the playtest.** The numbers most likely to move: the parry window (`SK.block.parry`, 0.35 s), posture per blocked hit and its drain, normal monster windups (`FIGHT.windup`), swings per zombie (zombie life, Sword `mult`), the first guardian's damage. Re-run `npm run balance` and `npm run arena` after.
2. ✅ **Make stagger pay off.** Built: a finisher, a parry-led stagger bar and a bar that recovers when the monster lands a hit ("Built: stagger payoff" in the design notes). Original brief: In the arena the perfect bot is barely faster than the good rider, so timing isn't rewarded enough yet. Options: a parry fills more (`STAGGER.parry`), a longer stun, or a **finisher** (Sekiro's deathblow): the first hit on a staggered guardian or rare deals a big chunk (say 3× and more stagger damage taken). Target: the perfect bot kills guardians at least 15% faster than the good rider.
3. ✅ **Channels (🔵), broken by stagger.** Built ("Built: guardian channels" in the design notes). Original brief: The guardian's phase 2 gains a channel: it stops, a blue bar fills over about 3 s, and if it completes it does something bad (a big unblockable burst you must roll, or it heals and summons). Filling its stagger bar before the bar completes cancels it and staggers it. While a channel is up, Surge fills stagger faster, and in RIDE mode a short effort spike does too (tuning in `src/data/ride.js`; it must stay optional, so parrying alone can still break it). Data in `BOSS.channel`; a blue telegraph colour in `TELL` and its own cue sound. Arena bot: surges during a channel; report how often it breaks one.
4. ✅ **Shield arts.** Built ("Built: shield arts" in the design notes). Original brief: Guard gems change the block and parry instead of being timed casts (design notes, "Fight mechanics"): **Magic Shield**: a parry grants a barrier (blocking absorbs a little more); **Frost Ward**: parries chill the attacker and leave a short frost ring. Rework their supports (Warding, Lingering Frost) and the text in `gems.js` (the test checks text against numbers). The level 3 Guard shrine keeps offering Frost Ward.
5. ✅ **Elites' heavy swings.** Built ("Built: elites' heavy swings" in the design notes). Original brief: Rares get an occasional red heavy swing (longer windup, more damage, block for less or roll), so rare packs ask for more than parrying. Data in `RARE` or `FIGHT`.
6. ✅ **Small fixes.** Built (same section of the design notes). Original brief: Flame Dash passes through the target (it stops in front of it today); the Sword gets a level 5 milestone (something plain, for example every 3rd swing is a heavier cut).

**Part 2 status (Nov 2026):** items 2–6 are built. Against the "done when" below: the good rider beats every guardian at par (every run, seeds 1–6), careless loses every one, the good rider breaks 92% of channels, both shield arts work, and build and tests pass with tests for all of it. Not met yet: item 1 (tuning from the owner's next playtest), and the perfect bot is 16–31% faster than the good rider on tiers 1–3 and 5 but only 10% on tier 4 (mean of 6 seeds; it moves a lot between seeds).

**Part 2 done when:** a good rider beats every guardian at par, a careless one loses, the perfect bot is at least 15% faster than the good rider, the good rider breaks most channels, Magic Shield and Frost Ward work as shield arts, and `npm run build && npm test` pass with tests for the finisher, channels and both shield arts.

**Goal:** a level 1 knight can beat the first guardian by parrying, blocking and rolling on time, and clearly can't by just standing there. Every threat in the Crypt has a readable telegraph, a sound and a button that beats it.

**Build:**
1. **Data.**
   - `GUARD` and `ROLL` numbers in `src/data/skills.js`: block reduction (physical and elemental), block move speed, parry window, riposte bonus, posture max, block and heavy posture costs, posture drain, guard-break stun; roll invulnerability, distance, charges, recharge, and the autopilot pause after an Evade.
   - `STAGGER` in `src/data/monsters.js`: bar size per tier and rarity (guardians and rares only), how much parries, heavy hits, ripostes and Surge fill it, stun length, damage taken while stunned, drain.
   - Telegraph types on monster attacks (`parry`, `heavy`, `unblockable`, `channel`) in `FIGHT`, `BOSS`, `BLAST`, `RARE`.
2. **Guard is the shield** (`src/game/sk/`, a new `guard.js`). Hold to block (front arc, slower movement, posture cost), press just before a hit to parry (no damage, stagger, the next swing is a riposte). The shield blocks projectiles from the front. Guard and Evade cancel the Main gem's swing windup. `hurtP` in `src/game/combat.js` learns the attack's telegraph type and direction.
3. **Player posture** (`P.posture`), with a HUD bar near the life orb. A full bar breaks your guard: stunned, and the next hit crits.
4. **Guard gems become shield arts:** Magic Shield (a parry grants a barrier) and Frost Ward (parries chill and leave a short frost ring) change the block and parry instead of being timed casts. Update the support gems (Warding, Lingering Frost) to match, and their text in `gems.js`.
5. **Roll:** a new starting Evade gem (`GEMS.roll`, `START_EVADE`). Evade unlocks at level 1. With no direction held it rolls away from the nearest threat. Every Evade gem gets invulnerability frames; Flame Dash goes through the target. The autopilot (`src/game/autopilot.js`) pauses after any Evade. The level 8 Evade shrine offers Blink or Flame Dash.
6. **Stagger** on guardians and rares: a bar under the boss bar (and over rares), stun and bonus damage when it's full, channels cancelled by filling it. Surge fills it faster. In RIDE mode a short effort spike during a channel fills it faster (tuning in `src/data/ride.js`).
7. **Threats rebuilt** (table in the design notes): the guardian's swing is parryable, the slam is a heavy, the nova fans at the hero (block or roll), and enrage adds an unblockable charge and a channel. The bloater blast is a heavy and killing it before the fuse ends defuses it. The volatile blast is unblockable. The burning aura pulses. Elites' heavier swings are parryable.
8. **Telegraph readability:** a colour per type (`src/data/graphics.js`), a distinct sound per type (`SFX`), and a cue over the hero. Parry windows are generous in the Crypt (about 0.35 s) and tighten with tier.
9. **Hero clips:** add `Melee_Block`, `Melee_Blocking`, `Melee_Block_Hit`, `Melee_Block_Attack`, `Dodge_Backward/Left/Right`, `Lie_Down`, `Lie_StandUp` to `HERO_CLIPS` in `scripts/prep-models.mjs` (and `scripts/prep-hero.mjs` if the hero takes its clips from there), rerun it, and wire them in `HERO` in `src/render/draw.js`. The primitive fallback still has to work.
10. **Inputs:** Guard is now held for block and pressed for parry, on every device. Evade's touch button is visible from level 1. RIDE: check the right shifter can be held.
11. **Balance:** missed guardian heavies take about 35–50% of par life. The arena bot gets a reaction setting: perfect, good rider (about 70% of parries, 90% of rolls, with a reaction delay) and none. Targets: the good rider beats every guardian at par; no defence loses guardians and struggles with rares; perfect is clearly faster. Report it under "Balance" in the design notes.
12. **Save:** bump `KEY` in `src/game/save.js` (the bar gains Roll and Guard changes).
13. **Tests** (`tests/sim.mjs`): a parry inside the window takes no damage and staggers; a block reduces damage and costs posture; a full posture bar breaks your guard; Roll's invulnerability frames avoid a slam; an unblockable hit goes through a block; filling a channel's stagger cancels it; a fresh character has Roll; the autopilot pauses after an Evade; Guard cancels a swing windup. Update the guard rails that assume a stand-and-fight bot.
14. **Docs:** `index.html` home screen controls text, `README.md`, the design notes ("Built: fight mechanics"), `CLAUDE.md` if the Guard description changes. Tick this step.

**Done when:** every Crypt threat has a telegraph, sound and button answer; the arena's good-rider bot beats every guardian at par and the no-defence bot doesn't; and `npm run build && npm test` pass.

## Step 4: Passive tree ✅

**Done (Nov 2026), v1.** What was built and the numbers are under "Passive tree" in the design notes. The brief below is kept for reference.

- **Fight mechanics first (step 3⅞):** add nodes for the shield and timing: block reduction, posture (more, faster drain), parry window, riposte damage, stagger fill, roll charges or invulnerability. Keystone ideas: **Riposte** (parries always riposte, blocking takes more posture), **Bulwark** (blocking doesn't slow you, no parry window), **Duelist** (a longer parry window, no blocking). Each must cost something real.

- **The tree:**
  - small (60–80 nodes) and readable on a phone; replaces the pick-1-of-3 level-up cards
  - regions for fire, cold and lightning around a core of defence and utility
  - 3–4 keystones; Blood Magic comes back here as **Blood Rite** (no cooldowns, every cast costs life); it was removed with mana
  - a few Surge capacity nodes (the first Surge build axis; Second Wind is the level-up card version)
  - cheap respecs
- **Ownership (design notes: "Stats"):**
  - the tree gives % increases and survival
  - gems own skill behaviour
  - gear owns flat damage and most defence
- **Data:** node graph in `src/data/tree.js`. The fn-per-node pattern from `src/data/passives.js` still works.
- **Balance tools:** add **tree presets** (e.g. "fire build at level N") to `src/data/balance.js` so the report and arena can allocate points like a sensible player.

## Step 5: Defence ☐

- **Monster damage gets a type:** physical, fire, cold, lightning or poison. Monster attacks and projectiles carry it. Crypt monsters are mostly physical and poison.
- **Hero defences:**
  - armour reduces physical hits (bigger hits are reduced less, PoE-style)
  - resistances reduce elemental and poison damage, capped at 75%
  - Magic Shield and Warding stay as the Guard layer
- **Damage formula:** the defence formula goes in `src/game/formulas.js`, so the report's face-tank numbers and the arena use it.
- **Regions lean toward an element** (Game outline table), so resistance gear matters and changes by region.

## Step 6: Gear rework ☐

- **Affixes:**
  - add armour, resistances, +gem level, "+1 support socket" (rare) and life
  - remove or rename affixes that the tree or gems now own (projectiles, chains, pierce move to supports)
  - item bases give armour or energy as implicits
- **Uniques:** rework them for the new rules (each should bend a rule, not add numbers).
- **Item level and tier:** check that drops scale so a new tier's gear is a clear upgrade (the sawtooth in "Balance").
- **Bag compare:** the "is this an upgrade?" check (`estimate` in `src/game/stats.js`) uses the real damage and defence formulas.

## Step 7: Balance pass 2 ☐

**Goal:** with every character system in, the whole Crypt (tiers 1–5) is balanced on paper and in the arena before any level design.

- **Tools model the full character:**
  - par gear profiles with armour and resistances
  - par gem levels (`PAR_GEM`)
  - tree presets
  - support gems
  - each Main gem build
- **Report additions:**
  - effective life against each damage type
  - time to kill with each Main gem
  - power gained per drop, gem level and tree point (each system should feel like it matters)
- **Arena:**
  - every Crypt enemy type
  - each build
  - under-geared and under-levelled rows
  - a "wrong resistances" row
- **Update the targets** in `src/data/balance.js` and the guard rails in `npm test` to cover the new systems.
- **Record the results** in the design notes' Balance section.

## Step 8: Room-and-corridor levels ✅

**Goal:** you can't dash straight to the guardian, and a level takes about 20–30 minutes at par. Design: "Regions and levels" in the design notes.

**Built** (ahead of steps 2–7, so the character-side balance isn't final): generator `src/world/gen.js`, tuning `GEN` in `src/data/dungeon.js`, walls and path finding in `src/world/map.js`, dressing in `src/world/dungeon.js`, tests in `tests/sim.mjs` ("Level layout"). Details and decisions: "Room-and-corridor levels" in the design notes. Still open: re-check XP per map and level length against par once steps 2–7 land (the route is only about a minute of walking; the 20–30 minutes has to come from pack count, monster HP and beats).

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
  - Level length is now the thing to tune: the character side was balanced in step 7.
- **Tests:**
  - Start and guardian are a path apart.
  - Every room is reachable.
  - Walking the route takes at least N seconds.
  - Nothing spawns inside walls.

## Step 9: Crypt content ☐

The five Crypt levels from the design notes (Crypt Halls, Ossuary, Flooded Tombs, Bone Gardens, Throne Approach). For each level:
- its pack mix and rule
- poison pools on level 3
- a necromancer that raises the dead on level 4
- bone knights with shields on level 5
- 4 new guardians (skeleton knight, archer captain, plague bloat, high necromancer) plus the lieutenant, using KayKit models from the gallery

Monster data goes in `src/data/monsters.js`. Add each new enemy and guardian to the arena encounter list.

## Step 10: Level generation v2 (room roles, doors, a 30-minute budget) ☐

**Do this before step 9:** it gives the Crypt levels a structure to fill. Design: "Level generation v2" and "Beats" in the design notes (the owner's calls are there).

**Goal:** every room has a role you can see from its door, levels follow the beat rhythm, and a full clear at par takes about 30 minutes, measured, not guessed.

**Build:**
1. ✅ **Measure first.** (Done Nov 2026: `npm run level`, about 6–7 minutes at par on every tier; numbers under "Level generation v2" in the design notes.) A headless full-level run (the RIDE autopilot with the arena bot's reaction skill, at par) that reports minutes per level: walking, fighting, waiting at junctions. Add a level-time estimate to `npm run balance`. Record today's number in the design notes before changing anything.
2. ✅ **Doors.** (Done Nov 2026: "Built: doors and the fog gate" in the design notes; the frames are pillars and a lintel, not the arched wall piece, which is a solid wall in this pack.) `src/world/gen.js` records `room.doors: [{ side, x, z, to, edge }]` at the real gaps in the walls. `src/game/route.js` uses them for its signs (signs at the doorways). Door frames from the KayKit arched wall piece in `src/world/dungeon.js` (primitive fallback when `dun.ready` is false).
3. ✅ **Room roles.** (Done Nov 2026 for combat, elite, treasure, rest and guardian: "Built: room roles" in the design notes. Ambush and shrine wait for the owner.) The generator assigns roles along the route by the rhythm template, and puts optional roles (treasure, elite, shrine) on side branches. Data in `src/data/dungeon.js` (role weights, the template, time estimates per role). Build each role's content: elite (a named rare and minions, more loot), ambush (seal the room, waves), treasure (a chest that drops loot, sometimes guarded), shrine (a choice of buff or risk), rest (heal, refill flasks, no monsters). Loot numbers in `src/data/items.js`.
4. ✅ **Signs show roles and progress.** (Done Nov 2026.) The junction signs carry the role icon and name; cleared ways show greyed with a ✓; Back shows what's left behind.
5. ✅ **Fog gates** on the guardian arena and elite rooms (the guardian arena's built with doors, elite rooms' with room roles, Nov 2026): you can't leave until the fight ends (or you die). The autopilot treats them as a commitment.
6. **Time budget.** The generator sums the role estimates and adjusts the level (room count, beat size) to land near 30 minutes at par. Re-measure with step 1's run and tune the estimates until they agree.
7. ✅ **Set pieces.** (Done Nov 2026 for the guardian arena, vault, rest chapel and an elite hall: "Built: set pieces" in the design notes. The shrine room and ambush hall wait until those roles are decided.) A few authored room templates (guardian arena, vault, shrine room, rest room, ambush hall).
8. **Later (not this step):** forks that rejoin, so some choices don't mean walking back.

**Tests:** every room has a role and doors that lead where the layout says; the rhythm holds on 200 seeds; a rest room heals and has no monsters; an ambush seals and opens again; a fog gate holds you in until the guardian dies; the time estimate for a level lands within the target range; signs show roles and ✓ for cleared ways.

**Done when:** a full clear at par measures about 30 minutes (say 25–35), every door shows what kind of room is behind it, and `npm run build && npm test` pass.

## Step 11: Crypt Trial ☐

- A short warm-up level, then the Ashen King fought as a sweet-spot workout (design notes: "Trials" and "Layer 2").
- Beating it unlocks the Forest.

## Step 12: Bluetooth ☐

Zwift Ride and KICKR devices in `src/input/`, writing into `ctl` like the RIDE simulator does. Deliberately last.

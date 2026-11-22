# Handoff: where Watt Dungeon stands, and what's next

Read this first in a new session, then `CLAUDE.md` and `docs/design-notes.md` (the "Slice 1: built" and "Slice 2: built" sections). Update this file when you finish a piece of work, so the next session starts from the truth.

## State of the branches (as of Slice 2)

- `main`: before Slice 1. Pushing to it deploys to GitHub Pages.
- PR #10 (`claude/watt-dungeon-slice-1-w27z5r` → `main`): Slice 1. Open.
- PR #11 (`ccr-3191eca1-74h6tb` → the Slice 1 branch): Slice 2. Open. It contains all of Slice 1.
- Merge order: #10 first, then #11 (or merge #11 into the Slice 1 branch and then #10 into `main`; the result is the same).
- Tests: `npm run build && npm test` passes with 0 FAIL at seeds 1234, 7, 99, 42, 2026, 5 and 31337 (335–338 checks per seed). Run at most 3–4 suites at once, each with its own `PORT=`.

## Choices made in Slice 2 without the owner (change any of them)

Each one is a single place in code or data.

| Choice | Why | Where to change it |
|---|---|---|
| A skill can sit on the skill bar only once | Keeps "the equipped Fireball" unambiguous; everything keyed by skill id keeps working | `equipReason` in `src/game/gems.js` |
| Main auto-fires at a skill's `rate`; on a button it waits its `cd` | Lets Arc fire every 0.7 s from Main but cool down 3 s on Flex | `skillRate` / `skillCd` / `cdFull` in `src/game/skills.js`; numbers in `src/data/skills.js` |
| A skill without its own Main behaviour, put in Main, casts whenever it's off cooldown and a target is in range | Main "accepts any attack skill" per the design | `castSlot` in `src/game/skills.js` |
| Shrines appear one at a time; a second pending one appears as soon as the first is taken | Simplest way to keep "at the next level's entrance, can't be missed" | `src/game/shrines.js` |
| Only Flex shrine gems start at Main level − 2; Main and Guard shrine gems start at level 1 | The design names only Flex slots | `src/data/shrines.js` |
| Fresh characters have no gems until the Ride 1 shrine | The design: shrines are the only way to get a skill | `initCharacter` in `src/game/character.js` |
| Guardians always fight the hero, never minions or decoys | So Decoy can't trivialise a guardian | `updEnemy` in `src/game/enemies.js` (`e.ai === 'boss' ? P : enemyTarget(...)`) |
| Monsters fight a taunting ally in range first, then an ally at least 1.5 units closer than the hero (within 9), then the hero | Minions tank what they reach first; decoys draw everything near | `enemyTarget` in `src/game/allies.js`; tuning in `src/data/allies.js` |
| Bloaters, necromancers and monsters a necromancer raised leave no corpse, and raised monsters give no XP | Stops farming revive loops | `kill()` in `src/game/combat.js`; `CORPSE` in `src/data/monsters.js` |
| Gem drop pool weighted 4:1 toward supports over skills; drop level = Crypt number; guardian 1 guaranteed, beats 10%, elites 6% | Shrines already hand out skills | `GEM_POOLS`, `GEM_DROP` in `src/data/supports.js` |
| Swift Cast added as a seventh support (shorter cooldown) | Cheap and clearly different | `src/data/supports.js`, `src/data/gems.js` |
| Conduit: the skill's lightning hits always shock, and the shock spreads to one nearby enemy | The design only names it; this is one reading | `onHit` in `src/game/supports.js` |
| Split: +2 projectiles, each 25% weaker (15% at gem level 10) | "Fires three" without tripling damage | `src/data/supports.js` |
| Fourth keystone is Deep Reserves (Surge gauge +50%, cooldowns 15% slower) instead of Legion or Summoner's Pact | Those need minion stats the tree doesn't have yet | `KEYSTONES` in `src/data/tree.js` |
| Blood Rite costs 8% of max life per 6 s of the skill's cooldown, and is refused if it would kill you | "Every cast costs life" with a cost that scales with the skill | `KEYSTONES.bloodRite` in `src/data/tree.js`, `BLOOD` in `src/data/skills.js` |
| Tree respecs are free (single node if the rest stays connected, or reset all) | "Cheap respecs"; there's no currency yet | `RESPEC` in `src/data/tree.js` |
| Old saves: every passive point refunded into the tree, old notables become support gems, the Ride 1 shrine counts as taken | One clean conversion, nothing lost | `src/game/character.js` |
| Heart of the Storm's free Arc uses your Arc gem's level (1 if you don't own one) | Arc is a gem now | `castArc` in `src/game/skills.js` |
| The waypoint screen can't be closed with Escape | After a portal there's no level to return to | `src/ui/waypoint.js` (`data-sticky`) |

## Open questions for the owner

From Slice 2:
- Is Main gem level − 2 the right head start for Flex shrine gems, or should Flex gems catch up faster?
- Should Raise Skeletons in Main speed up with power in RIDE mode? Today pedalling harder refills the army faster.
- Blood Rite lets you spam a Guard skill while your life lasts. Is the life cost enough, or should there be a short minimum cooldown (say 1 s)?
- Should guardians ever attack minions and decoys (a reason to bring them), or always the hero (today)?
- Is the 4:1 support-to-skill gem drop weighting right?
- Should you be able to revisit a past shrine to take one of its other choices?
- Is Deep Reserves a good fourth keystone, or should it be Legion / Summoner's Pact once minion stats exist?
- Should the autopilot avoid poison pools and go for necromancers first?

Still open from Slice 1:
- Should a 30-minute level come from more packs or from tougher ones? (Crypt 1 still clears in 2.2–3.5 simulated minutes headless.)
- Holding Main (left mouse or 1) aims it by hand and overrides auto-targeting. Keep that, or make Main fully automatic?
- Does the Surge neutral band (65–70% FTP) feel right on a real bike?
- Is the gem AP pace right? Level 5 in about 2–3 levels, level 10 in about 13.
- Should the guardian preview the region's Trial workout?
- How should the ambush and survival beats feel in RIDE mode? They ask for a surge.

From the design notes (marked Open there): whether random gem drops feel exciting enough; whether fusion replaces "a mastered gem spawns a copy"; whether rerolls change only the layout or also a level's rule and hazards.

## What's left to do

### Gaps in what Slice 2 built
- **Balance pass** (deliberately deferred). Nothing new has been played: the nine new skills, the seven supports, the four keystones and the tree's numbers. The Ossuary to Throne Approach guardians are lightly tuned. See the known-issue note in `docs/design-notes.md`.
- **Level length.** Far short of the 30-minute design; needs the owner's answer above.
- **Bone Armour** doesn't block poison pools, burning auras or bloater blasts (they bypass the shield code in `combat.hurtP`).
- **Autopilot** ignores poison pools and necromancer priority.
- **Milestones** for the new skills are placeholders; Meteor and Ice Trap have none.
- **Passive tree on a phone** is legible but uses only the middle of the screen.
- No new sound effects for the new skills (existing ones are reused).

### Not built yet (from the design, in rough dependency order)
1. **The Ashen King Trial** at the end of the Crypt: a short warm-up level, then a boss fight scripted to a structured workout with %FTP targets (design notes: "Trials" and "Layer 2"). Clearing Crypt 5 only shows "The Trial awaits" today. Trial metrics are deliberately deferred in the design.
2. **Gem tiers, fusing and feeding** (Tier II/III, fusing for a head start, feeding duplicates for AP). Duplicates already collect in the gem bag, ready for this.
3. **Modifiers and heat** (the modifier hand before each level).
4. **Crafting**, a loot filter / auto-salvage.
5. **The Forest and later regions** (each 4–5 levels plus a Trial, reusing the beat template).
6. **ERG mode** (the design says no ERG to start).
7. **Bluetooth** (Zwift Ride + KICKR as one more writer of `ctl`). Deliberately last.

## How the code is organised now (for the next session)
- Skills register with `registerSkill(id, { cast, main?, range? })` in `src/game/skills.js`. New skills live in their own modules (`src/game/minions.js`, `src/game/spells.js`) imported from `src/main.js`.
- Gems: `src/game/gems.js` (instances in `P.gems`, slot uids in `P.bar`, supports in `P.sockets`); definitions in `src/data/gems.js`.
- Supports look up `supportsOf(skillId)`; skill code calls `projCount(sk)`, `pierceCount(sk)` and `applyFreeze(e, t, sk)` from `src/game/supports.js`.
- Allies (minions, totems, decoys): `addAlly(...)` in `src/game/allies.js`. Per-tick systems: `addTicker(fn)` in `src/game/tick.js`.
- Level hooks: `levelHooks.start / clear / beat` in `src/game/level.js` (shrines and gem drops use them).
- Tests: one `tests/blocks/<name>.mjs` per feature; `__dbg.kit({...})` sets up a skill bar for a test.
- Parallel work with subagent worktrees: tell each agent the base commit (worktrees can start stale), have it symlink `node_modules`, and give each a unique `PORT`.

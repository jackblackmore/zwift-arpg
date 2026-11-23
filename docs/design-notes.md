# Watt Dungeon: progression design notes

A running record of the progression brainstorm. **Nothing here is locked.** "Leaning" means we like it but haven't committed; "Open" is still being discussed; "Parked" is for later.

Two ideas sit underneath everything:
- **Easy rides build your character; boss rides test it.** Progress is about stats and clears, never about collecting tokens to open things.
- **No ride is wasted.** If you die, quit early or fail a boss, you keep the XP, gear and other rewards you earned.

---

## Character

- **Decided and built (Nov 2026): the hero is a melee knight** (build order step 3¾, see "Built: go melee" below). Ranged play's skill is positioning, which the autopilot does for you on the bike; melee's skill is timing (Guard, Evade, Flex skills, Surge), which a rider can do with button presses. Fireball and Frost Lance are gone; Raise Skeletons is a support (kills by the socketed skill rise as skeletons that fight for you, up to a cap), so a horde build is still possible; the Guard, Evade and Flex spells stay.
- **Leaning:** one main character, with room to add more later. If we add classes, do it the Path of Exile way: a different starting point on the same passive tree, with a different KayKit model.
- **Leaning:** three growth systems, each with its own job and no overlap:

| System | Fed by | Answers | Owns |
|---|---|---|---|
| Passive tree | XP (a point per level) | "What kind of hero am I?" | Broad stats (fire damage, life, attack and cast speed) and rule-changing keystones. Never changes a specific skill |
| Gems (Materia-style) | AP from riding | "How do my buttons play?" | Behaviour of their own skill only. Never general stats |
| Gear | Drops, crafting, boss uniques | "How strong am I, and what rules do I break?" | Stat affixes; uniques that bend rules |

- **Why it fits the loop:** character level is the main measure of being ready for deeper levels (par levels); AP means every easy ride grows something even without a drop; gear makes beats and bosses exciting; free gem swaps and cheap respecs give one character PoE-style flexibility; few bike buttons means depth comes from supports, not more skills.
- **Leaning: passive tree.** Small and readable on a phone (~60–80 nodes): fire, cold and lightning regions around a core of defence and utility, 3–4 keystones (Blood Magic moves here). Cheap respecs.
- **Leaning: soft level cap.** Past a point, levels get slower rather than stopping.
- **Leaning: gems.** 4 skill slots plus dash. Each slot starts with 1 support socket and unlocks up to 3 with level. Sockets live on the **skill bar**, not gear (a rare gear affix could add "+1 support socket").
  - Equipped gems earn full AP; **unequipped gems earn a small trickle**.
  - Gems level into new behaviour, not just numbers (Ember Cleave lv5 swings wider, lv10 leaves burning ground; Freeze support at max adds Shatter).
  - The current pick-1-of-3 level-up draft is retired; its notables become support gems (Twin Flame, Shatter, Conduit).
- **Leaning: gem tiers.** The same gem comes in better tiers (Ember Cleave I, II, III), each with higher base power, a higher level cap and a new top milestone. Behaviour carries forward, so a build keeps working.
  - **Tiers come mostly from regions** (Tier II from the Forest onward), with **rare jackpot drops** of a higher tier anywhere. Heat could raise those odds.
- **Leaning: fusing.** Fuse a gem into a better tier of the same gem for a head start (e.g. mastered Ember Cleave I makes Ember Cleave II start at level 6 of 20). Never a full transfer, so there's always room to grow.
  - **Rule: an upgrade never feels like a downgrade.** A fused gem is always at least as strong as the gem put in.
  - Any gem can be fused for some AP; mastered gems give a bonus. Duplicate drops become fuel. Support gems work the same way.
- **Open:** whether fusion replaces the FF7 "mastered gem spawns a copy" idea (leaning yes, to keep one clear ending for a mastered gem).

### Gem model in detail (leaning)

Terms:

| Term | Meaning |
|---|---|
| Skill | An action on a button (Ember Cleave, Frost Nova, Blink) |
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
| Flex B | Any attack or support skill gem | Level 10 (was 12; moved with the slower levelling, Nov 2026) | 2 (1 on unlock, 2 at L25) |
| Guard | Guard skill gems (shields, wards, decoys; shield arts from step 3⅞) | Level 1 | 1 |
| Evade | Evade gems (Roll, Blink, Phase, Smoke, Decoy Swap, Flame Dash) | Level 8 (level 1 from step 3⅞, with Roll) | 1 |

- Main is "main" because it has the most sockets and is always on the primary button; nothing else.
- Gems can be moved between any slots that accept them at any time outside a Trial.

Where skill gems come from (they drop as loot):
- **Shrines: four, once per character, only in the first world (Crypt).** Ride 1: choose 1 of 3 Main gems (Ember Cleave, Frost Strike, Thunder Slam) plus Magic Shield. Level 5: Flex A. Level 8: Evade (from step 3⅞: Roll from the start, the level 8 shrine offers Blink or Flame Dash to replace it). Level 10: Flex B. Each is 1 of 3 options for that slot and appears at the entrance of the next level so it can't be missed.
- **Shrine gems for Flex slots start at Main gem level − 2** (only shrine gems).
- Guardians: 1 guaranteed gem (skill or support) from the region pool.
- Trial bosses: their own signature gems.
- Random drops from beats and elites (heat raises the chance).

Levelling:
- Equipped gems earn full AP (kills and time riding); unequipped gems earn 10%.
- Tier caps: I = 10, II = 20, III = 30. Example milestones: Ember Cleave I lv5 swings wider, lv10 leaves burning ground; Ember Cleave II lv15 swings twice, lv20 throws a fire wave.
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
| Gems | Base damage and skill behaviour (kill speed) | Base ×3 (Ember Cleave I: 10 at lv1, 30 at lv10) |
| Tree | Multipliers, survival, identity | ~13 points: ~+60% to your element, plus life |
| Gear | Flat and % damage; all defence | ~×1.5 damage, plus armour and resistances |

Example: a fire knight through the Crypt (illustrative numbers):

| Ride | Level | Char lvl | Unlocks | Skill bar | Notes |
|---|---|---|---|---|---|
| 1 | Crypt 1 | 1→4 | Main, Guard | Ember Cleave I lv1→3, Magic Shield I | Choose Ember Cleave. Guardian drops Ignite |
| 2 | Crypt 2 | 4→7 | Flex A | Ember Cleave lv5 (wider), Frost Nova I | Shrine: Nova over Meteor/Arc |
| 3 | Crypt 3 | 7→10 | Evade | Ember Cleave lv7, Nova, Shield, Flame Dash I | First armour boots |
| 4 | Crypt 4 | 10→12 | Flex B | Ember Cleave lv9, Nova, Ward, Meteor I | First rare sword; Raise Skeletons to the gem bag |
| 5 | Crypt 5 | 12→14 | n/a | Ember Cleave lv10 (mastered: burning ground) | Fire resistance chest |
| 6 | Ashen King | 14 | n/a | Same | Win: Forest, Wattbringer, modifier hand unlocks |
| 7+ | Forest 1 | 14→17 | Main socket 2 | Ember Cleave II (fused, starts lv6) | Crafting unlocks |

- **Open:** whether random gem drops still feel exciting enough; the numbers above are untuned and the proportions are what matter.

**Built: gems v1 (Nov 2026).** Data in `src/data/gems.js`, logic in `src/game/gems.js`.
- Skill bar: Main (L1), Flex A (L5), Evade (L8), Flex B (L12), Guard (L1). Keys: LMB Main, RMB Flex A, Q Flex B, Space Guard, E Evade (also 1–5). RIDE: A Main, B Flex A, Z Flex B, right shifter Guard, and Evade on the left controller's power-up button (key U in the simulator; check this once the real controllers are tested).
- Held gems (Fireball, Arc) cast while the button is down and share one cast timer. Press gems (Frost Nova, Magic Shield, Flame Dash) cast once per press, and holding the button recasts whenever the gem is ready. Cooldowns and Flame Dash charges belong to the slot.
- A new character gets Magic Shield in Guard and picks Main (Fireball, Arc or Frost Nova) from a shrine panel before the first fight. **Later shrines appear in the world at the next map's entrance** (a glowing stone; walk into it), as the design says, rather than popping up mid-fight. A toast on level-up says a shrine is waiting. Flex shrines offer the attack gems you don't own yet (so Flex B is a single choice until step 2 adds gems); Evade offers Flame Dash only. Flex shrine gems start at Main gem level − 2.
- Gem levels: bar gems earn the character's kill XP on the character's curve; bag gems earn 10%. Cap 10. Base damage 4 × 1.1^(level − 1) for every gem, plus flat spell from gear; skills keep their own multipliers. One milestone at level 5 (Fireball pierces 1, Arc +2 chains, Frost Nova +25% radius, Magic Shield absorbs +25%, Flame Dash +1 charge).
- Passive notables that change one skill (Twin Flame, Searing Lance, Forked Sky, Warding, Ignite, Shatter, Conduit, Chain Reaction) are only offered once you own that gem; they move to support gems in step 3.
- Old saves have no gems: they're treated as fresh for gems (Magic Shield, then the Main shrine on load; shrines for any other unlocked slots wait at the map entrance).
- Gem panel (G or the GEMS button): tap a gem, then a slot. Moving a gem between slots swaps the two if each fits the other's slot.

**Built: more skills, step 2 (Nov 2026).** Each newer skill is its own module in `src/game/sk/`, registered in `src/game/casts.js`; tuning in `SK` (`src/data/skills.js`).

| Gem | Slot | What it does | Level 5 milestone |
|---|---|---|---|
| Frost Lance | Main, held | Slow, fast-flying cold lance; pierces 3 and chills everything it hits | Pierces 2 more |
| Raise Skeletons | Main, press | Raises one skeleton per cast (cap 3, 5 at gem level 8). They follow, fight awake monsters within 10 of you, and die; melee monsters and the guardian hit them. Physical damage (only generic % damage applies). Re-raised on each map | +1 skeleton |
| Flame Totem | Flex, press | Totem at the aim point shoots the nearest monster for 6s; one at a time | Lasts 50% longer |
| Meteor | Flex, press | Telegraphed circle, lands after 0.8s for a big fire hit, leaves burning ground | +30% radius |
| Blink | Evade, press | 2 charges. Jumps away from the nearest threat (no aiming), never into a wall | Frost burst where you stood |
| Frost Ward | Guard, press | 5s ring: chills monsters inside, light cold damage, you take 30% less | +25% radius |

- **Shrines:** Main offers Fireball, Frost Lance or Raise Skeletons. Flex shrines offer 3 gems you don't own from Arc, Frost Nova, Flame Totem, Meteor, Fireball and Frost Lance (the list rotates with your gem count, so different shrines show different options). Evade: Flame Dash or Blink. **Frost Ward has its own shrine at level 3** (`shrineLvl` in `SLOT_DEFS.guard`): it goes to the gem bag and you swap it into Guard yourself; old saves get it too.
- Arc and Frost Nova are Flex-only now (still usable in Main from the gem panel).
- Charges are generic (`charges` + `recharge` in `SK`); newer gems read their milestone from `S.mile[gem]`.
- **Balance (arena at par, seed 1234):** every Main gem clears every pack and guardian on tiers 1–5. Pack clears: Fireball 2–11s, Frost Lance 3–10s, Skeletons 4–13s (slowest on runner swarms and bloaters, safest on rares). Guardian: Fireball 63–92s, Frost Lance 58–91s, Skeletons 44–109s. **Open:** Skeletons kill tier 4–5 guardians in about 41–56s, at the low edge of the 45–100s target, because minions cost no mana on long fights; raising `BOSS.vsMinion` barely helps and slows tier 1 too much. Revisit in step 7 (balance pass 2).

**Built: gems v2, step 3 (Nov 2026).** Data in `src/data/gems.js` (`SUPPORTS`, `SLOT_DEFS[...].sock`, `GEM_POOL`, `GEM_DROP`, `FEED`), logic in `src/game/gems.js`, per-skill stats in `src/game/formulas.js`.
- **Per-skill stats.** `computeStats` gives every skill gem its own stats (`S.sk[gem]`: projectiles, pierce, chains, flags, `more` damage). Gear and passives feed every skill; a milestone or support only its own gem. Gear affixes like "Fireball fires +1 projectile" still feed Fireball until step 6 moves them.
- **Sockets live on the slot,** not the gem: Main 1 (2 at L15, 3 at L30, 4 at L45), Flex A and B 1 (2 at L25), Guard 1, Evade 1. A support that doesn't fit the gem now in the slot stays socketed but does nothing (shown struck out). Supports that fit a gem in use earn full XP; the same support can't go twice on one slot.
- **Supports (14).** The eight old notables (Twin Flame, Searing Lance, Forked Sky, Warding, Ignite, Shatter, Conduit, Chain Reaction) plus Split (Frost Lance), Bigger Army (Skeletons), Volley (Flame Totem), Twin Meteor (Meteor), Quick Step (Blink, Flame Dash: +1 charge) and Lingering Frost (Frost Ward). Shatter, Conduit and Chain Reaction now only follow their own skill: enemies frozen by Frost Nova, shocked by Arc, killed by Fireball. Ignite fits Fireball and Meteor.
- **Fan supports trade damage for coverage.** Twin Flame is +1 projectile at 40% less damage; Split is 3 lances at 60% less each; Bigger Army is +1 skeleton at 20% less damage each. Without that, every projectile hit a big target and guardians died in half the time. The first projectile always flies at the aim point and extras fan out either side, so a fan still hits one far target.
- **Support levels** use the same curve and cap as skill gems, but don't change the effect yet; their XP is feeding fuel (and fusing later). **Open:** give supports level milestones.
- **Gem drops:** guardians always drop one gem; rares 25% (`DROP.gem`). From the region pool (`GEM_POOL.crypt`: every skill gem and support); supports that fit a gem you own weigh 3×. Level = the tier's par Main gem level − 3. On the ground it's a spinning gem with a beam in the gem's colour; walking over it puts it in the gem bag (no limit), and the GEMS button glows.
- **Feeding:** in the gem panel, pick a spare gem, FEED INTO…, then tap any gem. Shares as in the table (same gem 100%, +25% if the fed gem is maxed; same kind 50%; otherwise 25%). Feeding your last copy leaves it at level 1; a fresh level 1 gem can't be fed (nothing to give); gems in use can't be fed. XP over the cap is lost (the preview says so).
- **Old saves:** the notable passives that became supports give their points back and the support gem goes in the bag (once per gem).
- **Level-up cards** no longer offer the notables, so they're weaker until the passive tree (step 4).
- **Balance tools:** `parSock(tier, mainGem)` in `src/data/balance.js` gives the Main gem its par support from tier 2 (`PAR_SUPPORT`). `npm run balance` shows it; the arena sockets it (`sock` in an arena spec).
- **Balance (arena at par, seed 1234):** every pack clears with every Main gem on tiers 1–5. Guardians on tiers 2–5: Fireball + Twin Flame 54–66s (64–78s before), Frost Lance + Split 48–68s (58–82s), Skeletons + Bigger Army 44–72s (41–73s before). These are from the repeatable arena (below). **Open:** Skeletons kill the tier 5 guardian in 44s, just under the 45s target; revisit in step 7. The starter staff still can't beat a tier 2+ guardian in the 2 minutes the test allows.
- Fixed on the way: a crowd of monsters could shove the hero into a wall (`separate` in `src/game/enemies.js` now pushes the hero back out).
- **All gameplay numbers moved to `src/data/`** (after step 3): support and milestone numbers sit with their text in `gems.js`; status effects, monster fighting, rare affixes, death blasts and the guardian in `monsters.js`; unique effects, item rolls and loot counts in `items.js`; hit spread, the XP curve, item scaling and the bag estimate in `balance.js`. CLAUDE.md lists where each kind of number goes. `npm test` checks that support and milestone text matches the numbers.
- **The arena is now repeatable.** The guardian's second nova wave and its loot used real-time timers, so they fired at random moments between arena fights (and never inside one), and the same code gave different numbers run to run. They run on game time now (`G.queue`, `k: 'later'`), which also means they pause with the game. The phase 2 double nova now really happens in arena guardian fights, so guardians deal more damage there than in earlier tables.

**Built: go melee, step 3¾ (Nov 2026).** The hero is a knight (`public/models/hero_knight.glb`: sword and round shield). Data in `src/data/gems.js` and `src/data/skills.js`, the attacks in `src/game/sk/strike.js`, the auto-attack in `src/game/gems.js`.

| Gem | Element | Shape | Feel | Level 5 | Support |
|---|---|---|---|---|---|
| Ember Cleave | fire | 150° cone, reach 2.4, 0.8 s swing | the all-rounder, hits the front of a pack | 25% wider, 15% further | Sweep: all the way round, 25% less damage |
| Frost Strike | cold | 90° cone, reach 2.1, 0.62 s | single target and rares; chills | every 3rd strike freezes (0.8 s) | Brittle: hit enemies take 20% more damage for 3 s (the shock status) |
| Thunder Slam | lightning | circle of 1.9 centred 1.5 ahead, 1.3 s | big hits, knockback, 35% shock | +25% radius | Aftershock: hits the same spot 0.4 s later for 35% |

- **A swing lands `windup` s after it starts,** from where you stand then, with a small knockback (Slam's is bigger) and a few frames of hit-stop. Each swing that connects gives `HERO.lifeOnHit` (1) life per monster hit, up to 3.
- **Auto-attack** (`autoTarget`): the melee Main gem swings at an awake monster in reach, the guardian and rares first, then the nearest. Sleeping monsters are left alone so you don't pull rooms. Steering away from the target by hand pauses it (walking toward it doesn't; autopilot steering never does). Holding LMB swings at the cursor as before. The **ATTACK: AUTO / HOLD** button (or T) turns it off; it's stored per device (`localStorage`) and written into `ctl.autoAtk` by the devices.
- **Autopilot** closes to 75% of the swing's reach and stands there, guardian or rare first; no kiting. `clearShot` is gone (nothing ranged needs it).
- **Raise Skeletons is a support** (`for: ['attack']`, so it fits any attack gem): a kill by the socketed skill has a 25% chance to rise as a skeleton where it fell, up to 3. Skeletons hit with, and scale with, the gem that raised them; their own kills count for you but not as the skill's, so they don't raise more. They crumble when no bar skill has the support. The old Bigger Army is gone; more chance or a bigger cap is for the tree and uniques later.
- **Retired:** Fireball, Frost Lance, their supports (Twin Flame, Searing Lance, Chain Reaction, Split, Bigger Army), the Fireball-only affixes (projectiles, pierce) and `G.proj`. Ignite moved to Ember Cleave (and Meteor), at 20% of the hit over 3 s (was 60%; on a melee gem that hits several monsters every swing, 60% was a 1.6× damage support). **Wattbringer**'s burning ground and **Heart of the Storm**'s Arc now work off melee swings (every 4th). Weapon bases are swords, axes and maces; "spell damage" reads "damage to skills" and cast speed reads "attack and cast speed" (the gear rework in step 6 renames them properly).
- **No save migration** (the game isn't released): the save key moved to `wd-arpg-2`, so old saves are ignored, and all the migration code (mana affixes, old notables, saves without gems) is gone.

### Fight mechanics: shield, roll, stagger (decided Nov 2026, build order step 3⅞)

**Why:** after going melee, the threats built for a kiting caster stopped being fair. The guardian's slam lands on the spot where the autopilot stands, its nova can't be dodged at sword range, and a melee kill puts you inside every death blast and burning aura. On the bike you can't steer, so these threats had no timing answer. The new direction is **Sekiro and Dark Souls**: readable telegraphs, a shield you block and parry with, a roll with invulnerability frames, posture and stagger on both sides, and missed telegraphs that really hurt.

**Core rule: every big threat is beaten by a button press, never by where you stand.** The autopilot decides where you stand and the rider decides when to press. Nothing rewards or punishes standing close or far (owner's call: no point-blank-safe novas, no attacks that are safe inside a ring, and no autopilot step-back after a kill). On keyboard and touch, walking out of a telegraph still works as a bonus, but no fight should need it.

- **Two kinds of incoming damage.**
  - Chip damage from normal monsters' swings is handled by stats (life, armour, life on hit). It can also be blocked.
  - Big telegraphed attacks need a button. Never more than one "must react" telegraph at a time.
- **The telegraph tells you which button answers it.** Each type has its own colour, a distinct sound (riders don't always watch the screen) and a hero-side cue (an exclamation mark over the hero, the shield glinting):

  | Telegraph | Look | Answer |
  |---|---|---|
  | Parry | weapon flashes yellow just before the hit | Guard just before it lands: parry, the attacker staggers |
  | Heavy | red ground or wind-up glow | Block with Guard for reduced damage (big posture cost), or roll through it for none |
  | Unblockable | purple glow (charges, grabs, some blasts) | Evade only. Blocking it breaks your guard |
  | Channel | blue charge-up bar on the monster | Fill its stagger to interrupt (heavy hits, parries, Surge) |

- **Missed telegraphs are punishing (owner's call).** At par, a missed guardian heavy takes about 35–50% of your life, so two or three misses kill you, and flasks don't cover sloppy play. Normal packs stay forgiving; rares and guardians are where the punishment lives. Windows start generous for Bluetooth lag (parry about 0.35 s in the Crypt) and tighten in deeper regions and with heat.

**Guard: the knight's shield** (the knight model already carries one; the KayKit packs have `Melee_Block`, `Melee_Blocking`, `Melee_Block_Hit`, `Melee_Block_Attack`).
- **Hold Guard to block.** Hits from the front are reduced (most physical damage, less elemental) and you move slower. Blocking costs posture (below). The shield also blocks projectiles from the front, so the guardian's nova is answered by blocking or rolling, not by standing in a gap.
- **A press just before a hit is a parry.** You take no damage and almost no posture, the attacker takes a big stagger hit, and your next swing is a riposte (`Melee_Block_Attack`, bonus damage).
- **Guard and Evade cancel your own swing's windup.** The Main gem auto-attacks, so the player didn't choose to commit to that swing and shouldn't be locked out of a parry by it.
- **Player posture instead of stamina** (so the "no mana, Surge is the only resource" rule holds). Blocking fills your posture bar, heavies fill it a lot, and parries barely fill it. It drains when you aren't blocking. If it fills up, your guard breaks: you're stunned for about 1.5 s (`Lie_Down`/`Lie_StandUp` after a big hit) and the next hit is a crit. Holding block forever isn't a strategy; parrying is.
- **Guard gems become shield arts** (leaning): the shield block and parry are built into the Guard button, and the Guard slot's gem changes what they do instead of being a separate timed buff.
  - Magic Shield: a perfect parry grants a barrier (and blocking absorbs a little more).
  - Frost Ward: parries chill the attacker and leave a short frost ring.
  - Later options include Thorns (blocking reflects damage) and Bulwark (blocking doesn't slow you).
  - **Open:** whether a press-to-cast Guard gem (the old Magic Shield) still has a place, maybe as a Flex gem.

**Evade from level 1** (owner's call). Every character starts with **Roll**, a starting Evade gem like Magic Shield is for Guard:
- a short roll (`Dodge_Forward`/`Backward`/`Left`/`Right`) with invulnerability frames for about 0.3–0.4 s and 2 charges
- with no direction held, it rolls away from the nearest threat like Blink, so it works without aiming on every device
- the autopilot waits about 0.8 s after an Evade before walking back in, so a roll out of a slam isn't undone by walking straight back into it
- the level 8 Evade shrine becomes a choice of Blink or Flame Dash to replace Roll
- every Evade gem gets invulnerability frames, and Flame Dash passes *through* the target instead of stopping in front of it
- the Evade slot now unlocks at level 1 (was 8)

**Stagger (enemy posture), on guardians and rares.** Each has a stagger bar. Parries fill it the most, then heavy hits (Thunder Slam, ripostes), and Surge makes your hits fill it faster. When it's full, the monster is stunned for about 3 s and takes more damage. The bar drains slowly if you stop pressing. The fight then runs in a loop: defend, break it, punish.
- **Channels are broken by stagger.** When a guardian charges a big spell, filling its bar in time cancels it.
- **Bike link:** in RIDE mode a short effort spike fills stagger faster during a channel ("break the channel with a short effort"). It stays optional, so recovery rides can still win by parrying.
- **Trials (later):** workout intervals can become stagger windows (the Juggernaut is staggered during intervals, the Warden's layers are stagger bars). Fits the Trials section without settling it.

**Threats rebuilt to this rule:**

| Threat | Today | Planned |
|---|---|---|
| Guardian swing | plain melee hit | 🟡 parryable; parries are the main way to stagger the guardian |
| Guardian slam | circle on you, 1.2 s | 🔴 heavy: block for reduced damage and a big posture hit, or roll through for none |
| Guardian nova | 14 bolts, undodgeable up close | Fired at the hero in a fan: block it with the shield or roll through. Phase 2 adds a second wave |
| Guardian summon | runners | Unchanged (Cleave clears them; skeletons rise from them) |
| Guardian enrage | faster, double nova | Adds a 🟣 unblockable charge (Evade only) and a 🔵 channel to break with stagger |
| Bloater | proximity fuse, then a blast you stand in | 🔴 heavy blast: block it or roll; killing it before the fuse ends defuses it |
| Volatile rare | death blast after 0.9 s | 🟣 unblockable blast: roll |
| Burning rare | constant aura | Pulses: a short wind-up, then a fire burst every few seconds, which you block or roll |
| Normal melee | 0.32 s windup chip hits | Blockable; elites' heavier swings are parryable |

**Dark Souls feel, beyond the fight rules** (leanings, not for this step): monsters can block too (the skeleton packs have block clips), heavy monsters have hyper-armour while winding up, and the death penalty could grow into a Souls-style "recover what you dropped" later (parked).

**Balance tools (planned):** the arena bot needs reaction skill as a setting: a perfect bot, a "good rider" bot (for example 70% of parries, 90% of rolls, with a reaction delay) and a no-defence bot. Targets: the good rider beats every guardian at par; the no-defence bot loses guardians and struggles with rares; the perfect bot is clearly faster, because parrying pays.

**Built: fight mechanics prototype (Nov 2026, step 3⅞ part 1).** The owner's call: test the mechanics with a plain attack before reworking any skills. Data in `SK.sword`, `SK.block`, `SK.roll` (`src/data/skills.js`), `STAGGER`, `BOSS`, `BLAST`, `RARE.burning` (`src/data/monsters.js`), `TELL` (`src/data/graphics.js`), `RIDE.autopilot.evadePause`; code in `src/game/sk/guard.js`, `src/game/sk/roll.js`, `stagger`/`parried`/`hurtP` in `src/game/combat.js`.
- **A new character starts with the Sword, the Knight's Shield and Roll** (Main, Guard and Evade filled; no Main shrine). The Sword is plain physical damage (110° cone, reach 2.2, 0.7 s), no milestone or element yet. Ember Cleave, Frost Strike and Thunder Slam are unchanged and still offered by Flex shrines and drops. The Evade slot is open from level 1 and its shrine moved to level 8 (`shrineLvl`), offering Blink or Flame Dash in place of Roll. Magic Shield and Frost Ward still work as before when swapped into Guard (not yet shield arts).
- **Knight's Shield:** hold Guard to block (150° in front, you turn to the nearest threat, move at 45%): a block takes off 75% of a normal hit, 50% of a heavy or elemental one. A press opens a 0.35 s parry window (not again for 0.7 s unless a parry lands): a parried hit does nothing, stuns a normal monster for 0.9 s or fills a guardian's or rare's stagger bar, and makes your next connecting swing within 2 s a riposte (1.8× damage). Raising the shield or rolling cancels the swing being wound up; nothing swings while you block.
- **Posture:** a blocked hit adds 1.5 × (its damage ÷ max life); a parry a tenth of that. It drains 30% a second after 1 s without a blocked hit. Full: guard broken for 1.6 s (stunned, can't move or act), taking 1.5× damage. The bar shows over the hero, filling from the middle out, only while it isn't empty.
- **Roll:** 2 charges (2.2 s recharge), 4 units in 0.42 s, untouchable for 0.4 s. It goes the way you steer, else away from the nearest threat (a slam's or charge's centre counts), sideways if a wall is in the way. One roll per press (Evade never repeats while held). After any Evade the autopilot stands still 0.8 s.
- **Telegraphs:** every threat aimed at you shows a coloured '!' over the hero with its own sound. Yellow: the guardian's and rares' swings (the guardian's windup is now 0.7 s), the guardian's nova. Red: the slam (now 4.5× damage), a bloater's fuse, a burning rare's pulse. Purple: the guardian's charge in phase 2 (1.1 s wind-up, then a rush through where you stood for 4.5×). The nova is now a fan of 7 bolts aimed at you (twice in phase 2), blocked by the shield.
- **Stagger:** guardians and rares have a bar under their life. A parry fills 30% (50% on a rare), hits fill 1.5 × the share of life they take (more while surging). Full: stunned 3 s (ability or swing cancelled), taking 30% more damage. It drains 6% a second after 2.5 s.
- **Death blasts:** a bloater only blows up when its fuse runs out (killed first, it's defused); a volatile rare's blast is unblockable. A burning rare pulses fire (heavy) every 3.2 s instead of a constant aura.
- **Clips:** `Melee_Block`, `Melee_Blocking`, `Melee_Block_Hit`, `Melee_Block_Attack` (parry), `Dodge_Backward/Left/Right`, `Lie_Down`, `Lie_StandUp` are in `anims_new.glb`, copied from the gallery by the new `scripts/add-clips.mjs` (and in `prep-models.mjs`'s list). The guardian plays `Hit_B` slowly while staggered.
- **Arena bot:** it never steps out of anything (like the autopilot) and answers each threat once at a reaction skill: default a good rider (parries 70% of swings it sees, rolls 90% of heavies and unblockables in time, else half the time blocks), `perfect`, or `careless` (never defends). The table counts parries, blocked hits, rolls and guard breaks.
- **Balance (arena, seed 1234, Sword at par):** packs clear in 3–11 s on every tier. Guardians: good rider 60–79 s, taking 75–264 damage; perfect 58–88 s, 61–118 taken; careless dies on tiers 1 and 5 and ends tiers 2–4 at 1–10% life with every flask spent (868–1079 taken). Rares: careless takes 88–138, the good rider 0–35. `npm run balance` reports every par number inside target. **Open:** the perfect bot is barely faster than the good rider, so stagger isn't yet paying off as much as it should (try a bigger parry fill or a longer stun); the starter-sword guardian rows now clear on tiers 3–5 in about 3.5 minutes (they died or timed out before).
- **Not built yet (part 2):** channels to break with stagger (and the RIDE short-effort bonus), shield arts (Magic Shield and Frost Ward changing the block and parry), Flame Dash going through the target, parryable elite swings with their own windups, a guardian rework past the Pale Warden.

### Evade gems

| Evade | Effect | Suits |
|---|---|---|
| Roll | Short roll with invulnerability frames; the starting Evade gem (step 3⅞) | Everyone, from level 1 |
| Blink | Teleport away from the nearest threat | All-rounders |
| Phase | Briefly intangible; attacks pass through | Melee, close range |
| Smoke | Invisible; enemies lose track of you | Snipers, Glass Cannon |
| Decoy Swap | Leave a decoy that draws aggro | Minions, turrets |

### Stats

- **Today** (`src/game/formulas.js`, tuning in `src/data/balance.js`): one flat pool. Level gives base life (there is no mana); base damage comes from the skill gem (gems v1, below); gear and passives all add into it; skill behaviour (projectiles, chains, pierce) sits in the same pool; defence is just life plus a little damage reduction; no attributes.
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
| Summoner's Pact | Raise Skeletons fits every slot and raises more | You barely attack yourself |
| Fortress | A flexible slot becomes a second defensive slot | Slower kills |

- **Leaning: variety comes from mechanics, not element or shape.** Pull, traps, marks, corpses, turrets, clones, charge-ups. Each named skill has its own element (Ember Cleave is fire) and the element adds flavour (burn, freeze, shock). Element conversion is a rare jackpot (uniques or rare supports), not a setup step.
- **Test for any new skill or keystone:** does a build using it play differently? Example builds that pass:

| Build | Main | Flexible | Defence | Keystone | Feels like |
|---|---|---|---|---|---|
| Flamebearer | Ember Cleave (Ignite, burning ground) | Meteor, Flame Totem | Fire ward | n/a | Wade in, everything around you burns |
| Death Knight | Frost Strike + Raise Skeletons | Corpse Explosion, Bone Armour | Decoy | Summoner's Pact | Every kill joins your army, blow up the bodies |
| Stormbreaker | Thunder Slam (Aftershock) | Frost Nova, Arc | Magic Shield | Glass Cannon | Time one huge slam, fragile |
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

- **Leaning: underpowered early, loot makes the difference.** Character level adds a little damage and mostly life; gear adds most damage. A new hero has a plain starter sword and needs 4–5 swings per skeleton. A full kit of magic gear roughly doubles to triples damage.
- **Leaning: sawtooth power curve.** Inside a level you outgrow the monsters as drops come in; the next level steps monster life up again. The biggest step is Crypt 1 → 2, because that's when the starter sword is expected to be gone.
- **No mana (Nov 2026).** Running out of mana only meant walking around doing nothing, so it's gone. Held skills are limited by their cast time, press skills by cooldowns and charges, and the **Surge gauge** is the only resource (see "Built: no mana, Surge gauge" below). Frost Nova has a 6 s cooldown.
- **Leaning: you start with a generic Magic Shield, not a movement skill.** It absorbs 35% of max life for 5 s on a 10 s cooldown, and fits every build (Flame Dash leaned too far toward a fire build). Movement skills come later through the Evade slot (level 8 shrine). It's the starting Guard gem (gems v1). **Changing in step 3⅞:** Guard becomes the knight's shield (block and parry), Magic Shield becomes a shield art, and everyone starts with Roll in Evade (see "Fight mechanics").
- **Targets** (at par level with par gear; exact numbers in `src/data/balance.js`):

| Thing | Target |
|---|---|
| Normal skeleton | 4–6 hits of the par Main gem (the Sword); Thunder Slam takes fewer by design |
| Normal pack | 4–15 s to clear |
| Rare | 8–25 s of single-target hits |
| Guardian | 45–100 s; an under-geared hero can't burn it down |
| Danger | A pack in melee kills you in 4–14 s if you stand in it and never Guard |
| Surge | Spending a full gauge on a guardian cuts it to 35–85 s (`guardianSurge`) |
| Loot | A full magic kit is ×1.3–3 the starter sword's damage |

**Harder start (Nov 2026, after the owner's first play of the fight prototype: "crazy easy", too much gear too quick, levelled too fast).** Aim: a challenge from the first pack, a little underpowered, gear that feels earned.
- **Slower levels.** XP curve 65 × level^1.6 (was 40 × level^1.55); deeper maps give more XP (`TIER.xp` 1, was .5) so the track stays even. A character that full-clears every map arrives at levels 1, 4.1, 5.9, 7.8, 9.7 (the balance report now prints this track), so **par levels are now 1, 4, 6, 8, 10** (were 1, 4, 7, 10, 12) and par gem levels the same. The Crypt ends around level 11–12. Flex B unlocks at level 10 (was 12) so it still arrives in the Crypt. Gems level on the same curve, so they slow down too.
- **Less gear.** Drops can now be plain (implicit only): 35% of drops are magic and 7% rare (was every drop magic or better, 20% rare). Normal monsters drop 1.2% (was 2.5%), magic 4% (was 8%); a rare's second item 10% (was 25%); the guardian drops 2 items (was 3). Rare packs are 15% of packs (was 25%), so rares feel special and fewer items come from them.
- **Monsters bite.** Zombies 48 life and 8 damage (were 40 and 5.5), runners 24 and 5.5 (20 and 4), archers 32 and 10 (28 and 8). Normal swings wind up 0.42 s (was 0.32): heavier and readable enough to parry. The guardian's base damage is 10.5 (was 12, eased after the heavies went up). A new hero needs about 5 swings per zombie.
- **Less free sustain.** Life on hit 0.4 per monster (was 1), flask charge per kill 0.05 (was 0.1): you heal by defending, not by swinging.
- **Arena (seed 1234):** a good rider clears every pack and guardian at par (guardians 61–96 s) but the first guardian takes it to 32% with 2 flasks, and in repeated tier 1 runs it ends at 16–75% life (it can die). Never defending loses every guardian on every tier and costs 45–55% of life against a rare pack. `npm run balance`: every par number inside target.
- **Open:** whether 4–5 swings per zombie feels good or slow once played; a plain item still fills an empty slot with its implicit, so the first map still gives a few upgrades.

### Testing balance without playing a level

Three layers, fastest first. Levels are the final polish pass, not the only check.

1. **`npm run balance`** (instant, no browser): maths from the game's own data and formulas (`src/game/formulas.js`). For each tier at par level and with each gear profile (starter sword, average magic kit, average rare kit) it prints hits to kill, pack clear time, rare and guardian kill time (without and with a full Surge gauge), how long you survive standing in a pack, XP per map and the gain from loot. Anything outside the targets is flagged. The Main gem only (`MAIN=<gem>`, default Ember Cleave), hitting `ESTIMATE.targets` monsters per swing in a pack, so it's a floor on real kill speed.
2. **`npm run arena`** (about 30 s, needs `npm run build`): real game code fights one encounter at a time (packs, magic, rare, guardian, under-geared, under-levelled) with a scripted player. The bot walks into swing reach and lets the auto-attack work; it plays the timing game well (Guard before hits it can see coming, step out of or Evade the guardian's slam); "careless" rows never Guard, Evade or step out. Real play sits between them. Shows clear time, damage taken, lowest life, flasks, Guard and Evade casts and time spent surging (the bot surges on rares, guardians and crowds of four; a "never surging" guardian row shows what the gauge is worth). In the browser: `__dbg.arena({ tier: 2, fight: [['zombie', 4]], gear: 'magic' })`.
3. **`npm test`** includes balance guard rails: a tier 1 pack isn't one-shot, the tier 1 guardian can't be burned down, the starter sword can't beat the tier 2 guardian, and the careless bot does clearly worse than the smart one on the tier 2 guardian. These catch regressions on every push.

Loop: change numbers in `src/data/` → `npm run balance` → `npm run arena` → play a level to feel it.

- **First pass results (Nov 2026):** every par number is inside target. Known gaps: melee packs barely touch a kiting player (knockback from Fireball plus slow skeletons), so the danger comes from archers, magic packs and rares; XP runs slightly behind par (fine while maps are small); maps are still one open square, so levels are quick and you can still run straight to the guardian. Next: finish the character systems (gems, skills, tree, defence, gear) and balance them together; level layout comes after (see `docs/build-order.md`).
- **Gems v1 (Nov 2026):** base damage moved from character level (`HERO.spellPer` is now 0) to the Main gem's level (`PAR_GEM` = 1, 4, 7, 9, 10 for tiers 1–5). Every par number in `npm run balance` is still inside target, and hits are within ~5% of before. In the arena the bot plays par bars (`parBar`: Fireball Main, Magic Shield, Frost Nova in Flex A from level 5); every par fight still clears. Guardians take 62–73 s (were 58–86 s); the tier 1 rare is quicker (19 s, was 30 s), the tier 2 rare slower (23 s, was 12 s). The starter staff still can't beat the tier 2, 4 or 5 guardian within 4 minutes; it just beats tier 3 (235 s).

- **Built: no mana, Surge gauge (Nov 2026).** Before, the arena bot spent 40–81 s of every 55–97 s guardian fight out of mana. Now:
  - **Mana is gone:** no pool, costs, orb, affixes (max mana, mana regen, mana per kill) or passives. Clarity became **Second Wind** (+15% Surge capacity and refill per point); Soul Hunger gives life only; **Blood Magic is removed** until it returns as Blood Rite in the passive tree (step 4). Old saves drop mana affixes (a ring's mana implicit becomes its new life implicit) and get passive points back for Blood Magic.
  - **Held skills cast slower** to make up for never running dry: Fireball 0.75 s (was 0.55), Frost Lance 1.25 s (was 1.1), Arc 0.8 s (was 0.6). Guardian life ×1.3 (800 → 1040), because bosses were the fights mana used to slow down most.
  - **Surge gauge** (`SURGE` in `src/data/skills.js`): 30 s of full surge; while surging, casts are 40% faster and cooldowns and charges recover 40% faster. It drains 1 s per second at full surge. Empty means **spent**: no surging until it refills to 30%. It refills at 0.35 s per second, starting 2 s after you stop, so a full refill takes about 90 s. Keyboard: hold Shift; touch: tap ⚡ on and off (bottom row, next to the flask; it switches itself off when spent, since one thumb can't hold it and a skill); RIDE: ride above 80% FTP (full surge from 105%), and below 65% FTP casts slow down (to half at 40%). The right orb is the gauge.
  - **Results:** `npm run balance`: every par number inside target; par guardians take 72–76 s never surging and 60–64 s with a full gauge. `npm run arena` (seed 1234): guardians take 48–61 s with the surging bot (74 s on tier 1 with the starter staff) and 65–73 s without (102 s on tier 1), so the gauge is worth roughly 15–25%; the starter staff takes 147–211 s on tiers 2–5 (it can't win the tier 2 guardian inside the 2 minute guard rail). Packs clear a little slower than before (5–15 s), because the mana pool no longer gives a free burst at the start of each fight.
  - **Autopilot fix found on the way:** it now waits for a clear shot (`clearShot` in `src/world/map.js`, the projectile's width along the whole line), not just line of sight, so it no longer stands still firing into a rock that clips every Fireball.

- **Go melee (step 3¾, Nov 2026).** Melee stands in the pack, so the danger had to move from chip damage to hits you can react to:
  - **Hero:** life 90 + 10 per level → 120 + 12 per level, plus 1 life per monster hit (up to 3 per swing).
  - **Guardian:** swing damage 16 → 12, slam 2× → 2.8× its damage with a slightly longer telegraph (1 s → 1.2 s, 0.75 → 0.9 s enraged), and fewer runners per summon (5 → 3, 7 → 5 enraged). The slam is now the hit that matters: Guard for it, step out or Evade.
  - **`npm run balance`** (each Main gem with its par support from tier 2): every par number inside target for all three gems. Ember Cleave: guardians 64–67 s never surging, packs 4.5–6.7 s; Frost Strike 53–56 s; Thunder Slam 57–60 s. Face-tank (never Guarding) 5.8–8.8 s on magic gear.
  - **`npm run arena`** (seed 1234): every par fight clears with all three gems on tiers 1–5. Packs clear in about the same time with each gem (Cleave 2–8 s, Frost Strike 2–13 s, Slam 2–14 s). Guardians with the surging bot: Cleave 49–87 s (87 s is tier 1 with the starter sword), Frost Strike 31–65 s, Slam 31–72 s; never surging, Frost Strike is 42–57 s on tiers 2–5.
  - **The careless rows (never Guard, Evade or step out) do clearly worse:** on guardians they take 3–6× the damage and use 2–4 flasks where the smart bot uses 0–1, and they die to the tier 1 guardian with every gem and to the tier 2 guardian with Ember Cleave. On rare packs they take 2–6× the damage. So melee buys the timing game we wanted.
  - **Open (step 7):** with the surging bot the tier 4–5 guardians die in about 30 s with Frost Strike and Thunder Slam (Surge covers most of the fight); normal packs barely hurt the smart bot (it Guards at the first windup), so the danger is mostly rares, bloaters and guardians. The starter sword now beats most tier 3–5 guardians in about 100–175 s (it still can't win tier 2 inside the 2 minute guard rail).

- **Sparse gear, no uniques in the Crypt (Nov 2026).** Drops were about 22 items and 1.6 uniques per tier 1 map (a unique could drop from the second monster). Now (`DROP` in `src/data/items.js`): normal monsters 2.5% (was 7%), magic 8% (was 20%), a rare's second item 25% (was 50%), guardians 3 items (was 5), rare item base 20% (was 25%), and **uniques only from tier 6** (`uniqueFrom`, the region after the Crypt). That's about 13 items per tier 1 map and 20 per tier 5 map, half of them from rares and the guardian; normal packs mostly give XP. **Open:** the balance tools still assume a full magic kit from tier 2 (`PAR_GEAR`), which sparser drops may not give; re-check in the gear rework (step 6) and balance pass 2 (step 7).

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

### Route choice (built Nov 2026)

The owner's call after playing: the autopilot shouldn't decide which way to go out of a room; force the choice, Zwift junctions crossed with Hades doors. Code in `src/game/route.js`, tuning `RIDE.junction` in `src/data/ride.js`.
- **When:** the autopilot has cleared the room it's in and picked up the loot, and the room has more than one way on that still leads to something to fight. It stops, a sign appears around the hero for each way (**Onward** toward the guardian, **Side room**, **Back** to something passed earlier, **Guardian** when the next room is the arena), the default glows gold, and a countdown runs: **5 s**.
- **Picking:** a D-pad tap (arrow keys in RIDE mode) toward a sign picks it and the autopilot goes at once. With no pick it takes the default when the countdown ends, and for **4 s** more the sign stays up and a tap still changes the way. Holding the D-pad still steers by hand. The minimap shows the chosen way as a dashed gold line. Each room asks once per map.
- **The default clears everything:** the room's side rooms first, then anything skipped behind you, then onward, so a full clear (which the par levels assume) needs no input. **Picking Onward by hand skips** the other ways for the rest of the map: the default stops going back for them (you can still pick them later).
- **Which room a pack belongs to:** the room it stands in, or for a corridor pack the far (higher-rank) end of its corridor.
- **Only in autopilot (RIDE).** With manual movement you walk where you like.
- **Later (beats, step 10):** a sign can say what's behind the door (elite, shrine, treasure, breather), so the choice shapes the ride like picking a Zwift route.

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
  - Autopilot needs route awareness (beats, junctions, guardian), not just "nearest thing". Built so far: it follows the room route, and with a melee Main gem it closes to the swing's reach and stands there (no kiting). **Junctions are built** (see "Route choice" below).
  - **Built (step 3¾):** the Main melee gem auto-attacks the guardian or a rare first, else the nearest awake monster in reach, on every device. Steering away by hand pauses it; the ATTACK toggle switches it to hold-to-attack.
- **Pedalling is a gate for movement, not a speed dial.** Above ~30–40% FTP you move at a fixed speed; below, a slow walk; at 0 W you stop. (Change from today, where speed keeps rising to 125% at 125% FTP.)
- **The main skill auto-attacks.** It picks the most important nearby target (elites first, then nearest). The same on every device; manual aim could be an option.
- **Power drives attack speed:** endurance pace (~65–70% FTP) = 100% attack rate; below it slows (e.g. 50% at 40% FTP); above it speeds up, draining the **Surge gauge**.
- **Surge gauge** (modelled on W′: drains when hard, refills when easy). **Everyone gets the same gauge, sized from FTP**; no calibration from the rider's real W′. Size ~30–60 s of hard effort. When empty, the bonus stops (back to 100%). Fitness shows up through choices: a rider who knows they can surge longer invests in capacity.
  - Why: it gates early content (you can't smash everything at 200%), keeps easy rides mostly easy with short surges at elites, ambushes and guardians, and makes heat a natural intensity dial (more pressure, more reason to surge).
  - **Firm rule: nothing removes the gauge's limit.** Builds reshape it, never make it endless.
- **Surge as a build axis, kept simple to start:** only **gauge capacity** (a few tree nodes, maybe one support gem).
  - Parked for later: surge strength, efficiency (diesel), on surge start / end effects, keystones such as Redline, surging speeding up cooldowns.
- **Movement speed is a stat** (gems, tree, gear): faster clears and better escapes. Cap around +50% so the autopilot and screen stay readable.
- **Skills use cooldowns, not mana** (built Nov 2026, see Balance). The Surge gauge is the only resource, and it's effort-based. Cooldown reduction is a stat, capped around 40%. Blood Magic becomes **Blood Rite**: no cooldowns, every cast costs life.
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

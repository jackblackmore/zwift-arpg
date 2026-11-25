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
- **Built (Nov 2026): passive tree v1.** 64 nodes, readable on a phone: fire, cold and lightning regions below a core of life and Surge, the shield and timing above, 4 keystones (Blood Magic came back as Blood Rite). Free respecs in safe rooms. See "Passive tree" below.
- **Leaning: soft level cap.** Past a point, levels get slower rather than stopping.
- **Leaning: gems.** 4 skill slots plus dash. Each slot starts with 1 support socket and unlocks up to 3 with level. Sockets live on the **skill bar**, not gear (a rare gear affix could add "+1 support socket").
  - Equipped gems earn full AP; **unequipped gems earn a small trickle**.
  - Gems level into new behaviour, not just numbers (Ember Cleave lv5 swings wider, lv10 leaves burning ground; Freeze support at max adds Shatter).
  - The pick-1-of-3 level-up draft is retired (the passive tree replaced it, Nov 2026); its notables became support gems (Twin Flame, Shatter, Conduit).
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
- Gem levels: bar gems earn the character's kill XP on the character's curve; bag gems earn 10%. Cap 10. Base damage 4 × 1.18^(level − 1) for every gem (1.1 until balance pass 2), plus flat spell from gear; skills keep their own multipliers. One milestone at level 5 (Fireball pierces 1, Arc +2 chains, Frost Nova +25% radius, Magic Shield absorbs +25%, Flame Dash +1 charge).
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
- **Guard gems are shield arts** (built Nov 2026: "Built: shield arts" below): the shield block and parry are built into the Guard button, and the Guard slot's gem changes what they do instead of being a separate timed buff.
  - Magic Shield: a parry grants a barrier (and blocking absorbs a little more).
  - Frost Ward: parries chill the attacker and leave a short frost ring.
  - Later options include Thorns (blocking reflects damage) and Bulwark (blocking doesn't slow you).
  - **Open:** whether a press-to-cast Guard gem (the old Magic Shield) still has a place, maybe as a Flex gem.

**Evade from level 1** (owner's call). Every character starts with **Roll**, a starting Evade gem like Magic Shield is for Guard:
- a short roll (`Dodge_Forward`/`Backward`/`Left`/`Right`) with invulnerability frames for about 0.3–0.4 s and 2 charges
- with no direction held, it rolls away from the nearest threat like Blink, so it works without aiming on every device
- the autopilot waits about 0.8 s after an Evade before walking back in, so a roll out of a slam isn't undone by walking straight back into it
- the level 8 Evade shrine becomes a choice of Blink or Flame Dash to replace Roll
- every Evade gem gets invulnerability frames, and Flame Dash passes *through* the target instead of stopping in front of it (built in part 2)
- the Evade slot now unlocks at level 1 (was 8)

**Stagger (enemy posture), on guardians and rares.** Each has a stagger bar. Parries fill it the most, then heavy hits (Thunder Slam, ripostes), and Surge makes your hits fill it faster. When it's full, the monster is stunned for about 3 s and takes more damage, and your first hit on it is a **finisher** (Sekiro's deathblow, built in part 2) for a big chunk of its life. A hit it lands on you knocks its bar back, so trading hits doesn't break it; timing does. The bar drains slowly if you stop pressing. The fight then runs in a loop: defend, break it, punish.
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
| Guardian enrage | faster, double nova | Adds a 🟣 unblockable charge (Evade only) and a 🔵 channel to break with stagger (built: "Built: guardian channels") |
| Bloater | proximity fuse, then a blast you stand in | 🔴 heavy blast: block it or roll; killing it before the fuse ends defuses it |
| Volatile rare | death blast after 0.9 s | 🟣 unblockable blast: roll |
| Burning rare | constant aura | Pulses: a short wind-up, then a fire burst every few seconds, which you block or roll |
| Normal melee | 0.32 s windup chip hits | Blockable; rares' swings are 🟡 parryable, and every few swings a rare winds up a 🔴 heavy one (built: "Built: elites' heavy swings") |

**Dark Souls feel, beyond the fight rules** (leanings, not for this step): monsters can block too (the skeleton packs have block clips), heavy monsters have hyper-armour while winding up, and the death penalty could grow into a Souls-style "recover what you dropped" later (parked).

**Balance tools (planned):** the arena bot needs reaction skill as a setting: a perfect bot, a "good rider" bot (for example 70% of parries, 90% of rolls, with a reaction delay) and a no-defence bot. Targets: the good rider beats every guardian at par; the no-defence bot loses guardians and struggles with rares; the perfect bot is clearly faster, because parrying pays.

**Built: fight mechanics prototype (Nov 2026, step 3⅞ part 1).** The owner's call: test the mechanics with a plain attack before reworking any skills. Data in `SK.sword`, `SK.block`, `SK.roll` (`src/data/skills.js`), `STAGGER`, `BOSS`, `BLAST`, `RARE.burning` (`src/data/monsters.js`), `TELL` (`src/data/graphics.js`), `RIDE.autopilot.evadePause`; code in `src/game/sk/guard.js`, `src/game/sk/roll.js`, `stagger`/`parried`/`hurtP` in `src/game/combat.js`.
- **A new character starts with the Sword, the Knight's Shield and Roll** (Main, Guard and Evade filled; no Main shrine). The Sword is plain physical damage (110° cone, reach 2.2, 0.7 s), no milestone or element yet. Ember Cleave, Frost Strike and Thunder Slam are unchanged and still offered by Flex shrines and drops. The Evade slot is open from level 1 and its shrine moved to level 8 (`shrineLvl`), offering Blink or Flame Dash in place of Roll. Magic Shield and Frost Ward still work as before when swapped into Guard (not yet shield arts).
- **Knight's Shield:** hold Guard to block (150° in front, you turn to the nearest threat, move at 45%): a block takes off 75% of a normal hit, 50% of a heavy or elemental one. A press opens a 0.35 s parry window (not again for 0.7 s unless a parry lands): a parried hit does nothing, stuns a normal monster for 0.9 s or fills a guardian's or rare's stagger bar, and makes your next connecting swing within 2 s a riposte (1.8× damage). Raising the shield or rolling cancels the swing being wound up; nothing swings while you block.
- **Posture:** a blocked hit adds 1.5 × (its damage ÷ max life); a parry a tenth of that. It drains 30% a second after 1 s without a blocked hit. Full: guard broken for 1.6 s (stunned, can't move or act), taking 1.5× damage. The bar shows over the hero, filling from the middle out, only while it isn't empty.
- **Roll:** 2 charges (2.2 s recharge), 4 units in 0.42 s, untouchable for 0.4 s. It goes the way you steer, else away from the nearest threat (a slam's or charge's centre counts), sideways if a wall is in the way. One roll per press (Evade never repeats while held). After any Evade the autopilot stands still 0.8 s.
- **Telegraphs:** every threat aimed at you shows a coloured '!' over the hero with its own sound. Yellow: the guardian's and rares' swings (the guardian's windup is now 0.7 s), the guardian's nova. Red: the slam (now 4.5× damage), a bloater's fuse, a burning rare's pulse. Purple: the guardian's charge in phase 2 (1.1 s wind-up, then a rush through where you stood for 4.5×). The nova is now a fan of 7 bolts aimed at you (twice in phase 2), blocked by the shield.
- **Stagger:** guardians and rares have a bar under their life. A parry fills 30% (50% on a rare), hits fill 1.5 × the share of life they take (more while surging). Full: stunned 3 s (ability or swing cancelled), taking 30% more damage. It drains 6% a second after 2.5 s. (Retuned with the finisher in part 2, below.)
- **Death blasts:** a bloater only blows up when its fuse runs out (killed first, it's defused); a volatile rare's blast is unblockable. A burning rare pulses fire (heavy) every 3.2 s instead of a constant aura.
- **Clips:** `Melee_Block`, `Melee_Blocking`, `Melee_Block_Hit`, `Melee_Block_Attack` (parry), `Dodge_Backward/Left/Right`, `Lie_Down`, `Lie_StandUp` are in `anims_new.glb`, copied from the gallery by the new `scripts/add-clips.mjs` (and in `prep-models.mjs`'s list). The guardian plays `Hit_B` slowly while staggered.
- **Arena bot:** it never steps out of anything (like the autopilot) and answers each threat once at a reaction skill: default a good rider (parries 70% of swings it sees, rolls 90% of heavies and unblockables in time, else half the time blocks), `perfect`, or `careless` (never defends). The table counts parries, blocked hits, rolls and guard breaks.
- **Balance (arena, seed 1234, Sword at par):** packs clear in 3–11 s on every tier. Guardians: good rider 60–79 s, taking 75–264 damage; perfect 58–88 s, 61–118 taken; careless dies on tiers 1 and 5 and ends tiers 2–4 at 1–10% life with every flask spent (868–1079 taken). Rares: careless takes 88–138, the good rider 0–35. `npm run balance` reports every par number inside target. **Open (fixed by the finisher, below):** the perfect bot is barely faster than the good rider, so stagger isn't yet paying off as much as it should; the starter-sword guardian rows now clear on tiers 3–5 in about 3.5 minutes (they died or timed out before).
- **Built: stagger payoff, the finisher (Nov 2026, step 3⅞ part 2 item 2).** The perfect bot was no faster than the good rider, so timing wasn't paying. Data in `STAGGER` (`src/data/monsters.js`); code in `hit`, `stagger` and `hurtP` in `src/game/combat.js`.
  - **Finisher:** the first hero hit on a staggered guardian or rare deals 3× (`finisher`), on top of the stun bonus and a riposte if the parry gave one. Damage over time and skeletons don't use it up. It shows as a white flash and burst, a big white "FINISHER" over the monster, a heavier screen shake and hit stop, and its own deep crunch (`SFX.finisher`).
  - **Breaking it is about parries now:** a parry fills 50% of a guardian's bar (was 30%; rares stay 50%), so two parries in a row break it; hits fill a third as much as before (`dmg` 0.5, was 1.5), so it doesn't break just from swinging; and every hit it lands on you that you didn't block or parry knocks 60% off its bar (`recover`), so sloppy play rarely breaks it. Stunned, it takes 15% more damage (was 30%), because the finisher is the payoff now.
  - **Arena bot:** the perfect bot no longer holds the block while waiting for its parry moment (`brace` in `SKILL`, `src/game/arena.js`), so it keeps swinging; the good rider still braces. `npm run arena` shows `stag` and `fin` (monsters staggered, finishers landed).
  - **Arena, guardians, mean of 6 seeds (4 before), clear time good rider / perfect:** tier 1 101 / 103 s → 79 / 54 s, tier 2 73 / 71 → 65 / 50, tier 3 68 / 71 → 66 / 47, tier 4 73 / 68 → 56 / 45, tier 5 65 / 62 → 62 / 46. Perfect is now 20–31% faster (was −4 to +8%). The good rider wins every run; careless loses every run on every tier (it won 1–2 of 4 on tiers 3–5 before), because without parries it almost never staggers the guardian. The good rider staggers it 2–6 times a fight, the perfect bot 3–7.
  - **`npm run arena` (seed 1234), guardians, before → after:** good rider 88, 78, 82, 79, 62 s → 78, 56, 55, 51, 73 s; perfect 98, 65, 65, 67, 61 s → 72, 40, 42, 44, 51 s; careless died on tiers 1, 3 and 5 and won tiers 2 and 4 at 1% and 12% life → dies on every tier. Rares with packs: 10–19 s → 11–16 s; careless rare packs take about the same or a little more damage. The starter-sword guardian now clears on tier 3 too (206 s). `npm run balance` doesn't model stagger and is unchanged (every par number inside target).
  - **Open (owner's call):** good-rider guardian fights got about 10–25% shorter on tiers 1, 2 and 4 (mean of seeds), because a good rider also lands finishers. If guardians now feel too short, raise the guardian's life (`BOSS` in `src/data/monsters.js`) rather than weaken the finisher; the perfect bot's tier 2–4 guardians (40–50 s) sit at the bottom of the 45–100 s target.
- **Built: guardian channels (Nov 2026, step 3⅞ part 2 item 3).** Data in `BOSS.channel` (`src/data/monsters.js`), `RIDE.spike` (`src/data/ride.js`), `TELL.channel` (`src/data/graphics.js`); code in `bossAI`/`channelDone` (`src/game/enemies.js`), `hit`/`parried`/`stun` (`src/game/combat.js`), `effortMods` (`src/game/update.js`).
  - **The channel (🔵):** phase 2 opens with one, and its rotation has two (`rotation2`). The guardian roots, a blue ring shows around it, a blue '!' and a rising hum (`SFX.cue('channel')`) cue it, and a blue bar under the boss bar fills over 3 s (`t`). It keeps swinging while it channels, every 0.8 s plus its 0.7 s windup (`swingCd`, first swing 0.2 s in), so there are always parries to make; it stops walking.
  - **Breaking it:** filling the stagger bar before the blue bar fills cancels the channel ("CHANNEL BROKEN") and staggers it, so the finisher applies. During a channel a parry fills × 1.25 (`parry`: 62% of the bar, so two parries always break it), hits fill × 4 (`hits`), and Surge makes hits fill × (1 + 6 × how hard) (`surge`) instead of the usual × 2: a surging Sword hit fills about 12% instead of under 1%. In RIDE mode an effort spike fills it directly: from 120% FTP, fully at 160%, 25% of the bar a second (`RIDE.spike`). It's optional: parrying alone breaks it.
  - **If it completes** (`effects`, alternating): first a **burst**, a 0.7 s purple wind-up (unblockable '!' and an 8-unit ring), then 5× its damage around it: roll it. Then a **mend**: it heals 10% of its life and summons 4 runners. The arena bot rolls the burst at its roll skill.
  - **Phase 2 is a little busier:** `abilGap2` 2.6 → 2.2 s between abilities, so the time spent channelling (and staggered after a break) doesn't make phase 2 easier: without it the good rider took about 30% less damage.
  - **Arena bot:** against a guardian it keeps 10 s of Surge back (`SAVE` in `src/game/arena.js`) and surges through every channel. `npm run arena` shows `chan` (channels broken / started).
  - **Arena, guardians, mean of seeds 1–6, before → after:** good rider 93, 66, 59, 51, 55 s → 86, 62, 59, 57, 58 s, winning every run, taking 219, 190, 153, 157, 142 → 224, 144, 142, 188, 201 a fight; perfect 52, 53, 55, 48, 44 → 55, 46, 49, 52, 44 s; careless lost 29 of 30 → all 30. Channels broken: good rider 48 of 66 (73%; by tier 9/17, 11/12, 7/12, 11/14, 10/11), perfect 45 of 46, good rider never surging 40 of 67 (60%), careless 0 of 24. `npm run arena` (seed 1234): good rider 78, 56, 55, 51, 73 s → 65, 52, 71, 50, 46 s, breaking 9 of 10 channels; perfect 72, 40, 42, 44, 51 → 59, 49, 46, 50, 39 s, 9 of 9; never surging 9 of 14. The starter-sword guardian rows (not a target) now clear tier 5 but not tiers 3–4 (it cleared tiers 3–4 before). `npm run balance` doesn't model stagger or channels and is unchanged.
  - **Tests** (`tests/sim.mjs`): breaking a channel's stagger cancels it and staggers the guardian; a completed channel bursts, the next mends and summons; Surge fills stagger faster during a channel; a RIDE effort spike fills it. The balance guard rail "perfect takes less than a good rider" now compares three tier 2 guardian fights each instead of one (one fight let a lucky good rider take less).
  - **Open (owner's call):** difficulty is about where it was. If a completed channel should punish more, raise `mend.heal` or `burst.dmg`; if channels are too easy to break, lower `hits` or `surge`. Tier 1 is the hardest place to break one (9 of 17: low-level hits fill little, so it's mostly parries). The perfect bot is 9–36% faster than the good rider by tier (tier 4 is under the 15% target: it was 6% on these seeds before).
- **Built: shield arts (Nov 2026, step 3⅞ part 2 item 4).** Data in `SK.shield`, `SK.ward` (`src/data/skills.js`), the gems' text, `warding` and `lingering` in `src/data/gems.js`; code in `src/game/sk/arts.js`, `blockStats`/`guardArt` in `src/game/sk/guard.js`. The old timed casts (`castShield`, `sk/ward.js`) are gone.
  - **Both arts keep the Knight's Shield's block and parry** (hold to block, press to parry, posture, stagger); `SK[art].guard` overrides some block numbers and the art adds to a parry. They are sidegrades: the Knight's Shield stays the balanced default with the full riposte.
  - **Magic Shield (safe, slower):** a parry wraps you in a barrier worth 12% of max life (`barrier`), stacking to 30% (`cap`), lasting 5 s from the last parry (`dur`); it soaks damage after the block, like the old Magic Shield. Blocks take off 82% of a hit (75% on the Knight's Shield) and 60% of a heavy (50%). The cost: its riposte is 1.3× (1.8×). Warding (+30%), its level 5 milestone (+25%) and gear's `shieldPct` make the barrier and its cap bigger. Shows as the blue bubble (it flares on each parry), "BARRIER +N", and the `+N` on the life orb.
  - **Frost Ward (control, a lighter block):** a parry chills the attacker for 2.5 s (`chill`; a guardian 0.8 s, `bossChill`) and leaves a frost ring of radius 2.6 where you stand for 3 s (`radius`, `dur`; at most 3 rings, `rings`). Monsters inside stay chilled (half speed, swings 1.6× apart, `STATUS`) and take 0.06× the Frost Ward gem's base as cold damage every 0.5 s. Rings don't chill guardians. The cost: blocks take off 65% (75%) and 40% of a heavy (50%). Lingering Frost: the parry chill and rings last 50% longer; the milestone: rings +25% radius. Shows as a frost decal with sparkles at the edge, a ring flash, "CHILLED" over the attacker, and a blue tint on every chilled monster (Frost Strike's chill too).
  - **Shrine:** the level 3 Guard shrine now offers Frost Ward or Magic Shield (pick one; it goes to the bag, the Knight's Shield stays in Guard until you swap). Before, Magic Shield couldn't be found anywhere.
  - **Arena, guardians, good rider, mean of seeds 1–12 (Knight's Shield / Magic Shield / Frost Ward):** time 83, 60, 62, 58, 55 s / 106, 67, 66, 69, 59 s / 71, 60, 56, 55, 53 s; taken 180, 141, 120, 140, 161 / 64, 57, 58, 58, 74 / 113, 124, 119, 168, 148. Every run won with every art. Magic Shield fights take 7–28% longer and about 40–65% less damage. Frost Ward is about even with the Knight's Shield (tier 1 a little easier: the rings slow its runners); with a 1.2 s guardian chill and 0.15× ring damage it was 10–20% faster, so both were cut (and rings no longer chill guardians). `npm run arena` has rows for both arts (rare + pack and guardian).
  - **Tests** (`tests/sim.mjs`, "shield arts"): a Magic Shield parry grants a barrier that stacks to its cap, absorbs damage, fades and gives a weaker riposte; Warding makes it 30% bigger; Magic Shield blocks take less and Frost Ward blocks more than the Knight's Shield; a Frost Ward parry chills the attacker (the guardian too) and leaves a ring that chills and bites only what's inside, ends and is capped; Lingering Frost lengthens both; rings clear with the map. The text check covers the arts' own numbers.
  - **Open (owner's call):** whether Magic Shield is too safe (it more than halves damage taken on guardians); if so, lower `SK.shield.barrier` or `cap`. Whether the old press-to-cast Magic Shield returns as a Flex gem (still open, above).
- **Built: elites' heavy swings, Flame Dash through the target, the Sword's milestone (Nov 2026, step 3⅞ part 2 items 5 and 6).** Data in `RARE.heavy` (`src/data/monsters.js`), `SK.dash` (`src/data/skills.js`), `GEMS.sword.mile` (`src/data/gems.js`); code in `startSwing` (`src/game/enemies.js`), `castDash` (`src/game/skills.js`), `land` (`src/game/sk/strike.js`).
  - **Rares' heavy swings (🔴):** a melee rare's swings at you stay parryable (yellow), but after every 2–3 of them (`every`) the next is a heavy: a 1 s wind-up (`windup`; 0.42 s for a normal swing) with a red glow on it, a red ground ring for its reach, the red '!' and the heavy cue sound, its attack clip played slower, then 3.2× its damage (`dmg`). It works like the guardian's slam: a parry press doesn't parry it, it blocks it (50% off, a big posture cost; less with Frost Ward, more with Magic Shield), and a roll avoids it. Staggering the rare during the wind-up cancels it. A missed heavy from a tier 1 rare zombie is about 35 damage (29% of a level 1 hero's life). Archer and bloater rares don't get one (they don't swing). The arena bot treats it as a heavy: it rolls it as it lands at its roll skill, else blocks half the time.
  - **Flame Dash goes through the target:** aimed at a monster, it dashes through it and ends 1.6 units past its far side (`past`; at most its 7.5 range), and every monster it passes takes 1.2× the gem's base as fire (`mult`) once and is knocked aside. Aimed at empty floor, it stops at the aim point as before; with no aim, it goes its full range the way you move. It still leaves burning ground and is untouchable for 0.3 s.
  - **The Sword's level 5 milestone:** every 3rd swing is a heavy cut (`every`): 20% more damage (`mult`) and 3× a normal swing's stagger fill (`stagger`), with "HEAVY CUT", a bigger flash, a double thud and more knockback. It mostly helps break a guardian's channel (a surging heavy cut fills about a third of the bar). The balance maths counts it as an average (+6.7% damage from Sword level 5, par tiers 3–5).
  - **Arena, mean of seeds 1–6, before → after (time / damage taken):** rare + pack, good rider 16/25, 14/46, 15/30, 14/23, 12/21 → 15/23, 15/29, 15/24, 14/28, 11/40 (s / taken, tiers 1–5); careless 267, 256, 233, 296, 235 → 274, 307, 317, 319, 408 taken (up 3–74%); perfect 0, 34, 5, 2, 0 → 0, 14, 0, 2, 0. Guardians (nothing changed on them but the Sword's milestone from tier 3; tiers 1–2 differ only by random seed drift): good rider 74, 60, 56, 60, 54 s → 78, 60, 51, 51, 55 s, every run won; perfect 52, 45, 51, 46, 47 → 54, 47, 43, 46, 41 s; careless loses all 30 (as before). `npm run arena` (seed 1234), good rider guardians 65, 70, 67, 57, 51 s → 62, 56, 68, 40, 43 s; perfect 59, 44, 61, 48, 42 → 59, 47, 43, 41, 41 s.
  - **`npm run balance`:** guardian times at par on tiers 3–5 go 67, 65, 62 s → 63, 61, 58 s, and zombie hits 4.4, 4.3, 4.1 → 4.2, 4.0, 3.8, so tiers 4 and 5 now read just under the 4–6 target (flagged ↓). Every other par number is inside target.
  - **Tests** (`tests/sim.mjs`): a rare eventually winds up a heavy swing with a longer windup that hits 3.2× as hard; a parry press only blocks it and a roll avoids it; Flame Dash ends beyond the monster it was aimed at and hits it; at level 5 the Sword's 3rd swing deals 20% more and fills 3× the stagger (level 4: no change). The text check covers the Sword's milestone.
  - **Open (owner's call):** a good rider rolls 90% of heavies in time, so in the arena rare packs got harder mostly for careless play; if they should push a good rider more, raise `RARE.heavy.dmg` or shorten `windup`. The two zombie-hit flags at tiers 4–5 come from the Sword's milestone; accept them, or lower `GEMS.sword.mile.mult`. The perfect bot is 10% faster than the good rider on tier 4 guardians (mean of 6 seeds), short of the 15% target; the other tiers are 16–31%.
- **Not built yet:** a guardian rework past the Pale Warden; heavy shots for archer rares.

### Evade gems

| Evade | Effect | Suits |
|---|---|---|
| Roll | Short roll with invulnerability frames; the starting Evade gem (step 3⅞) | Everyone, from level 1 |
| Blink | Teleport away from the nearest threat | All-rounders |
| Phase | Briefly intangible; attacks pass through | Melee, close range |
| Smoke | Invisible; enemies lose track of you | Snipers, Glass Cannon |
| Decoy Swap | Leave a decoy that draws aggro | Minions, turrets |

### Passive tree (built Nov 2026, build order step 4)

**What it is.** One point per character level after the first (level 10 = 9 points). It replaced the pick-1-of-3 level-up cards. Nodes in `src/data/tree.js` (each node's text next to its numbers; `npm test` checks every number is in the text), the rules in `src/game/tree.js`, the panel in `src/ui/tree.js`, the stats in `computeStats` (`src/game/formulas.js`: `st.fight` for the shield numbers, `st.ks` for keystones). Ownership as in "Stats": the tree gives % increases and survival, never flat damage or skill behaviour.

**Shape: 64 nodes on a 7 × 15 grid** (drawn tall on an upright phone, on its side on a wide screen), the start in the middle with 8 spokes:
- **Core (middle row):** life on the left (Hardy, Iron Body, Mending, Soul Hunger), Surge on the right (Deep Breath, **Second Wind** (the old card), Recovery, Deep Reserves), Field Medic (flasks heal more), Fleet Foot, and four spokes of plain damage, attack speed and crit.
- **The shield (top):** three branches. Left, **riposte** (Counterstroke, Vengeance, Punish) to the Riposte keystone; middle, the **parry window** (Quick Reflexes, Hair Trigger, Poise, Swordmaster) to Duelist; right, **block and posture** (Brace, Settle, Shieldwall, Stout, Anchored) to Bulwark. Between them: **roll** (Light Feet: Evade invulnerability; Tumbler: +1 Evade charge) and **stagger and finishers** (Measured, Clean Cut, Headsman, Executioner).
- **Elements (bottom):** fire on the left, cold in the middle, lightning on the right, from Elemental Focus. They boost Ember Cleave, Frost Strike and Thunder Slam and every Flex skill of that element. Pyromancy, Rime and Voltaics (the old cards) are the first notables; Wildfire, Winter's Heart and Thunderlord end each branch; Steam and Spark link neighbouring elements.
- **Power per point:** small nodes +6% damage, +10% to one element, +5% life, 10% posture or parry window; notables about twice that.

**Keystones (each at the end of a 6–7 point path; each costs something real):**

| Keystone | Gives | Costs |
|---|---|---|
| Riposte | Every parry ripostes at once: you strike the attacker back with your Main attack (the riposte takes the place of your next swing) | Blocked hits fill posture 50% faster |
| Bulwark | Blocking doesn't slow you; blocked hits fill posture 25% slower; a blocked hit fills the attacker's stagger 35% as much as a parry | No parry: a Guard press only blocks |
| Duelist | Parry window 60% longer | No block: holding Guard does nothing, heavies must be rolled |
| Blood Rite | Main and Flex skills ignore cooldowns and charges (at most one cast per 0.5 s) | Every cast costs 5% of max life (never the last of it); Evade keeps its charges |

**Respec (my call: cheap, but not mid-fight).** A full reset is free in the room you enter a map by and in a rest room, while no monster is awake nearby (`RESPEC.calm`). Anywhere, nodes taken since you opened the tree can be given back (a misclick isn't a respec). A node others hang from can't be given back on its own.

**The panel** (P or the TREE button; a red badge and a glow show unspent points; the level-up banner says "A passive tree point · press P"): tap a node to read it, tap a glowing one again (or TAKE) to spend a point. SUGGEST spends free points along the preset for your Main gem; RESET is free in a safe room. Held nodes are filled, takeable ones pulse gold, keystones are diamonds with their names. Upright phones scroll the tree (it opens centred); a phone on its side puts the text beside the tree.

**Balance tools.** `TREE_PRESETS` in `src/data/balance.js` are the orders a sensible player takes nodes in: `shield` for the Sword (posture, damage, parry window, life, then riposte, stagger, finishers), `fire`/`cold`/`light` for the elemental Main gems, and one per keystone. `parTree(level, mainGem)` takes one node per level after the first from the par preset (`PAR_TREE`), so `npm run balance`, `npm run arena` and `npm run level` all give the par hero a tree (`TREE=none` turns it off, `TREE=<preset>` picks another). `npm run balance` prints what the preset adds at each tier. The arena bot's parry odds now grow with the parry window (a good rider misses 30% at the base window, less with a longer one), and under Blood Rite it only casts above 60% life. The arena has rows for each keystone on tiers 4–5.

**Results (Nov 2026).**
- **Tree vs the card draft at par** (9 points at level 10, par magic gear; the card draft is the mean of 4000 simulated drafts with a sensible pick order): the Sword's `shield` preset gives ×1.14 DPS and +13% life (+52), plus a 30% longer parry window, +15% riposte damage, +10% stagger fill and 10% less posture; the card draft gave ×1.44 DPS and +8% life (+31). The `fire` preset gives Ember Cleave ×1.43 DPS and +13% life; the cards gave ×1.69 and +6%. So the tree is a little less raw power than the cards (by design: modest per point, and deterministic where the cards were luck), with the rest in timing.
- **`npm run balance`** (the maths never counted the cards): par hits on a zombie at tiers 2–5 go 4.2, 4.2, 4.0, 3.8 → 4.0, 3.8, 3.6, 3.5 (tiers 2–5 now flagged ↓, was tiers 4–5), guardians never surging 63, 63, 61, 58 s → 60, 57, 55, 51 s, packs about 5% faster, face-tank 4.7, 4.1 s → 5.3, 4.6 s on tiers 4–5.
- **Arena, mean of seeds 1–6, no tree → par tree** (the arena never counted the cards either): good rider guardians 67, 59, 59, 56, 52 s → 67, 57, 54, 50, 40 s, taking 155, 128, 121, 93, 124 → 155, 102, 119, 97, 49; perfect 55, 48, 49, 44, 43 → 55, 44, 46, 42, 37 s, so perfect is 8–23% faster than the good rider (tier 5 is under the 15% target). Rare + pack about the same (16–12 s, 9–22 taken). **Careless:** it still loses tiers 1–2, but now scrapes through tier 3 half the time (5% life left) and tiers 4–5 every time (27–33% left, all 3 flasks); without the tree it won 2 of 30 (tier 5). Tier 1 has no points, so it's unchanged.
- **Keystones (arena, guardian / rare + pack, means of 6 seeds, tiers 4 and 5; the par preset is 50, 40 s taking 97, 49):** Riposte 41, 37 s taking 92, 84 (quicker, takes a bit more); Duelist 43, 41 s taking 229, 210 (quicker, much riskier: heavies must be rolled); Bulwark 70, 68 s taking 212, 247 (slow and steady: no parries, so few finishers; it suits a rider who can't time parries); Blood Rite 51, 53 s taking 92, 118 (about par with Frost Nova in Flex A; costs life between fights). Rare packs 11–18 s for all.
- **`npm run level`** (10 seeds): 7.1, 6.6, 6.6, 6.9, 7.2 min (was 7.0, 6.5, 6.8, 7.2, 7.0); 2 deaths in 50 levels.
- **Open (owner's calls):** (1) and (2) done: careless play surviving tier 4–5 guardians and zombie hits under 4 were fixed on the monster side, tree unchanged ("Difficulty back after the passive tree" under Balance). (3) Bulwark is the weakest keystone for a good rider; raise its `bash` if it should compete. (4) Respec rule: free in the entrance room and rest rooms; say if it should cost something (gold doesn't exist yet) or be free anywhere out of a fight.

### Stats

- **Today** (`src/game/formulas.js`, tuning in `src/data/balance.js`): one flat pool. Level gives base life (there is no mana); base damage comes from the skill gem (gems v1, below); gear and passives all add into it; skill behaviour (projectiles, chains, pierce) sits in the same pool; defence is life, armour and resistances (step 5, "Defence" below), mostly from gear (step 6, "Gear" below); no attributes.
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

### Defence (built Nov 2026, build order step 5)

**Typed monster damage.** Every monster hit has a type: physical, fire, cold, lightning or poison (`DMG_TYPES` in `src/data/monsters.js`). A monster's attacks use `MT[type].dt` (default physical); attacks with their own type say so (`BOSS.dt`, `BLAST.*.dt`, `RARE.burning.dt`). The Crypt is physical and poison: zombies, runners, archers and the Warden's swings, slam and charge are physical; bloater blasts and the Warden's nova bolts are poison; burning rares' pulses and volatile blasts are fire; the Warden's channel burst is cold. A hit can also be a mix (`{ phys: .7, poison: .3 }`): **region leans** (`LEAN`) turn a share of every physical attack into the region's element on its tiers (Crypt none; Forest poison, Mines fire, Frozen Keep cold, Storm Spire lightning, Abyss a bit of each; first guesses until those regions are built). `hurtP` takes it as `{ from, kind, by, type }`.

**Hero defences** (`DEFENCE` in `src/data/balance.js`, maths in `defended` / `hitTaken` in `src/game/formulas.js`, shared by the game, `npm run balance` and the arena):
- **Armour** cuts a physical hit of d by A / (A + 10·d), at most 90% (Path of Exile's armour): the same armour takes a lot off chip damage and little off a heavy. At par on tier 5 (48 armour): 19% off a zombie swing, 15% off the Warden's swing, 5% off a rare's heavy, 4% off the slam. So armour softens packs; the big telegraphed hits still need a button.
- **Resistances** cut fire, cold, lightning and poison hits by their value, capped at 75% (they can go negative later, for heat or curses). Poison has its own resistance; "elemental" (fire, cold, lightning) affixes don't touch it.
- **A mixed hit** is cut part by part: armour on its physical part (judged on that part's size), resistances on the rest.
- **Order of operations** (`hurtP`, `src/game/combat.js`): 1. untouchable (rolling, dead) → miss; 2. the shield: parry (nothing), block (takes off its share; heavies `heavy`, other fire, cold or lightning hits `elem`) or a broken guard (×1.5), posture from the full hit; 3. armour and resistances on what the shield let through, with armour judged on the full hit (blocking a big hit doesn't make armour better against it); 4. "less damage taken" (`dr`; no source since the gear rework); 5. Magic Shield's barrier soaks; 6. life. Steps 2–4 multiply, so the order only matters for armour's size rule and for the barrier, which soaks what's left.

**Sources (minimal until the gear rework, step 6).** Item implicits (`IMPL` in `src/data/items.js`, now a list per slot): helms +7 armour, body armour +14, boots +5 (on top of their old implicits; grows with item level like other flat values). Two resistance affixes: "+6–12% to fire, cold and lightning resistance" (`resElem`) and "+10–20% to poison resistance" (`resPoison`), on helms, chests, boots, rings and amulets. Three tree nodes past Iron Body: **Plated** (+15% armour), **Tempered** (notable: +25% armour, +8% to all resistances), **Purity** (+12% poison resistance), a dead end of 3 points; no preset takes them, so par power is unchanged.

**Seeing it.** Damage you take floats in its type's colour with a glyph (✹ fire, ❄ cold, ϟ lightning, ☣ poison) and the screen-edge flash takes the colour (red for physical); colours in `DMG_COL` (`src/data/graphics.js`). The inventory shows a defence line under your gear: life, armour (and what it takes off a normal swing on this map) and each resistance ("(max)" when capped); the "if equipped" compare lists armour and resistance changes. Volatile blasts now burst orange (fire), bloaters stay green (poison).

**Balance.** Par magic gear (`GEAR_PROFILES`) now has its implicit armour plus poison resistance on the boots and elemental on the ring: 32, 37, 43, 48 armour and 16–19% poison, 10–12% elemental on tiers 2–5 (tier 1's par is the starter sword: no armour). To keep what reaches your life where it was, monster damage per tier is now an array like life (`TIER.dmg` 1, 1.54, 1.87, 2.21, 2.54, then +.34; was 1 + .28 per tier, i.e. 1.28, 1.56, 1.84, 2.12): ×1.2 from tier 2, which armour takes back off a normal swing.
- **`npm run balance`:** zombie hits unchanged (5.1, 4.2, 4.2, 4.2, 4.4); face-tank 4.5, 6.4, 5.2, 5.0, 4.4 → 4.5, 6.9, 5.6, 5.4, 4.6 s (now counted through `hitTaken`); every par number in target; a defence line per tier lists armour, resistances and the share cut off each kind of hit.
- **`npm run arena`** (seeds 1–6 full table, guardians also 7–12; means, before → after): good rider guardians win 239/240 → 239/240 (one tier 1 "never surging" loss on seed 7 both times), taking 114 → 132 a fight on average (seed noise is about ±10%; the extra is the big hits, now ×1.2 against 4–5% armour, so missed slams and heavies cost a bit more), times 64 → 64 s; perfect bot 31 → 30 taken, 50 → 48 s, 30, 22, 15, 16, 16% faster than the good rider on tiers 1–5 over 12 seeds (target 15%); careless loses every guardian (0/60 both), packs about the same (183 → 177 taken; one careless magic-pack death in 90); good-rider packs 16 → 16 taken. **Under-geared is harsher:** the starter sword against tier 2–5 guardians wins 39/48 → 20/48 (no armour against monsters that hit 20% harder): behind on gear now means more deaths, as "Stats" intends.
- **`npm run level -- 5 10`:** 6.8, 6.6, 7.1, 7.6, 8.5 → 7.1, 6.8, 7.0, 7.6, 8.1 min; all 50 cleared, 2 deaths in 50 (was 4).
- **Open:** (1) the under-geared starter-sword guardian is much harder now; if that's too harsh, give the hero a little base armour per level (`HERO`) and raise `TIER.dmg` for tier 1 to match. (2) Big hits net about 10–15% more for a hero at par; lower `BOSS.slamDmg` / `RARE.heavy.dmg` a touch if missed heavies feel too punishing. (3) Region leans are guesses.

### Gear (built Nov 2026, build order step 6)

**Ownership** as in "Stats": gear owns flat damage and most defence (armour, resistances, flat life), the tree % and survival, gems behaviour. Data in `src/data/items.js`, maths in `src/game/formulas.js`.

**Bases** (`BASE`): every base has its own implicits and a weight, so the base is a choice. Helm, body armour and boots come light, medium or heavy: heavy trades life or move speed for armour (Plate Cuirass 30 armour, 18 life, 5% reduced movement speed; Scale Vest 14 and 28; Ritual Wrap 4 and 42; Iron Greaves 11 armour and 2% movement speed; Wool Shoes 1 and 10%). Weapons trade flat damage against speed or crit (Bone Axe 7 damage and 6% reduced attack speed; Knight's Blade 4 and +3% crit; Ember Mace 5 and 10% fire). Rings and amulets have a different implicit each (life, poison or elemental resistance; damage, life or crit). Flat implicits grow with item level; percent ones don't. The item text says "heavy chest" or "light helm".

**Affixes** (`AFF`): added armour (+8–20 on helm, chest, boots), a resistance for each of fire, cold, lightning and poison (10–20%; the all-elemental one stays, rarer and smaller), +1 to the level of your Main gem (weapon, amulet; rare), +1 to the level of your Flex gems (helm, ring, amulet; rare), and "+1 support socket on your Main skill" (rare weapons only, `minRar`). Life, regeneration, life per kill, damage, elements, speed, crit and area stay. Gone: Arc chains (a support gem now, Forked Sky) and freeze duration (gem behaviour). **+gem levels** go to the gem in that bar slot and can pass the gem level cap (gear levels add on top of a level 10 gem); they count for milestones; the skill bar shows "L4+1". The extra socket appears in the gem panel and goes away with the item (the support in it stops counting).

**Uniques** (`UNIQ`, rule numbers in `EXTRA`, `npm test` checks every number is in its text): each bends a rule, with its base's implicits and one or two plain mods. Still only from tier 6 (`DROP.uniqueFrom`), so none in the Crypt.

| Unique | Slot (base) | Rule |
|---|---|---|
| Wattbringer | weapon (Ember Mace) | Melee hits set the ground burning |
| The Answering Bell | helm (Great Helm) | Parries release a shockwave of 80% of your Main attack within 3 units |
| Aegis of the Long Ride | chest (Plate Cuirass) | You keep your shield up while rolling: hits mid-roll are blocked from any side, unblockable ones as heavies, but rolls aren't untouchable |
| Breakaway Treads | boots (Wool Shoes) | Surge drains 40% slower, but you can't block (parries still work) |
| Frostbound Loop | ring (Coral Ring) | A free Frost Nova every 5 s |
| Headsman's Seal | ring (Iron Ring) | Finishers explode for 50% of their damage within 3.5 units |
| Heart of the Storm | amulet (Onyx Amulet) | Every 4th melee attack also casts Arc |

Dropped: The Glass Crown (+60% damage, −35% life: only numbers), Emberstride (move speed and Magic Shield numbers). The Aegis lost its "less damage taken" (`dr` stays in the maths, with no source).

**The upgrade check** (`estimate` in `src/game/stats.js`, `gearValue` in formulas.js): pack DPS of the Main gem × **effective life** × move speed^0.3, with the item against what you wear; above 1.02 the bag outlines it green and the compare says "an upgrade overall". Effective life (`ehp`) is max life over the share of a typical map's hits that armour and resistances let through (`ESTIMATE.threat` in `src/data/balance.js`: normal swings, archers, rare heavies, bloater blasts, the guardian's slam and poison bolts, burning pulses, weighted by what reaches your life; their types follow the region's lean). So poison resistance counts in the Crypt, fire resistance barely, and armour more against small hits. Example (tier 3 par): swapping a helm's 10% damage for +20 armour, +20% poison resistance and +20 life is an upgrade (1.08); for +20 life alone it isn't (0.97).

**Item level and tier** (the sawtooth in "Balance"; `npm run balance` prints it): each tier's par magic kit against the one from the tier before is DPS ×1.22, 1.04, 1.16, 1.13 and effective life ×1.10, 1.08, 1.08, 1.07 on tiers 2–5 (value 1.32, 1.11, 1.24, 1.19), so a new tier's drops are an upgrade; tier 3 is the smallest step because small flat rolls round to the same whole number (a 3-damage affix is 4 on both tiers 2 and 3). A rare kit beats a magic one by DPS ×1.31–1.36 and effective life ×1.36–1.38. Drop chances and rarity rolls are unchanged.

**Balance:** the par gear (`GEAR_PROFILES`, now an explicit affix list per slot on the medium bases) is the same kit as before, so `npm run balance` is unchanged (zombie hits 5.1, 4.2, 4.2, 4.2, 4.4; every par number in target). Arena (seeds 1–12, guardian rows): good rider wins every fight, 74, 62, 53, 63, 56 s; perfect 55, 47, 49, 48, 46 s; careless loses all 60. `npm run level -- 5 10`: 7.1, 6.5, 6.9, 7.4, 8.2 min, all 50 cleared, 3 deaths in 50. The starter sword against tier 2–5 guardians wins 19 of 48 (20 before): with no armour and a third of par damage it should lose more than par, and does. **Open:** the perfect bot's lead on tier 3 is 7–10% on these runs (target 15%; it was 13% on the same seeds before this step, so it's seed noise on an unchanged fight; step 7). Uniques have no arena rows yet (they don't drop in the Crypt).

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

- **Today:** tiers 1–3 are Crypt Halls, the Ossuary and Flooded Tombs, each with its own guardian (built Nov 2026, step 9 part A, below); tiers 4–5 still play the full Crypt mix with the Pale Warden. Missing for the Crypt: necromancer, bone knight, the high necromancer and the lieutenant (step 9 part B).

### Built: Crypt levels 1–3 (Nov 2026, build order step 9 part A)

Each map tier is now a level: `LEVELS` in `src/data/dungeon.js` (name, rule line, guardian, pack mix, layout tuning, chokepoint share, pools, light tint, clutter), pack mixes `MIX` and guardians `GUARDIANS` in `src/data/monsters.js`, poison pools `POOLS` (`src/data/dungeon.js`, `src/game/pools.js`). `levelOf(t)`, `packMix(t)`, `guardianId(t)` in `src/game/formulas.js`. The level's name shows on the entry banner and in the HUD (`MAP 2 · Ossuary`); the map viewer has a level button (L1–L5) that generates with that level's tuning, draws pools and names the level and guardian.

| Level | Layout | Packs (`MIX`) | Rule / dressing | Guardian |
|---|---|---|---|---|
| 1 Crypt Halls | open rooms (5–7 cells, few L shapes) | skeleton warriors and runners only, 4–5 a pack; rares are warriors | the default purple light | **Skeleton knight** |
| 2 Ossuary | narrow corridors: one tile wide (`corridor: 1`), rooms 4–6 | archers in 4 of 6 templates, 5 a pack; rares warriors or archers | a third of the packs hold the corridors (`choke`); bone-white light, twice the loose bones | **Bone archer captain** |
| 3 Flooded Tombs | standard | bloaters in 4 of 6 templates with archers and runners | **poison pools**; a green light | **Plague bloat** |
| 4 Bone Gardens, 5 Throne Approach | standard | every Crypt pack (`PACKS`) | until part B | the Pale Warden |

**Guardians: one framework.** The Pale Warden's code became data-driven: each guardian has `mt` (its look and numbers on top of `MT.boss`), a `rotation` and `rotation2` of ability keys, `abil` (ability specs by kind), a phase-2 `channel` (shared timing `CH`; its completed `effects` are abilities or a mend) and optional `phase2` (something that happens on enraging) and `summonCap`. Ability kinds (code in `bossAI`, `startAbility`, `landCast`, `src/game/enemies.js`): **area** (a heavy 🔴 or unblockable 🟣 hit at you, in front of it or round it; `jump` lands it there), **volley** (a fan of shots, 🟡 cue, blocked from the front), **shot** (🟣 an aimed line that tracks you, locks, then hits everything on it: roll), **charge** (🟣), **combo** (its next swings come quickly, each 🟡 parryable), **summon**. The Warden is unchanged in numbers (same slam, nova, charge, summon and channel). Every guardian staggers (two parries), takes finishers, enrages below half life and opens phase 2 with a channel you break with stagger. Its name and colour show on the boss bar, the minimap and its banners.
- **Skeleton knight** (Crypt Halls): the warrior skeleton with a sword and the large shield, steel-blue tint, 1250 life (Warden 1100). A **three-swing combo** (0.55 s wind-ups 0.3 s apart, each parryable), a **shield bash** (red, a 2.4 ring in front of it after 1.05 s, 4.5×: block or roll), calls 3 skeleton warriors (4 in phase 2); phase 2 adds a **lunge** (purple charge) and its channel ends in a **shockwave** round it (purple, roll) or a mend that calls 3 warriors. Clips: 1H chops and slices, `Melee_Block_Attack` for the bash, `Melee_1H_Attack_Stab` for the lunge.
- **Bone archer captain** (Ossuary): the rogue skeleton with the crossbow, bone tint. A **volley** of 5 arrows (0.7× each, blocked from the front; two volleys in phase 2), an **aimed shot** (a purple stripe on the floor tracks you for 1.1 s, brightens as it locks 0.25 s before, then 4.2× along the line: roll), kicks you parry when you're close, calls 1 archer (2 in phase 2; at most 3 of its archers alive, `summonCap`: uncapped they piled up and a good rider lost 1 fight in 2). Its channel ends in an **arrow rain** on you (red, block or roll) or a mend that calls 2 archers.
- **Plague bloat** (Flooded Tombs): a giant bloater (procedural like the bloaters, so it looks the same with or without the models), swelling as it winds up. A **belly slam** on you (red, 3.1, 4.5×), a **spew** of 6 poison globs (blocked), pustules that burst into 2 bloaters (3 in phase 2; kill them before their fuse ends); entering phase 2 it **bursts** into 3 bloaters at once, then **leaps** on you (purple: roll); its channel ends in a poison burst round it (purple) or a mend that spawns 3 bloaters.
- **Models:** no asset changes: the knight and captain reuse `skel_warrior.glb` and `skel_rogue.glb` with the blade, shield and crossbow already in `public/models/`, tinted and scaled; the bloat is the primitive bloater scaled up. The KayKit source packs aren't in this container, so nothing was added to the keep lists. Without the models every guardian is the primitive figure.
- **The Pale Warden** stays as the tier 4 and 5 guardian until part B brings the high necromancer and the lieutenant.

**Poison pools** (Flooded Tombs): about 11 a level in about 8 of its combat rooms (70% of combat rooms, 1–2 each, radius 1.5–2.4), laid out by the generator (`layPools`, after everything else, so a seed's layout is unchanged) clear of walls, of each other and of the corridor lines plus 1.2 (so the walk through a room stays dry). A dark pool with a green surface, a bright rim, a green glow and bubbles. Standing in one: 6 poison a second × the tier's damage growth (11 a second at tier 3), in half-second ticks; the shield doesn't stop it (it's the floor), poison resistance does. No pack is placed in one. The autopilot's steering walks round pools (unless what it's going to is right by one), and steps out of one toward its target when the target stands outside it; it fights in one when its target stands in it. This bends "never by where you stand" slightly, on purpose: the design asked for floor hazards, and they're chip damage, never a big threat.

**Numbers.** Arena, guardians, means of seeds 1–12 (good rider / perfect / careless wins), with the Pale Warden on the same tier for comparison:

| Tier | Guardian | Good rider | Taken | Perfect | Careless | Pale Warden here (good / perfect) |
|---|---|---|---|---|---|---|
| 1 | Skeleton knight | 80.5 s, 12/12 | 150 | 58.9 s (27% faster) | 0/12 | 79.8 s taking 168 / 56.9 s |
| 2 | Bone archer captain | 63.9 s, 12/12 | 196 | 51.8 s (19%) | 0/12 | 57.0 s taking 128 / 41.4 s |
| 3 | Plague bloat | 61.7 s, 12/12 | 162 | 50.4 s (18%) | 0/12 | 50.4 s taking 151 / 44.6 s |

Tier 1 is no easier (the knight is as long as the Warden there and hits about as hard); the captain and the bloat are a little longer and harder than the Warden was on their tiers. Builds (seeds 1–6): every build wins every tier 2–3 guardian; Frost Strike and Thunder Slam each lost 1 of 6 to the knight on tier 1 (tier 1 has no par supports); Thunder Slam is 31–36% faster than the Sword against the captain and the bloat (it clears their summons). `npm run level -- 5 10`: 6.7, 8.2, 7.0, 7.5, 8.2 minutes (was 6.7, 6.6, 6.9, 7.5, 8.2), all 50 cleared, 2 deaths; the Ossuary is 1.6 minutes longer (archers in the corridors) and its riders take about twice the damage; pools cost 0–51 life a Flooded Tombs level. `npm run balance` uses each level's mix: average packs 4.8, 5.8, 7.0 monsters on tiers 1–3 (were 4.4, 5.3, 6.2), packs a little slower to clear, map XP about the same. Saves: `KEY` is `wd-arpg-7`.

**Tests** (`npm test`, "Crypt levels" and "The new guardians"): each level's layouts are sound with its tuning (100 each), Crypt Halls' rooms are bigger and the Ossuary's doorways one tile; only Flooded Tombs has pools, all placed right; in play each tier shows its name, its packs come from its mix, its guardian waits behind the fog gate, seals it and opens it on death; a pool hurts poison through a raised shield, less with poison resistance, nothing outside; the autopilot's steering goes round a pool and steps out of one; for each new guardian every ability is the right kind of hit with the right '!' colour and is answered as designed (heavies and volleys blocked, unblockables rolled), its swings are parryable and two parries stagger it for a finisher, the knight's combo is three swings, it summons, enrages with a channel, the bloat bursts into bloaters, and it dies with its banner and loot.

**Open (owner's calls):** (1) the Ossuary is the hardest step (level damage about doubled, captain fights vary most: 49–113 s); lower the captain's `volley.dmg` or `summonCap`, or the archers in `MIX.ossuary`, if it's too much. (2) Pools bend the "button, not position" rule a little; they're chip damage only. (3) Thunder Slam is much faster against the guardians that summon. (4) The headless test hero now sometimes dies in the tier 1 packs before the guardian (bigger warrior packs), which the "harder start" wants.

## Balance

- **Leaning: underpowered early, loot makes the difference.** Character level adds a little damage and mostly life; gear adds most damage. A new hero has a plain starter sword and needs 4–5 swings per skeleton. A full kit of magic gear roughly doubles to triples damage.
- **Leaning: sawtooth power curve.** Inside a level you outgrow the monsters as drops come in; the next level steps monster life up again. The biggest step is Crypt 1 → 2, because that's when the starter sword is expected to be gone.
- **No mana (Nov 2026).** Running out of mana only meant walking around doing nothing, so it's gone. Held skills are limited by their cast time, press skills by cooldowns and charges, and the **Surge gauge** is the only resource (see "Built: no mana, Surge gauge" below). Frost Nova has a 6 s cooldown.
- **Leaning: you start with a generic Magic Shield, not a movement skill.** It absorbs 35% of max life for 5 s on a 10 s cooldown, and fits every build (Flame Dash leaned too far toward a fire build). Movement skills come later through the Evade slot (level 8 shrine). It's the starting Guard gem (gems v1). **Changed in step 3⅞:** Guard became the knight's shield (block and parry), Magic Shield a shield art (a parry grants a barrier), and everyone starts with Roll in Evade (see "Fight mechanics").
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

Four layers, fastest first. Levels are the final polish pass, not the only check.

1. **`npm run balance`** (instant, no browser): maths from the game's own data and formulas (`src/game/formulas.js`). For each tier at par level and with each gear profile (starter sword, average magic kit, average rare kit) it prints hits to kill, pack clear time, rare and guardian kill time (without and with a full Surge gauge), how long you survive standing in a pack, XP per map and the gain from loot. Anything outside the targets is flagged. The Main gem only (`MAIN=<gem>`, default the Sword), hitting `ESTIMATE.targets` monsters per swing in a pack, so it's a floor on real kill speed. Since balance pass 2 it also prints, at par: **effective life against each damage type** (and for the wrong-resistance kit), **time to kill with each Main gem build** (its par support and tree preset; packs, rares, the elite, the elite room and the guardian, ± against the Sword), and **power per system** (`powerSteps` in formulas.js: what one magic drop, one gem level, one tree point and one character level add to pack DPS × effective life, against `TARGETS.power`).
2. **`npm run arena`** (about 2 minutes for one seed, needs `npm run build`): real game code fights one encounter at a time (packs, magic, rare, guardian, under-geared, under-levelled) with a scripted player. The bot walks into swing reach and lets the auto-attack work; it plays the timing game well (Guard before hits it can see coming, step out of or Evade the guardian's slam); "careless" rows never Guard, Evade or step out. Real play sits between them. Shows clear time, damage taken, lowest life, flasks, Guard and Evade casts and time spent surging (the bot surges on rares, guardians and crowds of four; a "never surging" guardian row shows what the gauge is worth). In the browser: `__dbg.arena({ tier: 2, fight: [['zombie', 4]], gear: 'magic' })`. Since balance pass 2: every Crypt pack template, rares of each type, the elite room (`ELITE`, zombie and archer elites with their minions), each Main gem build (pack, rare, elite, guardian good / perfect / careless), behind par (starter sword, 2 levels under, gems 2 under), the wrong-resistance kit, and three uniques on tier 5; every fight restarts the random stream from its seed and the pages warm up first, so a row plays the same whatever ran before it. `SEEDS=12` plays every row on seeds 1–12 and prints means (wins, time, taken...), `TIERS=3-5` and `ONLY=<regex>` pick rows, `JOBS=n` sets how many browsers fight at once (default 4), `JSON=path` saves the results. The table ends with a **summary per tier** checked against `ARENA_TARGETS` (`src/data/balance.js`): builds within 25% of the Sword, the perfect bot 15% ahead, careless losing, the elite against a rare pack, behind-par and wrong-resistance rows, uniques.
3. **`npm run level`** (about a minute, needs `npm run build`): the RIDE autopilot plays whole levels at par with the arena bot's reaction skill and reports minutes per level, split into walking, fighting, the guardian, junction waits, loot and time dead (see "Level generation v2"). `npm run balance` prints a level-time estimate next to the last measured numbers. In the browser: `__dbg.levelRun({ tier: 2, seed: 7 })` (it replaces the current map and character).
4. **`npm test`** includes balance guard rails: a tier 1 pack isn't one-shot, the tier 1 guardian can't be burned down, the starter sword can't beat the tier 2 guardian, and the careless bot does clearly worse than the smart one on the tier 2 guardian. A tier 1 level run (layout seed 3, three junctions) must clear with its time split into walking, fighting, the guardian and junction waits. Balance pass 2 added: power per system inside `TARGETS.power` on tiers 2–5, the Sword's gem levels worth more than ×1.4 at tier 5, every Main gem build within 25% of the Sword on paper, the elite's life against a rare's, the wrong-resistance kit weaker against poison, a tier 2 elite room beaten at par and slower than a rare pack, careless play far worse with Frost Strike, and a unique row. These catch regressions on every push.

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
- **Difficulty back after the passive tree (Nov 2026).** The tree (+12% damage and +13% life at par on tiers 4–5) made fights shorter and let careless play survive late guardians, and `npm run balance` flagged zombie hits under 4 on tiers 2–5. The owner liked the hard start ("I have to use the shield and little surges or I die"), so the monsters were tuned back up; the tree's nodes are unchanged. Changes (`src/data/monsters.js`): monster life per tier `TIER.hp` 1, 2.5, 2.9, 3.4, 3.9 → 1, 2.65, 3.2, 3.95, 4.9 (tier 1 unchanged; guardians 2600–4056 → 2756–5096 life on tiers 2–5); damage growth `TIER.dmg` .25 → .28 per tier (tier 5 monsters hit 2.12× tier 1, was 2.0×); a hit a guardian or rare lands on you knocks 85% off its stagger bar (`STAGGER.recover`, was 60%), so trading hits gives fewer finishers and timing matters more.
  - **`npm run balance`:** zombie hits at tiers 2–5 4.0, 3.8, 3.6, 3.5 → 4.2, 4.2, 4.2, 4.4 (all inside 4–6 again); guardians never surging 60, 57, 55, 51 → 64, 63, 64, 64 s; packs 6.5–9.8 s; face-tank 6.4–4.4 s. Every par number inside target.
  - **Arena, guardians (mean of seeds 1–6, before → after):** good rider 76, 57, 56, 48, 40 → 76, 61, 57, 60, 54 s, taking 149, 122, 117, 80, 82 → 173, 123, 133, 158, 118 and winning every run (before the tree: 67, 59, 59, 56, 52 s); perfect 53, 41, 42, 39, 34 → 52, 49, 48, 48, 46 s, so perfect is 30, 28, 25, 19, 15% → 32, 20, 16, 20, 15% faster than the good rider (guardian rows only, seeds 1–12: 35, 22, 19, 20, 20%); **careless** won 0, 0, 3, 6, 6 of 6 on tiers 1–5 → **0 of 6 on every tier** (0 of 12 on seeds 1–12; before the tree it won 2 of 12 on tiers 4–5). Rare + pack: good rider 9–43 taken, careless 276–446 (about the same as before). Keystones on tiers 4/5: Riposte 50/49 s, Duelist 57/52 s (208/360 taken), Bulwark 83/88 s, Blood Rite 55/56 s.
  - **`npm run level -- 5 10`:** 6.9, 6.4, 6.9, 7.1, 7.5 → 6.9, 6.6, 7.1, 7.6, 8.6 min; all 50 levels cleared, 4 deaths in 50 (was 2; 3 of them on tier 5).
  - **Test harness:** the live tests and the arena now restart the seeded random stream once the page is ready (loading drew on it a varying number of times, so a seed didn't give the same run twice); `npm run arena` takes `ONLY=<regex>` to run just some rows (e.g. `ONLY='^guardian'`).
  - **Open:** if late guardians feel long, lower `TIER.hp` for tier 5 first (4.9 is what keeps the perfect bot 15% ahead there); if careless play should scrape through sometimes, `STAGGER.recover` back toward .6 is the gentlest knob.

### Balance pass 2 (built Nov 2026, build order step 7)

Every character system is in (gems and supports, fight mechanics, the tree, defence, gear), so the whole Crypt was checked on paper and in the arena with the full character: par gear with armour and resistances, par gem levels, the tree presets, the par supports and each Main gem build. Arena numbers are means over seeds (`SEEDS=24` for guardians, `SEEDS=12` for the rest); one guardian fight varies a lot (a standard deviation of 6–13 s), so a single seed says little and even 12 seeds move a percentage by ±5 points.

**Findings before tuning.**
- **Gem levels barely mattered.** A Main gem level added about 2% power at par (the gem's base was a quarter of the hit; flat damage from gear the rest), and the arena's "gems 2 under" rows fought as fast as par. "Stats" says damage comes from the gem.
- **Thunder Slam and Frost Strike were far ahead of the Sword:** guardians 39–47% and 17–30% faster on tiers 2–5, and careless play beat the tier 3–5 guardian with them (Slam 10–12 of 12, Frost Strike 10–12 of 12). Slam's big hits get more from ripostes, finishers and its shock than the maths counted; Frost Strike's chill kept the guardian slowed for the whole fight.
- **The perfect bot's lead** on Sword guardians was 13% on tier 3 and 10% on tier 5 (12 seeds): real, not noise.
- **Elites** (`ELITE`, untuned since room roles) were barely bigger than a rare pack, and careless play beat them on tiers 3–5 (11–12 of 12).

**Changes (all numbers in `src/data/`).**

| What | Before → after | Why |
|---|---|---|
| `GEM.grow` (base damage per gem level) | 1.1 → 1.18 | gem levels own damage: a level is now +4–6% power (was +2%) |
| `TIER.hp` tiers 1–5 (`hpAfter`) | 1, 2.65, 3.2, 3.95, 4.9 (.5) → 1, 2.79, 3.54, 4.59, 6.02 (.6) | pays for the stronger gems, so par kill times stay where they were |
| `SK.cleave.mult` | .93 → .78 | Ember Cleave's guardians within 10% of the Sword |
| `SK.fstrike.mult`; new `bossChill`, `bossFreeze` | .95 → .78; a guardian is chilled .15 s by a strike and .5 s by the milestone (was 2 s and 3 s) | the guardian isn't slowed all fight (one small code change in `sk/strike.js` reads the two numbers) |
| `SK.slam.mult`, `shockChance` | 1.5 → .95, .35 → .25 | Thunder Slam within 10% of the Sword |
| `STAGGER.finisher` | 3 → 4.2 | rewards breaking the bar: widens perfect over good rider |
| `BOSS.channel.hits`, `mend.heal` | 4 → 3, .1 → .15 | channels are broken by parries more than by hits; failing one costs more |
| `MT.boss.hp` | 1040 → 1100 | the bigger finisher shortened fights; tier 1 stays as hard |
| `ELITE.hp`, `ELITE.dmg` | 1.6 → 2.2, 1.1 → 1.35 | an elite room is a real fight |

The maths (`gemDps`) now counts Thunder Slam's shock and Ignite as one burn at a time (it counted every hit's burn). Gem drop rates, item drops and level length are unchanged.

**Guardians, good rider at par, 24 seeds** (seconds, wins of 24; ± against the Sword; before: 12 seeds, same tiers):

| Tier | Sword | Ember Cleave | Frost Strike | Thunder Slam | Before (Sword · Cleave · Strike · Slam) |
|---|---|---|---|---|---|
| 1 | 77 (23/24) | 102 (18/24) | 99 (22/24) | 99 (19/24) | 78 · 89 · 72 · 61 |
| 2 | 53 | 54 +2% | 55 +4% | 49 −6% | 58 · 44 −23% · 41 −30% · 31 −46% |
| 3 | 52 | 49 −5% | 47 −9% | 47 −10% | 53 · 46 −13% · 38 −28% · 30 −43% |
| 4 | 53 | 49 −7% | 48 −8% | 48 −8% | 56 · 47 −16% · 39 −30% · 30 −47% |
| 5 | 51 | 50 −2% | 49 −3% | 50 −2% | 51 · 45 −10% · 42 −17% · 31 −39% |

Tiers 2–5 are won 24 of 24 by every build. Tier 1 isn't a build tier (the other Main gems have no support yet, and you can't own one before the first guardian), so it isn't checked; the Sword lost 1 of 24 there (the good rider could always die on tier 1). Never surging, the Sword takes 86, 70, 65, 65, 58 s.

**Perfect vs good rider and careless** (24 seeds): the perfect bot is faster by Sword 27, 21, 14, 15, 15% (tiers 1–5; 14.5% on tier 5), Ember Cleave 21, 24, 11, 10, 5%, Frost Strike 26, 27, 24, 24, 20%, Thunder Slam 28, 15, 20, 21, 16%. **Careless play loses every guardian with every build: 0 of 24 on every tier** (before: Frost Strike won 34 of 48 on tiers 2–5, Thunder Slam 35 of 48). The Sword's lead on tiers 3–5 sits at 14–15%, on the target's edge; levers tried at 24 seeds (a bigger finisher, staggered monsters taking more, harder channels, a bigger riposte) moved it by about the noise. Ember Cleave's good rider is already near the fight's floor (the perfect bot needs about 42–45 s at par whatever the build), so its lead is small.

**Elites and rares** (12 seeds; time / damage taken, good rider):

| Tier | Rare + pack | Elite (zombie) | Elite archer | Elite, perfect | Elite, careless wins | Elite before (1.6×, 1.1×): time / taken, careless wins |
|---|---|---|---|---|---|---|
| 1 | 17 / 29 | 39 / 61 | 48 / 35 | 32 / 17 | 0/12 | 29 / 44, 2/12 |
| 2 | 14 / 61 | 34 / 86 | 39 / 48 | 28 / 23 | 2/12 | 23 / 55, 5/12 |
| 3 | 13 / 19 | 32 / 53 | 28 / 16 | 27 / 5 | 3/12 | 22 / 33, 11/12 |
| 4 | 13 / 19 | 33 / 105 | 28 / 22 | 28 / 11 | 7/12 | 23 / 49, 11/12 |
| 5 | 13 / 26 | 31 / 90 | 28 / 50 | 27 / 37 | 3/12 | 23 / 67, 12/12 |

An elite room now takes about 2.4× a rare pack's time and costs 1.4–5.5× the life (on tier 1 about half the hero's life), the good rider wins every one, and careless play loses most. With each build the elite takes 29–35 s on tiers 2–5. Rare archers take about as long as zombie rares; rare bloaters die in about 5 s.

**Packs** (12 seeds, good rider, tiers 1–5): every Crypt template clears in 4–12 s taking 0–40; magic packs 13–14 s; careless play takes 3–10× as much on packs and rare packs and still wins nearly all of them (it lost one tier 1 rare pack). On tiers 2–5 each build's mixed pack is within 25% of the Sword's.

**Behind par** (12 seeds, tiers 2–5; par guardian takes 82, 103, 108, 114):
- **Starter sword (under-geared):** guardians won 3, 8, 10, 8 of 12, in 144–163 s, taking 551–757; elites won but taking 169–286 (par 53–105).
- **Two levels under (character and gems):** guardians won, 60–80 s, taking 147–205 (1.4–2.4× par); elites taking 79–163.
- **Gems two under:** guardians 57–68 s (par 48–52), taking 147–201: behind on gems now means slower kills.

**Wrong resistances** (the par kit with fire where the poison resistance was, `GEAR_PROFILES.wrong`): the guardian takes 5–10% more (87 vs 82 ... 126 vs 114), careless bloater packs 12–15% more; a good rider rolls the bloaters' blasts, so its bloater packs are about the same. In the Crypt poison is only the bloaters' blasts and the guardian's bolts, so resistance is a small lever here; it matters from the Forest on (`LEAN`).

**Effective life by damage type** (`npm run balance`, par magic kit, tiers 2–5): life 265, 308, 400, 450; against a zombie swing 334, 384, 497, 556; against a rare's heavy 281, 326, 423, 475 (armour cuts big hits less); fire, cold, lightning 294, 342, 449, 511; poison 315, 371, 488, 556; the Crypt's mix 311, 360, 469, 528. The wrong kit: poison 265–450 (no resistance), fire 358–652.

**Power per system** (`npm run balance`, power = pack DPS × effective life, the Sword at par; `TARGETS.power`):

| Tier | A magic drop over a plain item | A new tier's item over last tier's | A gem level | A tree point (shield preset; elemental presets) | A character level's life |
|---|---|---|---|---|---|
| 1 | +23% | – | +4.0% | – | +5.7% |
| 2 | +22% | +5.1% | +4.3% | +1.7% (4–7%) | +4.5% |
| 3 | +19% | +2.0% | +5.2% | +1.9% (6–8%) | +3.9% |
| 4 | +19% | +3.7% | +5.8% | +3.2% (6–7%) | +3.5% |
| 5 | +18% | +2.9% | +6.4% | +2.9% (5–6%) | +2.9% |

Whole systems at tier 5 against none: the kit ×4.8 against the starter sword (was ×6.1), all ten gem levels ×1.54 (was ×1.25), the tree ×1.29. A drop is the biggest single step, a gem level about a third of one, a tree point a sixth (the shield preset's early points buy parry window and posture, which power doesn't count). The tier sawtooth is about the same (a new tier's par kit is worth ×1.33, 1.12, 1.23, 1.18 on tiers 2–5; was 1.32, 1.11, 1.24, 1.19).

**Uniques** (tier 5 guardian, 12 seeds, a look ahead: they drop from tier 6): The Answering Bell 59 s taking 175, Headsman's Seal 55 s taking 156, Heart of the Storm 57 s taking 153, against par 48 s taking 114. Each replaces a magic item's damage affix with a rule that doesn't make it up in a guardian fight, so as they stand they're sidegrades at best.

**Keystones** (tiers 4/5 guardians, 12 seeds): Riposte 45/45 s taking 144/166; Duelist 57/57 s taking 322/360; Blood Rite 58/57 s taking 137/156; Bulwark 96/95 s taking 434/487 (no parries means no finishers, and the finisher got bigger).

**Elsewhere:** `npm run balance`: every par number inside target, zombie hits 5.1, 4.2, 4.2, 4.2, 4.4, guardians never surging 82, 67, 67, 68, 68 s. `npm run level -- 5 10`: 6.7, 6.6, 6.9, 7.5, 8.2 min (was 7.1, 6.5, 6.9, 7.4, 8.2), all 50 cleared, 1 death in 50 (was 3).

**Open (owner's calls):** (1) the Sword's perfect lead on tiers 3–5 is 14–15%, on the edge of the 15% target. (2) A dropped Main gem is 3 levels under par (`GEM_DROP.lvlUnder`), and with gem levels mattering more it's about 15% weaker than the Sword you've levelled until it catches up or is fed. (3) Uniques lose to a par magic item in a guardian fight; give them a second plain mod or a stronger rule before tier 6. (4) Bulwark is now clearly the weakest keystone (raise its `bash`). (5) Resistances barely matter in the Crypt; fine if the Forest is where they start to.

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
- **Dressing** (`src/world/dungeon.js`): one floor tile per floor cell, KayKit walls on north, west and east edges, a low barrier on south edges (so a wall never hides the hero from the camera), pillars at corners, torches every few segments (capped), props per room by floor area (`OBSTACLE_DENSITY`), at most one brazier in a small room and two in a big one, a chest in each treasure room (room roles, below; it opens), the guardian's ring of posts inside its arena. Props keep 2.4 units clear of the corridor centre lines, so doorways and corridors never jam. With `dun.ready === false` the same layout is built from instanced boxes (low on south edges) and rocks, on the plain ground plane.
- **Packs:** one in each ordinary room first, then at chokepoints (corridor midpoints, about a sixth of the pack count), then extra packs in the biggest rooms, never within 13 units of the entrance or 9 of the guardian. Spawn positions fall back to the pack's own (clear) spot, so nothing spawns in a wall. Aggro dropped from 11.5 to 9 and now needs line of sight beyond 3.5 units (`PACK.aggro`, `PACK.aggroNear`), so a room wakes when you walk in, not through the wall.
- **Minimap:** dark until explored. Cells within 15 units and in line of sight are painted onto `G.mmBase` as you move; packs, monsters, the guardian marker and loot only show on seen cells.
- **Autopilot:** engages monsters it can see or that are awake, then loot, then the lowest-`rank` uncleared pack (so room to room along the route, side rooms as detours), then the guardian. Walking there goes through `steer`, so it takes corners.
- **Map viewer (dev, Nov 2026):** `/maps/` draws generated layouts from above by seed (rooms by kind, the route, junctions ◆, stats), one at a time or as a grid; "Play this map" opens the game with `?seed=N`, which fixes the layout of map tier t to seed N + t − 1 (packs stay random). For looking at what the generator makes while generation v2 is designed.
- **Decisions:** (1) Map grew from 68 to 141 units across; the enemy spatial hash offset went from 60 to 80 to cover it. (2) The walls are full cells for collision; the KayKit wall pieces sit on the edge of the floor cell, so the 3.2-unit-deep rock behind them is just dark. (3) The 20–30 minute target is not reached by walking: the route is about a minute to a minute and a half. The rest is fighting, so level length is now a pack count, monster HP and (later) beats question, to tune in step 7's balance pass. (4) Side rooms have no special content yet (just a chest and a few extra props); that belongs to the beats work.

### Route choice (built Nov 2026)

The owner's call after playing: the autopilot shouldn't decide which way to go out of a room; force the choice, Zwift junctions crossed with Hades doors. Code in `src/game/route.js`, tuning `RIDE.junction` in `src/data/ride.js`.
- **When:** the autopilot has cleared the room it's in and picked up the loot, and the room has more than one way on that still leads to something to fight. It stops, a sign appears around the hero for each way (**Onward** toward the guardian, **Side room**, **Back** to something passed earlier, **Guardian** when the next room is the arena), the default glows gold, and a countdown runs: **5 s**.
- **Picking:** a D-pad tap (arrow keys in RIDE mode) toward a sign picks it and the autopilot goes at once. With no pick it takes the default when the countdown ends, and for **4 s** more the sign stays up and a tap still changes the way. Holding the D-pad still steers by hand. The minimap shows the chosen way as a dashed gold line. Each room asks once per map.
- **The default clears everything:** the room's side rooms first, then anything skipped behind you, then onward, so a full clear (which the par levels assume) needs no input. **Picking Onward by hand skips** the other ways for the rest of the map: the default stops going back for them (you can still pick them later).
- **Which room a pack belongs to:** the room it stands in, or for a corridor pack the far (higher-rank) end of its corridor.
- **Only in autopilot (RIDE).** With manual movement you walk where you like.
- **Signs show roles (built Nov 2026, room roles):** each sign says what's behind the door ("☠ Elite", "Onward · ⚔ Combat", "Back · ✦ Treasure"), and a cleared way shows greyed with a ✓; see "Built: room roles" below.

### Level generation v2 (decided Nov 2026, build order step 10)

After the route choice went in, the owner's calls: give rooms roles, show what's behind a door, build levels on purpose toward the 30-minute ride, allow forks later but backtracking is fine, mark the choices already made, add hand-made set pieces, and give rooms real doors with fog gates. The room-and-corridor generator (step 8) stays; this puts content and a time budget on top of it.

- **Room roles.** The generator gives every room a role, and the role decides what's in it (the beat types above):

  | Role | What it is | Door sign | Rough time at par |
  |---|---|---|---|
  | Combat | normal packs (today's rooms) | ⚔ | 1–2 min |
  | Elite | a named rare with minions, better loot | ☠ | 2–3 min |
  | Ambush | the room seals and waves spawn | ⚠ | 2–3 min |
  | Treasure | a vault or chest, sometimes trapped or guarded | ✦ | about 1 min |
  | Shrine | a gamble: a buff, or a risk for better loot | ⛬ | under 1 min |
  | Rest | fountain or campfire: heal, refill flasks, a quiet minute | ☗ | about 1 min |
  | Guardian | the level's end, behind a fog gate | ♛ | 2–3 min |

  The times are first guesses; measuring them is the first build step.
- **Signs show the kind, not the exact reward** (Hades-style): the junction signs (Route choice above) carry the role's icon and name, for example "☠ Elite" or "☗ Rest". What exactly drops stays a surprise.
- **Choices already made are marked.** A sign for a way you've cleared shows greyed with a ✓; a Back sign shows what's still waiting behind you (for example "Back · ✦ Treasure"). Backtracking is fine: you can come back and choose again, and the default (clear everything) still works.
- **Built to a time budget.** Each role has an estimated time at par (fight time from the balance maths plus walking). The generator lays out a level, adds up the estimate and adjusts (more or fewer rooms, a bigger beat) until it lands near the target: **about 30 minutes for a full clear at par**, with skipping side branches making it shorter. `npm run balance` reports the estimate for a level and a headless run measures a real one, so changes that move levels toward 30 minutes are deliberate, not guessed.
- **The rhythm along the route:** warm-up combat rooms, then a small beat, a medium beat, a rest, another medium beat, a big beat, a quiet room, the guardian (the template in "Beats"). The main route carries the rhythm; side branches carry optional rewards (treasure, elite, shrine), so choosing a branch is choosing more risk and reward.
- **Forks later.** For now the level stays a tree (dead-end side rooms, walk back). Later, a few forks that rejoin: two ways to the same room, for example a short dangerous way and a longer safer one.
- **Hand-made set pieces.** A few authored room templates (guardian arena, vault, shrine room, rest room, ambush hall) the generator places into zones of the right size, for landmarks and so special rooms look special. (Built Nov 2026 for the guardian arena, vault, rest chapel and an elite hall: see "Built: set pieces" below. They dress the generated rooms rather than choosing room sizes.)
- **Real doors.** The generator records each room's doors (side, exact gap in the wall, the room it leads to) instead of working them out from corridor points. Doorways get a frame (the KayKit arched wall piece). **Fog gates** (Dark Souls) close the guardian's arena and elite rooms: walking through commits you to the fight until it's won (or you die). Signs stand at the real doorways.
- **Built: doors and the fog gate (Nov 2026, build step 2 and the guardian half of step 5).** Code in `src/world/gen.js` (`room.doors`, `doorCells`), `src/game/route.js`, `src/render/draw.js` (signs), `src/world/dungeon.js` and `src/world/map.js` (frames), `src/game/gate.js` (the gate), `src/maps/main.js` (viewer); gate settings `GATE` in `src/data/dungeon.js`.
  - **Doors:** every room carries `doors: [{ side, x, z, w, to, edge }]`: the side of the room (n, s, e, w; n is up the screen, s the camera side), the middle of the gap on the room's wall line, its width (2 cells, 6.4 units), the room the corridor leads to and the corridor's index in `edges`. One per corridor end; recorded by the generator as it lays the corridor, so layouts by seed are unchanged. `npm test` checks 200 layouts: every door sits on a real gap exactly as wide as it says, every gap in a room's wall has a door, walking out along the corridor reaches exactly the room `to` says, and the room at the other end has the twin door.
  - **Signs at the doorways:** a junction's signs now stand above the doorway each way leaves by (a gold diamond on the threshold, a line up to the sign); a doorway off screen keeps its sign at the screen edge, its arrow pointing the way. The D-pad pick and the minimap's dashed line use the same doorway.
  - **Door frames:** a decorated pillar each side of every doorway and, on north walls, a stone lintel across the top. Not the arched wall piece the plan named: in Dungeon Remastered `wall_arched` is a solid wall with an arch in relief, and the pack's real doorway pieces (`wall_doorway`, `wall_open_scaffold`) have one-tile openings, narrower than our two-cell doorways, so the frame is made of pieces already in `dungeon.glb` (the lintel is a plain wall piece squashed to a beam). No asset change. Lintels only on north walls: from the camera's height a lintel on a side wall reads as more wall and hides the doorway, and south walls stay low so they never hide the hero. Without the models, the same frame is built from boxes.
  - **Fog gate:** the guardian arena's doorway hangs with a faint mist from the start (you see it coming). Once you're 1.5 units inside and the guardian is awake and in the arena too (so it can never be shut out), it thickens with a whoosh and seals: its gap's cells become wall, so nothing walks, paths or sees through it. It opens for good when the guardian dies, and opens again if you die (you respawn at the entrance and the guardian resets, as before). The autopilot treats a sealed gate as a commitment: it goes back to the guardian rather than toward anything outside. The minimap draws the gate (white while sealed); the map viewer draws every door (gold bars) and the fog gate (a white misty bar). `npm test` checks that it seals, holds you and the autopilot in, opens when the guardian dies (and you can walk out), and opens when you die. `GATE.rooms` says which room kinds get one; elite rooms join when room roles are built (step 3).
  - **Level time unchanged:** `npm run level -- 5 10` after the change: 6.5, 6.2, 6.0, 6.8, 6.9 minutes for tiers 1–5 (was 6.8, 6.2, 6.1, 6.7, 6.8), all 50 levels cleared, no deaths. The gate doesn't change the fight; it only stops a retreat out of the arena, which the autopilot never made anyway.

- **Built: room roles (Nov 2026, build steps 3 and 4, and the elite half of step 5).** Only the agreed roles: combat, elite, treasure, rest and guardian (plus the entrance). Ambush and shrine rooms are left out until they're decided. Code in `src/world/gen.js` (`assignRoles`, `room.role`), `src/game/maps.js` (packs by role), `src/game/rooms.js` (chests, the rest flame), `src/game/gate.js` (gates on every gated room), `src/game/route.js` and `src/render/draw.js` (signs), `src/maps/main.js` (viewer); data `ROLES`, `RHYTHM`, `REST`, `GATE` in `src/data/dungeon.js`, `ELITE` in `src/data/monsters.js`, `DROP.elite`, `DROP.chest`, `CHEST` in `src/data/items.js`.
  - **Rhythm:** after the layout is made (so a seed's layout is unchanged), every room is combat except the entrance and the guardian's arena, then the beats in `RHYTHM.beats` each take one combat room within their stretch of the route (place = rank / (route rooms − 1); a side room counts its parent's place): an elite (25–80% of the way, side room preferred), a treasure room (20–70%, side preferred), a rest room (45–70%, route rooms only, half the levels), a second treasure (50–100%, side rooms only, half the levels) and a second elite (60–100%, side rooms only, a third of the levels). The first 20% of the route is combat only (warm-up). Over 200 layouts: every level has an elite (1.08 a level, 87% on side rooms) and a treasure room (1.16 a level, 59% on side rooms); **rest rooms appear on 56% of levels, never more than one, always on the route mid-way**; about 11 combat rooms a level.
  - **Combat:** today's packs. Packs now go only in combat rooms (and at chokepoints, never next to a rest room); the pack count per map is unchanged, so the special rooms' packs come out of it.
  - **Elite:** one pack in the room: a named rare ("Gloomfang, Crypt Lord": a rare's name plus a title) with one more affix than a rare, 1.6× a rare's life, 1.1× its damage, a little bigger, and minions (2 zombies and 2 runners, grown per tier like any pack; magic half the time). Its name shows bigger in orange with a ☠, and a banner when it wakes ("Elite · the doors seal until it falls"). A **fog gate** on every doorway of the room (`GATE.rooms` has `'elite'`): it seals once you're inside past every doorway with the elite awake in the room, opens for good when it dies, and opens if you die (the elite goes back to its spot, healed and asleep). Killing it drops 3 items (the first with a big rarity boost, `DROP.elite`) and 1.5× a rare's XP, and **no gem**: a normal rare's 25% gem chance is not given to elites, because gem drops are the owner's call (still undecided).
  - **Treasure:** a chest against a wall (the only chests now: the decorative chests in side rooms are gone, so a chest always means loot), glowing gold, on the minimap as a gold diamond. Walk up to it (2 units) and it opens: 2–3 items with a small rarity boost (`DROP.chest`), no gem. 40% of chests have a guard pack beside them (`CHEST.guarded`, one of the map's packs); while it lives the chest stays shut ("GUARDED").
  - **Rest:** no monsters and only one prop; a flame (a column with a triple candle, a ring of candles, a warm glow on a calm teal floor glow), a teal dot on the minimap. Step into the room with no monster awake within 10 units (`REST.calm`) and it heals you to full, refills the flasks and clears posture ("A QUIET FLAME"); it burns once per map, and waits if you need nothing (so walking through at full life doesn't waste it).
  - **Signs:** every way out of a junction shows the role of the room it leads to, in that role's colour ("☠ Elite", "✦ Treasure", "Onward · ⚔ Combat", "♛ Guardian"); Back shows the biggest thing still waiting behind you ("Back · ✦ Treasure"); a way with nothing left shows greyed with a ✓ and is never the default (and a D-pad tap skips it). The autopilot still stops only where two or more ways have something left. An unopened chest counts as something left.
  - **Autopilot:** an unopened chest in a room is a target after its packs (walking up opens it, then it picks up the loot); behind a sealed elite gate it goes back to the elite; it passes the rest room on the route, which heals it if it needs it.
  - **Map viewer:** rooms are coloured by role with the role's icon (route order under it, side rooms outlined blue), every fog gate drawn, a legend of the roles and a count per layout.
  - **Level time:** `npm run level -- 5 10`: 7.0, 6.5, 6.8, 7.2, 7.0 minutes for tiers 1–5 (was 6.5, 6.2, 6.0, 6.8, 6.9), all 50 cleared, no deaths: the elite fight adds a little. `npm run balance` now prints the role mix per level and adds up `ROLES[].est` (6.4 minutes; first guesses for build step 6 to calibrate).
  - **Screenshots:** the standard `SCREENSHOT=… npm test` shot had come out mostly black. Not a game bug: the camera eases after the hero each frame, and headless Chrome draws only a few frames a second, so after the test teleported the hero the camera was still looking at rock (and the hero was teleported to a spot that could be inside a wall). The shot now picks a clear spot in sight of a pack and snaps the camera (`__dbg.snapCam`), and also saves `-sign`, `-rest` and `-treasure` shots.
- **Built: set pieces (Nov 2026, build step 7).** Four authored room templates, for the agreed roles only (no ambush hall or shrine room until those are decided; the elite hall takes the ambush hall's place). The generator lays each one out after the roles (`setPieces` in `src/world/gen.js`, so a seed's rooms and roles are unchanged) as `room.set`: its pieces with circle colliders, the spot the room is built round and, for vaults, partition cells. `src/world/dungeon.js` builds them from pieces already in `dungeon.glb` (no asset change; benches and the plinth are wall pieces squashed to slabs, like the door lintel), `src/world/map.js` adds their colliders and builds them from plain shapes when the models aren't loaded; `src/game/rooms.js` puts the chest and the rest flame on their spots, `src/game/maps.js` the elite. Layout numbers in `SET` (`src/data/dungeon.js`); no gameplay numbers changed.
  - **Guardian arena:** a low dais (2 × 2 tiles, raised a little, a candle at each corner, a dim magenta sigil) under the guardian, four decorated pillars on the diagonals out by the walls (not as cover in the fight: monster projectiles stop at props, so pillars stay near the corners), a brazier in each corner, and the ring of gravestones and skull posts (now kept clear of the doorway's line).
  - **Vault (treasure rooms):** the chest on a stone plinth against the wall facing the way in, a brazier each side, coins. A treasure room with one doorway and at least 5 cells deep (about 30% of them) gets a partition wall across it with a gap on the doorway's line: an antechamber 2 cells deep, with coffins against the partition, and the vault behind (a guard pack, when there is one, waits near the chest). The chest's loot now flies out from in front of the plinth (it used to start inside the chest's collider, and inside the bigger plinth it got stuck: the autopilot couldn't reach it).
  - **Rest chapel:** the flame stands in the middle of the room's quietest part rather than the room's exact centre, which is where the corridors cross (the autopilot walks through it): of the points round the centre, the one furthest from the corridors. Stone benches on three sides of it, candles in the room's corners, nothing else.
  - **Elite hall:** the elite waits at the far end from the way in, between two braziers; a colonnade of pillars both sides of the aisle from the doorway (4.3 units from its line, 4.4 apart), coffins along the side walls.
  - **Rules every piece keeps:** inside its room, 0.9 units from walls, its radius plus 1.6 from every corridor centre line (so doorways and the walk through stay open), apart from the other pieces; anything that doesn't fit is left out. Random props and braziers stay out of set-piece rooms.
  - **Map viewer:** set-piece pieces drawn at true size (pillars, braziers, benches, coffins), the dais as a square, a ring on the chest, flame or elite; vault partitions are ordinary walls; the panel lists the level's set pieces.
  - **Tests (`npm test`):** 200 layouts (200 arenas, 237 vaults of which 69 have an antechamber, 98 chapels, 217 halls): every special room gets its set piece, doorways still sit on real gaps and lead where they say, a hero-sized circle can walk from the first doorway to every other and up to the chest, flame or elite round the pieces, no piece in a wall, across a corridor line, outside its room or in another piece. In the live game over 12 maps (4 of them without the models): every piece is a collider, the chest, flame and elite are on their spots, and none of the 179 monsters of those rooms and the guardian spawns inside a wall or a piece.
  - **Level time** (`npm run level -- 5 10`): 6.9, 6.4, 6.9, 7.1, 7.5 minutes for tiers 1–5 (was 7.0, 6.5, 6.8, 7.2, 7.0), all 50 cleared, 2 deaths. Tier 5 is half a minute slower, within the seed spread (its levels range from 6.5 to 8.4 minutes); the others moved less than 0.15.
- **Measured (Nov 2026, build step 1): a full clear at par takes about 6–7 minutes, not 30.** `npm run level` (needs `npm run build`; about a minute for tiers 1–5 × 5 seeds, `npm run level -- 5 10` for 10) has the RIDE autopilot play whole generated levels with the real game code, entrance to guardian killed, at par level, gear, bar and supports, with the arena bot's hands (a good rider: parries 70% of swings, rolls 90% of heavies; `src/game/bot.js`, shared with the arena). It rides at 75% FTP (full walking speed), goes to 105% when it wants Surge and 140% during a guardian's channel, and never picks at a junction, so the default (clear everything) runs and every junction costs the full 5 s wait. Code `src/game/levelrun.js`, settings `LEVEL_TIME` in `src/data/balance.js`. Means of seeds 1–10, game minutes (walk = walking room to room; fight = packs, including walking up to monsters it can see; stop = hit-stop, the real time big hits freeze the game for):

  | Tier | Total | Walk | Loot | Fight | Guardian | Junctions | Dead | Stop | Range |
  |---|---|---|---|---|---|---|---|---|---|
  | 1 | 6.8 | 1.2 | 0.1 | 3.5 | 1.3 | 0.2 | 0.0 | 0.4 | 6.0–7.5 |
  | 2 | 6.2 | 1.2 | 0.1 | 3.2 | 1.2 | 0.3 | 0.0 | 0.4 | 5.3–8.4 |
  | 3 | 6.1 | 1.1 | 0.1 | 3.3 | 1.1 | 0.2 | 0.0 | 0.4 | 5.3–7.0 |
  | 4 | 6.7 | 1.0 | 0.1 | 3.8 | 1.1 | 0.2 | 0.0 | 0.4 | 6.0–7.3 |
  | 5 | 6.8 | 1.0 | 0.1 | 4.1 | 1.0 | 0.2 | 0.0 | 0.5 | 5.7–7.4 |

  Every run cleared; 2 deaths in 50 levels; about 2.5 junction stops a level; 20–28 packs (`PACK.count`) in 15–16 rooms. Fighting is about 70% of the time, walking under 20%, junction waits about 4%. Packs take about 10 s each including the walk between monsters, so the time stays flat across tiers (monster life and hero damage rise together).
- **Estimate (`npm run balance`, last table):** walk = the room-to-room tour of a full clear (every corridor twice except the main route, mean 671 units over 200 layouts) at the par pace; + packs × the average pack's clear time (balance maths, Main gem only, magic packs included) + rare packs × the rare's kill time + the guardian with a full Surge gauge + junctions × 5 s. It says 7.0, 6.8, 7.6, 8.3, 9.1 minutes for tiers 1–5 against 6.8, 6.2, 6.1, 6.7, 6.8 measured: close on tier 1, 10–35% high on tiers 2–5, because its pack times grow with monster life while real fights also get Frost Nova (from level 5) and Surge on crowds. Its walk (2 min) is more than the measured walk bucket because the run counts walking up to visible monsters as fighting. The slack factors (`LEVEL_TIME.fightSlack`, `walkSlack`) are 1 until build step 6 calibrates them; `LEVEL_TIME.measured` holds the last measured means so the report shows both.
- **What it means:** levels are about a fifth of the 30-minute target. Walking and junctions are only about 1.5 minutes of it, so the extra 23 minutes have to come from content: more packs and rooms (the 4 × 4 zone grid holds at most 16 rooms; packs are capped at 28) and the beats (elite, ambush, rest, the bigger guardian arena), not from slower walking. Tougher monsters would also lengthen it, but would change how fights feel, which the owner liked. XP per map is tuned to today's pack count (the level track in `npm run balance`), so a longer level also moves the par levels unless XP per pack comes down with it.
- **Found on the way:** the RIDE autopilot could get stuck for good (about 1 level in 20) at a doorway where a prop stands next to the wall corner: pushed back and forth between them it never stood still long enough to count as stuck. Stuck now means "got less than 0.8 units in 0.8 s", and a second sidestep in a row backs off a little and goes the other way (`src/game/autopilot.js`). The level run also gives up (result "stuck", with where) after 3 minutes without a kill.

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

- **Built (step 6):** uniques bend rules ("Gear" above); affixes stay plain numbers plus +gem levels and a socket. **Open:** target farming via boss-specific unique drops.
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

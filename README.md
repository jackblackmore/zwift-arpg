# Watt Dungeon

An action RPG in the style of Path of Exile, built to be played on a Wahoo KICKR and Zwift Ride later. The game comes first: right now you control it with keyboard and mouse or touch. Bike controls come once the game is fun.

**Play:** https://jackblackmore.github.io/zwift-arpg/
**Original pedal demo** (auto-battler driven by power and cadence): https://jackblackmore.github.io/zwift-arpg/pedal/
**Asset gallery** (every KayKit character, animation and prop we've imported, to pick from): https://jackblackmore.github.io/zwift-arpg/gallery/

## Run it

```sh
npm install
npm run dev      # local dev server (ARPG at /, pedal demo at /pedal/, gallery at /gallery/)
npm run build    # production build into dist/
npm test         # headless playtest of both games and the gallery (needs Chrome; run build first)
SCREENSHOT=/tmp/shot.png npm test   # also saves an ARPG mid-fight screenshot
```

## Controls

- **Desktop:** WASD to move, mouse to aim. The Main melee attack swings on its own at whatever's in reach (T or the ATTACK button switches to hold-to-attack; holding LMB swings at the cursor). RMB is Flex A, Q Flex B, Space is Magic Shield (Guard), E Evade and F drinks a flask. G opens the gems, I the bag, P the passives, Esc closes panels.
- **RIDE mode** (MODE button): plays with only what a Zwift Ride and KICKR give you. You pedal to move: set power with the slider or <kbd>W</kbd>/<kbd>S</kbd>, and cadence with <kbd>A</kbd>/<kbd>D</kbd>; below 30% FTP you stand still. The D-pad steers (arrows). A is the Main attack (<kbd>K</kbd>, hold; it also auto-attacks), B is Flex A (<kbd>L</kbd>), Z is Flex B (<kbd>J</kbd>), and Y toggles autopilot (<kbd>I</kbd>), which walks you to the next fight, loot or pack and into swing reach. The right shifter is Magic Shield (<kbd>E</kbd>) and the left shifter drinks a flask (<kbd>Q</kbd>). There is no mana: riding above endurance pace (~80% FTP) surges (faster swings, casts and cooldowns while the Surge gauge drains), easing off refills it, below ~65% FTP casts slow down, and cadence above 80 rpm casts faster (up to +15%). The on-screen pad works on touch too.
- **Touch:** drag the left side to move; the Main attack swings on its own (moving away from a monster pauses it). The skill buttons on the right auto-aim at the nearest enemy. Walk over loot to pick it up.

## The ARPG

- **Graphics:** the hero (a knight with sword and shield) and the skeletons are animated KayKit characters (CC0, by Kay Lousberg) in `public/models/`, trimmed by `scripts/prep-models.mjs`. The skeletons share one rig, so a single set of enemy clips drives them all. Bloom, a vignette and soft shadows run through `src/render/post.js`. The **LOOK** button cycles four styles on the same models: Classic, Grim (desaturated, crushed blacks, heavy fog), Retro (PS1-style pixels, posterize, dither) and Toon (ink outlines, banded lighting). The **FX** button cycles quality: high (bloom + shadows), medium (bloom, the default on touch devices) and low (plain). If the models fail to load, the game falls back to the primitive models.

- **Skills:** the hero fights in melee. The Main gem is Ember Cleave (wide fire swing), Frost Strike (quick, narrow, chills) or Thunder Slam (slow, big, knocks back, shocks); it auto-attacks. Magic Shield absorbs a big hit (10s cooldown). Shrines add Frost Ward, Frost Nova, Arc, Meteor, Flame Totem, Flame Dash and Blink. Support gems change one skill each, including Raise Skeletons (that skill's kills rise as skeletons that fight for you). The life flask refills its charges on kills.
- **Monsters:** zombies, runners, archers and bloaters that explode. They come in packs of 6–14. Magic packs are blue. Rare leaders have yellow names and affixes: Hasted, Fortified, Burning, Splitting, Volatile or Frenzied.
- **Boss:** The Pale Warden uses telegraphed slams, a bolt nova and summons, and enrages at 50%. Killing it opens a portal to the next map tier, where monsters have +45% HP per tier.
- **Loot:** six gear slots in magic, rare and unique rarities. Each item has an implicit and 1–5 affixes. Drops show loot beams and labels. The bag compares an item against your current gear (Main attack DPS, life, move speed) and outlines upgrades in green. Uniques change how skills work: Wattbringer, Heart of the Storm, Emberstride, The Glass Crown, Frostbound Loop and Aegis of the Long Ride.
- **Passives:** each level, pick 1 of 3 (a passive tree replaces this in build step 4). Second Wind adds Surge capacity.
- **Save:** the character saves to localStorage on this device. Until release there's no save migration: a format change bumps the save key and old saves are ignored.

## Layout

```
index.html, src/          the ARPG
  main.js                 boot, main loop, window.__dbg test hooks
  core/                   shared state (G world, P player, S stats), helpers, audio
  data/                   tuning tables: monsters (+ their clips), skills, items/affixes/uniques, passives, dungeon layout, look
  input/input.js          the input layer: `ctl` is all the game reads
  input/devices.js        keyboard + mouse and touch devices that write into `ctl`
  input/ridesim.js        RIDE mode: simulated Zwift Ride pad + KICKR power/cadence, writes into `ctl`
  world/map.js            map generation, colliders, line of sight
  world/dungeon.js        the crypt built from KayKit Dungeon pieces (instanced), primitive rocks if they don't load
  game/                   rules: stats, combat, skills, enemies + AI, items, maps, save, tick
  render/                 three.js scene, assets, primitive + KayKit characters, post-processing, effects, drawing + overlay
  ui/                     HUD + minimap, panels (bag, passives, menu)
public/models/            trimmed KayKit .glb files: characters, extra clips, dungeon pieces (rebuild with scripts/prep-models.mjs)
gallery/, src/gallery/    asset gallery page: characters × both animation sets, held gear, prop packs
public/gallery/           gallery files: KayKit Adventurers, Skeletons, Character Animations 1.1, Dungeon Remastered, Halloween Bits, Medieval Hexagon, Forest Nature, Resource Bits (rebuild with scripts/prep-gallery.mjs)
pedal/                    the original pedal-driven demo (unchanged, its own src/)
tests/sim.mjs             headless playtest for both games and the gallery
```

Game code reads player input only from `ctl` in `src/input/input.js`: movement, an optional aim point, held skills and one-shot presses. The Zwift Ride and KICKR will become one more device writing into `ctl`, without touching game code.

## Testing hooks

`window.__dbg` exposes `G`, `P`, `S`, `ctl`, `start(fresh)`, `sim(n)` (advance n × 33 ms), `enemies()`, `packs()`, `items()`, `newMap(tier)`, `kill(e)`, `dropItem(x, z, boost)`, `equip(i)`, `openInv(v)`, `openPass()` and the `cast*` skill functions.

## Deploy

Every push to `main` builds, runs the playtest and deploys to GitHub Pages (Settings → Pages → Source: **GitHub Actions**).

## Roadmap

1. Make the ARPG fun: more skills, with skill gems and supports to swap; more monster types and biomes; a town, stash and crafting currency.
2. More art: build the dungeon from KayKit Dungeon Remastered (walls, doors, props), give bloaters and the boss their own models (Quaternius), and add sprite-sheet spell effects.
3. Tune RIDE mode on a real bike: the movement, power and Surge curves are in `src/data/ride.js`, and the button map is in `RIDE_BUTTONS`.
4. Last: Bluetooth. The KICKR via FTMS (Web Bluetooth) feeds `ride.pw`/`ride.cad`, and the Zwift Ride buttons call the same `press()` as the on-screen pad (`src/input/ridesim.js`).

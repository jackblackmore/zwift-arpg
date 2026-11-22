# Watt Dungeon

An action RPG in the style of Path of Exile, built to be played on a Wahoo KICKR and Zwift Ride later. The game comes first: right now you control it with keyboard and mouse or touch. Bike controls come once the game is fun.

**Play:** https://jackblackmore.github.io/zwift-arpg/
**Original pedal demo** (auto-battler driven by power and cadence): https://jackblackmore.github.io/zwift-arpg/pedal/

## Run it

```sh
npm install
npm run dev      # local dev server (ARPG at /, pedal demo at /pedal/)
npm run build    # production build into dist/
npm test         # headless playtest of both games (needs Chrome; run build first)
SCREENSHOT=/tmp/shot.png npm test   # also saves an ARPG mid-fight screenshot
```

## Controls

- **Desktop:** WASD to move, mouse to aim. LMB is Fireball, RMB is Arc, Q is Frost Nova, Space is Flame Dash and F drinks a flask. I opens the bag, P the passives, Esc closes panels.
- **Touch:** drag the left side to move. The skill buttons on the right auto-aim at the nearest enemy. Walk over loot to pick it up.

## The ARPG

- **Graphics:** the hero and the skeletons are animated KayKit characters (CC0, by Kay Lousberg) in `public/models/`, trimmed by `scripts/prep-models.mjs`. The skeletons share one rig, so a single set of enemy clips drives them all. Bloom, a vignette and soft shadows run through `src/render/post.js`. The **FX** button cycles quality: high (bloom + shadows), medium (bloom, the default on touch devices) and low (plain). If the models fail to load, the game falls back to the primitive models.

- **Skills:** Fireball explodes in an area, Arc chains between enemies, Frost Nova freezes (2.2s cooldown), and Flame Dash uses charges and leaves a burning trail. The life flask refills its charges on kills.
- **Monsters:** zombies, runners, archers and bloaters that explode. They come in packs of 6–14. Magic packs are blue. Rare leaders have yellow names and affixes: Hasted, Fortified, Burning, Splitting, Volatile or Frenzied.
- **Boss:** The Pale Warden uses telegraphed slams, a bolt nova and summons, and enrages at 50%. Killing it opens a portal to the next map tier, where monsters have +45% HP per tier.
- **Loot:** six gear slots in magic, rare and unique rarities. Each item has an implicit and 1–5 affixes. Drops show loot beams and labels. The bag compares an item against your current gear (Fireball DPS, life, move speed) and outlines upgrades in green. Uniques change how skills work: Wattbringer, Heart of the Storm, Emberstride, The Glass Crown, Frostbound Loop and Aegis of the Long Ride.
- **Passives:** each level, pick 1 of 3. Notables include Twin Flame, Searing Lance, Forked Sky, Ignite, Shatter, Conduit and Chain Reaction. The keystone is Blood Magic.
- **Save:** the character saves to localStorage on this device.

## Layout

```
index.html, src/          the ARPG
  main.js                 boot, main loop, window.__dbg test hooks
  core/                   shared state (G world, P player, S stats), helpers, audio
  data/                   tuning tables: monsters, skills, items/affixes/uniques, passives
  input/input.js          the input layer: `ctl` is all the game reads
  input/devices.js        keyboard + mouse and touch devices that write into `ctl`
  world/map.js            map generation, rock colliders, line of sight
  game/                   rules: stats, combat, skills, enemies + AI, items, maps, save, tick
  render/                 three.js scene, assets, primitive + KayKit characters, post-processing, effects, drawing + overlay
  ui/                     HUD + minimap, panels (bag, passives, menu)
public/models/            trimmed KayKit .glb files (rebuild with scripts/prep-models.mjs)
pedal/                    the original pedal-driven demo (unchanged, its own src/)
tests/sim.mjs             headless playtest for both
```

Game code reads player input only from `ctl` in `src/input/input.js`: movement, an optional aim point, held skills and one-shot presses. The Zwift Ride and KICKR will become one more device writing into `ctl`, without touching game code.

## Testing hooks

`window.__dbg` exposes `G`, `P`, `S`, `ctl`, `start(fresh)`, `sim(n)` (advance n × 33 ms), `enemies()`, `packs()`, `items()`, `newMap(tier)`, `kill(e)`, `dropItem(x, z, boost)`, `equip(i)`, `openInv(v)`, `openPass()` and the `cast*` skill functions.

## Deploy

Every push to `main` builds, runs the playtest and deploys to GitHub Pages (Settings → Pages → Source: **GitHub Actions**).

## Roadmap

1. Make the ARPG fun: more skills, with skill gems and supports to swap; more monster types and biomes; a town, stash and crafting currency.
2. More art: build the dungeon from KayKit Dungeon Remastered (walls, doors, props), give bloaters and the boss their own models (Quaternius), and add sprite-sheet spell effects.
3. Design the bike mapping, for example: movement auto-paths toward the next pack or loot, Zwift Ride buttons cast skills and steer, effort feeds mana and cast speed, and a surge triggers dash.
4. Last: Bluetooth. KICKR via FTMS (Web Bluetooth) and Zwift Ride buttons, added as a device in `src/input/`.

# Watt Dungeon

A Diablo-lite you pedal, for a Wahoo KICKR and a Zwift Ride. Effort is a currency, not a test: any riding banks kilojoules, so easy days still make progress. The hero explores and fights on its own. The rider picks the route at each fork, and that choice sets how hard the day is.

**Play:** https://jackblackmore.github.io/zwift-arpg/ (once Pages is enabled, see below)

## Run it

```sh
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm test         # headless playtest: two 12-minute simulated rides (needs Chrome)
```

## Layout

```
src/
  main.js            boot, main loop, window.__dbg test hooks
  core/              shared state, helpers, audio
  data/              tuning tables: zones, workouts, elements, tells, boons, rooms, loot names
  input/rider.js     rider input layer: manual sliders/keys and scripted riders
  world/             dungeon generation and pathfinding (map.js), meshes and fog of war (build.js)
  game/              rules: stats, combat, tells, enemies, loot, boons, path choices, floor setup, tick
  render/            three.js scene, models, effects, per-frame drawing
  ui/                HUD, ride summary, controls
tests/sim.mjs        headless playtest
```

The game reads power and cadence only from `rider` in `src/input/rider.js`. Each entry in `SOURCES` produces those numbers. Bluetooth (KICKR over FTMS, Zwift Ride buttons) gets added last, as one more source, without touching game code.

## Systems

- **Power and zones:** damage scales gently with %FTP. The zone sets the element: ❄ Frost below 87% FTP, 🔥 Fire at 87–105%, ⚡ Storm above 105%. Hitting a weakness does 2× damage.
- **Cadence:** sets attack speed and picks treasure locks (100+ rpm).
- **Sweet spot:** builds Strength stacks (+6% damage each, up to 10).
- **Above FTP:** adds crit chance, charges Overload and drains W′ (18 kJ, which recovers below FTP).
- **Cleave:** charged by total kJ.
- **Tells:** SURGE above 120% FTP, EASE OFF below 75% FTP, SPIN at 105+ rpm, HOLD at 85–105% FTP.
- **Rooms:** monster den, elite lair, treasure vault, campfire, and a boss (The Warden).
- **Loot and boons:** loot covers weapon, armour and relic slots in four rarities. There are eight boons.
- **Ride summary:** time, kJ, average power, NP, estimated TSS, time in zones, and the best drop.

## Testing hooks

`window.__dbg` exposes `S`, `hero`, `ride`, `rooms()`, `enemies()`, `floor()`, `sim(n)` (advance n × 50 ms), `start(mode)` (0 manual, 1 easy, 2 intervals), `metrics()`, `summary()` and `tell()`.

## Deploy

Every push to `main` builds, runs the playtest and deploys to GitHub Pages. One-time setup: in the repo, go to Settings → Pages → Build and deployment → Source and choose **GitHub Actions**.

## Roadmap

1. Polish the game using simulated rides: tell timings, room pacing, balance.
2. Replace the primitive models with animated low-poly packs (KayKit or Quaternius; check the licences).
3. Classes, elite affixes, more boss mechanics, a town and meta-progression, saved characters, .zwo workout import.
4. Last: Bluetooth. KICKR via FTMS (Web Bluetooth, Chrome on Android/Windows) and Zwift Ride buttons for path and boon choice.

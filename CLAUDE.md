# Watt Dungeon: notes for Claude

- Vanilla JS ES modules, Vite, and three.js **pinned to r128** (0.128.0). The lighting and colours are tuned for r128's legacy lighting. Upgrade three.js only as its own deliberate change.
- Shared mutable state lives in `src/core/state.js` (`S`, `hero`, `ride`) and `src/world/map.js` (`M`). Mutate fields on those objects; don't export reassignable `let`s.
- Game code reads effort only via `rider` (`src/input/rider.js`). New input types (Bluetooth FTMS, Zwift Ride) go in as entries in `SOURCES`. Never read sensors directly from game code.
- Tuning numbers live in `src/data/` where possible.
- The owner builds from his phone, so changes are checked headless: run `npm run build && npm test` before every push. To look at the game, take a screenshot with `SCREENSHOT=/tmp/shot.png npm test`.
- Bluetooth is deliberately last. The current focus is polishing the game loop with simulated rides.
- Pushing to `main` deploys to GitHub Pages.

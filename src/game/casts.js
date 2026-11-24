// Skill gem → cast function, plus per-tick updaters and map-clear hooks for skills that leave things in the world.
// Arc, Frost Nova and Flame Dash live in game/skills.js; Guard gems aren't cast (game/sk/guard.js runs the shield from updPlayer, game/sk/arts.js the shield arts); the melee attacks share game/sk/strike.js. Each newer skill lives in its own module, src/game/sk/<gem>.js, whose
// default export is { cast, tick?, clear? }: cast() returns true if it went off; tick(dt) runs every
// game tick (minions, totems, delayed impacts); clear() removes its scene objects when the map is cleared.
// To add a skill: write the module, then add one import and one entry to MODS below.
import skeletons from './sk/skeletons.js';
import { castArc, castNova, castDash } from './skills.js';
import arts from './sk/arts.js';
import { strike } from './sk/strike.js';
import { GEMS } from '../data/gems.js';

import blink from './sk/blink.js';
import totem from './sk/totem.js';
import meteor from './sk/meteor.js';
import roll from './sk/roll.js';

const MODS = {
  blink, totem, meteor, roll,
};

export const CAST = { arc: () => castArc(), nova: () => castNova(), dash: castDash };
for (const id in GEMS) if (GEMS[id].melee) CAST[id] = () => strike(id);
export const TICK = [skeletons.tick, arts.tick], CLEAR = [skeletons.clear, arts.clear]; // skeletons come from the Raise Skeletons support, frost rings from Frost Ward's parries
for (const [id, m] of Object.entries(MODS)) { CAST[id] = m.cast; if (m.tick) TICK.push(m.tick); if (m.clear) CLEAR.push(m.clear); }

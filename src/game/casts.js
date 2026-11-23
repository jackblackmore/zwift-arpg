// Skill gem → cast function, plus per-tick updaters and map-clear hooks for skills that leave things in the world.
// The first five skills live in game/skills.js. Each newer skill lives in its own module, src/game/sk/<gem>.js, whose
// default export is { cast, tick?, clear? }: cast() pays the cost and returns true if it went off; tick(dt) runs every
// game tick (minions, totems, delayed impacts); clear() removes its scene objects when the map is cleared.
// To add a skill: write the module, then add one import and one entry to MODS below.
import { castFireball, castArc, castNova, castShield, castDash } from './skills.js';

const MODS = {
};

export const CAST = { fireball: castFireball, arc: () => castArc(), nova: () => castNova(), shield: castShield, dash: castDash };
export const TICK = [], CLEAR = [];
for (const [id, m] of Object.entries(MODS)) { CAST[id] = m.cast; if (m.tick) TICK.push(m.tick); if (m.clear) CLEAR.push(m.clear); }

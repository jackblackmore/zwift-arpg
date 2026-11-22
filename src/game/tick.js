// Per-tick hooks for systems that live in their own modules (totems, traps, meteors, minions ...).
// addTicker(fn) once at module load; game/update.js calls every fn(dt) each tick, after the monsters move.
export const tickers = [];
export const addTicker = fn => { tickers.push(fn); };

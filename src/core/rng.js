// A small seeded random number generator (mulberry32): the same seed gives the same sequence. Used to rebuild a level layout
// from its seed (the map viewer at /maps/ and the game's ?seed= dev option).
export function seeded(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

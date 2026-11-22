// Support gem tuning (see game/supports.js). A value written [lv1, lv10] scales linearly with the support gem's own level
// (1..GEM_CAP); a plain number is fixed. supVal(id, key, lvl) reads either.
const GEM_CAP = 10; // = GEM_CAP in data/gems.js (not imported: gems.js reads this file for its descriptions)
export const SUP = {
  split: { extra: 2, less: [.25, .15] },                        // +2 projectiles (fires three); each deals this much less damage
  pierce: { n: [1, 2] },                                        // +1 pierce at lv1, +2 at lv10 (rounded)
  shatter: { frac: [.25, .45], radius: 2.4, freeze: .9 },       // a frozen enemy dies: neighbours take frac x its max life, freeze briefly
  conduit: { shockT: [3, 5], spread: [3.5, 5.5] },              // lightning hits always shock (seconds); the shock also jumps to the nearest other enemy within spread
  ignite: { frac: [.2, .28], dur: 3 },                          // fire hits burn for frac of the hit per second over dur seconds (lv1: 60% of the hit)
  chainReaction: { chance: [.25, .4], mult: .6, radius: 1.4 },  // killed enemies explode (small blast, mult x base damage, radius x area)
  swiftCast: { cd: [.15, .3] },                                 // the skill's cooldown (Main: attack interval) is this much shorter
};
export const supVal = (id, key, lvl = 1) => {
  const v = SUP[id][key]; if (!Array.isArray(v)) return v;
  return v[0] + (v[1] - v[0]) * (Math.max(1, Math.min(GEM_CAP, lvl)) - 1) / (GEM_CAP - 1);
};
// Sub-effects that have no gem of their own count as their parent skill for support lookups (Fireball's burning ground).
export const PARENT = { burn: 'fireball' };

// ---- gem drops ----
// Pools are weighted lists of gem ids; the Crypt pool is every support plus the skill gems (not Blink), weighted toward supports.
// Dropped gems are level gemLvlPerCrypt x the Crypt number (Crypt 1 drops lv1 gems, Crypt 5 lv5).
export const GEM_POOLS = {
  crypt: { split: 4, pierce: 4, shatter: 4, conduit: 4, ignite: 4, chainReaction: 4, swiftCast: 4,
    fireball: 1, frostLance: 1, skeletons: 1, nova: 1, flameTotem: 1, arc: 1, meteor: 1, iceTrap: 1, corpseExplosion: 1, ward: 1, boneArmour: 1, decoy: 1 },
};
export const poolOf = () => GEM_POOLS.crypt; // one region for now; later regions pick by level
// Chances per source. guardian: guaranteed (count). elite: rare monsters. beat: a finished beat (not the guardian's).
export const GEM_DROP = { guardian: 1, elite: .06, beat: .1, gemLvlPerCrypt: 1 };

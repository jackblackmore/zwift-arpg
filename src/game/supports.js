// Support gems (workstream D): effects that modify only the skill they are socketed with. Skill code asks these helpers
// with its own skill id; combat.js calls the hit / kill hooks. Stubs until D fills them in: no support changes anything yet.
// projCount(sk): extra projectiles (Split). pierceCount(sk): extra enemies pierced (Pierce).
export const projCount = sk => 0;
export const pierceCount = sk => 0;
// applyFreeze(e, t, sk): freeze monster e for t seconds on behalf of skill sk (bosses are chilled instead). Every freeze goes
// through here so Shatter can tell which skill froze it (e.freezeSk).
export function applyFreeze(e, t, sk) {
  if (e.deathT) return;
  if (e.ai === 'boss') { e.chill = Math.max(e.chill || 0, t); return; }
  e.freeze = Math.max(e.freeze || 0, t); e.freezeSk = sk;
}

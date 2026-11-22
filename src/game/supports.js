// Support gems (workstream D): effects that modify only the skill they are socketed with. Skill code asks these helpers
// with its own skill id; combat.js calls the hit / kill hooks. Stubs until D fills them in: no support changes anything yet.
// projCount(sk): extra projectiles (Split). pierceCount(sk): extra enemies pierced (Pierce).
export const projCount = sk => 0;
export const pierceCount = sk => 0;

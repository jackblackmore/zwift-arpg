// Skill gems: levels and AP. P.gems = { [skillId]: { lvl, ap } }. A gem in P.gems but not on P.bar is unequipped (earns less).
import { P } from '../core/state.js';
import { GEMS, GEM_FALLBACK, apNeed, AP_KILL, AP_PER_SEC, UNEQUIPPED_SHARE } from '../data/gems.js';
import { banner, toast } from '../render/fx.js';
import { SFX } from '../core/audio.js';

export { apNeed };
// Fresh gems, optionally restoring a saved set (clamped; unknown ids dropped; missing ones start at lv1).
export function initGems(saved) {
  const g = {};
  for (const id in GEMS) {
    const s = saved && saved[id], lvl = s ? Math.max(1, Math.min(GEMS[id].cap, Math.floor(s.lvl) || 1)) : 1;
    g[id] = { lvl, ap: s && lvl < GEMS[id].cap ? Math.max(0, +s.ap || 0) : 0 };
  }
  return g;
}
export const gemLvl = id => (P.gems && P.gems[id] ? P.gems[id].lvl : 1);
const equipped = id => Object.values(P.bar).includes(id);
// Base damage of the skill's gem at its level; skills without a gem borrow one (burn, arc).
export function gemBase(id) {
  const own = GEMS[id], fb = own ? null : (GEM_FALLBACK[id] || GEM_FALLBACK.none), g = own || GEMS[fb.gem], l = gemLvl(own ? id : fb.gem);
  if (g.base1 === undefined) return 0;
  return (g.base1 + (g.baseCap - g.base1) * (l - 1) / (g.cap - 1)) * (fb ? fb.frac : 1);
}
// Gentle per-level scale for non-damage stats (ward absorb, blink range).
export const gemScale = id => 1 + (GEMS[id].scale || 0) * (gemLvl(id) - 1);
// Has the gem reached the milestone with this key?
export function gemHas(id, key) { const m = GEMS[id] && GEMS[id].milestones.find(m => m.key === key); return !!m && gemLvl(id) >= m.lvl; }
// A numeric field of a reached milestone (e.g. its pierce count), 0 if not reached.
export function gemMile(id, key, field) { const m = GEMS[id].milestones.find(m => m.key === key); return m && gemLvl(id) >= m.lvl ? m[field] || 0 : 0; }

export function gainAP(n) {
  for (const id in P.gems) {
    const g = P.gems[id], def = GEMS[id]; if (!def || g.lvl >= def.cap) continue;
    g.ap += n * (equipped(id) ? 1 : UNEQUIPPED_SHARE);
    while (g.lvl < def.cap && g.ap >= apNeed(g.lvl)) {
      g.ap -= apNeed(g.lvl); g.lvl++;
      const m = def.milestones.find(m => m.lvl === g.lvl), msg = `${def.name} reaches level ${g.lvl}` + (m ? `: ${m.text}` : '');
      toast(`<b style="color:#ffd23f">${msg}</b>`); SFX.lvl();
      if (m) banner(def.name.toUpperCase() + ' · LV ' + g.lvl, '#ff8a3c', m.text);
    }
    if (g.lvl >= def.cap) g.ap = 0; // capped: AP stops accumulating
  }
}
export function gemsOnKill(e) { gainAP(AP_KILL[e.guardian || e.ai === 'boss' ? 'guardian' : e.rar === 2 ? 'rare' : e.rar === 1 ? 'magic' : 'normal']); }
export const gemsTick = dt => gainAP(AP_PER_SEC * dt);

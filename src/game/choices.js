// Path forks: the rider picks the next room (later: Zwift Ride ◀ / ▶).
import { S, hero } from '../core/state.js';
import { $ } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { ROOM } from '../data/combat.js';
import { INTERVALS } from '../data/zones.js';
import { rider, isSimulated } from '../input/rider.js';
import { M, astar } from '../world/map.js';
import { maxHp, rel } from './stats.js';
import { takeBoon } from './boons.js';

export const goalSpot = r => r.type === 'treasure' || r.type === 'campfire' ? [r.cx - 1, r.cy] : [r.cx, r.cy];

export function makeChoices() {
  const { rooms } = M;
  const hx = Math.round(hero.x), hz = Math.round(hero.z);
  const doneCount = rooms.filter(r => r.done && r.type !== 'start').length;
  let cands = rooms.filter(r => !r.done && (r.type !== 'boss' || doneCount >= 3 || rooms.filter(o => !o.done).length === 1));
  cands = cands.map(r => { const [gx, gz] = goalSpot(r); const p = astar(hx, hz, gx, gz); return { r, p, len: p ? p.length : 1e9 }; }).filter(c => c.p).sort((a, b) => a.len - b.len);
  if (!cands.length) return;
  const top = [cands[0]]; const second = cands.find(c => c.r.type !== cands[0].r.type) || cands[1]; if (second && second !== cands[0]) top.push(second);
  if (top.length === 1) { goTo(top[0]); return; }
  S.choices = top; S.choiceT = isSimulated() ? 2.2 : 9;
  $('cT').textContent = 'CHOOSE YOUR PATH · Zwift Ride ◀ / ▶ (keys 1 / 2)';
  top.forEach((c, i) => {
    c.r.marker.visible = true; const b = $('c' + (i + 1)); const R = ROOM[c.r.type];
    b.innerHTML = `<span style="color:${R.col}">${R.glyph}</span> ${i ? '▶' : '◀'} ${R.name}<small>${R.hint}</small>`;
  });
  $('choice').style.display = 'flex';
}

// What a scripted rider would pick, given the current effort.
export function autoPick() {
  const p = S.autoMode === 2 ? INTERVALS[S.seg].p : rel(), c = rider.cad;
  const score = t => {
    if (t === 'campfire') return (p < .66 ? 3 : 0) + (hero.hp < maxHp() * .5 ? 3 : 0);
    if (t === 'elite') return p >= .85 ? 3 : -1;
    if (t === 'boss') return p >= 1 ? 4 : 1;
    if (t === 'treasure') return c >= 100 ? 4 : 1;
    return 1.5;
  };
  return S.choices[0] && score(S.choices[1].r.type) > score(S.choices[0].r.type) ? 1 : 0;
}

export function choose(i) {
  if (S.boonChoice) { if (S.boonChoice[i]) takeBoon(S.boonChoice[i]); return; }
  if (!S.choices || !S.choices[i]) return;
  SFX.pick(); goTo(S.choices[i]);
}
export function goTo(c) { hero.goal = c.r; hero.path = c.p; S.choices = null; hideChoice(); hero.lock = 0; hero.rest = 0; }
export function hideChoice() { $('choice').style.display = 'none'; }

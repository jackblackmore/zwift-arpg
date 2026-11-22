// RIDE mode HUD: the Surge gauge (orb on the right, where the mana orb used to be), the attack rate and the movement state.
import { P } from '../core/state.js';
import { ride } from '../input/ridesim.js';
import { $ } from '../core/util.js';

export function surgeHud() {
  if (!ride.on) return;
  const g = P.surge, f = g.max > 0 ? g.v / g.max : 0, fx = P.eff, w = $('sorb');
  $('surgeF').style.height = (f * 100) + '%';
  w.classList.toggle('surging', !!fx.surging); w.classList.toggle('empty', g.v <= 0);
  $('surgeT').textContent = g.v <= 0 ? 'EMPTY' : Math.round(f * 100) + '%';
  $('surgeAtk').textContent = 'ATK ' + Math.round(fx.atk * 100) + '%';
  const m = $('rmove'), s = fx.move <= 0 ? 'STOPPED' : fx.move < 1 ? 'WALK' : 'RIDING';
  if (m.textContent !== s) m.textContent = s;
  m.style.color = fx.move <= 0 ? '#ff6a5a' : fx.move < 1 ? '#e8c060' : '#5fe39a';
}

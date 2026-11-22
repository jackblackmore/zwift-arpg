import { S, hero } from '../core/state.js';
import { $ } from '../core/util.js';
import { ZONES, zoneOf, INTERVALS } from '../data/zones.js';
import { ELEM, elemOf } from '../data/combat.js';
import { rider } from '../input/rider.js';
import { M } from '../world/map.js';
import { rel, critChance, atkRate, maxHp, exhausted, dieselBonus, metroOn } from '../game/stats.js';

const strEl = $('str');
for (let i = 0; i < 10; i++) strEl.appendChild(document.createElement('i'));

export function renderGear() {
  $('gear').innerHTML = ['weapon', 'armor', 'relic'].map(s => { const g = hero.gear[s]; return g ? `<div class="r${g.rar}">${g.name}</div>` : `<div style="color:#5a5246">— no ${s} —</div>`; }).join('');
}

let hudT = 0;
export function hud(dt) {
  hudT -= dt; if (hudT > 0) return; hudT = .08;
  const R = rel(), z = ZONES[zoneOf(R)], { ftp } = S;
  $('pwr').textContent = Math.round(hero.pow) + ' W'; $('pwr').style.color = z.col;
  const EL = ELEM[elemOf(R)]; $('zone').innerHTML = `${z.name} · ${Math.round(R * 100)}% · <span style="color:${EL.col}">${EL.icon} ${EL.name}</span>`; $('zone').style.color = z.col;
  $('stats').textContent = `${Math.round(rider.cad)} rpm · crit ${Math.round(critChance() * 100)}% · ${atkRate().toFixed(1)} atk/s`;
  $('bHp').style.width = (hero.hp / maxHp() * 100) + '%';
  $('bW').style.width = (hero.wbal / hero.wmax * 100) + '%'; $('bW').style.background = exhausted() ? '#ff5a4a' : '#4fd1a5';
  $('bC').style.width = (hero.cleave * 100) + '%'; $('bO').style.width = (hero.over * 100) + '%';
  [...strEl.querySelectorAll('i')].forEach((el, i) => el.classList.toggle('on', i < hero.str));
  for (const k of hero.boons) {
    const el = $('bn-' + k); if (!el) continue;
    if (k === 'diesel') { const b = dieselBonus(); el.textContent = 'Diesel Heart' + (b ? ` +${Math.round(b * 100)}%` : ''); el.classList.toggle('act', b > 0); }
    else if (k === 'metronome') { el.textContent = metroOn() ? 'Metronome ✓' : `Metronome ${Math.floor(Math.min(15, hero.metT))}/15`; el.classList.toggle('act', metroOn()); }
    else if (k === 'spark') el.classList.toggle('act', rel() >= 1.5);
    else if (k === 'wind') el.classList.toggle('act', rel() < .65 && hero.hp < maxHp());
  }
  let fl = `FLOOR ${S.floorN}`;
  if (hero.goal && hero.goal.type === 'treasure' && hero.lock > 0) fl += ` · lock ${Math.round(hero.lock * 100)}%`;
  if (S.autoMode === 2) fl = `${INTERVALS[S.seg].n} ${Math.ceil(INTERVALS[S.seg].d - S.segT)}s · ` + fl;
  $('floor').textContent = fl;
  $('gold').textContent = `⚗ ${hero.potions} · ${S.gold} gold · ${M.rooms.filter(r => r.done && r.type !== 'start').length}/${M.rooms.length - 1} rooms`;
  $('pw').value = Math.round(rider.pw); $('cd').value = Math.round(rider.cad);
  $('pwo').textContent = Math.round(rider.sprintHeld ? Math.max(rider.pw, ftp * 1.75) : rider.pw) + ' W'; $('cdo').textContent = Math.round(rider.cad) + ' rpm';
}

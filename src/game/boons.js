import { S, hero } from '../core/state.js';
import { $ } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { BOONS } from '../data/combat.js';
import { banner } from '../render/fx.js';
import { isSimulated } from '../input/rider.js';
import { has } from './stats.js';
import { hideChoice } from './choices.js';

export function queueBoon(t) { S.boonQ = t; }

export function offerBoon() {
  const pool = Object.keys(BOONS).filter(k => !has(k)).sort(() => Math.random() - .5).slice(0, 2);
  if (pool.length < 2) { if (pool.length) takeBoon(pool[0]); return; }
  S.choices = null; hideChoice(); S.boonChoice = pool; S.choiceT = isSimulated() ? 2.5 : 10;
  $('cT').textContent = 'CHOOSE A BOON · Zwift Ride ◀ / ▶ (keys 1 / 2)';
  pool.forEach((k, i) => { const B = BOONS[k]; $('c' + (i + 1)).innerHTML = `<span style="color:${B.col}">✦</span> ${i ? '▶' : '◀'} ${B.name}<small>${B.desc}</small>`; });
  $('choice').style.display = 'flex';
}

export function takeBoon(k) {
  hero.boons.push(k); S.boonChoice = null; hideChoice(); SFX.boon();
  if (k === 'lungs') { hero.wmax = Math.round(hero.wmax * 1.35); hero.wbal = hero.wmax; }
  banner(BOONS[k].name.toUpperCase(), BOONS[k].col, BOONS[k].desc); renderBoons();
}

export function renderBoons() { $('boons').innerHTML = hero.boons.map(k => `<span id="bn-${k}" style="color:${BOONS[k].col}">${BOONS[k].name}</span>`).join(''); }

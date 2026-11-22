// On-screen controls and keyboard. Path/boon choice will also come from Zwift Ride buttons later.
import { S, hero, resetRide } from '../core/state.js';
import { $ } from '../core/util.js';
import { audio, audioState } from '../core/audio.js';
import { rider, SOURCES, setAuto, onSourceChange } from '../input/rider.js';
import { banner } from '../render/fx.js';
import { maxHp } from '../game/stats.js';
import { choose, hideChoice } from '../game/choices.js';
import { renderBoons } from '../game/boons.js';
import { newFloor } from '../game/floor.js';
import { renderGear } from './hud.js';
import { showSummary } from './summary.js';

export function initControls() {
  onSourceChange(m => { $('auto').textContent = SOURCES[m].label; $('auto').classList.toggle('on', m > 0); });

  $('pw').addEventListener('input', e => { setAuto(0); rider.pw = +e.target.value; });
  $('cd').addEventListener('input', e => { setAuto(0); rider.cad = +e.target.value; });
  $('auto').addEventListener('click', () => setAuto((S.autoMode + 1) % SOURCES.length));
  $('help').addEventListener('click', () => $('ov').classList.remove('hide'));
  $('end').addEventListener('click', showSummary);
  $('mute').addEventListener('click', () => {
    audio(); audioState.muted = !audioState.muted;
    $('mute').textContent = audioState.muted ? '♪̸' : '♪'; $('mute').style.opacity = audioState.muted ? .5 : 1;
  });
  addEventListener('pointerdown', audio);
  $('c1').addEventListener('click', () => choose(0)); $('c2').addEventListener('click', () => choose(1));

  const sp = $('sprint');
  sp.addEventListener('pointerdown', e => { e.preventDefault(); rider.sprintHeld = true; sp.classList.add('on'); try { sp.setPointerCapture(e.pointerId); } catch (_) {} });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => sp.addEventListener(ev, () => { rider.sprintHeld = false; sp.classList.remove('on'); }));

  const keys = S.keys;
  addEventListener('keydown', e => {
    if (e.target.type === 'number') return;
    const k = e.key.toLowerCase(); if (k === ' ') e.preventDefault();
    if (k === ' ' || k === 'shift') { rider.sprintHeld = true; sp.classList.add('on'); }
    if (k === '1' || k === 'arrowleft') choose(0);
    if (k === '2' || k === 'arrowright') choose(1);
    if (k === 'a' && !e.repeat) setAuto((S.autoMode + 1) % SOURCES.length);
    if (k === 'escape') $('ov').classList.toggle('hide');
    keys[k] = true;
  });
  addEventListener('keyup', e => { const k = e.key.toLowerCase(); keys[k] = false; if (k === ' ' || k === 'shift') { rider.sprintHeld = false; sp.classList.remove('on'); } });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; rider.sprintHeld = false; sp.classList.remove('on'); });

  $('goEnd').addEventListener('click', () => startGame(1));
  $('goInt').addEventListener('click', () => startGame(2));
  $('goMan').addEventListener('click', () => startGame(0));
}

export function startGame(mode) {
  $('ov').classList.add('hide');
  S.floorN = 1; S.gold = 0; S.time = 0;
  audio();
  Object.assign(hero, { str: 0, strT: 0, cleave: 0, over: 0, wmax: 18000, wbal: 18000, dead: 0, gear: { weapon: null, armor: null, relic: null }, boons: [], potions: 2, dieselT: 0, metT: 0 });
  hero.hp = maxHp(); renderGear(); renderBoons(); S.boonChoice = null; hideChoice(); resetRide();
  S.autoMode = -1; setAuto(mode);
  if (mode === 0) { rider.pw = .7 * S.ftp; rider.cad = 88; }
  newFloor();
  banner('FLOOR 1', '#e8b960', mode === 1 ? 'Easy day: endurance pace' : mode === 2 ? 'Good day: interval workout' : 'Manual: use the sliders');
  S.started = true;
}

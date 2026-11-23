// RIDE mode device: a simulated Zwift Ride (on-screen pad + keyboard stand-ins) and simulated KICKR
// (power / cadence sliders). Writes into `ctl` like any other device. The real Bluetooth devices will
// replace the button presses and slider values; the mapping to `ctl` stays the same.
import { ctl, clearHeld, slotInput } from './input.js';
import { RIDE, RIDE_BUTTONS } from '../data/ride.js';
import { $, clamp } from '../core/util.js';
import { audio } from '../core/audio.js';
import { G } from '../core/state.js';

export const ride = { on: false, pw: RIDE.startPower, cad: RIDE.startCad, ftp: RIDE.ftp, held: {}, keys: {} };
const BY_KEY = Object.fromEntries(RIDE_BUTTONS.map(b => [b.key, b]));
const DIR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function press(b, down) {
  if (down && G.paused) return;
  ride.held[b.id] = down;
  if (down && DIR[b.id]) ctl.tapDir = DIR[b.id]; // a tap picks a way at a junction; holding still steers
  if (!b.act) return;
  if (b.slot) { slotInput(b.act, down); return; }
  if (b.hold) { ctl[b.act] = down; return; }
  if (!down) return;
  if (b.act === 'auto') ctl.auto = !ctl.auto; else ctl[b.act] = true;
}

// Returns true when RIDE mode handled the key.
export function rideKey(k, down) {
  if (!ride.on) return false;
  const b = BY_KEY[k];
  if (b) { press(b, down); return true; }
  if (Object.values(RIDE.keys).includes(k)) { ride.keys[k] = down; return true; }
  return false;
}

export function pollRide(dt) {
  const K = RIDE.keys;
  if (ride.keys[K.powerUp]) ride.pw += K.step * dt; if (ride.keys[K.powerDown]) ride.pw -= K.step * dt;
  if (ride.keys[K.cadUp]) ride.cad += K.cadStep * dt; if (ride.keys[K.cadDown]) ride.cad -= K.cadStep * dt;
  ride.pw = clamp(ride.pw, 0, 900); ride.cad = clamp(ride.cad, 0, 140);
  let mx = 0, mz = 0;
  for (const [id, [x, z]] of Object.entries(DIR)) if (ride.held[id]) { mx += x; mz += z; }
  const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
  ctl.mx = mx; ctl.mz = mz; ctl.aim = null;
  ctl.effort = { pw: ride.pw, rel: ride.pw / ride.ftp, cad: ride.cad };
}

export function setRide(on) {
  ride.on = on; document.body.classList.toggle('ride', on);
  ride.held = {}; ride.keys = {}; clearHeld(); ctl.auto = false;
  if (!on) ctl.effort = null;
  try { localStorage.setItem('wd-mode', on ? 'ride' : 'keys'); } catch (e) {}
}
export function storedRide() { try { return localStorage.getItem('wd-mode') === 'ride'; } catch (e) { return false; } }

export function initRide() {
  for (const side of ['L', 'R']) {
    const pad = $('ride' + side);
    for (const b of RIDE_BUTTONS.filter(b => b.side === side)) {
      const el = document.createElement('div');
      el.className = 'rb' + (b.wide ? ' wide' : ''); el.id = 'rb-' + b.id;
      el.style.gridColumn = b.wide ? '1 / span 3' : String(b.at[0] + 1); el.style.gridRow = String(b.at[1] + 1);
      if (b.col) el.style.color = b.col;
      el.innerHTML = `${b.icon || b.slot ? `<span class="ic">${b.icon || ''}</span>` : ''}<span class="lb">${b.label}</span><span class="k">${b.key.replace('arrow', '').toUpperCase().slice(0, 2)}</span>`;
      el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audio(); try { el.setPointerCapture(e.pointerId); } catch (_) {} press(b, true); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => el.addEventListener(ev, () => { if (ride.held[b.id]) press(b, false); }));
      pad.appendChild(el);
    }
  }
  const pw = $('rpw'), cd = $('rcd');
  pw.addEventListener('input', () => ride.pw = +pw.value); cd.addEventListener('input', () => ride.cad = +cd.value);
  $('rftp').addEventListener('change', () => ride.ftp = clamp(+$('rftp').value || RIDE.ftp, 80, 600));
  $('rftp').value = ride.ftp;
}

// HUD bits for RIDE mode. slotLook(slot) → { icon, col } of the gem in that slot, or null (supplied by ui/hud.js).
export function rideHud(slotLook) {
  if (!ride.on) return;
  for (const b of RIDE_BUTTONS) if (b.slot) { const el = $('rb-' + b.id), L = slotLook(b.act); if (!el) continue; el.style.color = L ? L.col : '#5a4a3a'; el.querySelector('.ic').textContent = L ? L.icon : '·'; }
  $('rpw').value = Math.round(ride.pw); $('rcd').value = Math.round(ride.cad);
  $('rpwV').textContent = Math.round(ride.pw) + ' W · ' + Math.round(ride.pw / ride.ftp * 100) + '%'; $('rcdV').textContent = Math.round(ride.cad) + ' rpm';
  for (const b of RIDE_BUTTONS) { const el = $('rb-' + b.id); if (el) el.classList.toggle('on', b.act === 'auto' ? ctl.auto : !!ride.held[b.id]); }
}

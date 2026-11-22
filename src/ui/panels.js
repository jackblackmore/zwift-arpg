// Modal panels: inventory (bag), main menu (the gem bag is ui/gembag.js). Any visible .modal pauses the game.
import { G, P, S } from '../core/state.js';
import { SLOTS, GLY, DROP } from '../data/items.js';
import { clearHeld } from '../input/input.js';
import { $ } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { computeStats, recalc, estimate } from '../game/stats.js';
import { modText } from '../game/items.js';
import { save } from '../game/save.js';
import { GEMS } from '../data/gems.js';
import { slotSkill } from '../game/gems.js';
import { initTree } from './tree.js';

const isOpen = id => $(id).classList.contains('show');
// Paused until the game starts, and while any .modal is showing (add data-sticky to one Escape must not close).
export function syncPause() { G.paused = !G.started || !!document.querySelector('.modal.show'); clearHeld(); }

// ================= INVENTORY =================
const ui = { sel: null };
function itemHTML(it) {
  let h = `<div class="nm r${it.rar}">${it.name}</div><div class="base">${it.rar >= 2 ? it.base + ' · ' : ''}${it.slot} · item level ${it.il}</div>`;
  it.mods.forEach(([st, v], i) => { if (modText(st, v)) h += `<div class="${i === 0 && it.impl ? 'impl' : 'mod' + (it.rar === 3 ? ' u' : '')}">${modText(st, v)}</div>`; });
  if (it.fl) h += `<div class="fl">${it.fl}</div>`;
  return h;
}
function cmpHTML(it) {
  const cur = estimate(S), nx = estimate(computeStats({ ...P.gear, [it.slot]: it }));
  const line = (n, a, b, f = v => Math.round(v)) => {
    const d = b - a; if (Math.abs(d) < .05) return '';
    const p = a ? Math.round(d / a * 100) : 0;
    return `<div>${n}: ${f(a)} → <span class="${d >= 0 ? 'up' : 'dn'}">${f(b)} (${d >= 0 ? '+' : ''}${p}%)</span></div>`;
  };
  return `<div class="cmp"><div style="color:var(--dim)">If equipped${P.gear[it.slot] ? ' (replaces ' + P.gear[it.slot].name + ')' : ''}:</div>${line((slotSkill('main') ? GEMS[slotSkill('main')].name : 'Fireball') + ' DPS', cur.dps, nx.dps)}${line('Max life', cur.life, nx.life)}${line('Move speed', cur.ms, nx.ms, v => v.toFixed(1))}</div>`;
}
const isUpgrade = it => { const cur = estimate(S), nx = estimate(computeStats({ ...P.gear, [it.slot]: it })); return nx.dps > cur.dps * 1.02 || (nx.life > cur.life + 5 && nx.dps >= cur.dps * .98); };

export function renderInv() {
  const sel = ui.sel;
  $('gearGrid').innerHTML = SLOTS.map(s => {
    const it = P.gear[s];
    return `<div class="cell g ${it ? 'c' + it.rar : ''} ${sel && sel.g === s ? 'sel' : ''}" data-g="${s}">${it ? GLY[s] : `<span style="color:#3a2a1a">${GLY[s]}</span>`}<small>${it ? it.name.slice(0, 18) : s}</small></div>`;
  }).join('');
  let h = '';
  for (let i = 0; i < DROP.bagSize; i++) { const it = P.inv[i]; h += `<div class="cell ${it ? 'c' + it.rar : ''} ${sel && sel.i === i ? 'sel' : ''}" data-i="${i}"${it && isUpgrade(it) ? ' style="box-shadow:inset 0 0 0 2px #5fe39a"' : ''}>${it ? GLY[it.slot] : ''}</div>`; }
  $('invGrid').innerHTML = h;
  const tip = $('tip');
  if (sel && sel.i !== undefined && P.inv[sel.i]) {
    const it = P.inv[sel.i];
    tip.innerHTML = itemHTML(it) + cmpHTML(it) + `<div class="row" style="margin-top:8px"><button class="pri" id="tEq">EQUIP</button><button id="tDr">DISCARD</button></div>`;
    $('tEq').onclick = () => equip(sel.i);
    $('tDr').onclick = () => { P.inv.splice(sel.i, 1); ui.sel = null; renderInv(); save(); };
  } else if (sel && sel.g && P.gear[sel.g]) {
    tip.innerHTML = itemHTML(P.gear[sel.g]) + `<div class="row" style="margin-top:8px"><button id="tUn">UNEQUIP</button></div>`;
    $('tUn').onclick = () => { if (P.inv.length >= DROP.bagSize) return; P.inv.push(P.gear[sel.g]); P.gear[sel.g] = null; ui.sel = null; recalc(); renderInv(); save(); };
  } else tip.innerHTML = '<span style="color:var(--dim)">Select an item to inspect it. A green outline marks an upgrade.</span>';
}
export function equip(i) {
  const it = P.inv[i], prev = P.gear[it.slot];
  P.gear[it.slot] = it; P.inv.splice(i, 1); if (prev) P.inv.push(prev);
  ui.sel = null; recalc(); renderInv(); save(); SFX.loot(1);
}
export function openInv(v) { $('mInv').classList.toggle('show', v); if (v) { P.newItems = 0; ui.sel = null; renderInv(); $('mPass').classList.remove('show'); $('mGems').classList.remove('show'); } syncPause(); }
export const toggleInv = () => openInv(!isOpen('mInv'));

// ================= PASSIVES: the tree panel lives in ui/tree.js; these stay importable from here =================
export { openPass, closePass, togglePass } from './tree.js';
// Escape: close every panel except sticky ones (the main menu).
export function closeAll() { document.querySelectorAll('.modal.show:not([data-sticky])').forEach(m => m.classList.remove('show')); syncPause(); }

export function initPanels() {
  $('gearGrid').addEventListener('click', e => { const c = e.target.closest('.cell'); if (c) { ui.sel = { g: c.dataset.g }; renderInv(); } });
  $('invGrid').addEventListener('click', e => { const c = e.target.closest('.cell'); if (c && P.inv[+c.dataset.i]) { ui.sel = { i: +c.dataset.i }; renderInv(); } });
  $('junkMagic').onclick = () => { P.inv = P.inv.filter(it => it.rar !== 1); ui.sel = null; renderInv(); save(); };
  $('bInv').onclick = toggleInv; $('invClose').onclick = () => openInv(false);
  initTree();
}

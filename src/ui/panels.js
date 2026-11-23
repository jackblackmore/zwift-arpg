// Modal panels: inventory (bag), passive picker, shrine choice, skill gems, main menu. Opening any of them pauses the game.
import { G, P, S } from '../core/state.js';
import { SLOTS, GLY, DROP } from '../data/items.js';
import { PASS } from '../data/passives.js';
import { clearHeld } from '../input/input.js';
import { $ } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { computeStats, recalc, estimate } from '../game/stats.js';
import { modText } from '../game/items.js';
import { save } from '../game/save.js';
import { GEMS, SLOT_DEFS, BAR, GEM } from '../data/gems.js';
import { SK } from '../data/skills.js';
import { gemById, barGem, unlocked, fits, slotOf, ownsGem, placeGem, clearSlot, shrineOffer, takeShrine, shrineDue } from '../game/gems.js';
import { xpNeedFor } from '../game/formulas.js';

const isOpen = id => $(id).classList.contains('show');
export function syncPause() { G.paused = !G.started || ['mInv', 'mPass', 'mMenu', 'mShrine', 'mGems'].some(isOpen); clearHeld(); }

// ================= INVENTORY =================
const ui = { sel: null };
function itemHTML(it) {
  let h = `<div class="nm r${it.rar}">${it.name}</div><div class="base">${it.rar >= 2 ? it.base + ' · ' : ''}${it.slot} · item level ${it.il}</div>`;
  it.mods.forEach(([st, v], i) => { h += `<div class="${i === 0 && it.impl ? 'impl' : 'mod' + (it.rar === 3 ? ' u' : '')}">${modText(st, v)}</div>`; });
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
  return `<div class="cmp"><div style="color:var(--dim)">If equipped${P.gear[it.slot] ? ' (replaces ' + P.gear[it.slot].name + ')' : ''}:</div>${line(cur.gem + ' DPS', cur.dps, nx.dps)}${line('Max life', cur.life, nx.life)}${line('Move speed', cur.ms, nx.ms, v => v.toFixed(1))}</div>`;
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
export function openInv(v) { $('mInv').classList.toggle('show', v); if (v) { P.newItems = 0; ui.sel = null; renderInv(); $('mPass').classList.remove('show'); } syncPause(); }
export const toggleInv = () => openInv(!isOpen('mInv'));

// ================= PASSIVES =================
function genOffer() {
  const pool = Object.keys(PASS).filter(k => (P.passives[k] || 0) < PASS[k].max && (!PASS[k].gem || ownsGem(PASS[k].gem))), out = [];
  while (out.length < 3 && pool.length) {
    const w = pool.map(k => PASS[k].note === 2 ? .25 : PASS[k].note ? .5 : 1), tot = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot, i = 0; while (r > w[i]) { r -= w[i]; i++; }
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}
function renderPass() {
  $('passSub').textContent = P.pts ? `${P.pts} point${P.pts > 1 ? 's' : ''} to spend · choose one` : 'No points to spend · level up to earn more';
  if (P.pts && !P.offer) P.offer = genOffer();
  $('passCards').innerHTML = P.pts ? P.offer.map(k => {
    const p = PASS[k];
    return `<div class="pc ${p.note === 2 ? 'key' : p.note ? 'note' : ''}" data-k="${k}"><b style="color:${p.c}">${p.n}</b><span>${p.d}</span><em>${p.note === 2 ? 'KEYSTONE' : p.note ? 'NOTABLE' : 'PASSIVE'} · ${P.passives[k] || 0}/${p.max}</em></div>`;
  }).join('') : '';
  const tk = Object.entries(P.passives);
  $('taken').innerHTML = tk.length ? 'Allocated: ' + tk.map(([k, n]) => `<span style="color:${PASS[k].c}">${PASS[k].n}${PASS[k].max > 1 ? ' ×' + n : ''}</span>`).join(' · ') : 'Nothing allocated yet.';
}
export function openPass() { $('mPass').classList.add('show'); $('mInv').classList.remove('show'); renderPass(); syncPause(); }
export function closePass() { $('mPass').classList.remove('show'); syncPause(); }
export const togglePass = () => isOpen('mPass') ? closePass() : openPass();
export function closeAll() { $('mInv').classList.remove('show'); $('mGems').classList.remove('show'); closeShrine(); closePass(); }

// ================= SHRINE (pick 1 of 3 skill gems for a newly unlocked slot) =================
const gemCard = (id, extra = '') => { const D = GEMS[id], K = SK[D.sk]; return `<div class="pc gemc" data-k="${id}"><b style="color:${D.col}">${D.icon} ${D.n}</b><span>${D.d}.</span><span class="gm">${D.held ? 'Hold to cast' : 'Press to cast'} · ${K.cost} mana${K.cd ? ` · ${K.cd}s cooldown` : ''}${K.recharge ? ` · charge every ${K.recharge}s` : ''}</span><em>LEVEL 5: ${D.ms[5].toUpperCase()}${extra}</em></div>`; };
let shrineSlot = null;
export function openShrine(slot) {
  if (!shrineDue().includes(slot)) return;
  shrineSlot = slot; const S = SLOT_DEFS[slot], offer = shrineOffer(slot);
  $('shrineT').textContent = `SHRINE · ${S.n.toUpperCase()} SLOT`;
  $('shrineSub').textContent = slot === 'main' ? 'Choose your first skill. You start with this and Magic Shield; more slots open at levels 5, 8 and 12.'
    : slot === 'guard' ? 'A shrine of frost. Take Frost Ward into your bag, then swap it with Magic Shield in the gem panel (G) if you like.'
    : `${S.n} unlocked at level ${S.unlock}. ${offer.length > 1 ? 'Choose one' : 'Take it'}; the others may drop later.`;
  $('shrineCards').innerHTML = offer.map(id => gemCard(id)).join('');
  $('shrineClose').style.display = slot === 'main' ? 'none' : '';
  ['mInv', 'mPass', 'mGems'].forEach(id => $(id).classList.remove('show'));
  $('mShrine').classList.add('show'); syncPause();
}
export function closeShrine() { $('mShrine').classList.remove('show'); syncPause(); }

// ================= SKILL GEMS (bag + bar, tap a gem then a slot) =================
const gui = { sel: null };
function gemCell(g, s) {
  const D = g && GEMS[g.gem];
  return `<div class="cell gcell ${g && gui.sel === g.id ? 'sel' : ''}" ${s ? `data-s="${s}"` : `data-id="${g.id}"`} style="${D ? 'color:' + D.col : ''}">${D ? D.icon : ''}${D ? `<b>L${g.lvl}</b>` : ''}${s ? `<small>${SLOT_DEFS[s].n}</small>` : ''}</div>`;
}
export function renderGems() {
  $('gemBar').innerHTML = BAR.map(s => unlocked(s) ? gemCell(barGem(s), s) : `<div class="cell gcell locked"><span>🔒</span><small>${SLOT_DEFS[s].n} · Lv ${SLOT_DEFS[s].unlock}</small></div>`).join('');
  const bag = P.gems.filter(g => !slotOf(g) || !unlocked(slotOf(g)));
  $('gemBag').innerHTML = bag.length ? bag.map(g => gemCell(g)).join('') : '<span style="color:var(--dim);font-size:11px">No spare gems. Shrines and (later) guardians give more.</span>';
  const g = gemById(gui.sel), tip = $('gemTip');
  if (!g) { tip.innerHTML = '<span style="color:var(--dim)">Tap a gem, then tap a slot to put it there. Gems on the bar earn full XP; spare gems earn 10%.</span>'; return; }
  const D = GEMS[g.gem], s = slotOf(g), need = xpNeedFor(g.lvl);
  const slots = BAR.filter(x => fits(g.gem, x)).map(x => SLOT_DEFS[x].n).join(' or ');
  tip.innerHTML = `<div class="nm" style="color:${D.col}">${D.icon} ${D.n}</div><div class="base">${D.kind} gem · level ${g.lvl}/${GEM.cap}${g.lvl < GEM.cap ? ` · ${Math.floor(g.xp)}/${need} XP` : ' · maxed'} · goes in ${slots}</div><div>${D.d}.</div>`
    + Object.entries(D.ms).map(([l, t]) => `<div class="${g.lvl >= l ? 'up' : ''}" style="${g.lvl >= l ? '' : 'color:var(--dim)'}">Level ${l}: ${t}${g.lvl >= l ? ' ✓' : ''}</div>`).join('')
    + (s && unlocked(s) ? `<div class="row" style="margin-top:8px"><button id="gRem">TAKE OFF THE BAR</button></div>` : '');
  if ($('gRem')) $('gRem').onclick = () => { clearSlot(s); renderGems(); save(); };
}
export function openGems(v) { $('mGems').classList.toggle('show', v); if (v) { gui.sel = null; renderGems(); $('mInv').classList.remove('show'); $('mPass').classList.remove('show'); } syncPause(); }
export const toggleGems = () => openGems(!isOpen('mGems'));

export function initPanels() {
  $('gearGrid').addEventListener('click', e => { const c = e.target.closest('.cell'); if (c) { ui.sel = { g: c.dataset.g }; renderInv(); } });
  $('invGrid').addEventListener('click', e => { const c = e.target.closest('.cell'); if (c && P.inv[+c.dataset.i]) { ui.sel = { i: +c.dataset.i }; renderInv(); } });
  $('junkMagic').onclick = () => { P.inv = P.inv.filter(it => it.rar !== 1); ui.sel = null; renderInv(); save(); };
  $('bInv').onclick = toggleInv; $('invClose').onclick = () => openInv(false);
  $('passCards').addEventListener('click', e => {
    const c = e.target.closest('.pc'); if (!c) return;
    const k = c.dataset.k; P.passives[k] = (P.passives[k] || 0) + 1; P.pts--; P.offer = null;
    recalc(); SFX.lvl(); save(); renderPass(); if (!P.pts) setTimeout(closePass, 250);
  });
  $('bPass').onclick = togglePass; $('passClose').onclick = closePass;
  $('shrineCards').addEventListener('click', e => {
    const c = e.target.closest('.pc'); if (!c || !shrineSlot) return;
    if (takeShrine(shrineSlot, c.dataset.k)) { save(); closeShrine(); }
  });
  $('shrineClose').onclick = closeShrine;
  $('bGems').onclick = toggleGems; $('gemClose').onclick = () => openGems(false);
  $('gemBar').addEventListener('click', e => {
    const c = e.target.closest('.cell'); if (!c || !c.dataset.s) return;
    const s = c.dataset.s, cur = barGem(s);
    if (gui.sel && gui.sel !== (cur && cur.id)) { if (placeGem(gui.sel, s)) { gui.sel = null; save(); } }
    else gui.sel = cur && gui.sel !== cur.id ? cur.id : null;
    renderGems();
  });
  $('gemBag').addEventListener('click', e => { const c = e.target.closest('.cell'); if (!c || !c.dataset.id) return; const id = +c.dataset.id; gui.sel = gui.sel === id ? null : id; renderGems(); });
}

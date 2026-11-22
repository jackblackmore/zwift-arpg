// The gem bag and skill bar editor (modal #mGems, markup in index.html). Five slots with their support sockets across the top,
// the bag of spare gems below. Tap a gem, then tap a slot or socket to place it; tap a placed gem to select it (tap it again to
// send it back to the bag, or tap another slot to swap). Targets that can't take the selected gem are dimmed, and tapping one
// says why. Touch-first: nothing here needs hover. Opening it pauses the game (any visible .modal does, see panels.js syncPause).
import { G, P } from '../core/state.js';
import { GEMS, BAR_SLOTS, SLOT_ORDER, apNeed } from '../data/gems.js';
import { slotGem, byUid, socketList, slotUnlocked, equipReason, socketReason, equipGem, unequip, socketGem, unsocket, isEquipped } from '../game/gems.js';
import { ctl } from '../input/input.js';
import { save } from '../game/save.js';
import { toast } from '../render/fx.js';
import { dbg } from '../core/dbg.js';
import { $ } from '../core/util.js';
import { syncPause } from './panels.js';

const ui = { sel: null, msg: '' }; // sel: selected gem uid; msg: the last "why not" line
const KIND_ORDER = { attack: 0, guard: 1, evade: 2, support: 3 };
const SLOT_ID = { main: 'sMain', flexA: 'sFlexA', flexB: 'sFlexB', guard: 'sGuard', evade: 'sEvade' };
const isOpen = () => $('mGems').classList.contains('show');
const apBar = g => `<i class="ap"><u style="width:${g.lvl >= GEMS[g.id].cap ? 100 : g.ap / apNeed(g.lvl) * 100}%"></u></i>`;
const lvlText = g => (g.lvl >= GEMS[g.id].cap ? 'MAX' : 'Lv ' + g.lvl);

function slotHTML(slot) {
  const B = BAR_SLOTS[slot], g = slotGem(slot), d = g && GEMS[g.id], locked = !g && !slotUnlocked(slot), why = ui.sel && equipReason(slot, ui.sel);
  const isSel = g && g.uid === ui.sel, cls = ['gslot', g ? 'has' : '', locked ? 'locked' : '', isSel ? 'sel' : '', ui.sel && !isSel ? (why ? 'dim' : 'ok') : ''].join(' ');
  const tile = g ? `<span class="gi" style="color:${d.color}">${d.icon}</span><span class="gn">${d.name}</span><span class="gl">${lvlText(g)}</span>${apBar(g)}`
    : locked ? `<span class="glock"><i></i></span><span class="gl">L${B.unlock}</span>` : '<span class="gi plus">+</span>';
  const socks = socketList(slot).map((u, i) => {
    const sg = byUid(u), sd = sg && GEMS[sg.id], sw = ui.sel && socketReason(slot, i, ui.sel), ss = sg && sg.uid === ui.sel;
    return `<div class="gsock ${sg ? 'has' : ''} ${ss ? 'sel' : ''} ${ui.sel && !ss ? (sw ? 'dim' : 'ok') : ''}" data-slot="${slot}" data-i="${i}" style="color:${sd ? sd.color : 'inherit'}">${sg ? sd.icon : ''}${sg ? `<small>${sg.lvl}</small>` : ''}</div>`;
  }).join('');
  return `<div class="gcol"><div class="glab">${B.name}<em>${B.key}</em></div><div class="${cls}" data-slot="${slot}">${tile}</div><div class="gsocks">${socks}</div></div>`;
}

function detailHTML() {
  const g = byUid(ui.sel), msg = ui.msg ? `<div class="gmsg">${ui.msg}</div>` : '';
  if (!g) return `<div class="ghelp">Tap a gem, then tap a slot or socket to place it. Gems on the bar and in sockets earn full AP; spare ones earn a tenth.</div>${msg}`;
  const d = GEMS[g.id], max = g.lvl >= d.cap, placed = isEquipped(g.uid);
  const ms = d.milestones.map(m => `<span class="${g.lvl >= m.lvl ? 'got' : ''}">Lv ${m.lvl}: ${m.text}</span>`).join('');
  return `<div class="gtop"><b style="color:${d.color}">${d.icon} ${d.name}</b><span>${d.kind === 'support' ? 'support · fits ' + d.tags.join(' / ') : d.kind + (d.tags.length ? ' · ' + d.tags.join(' · ') : '')}</span></div>
    <div class="gdesc">${d.desc}</div><div class="gstat">${max ? 'Level ' + g.lvl + ' (max)' : `Level ${g.lvl} / ${d.cap} · AP ${Math.floor(g.ap)} / ${apNeed(g.lvl)}`}</div>${ms ? `<div class="gms">${ms}</div>` : ''}${msg}
    ${placed ? '<button id="gbBagIt">SEND TO BAG</button>' : ''}`;
}

function bagHTML() {
  const list = P.gems.filter(g => GEMS[g.id] && !isEquipped(g.uid)).sort((a, b) => KIND_ORDER[GEMS[a.id].kind] - KIND_ORDER[GEMS[b.id].kind] || b.lvl - a.lvl || a.uid - b.uid);
  if (!list.length) return '<div class="gempty">No spare gems. New gems appear here.</div>';
  return list.map(g => {
    const d = GEMS[g.id];
    return `<div class="gcard ${d.kind === 'support' ? 'sup' : ''} ${g.uid === ui.sel ? 'sel' : ''}" data-u="${g.uid}" style="--c:${d.color}"><span class="gi">${d.icon}</span><b>${d.name}</b><small>${lvlText(g)}</small>${apBar(g)}</div>`;
  }).join('');
}

export function renderGems() {
  if (ui.sel != null && !byUid(ui.sel)) ui.sel = null;
  $('gbSlots').innerHTML = SLOT_ORDER.map(slotHTML).join('');
  $('gbDetail').innerHTML = detailHTML(); $('gbBag').innerHTML = bagHTML();
  const bi = $('gbBagIt'); if (bi) bi.onclick = sendToBag;
}
const done = () => { renderGems(); save(); };

function sendToBag() {
  const u = ui.sel; if (u == null) return;
  for (const s of SLOT_ORDER) { if (P.bar[s] === u) unequip(s); const i = socketList(s).indexOf(u); if (i >= 0) unsocket(s, i); }
  ui.sel = null; ui.msg = ''; done();
}
function clickSlot(slot) {
  const g = slotGem(slot), sel = ui.sel; ui.msg = '';
  if (sel != null && g && g.uid === sel) return sendToBag();
  if (sel != null) { const why = equipReason(slot, sel); if (why) ui.msg = why; else { equipGem(slot, sel); ui.sel = null; } }
  else if (g) ui.sel = g.uid;
  else ui.msg = slotUnlocked(slot) ? 'Pick a gem from the bag first.' : `Unlocks at level ${BAR_SLOTS[slot].unlock}`;
  done();
}
function clickSocket(slot, i) {
  const u = socketList(slot)[i], sel = ui.sel; ui.msg = '';
  if (sel != null && u === sel) return sendToBag();
  if (sel != null) { const why = socketReason(slot, i, sel); if (why) ui.msg = why; else { socketGem(slot, i, sel); ui.sel = null; } }
  else if (u) ui.sel = u;
  else ui.msg = 'Pick a support gem from the bag first.';
  done();
}

export function openGems(v) {
  $('mGems').classList.toggle('show', v);
  if (v) { P.newGems = 0; ui.sel = null; ui.msg = ''; for (const k of ['flexA', 'flexB', 'guard', 'evade', 'flask']) ctl[k] = false; renderGems(); $('mInv').classList.remove('show'); $('mPass').classList.remove('show'); }
  syncPause();
}
export const toggleGems = () => openGems(!isOpen());

export function initGemBag() {
  $('bGems').onclick = toggleGems; $('gemClose').onclick = () => openGems(false);
  $('gbSlots').addEventListener('click', e => {
    const s = e.target.closest('.gsock'); if (s) return clickSocket(s.dataset.slot, +s.dataset.i);
    const t = e.target.closest('.gslot'); if (t) clickSlot(t.dataset.slot);
  });
  $('gbBag').addEventListener('click', e => {
    const c = e.target.closest('.gcard'); if (!c) return;
    const u = +c.dataset.u; ui.sel = ui.sel === u ? null : u; ui.msg = ''; renderGems();
  });
  // Tapping an empty skill bar slot opens the editor; a locked one says when it unlocks.
  for (const slot of SLOT_ORDER) $(SLOT_ID[slot]).addEventListener('pointerdown', () => {
    if (G.paused) return;
    if ($(SLOT_ID[slot]).classList.contains('empty')) openGems(true);
    else if ($(SLOT_ID[slot]).classList.contains('locked')) toast(`${BAR_SLOTS[slot].name} unlocks at level ${BAR_SLOTS[slot].unlock}`);
  });
}
Object.assign(dbg, { openGems, gemUi: ui });

// Modal panels: inventory (bag), passive tree (ui/tree.js), shrine choice, skill gems, main menu. Opening any of them pauses the game.
import { G, P, S } from '../core/state.js';
import { SLOTS, GLY, DROP } from '../data/items.js';
import { openTree, initTree } from './tree.js';
import { clearHeld } from '../input/input.js';
import { $ } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { computeStats, recalc, estimate } from '../game/stats.js';
import { modText, baseKind } from '../game/items.js';
import { save } from '../game/save.js';
import { GEMS, SUPPORTS, SLOT_DEFS, BAR, GEM, supFits, gemDef } from '../data/gems.js';
import { SK } from '../data/skills.js';
import { gemById, barGem, unlocked, fits, slotOf, ownsGem, placeGem, clearSlot, shrineOffer, takeShrine, shrineDue, isSupport, socketed, sockOf, nextSock, supActive, socketGem, unsocket, inBag, feedGem, feedPreview } from '../game/gems.js';
import { toast } from '../render/fx.js';
import { xpNeedFor, monsterStats, armourCut } from '../game/formulas.js';
import { DMG_COL, DMG_ICON } from '../data/graphics.js';
import { DEFENCE, ESTIMATE } from '../data/balance.js';

const isOpen = id => $(id).classList.contains('show');
export function syncPause() { G.paused = !G.started || ['mInv', 'mTree', 'mMenu', 'mShrine', 'mGems'].some(isOpen); clearHeld(); }

// ================= INVENTORY =================
const ui = { sel: null };
function itemHTML(it) {
  let h = `<div class="nm r${it.rar}">${it.name}</div><div class="base">${it.rar >= 2 ? it.base + ' · ' : ''}${baseKind(it) ? baseKind(it) + ' ' : ''}${it.slot} · item level ${it.il}</div>`;
  it.mods.forEach(([st, v], i) => { h += `<div class="${i < (it.impl || 0) ? 'impl' + (i === it.impl - 1 ? ' last' : '') : 'mod' + (it.rar === 3 ? ' u' : '')}">${modText(st, v)}</div>`; });
  if (it.fl) h += `<div class="fl">${it.fl}</div>`;
  return h;
}
function cmpHTML(it) {
  const st = computeStats({ ...P.gear, [it.slot]: it }), cur = estimate(S), nx = estimate(st, S);
  const line = (n, a, b, f = v => Math.round(v)) => {
    const d = b - a; if (Math.abs(d) < .05) return '';
    const p = a ? Math.round(d / a * 100) : 0;
    return `<div>${n}: ${f(a)} → <span class="${d >= 0 ? 'up' : 'dn'}">${f(b)} (${d >= 0 ? '+' : ''}${p}%)</span></div>`;
  };
  return `<div class="cmp"><div style="color:var(--dim)">If equipped${P.gear[it.slot] ? ' (replaces ' + P.gear[it.slot].name + ')' : ''}:</div>${nx.value > ESTIMATE.value.upgrade ? '<div class="up">▲ An upgrade overall</div>' : nx.value < 1 / ESTIMATE.value.upgrade ? '<div class="dn">▼ Worse overall</div>' : ''}${line(cur.gem + ' DPS', cur.dps, nx.dps)}${line('Max life', cur.life, nx.life)}${line('Effective life (after armour and resistances)', cur.ehp, nx.ehp)}${line('Move speed', cur.ms, nx.ms, v => v.toFixed(1))}${line('Armour', cur.armour, nx.armour)}${Object.keys(RES_N).map(k => line(RES_N[k] + ' resistance', cur.res[k] * 100, nx.res[k] * 100, v => Math.round(v) + '%')).join('')}</div>`;
}
// The character sheet's defence line (design notes "Defence"): life, armour (and what it takes off a typical hit on this map), and
// each resistance in its damage type's colour (capped ones say so).
const RES_N = { fire: 'Fire', cold: 'Cold', light: 'Lightning', poison: 'Poison' };
function defHTML() {
  const z = monsterStats('zombie', G.tier), cut = Math.round(armourCut(S.armour, z.dmg) * 100);
  const res = Object.keys(RES_N).map(k => `<span style="color:${DMG_COL[k]}">${DMG_ICON[k]} ${RES_N[k]} ${Math.round(S.res[k] * 100)}%${S.resRaw[k] > DEFENCE.resCap ? ' (max)' : ''}</span>`).join(' · ');
  return `<div>♥ Life ${S.maxLife} · <span style="color:#c8ccd4">⛊ Armour ${S.armour}</span>${S.armour ? ` <span style="color:var(--dim)">(−${cut}% of a ${Math.round(z.dmg)} hit; less off bigger ones)</span>` : ''}</div><div>${res}</div>`;
}
// An upgrade: damage and effective life together are better (formulas.js gearValue; armour and resistances count through the real maths).
export const isUpgrade = it => estimate(computeStats({ ...P.gear, [it.slot]: it }), S).value > ESTIMATE.value.upgrade;

export function renderInv() {
  const sel = ui.sel;
  $('gearGrid').innerHTML = SLOTS.map(s => {
    const it = P.gear[s];
    return `<div class="cell g ${it ? 'c' + it.rar : ''} ${sel && sel.g === s ? 'sel' : ''}" data-g="${s}">${it ? GLY[s] : `<span style="color:#3a2a1a">${GLY[s]}</span>`}<small>${it ? it.name.slice(0, 18) : s}</small></div>`;
  }).join('');
  let h = '';
  for (let i = 0; i < DROP.bagSize; i++) { const it = P.inv[i]; h += `<div class="cell ${it ? 'c' + it.rar : ''} ${sel && sel.i === i ? 'sel' : ''}" data-i="${i}"${it && isUpgrade(it) ? ' style="box-shadow:inset 0 0 0 2px #5fe39a"' : ''}>${it ? GLY[it.slot] : ''}</div>`; }
  $('invGrid').innerHTML = h; $('defSheet').innerHTML = defHTML();
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
export function openInv(v) { $('mInv').classList.toggle('show', v); if (v) { P.newItems = 0; ui.sel = null; renderInv(); $('mTree').classList.remove('show'); } syncPause(); }
export const toggleInv = () => openInv(!isOpen('mInv'));

// ================= PASSIVE TREE (ui/tree.js draws it) =================
export function openPass() { $('mTree').classList.add('show'); $('mInv').classList.remove('show'); $('mGems').classList.remove('show'); openTree(); syncPause(); }
export function closePass() { $('mTree').classList.remove('show'); syncPause(); }
export const togglePass = () => isOpen('mTree') ? closePass() : openPass();
export function closeAll() { $('mInv').classList.remove('show'); $('mGems').classList.remove('show'); closeShrine(); closePass(); }

// ================= SHRINE (pick 1 of 3 skill gems for a newly unlocked slot) =================
const gemCard = (id, extra = '') => { const D = GEMS[id], K = SK[D.sk]; return `<div class="pc gemc" data-k="${id}"><b style="color:${D.col}">${D.icon} ${D.n}</b><span>${D.d}.</span><span class="gm">${D.melee ? `Melee · attacks on its own in reach · ${K.cast}s per swing` : D.shield ? 'Shield art · hold Guard to block, press to parry' : D.held ? `Hold to cast · ${K.cast}s per cast` : 'Press to cast'}${K.cd ? ` · ${K.cd}s cooldown` : ''}${K.recharge ? ` · charge every ${K.recharge}s` : ''}</span><em>LEVEL 5: ${D.ms[5].toUpperCase()}${extra}</em></div>`; };
let shrineSlot = null;
export function openShrine(slot) {
  if (!shrineDue().includes(slot)) return;
  shrineSlot = slot; const S = SLOT_DEFS[slot], offer = shrineOffer(slot);
  $('shrineT').textContent = `SHRINE · ${S.n.toUpperCase()} SLOT`;
  $('shrineSub').textContent = slot === 'main' ? 'Choose your melee attack. It swings on its own at whatever is in reach; your shield (Space) blocks and parries the big hits. You start with these two; more slots open at levels 5, 8 and 12.'
    : slot === 'guard' ? 'A shrine of shield arts. Take one into your bag, then swap it with the Knight\'s Shield in the gem panel (G) if you like. It still blocks and parries; the art changes what a parry does.'
    : `${S.n} unlocked at level ${S.unlock}. ${offer.length > 1 ? 'Choose one' : 'Take it'}; the others may drop later.`;
  $('shrineCards').innerHTML = offer.map(id => gemCard(id)).join('');
  $('shrineClose').style.display = slot === 'main' ? 'none' : '';
  ['mInv', 'mTree', 'mGems'].forEach(id => $(id).classList.remove('show'));
  $('mShrine').classList.add('show'); syncPause();
}
export function closeShrine() { $('mShrine').classList.remove('show'); syncPause(); }

// ================= SKILL GEMS (bar + sockets + bag; tap a gem, then a slot or socket; feed spare gems) =================
// gui.sel: the selected gem id. gui.feed: the gem being fed (waiting for a target), gui.into: the chosen target (waiting to confirm).
const gui = { sel: null, feed: null, into: null };
const supFor = sup => SUPPORTS[sup].for.map(x => (GEMS[x] && GEMS[x].n) || x + ' gems').join(', ');
function gemCell(g, s) {
  const D = g && gemDef(g.gem), sup = isSupport(g);
  return `<div class="cell gcell ${g && gui.sel === g.id ? 'sel' : ''} ${sup ? 'sup' : ''}" ${s ? `data-s="${s}"` : `data-id="${g.id}"`} style="${D ? 'color:' + D.col : ''}">${D ? D.icon : ''}${D ? `<b>L${g.lvl}</b>` : ''}${s ? `<small>${SLOT_DEFS[s].n}</small>` : sup ? '<small>support</small>' : ''}</div>`;
}
function sockCells(s) {
  const sg = barGem(s), nx = nextSock(s);
  let h = socketed(s).map((g, i) => {
    const D = g && gemDef(g.gem), off = g && (!sg || !supFits(g.gem, sg.gem));
    return `<div class="cell scell ${g && gui.sel === g.id ? 'sel' : ''} ${off ? 'off' : ''}" data-s="${s}" data-i="${i}" title="${D ? D.n + (off ? ' (does nothing here)' : '') : 'Empty socket: tap a support gem, then this'}" style="${D ? 'color:' + D.col : ''}">${D ? D.icon : '◇'}</div>`;
  }).join('');
  if (nx) h += `<div class="cell scell locked" title="Another socket at level ${nx[0]}">L${nx[0]}</div>`;
  return `<div class="socks">${h}</div>`;
}
function feedHTML() {
  const food = gemById(gui.feed); if (!food) return '';
  const D = gemDef(food.gem);
  if (!gui.into) return `<div class="nm" style="color:${D.col}">Feed ${D.icon} ${D.n} L${food.lvl}</div><div>Tap the gem to feed it into (on the bar, in a socket or in the bag). Same gem: 100% of its XP; same kind: 50%; anything else: 25%.</div><div class="row" style="margin-top:8px"><button id="gFeedX">CANCEL</button></div>`;
  const f = feedPreview(gui.feed, gui.into); if (!f) return '<div style="color:#ff6a5a">That gem can\'t take it.</div><div class="row" style="margin-top:8px"><button id="gFeedX">CANCEL</button></div>';
  const T = gemDef(f.into.gem);
  return `<div class="nm" style="color:${T.col}">Feed into ${T.icon} ${T.n}</div>`
    + `<div>${D.n} L${food.lvl} gives <b>${Math.round(f.gain)} XP</b> (${Math.round(f.share * 100)}% of ${Math.round(f.ap)}). ${T.n} goes from level ${f.into.lvl} to <b class="up">level ${f.lvl}</b>.</div>`
    + `<div style="color:var(--dim)">${f.last ? `It's your only ${D.n}: a level 1 copy stays in your bag, so you never lose the skill.` : `You have another ${D.n}; this copy is used up.`}${f.waste ? ` ${Math.round(f.waste)} XP is lost over the level cap.` : ''}</div>`
    + `<div class="row" style="margin-top:8px"><button class="pri" id="gFeedGo">FEED</button><button id="gFeedX">CANCEL</button></div>`;
}
export function renderGems() {
  $('gemBar').innerHTML = BAR.map(s => `<div class="gcol">${unlocked(s) ? gemCell(barGem(s), s) + sockCells(s) : `<div class="cell gcell locked"><span>🔒</span><small>${SLOT_DEFS[s].n} · Lv ${SLOT_DEFS[s].unlock}</small></div>`}</div>`).join('');
  const bag = P.gems.filter(inBag).sort((a, b) => isSupport(a) - isSupport(b) || a.gem.localeCompare(b.gem) || b.lvl - a.lvl);
  $('gemBag').innerHTML = bag.length ? bag.map(g => gemCell(g)).join('') : '<span style="color:var(--dim);font-size:11px">No spare gems. Guardians always drop one, rares sometimes.</span>';
  const tip = $('gemTip');
  if (gui.feed) { tip.innerHTML = feedHTML(); if ($('gFeedGo')) $('gFeedGo').onclick = () => { const f = feedGem(gui.feed, gui.into); if (f) toast(`<span style="color:${gemDef(f.into.gem).col}">${gemDef(f.into.gem).n}</span> +${Math.round(f.gain)} XP`); gui.feed = gui.into = null; gui.sel = f ? f.into.id : null; renderGems(); save(); }; $('gFeedX').onclick = () => { gui.feed = gui.into = null; renderGems(); }; return; }
  const g = gemById(gui.sel);
  if (!g) { tip.innerHTML = '<span style="color:var(--dim)">Tap a gem, then a slot to put it there. Support gems go in the small sockets under a slot and change only that skill. Gems in use earn full XP; spare gems earn 10%. Spare gems can be fed into others.</span>'; return; }
  const D = gemDef(g.gem), s = slotOf(g), at = sockOf(g), need = xpNeedFor(g.lvl), sup = isSupport(g);
  const where = sup ? `works with ${supFor(g.gem)}` : 'goes in ' + BAR.filter(x => fits(g.gem, x)).map(x => SLOT_DEFS[x].n).join(' or ');
  let h = `<div class="nm" style="color:${D.col}">${D.icon} ${D.n}</div><div class="base">${sup ? 'support' : D.kind} gem · level ${g.lvl}/${GEM.cap}${g.lvl < GEM.cap ? ` · ${Math.floor(g.xp)}/${need} XP` : ' · maxed'} · ${where}</div><div>${D.d}.</div>`;
  h += Object.entries(D.ms).map(([l, t]) => `<div class="${g.lvl >= l ? 'up' : ''}" style="${g.lvl >= l ? '' : 'color:var(--dim)'}">Level ${l}: ${t}${g.lvl >= l ? ' ✓' : ''}</div>`).join('');
  if (sup && at) h += supActive(g) ? `<div class="up">Socketed in ${SLOT_DEFS[at[0]].n} with ${GEMS[barGem(at[0]).gem].n}</div>` : `<div style="color:#ff6a5a">In ${SLOT_DEFS[at[0]].n}, but it does nothing for the gem there</div>`;
  const btn = [];
  if (s && unlocked(s)) btn.push('<button id="gRem">TAKE OFF THE BAR</button>');
  if (at) btn.push('<button id="gUns">TAKE OUT OF THE SOCKET</button>');
  if (inBag(g)) btn.push('<button id="gFeed">FEED INTO…</button>');
  tip.innerHTML = h + (btn.length ? `<div class="row" style="margin-top:8px">${btn.join('')}</div>` : '');
  if ($('gRem')) $('gRem').onclick = () => { clearSlot(s); renderGems(); save(); };
  if ($('gUns')) $('gUns').onclick = () => { unsocket(at[0], at[1]); renderGems(); save(); };
  if ($('gFeed')) $('gFeed').onclick = () => { gui.feed = g.id; gui.into = null; renderGems(); };
}
// A tap on a gem while feeding picks the target; otherwise it selects.
function gemTap(id) { if (gui.feed) { if (id !== gui.feed) gui.into = id; } else gui.sel = gui.sel === id ? null : id; renderGems(); }
export function openGems(v) { $('mGems').classList.toggle('show', v); if (v) { gui.sel = gui.feed = gui.into = null; P.newGems = 0; renderGems(); $('mInv').classList.remove('show'); $('mTree').classList.remove('show'); } syncPause(); }
export const toggleGems = () => openGems(!isOpen('mGems'));

export function initPanels() {
  $('gearGrid').addEventListener('click', e => { const c = e.target.closest('.cell'); if (c) { ui.sel = { g: c.dataset.g }; renderInv(); } });
  $('invGrid').addEventListener('click', e => { const c = e.target.closest('.cell'); if (c && P.inv[+c.dataset.i]) { ui.sel = { i: +c.dataset.i }; renderInv(); } });
  $('junkMagic').onclick = () => { P.inv = P.inv.filter(it => it.rar !== 1); ui.sel = null; renderInv(); save(); };
  $('bInv').onclick = toggleInv; $('invClose').onclick = () => openInv(false);
  initTree(); $('bPass').onclick = togglePass; $('treeClose').onclick = closePass;
  $('shrineCards').addEventListener('click', e => {
    const c = e.target.closest('.pc'); if (!c || !shrineSlot) return;
    if (takeShrine(shrineSlot, c.dataset.k)) { save(); closeShrine(); }
  });
  $('shrineClose').onclick = closeShrine;
  $('bGems').onclick = toggleGems; $('gemClose').onclick = () => openGems(false);
  $('gemBar').addEventListener('click', e => {
    const c = e.target.closest('.cell'); if (!c || !c.dataset.s) return;
    const s = c.dataset.s, sel = gemById(gui.sel);
    if (c.dataset.i !== undefined) { // a socket
      const i = +c.dataset.i, cur = socketed(s)[i];
      if (gui.feed) { if (cur) gemTap(cur.id); return; }
      if (isSupport(sel) && sel !== cur) { if (socketGem(sel.id, s, i)) { gui.sel = null; save(); } else toast(barGem(s) ? `${gemDef(sel.gem).n} doesn't work with ${GEMS[barGem(s).gem].n}` : 'Put a skill gem in that slot first'); }
      else gui.sel = cur && gui.sel !== cur.id ? cur.id : null;
      return renderGems();
    }
    const cur = barGem(s);
    if (gui.feed) { if (cur) gemTap(cur.id); return; }
    if (isSupport(sel)) { if (socketGem(sel.id, s)) { gui.sel = null; save(); } else toast(cur ? `${gemDef(sel.gem).n} doesn't work with ${GEMS[cur.gem].n}` : 'Put a skill gem in that slot first'); }
    else if (sel && sel !== cur) { if (placeGem(sel.id, s)) { gui.sel = null; save(); } }
    else gui.sel = cur && gui.sel !== cur.id ? cur.id : null;
    renderGems();
  });
  $('gemBag').addEventListener('click', e => { const c = e.target.closest('.cell'); if (!c || !c.dataset.id) return; gemTap(+c.dataset.id); });
}

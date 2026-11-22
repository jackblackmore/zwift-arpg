// The passive tree panel (modal #mPass, markup in index.html). The tree (data/tree.js) is drawn in SVG: tinted regions, links, nodes
// (small < notable < keystone hexagon). Drag to pan, wheel or pinch to zoom, fit-to-screen on open. Tap a node to select it: the bar
// at the bottom shows its stats in words and ALLOCATE / REFUND buttons. Nothing needs hover. Logic is game/tree.js.
import { P, S } from '../core/state.js';
import { TREE, TREE_START, STAT_TEXT, RESPEC } from '../data/tree.js';
import { alloc, refund, allocReason, refundReason, resetTree, isAlloc, spent } from '../game/tree.js';
import { toast } from '../render/fx.js';
import { SFX } from '../core/audio.js';
import { dbg } from '../core/dbg.js';
import { $ } from '../core/util.js';
import { syncPause } from './panels.js';

const COL = { core: '#d2c08a', fire: '#ff8a3c', cold: '#7fd8ff', lightning: '#c98bff' };
const BLOBS = [['core', 0, 0, 36], ['fire', -45, -45, 52], ['cold', 45, -45, 52], ['lightning', 0, 66, 52]]; // region tint circles: centre and radius in tree units
const RAD = { start: 4.6, small: 2.7, notable: 4.1, keystone: 5.6 };
const ZMAX = 16; // px per tree unit at full zoom
const ui = { sel: null, k: 1, x: 0, y: 0, fitK: 1, ask: 0, ptrs: new Map(), gest: null };
const isOpen = () => $('mPass').classList.contains('show');
const svg = () => $('treeSvg');

// ---- view: px = tree * k + (x, y) ----
const apply = () => { $('treeG').setAttribute('transform', `translate(${ui.x} ${ui.y}) scale(${ui.k})`); svg().classList.toggle('zoomed', ui.k > ui.fitK * 2); };
function fit() {
  const W = svg().clientWidth, H = svg().clientHeight; if (!W || !H) return;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const n of Object.values(TREE)) { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y); }
  const bw = x1 - x0 + 22, bh = y1 - y0 + 22;
  ui.fitK = ui.k = Math.min(W / bw, H / bh); ui.x = W / 2 - (x0 + x1) / 2 * ui.k; ui.y = H / 2 - (y0 + y1) / 2 * ui.k; apply();
}
// Zoom by factor f keeping the screen point (px, py) fixed.
function zoomAt(f, px, py) {
  const k = Math.max(ui.fitK * .8, Math.min(ZMAX, ui.k * f)); f = k / ui.k;
  ui.x = px - (px - ui.x) * f; ui.y = py - (py - ui.y) * f; ui.k = k; apply();
}
const local = e => { const r = svg().getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
// The node nearest a screen point, within a finger-sized radius (nodes are small at fit zoom, so hit areas are in pixels).
function pick(px, py) {
  let best = null, bd = 1e9;
  for (const id in TREE) {
    const n = TREE[id], d = Math.hypot(n.x * ui.k + ui.x - px, n.y * ui.k + ui.y - py), lim = Math.max(RAD[n.kind] * ui.k + 6, 15);
    if (d < lim && d < bd) { bd = d; best = id; }
  }
  return best;
}

// ---- drawing ----
const hex = (x, y, r) => Array.from({ length: 6 }, (_, i) => `${(x + r * Math.cos(i * Math.PI / 3 + Math.PI / 6)).toFixed(2)},${(y + r * Math.sin(i * Math.PI / 3 + Math.PI / 6)).toFixed(2)}`).join(' ');
function drawTree() {
  let h = '<defs>' + BLOBS.map(([r]) => `<radialGradient id="tb-${r}"><stop offset="0" stop-color="${COL[r]}" stop-opacity=".2"/><stop offset="1" stop-color="${COL[r]}" stop-opacity="0"/></radialGradient>`).join('') + '</defs>';
  for (const [r, x, y, rad] of BLOBS) h += `<circle cx="${x}" cy="${y}" r="${rad}" fill="url(#tb-${r})"/>`;
  const done = new Set();
  for (const id in TREE) for (const l of TREE[id].links) {
    const key = id < l ? id + l : l + id; if (done.has(key)) continue; done.add(key);
    const a = TREE[id], b = TREE[l], ia = isAlloc(id), ib = isAlloc(l), on = ia && ib, edge = ia !== ib, c = COL[(ia ? a : b).region];
    h += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${on ? c : edge ? '#7a6a4a' : '#3a2e22'}" stroke-width="${on ? 1.1 : .7}" ${on ? '' : 'opacity=".85"'}/>`;
  }
  for (const id in TREE) {
    const n = TREE[id], c = COL[n.region], r = RAD[n.kind], on = isAlloc(id), can = !on && !allocReason(id), sel = ui.sel === id;
    const fill = on ? c : '#120c08', stroke = on ? '#fff6dc' : can ? '#ffe9a8' : c, sw = on ? .8 : can ? 1 : .6, op = on || can ? 1 : .55;
    const shape = n.kind === 'keystone' ? `<polygon points="${hex(n.x, n.y, r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw + .4}" opacity="${op}"/>`
      : `<circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"/>`;
    h += shape;
    if (n.kind === 'notable' || n.kind === 'start') h += `<circle cx="${n.x}" cy="${n.y}" r="${r + 1.3}" fill="none" stroke="${c}" stroke-width=".5" opacity="${on ? .9 : .4}"/>`;
    if (n.kind === 'keystone' && !on) h += `<circle cx="${n.x}" cy="${n.y}" r="1.6" fill="${c}" opacity=".7"/>`;
    if (can) h += `<circle class="ring" cx="${n.x}" cy="${n.y}" r="${r + 2.4}" fill="none" stroke="#ffe9a8" stroke-width=".7"/>`;
    if (sel) h += `<circle cx="${n.x}" cy="${n.y}" r="${r + 3.6}" fill="none" stroke="#fff" stroke-width="1"/>`;
    if (n.kind !== 'small') h += `<text class="lbl" x="${n.x}" y="${n.y + r + 4.6}">${n.name}</text>`;
  }
  $('treeG').innerHTML = h;
}

const pct = v => Math.round(v * 100);
function totals() {
  const bits = [`<b>${S.maxLife}</b> life`, `<b>+${pct(S.inc)}%</b> damage`];
  for (const [k, n] of [['fire', 'fire'], ['cold', 'cold'], ['light', 'lightning']]) if (S[k]) bits.push(`<b>+${pct(S[k])}%</b> ${n}`);
  if (S.cdr) bits.push(`<b>${pct(S.cdr)}%</b> cooldown`);
  bits.push(`<b>+${pct(S.ms / 5.4 - 1)}%</b> move speed`);
  if (S.surgeCap) bits.push(`<b>+${pct(S.surgeCap)}%</b> Surge`);
  if (S.more !== 1) bits.push(`<b>${S.more > 1 ? '+' : ''}${pct(S.more - 1)}%</b> more damage`);
  return bits.join(' · ');
}
function detail() {
  const id = ui.sel, n = id && TREE[id];
  if (!n) return '<div class="tinfo"><div class="ts" style="color:var(--dim)">Tap a node to inspect it. Drag to move, pinch or scroll to zoom. Glowing rings are nodes you can take now.</div></div>';
  const on = isAlloc(id), ar = allocReason(id), rr = refundReason(id), lines = Object.entries(n.stats).map(([s, v]) => `<div class="ts">${STAT_TEXT[s] ? STAT_TEXT[s](v) : s + ' ' + v}</div>`).join('');
  const kind = { start: 'START', small: 'PASSIVE', notable: 'NOTABLE', keystone: 'KEYSTONE' }[n.kind];
  const why = on ? (id === TREE_START ? '' : rr ? rr : 'Allocated · refund is free') : ar || 'Available · costs 1 point';
  return `<div class="tinfo"><b style="color:${COL[n.region]}">${n.name}</b><span class="tk">${kind}</span>${lines}${n.desc ? `<div class="ts key">${n.desc}</div>` : ''}<div class="why">${why}</div></div>
    <div class="tact"><button class="pri" id="tAlloc"${ar ? ' disabled' : ''}>ALLOCATE</button><button id="tRefund"${on && !rr ? '' : ' disabled'}>REFUND</button></div>`;
}
export function renderTree() {
  const sp = spent();
  $('treePts').textContent = P.pts ? `${P.pts} to spend` : 'none to spend';
  $('treePts').classList.toggle('none', !P.pts);
  $('treeTot').innerHTML = totals() + ` · ${sp} allocated`;
  const rb = $('treeReset'); rb.disabled = !sp; rb.classList.toggle('ask', !!ui.ask); rb.textContent = ui.ask ? 'CONFIRM RESET?' : 'RESET TREE';
  drawTree(); $('treeSel').innerHTML = detail();
}

export function select(id) { ui.sel = id; renderTree(); }
function doReset() {
  if (!ui.ask) { ui.ask = setTimeout(() => { ui.ask = 0; if (isOpen()) renderTree(); }, RESPEC.confirmMs); renderTree(); return; }
  clearTimeout(ui.ask); ui.ask = 0; const n = resetTree(); toast(`Tree reset: ${n} point${n === 1 ? '' : 's'} refunded` + (RESPEC.resetGold ? ` (cost ${RESPEC.resetGold} gold)` : '')); SFX.loot(1); renderTree();
}

export function openPass() { $('mPass').classList.add('show'); for (const m of ['mInv', 'mGems']) $(m).classList.remove('show'); ui.ask = 0; renderTree(); fit(); syncPause(); }
export function closePass() { $('mPass').classList.remove('show'); syncPause(); }
export const togglePass = () => (isOpen() ? closePass() : openPass());

export function initTree() {
  const s = svg();
  $('bPass').onclick = togglePass; $('passClose').onclick = closePass; $('treeReset').onclick = doReset;
  $('treeSel').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled || !ui.sel) return;
    if (b.id === 'tAlloc' && alloc(ui.sel)) SFX.loot(1); else if (b.id === 'tRefund') refund(ui.sel);
    renderTree();
  });
  s.addEventListener('wheel', e => { e.preventDefault(); const [px, py] = local(e); zoomAt(Math.exp(-e.deltaY * .0015), px, py); }, { passive: false });
  // One pointer pans (a press that doesn't move is a tap on a node); two pointers pinch-zoom around their midpoint.
  const gesture = () => {
    const p = [...ui.ptrs.values()];
    ui.gest = p.length === 2 ? { pinch: 1, d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, mx: (p[0].x + p[1].x) / 2, my: (p[0].y + p[1].y) / 2 }
      : p.length === 1 ? { pinch: 0, x: p[0].x, y: p[0].y, moved: ui.gest ? ui.gest.moved : false, sx: p[0].x, sy: p[0].y } : null;
  };
  s.addEventListener('pointerdown', e => { s.setPointerCapture(e.pointerId); const [x, y] = local(e); ui.ptrs.set(e.pointerId, { x, y }); const was = ui.gest && ui.gest.moved; gesture(); if (ui.gest && ui.ptrs.size === 2) ui.gest.moved = true; else if (was) ui.gest.moved = true; });
  s.addEventListener('pointermove', e => {
    if (!ui.ptrs.has(e.pointerId)) return; const [x, y] = local(e), g = ui.gest; ui.ptrs.set(e.pointerId, { x, y }); if (!g) return;
    if (g.pinch && ui.ptrs.size === 2) {
      const p = [...ui.ptrs.values()], d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2;
      ui.x += mx - g.mx; ui.y += my - g.my; zoomAt(d / g.d, mx, my); g.d = d; g.mx = mx; g.my = my;
    } else if (!g.pinch) {
      if (!g.moved && Math.hypot(x - g.sx, y - g.sy) > 6) { g.moved = true; s.classList.add('drag'); }
      if (g.moved) { ui.x += x - g.x; ui.y += y - g.y; g.x = x; g.y = y; apply(); }
    }
  });
  const up = e => {
    if (!ui.ptrs.has(e.pointerId)) return; const [x, y] = local(e), g = ui.gest; ui.ptrs.delete(e.pointerId);
    if (g && !g.pinch && !g.moved && e.type === 'pointerup') select(pick(x, y)); // a tap (on empty ground it clears the selection)
    s.classList.remove('drag'); gesture(); if (ui.gest && ui.gest.pinch === 0) ui.gest.moved = true; // the finger left from a pinch must not tap
  };
  s.addEventListener('pointerup', up); s.addEventListener('pointercancel', up);
  window.addEventListener('resize', () => { if (isOpen()) fit(); });
}

Object.assign(dbg, { treeSelect: select, treeView: () => ({ k: ui.k, x: ui.x, y: ui.y, fitK: ui.fitK }), treeFit: fit, treePick: pick, treeRender: renderTree, treeSel: () => ui.sel });

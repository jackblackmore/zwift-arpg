// The passive tree panel (P or the TREE button): the node graph as an SVG, tap a node to see it, tap again (or TAKE) to spend a
// point on it. Drawn tall when the screen is upright (a phone) and on its side when it's wide. Data in data/tree.js, rules in game/tree.js.
import { P, S } from '../core/state.js';
import { TREE, TREE_START } from '../data/tree.js';
import { TREE_PRESETS, PAR_TREE } from '../data/balance.js';
import { TREE_ADJ } from '../game/formulas.js';
import { treeLeft, canTake, take, canDrop, drop, canRespec, respec, respecWhere, spendPreset } from '../game/tree.js';
import { barGem } from '../game/gems.js';
import { save } from '../game/save.js';
import { $ } from '../core/util.js';
import { SFX } from '../core/audio.js';
import { toast } from '../render/fx.js';

// A node's look from its first stat: colour and glyph.
const LOOK = {
  dmg: ['#e6dcc6', '⚔'], fire: ['#ff8a3c', '✹'], cold: ['#7fd8ff', '❄'], light: ['#c98bff', 'ϟ'], cast: ['#5fe39a', '≫'], crit: ['#ffffff', '✧'], aoe: ['#ffb070', '◎'],
  ms: ['#5fe39a', '»'], lifePct: ['#ff5a5a', '♥'], lregen: ['#ff5a5a', '✚'], lok: ['#ff6a8a', '♥'], surge: ['#ffd23f', '⚡'], surgeRe: ['#ffd23f', '⚡'], flask: ['#ff4a5a', '⚗'],
  freeze: ['#7fd8ff', '❄'], block: ['#e8d8a8', '⛨'], heavy: ['#e8d8a8', '⛨'], posture: ['#e8d8a8', '▣'], drain: ['#e8d8a8', '▣'], parry: ['#ffe27a', '✦'], riposte: ['#ffd23f', '⚔'],
  stagger: ['#ffb040', '✸'], finisher: ['#ffffff', '☠'], evadeInv: ['#c8e0ff', '↻'], evadeCh: ['#c8e0ff', '↻'],
};
const KEYLOOK = { riposte: ['#ffd23f', '⚔'], duelist: ['#ffe27a', '✦'], bulwark: ['#e8d8a8', '⛨'], blood: ['#d02030', '♦'] };
export const nodeLook = id => { const N = TREE[id]; return N.kind === 'key' ? KEYLOOK[id] || ['#ff5a3c', '◆'] : N.kind === 'start' ? ['#c8a25a', '✠'] : LOOK[Object.keys(N.v)[0]] || ['#e6dcc6', '•']; };
const KIND = { start: 'START', small: 'PASSIVE', notable: 'NOTABLE', key: 'KEYSTONE' };
const R = { start: 3.6, small: 2.7, notable: 3.6, key: 4.4 }; // radius in grid cells × 10

const ui = { sel: null, wide: false };
const held = id => id === TREE_START || P.tree.includes(id);
const pos = id => { const [c, r] = TREE[id].at; return ui.wide ? [r * 10 + 5, c * 10 + 5] : [c * 10 + 5, r * 10 + 5]; };
const presetFor = () => { const g = barGem('main'); return TREE_PRESETS[(g && PAR_TREE[g.gem]) || 'shield']; };

function svg() {
  const W = ui.wide ? 150 : 70, H = ui.wide ? 70 : 150;
  let edges = '', nodes = '';
  const done = new Set();
  for (const a in TREE) for (const b of TREE_ADJ[a]) {
    const k = a < b ? a + '|' + b : b + '|' + a; if (done.has(k)) continue; done.add(k);
    const [x1, y1] = pos(a), [x2, y2] = pos(b), both = held(a) && held(b), one = held(a) || held(b);
    edges += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="te ${both ? 'on' : one ? 'near' : ''}"/>`;
  }
  for (const id in TREE) {
    const N = TREE[id], [x, y] = pos(id), [col, gl] = nodeLook(id), r = R[N.kind], h = held(id), can = !h && canTake(id);
    const cls = `tn ${N.kind} ${h ? 'held' : can ? 'can' : ''} ${ui.sel === id ? 'sel' : ''}`;
    const shape = N.kind === 'key' ? `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" transform="rotate(45 ${x} ${y})" class="body" style="--c:${col}"/>`
      : `<circle cx="${x}" cy="${y}" r="${r}" class="body" style="--c:${col}"/>`;
    nodes += `<g class="${cls}" data-id="${id}"><circle cx="${x}" cy="${y}" r="4.9" class="hit"/>${shape}${N.kind === 'notable' ? `<circle cx="${x}" cy="${y}" r="${r + 1}" class="ring" style="--c:${col}"/>` : ''}<text x="${x}" y="${y + r * .38}" style="font-size:${r * 1.05}px;fill:${h ? '#140e0a' : col}">${gl}</text></g>`;
  }
  return `<svg id="treeSvg" viewBox="0 0 ${W} ${H}" class="${ui.wide ? 'wide' : 'tall'}" xmlns="http://www.w3.org/2000/svg">${edges}${nodes}</svg>`;
}

// What the held nodes add up to, in a line (S.fight and the stat sums).
function summary() {
  if (!P.tree.length) return 'Nothing taken yet. Every level gives a point; start next to the centre.';
  const F = S.fight, out = [], pc = v => Math.round(v * 100) + '%';
  const sum = {}; for (const id of P.tree) for (const k in TREE[id].v) if (TREE[id].kind !== 'key') sum[k] = (sum[k] || 0) + TREE[id].v[k];
  const name = { dmg: 'damage', fire: 'fire', cold: 'cold', light: 'lightning', cast: 'attack and cast speed', crit: 'crit chance', aoe: 'area', ms: 'move speed', lifePct: 'life', surge: 'Surge capacity', surgeRe: 'Surge refill', flask: 'flask healing', freeze: 'freeze duration', block: 'block', heavy: 'heavy block', parry: 'parry window', riposte: 'riposte damage', stagger: 'stagger fill', finisher: 'finisher damage', evadeInv: 'Evade invulnerability', drain: 'posture drain' };
  for (const k in sum) {
    if (k === 'lregen') out.push(`+${sum[k]} life/s`); else if (k === 'lok') out.push(`+${sum[k]} life per kill`); else if (k === 'evadeCh') out.push(`+${sum[k]} Evade charge`);
    else if (k === 'posture') out.push(`posture fills ${pc(F.posture)} slower`); else if (name[k]) out.push(`+${pc(sum[k])} ${name[k]}`);
  }
  const ks = Object.keys(S.ks || {}).map(k => `<b style="color:${nodeLook(k)[0]}">${TREE[k].n}</b>`);
  return (ks.length ? 'Keystone: ' + ks.join(', ') + ' · ' : '') + out.join(' · ');
}

function tip() {
  const id = ui.sel, N = id && TREE[id];
  if (!N) return `<span style="color:var(--dim)">Tap a node to see it; tap a glowing one again to take it. ${canRespec() ? 'You can reset the whole tree here for free.' : `A full reset is free in ${respecWhere()}.`}</span>`;
  const [col] = nodeLook(id), h = held(id), btn = [];
  if (!h && canTake(id)) btn.push('<button class="pri" id="tTake">TAKE · 1 POINT</button>');
  if (h && id !== TREE_START) btn.push(canDrop(id) ? '<button id="tDrop">GIVE BACK</button>' : `<span class="why">${P.treeNew.includes(id) || canRespec() ? 'Other nodes hang from it' : 'Give it back in ' + respecWhere()}</span>`);
  if (!h && !canTake(id)) btn.push(`<span class="why">${treeLeft() <= 0 ? 'No points left · level up for more' : 'Take a node next to it first'}</span>`);
  return `<div class="nm" style="color:${col}">${N.n} <em>${KIND[N.kind]}</em></div><div>${N.d}.</div>${btn.length ? `<div class="row" style="margin-top:6px">${btn.join('')}</div>` : ''}`;
}

export function renderTree() {
  ui.wide = innerWidth > innerHeight;
  const left = treeLeft();
  $('treeSub').innerHTML = left > 0 ? `<b style="color:var(--gold)">${left} point${left > 1 ? 's' : ''} to spend</b> · glowing nodes are next to ones you hold` : 'No points to spend · each level gives one';
  $('treeWrap').innerHTML = svg();
  $('treeTip').innerHTML = tip();
  $('treeSum').innerHTML = summary();
  $('treeReset').disabled = !P.tree.length; $('treeReset').textContent = canRespec() ? 'RESET (FREE HERE)' : 'RESET';
  $('treeSuggest').disabled = left <= 0;
  if ($('tTake')) $('tTake').onclick = () => tryTake(ui.sel);
  if ($('tDrop')) $('tDrop').onclick = () => { if (drop(ui.sel)) { save(); renderTree(); } };
}
function tryTake(id) { if (take(id)) { SFX.lvl(); save(); renderTree(); } }

export function openTree() {
  P.treeNew = []; ui.sel = null; $('mTree').classList.add('show'); renderTree();
  // A tall tree scrolls: start with its centre in view.
  const w = $('treeWrap'); if (!ui.wide) w.scrollTop = (w.scrollHeight - w.clientHeight) / 2;
}
export function initTree() {
  $('treeWrap').addEventListener('click', e => {
    const g = e.target.closest('.tn'); if (!g) return;
    const id = g.dataset.id;
    if (ui.sel === id && !held(id) && canTake(id)) return tryTake(id); // a second tap takes it
    ui.sel = id; renderTree();
  });
  $('treeReset').onclick = () => {
    if (!canRespec()) { toast(`A full reset is free in ${respecWhere()}`); return; }
    if (respec()) { ui.sel = null; toast('Tree reset · every point is back'); save(); renderTree(); }
  };
  $('treeSuggest').onclick = () => { const n = spendPreset(presetFor()); if (n) { SFX.lvl(); save(); toast(`${n} point${n > 1 ? 's' : ''} spent along a suggested path for your Main gem`); } renderTree(); };
  addEventListener('resize', () => { if ($('mTree').classList.contains('show')) renderTree(); });
}

// Map viewer (/maps/): generated level layouts seen from above, by seed, so the owner can look at what the generator makes.
// Dev tool: it uses the game's own generator (src/world/gen.js) with a seeded rng (src/core/rng.js), and "Play this map"
// opens the game on the same layout with ?seed= (the packs are still placed at random in the game).
import './maps.css';
import { generateLevel, junctionRooms } from '../world/gen.js';
import { seeded } from '../core/rng.js';
import { HERO } from '../data/balance.js';

const $ = id => document.getElementById(id);
const cv = $('view'), ctx = cv.getContext('2d');
const COL = { start: '#5fe39a', main: '#a08a62', side: '#6a8aff', boss: '#ff4fd8' };
const NAME = { start: 'Entrance', main: 'Route room', side: 'Side room', boss: 'Guardian arena' };
const st = { seed: 1, grid: false, cells: [] };
try { const q = new URLSearchParams(location.search).get('seed'); if (q) st.seed = Math.max(1, parseInt(q, 10) || 1); } catch (e) {}

const level = seed => generateLevel({}, seeded(seed));
const junctions = junctionRooms;

// Draws layout L into the box (x, y, s × s). big: labels and the route.
function drawLevel(L, x, y, s, big) {
  const k = s / L.n, inRoom = new Map();
  for (const r of L.rooms) for (let j = r.j0; j < r.j0 + r.h; j++) for (let i = r.i0; i < r.i0 + r.w; i++) inRoom.set(j * L.n + i, r);
  ctx.fillStyle = '#0a0706'; ctx.fillRect(x, y, s, s);
  for (let j = 0; j < L.n; j++) for (let i = 0; i < L.n; i++) {
    if (!L.grid[j * L.n + i]) continue;
    const r = inRoom.get(j * L.n + i); ctx.fillStyle = r ? COL[r.kind] : '#4a3a2a';
    ctx.globalAlpha = r ? .55 : .9; ctx.fillRect(x + i * k, y + j * k, Math.ceil(k), Math.ceil(k));
  }
  ctx.globalAlpha = 1;
  const W = (wx, wz) => [x + (wx + L.half) / (L.cell * L.n) * s, y + (wz + L.half) / (L.cell * L.n) * s];
  if (!big) return;
  // zone lines
  ctx.strokeStyle = '#ffffff10'; ctx.lineWidth = 1;
  for (let z = 1; z < L.zones; z++) { const p = s * z / L.zones; ctx.beginPath(); ctx.moveTo(x + p, y); ctx.lineTo(x + p, y + s); ctx.moveTo(x, y + p); ctx.lineTo(x + s, y + p); ctx.stroke(); }
  // the main route, entrance to guardian
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = Math.max(2, s / 260); ctx.setLineDash([8, 6]); ctx.beginPath();
  L.path.forEach((p, i) => { const [px, pz] = W(p.x, p.z); if (i) ctx.lineTo(px, pz); else ctx.moveTo(px, pz); }); ctx.stroke(); ctx.setLineDash([]);
  // room labels: route order, S for side rooms, ◆ on junctions
  const J = new Set(junctions(L).map(r => r.id));
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const r of L.rooms) {
    const [px, pz] = W(r.x, r.z), lab = r.kind === 'start' ? 'IN' : r.kind === 'boss' ? '♛' : r.kind === 'side' ? 'S' : String(r.rank);
    ctx.font = `800 ${Math.max(11, s / 40)}px Cinzel, serif`; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(lab, px, pz); ctx.fillStyle = '#fff'; ctx.fillText(lab, px, pz);
    if (J.has(r.id)) { ctx.font = `800 ${Math.max(10, s / 55)}px JetBrains Mono, monospace`; ctx.fillStyle = '#ffd23f'; ctx.fillText('◆', px, pz - Math.max(12, s / 32)); }
  }
}

function layout() {
  const W = innerWidth, H = innerHeight, dpr = devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#14100e'; ctx.fillRect(0, 0, W, H);
  const wide = W >= 900, top = 52, bottom = wide ? 10 : Math.min(H * .36, 260), right = wide ? 340 : 10;
  const aw = W - 10 - right, ah = H - top - bottom - 6;
  st.cells = [];
  if (st.grid) {
    // As many thumbnails as fit (at least 110 px each), up to 260 px.
    let cols = 2, sz = 0, rows = 1, best = 0;
    for (let c = 2; c <= 8; c++) { const z = Math.min((aw - (c - 1) * 8) / c, 260), r = Math.max(1, Math.floor((ah + 8) / (z + 22))); if (z >= 110 && c * r > best) { best = c * r; cols = c; sz = z; rows = r; } }
    if (!best) { sz = Math.min((aw - 8) / 2, 260); rows = Math.max(1, Math.floor((ah + 8) / (sz + 22))); }
    for (let n = 0; n < cols * rows; n++) {
      const seed = st.seed + n, cx = 10 + (n % cols) * (sz + 8), cy = top + Math.floor(n / cols) * (sz + 22);
      drawLevel(level(seed), cx, cy, sz, false);
      ctx.font = '700 11px JetBrains Mono, monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = seed === st.seed ? '#ffd23f' : '#8a7f6a'; ctx.fillText('seed ' + seed, cx, cy + sz + 3);
      st.cells.push({ x: cx, y: cy, s: sz, seed });
    }
    $('panel').innerHTML = `<h4>${st.cells.length} LAYOUTS</h4><div class="hint">Seeds ${st.seed}–${st.seed + st.cells.length - 1}. Tap one to open it. ◀ ▶ page through.</div>${legend()}`;
    return;
  }
  const s = Math.min(aw, ah); drawLevel(level(st.seed), 10 + (aw - s) / 2, top, s, true);
  panel(level(st.seed));
}

const legend = () => `<div class="legend">${Object.entries(NAME).map(([k, n]) => `<span><i style="background:${COL[k]}"></i>${n}</span>`).join('')}<span><i style="background:#4a3a2a"></i>Corridor</span></div>`;
function panel(L) {
  const side = L.rooms.filter(r => r.kind === 'side').length, route = L.route.length, floor = L.grid.reduce((n, c) => n + c, 0);
  const rows = [
    ['Rooms', `${L.rooms.length} (${route} on the route, ${side} side)`],
    ['Route length', `${Math.round(L.routeLen)} units`],
    ['Walk, entrance to guardian', `${Math.round(L.routeLen / HERO.ms)} s at base speed`],
    ['Junctions (◆)', junctions(L).length],
    ['Corridors', L.edges.length],
    ['Floor', `${floor} cells (${Math.round(floor * L.cell * L.cell)} units²)`],
  ];
  $('panel').innerHTML = `<h4>SEED ${st.seed}</h4><table>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>${legend()}
    <div class="hint">Numbers are the route order; S = side room; ◆ = the autopilot stops there to let you choose a way. The gold line is the main route.</div>
    <a class="play" href="../?seed=${st.seed}">PLAY THIS MAP ▸</a><div class="hint">Opens the game on this layout for map 1 (packs are still placed at random). Without ?seed the game makes a new layout every time.</div>`;
}

function go(seed) { st.seed = Math.max(1, seed | 0); $('seed').value = st.seed; try { history.replaceState(null, '', '?seed=' + st.seed); } catch (e) {} layout(); }
const page = () => st.grid ? Math.max(1, st.cells.length) : 1;
$('prev').onclick = () => go(st.seed - page());
$('next').onclick = () => go(st.seed + page());
$('rnd').onclick = () => go(1 + Math.floor(Math.random() * 99999));
$('mode').onclick = () => { st.grid = !st.grid; $('mode').textContent = st.grid ? 'ONE' : 'GRID'; $('mode').classList.toggle('on', st.grid); layout(); };
$('seed').onchange = () => go(parseInt($('seed').value, 10) || 1);
cv.addEventListener('click', e => { if (!st.grid) return; const c = st.cells.find(c => e.clientX >= c.x && e.clientX <= c.x + c.s && e.clientY >= c.y && e.clientY <= c.y + c.s); if (c) { st.grid = false; $('mode').textContent = 'GRID'; $('mode').classList.remove('on'); go(c.seed); } });
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.key === 'ArrowLeft') $('prev').click(); if (e.key === 'ArrowRight') $('next').click(); });
addEventListener('resize', layout);
window.__maps = { st, go, level, junctions, ready: () => true };
go(st.seed);

// Map viewer (/maps/): generated level layouts seen from above, by seed, so the owner can look at what the generator makes.
// Dev tool: it uses the game's own generator (src/world/gen.js) with a seeded rng (src/core/rng.js), and "Play this map"
// opens the game on the same layout with ?seed= (the packs are still placed at random in the game).
import './maps.css';
import { generateLevel, junctionRooms } from '../world/gen.js';
import { seeded } from '../core/rng.js';
import { HERO } from '../data/balance.js';
import { GATE, ROLES, LEVELS } from '../data/dungeon.js';
import { GUARDIANS } from '../data/monsters.js';

const $ = id => document.getElementById(id);
const cv = $('view'), ctx = cv.getContext('2d');
// Rooms are coloured by role (data/dungeon.js ROLES); side rooms are drawn with a blue outline.
const gated = r => GATE.rooms.includes(r.kind) || GATE.rooms.includes(r.role);
// Set-piece pieces (room.set props) by kind.
const SETCOL = { pillar: '#b8aa98', pillarD: '#d8c8b0', brazier: '#ff8a30', post: '#c8c0b0', grave: '#8a8a90', coffin: '#7a5a3a', bench: '#a89a88', plinth: '#ffd23f', candles: '#ffb060', coins: '#ffd23f' };
const st = { seed: 1, grid: false, cells: [], tier: 1 };
try { const q = new URLSearchParams(location.search); if (q.get('seed')) st.seed = Math.max(1, parseInt(q.get('seed'), 10) || 1); if (q.get('level')) st.tier = Math.max(1, Math.min(LEVELS.length, parseInt(q.get('level'), 10) || 1)); } catch (e) {}

// Each level of the Crypt (data/dungeon.js LEVELS) has its own layout tuning and, on Flooded Tombs, poison pools.
const Lv = () => LEVELS[st.tier - 1];
const level = seed => generateLevel({ ...Lv().gen, pools: !!Lv().pools }, seeded(seed));
const junctions = junctionRooms;

// Draws layout L into the box (x, y, s × s). big: labels and the route.
function drawLevel(L, x, y, s, big) {
  const k = s / L.n, inRoom = new Map();
  for (const r of L.rooms) for (let j = r.j0; j < r.j0 + r.h; j++) for (let i = r.i0; i < r.i0 + r.w; i++) inRoom.set(j * L.n + i, r);
  ctx.fillStyle = '#0a0706'; ctx.fillRect(x, y, s, s);
  for (let j = 0; j < L.n; j++) for (let i = 0; i < L.n; i++) {
    if (!L.grid[j * L.n + i]) continue;
    const r = inRoom.get(j * L.n + i); ctx.fillStyle = r ? ROLES[r.role].col : '#4a3a2a';
    ctx.globalAlpha = r ? .55 : .9; ctx.fillRect(x + i * k, y + j * k, Math.ceil(k), Math.ceil(k));
  }
  ctx.globalAlpha = 1;
  // side rooms: a blue outline (optional branches)
  ctx.strokeStyle = '#6a8aff'; ctx.lineWidth = Math.max(1.5, k * .35);
  for (const r of L.rooms) if (r.kind === 'side') ctx.strokeRect(x + r.i0 * k, y + r.j0 * k, r.w * k, r.h * k);
  const W = (wx, wz) => [x + (wx + L.half) / (L.cell * L.n) * s, y + (wz + L.half) / (L.cell * L.n) * s];
  // Doors (room.doors): a bar across each gap in a room's wall; a fog gate (GATE.rooms, game/gate.js) as a thick misty bar.
  let doors = 0, gates = 0;
  for (const r of L.rooms) for (const d of r.doors) {
    const a = d.side === 'n' || d.side === 's', [x0, z0] = W(d.x - (a ? d.w / 2 : 0), d.z - (a ? 0 : d.w / 2)), [x1, z1] = W(d.x + (a ? d.w / 2 : 0), d.z + (a ? 0 : d.w / 2));
    const gate = gated(r);
    if (gate) { ctx.strokeStyle = '#dfe6ff44'; ctx.lineWidth = Math.max(6, k * 1.4); ctx.beginPath(); ctx.moveTo(x0, z0); ctx.lineTo(x1, z1); ctx.stroke(); gates++; }
    ctx.strokeStyle = gate ? '#eef2ff' : '#e8c878'; ctx.lineWidth = Math.max(gate ? 3 : 1.5, k * (gate ? .55 : .3)); ctx.beginPath(); ctx.moveTo(x0, z0); ctx.lineTo(x1, z1); ctx.stroke(); doors++;
  }
  if (big) { st.doors = doors; st.gates = gates; }
  // Poison pools (Flooded Tombs): green circles at true size.
  for (const p of L.pools) { const [px, pz] = W(p.x, p.z), u = k / L.cell; ctx.fillStyle = '#6ad04088'; ctx.strokeStyle = '#b8ff60'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, pz, Math.max(2, p.r * u), 0, 7); ctx.fill(); if (big) ctx.stroke(); }
  // Set pieces (room.set, world/gen.js setPieces): their pieces at true size (each collider), the dais as a square, and the spot
  // the room is built round (the guardian's, the chest on its plinth, the rest flame, the elite) as a ring. Vault partitions are
  // ordinary wall cells, drawn with the grid.
  if (big) {
    let sets = 0;
    for (const r of L.rooms) if (r.set) {
      sets++;
      for (const p of r.set.props) {
        const [px, pz] = W(p.x, p.z), u = k / L.cell;
        if (p.k === 'dais') { ctx.strokeStyle = '#ff4fd8aa'; ctx.lineWidth = 1.5; ctx.strokeRect(px - p.s * u, pz - p.s * u, p.s * 2 * u, p.s * 2 * u); continue; }
        ctx.fillStyle = SETCOL[p.k] || '#9a8a7a';
        if (!p.c.length) { ctx.fillRect(px - 1.5, pz - 1.5, 3, 3); continue; }
        for (const [cx, cz, cr] of p.c) { const [qx, qz] = W(cx, cz); ctx.beginPath(); ctx.arc(qx, qz, Math.max(1.5, cr * u), 0, 7); ctx.fill(); }
      }
      if (r.set.spot && r.set.kind !== 'arena') { const [px, pz] = W(r.set.spot.x, r.set.spot.z); ctx.strokeStyle = ROLES[r.role].col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, pz, Math.max(4, k * .6), 0, 7); ctx.stroke(); }
    }
    st.sets = sets;
  }
  if (!big) { // thumbnails: just the role icons of the beats
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${Math.max(9, s / 18)}px serif`;
    for (const r of L.rooms) if (r.role !== 'combat' && r.role !== 'start') { const [px, pz] = W(r.x, r.z); ctx.fillStyle = '#000'; ctx.fillText(ROLES[r.role].icon, px + 1, pz + 1); ctx.fillStyle = '#fff'; ctx.fillText(ROLES[r.role].icon, px, pz); }
    return;
  }
  // zone lines
  ctx.strokeStyle = '#ffffff10'; ctx.lineWidth = 1;
  for (let z = 1; z < L.zones; z++) { const p = s * z / L.zones; ctx.beginPath(); ctx.moveTo(x + p, y); ctx.lineTo(x + p, y + s); ctx.moveTo(x, y + p); ctx.lineTo(x + s, y + p); ctx.stroke(); }
  // the main route, entrance to guardian
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = Math.max(2, s / 260); ctx.setLineDash([8, 6]); ctx.beginPath();
  L.path.forEach((p, i) => { const [px, pz] = W(p.x, p.z); if (i) ctx.lineTo(px, pz); else ctx.moveTo(px, pz); }); ctx.stroke(); ctx.setLineDash([]);
  // room labels: the role's icon, then route order (S for side rooms) underneath; ◆ on junctions
  const J = new Set(junctions(L).map(r => r.id)), fs = Math.max(11, s / 40);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const r of L.rooms) {
    const [px, pz] = W(r.x, r.z), lab = r.kind === 'start' ? 'IN' : r.kind === 'boss' ? '' : r.kind === 'side' ? 'S' : String(r.rank), R = ROLES[r.role];
    if (r.role !== 'start') { ctx.font = `800 ${fs * 1.3}px serif`; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(R.icon, px, pz - fs * .35); ctx.fillStyle = r.role === 'combat' ? '#e8dcc0' : R.col; ctx.fillText(R.icon, px, pz - fs * .35); }
    if (lab) { ctx.font = `800 ${fs * .8}px Cinzel, serif`; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; const ly = r.role === 'start' ? pz : pz + fs * .75; ctx.strokeText(lab, px, ly); ctx.fillStyle = '#fff'; ctx.fillText(lab, px, ly); }
    if (J.has(r.id)) { ctx.font = `800 ${Math.max(10, s / 55)}px JetBrains Mono, monospace`; ctx.fillStyle = '#ffd23f'; ctx.fillText('◆', px, pz - fs * 1.4); }
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
    $('panel').innerHTML = `<h4>${Lv().name.toUpperCase()} · ${st.cells.length} LAYOUTS</h4><div class="hint">Seeds ${st.seed}–${st.seed + st.cells.length - 1}. Tap one to open it. ◀ ▶ page through.</div>${legend()}`;
    return;
  }
  const s = Math.min(aw, ah); drawLevel(level(st.seed), 10 + (aw - s) / 2, top, s, true);
  panel(level(st.seed));
}

const legend = () => `<div class="legend">${Object.values(ROLES).map(R => `<span><i style="background:${R.col}"></i>${R.icon} ${R.name}</span>`).join('')}<span><i style="background:transparent;border:2px solid #6a8aff"></i>Side room</span><span><i style="background:#4a3a2a"></i>Corridor</span><span><i style="background:#e8c878"></i>Door</span><span><i style="background:#eef2ff"></i>Fog gate</span><span><i style="background:#d8c8b0;border-radius:50%"></i>Set-piece pillar</span><span><i style="background:#6ad040;border-radius:50%"></i>Poison pool</span><span><i style="background:#ff8a30;border-radius:50%"></i>Brazier</span><span><i style="background:transparent;border:2px solid #ffd23f;border-radius:50%"></i>Chest, flame or elite</span></div>`;
function panel(L) {
  const side = L.rooms.filter(r => r.kind === 'side').length, route = L.route.length, floor = L.grid.reduce((n, c) => n + c, 0);
  const lv = Lv(), rows = [
    ['Level', `${st.tier} · ${lv.name}: ${lv.rule}`],
    ['Guardian', GUARDIANS[lv.guardian].name],
    ...(L.pools.length ? [['Poison pools', `${L.pools.length} in ${new Set(L.pools.map(p => p.room)).size} rooms`]] : []),
    ['Rooms', `${L.rooms.length} (${route} on the route, ${side} side)`],
    ['Route length', `${Math.round(L.routeLen)} units`],
    ['Walk, entrance to guardian', `${Math.round(L.routeLen / HERO.ms)} s at base speed`],
    ['Junctions (◆)', junctions(L).length],
    ['Corridors', L.edges.length],
    ['Roles', Object.entries(ROLES).filter(([k]) => k !== 'start').map(([k, R]) => [R, L.rooms.filter(r => r.role === k)]).filter(([, a]) => a.length).map(([R, a]) => `${R.icon} ${R.name} ${a.length}${a.some(r => r.kind === 'side') && R !== ROLES.combat ? ` (${a.filter(r => r.kind === 'side').length} side)` : ''}`).join(' · ')],
    ['Doors', `${L.rooms.reduce((n, r) => n + r.doors.length, 0)} (fog gates on ${L.rooms.filter(gated).map(r => r.kind === 'boss' ? 'the guardian arena' : `the ${ROLES[r.role].name.toLowerCase()} room`).join(', ')})`],
    ['Set pieces', L.rooms.filter(r => r.set).map(r => `${ROLES[r.role].icon} ${r.set.name}${r.set.ante ? ' (antechamber)' : ''}`).join(' · ') || 'none'],
    ['Floor', `${floor} cells (${Math.round(floor * L.cell * L.cell)} units²)`],
  ];
  $('panel').innerHTML = `<h4>${lv.name.toUpperCase()} · SEED ${st.seed}</h4><table>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>${legend()}
    <div class="hint">Rooms are coloured by role, with its icon (the icon its door sign shows); the number under it is the route order, S a side room (blue outline). ◆ = the autopilot stops there to let you choose a way. The gold line is the main route. Doors are the short bars across gaps in the walls; the white ones are fog gates, which seal you in with the guardian or an elite until it dies. Special rooms are set pieces: the guardian's arena (dais, pillars, braziers), a vault (the chest on a plinth, sometimes behind a partition wall with an antechamber), a rest chapel (the flame with benches round it) and an elite hall (a colonnade to the elite at the far end). Their pieces are drawn at true size; the ring marks the chest, flame or elite.</div>
    ${st.seed - st.tier + 1 >= 1 ? `<a class="play" href="../?seed=${st.seed - st.tier + 1}">PLAY THIS MAP ▸</a><div class="hint">Opens the game with map ${st.tier} on this layout${st.tier > 1 ? ` (map 1 on seed ${st.seed - st.tier + 1}, and so on: the game plays seed N + map − 1)` : ''}; packs are still placed at random. Without ?seed the game makes a new layout every time.</div>` : `<div class="hint">Seeds under ${st.tier} can't be played as map ${st.tier} (the game plays seed N + map − 1).</div>`}`;
}

function go(seed) { st.seed = Math.max(1, seed | 0); $('seed').value = st.seed; $('lvl').textContent = 'L' + st.tier + ' ' + Lv().name; try { history.replaceState(null, '', '?seed=' + st.seed + (st.tier > 1 ? '&level=' + st.tier : '')); } catch (e) {} layout(); }
const page = () => st.grid ? Math.max(1, st.cells.length) : 1;
$('prev').onclick = () => go(st.seed - page());
$('next').onclick = () => go(st.seed + page());
$('rnd').onclick = () => go(1 + Math.floor(Math.random() * 99999));
$('mode').onclick = () => { st.grid = !st.grid; $('mode').textContent = st.grid ? 'ONE' : 'GRID'; $('mode').classList.toggle('on', st.grid); layout(); };
$('lvl').onclick = () => { st.tier = st.tier % LEVELS.length + 1; go(st.seed); };
$('seed').onchange = () => go(parseInt($('seed').value, 10) || 1);
cv.addEventListener('click', e => { if (!st.grid) return; const c = st.cells.find(c => e.clientX >= c.x && e.clientX <= c.x + c.s && e.clientY >= c.y && e.clientY <= c.y + c.s); if (c) { st.grid = false; $('mode').textContent = 'GRID'; $('mode').classList.remove('on'); go(c.seed); } });
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.key === 'ArrowLeft') $('prev').click(); if (e.key === 'ArrowRight') $('next').click(); });
addEventListener('resize', layout);
window.__maps = { st, go, level, junctions, ready: () => true };
go(st.seed);

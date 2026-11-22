// The level's part of the HUD, called once from hud(): the info block (level name, current beat, next beat), the survival
// countdown, the guardian bar (the #bossbar element, retitled) and the minimap markers for beats, the guardian and the portal.
// The markers are drawn on their own canvas stacked over the minimap so hud.js's minimap redraw doesn't wipe them.
import { G, P } from '../core/state.js';
import { pools } from '../game/hazards.js';
import { $ } from '../core/util.js';
import { HALF } from '../world/map.js';

const css = hex => '#' + hex.toString(16).padStart(6, '0');
const ICON = { treasure: 'T', gamble: 'G', elite: 'E', breather: 'F', ambush: 'A', survival: 'S', doubleElite: 'D', release: 'R', guardian: '☠' };

function mk(tag, id, cls) { const el = document.createElement(tag); el.id = id; if (cls) el.className = cls; document.body.appendChild(el); return el; }
const surv = mk('div', 'surv', 'hud');
const mmL = mk('canvas', 'mmL', 'hud'); mmL.width = mmL.height = 300;
const mc = mmL.getContext('2d');
const last = { info: '', surv: '', bar: '' };
let mmT = 0;

// One line describing where a beat stands.
export function beatStatus(b) {
  const D = G.level.defs[b.type];
  if (b.state === 'done') return `${D.name} done`;
  if (b.state === 'idle') return `${D.name} ahead`;
  if (b.state === 'signal') return `${D.name}: it begins...`;
  if (b.type === 'ambush') return `Ambush: wave ${b.wave}/${b.waves}`;
  if (b.type === 'survival') return `Survival: ${Math.ceil(b.timer)} s left`;
  if (b.type === 'guardian') return `Guardian: ${b.guard ? b.guard.name : ''}`;
  return `${D.name}: in progress`;
}

export function levelHud(dt) {
  const L = G.level; if (!L) return;
  const b = L.beats[L.i], nx = L.beats[L.i + 1];
  // info block
  const cur = L.cleared ? 'Level cleared: take the portal' : b ? beatStatus(b) : '';
  const next = L.cleared ? '' : nx ? `Next: ${L.defs[nx.type].name}` : b ? 'Next: exit portal' : '';
  const html = `<b>CRYPT ${L.crypt} · ${L.name.toUpperCase()}</b>${P.clears ? ` <span style="color:var(--dim)">· ${P.clears} cleared</span>` : ''}<br>Level ${P.lvl} (par ${L.def.par}) · ${G.mapKills} slain<br>` +
    `<span style="color:${b && !L.cleared ? css(L.defs[b.type].color) : '#b06bff'}">${cur}</span><br><span style="color:var(--dim)">${next}</span>`;
  if (html !== last.info) { last.info = html; $('info').innerHTML = html; }
  // survival countdown
  let st = '';
  if (b && b.type === 'survival' && b.state === 'active') {
    const t = Math.ceil(b.timer), m = Math.floor(t / 60), s = String(t % 60).padStart(2, '0');
    st = `<span>HOLD THE CIRCLE</span><b style="color:${b.inside ? '#7dffc0' : '#ff5a5a'}">${m}:${s}</b>${b.inside ? '' : '<span style="color:#ff5a5a">RETURN TO THE CIRCLE</span>'}`;
  }
  if (st !== last.surv) { last.surv = st; surv.innerHTML = st; surv.style.display = st ? 'flex' : 'none'; }
  // guardian bar
  const g = G.enemies.find(e => e.guardian && !e.deathT && e.awake);
  if (g) {
    if (last.bar !== g.name) { last.bar = g.name; $('bossName').textContent = g.name.toUpperCase(); }
    $('bossbar').style.display = 'block'; $('bossHp').style.width = Math.max(0, g.hp / g.maxHp * 100) + '%';
  } else if (last.bar !== '') { last.bar = ''; $('bossbar').style.display = 'none'; }
  // minimap markers
  mmT -= dt; if (mmT > 0) return; mmT = .1;
  const k = 300 / (HALF * 2), X = x => (x + HALF) * k;
  mc.clearRect(0, 0, 300, 300);
  L.beats.forEach((o, i) => {
    const D = L.defs[o.type], isNext = i === L.i, done = o.state === 'done', gd = o.type === 'guardian';
    if (gd && g) return; // the guardian itself is drawn as an enemy
    const r = gd ? 9 : isNext ? 9 : 6.5, x = X(o.x), z = X(o.z), pulse = isNext ? 1 + Math.sin(G.gt * 5) * .12 : 1;
    mc.globalAlpha = done ? .3 : isNext ? 1 : .75;
    if (isNext && !done) { mc.strokeStyle = '#fff'; mc.lineWidth = 2; mc.beginPath(); mc.arc(x, z, (r + 5) * pulse, 0, 7); mc.stroke(); }
    mc.fillStyle = css(D.color); mc.beginPath(); mc.arc(x, z, r, 0, 7); mc.fill();
    mc.strokeStyle = '#000'; mc.lineWidth = 1.5; mc.stroke();
    mc.fillStyle = '#000'; mc.font = `800 ${gd ? 12 : isNext ? 11 : 9}px sans-serif`; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillText(ICON[o.type], x, z + .5);
  });
  mc.globalAlpha = 1;
  mc.fillStyle = '#8be04a'; for (const p of pools) { mc.beginPath(); mc.arc(X(p.x), X(p.z), Math.max(2, p.r * k), 0, 7); mc.fill(); } // poison pools
  for (const e of G.enemies) if (e.priority && !e.deathT && e.awake) { mc.fillStyle = '#d070ff'; mc.beginPath(); mc.arc(X(e.x), X(e.z), 3.5, 0, 7); mc.fill(); } // necromancers
  if (G.portal) { mc.strokeStyle = '#b06bff'; mc.lineWidth = 3; mc.beginPath(); mc.arc(X(G.portal.x), X(G.portal.z), 8, 0, 7); mc.stroke(); }
}

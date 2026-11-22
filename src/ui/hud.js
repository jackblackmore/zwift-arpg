// Life orb, skill bar, XP, minimap, vignette, banner timer. The level readout (info, guardian bar, beat and portal
// markers) is ui/levelhud.js; the Surge gauge is ui/surgehud.js.
import { G, P, S } from '../core/state.js';
import { SK } from '../data/skills.js';
import { RCSS } from '../data/items.js';
import { ctl } from '../input/input.js';
import { $ } from '../core/util.js';
import { HALF } from '../world/map.js';
import { xpNeed } from '../game/stats.js';
import { GEMS, BAR_SLOTS, SLOT_ORDER, apNeed } from '../data/gems.js';
import { slotGem, slotUnlocked, socketList } from '../game/gems.js';
import { skillCd, skillRate } from '../game/skills.js';
import { rideHud } from '../input/ridesim.js';
import { surgeHud } from './surgehud.js';
import { levelHud } from './levelhud.js';

const mmc = $('mm').getContext('2d');
const T = { hud: 0, mm: 0 };
const SLOTS = { main: 'sMain', flexA: 'sFlexA', flexB: 'sFlexB', guard: 'sGuard', evade: 'sEvade' };

export function hud(dt) {
  if (G.bannerT > 0) { G.bannerT -= dt; if (G.bannerT <= 0) $('banner').style.opacity = 0; }
  G.vign = Math.max(0, G.vign - dt * 1.5);
  $('vign').style.opacity = G.vign + (P.life < S.maxLife * .3 && P.dead <= 0 ? .25 + Math.sin(G.gt * 6) * .1 : 0);
  T.hud -= dt; if (T.hud > 0) return; T.hud = .07;
  $('lifeF').style.height = (P.life / S.maxLife * 100) + '%'; $('lifeT').textContent = `${Math.ceil(P.life)}/${S.maxLife}`;
  $('xpF').style.width = (P.xp / xpNeed(P.lvl) * 100) + '%';
  // skill bar: each slot shows its gem (icon, colour, level, AP, socket pips), a lock until it unlocks, or a faint "+" when empty.
  // Main auto-attacks (pulses when it fires); the others show a cooldown sweep and dim while recharging.
  for (const k of SLOT_ORDER) {
    const el = $(SLOTS[k]), g = slotGem(k), id = g && g.id, d = id && GEMS[id], cd = P.cd[k], locked = !g && !slotUnlocked(k);
    el.classList.toggle('locked', locked); el.classList.toggle('empty', !g && !locked);
    if (el.dataset.gem !== id + ':' + locked) { // the gem in the slot (or its lock) changed: icon, colour, lock text, tooltip
      el.dataset.gem = id + ':' + locked; el.querySelector('.ic').textContent = d ? d.icon : '+'; el.style.color = d ? d.color : '';
      el.querySelector('.lk em').textContent = 'L' + BAR_SLOTS[k].unlock; el.title = d ? d.name : locked ? `Unlocks at level ${BAR_SLOTS[k].unlock}` : BAR_SLOTS[k].name + ' (empty): tap to choose a gem';
    }
    gemBadge(el, g); pips(el, k);
    const n = el.querySelector('.n'), cdEl = el.querySelector('.cd');
    if (!g) { cdEl.style.height = '0%'; n.textContent = ''; el.classList.remove('oncd', 'fire'); continue; }
    if (k === 'main') { n.textContent = 'AUTO'; el.classList.toggle('fire', cd > skillRate(id) / S.cast * .55); continue; }
    const full = skillCd(id) * (1 - S.cdr);
    cdEl.style.height = cd > 0 ? Math.min(100, cd / full * 100) + '%' : '0%';
    n.textContent = cd > 0 ? cd.toFixed(cd < 10 ? 1 : 0) : ''; el.classList.toggle('oncd', cd > 0);
  }
  $('sGuard').classList.toggle('act', !!P.ward);
  $('sFl').querySelector('.n').textContent = Math.floor(P.flask); $('sFl').querySelector('.cd').style.height = P.flask < SK.flask.max ? (100 - (P.flask % 1) * 100) + '%' : '0%';
  $('sMain').classList.toggle('act', ctl.main);
  const ib = $('invBadge'); ib.style.display = P.newItems ? 'block' : 'none'; ib.textContent = P.newItems;
  const gb = $('gemBadge'); gb.style.display = P.newGems ? 'block' : 'none'; gb.textContent = P.newGems; $('bGems').classList.toggle('glow', P.newGems > 0);
  const pb = $('passBadge'); pb.style.display = P.pts ? 'block' : 'none'; pb.textContent = P.pts; $('bPass').classList.toggle('glow', P.pts > 0);
  surgeHud(); rideHud(); levelHud(dt);
  T.mm -= .07; if (T.mm > 0 || !G.mmBase) return; T.mm = .2;
  minimap();
}

// Gem badge ("Lv N") and a thin AP bar along the slot's bottom edge (gold and "MAX" at the cap). g: the gem instance in the slot.
function gemBadge(el, g) {
  const box = el.querySelector('.gem'); if (!box) return;
  if (!g) { if (box.firstChild) box.innerHTML = ''; el.classList.remove('gmax'); return; }
  if (!box.firstChild) box.innerHTML = '<b></b><i><u></u></i>';
  const max = g.lvl >= GEMS[g.id].cap;
  box.firstChild.textContent = max ? 'MAX' : 'Lv ' + g.lvl;
  box.lastChild.firstChild.style.width = (max ? 100 : g.ap / apNeed(g.lvl) * 100) + '%'; el.classList.toggle('gmax', max);
}
// Socket pips: one per unlocked socket, filled when a support sits in it. Rebuilt only when that changes.
function pips(el, slot) {
  const box = el.querySelector('.pips'), l = socketList(slot), key = l.map(u => (u ? 1 : 0)).join('');
  if (box.dataset.k === key) return; box.dataset.k = key; box.innerHTML = [...key].map(c => `<i${c === '1' ? ' class="on"' : ''}></i>`).join('');
}

function minimap() {
  const k = 300 / (HALF * 2), X = x => (x + HALF) * k;
  mmc.drawImage(G.mmBase, 0, 0);
  for (const p of G.packs) if (!p.spawned) { mmc.fillStyle = '#7a2020'; mmc.fillRect(X(p.x) - 3, X(p.z) - 3, 6, 6); }
  for (const e of G.enemies) {
    if (e.deathT) continue;
    mmc.fillStyle = e.ai === 'boss' ? '#ff4fd8' : e.rar === 2 ? '#ffd23f' : e.rar === 1 ? '#7a7aff' : '#d03030';
    const s = e.ai === 'boss' ? 12 : e.rar === 2 ? 7 : 4; mmc.fillRect(X(e.x) - s / 2, X(e.z) - s / 2, s, s);
  }
  for (const d of G.ground) if (d.it.rar >= 2) { mmc.fillStyle = RCSS[d.it.rar]; mmc.fillRect(X(d.x) - 3, X(d.z) - 3, 6, 6); }
  mmc.save(); mmc.translate(X(P.x), X(P.z)); mmc.rotate(-P.face + Math.PI); mmc.fillStyle = '#fff';
  mmc.beginPath(); mmc.moveTo(0, -9); mmc.lineTo(6, 6); mmc.lineTo(-6, 6); mmc.fill(); mmc.restore();
}

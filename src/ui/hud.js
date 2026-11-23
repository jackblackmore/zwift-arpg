// Life/mana orbs, skill bar, XP, map info, boss bar, minimap, vignette, banner timer.
import { G, P, S } from '../core/state.js';
import { SK } from '../data/skills.js';
import { RCSS } from '../data/items.js';
import { ctl } from '../input/input.js';
import { $ } from '../core/util.js';
import { HALF, reveal, seen } from '../world/map.js';
import { xpNeed } from '../game/stats.js';
import { rideHud } from '../input/ridesim.js';
import { GEMS, SLOT_DEFS, BAR } from '../data/gems.js';
import { barGem, unlocked } from '../game/gems.js';

const mmc = $('mm').getContext('2d');
const T = { hud: 0, mm: 0 };

export function hud(dt) {
  if (G.bannerT > 0) { G.bannerT -= dt; if (G.bannerT <= 0) $('banner').style.opacity = 0; }
  G.vign = Math.max(0, G.vign - dt * 1.5);
  $('vign').style.opacity = G.vign + (P.life < S.maxLife * .3 && P.dead <= 0 ? .25 + Math.sin(G.gt * 6) * .1 : 0);
  T.hud -= dt; if (T.hud > 0) return; T.hud = .07;
  $('lifeF').style.height = (P.life / S.maxLife * 100) + '%'; $('lifeT').textContent = `${Math.ceil(P.life)}/${S.maxLife}` + (P.shield > 0 ? ` +${Math.ceil(P.shield)}` : ''); $('orbL').classList.toggle('shielded', P.shield > 0);
  $('manaF').style.height = S.blood ? '0%' : (P.mana / S.maxMana * 100) + '%'; $('manaT').textContent = S.blood ? 'BLOOD' : `${Math.floor(P.mana)}/${S.maxMana}`;
  $('xpF').style.width = (P.xp / xpNeed(P.lvl) * 100) + '%';
  $('iMap').textContent = 'MAP ' + G.tier; $('iLvl').textContent = 'Level ' + P.lvl; $('iKill').textContent = `${G.mapKills}/${G.mapTotal} slain`;
  const res = S.blood ? P.life : P.mana;
  for (const s of BAR) skillSlot(s, res);
  $('sFl').querySelector('.n').textContent = Math.floor(P.flask); $('sFl').querySelector('.cd').style.height = P.flask < SK.flask.max ? (100 - (P.flask % 1) * 100) + '%' : '0%';
  const ib = $('invBadge'); ib.style.display = P.newItems ? 'block' : 'none'; ib.textContent = P.newItems;
  $('bGems').classList.toggle('glow', P.newGems > 0 || (BAR.some(s => unlocked(s) && !barGem(s)) && P.gems.some(g => !BAR.some(s => P.bar[s] === g.id))));
  const pb = $('passBadge'); pb.style.display = P.pts ? 'block' : 'none'; pb.textContent = P.pts; $('bPass').classList.toggle('glow', P.pts > 0);
  const boss = G.bossSpec && G.bossSpec.e; if (boss && !boss.deathT) $('bossHp').style.width = (boss.hp / boss.maxHp * 100) + '%';
  rideHud(slotLook);
  T.mm -= .07; if (T.mm > 0 || !G.mmBase) return; T.mm = .2;
  minimap();
}

// One skill bar button: the gem's icon, cost, cooldown (or charges) and gem level; a padlock until the slot unlocks.
const slotLook = s => { const g = barGem(s); return g ? GEMS[g.gem] : null; };
function skillSlot(s, res) {
  const el = $('sk-' + s), g = barGem(s), D = g && GEMS[g.gem], K = D && SK[D.sk], st = P.cd[s] || {};
  const lock = !unlocked(s), key = lock ? 'lock' : D ? g.gem + g.lvl : 'empty';
  if (el.dataset.key !== key) {
    el.dataset.key = key; el.classList.toggle('locked', lock); el.classList.toggle('empty', !lock && !D);
    el.style.color = D ? D.col : '';
    el.querySelector('.ic').textContent = lock ? '🔒' : D ? D.icon : '+';
    el.querySelector('.lv').textContent = lock ? 'Lv ' + SLOT_DEFS[s].unlock : D ? 'L' + g.lvl : '';
    el.title = lock ? `${SLOT_DEFS[s].n}: unlocks at level ${SLOT_DEFS[s].unlock}` : D ? `${D.n} · gem level ${g.lvl}` : `${SLOT_DEFS[s].n}: empty · press G for gems`;
  }
  if (!D) { el.querySelector('.n').textContent = ''; el.querySelector('.cd').style.height = '0%'; el.classList.remove('nomana', 'act'); return; }
  el.classList.toggle('nomana', res < K.cost); el.classList.toggle('act', !!ctl[s]);
  el.querySelector('.n').textContent = K.charges ? `${st.ch || 0}×` : K.cost;
  const cd = K.charges ? (st.ch >= 1 ? 0 : 1 - (st.t || 0) / K.recharge) : K.cd ? Math.max(0, st.cd || 0) / K.cd : 0;
  el.querySelector('.cd').style.height = (cd * 100) + '%';
}

function minimap() {
  const k = 300 / (HALF * 2), X = x => (x + HALF) * k;
  reveal(P.x, P.z); mmc.drawImage(G.mmBase, 0, 0); // fog of war: only cells you have seen are drawn, and only things standing on them
  for (const p of G.packs) if (!p.spawned && seen(p.x, p.z)) { mmc.fillStyle = '#7a2020'; mmc.fillRect(X(p.x) - 3, X(p.z) - 3, 6, 6); }
  for (const e of G.enemies) {
    if (e.deathT || !seen(e.x, e.z)) continue;
    mmc.fillStyle = e.type === 'boss' ? '#ff4fd8' : e.rar === 2 ? '#ffd23f' : e.rar === 1 ? '#7a7aff' : '#d03030';
    const s = e.type === 'boss' ? 12 : e.rar === 2 ? 7 : 4; mmc.fillRect(X(e.x) - s / 2, X(e.z) - s / 2, s, s);
  }
  if (G.bossSpec && !G.bossSpec.spawned && seen(G.bossSpot.x, G.bossSpot.z)) { mmc.fillStyle = '#ff4fd8'; mmc.beginPath(); mmc.arc(X(G.bossSpot.x), X(G.bossSpot.z), 7, 0, 7); mmc.fill(); }
  for (const d of G.ground) if (d.it.rar >= 2 && seen(d.x, d.z)) { mmc.fillStyle = d.it.col || RCSS[d.it.rar]; mmc.fillRect(X(d.x) - 3, X(d.z) - 3, 6, 6); }
  if (G.portal) { mmc.strokeStyle = '#b06bff'; mmc.lineWidth = 3; mmc.beginPath(); mmc.arc(X(G.portal.x), X(G.portal.z), 8, 0, 7); mmc.stroke(); }
  mmc.save(); mmc.translate(X(P.x), X(P.z)); mmc.rotate(-P.face + Math.PI); mmc.fillStyle = '#fff';
  mmc.beginPath(); mmc.moveTo(0, -9); mmc.lineTo(6, 6); mmc.lineTo(-6, 6); mmc.fill(); mmc.restore();
}

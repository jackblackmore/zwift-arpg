// Life/mana orbs, skill bar, XP, map info, boss bar, minimap, vignette, banner timer.
import { G, P, S } from '../core/state.js';
import { SK } from '../data/skills.js';
import { RCSS } from '../data/items.js';
import { ctl } from '../input/input.js';
import { $ } from '../core/util.js';
import { HALF } from '../world/map.js';
import { xpNeed } from '../game/stats.js';

const mmc = $('mm').getContext('2d');
const T = { hud: 0, mm: 0 };

export function hud(dt) {
  if (G.bannerT > 0) { G.bannerT -= dt; if (G.bannerT <= 0) $('banner').style.opacity = 0; }
  G.vign = Math.max(0, G.vign - dt * 1.5);
  $('vign').style.opacity = G.vign + (P.life < S.maxLife * .3 && P.dead <= 0 ? .25 + Math.sin(G.gt * 6) * .1 : 0);
  T.hud -= dt; if (T.hud > 0) return; T.hud = .07;
  $('lifeF').style.height = (P.life / S.maxLife * 100) + '%'; $('lifeT').textContent = `${Math.ceil(P.life)}/${S.maxLife}`;
  $('manaF').style.height = S.blood ? '0%' : (P.mana / S.maxMana * 100) + '%'; $('manaT').textContent = S.blood ? 'BLOOD' : `${Math.floor(P.mana)}/${S.maxMana}`;
  $('xpF').style.width = (P.xp / xpNeed(P.lvl) * 100) + '%';
  $('iMap').textContent = 'MAP ' + G.tier; $('iLvl').textContent = 'Level ' + P.lvl; $('iKill').textContent = `${G.mapKills}/${G.mapTotal} slain`;
  const res = S.blood ? P.life : P.mana;
  [['sFb', SK.fireball.cost], ['sAr', SK.arc.cost], ['sNv', SK.nova.cost], ['sDs', SK.dash.cost]].forEach(([id, c]) => $(id).classList.toggle('nomana', res < c));
  $('sNv').querySelector('.cd').style.height = Math.max(0, P.novaCd / SK.nova.cd * 100) + '%';
  $('sDs').querySelector('.n').textContent = P.dashCh; $('sDs').querySelector('.cd').style.height = P.dashCh < 1 ? (100 - P.dashT / SK.dash.recharge * 100) + '%' : '0%';
  $('sFl').querySelector('.n').textContent = Math.floor(P.flask); $('sFl').querySelector('.cd').style.height = P.flask < SK.flask.max ? (100 - (P.flask % 1) * 100) + '%' : '0%';
  $('sFb').classList.toggle('act', ctl.fb); $('sAr').classList.toggle('act', ctl.arc);
  const ib = $('invBadge'); ib.style.display = P.newItems ? 'block' : 'none'; ib.textContent = P.newItems;
  const pb = $('passBadge'); pb.style.display = P.pts ? 'block' : 'none'; pb.textContent = P.pts; $('bPass').classList.toggle('glow', P.pts > 0);
  const boss = G.bossSpec && G.bossSpec.e; if (boss && !boss.deathT) $('bossHp').style.width = (boss.hp / boss.maxHp * 100) + '%';
  T.mm -= .07; if (T.mm > 0 || !G.mmBase) return; T.mm = .2;
  minimap();
}

function minimap() {
  const k = 300 / (HALF * 2), X = x => (x + HALF) * k;
  mmc.drawImage(G.mmBase, 0, 0);
  for (const p of G.packs) if (!p.spawned) { mmc.fillStyle = '#7a2020'; mmc.fillRect(X(p.x) - 3, X(p.z) - 3, 6, 6); }
  for (const e of G.enemies) {
    if (e.deathT) continue;
    mmc.fillStyle = e.type === 'boss' ? '#ff4fd8' : e.rar === 2 ? '#ffd23f' : e.rar === 1 ? '#7a7aff' : '#d03030';
    const s = e.type === 'boss' ? 12 : e.rar === 2 ? 7 : 4; mmc.fillRect(X(e.x) - s / 2, X(e.z) - s / 2, s, s);
  }
  if (G.bossSpec && !G.bossSpec.spawned) { mmc.fillStyle = '#ff4fd8'; mmc.beginPath(); mmc.arc(X(G.bossSpot.x), X(G.bossSpot.z), 7, 0, 7); mmc.fill(); }
  for (const d of G.ground) if (d.it.rar >= 2) { mmc.fillStyle = RCSS[d.it.rar]; mmc.fillRect(X(d.x) - 3, X(d.z) - 3, 6, 6); }
  if (G.portal) { mmc.strokeStyle = '#b06bff'; mmc.lineWidth = 3; mmc.beginPath(); mmc.arc(X(G.portal.x), X(G.portal.z), 8, 0, 7); mmc.stroke(); }
  mmc.save(); mmc.translate(X(P.x), X(P.z)); mmc.rotate(-P.face + Math.PI); mmc.fillStyle = '#fff';
  mmc.beginPath(); mmc.moveTo(0, -9); mmc.lineTo(6, 6); mmc.lineTo(-6, 6); mmc.fill(); mmc.restore();
}

import { S, hero, ride } from '../core/state.js';
import { $ } from '../core/util.js';
import { ZONES } from '../data/zones.js';
import { BOONS } from '../data/combat.js';

const fmtT = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Average, normalized power and estimated TSS from 1 s samples.
export function rideMetrics() {
  const sm = ride.samples, avg = sm.length ? sm.reduce((a, b) => a + b, 0) / sm.length : hero.pow;
  let np = avg;
  if (sm.length >= 30) {
    const roll = [];
    for (let i = 29; i < sm.length; i++) { let s = 0; for (let j = i - 29; j <= i; j++) s += sm[j]; roll.push((s / 30) ** 4); }
    np = (roll.reduce((a, b) => a + b, 0) / roll.length) ** .25;
  }
  const IF = np / S.ftp, tss = ride.t * np * IF / (S.ftp * 3600) * 100;
  return { avg, np, IF, tss };
}

export function showSummary() {
  const { avg, np, tss } = rideMetrics(), tot = ride.zt.reduce((a, b) => a + b, 0) || 1;
  const zr = ZONES.map((z, i) => `<div class="zrow"><span style="color:${z.col}">${z.name}</span><b><i style="width:${ride.zt[i] / tot * 100}%;background:${z.col}"></i></b><em>${fmtT(ride.zt[i])}</em></div>`).join('');
  const best = ride.best ? `<span class="r${ride.best.rar}">${ride.best.name}</span> <span style="color:var(--dim)">· ${ride.best.desc}</span>` : '<span style="color:var(--dim)">nothing yet</span>';
  $('sumC').innerHTML = `<h1>RIDE COMPLETE</h1><div class="sub">${hero.boons.length ? 'Boons: ' + hero.boons.map(k => `<span style="color:${BOONS[k].col}">${BOONS[k].name}</span>`).join(', ') : 'No boons this run'}</div>
    <div class="grid">
      <div><b>${fmtT(ride.t)}</b><span>RIDE TIME</span></div><div><b>${Math.round(ride.kj)}</b><span>KILOJOULES</span></div><div><b>${Math.round(tss)}</b><span>TSS (est.)</span></div>
      <div><b>${Math.round(avg)} W</b><span>AVG POWER</span></div><div><b>${Math.round(np)} W</b><span>NORMALIZED</span></div><div><b>${Math.round(ride.peak)} W</b><span>PEAK 1s</span></div>
      <div><b>${S.floorN}</b><span>DEEPEST FLOOR</span></div><div><b>${ride.kills}</b><span>KILLS · ${ride.bosses} BOSS</span></div><div><b>${ride.goldEarned}</b><span>GOLD EARNED</span></div>
    </div>
    <div class="sumh">TIME IN ZONES</div>${zr}
    <div class="sumh">BEST DROP</div><div style="font-size:12px">${best}</div>
    <div class="row" style="margin-top:16px"><button id="sKeep">KEEP RIDING</button><button id="sNew" class="on">NEW RUN</button></div>`;
  $('sum').classList.remove('hide');
  $('sKeep').onclick = () => $('sum').classList.add('hide');
  $('sNew').onclick = () => { $('sum').classList.add('hide'); $('ov').classList.remove('hide'); };
}

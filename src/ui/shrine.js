// The shrine choice: a modal (#mShrine, built here in JS) with three big cards, one per gem on offer: icon, name, description, a
// "feels like" line and tags. Tapping a card takes that gem (game/shrines.js pickShrine). data-sticky: Escape can't dismiss it, you
// must choose. Opening pauses like every .modal (panels.js syncPause). Cards stack on a phone and sit side by side on a wide screen.
import { P } from '../core/state.js';
import { GEMS } from '../data/gems.js';
import { SHRINES, FEELS } from '../data/shrines.js';
import { $ } from '../core/util.js';
import { ctl } from '../input/input.js';
import { syncPause } from './panels.js';
import { shrineUI, pickShrine, shrineColor, flexStart } from '../game/shrines.js';

const css = document.createElement('style');
css.textContent = `
#mShrine{z-index:9}
#mShrine .card{max-width:760px;text-align:center}
#mShrine h3{justify-content:center;font-size:18px}
#mShrine .sub{margin:0 0 12px;font-size:12.5px;color:var(--dim)}
#mShrine .sh{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
#mShrine .sc{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px 12px;min-height:48px;text-align:center;font-family:inherit;color:inherit;letter-spacing:0;text-transform:none;border:1px solid var(--c);background:linear-gradient(#241912,#120c08);box-shadow:inset 0 0 22px color-mix(in srgb,var(--c) 22%,transparent);touch-action:manipulation}
#mShrine .sc:hover,#mShrine .sc:active{box-shadow:inset 0 0 28px color-mix(in srgb,var(--c) 45%,transparent),0 0 14px color-mix(in srgb,var(--c) 40%,transparent)}
#mShrine .sc .gi{font-size:46px;line-height:1;color:var(--c);text-shadow:0 0 14px var(--c)}
#mShrine .sc b{font:800 15px Cinzel,serif;color:var(--c);letter-spacing:.06em;text-transform:uppercase}
#mShrine .sc .d{font-size:12.5px;line-height:1.4;color:#e6dccb}
#mShrine .sc .f{font-size:12px;line-height:1.35;color:var(--gold);font-style:italic}
#mShrine .sc .tg{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}
#mShrine .sc .tg i{font:600 10px 'JetBrains Mono',monospace;font-style:normal;padding:2px 6px;border:1px solid #6a5030;border-radius:9px;color:var(--dim)}
#mShrine .sc .lv{font:600 11px 'JetBrains Mono',monospace;color:var(--dim)}
@media(max-width:700px){
 #mShrine .card{padding:12px}
 #mShrine .sh{grid-template-columns:1fr;gap:8px}
 #mShrine .sc{display:grid;grid-template-columns:54px 1fr;grid-template-areas:'i n' 'i d' 'i f' 'i t';column-gap:10px;row-gap:3px;text-align:left;align-items:start;padding:10px 12px}
 #mShrine .sc .gi{grid-area:i;font-size:40px;align-self:center;text-align:center}
 #mShrine .sc b{grid-area:n;font-size:14px}
 #mShrine .sc .d{grid-area:d;font-size:12px}
 #mShrine .sc .f{grid-area:f;font-size:11.5px}
 #mShrine .sc .tg{grid-area:t;justify-content:flex-start}
}
`;
document.head.appendChild(css);

const modal = document.createElement('div');
modal.className = 'modal'; modal.id = 'mShrine'; modal.dataset.sticky = '';
modal.innerHTML = '<div class="card"><h3 id="shT"></h3><div class="sub" id="shS"></div><div class="sh" id="shList"></div></div>';
document.body.appendChild(modal);

let cur = null; // the shrine whose choice is showing

function render(s) {
  const def = SHRINES[s.slot];
  $('shT').textContent = 'A SHRINE OF POWER'; $('shT').style.color = shrineColor(s);
  $('shS').textContent = def.pick + (def.bonus ? ' (and Blink comes with it)' : '') + (def.flex ? ` · Flex gems start at level ${flexStart()}` : '');
  $('shList').innerHTML = s.offer.map(id => {
    const d = GEMS[id], tags = [d.kind === 'guard' ? 'guard' : 'attack', ...d.tags];
    return `<button class="sc" data-id="${id}" style="--c:${d.color}"><span class="gi">${d.icon}</span><b>${d.name}</b><span class="d">${d.desc}</span><span class="f">${FEELS[id] || ''}</span><span class="tg">${tags.map(t => `<i>${t}</i>`).join('')}</span></button>`;
  }).join('');
}

shrineUI.open = s => {
  if (cur === s && modal.classList.contains('show')) return;
  cur = s; render(s); modal.classList.add('show');
  for (const k of ['flexA', 'flexB', 'guard', 'evade', 'flask']) ctl[k] = false; ctl.mx = ctl.mz = 0; // nothing held carries into the choice
  syncPause();
};
shrineUI.close = () => { cur = null; modal.classList.remove('show'); syncPause(); };
$('shList').addEventListener('click', e => { const b = e.target.closest('.sc'); if (b && cur) pickShrine(cur, b.dataset.id); });

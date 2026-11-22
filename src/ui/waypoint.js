// The waypoint screen: a modal (#mWay) listing Crypt levels 1..5 with their par character level, a CLEARED mark and a lock until the one before
// is cleared. Tapping an unlocked row enters it. It pauses the game like the other panels (ui/panels.js syncPause pauses on any open .modal). Also adds the
// menu's LEAVE LEVEL button (next to RESUME). Built here in JS so index.html stays untouched.
import { G, P } from '../core/state.js';
import { LEVELS } from '../data/levels.js';
import { $ } from '../core/util.js';
import { syncPause } from './panels.js';
import { wpUI, enterLevel, leaveLevel, maxEnter } from '../game/waypoint.js';

const css = document.createElement('style');
css.textContent = `
#mWay{z-index:9}
#mWay .card{max-width:520px}
#mWay .wp{display:flex;align-items:center;gap:12px;width:100%;min-height:68px;padding:10px 14px;margin:0 0 8px;text-align:left;font-size:13px}
#mWay .wp .n{font:800 28px Cinzel,serif;color:var(--gold);min-width:28px;text-align:center}
#mWay .wp .t{flex:1;display:flex;flex-direction:column;gap:3px}
#mWay .wp .t small{font:400 11px 'JetBrains Mono',monospace;color:var(--dim);letter-spacing:0;text-transform:none}
#mWay .wp .s{font:800 10px Cinzel,serif;letter-spacing:.1em;white-space:nowrap}
#mWay .wp.next{border-color:var(--gold);box-shadow:0 0 14px #c8a25a55}
#mWay .wp.done .s{color:#7dffc0}
#mWay .wp.next .s{color:var(--gold)}
#mWay .wp:disabled{opacity:.45;cursor:default}
#mWay .trial{margin:4px 0 10px;padding:10px 12px;border:1px solid #b06bff;border-radius:6px;color:#d8b8ff;font-size:12.5px;line-height:1.5}
`;
document.head.appendChild(css);

const modal = document.createElement('div');
modal.className = 'modal'; modal.id = 'mWay'; modal.dataset.sticky = ''; // Escape must not close it: there'd be no level to return to
modal.innerHTML = '<div class="card"><h3>WAYPOINT</h3><div class="sub" id="wpSub"></div><div id="wpTrial"></div><div id="wpList"></div><div class="row" id="wpBack"></div></div>';
document.body.appendChild(modal);

// Is there a level in progress the hero could go back to? (Not once it is cleared: the portal is what brought him here.)
const canGoBack = () => G.started && G.level && !G.level.cleared;

function render() {
  const wp = P.waypoint || 0, top = maxEnter();
  $('wpSub').textContent = `Level ${P.lvl} · ${wp ? `furthest Crypt cleared: ${wp} of ${LEVELS.length}` : 'no Crypt cleared yet'} · choose where to go`;
  $('wpTrial').innerHTML = wp >= LEVELS.length ? '<div class="trial"><b>THE TRIAL AWAITS</b><br>The Ashen King waits beyond the Throne Approach. His Trial is not open yet; you can still replay any Crypt.</div>' : '';
  $('wpList').innerHTML = LEVELS.map(lv => {
    const done = lv.n <= wp, locked = lv.n > top, next = lv.n === top && !done;
    return `<button class="wp${done ? ' done' : ''}${next ? ' next' : ''}" data-n="${lv.n}"${locked ? ' disabled' : ''}><span class="n">${lv.n}</span>` +
      `<span class="t"><b>${lv.name.toUpperCase()}</b><small>Par level ${lv.par} · ${lv.blurb}</small></span>` +
      `<span class="s">${done ? 'CLEARED ✓' : locked ? 'LOCKED' : 'NEXT'}</span></button>`;
  }).join('');
  $('wpBack').innerHTML = canGoBack() ? `<button id="wpBackBtn">BACK TO CRYPT ${G.level.crypt}</button>` : '';
  const b = $('wpBackBtn'); if (b) b.onclick = () => wpUI.close();
}
wpUI.open = () => { render(); modal.classList.add('show'); syncPause(); };
wpUI.close = () => { modal.classList.remove('show'); syncPause(); };
$('wpList').addEventListener('click', e => { const b = e.target.closest('.wp'); if (b && !b.disabled) enterLevel(+b.dataset.n); });

// Menu: a LEAVE LEVEL button beside RESUME, shown while a level is in progress.
const leave = document.createElement('button');
leave.id = 'goLeave'; leave.textContent = 'LEAVE LEVEL'; leave.style.display = 'none';
$('goCont').parentNode.insertBefore(leave, $('goNew'));
$('bMenu').addEventListener('click', () => { leave.style.display = G.started && G.level ? '' : 'none'; });
leave.onclick = () => { $('mMenu').classList.remove('show'); leaveLevel(); };

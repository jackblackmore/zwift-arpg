// Tiny Web Audio synth for sound effects. No assets.
const A = { ctx: null, muted: false, nbuf: null, last: {} };

export function audio() {
  if (!A.ctx) { try { A.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume().catch(() => {});
}
export function toggleMute() { A.muted = !A.muted; return A.muted; }

function tone(f, d, type = 'square', vol = .05, slide = 0, delay = 0) {
  const AC = A.ctx; if (!AC || A.muted) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02);
}
function noise(d, vol = .1, freq = 1200, q = 1, delay = 0, type = 'bandpass') {
  const AC = A.ctx; if (!AC || A.muted) return;
  if (!A.nbuf) { A.nbuf = AC.createBuffer(1, AC.sampleRate * .6 | 0, AC.sampleRate); const ch = A.nbuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
  const t = AC.currentTime + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = A.nbuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t + d + .02);
}
// Rate limit so a 30-enemy explosion doesn't play 30 sounds.
const lim = (k, gap) => { const AC = A.ctx; if (!AC) return false; if (AC.currentTime - (A.last[k] || 0) < gap) return false; A.last[k] = AC.currentTime; return true; };

export const SFX = {
  fire: () => { if (lim('fire', .05)) { noise(.18, .07, 900, .7); tone(180, .15, 'sawtooth', .02, 2); } },
  swing: () => { if (lim('swing', .08)) noise(.14, .06, 2400, .9, 0, 'highpass'); },
  thud: () => { if (lim('thud', .05)) { noise(.12, .14, 380, .9, 0, 'lowpass'); tone(110, .1, 'triangle', .07, .5); } },
  boom: () => { if (lim('boom', .06)) { noise(.35, .16, 300, .6, 0, 'lowpass'); tone(90, .25, 'sine', .12, .4); } },
  arc: () => { if (lim('arc', .05)) { noise(.16, .09, 4200, 2); tone(1200, .12, 'sawtooth', .025, .3); } },
  nova: () => { noise(.5, .12, 6000, .5); [1568, 2093, 2637].forEach((f, i) => tone(f, .35, 'sine', .03, .7, i * .03)); },
  dash: () => { noise(.3, .12, 700, .5); tone(300, .25, 'sawtooth', .03, 3); },
  hit: () => { if (lim('hit', .04)) noise(.06, .08, 1500, 1.4); },
  kill: () => { if (lim('kill', .05)) { noise(.16, .09, 500, .8); tone(160, .12, 'triangle', .04, .5); } },
  hurt: () => { if (lim('hurt', .15)) tone(140, .16, 'sawtooth', .06, .6); },
  slam: () => { tone(55, .7, 'sine', .3, .4); noise(.5, .22, 150, .6, 0, 'lowpass'); },
  loot: r => {
    if (r >= 3) { [392, 523, 659, 784, 1047, 1318].forEach((f, i) => tone(f, .4, 'triangle', .06, 1, i * .07)); noise(.8, .05, 5000, .5); }
    else if (r === 2) [659, 880, 1175].forEach((f, i) => tone(f, .22, 'triangle', .05, 1, i * .06));
    else tone(880, .12, 'triangle', .03);
  },
  lvl: () => [523, 659, 784, 1047, 1318].forEach((f, i) => tone(f, .35, 'sine', .07, 1, i * .09)),
  flask: () => { tone(500, .3, 'sine', .06, 1.8); noise(.2, .04, 2500, 2); },
  // Fight mechanics: a cue per telegraph type (riders don't always watch the screen), then block, parry and guard break.
  cue: k => { if (!lim('cue' + k, .2)) return; if (k === 'channel') { tone(392, .9, 'sine', .06, 2); tone(588, .9, 'sine', .04, 2, .05); noise(.8, .03, 1800, 3); } else if (k === 'parry') { tone(1320, .12, 'triangle', .06, 1); tone(1760, .1, 'triangle', .04, 1, .06); } else if (k === 'heavy') { tone(110, .35, 'sawtooth', .07, .7); noise(.3, .05, 300, .6, 0, 'lowpass'); } else { tone(233, .45, 'square', .05, .8); tone(247, .45, 'square', .05, .8); } },
  block: () => { if (lim('block', .06)) { tone(420, .1, 'square', .04, .5); noise(.1, .1, 900, 1.2); } },
  parry: () => { tone(1800, .35, 'triangle', .09, .6); tone(2700, .25, 'sine', .05, .7); noise(.12, .12, 5000, 1.5); },
  finisher: () => { tone(70, .6, 'sine', .25, .35); noise(.45, .25, 220, .7, 0, 'lowpass'); noise(.25, .14, 3200, 1.2, .03); tone(1100, .5, 'triangle', .06, .5, .04); },
  broken: () => { tone(160, .5, 'sawtooth', .08, .4); noise(.4, .15, 600, .6); },
  roar: () => { tone(80, .8, 'sawtooth', .07, .6); noise(.6, .08, 400, .7); },
};

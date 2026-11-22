let AC = null, noiseBuf = null, lastHitSfx = 0;
export const audioState = { muted: false };

export function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (AC && AC.state === 'suspended') AC.resume().catch(() => {});
}
export function tone(f, d, type = 'square', vol = .06, slide = 0, delay = 0) {
  if (!AC || audioState.muted) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02);
}
export function noise(d, vol = .1, freq = 1200, q = 1, delay = 0) {
  if (!AC || audioState.muted) return;
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * .5 | 0, AC.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
  const t = AC.currentTime + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t + d + .02);
}
export const SFX = {
  hit: () => { if (AC && AC.currentTime - lastHitSfx < .05) return; lastHitSfx = AC ? AC.currentTime : 0; noise(.08, .13, 900, 1.2); },
  crit: () => { noise(.12, .2, 2400, 1); tone(880, .12, 'square', .035, .5); },
  kill: () => { noise(.2, .14, 500, .8); tone(220, .16, 'triangle', .07, .5); },
  hurt: () => tone(150, .16, 'sawtooth', .06, .6),
  cleave: () => { noise(.28, .16, 650, .6); tone(300, .2, 'triangle', .04, .5); },
  overload: () => { tone(1400, .35, 'sawtooth', .05, .15); noise(.35, .14, 3200, .5); },
  slam: () => { tone(65, .6, 'sine', .3, .4); noise(.45, .22, 160, .7); },
  tele: () => tone(110, 1.6, 'sawtooth', .035, 2.2),
  loot: r => [523, 659, 784, 1047, 1318].slice(0, r + 2).forEach((f, i) => tone(f, .2, 'triangle', .06, 1, i * .07)),
  coin: () => { tone(1318, .08, 'square', .025); tone(1760, .12, 'square', .025, 1, .06); },
  boon: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, .3, 'sine', .07, 1, i * .08)),
  pick: () => tone(440, .08, 'triangle', .05, 1.5),
};

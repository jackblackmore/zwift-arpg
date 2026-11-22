// RIDE mode: plays the game with only what a Zwift Ride + KICKR give you (buttons, power, cadence).
// Today power and cadence come from on-screen sliders / keys; later from the KICKR over Bluetooth.
export const RIDE = {
  ftp: 250, startPower: 175, startCad: 88,
  // Movement speed multiplier from %FTP: below `stop` the hero stands still, `full` is normal speed, capped at `max`.
  move: { stop: .3, full: .75, max: 1.25 },
  // Mana regeneration multiplier: base + perFtp × %FTP, capped. Pedalling harder refills mana faster.
  mana: { base: .4, perFtp: .9, max: 1.7 },
  // Cast speed bonus per rpm above `from`, capped.
  cadence: { from: 80, per: .004, max: .15 },
  // Autopilot (Y): walk toward the nearest fight / loot / pack; hold at `keep`, back off inside `kite`.
  autopilot: { engage: 14, keep: 6.5, kite: 3.5, loot: 15 },
  keys: { powerUp: 'w', powerDown: 's', cadUp: 'd', cadDown: 'a', step: 120, cadStep: 40 }, // per second while held
};

// Zwift Ride controls and what they do. `key` is the keyboard stand-in in RIDE mode.
// Left hand: D-pad and the left shifter. Right hand: Y/Z/A/B and the right shifter.
// (Layout follows the Zwift Play/Ride button set; adjust once tested on the real controllers.)
export const RIDE_BUTTONS = [
  { id: 'up', side: 'L', at: [1, 0], key: 'arrowup', label: '▲' },
  { id: 'left', side: 'L', at: [0, 1], key: 'arrowleft', label: '◀' },
  { id: 'right', side: 'L', at: [2, 1], key: 'arrowright', label: '▶' },
  { id: 'down', side: 'L', at: [1, 2], key: 'arrowdown', label: '▼' },
  { id: 'lshift', side: 'L', at: [0, 3], key: 'q', label: 'SHIFT −', act: 'flask', icon: '♥', col: '#ff4a5a', wide: 1 },
  { id: 'Y', side: 'R', at: [1, 0], key: 'i', label: 'Y', act: 'auto', icon: '⟳', col: '#5fe39a' },
  { id: 'Z', side: 'R', at: [0, 1], key: 'j', label: 'Z', act: 'nova', icon: '❄', col: '#7fd8ff' },
  { id: 'B', side: 'R', at: [2, 1], key: 'l', label: 'B', act: 'arc', icon: 'ϟ', col: '#c98bff', hold: 1 },
  { id: 'A', side: 'R', at: [1, 2], key: 'k', label: 'A', act: 'fb', icon: '✹', col: '#ff8a3c', hold: 1 },
  { id: 'rshift', side: 'R', at: [0, 3], key: 'e', label: 'SHIFT +', act: 'shield', icon: '◎', col: '#7fb8ff', wide: 1 },
];

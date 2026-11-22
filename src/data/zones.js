export const ZONES = [
  { max: .55, name: 'RECOVERY', col: '#7c8cff' },
  { max: .75, name: 'ENDURANCE', col: '#5fd3ff' },
  { max: .87, name: 'TEMPO', col: '#5fe39a' },
  { max: .95, name: 'SWEET SPOT', col: '#ffd23f' },
  { max: 1.05, name: 'THRESHOLD', col: '#ff9a3c' },
  { max: 1.25, name: 'VO2 MAX', col: '#ff5a4a' },
  { max: 99, name: 'SPRINT', col: '#ff4fd8' },
];
export const zoneOf = rel => { for (let i = 0; i < ZONES.length; i++) if (rel < ZONES[i].max) return i; return 6; };

// Scripted "good day" workout used by the intervals rider source.
export const INTERVALS = [
  { n: 'WARM UP', d: 40, p: .62, c: 86 }, { n: 'SWEET SPOT', d: 60, p: .91, c: 90 }, { n: 'RECOVER', d: 30, p: .52, c: 86 },
  { n: 'VO2 MAX', d: 40, p: 1.15, c: 98 }, { n: 'RECOVER', d: 30, p: .52, c: 86 }, { n: 'HIGH CADENCE', d: 30, p: .72, c: 108 },
  { n: 'SPRINT', d: 15, p: 1.7, c: 112 }, { n: 'ENDURANCE', d: 60, p: .68, c: 88 },
];

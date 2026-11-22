import { S } from '../core/state.js';

export const ELEM = {
  frost: { icon: '❄', col: '#7fd8ff', name: 'Frost', hex: 0x7fd8ff },
  fire:  { icon: '🔥', col: '#ff8a3c', name: 'Fire', hex: 0xff8a3c },
  storm: { icon: '⚡', col: '#c98bff', name: 'Storm', hex: 0xc98bff },
};
export const elemOf = r => r < .87 ? 'frost' : r < 1.05 ? 'fire' : 'storm';

// Effort reactions the rider answers with their legs.
export const TELLS = {
  surge: { icon: '⚡', col: '#ff4fd8', title: 'SURGE!', hint: 'Go above 120% FTP to dodge' },
  brace: { icon: '⛨', col: '#6fd3ff', title: 'EASE OFF!', hint: 'Drop below 75% FTP to brace' },
  spin:  { icon: '⟳', col: '#5fe39a', title: 'SPIN!', hint: 'Hold 105+ rpm to interrupt', need: 1.1 },
  hold:  { icon: '≋', col: '#ffd23f', title: 'HOLD SWEET SPOT!', hint: 'Stay at 85–105% FTP to outlast', need: 3.2 },
};

// Enemy actions that trigger a tell.
export const ACTS = {
  charge: { tell: 'surge', dur: 1.5, name: 'Charge', cd: [6, 9], cond: (e, d) => d > 1.8 && d < 7 },
  fuse:   { tell: 'surge', dur: 1.5, name: 'Fuse lit', cd: [99, 99], cond: (e, d) => d < 1.9 },
  slam:   { tell: 'brace', dur: 1.8, name: 'Slam', cd: [7, 10], cond: (e, d) => d < 3.4 },
  heal:   { tell: 'spin', dur: 3.2, name: 'Dark mending', cd: [6, 8], cond: e => S.enemies.some(o => !o.dead && o.active && o !== e && o.room === e.room && o.hp < o.maxHp * .85) },
  summon: { tell: 'spin', dur: 3.2, name: 'Summon swarm', cd: [15, 19], cond: () => true },
  enrage: { tell: 'hold', dur: 5, name: 'Frenzy', cd: [13, 16], cond: (e, d) => d < 3 },
};

export const BOONS = {
  diesel:    { name: 'Diesel Heart', col: '#ffb347', desc: 'Steady power ramps damage, up to +40%' },
  metronome: { name: 'Metronome', col: '#5fd3ff', desc: 'Steady cadence for 15s: +30% attack speed' },
  spark:     { name: 'Spark', col: '#ff4fd8', desc: 'Sprints hit 3× harder, but W′ drains faster' },
  ember:     { name: 'Ember Core', col: '#e8b960', desc: 'Cleave charges 60% faster' },
  chain:     { name: 'Thunder Chain', col: '#b06bff', desc: 'Overload chains to 4 more foes' },
  wind:      { name: 'Second Wind', col: '#5fe39a', desc: 'Easy spinning heals you, even mid-fight' },
  lungs:     { name: 'Iron Lungs', col: '#4fd1a5', desc: '+35% W′ stamina' },
  fever:     { name: 'Gold Fever', col: '#ffd23f', desc: '+50% gold from everything' },
};

export const ROOM = {
  start:    { glyph: '⌂', col: '#8d8370', name: 'Entrance', hint: '' },
  combat:   { glyph: '⚔', col: '#e9e2d0', name: 'Monster den', hint: 'any effort' },
  elite:    { glyph: '☠', col: '#ffd23f', name: 'Elite lair', hint: 'sweet spot · better loot' },
  treasure: { glyph: '$', col: '#5fe39a', name: 'Treasure vault', hint: 'spin 100+ rpm to pick the lock' },
  campfire: { glyph: '♨', col: '#ff8a4a', name: 'Campfire', hint: 'recovery spin · heal' },
  boss:     { glyph: '♛', col: '#ff4fd8', name: 'The Warden', hint: 'VO2 & sprints · brace on slams' },
};

export const RAR = ['Common', 'Magic', 'Rare', 'Legendary'], RMAG = [1, 1.7, 2.6, 3.8];
export const NAMES = {
  weapon: { base: ['Blade', 'Axe', 'Mace', 'Glaive'], leg: ['Kilojoule Reaver', 'Threshold Cleaver', 'Wattbringer'] },
  armor: { base: ['Plate', 'Mail', 'Cuirass', 'Brigandine'], leg: ['Aegis of the Long Ride', 'Zone Two Bulwark'] },
  relic: { base: ['Sigil', 'Charm', 'Idol', 'Talisman'], leg: ['Cadence Engine', 'Heart of the Diesel', 'Crown of VO2'] },
};
export const PRE = [['Worn', 'Plain', 'Rusty'], ['Keen', 'Sturdy', 'Bright'], ['Ember', 'Storm', 'Void', 'Frost']];

// Ally tuning (game/allies.js): how monsters choose between the hero and the hero's allies (minions, totems, decoys).
// retarget: seconds between target choices. An ally steals a monster's attention if it is within `aggro` of it and at least
// `margin` closer than the hero (minions tank what they reach first). A taunting ally (taunt > 0) wins outright within its tauntR.
import { RISE } from './monsters.js';
export const ALLY = { retarget: .4, aggro: 9, margin: 1.5 };
// How a summoned skeleton looks and moves (game/minions.js). Same KayKit warrior as the zombie monsters, tinted spectral green so it reads as yours,
// with the same clips. Primitive fallback: a pale buildModel figure. glow: the colour of its ground aura and (primitive) eyes.
export const SKEL = {
  weapon: 'blade', tint: 0x9fe8d0, glow: 0x7dffc0, body: 0xb8ae96, head: 0xe6dfcc,
  walk: 'Skeletons_Walking', idle: 'Skeletons_Idle', rise: RISE.floor,
  attacks: [['Melee_1H_Attack_Chop', 1.8], ['Melee_1H_Attack_Slice_Diagonal', 1.7], ['Melee_1H_Attack_Slice_Horizontal', 2.1]],
};

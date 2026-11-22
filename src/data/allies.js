// Ally tuning (game/allies.js): how monsters choose between the hero and the hero's allies (minions, totems, decoys).
// retarget: seconds between target choices. An ally steals a monster's attention if it is within `aggro` of it and at least
// `margin` closer than the hero (minions tank what they reach first). A taunting ally (taunt > 0) wins outright within its tauntR.
export const ALLY = { retarget: .4, aggro: 9, margin: 1.5 };

// Where a run starts and how the hero moves between Crypt levels. P.waypoint is the furthest Crypt cleared (0..5, saved); the hero may enter
// any Crypt up to waypoint + 1. A fresh character goes straight into Crypt 1; a continued one opens the waypoint screen (ui/waypoint.js).
// Clearing a level (guardian death, game/level.js onKill) raises the waypoint and counts a clear; its portal, and "Leave level" in the menu,
// both lead back here. Leaving keeps everything earned (xp, gear, gems, items live on P); only that level's clear is lost.
import { G, P } from '../core/state.js';
import { LEVELS } from '../data/levels.js';
import { dbg } from '../core/dbg.js';
import { newLevel } from './level.js';
import { save } from './save.js';

// The waypoint screen registers itself here (ui/waypoint.js), so game code never imports UI.
export const wpUI = { open: null, close: null };

// The highest Crypt the hero may enter now.
export const maxEnter = () => Math.min(LEVELS.length, (P.waypoint || 0) + 1);

// sv: the loaded save, or null for a fresh character (initCharacter has already run).
export function startRun(sv) {
  if (!sv) { enterLevel(1); save(); } else openWaypoint();
}
export function openWaypoint() { if (wpUI.open) wpUI.open(); }
// Enter Crypt n (1..maxEnter()): builds a fresh level and closes the waypoint screen. False if n is locked.
export function enterLevel(n) {
  if (!(n >= 1 && n <= maxEnter())) return false;
  if (wpUI.close) wpUI.close();
  newLevel(n); save(); return true;
}
// Quit the level part-way: save what the hero has and go back to the waypoint screen.
export function leaveLevel() { save(); openWaypoint(); }

Object.assign(dbg, { openWaypoint, enterLevel, leaveLevel, LEVELS });

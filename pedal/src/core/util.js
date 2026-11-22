export const $ = id => document.getElementById(id);
export const rand = (a, b) => a + Math.random() * (b - a);
export const randi = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const pick = a => a[Math.random() * a.length | 0];

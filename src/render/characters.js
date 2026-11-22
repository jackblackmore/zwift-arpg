// Animated characters from the KayKit packs (CC0, Kay Lousberg), trimmed by scripts/prep-models.mjs.
// All characters share one rig, so the enemy clips ship once (in skel_minion.glb) and drive every skeleton.
// If loading fails the game falls back to the primitive models in render/models.js.
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CHAR_BRIGHTNESS } from '../data/graphics.js';

export const chars = { ready: false, failed: false, tpl: {}, clips: {}, weapons: {} };
const BASE = (import.meta.env.BASE_URL || './') + 'models/';

const FILES = { minion: 'skel_minion.glb', warrior: 'skel_warrior.glb', rogue: 'skel_rogue.glb', mage: 'skel_mage.glb', hero: 'hero_mage.glb' };
const WEAPONS = { blade: 'w_blade.glb', axe: 'w_axe.glb', crossbow: 'w_crossbow.glb', shield: 'w_shield_large_a.glb', staff: 'w_staff.glb' };

// GLTFLoader can hand back interleaved attributes, which r128's merge helper refuses; copy them out flat.
const GET = ['getX', 'getY', 'getZ', 'getW'];
function deinterleave(geo) {
  for (const [name, a] of Object.entries(geo.attributes)) {
    if (!a.isInterleavedBufferAttribute) continue;
    const arr = new a.array.constructor(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) arr[i * a.itemSize + k] = a[GET[k]](i);
    geo.setAttribute(name, new T.BufferAttribute(arr, a.itemSize, a.normalized));
  }
}
// Merge the skinned body parts that share a material into one mesh: ~10 draw calls per character down to ~3.
function mergeSkinned(root) {
  const groups = new Map();
  root.traverse(o => {
    if (!o.isSkinnedMesh) return;
    const key = o.material.uuid + '|' + Object.keys(o.geometry.attributes).sort().join(',') + '|' + !!o.geometry.index;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  });
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    list.forEach(m => deinterleave(m.geometry));
    const geo = BufferGeometryUtils.mergeBufferGeometries(list.map(m => m.geometry));
    if (!geo) continue;
    const first = list[0], merged = new T.SkinnedMesh(geo, first.material);
    merged.name = first.name + '_merged';
    first.parent.add(merged); merged.bind(first.skeleton, first.bindMatrix);
    for (const m of list) m.parent.remove(m);
  }
}
// The renderer works in linear space (lighting is tuned for r128's legacy lighting), so show textures as authored.
function linearise(root) { root.traverse(o => { if (o.material) { const m = o.material; if (m.map) { m.map.encoding = T.LinearEncoding; m.map.needsUpdate = true; } } }); }

export async function loadCharacters() {
  const loader = new GLTFLoader();
  const load = f => new Promise((res, rej) => loader.load(BASE + f, res, undefined, rej));
  try {
    const [tpl, wpn] = await Promise.all([
      Promise.all(Object.entries(FILES).map(async ([k, f]) => [k, await load(f)])),
      Promise.all(Object.entries(WEAPONS).map(async ([k, f]) => [k, await load(f)])),
    ]);
    for (const [k, g] of tpl) {
      linearise(g.scene); mergeSkinned(g.scene);
      const box = new T.Box3().setFromObject(g.scene);
      chars.tpl[k] = { scene: g.scene, height: box.max.y - box.min.y || 2 };
      if (k === 'minion') g.animations.forEach(c => chars.clips[c.name] = c);
      if (k === 'hero') chars.heroClips = Object.fromEntries(g.animations.map(c => [c.name, c]));
    }
    for (const [k, g] of wpn) { linearise(g.scene); chars.weapons[k] = g.scene; }
    chars.ready = true;
  } catch (e) { console.warn('Character models failed to load, using primitive models: ' + (e && (e.stack || e.message || e))); chars.failed = true; }
  return chars.ready;
}

// Make one animated character. kind: a FILES key. height: target height in world units.
// Returns the same shape the game uses for primitive models ({ g, mats }) plus a mixer and play().
export function makeChar(kind, height, { weapon, offhand, tint } = {}) {
  const t = chars.tpl[kind], inner = SkeletonUtils.clone(t.scene), g = new T.Group();
  inner.scale.setScalar(height / t.height); g.add(inner);
  const mats = [];
  inner.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.frustumCulled = false; // skinned bounds don't follow the animation
    o.material = o.material.clone();
    if (o.material.name !== 'Glow') { o.material.color.multiplyScalar(CHAR_BRIGHTNESS); if (tint) o.material.color.multiply(new T.Color(tint)); mats.push(o.material); }
  });
  const bone = n => { let b = null; inner.traverse(o => { if (!b && o.name === n) b = o; }); return b; };
  const attach = (w, slot) => { if (!w || !chars.weapons[w]) return; const m = chars.weapons[w].clone(); m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.material = o.material.clone(); mats.push(o.material); } }); const b = bone(slot); if (b) b.add(m); };
  attach(weapon, 'handslot.r'); attach(offhand, 'handslot.l');
  const mixer = new T.AnimationMixer(inner), clips = kind === 'hero' ? chars.heroClips : chars.clips, acts = {};
  const R = { g, mats, mixer, cur: null, bone, rigged: true };
  // play(name, { once, speed, fade }): crossfade to a clip. Repeating the current looping clip is a no-op.
  R.play = (name, o = {}) => {
    const clip = clips[name]; if (!clip) return 0;
    const a = acts[name] || (acts[name] = mixer.clipAction(clip));
    if (R.cur === name && !o.once) { a.timeScale = o.speed || 1; return clip.duration; }
    a.reset(); a.timeScale = o.speed || 1; a.setLoop(o.once ? T.LoopOnce : T.LoopRepeat); a.clampWhenFinished = !!o.once;
    const prev = R.cur && acts[R.cur]; a.play(); if (prev && prev !== a) prev.crossFadeTo(a, o.fade ?? .15, false);
    R.cur = name; return clip.duration;
  };
  R.mats.forEach(m => { m.userData.c = m.color.getHex(); });
  R.play('Idle');
  return R;
}

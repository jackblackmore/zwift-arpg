// Shared glTF helpers for scripts/prep-models.mjs (the game) and scripts/prep-gallery.mjs (the gallery).
import { NodeIO } from '@gltf-transform/core';
import { prune, dedup, resample, mergeDocuments, unpartition } from '@gltf-transform/functions';
import { readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

export const io = new NodeIO();
// The knight hero (public/models/hero_knight.glb) carries one sword and the round shield; the rest of its kit goes.
export const HERO_HIDE = ['1H_Sword_Offhand', 'Badge_Shield', 'Rectangle_Shield', 'Spike_Shield', '2H_Sword'];
export const kb = f => Math.round(statSync(f).size / 1024) + ' KB';

// Clips we drop can leave accessors behind that nothing references; prune() keeps those, so remove them here.
export const dropLoose = root => { for (const acc of root.listAccessors()) if (acc.listParents().every(p => p === root)) acc.dispose(); };

// Copy the clips of one file into another with the same rig, retargeted to its nodes by name. have: names already present.
export function copyClips(doc, src, have, keep) {
  const root = doc.getRoot(), buf = root.listBuffers()[0];
  const nodes = new Map(root.listNodes().map(n => [n.getName(), n]));
  const acc = a => doc.createAccessor().setType(a.getType()).setArray(a.getArray().slice()).setBuffer(buf);
  for (const a of src.getRoot().listAnimations()) {
    if (have.has(a.getName()) || (keep && !keep.includes(a.getName()))) continue;
    have.add(a.getName());
    const anim = doc.createAnimation(a.getName());
    for (const c of a.listChannels()) {
      const node = nodes.get(c.getTargetNode()?.getName()); if (!node) continue;
      const sm = c.getSampler(), s2 = doc.createAnimationSampler().setInput(acc(sm.getInput())).setOutput(acc(sm.getOutput())).setInterpolation(sm.getInterpolation());
      anim.addSampler(s2).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath(c.getTargetPath()).setSampler(s2));
    }
  }
}

// An animation library: the clips of every source file (all, or only `keep`), rig only with no meshes.
// The rig's nodes stay so three.js can bind the tracks by bone name. Returns the clip names.
export async function animLib(srcs, out, { keep } = {}) {
  srcs = [].concat(srcs);
  const doc = await io.read(srcs[0]), root = doc.getRoot();
  for (const a of root.listAnimations()) if (keep && !keep.includes(a.getName())) { for (const c of a.listChannels()) c.dispose(); for (const s of a.listSamplers()) s.dispose(); a.dispose(); }
  const have = new Set(root.listAnimations().map(a => a.getName()));
  for (const f of srcs.slice(1)) copyClips(doc, await io.read(f), have, keep);
  for (const n of root.listNodes()) if (n.getMesh()) { n.getMesh().dispose(); n.setMesh(null); n.setSkin(null); }
  for (const s of root.listSkins()) s.dispose();
  dropLoose(root);
  await doc.transform(resample(), prune({ keepLeaves: true }), dedup());
  await io.write(out, doc);
  const names = root.listAnimations().map(a => a.getName());
  console.log(basename(out), names.length, 'clips', kb(out));
  return names;
}

// Every model file under a folder (recursively).
const MODEL = /\.(gltf|glb)$/;
export const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : MODEL.test(f) ? [p] : []; });
export const label = p => basename(p).replace(/(\.gltf)?\.glb$|\.gltf$/, '');

// Merge many small models into one file: one top-level node per source file, named after the file.
// Returns [{ name, group }] in node order. group(path) labels each model (stored in the node's extras too).
export async function mergeModels(files, out, { group = () => '' } = {}) {
  const doc = await io.read(files[0]), root = doc.getRoot(), scene = root.listScenes()[0];
  const items = [];
  const wrap = (sc, p) => {
    const n = doc.createNode(label(p)).setExtras({ group: group(p) });
    for (const c of sc.listChildren()) { sc.removeChild(c); n.addChild(c); }
    items.push({ name: n.getName(), group: group(p) });
    return n;
  };
  scene.addChild(wrap(scene, files[0]));
  for (const p of files.slice(1)) {
    mergeDocuments(doc, await io.read(p));
    for (const s of root.listScenes().filter(s => s !== scene)) { scene.addChild(wrap(s, p)); s.dispose(); }
  }
  for (const a of root.listAnimations()) a.dispose();
  dropLoose(root);
  await doc.transform(prune(), dedup(), unpartition());
  await io.write(out, doc);
  console.log(basename(out), items.length, 'models', kb(out));
  return items;
}

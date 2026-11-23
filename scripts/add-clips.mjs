// Adds clips to public/models/anims_new.glb from a gallery animation file on the same rig, without the KayKit packs.
// scripts/prep-models.mjs builds the same file from the packs (keep its NEW_CLIPS list in step); use this when you only have the repo.
// Usage: node scripts/add-clips.mjs <gallery file> <clip> [clip...]
//   e.g. node scripts/add-clips.mjs public/gallery/anims_anim11.glb Melee_Block Melee_Blocking
import { resample, prune, dedup } from '@gltf-transform/functions';
import { io, copyClips, dropLoose, kb } from './gltf-lib.mjs';

const OUT = 'public/models/anims_new.glb', [from, ...clips] = process.argv.slice(2);
if (!from || !clips.length) { console.error('Usage: node scripts/add-clips.mjs <gallery file> <clip> [clip...]'); process.exit(1); }
const doc = await io.read(OUT), root = doc.getRoot(), src = await io.read(from);
const have = new Set(root.listAnimations().map(a => a.getName())), found = new Set(src.getRoot().listAnimations().map(a => a.getName()));
const missing = clips.filter(c => !found.has(c)); if (missing.length) { console.error('Not in ' + from + ': ' + missing.join(', ')); process.exit(1); }
copyClips(doc, src, have, clips);
dropLoose(root);
await doc.transform(resample(), prune({ keepLeaves: true }), dedup());
await io.write(OUT, doc);
console.log(OUT, root.listAnimations().length, 'clips', kb(OUT));

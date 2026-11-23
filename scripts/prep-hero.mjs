// Rebuilds public/models/hero_knight.glb without the KayKit packs: the knight from the gallery (public/gallery/char_knight.glb,
// all its kit, no clips) minus the kit in HERO_HIDE, plus the hero clips copied from another hero file on the same rig.
// scripts/prep-models.mjs builds the same file from the packs; use this when you only have the repo.
// Usage: node scripts/prep-hero.mjs [clips file, default the current hero_knight.glb] (the first build took them from hero_mage.glb)
import { prune, dedup } from '@gltf-transform/functions';
import { existsSync } from 'node:fs';
import { io, copyClips, dropLoose, kb, HERO_HIDE } from './gltf-lib.mjs';

const OUT = 'public/models/hero_knight.glb', clipsFrom = process.argv[2] || OUT;
if (!existsSync(clipsFrom)) { console.error(`No clips file ${clipsFrom}: pass one (any hero .glb on the KayKit rig with Idle, Running_A, Death_A...).`); process.exit(1); }
const src = await io.read(clipsFrom), doc = await io.read('public/gallery/char_knight.glb'), root = doc.getRoot();
for (const n of root.listNodes()) if (HERO_HIDE.includes(n.getName())) n.dispose();
copyClips(doc, src, new Set(), null);
dropLoose(root);
await doc.transform(prune(), dedup());
await io.write(OUT, doc);
console.log(OUT, root.listAnimations().map(a => a.getName()).join(', '), kb(OUT));

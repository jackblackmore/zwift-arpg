// Look tuning: post-processing and shadows (render/post.js).
// Bloom picks up anything brighter than `threshold`: spells, loot beams, eyes, torches.
export const BLOOM = { strength: .8, radius: .5, threshold: .72, vignette: .55 };
// KayKit textures are bright; darken characters a touch so bone doesn't bloom.
export const CHAR_BRIGHTNESS = .8;
export const SHADOW = { map: 1024, box: 16 };

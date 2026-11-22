// Look tuning: post-processing and shadows (render/post.js).
// Bloom picks up anything brighter than `threshold`: spells, loot beams, eyes, torches.
export const BLOOM = { strength: .8, radius: .5, threshold: .72, vignette: .55 };
// KayKit textures are bright; darken characters a touch so bone doesn't bloom.
export const CHAR_BRIGHTNESS = .8;
export const SHADOW = { map: 1024, box: 16 };

// Looks (the LOOK button). All use the same models; only the final shader pass, fog and light change.
//   sat: saturation, contrast, tint: colour multiply, lift: added to blacks (negative crushes them)
//   pixel: render pixel size (1 = off), posterize: colour levels (0 = off), bands: brightness bands keeping hue (0 = off)
//   dither, toon: ink outline strength
//   fog: [near, far, colour], light: hemisphere light intensity, bloom: bloom strength multiplier
export const STYLES = {
  classic: { name: 'Classic', sat: 1, contrast: 1.08, tint: [1.05, 1, .94], lift: 0, pixel: 1, posterize: 0, dither: 0, toon: 0, vig: .55, fog: [24, 44, 0x060405], light: .65, bloom: 1 },
  grim: { name: 'Grim', sat: .45, contrast: 1.22, tint: [1.1, .93, .86], lift: -.02, pixel: 1, posterize: 0, dither: 0, toon: 0, vig: .75, fog: [21, 36, 0x0a0604], light: .55, bloom: 1.15 },
  retro: { name: 'Retro', sat: .85, contrast: 1.1, tint: [1.02, .98, .92], lift: 0, pixel: 3, posterize: 14, dither: 1, toon: 0, vig: .5, fog: [16, 34, 0x08060a], light: .6, bloom: .8 },
  toon: { name: 'Toon', sat: 1.2, contrast: 1.05, tint: [1, 1, 1], lift: .02, pixel: 1, posterize: 0, bands: 4, dither: 0, toon: 1, vig: .35, fog: [26, 48, 0x0c0912], light: .8, bloom: .7 },
};

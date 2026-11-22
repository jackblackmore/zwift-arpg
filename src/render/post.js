// Post-processing and quality levels.
//   high:   bloom + vignette/grade + soft shadows
//   medium: bloom at half resolution + vignette/grade, no shadows (default on touch devices)
//   low:    no bloom or shadows; the style pass still runs (old phones)
import * as T from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { renderer, scene, cam, V, moon, hemi } from './scene.js';
import { BLOOM, SHADOW, STYLES } from '../data/graphics.js';

export const LEVELS = ['low', 'medium', 'high'];
export const STYLE_IDS = Object.keys(STYLES);
const KEY = 'wd-quality', SKEY = 'wd-style';
const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const stored = get(KEY), storedStyle = get(SKEY);
export const Q = {
  level: LEVELS.includes(stored) ? stored : matchMedia('(pointer:coarse)').matches ? 'medium' : 'high',
  style: STYLE_IDS.includes(storedStyle) ? storedStyle : 'classic',
};

// Final pass: pixelation, toon ink, posterize/dither, colour grade and vignette (all driven by STYLES).
const StyleShader = {
  uniforms: {
    tDiffuse: { value: null }, res: { value: new T.Vector2(1, 1) }, vig: { value: .55 }, sat: { value: 1 }, contrast: { value: 1 },
    tint: { value: new T.Vector3(1, 1, 1) }, lift: { value: 0 }, pixel: { value: 1 }, posterize: { value: 0 }, bands: { value: 0 }, dither: { value: 0 }, toon: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; uniform float vig, sat, contrast, lift, pixel, posterize, bands, dither, toon; uniform vec3 tint;
    varying vec2 vUv;
    float luma(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
    float L(vec2 uv){ return luma(texture2D(tDiffuse, uv).rgb); }
    void main(){
      vec2 uv = vUv;
      if (pixel > 1.0) { vec2 px = pixel / res; uv = (floor(uv / px) + .5) * px; }
      vec3 col = texture2D(tDiffuse, uv).rgb;
      if (toon > 0.0) {
        vec2 t = 1.5 / res;
        float tl = L(uv + t * vec2(-1., 1.)), tc = L(uv + t * vec2(0., 1.)), tr = L(uv + t * vec2(1., 1.));
        float ml = L(uv + t * vec2(-1., 0.)), mr = L(uv + t * vec2(1., 0.));
        float bl = L(uv + t * vec2(-1., -1.)), bc = L(uv + t * vec2(0., -1.)), br = L(uv + t * vec2(1., -1.));
        float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br, gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
        col *= 1.0 - smoothstep(.14, .32, length(vec2(gx, gy))) * toon * .85;
      }
      if (posterize > 0.0) {
        float d = 0.0;
        if (dither > 0.0) { vec2 p = floor(gl_FragCoord.xy / max(pixel, 1.0)); d = (fract(52.9829189 * fract(dot(p, vec2(.06711056, .00583715)))) - .5) * dither; }
        col = floor(col * posterize + .5 + d) / posterize;
      }
      if (bands > 0.0) { float lb = luma(col); float q = max(floor(lb * bands + .5) / bands, lb * .75); col *= q / max(lb, .001); }
      float l = luma(col);
      col = mix(vec3(l), col, sat);
      col = (col - .5) * contrast + .5;
      col = col * tint + lift;
      float dv = distance(vUv, vec2(.5));
      col *= mix(1.0, smoothstep(.85, .25, dv), vig);
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }`,
};

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, cam));
const bloom = new UnrealBloomPass(new T.Vector2(256, 256), BLOOM.strength, BLOOM.radius, BLOOM.threshold);
composer.addPass(bloom);
const stylePass = new ShaderPass(StyleShader); composer.addPass(stylePass);

export function applyQuality() {
  const hi = Q.level === 'high';
  renderer.shadowMap.enabled = hi; renderer.shadowMap.type = T.PCFSoftShadowMap;
  moon.castShadow = hi; bloom.enabled = Q.level !== 'low';
  scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); });
  resizePost();
  applyStyle(); set(KEY, Q.level);
}
export function applyStyle() {
  const st = STYLES[Q.style], u = stylePass.uniforms;
  for (const k of ['vig', 'sat', 'contrast', 'lift', 'posterize', 'dither', 'toon']) u[k].value = st[k];
  u.bands.value = st.bands || 0;
  u.pixel.value = st.pixel > 1 ? st.pixel * renderer.getPixelRatio() : 1; // style pixel size is in CSS pixels
  u.tint.value.set(...st.tint);
  scene.fog.near = st.fog[0]; scene.fog.far = st.fog[1]; scene.fog.color.setHex(st.fog[2]); scene.background.setHex(st.fog[2]);
  hemi.intensity = st.light; bloom.strength = BLOOM.strength * st.bloom;
  set(SKEY, Q.style);
}
export function cycleStyle() { Q.style = STYLE_IDS[(STYLE_IDS.indexOf(Q.style) + 1) % STYLE_IDS.length]; applyStyle(); return STYLES[Q.style].name; }
export function cycleQuality() { Q.level = LEVELS[(LEVELS.indexOf(Q.level) + 1) % LEVELS.length]; applyQuality(); return Q.level; }

addEventListener('resize', () => resizePost());
export function resizePost() {
  const dpr = renderer.getPixelRatio();
  composer.setSize(V.W, V.H); stylePass.uniforms.res.value.set(V.W * dpr, V.H * dpr);
  // Bloom at reduced resolution keeps it cheap; medium halves it again.
  const k = Q.level === 'high' ? .5 : .25;
  bloom.setSize(Math.max(64, V.W * dpr * k | 0), Math.max(64, V.H * dpr * k | 0));
}

// The moon light casts shadows in a box that follows the player.
moon.shadow.mapSize.set(SHADOW.map, SHADOW.map);
Object.assign(moon.shadow.camera, { left: -SHADOW.box, right: SHADOW.box, top: SHADOW.box, bottom: -SHADOW.box, near: 1, far: 60 });
moon.shadow.bias = -.0015;
scene.add(moon.target);
const MOON = new T.Vector3(-9, 20, 7);
export function render(px, pz) {
  moon.position.set(px + MOON.x, MOON.y, pz + MOON.z); moon.target.position.set(px, 0, pz);
  composer.render();
}

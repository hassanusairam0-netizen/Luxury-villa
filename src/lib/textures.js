import * as THREE from 'three';
import { Noise2D, mulberry32 } from './noise.js';

// Procedural material textures. Every texture is painted into a canvas at load
// time so the experience ships without external image assets. Colour maps are
// sRGB; bump/roughness maps are linear.

let MAX_ANISO = 8;
let QUALITY = 1; // 1 = desktop, 0.5 = mobile (halves texture resolution)

export function configureTextures({ anisotropy, quality }) {
  MAX_ANISO = anisotropy;
  QUALITY = quality;
}

const S = (n) => Math.max(64, Math.round(n * QUALITY));

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(c, { srgb = true, repeat = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = MAX_ANISO;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

// Paint a canvas pixel-by-pixel. `fn(u, v, x, y)` returns [r, g, b] (0-255)
// and optionally a 4th "height" channel written to a parallel bump canvas.
function paint(w, h, fn, withBump = false) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;
  let bc, bctx, bimg, bd;
  if (withBump) {
    bc = canvas(w, h);
    bctx = bc.getContext('2d');
    bimg = bctx.createImageData(w, h);
    bd = bimg.data;
  }
  const out = [0, 0, 0, 128];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      out[3] = 128;
      fn(x / w, y / h, x, y, out);
      const i = (y * w + x) * 4;
      d[i] = out[0];
      d[i + 1] = out[1];
      d[i + 2] = out[2];
      d[i + 3] = 255;
      if (withBump) {
        bd[i] = bd[i + 1] = bd[i + 2] = out[3];
        bd[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  if (withBump) bctx.putImageData(bimg, 0, 0);
  return { c, bc };
}

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
function mix3(a, b, t, out) {
  out[0] = clamp255(a[0] + (b[0] - a[0]) * t);
  out[1] = clamp255(a[1] + (b[1] - a[1]) * t);
  out[2] = clamp255(a[2] + (b[2] - a[2]) * t);
}

// ---------------------------------------------------------------- travertine
// One texture tile covers `tileMeters` and contains large-format stone
// tiles laid in running bond (or a seamless slab when joints = false).
export function travertine({ seed = 3, joints = true, tone = [228, 214, 190], vein = [196, 176, 146], size = 1024, tileW = 4, tileH = 4 } = {}) {
  const n = new Noise2D(seed);
  const rnd = mulberry32(seed + 9);
  const w = S(size);
  const tileTones = [];
  for (let i = 0; i < 64; i++) tileTones.push((rnd() - 0.5) * 14);
  const tmp = [0, 0, 0];
  const { c, bc } = paint(w, w, (u, v, x, y, out) => {
    // Sedimentary banding: strongly stretched noise.
    const band = n.fbm(u * 3, v * 22, 5, 3) * 0.5 + 0.5;
    const fine = n.fbm(u * 40, v * 160, 2, 40) * 0.5 + 0.5;
    let t = Math.pow(band, 1.6) * 0.75 + fine * 0.25;
    // Pores: elongated dark voids characteristic of travertine.
    const pore = n.noise(u * 70, v * 300, 70);
    let height = 160 + band * 50;
    if (pore > 0.62) {
      t += 0.55;
      height -= 70 * (pore - 0.62) * 3;
    }
    mix3(tone, vein, Math.min(1, t * 0.9), tmp);
    let tileShift = 0;
    let joint = 1;
    if (joints) {
      const row = Math.floor(v * tileH);
      const off = row % 2 ? 0.5 / tileW : 0;
      const col = Math.floor((u + off) * tileW);
      tileShift = tileTones[(row * 7 + col * 13) & 63];
      const fu = ((u + off) * tileW) % 1;
      const fv = (v * tileH) % 1;
      const ju = Math.min(fu, 1 - fu) * (w / tileW);
      const jv = Math.min(fv, 1 - fv) * (w / tileH);
      const jd = Math.min(ju, jv);
      if (jd < 1.2) joint = 0.72;
      if (jd < 1.2) height = 40;
    }
    out[0] = (tmp[0] + tileShift) * joint;
    out[1] = (tmp[1] + tileShift) * joint;
    out[2] = (tmp[2] + tileShift * 0.9) * joint;
    out[3] = clamp255(height);
  }, true);
  return { map: toTexture(c), bump: toTexture(bc, { srgb: false }) };
}

// -------------------------------------------------------------------- marble
// Domain-warped vein network: crisp primary veins with soft halos and a
// finer secondary web, over a faintly clouded warm-white ground.
export function marble({ seed = 11, base = [243, 239, 232], veinColor = [128, 114, 100], halo = [214, 205, 193], size = 1024, strength = 1 } = {}) {
  const n = new Noise2D(seed);
  const m = new Noise2D(seed + 7);
  const tmp = [0, 0, 0];
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const { c, bc } = paint(S(size), S(size), (u, v, x, y, out) => {
    const w1 = n.fbm(u * 1.6, v * 1.6, 4, 2);
    const w2 = n.fbm(u * 1.6 + 5.2, v * 1.6 + 1.3, 4, 2);
    const p = m.fbm(u * 2 + w1 * 1.9, v * 2 + w2 * 1.9, 5, 2);
    const d = Math.abs(p);
    const width = 0.012 + 0.02 * (n.fbm(u * 3, v * 3, 2, 3) * 0.5 + 0.5);
    const core = 1 - sstep(0, width, d);
    const soft = 1 - sstep(0, 0.11, d);
    const q = Math.abs(m.fbm(u * 6 + w2 * 2.5, v * 6 + w1 * 2.5, 4, 6));
    const fine = (1 - sstep(0, 0.018, q)) * 0.45;
    const cloud = n.fbm(u * 5, v * 5, 4, 5) * 0.5 + 0.5;
    mix3(base, halo, Math.min(1, soft * 0.55 + cloud * 0.18), tmp);
    mix3(tmp, veinColor, Math.min(1, (core * 0.85 + fine) * strength), tmp);
    out[0] = tmp[0];
    out[1] = tmp[1];
    out[2] = tmp[2];
    out[3] = clamp255(200 - core * 50);
  }, true);
  return { map: toTexture(c), bump: toTexture(bc, { srgb: false }) };
}

// ---------------------------------------------------------------- oak floor
// Texture covers planks running along U. `planks` across V.
export function woodPlanks({ seed = 5, light = [196, 160, 118], dark = [150, 112, 74], planks = 10, size = 1024, joints = true } = {}) {
  const n = new Noise2D(seed);
  const rnd = mulberry32(seed);
  const tones = Array.from({ length: 64 }, () => (rnd() - 0.5) * 26);
  const offsets = Array.from({ length: 64 }, () => rnd());
  const tmp = [0, 0, 0];
  const w = S(size);
  const { c, bc } = paint(w, w, (u, v, x, y, out) => {
    const row = Math.floor(v * planks);
    const uu = u + offsets[row];
    const seg = Math.floor(uu * 1.0);
    const id = (row * 3 + seg * 17) & 63;
    const fv = v * planks - row;
    // Grain: noise stretched along the plank with growth rings.
    const ringWarp = n.fbm(uu * 2, fv * 0.6 + row * 3.1, 3) * 3;
    const ring = Math.sin((fv * 8 + ringWarp + row) * Math.PI * 2) * 0.5 + 0.5;
    const streak = n.fbm(uu * 1.5, fv * 30 + row * 10, 3) * 0.5 + 0.5;
    let t = ring * 0.35 + streak * 0.65;
    mix3(light, dark, t, tmp);
    let shade = 1;
    let height = 150 + ring * 40;
    if (joints) {
      const jv = Math.min(fv, 1 - fv) * (w / planks);
      const fu = uu - Math.floor(uu);
      const ju = Math.min(fu, 1 - fu) * w;
      if (jv < 1.0 || ju < 1.0) {
        shade = 0.6;
        height = 30;
      }
    }
    out[0] = (tmp[0] + tones[id]) * shade;
    out[1] = (tmp[1] + tones[id] * 0.8) * shade;
    out[2] = (tmp[2] + tones[id] * 0.6) * shade;
    out[3] = clamp255(height);
  }, true);
  return { map: toTexture(c), bump: toTexture(bc, { srgb: false }) };
}

// Continuous wood grain (veneer) for joinery and furniture.
export function woodGrain({ seed = 21, light = [120, 84, 58], dark = [70, 46, 30], size = 512, figure = 6 } = {}) {
  const n = new Noise2D(seed);
  const tmp = [0, 0, 0];
  const { c, bc } = paint(S(size), S(size), (u, v, x, y, out) => {
    const warp = n.fbm(u * 0.7, v * 1.4, 3, 0) * 0.32;
    const ring = Math.sin((v * figure + warp) * Math.PI * 2);
    const cathedral = Math.pow(Math.abs(ring), 0.8);
    const streak = n.fbm(u * 2.5, v * 110 + warp * 20, 3) * 0.5 + 0.5;
    const pore = n.noise(u * 300, v * 900) * 0.5 + 0.5;
    const t = cathedral * 0.3 + streak * 0.6 + pore * 0.1;
    mix3(light, dark, t, tmp);
    out[0] = tmp[0];
    out[1] = tmp[1];
    out[2] = tmp[2];
    out[3] = clamp255(140 + streak * 60);
  }, true);
  return { map: toTexture(c), bump: toTexture(bc, { srgb: false }) };
}

// -------------------------------------------------------------- plaster etc.
export function mottled({ seed = 7, base = [238, 231, 219], amp = 8, scale = 6, size = 512, grain = 4 } = {}) {
  const n = new Noise2D(seed);
  const { c, bc } = paint(S(size), S(size), (u, v, x, y, out) => {
    const m = n.fbm(u * scale, v * scale, 5, scale);
    const g = n.noise(u * 220, v * 220, 220);
    const d = m * amp + g * grain;
    out[0] = base[0] + d;
    out[1] = base[1] + d;
    out[2] = base[2] + d * 0.9;
    out[3] = clamp255(128 + m * 50 + g * 30);
  }, true);
  return { map: toTexture(c), bump: toTexture(bc, { srgb: false }) };
}

export function fabric({ seed = 13, base = [226, 218, 204], weave = 160, amp = 14, size = 512, slub = 0.35 } = {}) {
  const n = new Noise2D(seed);
  const { c, bc } = paint(S(size), S(size), (u, v, x, y, out) => {
    const wx = Math.sin(u * weave * Math.PI * 2);
    const wy = Math.sin(v * weave * Math.PI * 2);
    const thread = (wx * wy) * 0.5;
    const s = n.fbm(u * 8, v * 80, 3, 8) * slub;
    const m = n.fbm(u * 4, v * 4, 3, 4) * 0.25;
    const d = (thread + s + m) * amp;
    out[0] = base[0] + d;
    out[1] = base[1] + d;
    out[2] = base[2] + d;
    out[3] = clamp255(128 + thread * 90 + s * 60);
  }, true);
  return { map: toTexture(c), bump: toTexture(bc, { srgb: false }) };
}

// Hand-laid limestone wall (garden walls, retaining walls).
export function stoneWall({ seed = 17, size = 1024 } = {}) {
  const w = S(size);
  const c = canvas(w, w);
  const ctx = c.getContext('2d');
  const bc = canvas(w, w);
  const b = bc.getContext('2d');
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#8f8270';
  ctx.fillRect(0, 0, w, w);
  b.fillStyle = '#202020';
  b.fillRect(0, 0, w, w);
  let y = 0;
  while (y < w) {
    const h = w * (0.07 + rnd() * 0.06);
    let x = -rnd() * w * 0.1;
    while (x < w) {
      const sw = w * (0.12 + rnd() * 0.18);
      const tone = 168 + rnd() * 50;
      const r = tone;
      const g = tone * (0.9 + rnd() * 0.04);
      const bl = tone * (0.76 + rnd() * 0.06);
      const pad = w * 0.006;
      const draw = (xx) => {
        ctx.fillStyle = `rgb(${r | 0},${g | 0},${bl | 0})`;
        roundRect(ctx, xx + pad, y + pad, sw - pad * 2, h - pad * 2, w * 0.01);
        ctx.fill();
        const gr = 150 + rnd() * 80;
        b.fillStyle = `rgb(${gr | 0},${gr | 0},${gr | 0})`;
        roundRect(b, xx + pad, y + pad, sw - pad * 2, h - pad * 2, w * 0.012);
        b.fill();
      };
      draw(x);
      if (x + sw > w) draw(x - w);
      x += sw;
    }
    y += h;
  }
  // Weathering speckle over everything.
  speckle(ctx, w, seed, 0.09);
  speckle(b, w, seed + 1, 0.12);
  return { map: toTexture(c), bump: toTexture(bc, { srgb: false }) };
}

function speckle(ctx, w, seed, alpha) {
  const n = new Noise2D(seed);
  const img = ctx.getImageData(0, 0, w, w);
  const d = img.data;
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const k = n.fbm(x / w * 16, y / w * 16, 4, 16) * 255 * alpha + n.noise(x * 0.9, y * 0.9) * 255 * alpha * 0.6;
      d[i] = clamp255(d[i] + k);
      d[i + 1] = clamp255(d[i + 1] + k);
      d[i + 2] = clamp255(d[i + 2] + k);
    }
  }
  ctx.putImageData(img, 0, 0);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------------------------------------------------------------- landscape
export function groundTexture({ seed = 23, size = 1024 } = {}) {
  const n = new Noise2D(seed);
  const dry = [172, 158, 122];
  const green = [118, 120, 84];
  const earth = [156, 134, 104];
  const tmp = [0, 0, 0];
  const { c } = paint(S(size), S(size), (u, v, x, y, out) => {
    const patch = n.fbm(u * 5, v * 5, 5, 5) * 0.5 + 0.5;
    const blades = n.noise(u * 300, v * 90, 300) * 0.5 + 0.5;
    mix3(green, dry, Math.min(1, patch * 1.3), tmp);
    const e = n.fbm(u * 12 + 7, v * 12, 3, 12);
    if (e > 0.32) mix3(tmp, earth, Math.min(1, (e - 0.32) * 3), tmp);
    const k = (blades - 0.5) * 36;
    out[0] = tmp[0] + k;
    out[1] = tmp[1] + k;
    out[2] = tmp[2] + k * 0.7;
  });
  return { map: toTexture(c) };
}

export function gravel({ seed = 29, size = 512 } = {}) {
  const w = S(size);
  const c = canvas(w, w);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#b9ab92';
  ctx.fillRect(0, 0, w, w);
  const count = Math.round(w * w * 0.02);
  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const y = rnd() * w;
    const r = w * (0.003 + rnd() * 0.006);
    const t = 150 + rnd() * 90;
    ctx.fillStyle = `rgb(${t | 0},${(t * 0.94) | 0},${(t * 0.82) | 0})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + rnd() * 0.4), rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(40,30,20,0.18)';
    ctx.beginPath();
    ctx.ellipse(x + r * 0.3, y + r * 0.35, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return { map: toTexture(c) };
}

export function poolTiles({ size = 512 } = {}) {
  const w = S(size);
  const rnd = mulberry32(41);
  const c = canvas(w, w);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c9d2c8';
  ctx.fillRect(0, 0, w, w);
  const n = 16;
  const s = w / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = rnd() * 18;
      ctx.fillStyle = `rgb(${(176 + t) | 0},${(198 + t) | 0},${(196 + t) | 0})`;
      ctx.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
    }
  }
  return { map: toTexture(c) };
}

// Rug with a quiet border.
export function rug({ base = [214, 204, 186], border = [176, 160, 136], seed = 31, size = 512, borderWidth = 0.06 } = {}) {
  const n = new Noise2D(seed);
  const { c, bc } = paint(S(size), S(size), (u, v, x, y, out) => {
    const pile = n.noise(u * 260, v * 260) * 10 + n.fbm(u * 10, v * 10, 3) * 8;
    const inBorder = u < borderWidth || u > 1 - borderWidth || v < borderWidth || v > 1 - borderWidth;
    const inner = u < borderWidth + 0.012 || u > 1 - borderWidth - 0.012 || v < borderWidth + 0.012 || v > 1 - borderWidth - 0.012;
    const col = inBorder ? border : inner ? [base[0] - 10, base[1] - 10, base[2] - 10] : base;
    out[0] = col[0] + pile;
    out[1] = col[1] + pile;
    out[2] = col[2] + pile;
    out[3] = clamp255(128 + pile * 6);
  }, true);
  return { map: toTexture(c, { repeat: false }), bump: toTexture(bc, { srgb: false, repeat: false }) };
}

// --------------------------------------------------------------- utilities
export function contactShadow() {
  const w = 128;
  const c = canvas(w, w);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.75)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
  const t = toTexture(c, { srgb: false, repeat: false });
  return t;
}

// Soft rectangular shadow (for sofas, beds, tables). Blurred rounded rect.
export function softRect() {
  const w = 128;
  const c = canvas(w, w);
  const ctx = c.getContext('2d');
  ctx.filter = 'blur(10px)';
  ctx.fillStyle = 'black';
  ctx.fillRect(22, 22, w - 44, w - 44);
  return toTexture(c, { srgb: false, repeat: false });
}

// Tileable normal map for water surfaces.
export function waterNormals({ size = 512, seed = 51 } = {}) {
  const w = S(size);
  const n = new Noise2D(seed);
  const hgt = new Float32Array(w * w);
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / w;
      hgt[y * w + x] = n.fbm(u * 6, v * 6, 5, 6) + 0.35 * n.ridged(u * 10, v * 10, 3, 10);
    }
  }
  const c = canvas(w, w);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, w);
  const d = img.data;
  const k = 3.2;
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const l = hgt[y * w + ((x - 1 + w) % w)];
      const r = hgt[y * w + ((x + 1) % w)];
      const t = hgt[((y - 1 + w) % w) * w + x];
      const b = hgt[((y + 1) % w) * w + x];
      let nx = (l - r) * k;
      let ny = (t - b) * k;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * w + x) * 4;
      d[i] = (nx * 0.5 + 0.5) * 255;
      d[i + 1] = (ny * 0.5 + 0.5) * 255;
      d[i + 2] = (nz * 0.5 + 0.5) * 255;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, { srgb: false });
}

// ----------------------------------------------------------------- foliage
// Alpha cards for olive canopy, cypress, lavender and ornamental grasses.
export function leafCard({ kind = 'olive', seed = 61, size = 256 } = {}) {
  const w = S(size);
  const c = canvas(w, w);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  ctx.clearRect(0, 0, w, w);
  if (kind === 'olive') {
    // Twigs with narrow silver-green leaves.
    for (let b = 0; b < 7; b++) {
      const x0 = w * (0.3 + rnd() * 0.4);
      const y0 = w * (0.55 + rnd() * 0.4);
      const ang = -Math.PI / 2 + (rnd() - 0.5) * 2.2;
      const len = w * (0.3 + rnd() * 0.25);
      ctx.strokeStyle = 'rgba(90,80,62,0.9)';
      ctx.lineWidth = w * 0.006;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len);
      ctx.stroke();
      for (let l = 0; l < 22; l++) {
        const t = rnd();
        const px = x0 + Math.cos(ang) * len * t;
        const py = y0 + Math.sin(ang) * len * t;
        const la = ang + (rnd() > 0.5 ? 1 : -1) * (0.5 + rnd() * 0.6);
        const ll = w * (0.05 + rnd() * 0.04);
        const g = 0.75 + rnd() * 0.35;
        const silver = rnd() < 0.35;
        ctx.fillStyle = silver
          ? `rgb(${(150 * g) | 0},${(160 * g) | 0},${(140 * g) | 0})`
          : `rgb(${(92 * g) | 0},${(108 * g) | 0},${(70 * g) | 0})`;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(la);
        ctx.beginPath();
        ctx.ellipse(ll * 0.5, 0, ll * 0.5, ll * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  } else if (kind === 'cypress') {
    for (let i = 0; i < 900; i++) {
      const x = w * (0.08 + rnd() * 0.84);
      const y = w * (0.05 + rnd() * 0.9);
      const g = 0.7 + rnd() * 0.5;
      ctx.fillStyle = `rgb(${(38 * g) | 0},${(58 * g) | 0},${(34 * g) | 0})`;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 2 + (rnd() - 0.5) * 1.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.035, w * 0.012, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (kind === 'lavender') {
    for (let i = 0; i < 60; i++) {
      const x0 = w * (0.1 + rnd() * 0.8);
      const lean = (rnd() - 0.5) * 0.5;
      const h = w * (0.5 + rnd() * 0.4);
      ctx.strokeStyle = 'rgba(110,122,88,1)';
      ctx.lineWidth = w * 0.006;
      ctx.beginPath();
      ctx.moveTo(x0, w);
      ctx.lineTo(x0 + lean * h, w - h);
      ctx.stroke();
      for (let k = 0; k < 9; k++) {
        const t = 0.75 + k * 0.03;
        const px = x0 + lean * h * t;
        const py = w - h * t;
        const g = 0.8 + rnd() * 0.3;
        ctx.fillStyle = `rgb(${(132 * g) | 0},${(112 * g) | 0},${(170 * g) | 0})`;
        ctx.beginPath();
        ctx.ellipse(px, py, w * 0.012, w * 0.018, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (kind === 'grass') {
    for (let i = 0; i < 220; i++) {
      const x0 = w * (0.35 + rnd() * 0.3);
      const lean = (rnd() - 0.5) * 1.3;
      const h = w * (0.45 + rnd() * 0.55);
      const g = 0.75 + rnd() * 0.4;
      const green = rnd() < 0.45;
      ctx.strokeStyle = green ? `rgba(${(140 * g) | 0},${(150 * g) | 0},${(98 * g) | 0},0.95)` : `rgba(${(200 * g) | 0},${(184 * g) | 0},${(136 * g) | 0},0.95)`;
      ctx.lineWidth = w * (0.003 + rnd() * 0.003);
      ctx.beginPath();
      ctx.moveTo(x0, w);
      ctx.quadraticCurveTo(x0 + lean * h * 0.3, w - h * 0.6, x0 + lean * h * 0.6, w - h);
      ctx.stroke();
    }
  } else if (kind === 'shrub') {
    for (let i = 0; i < 700; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * w * 0.46;
      const x = w / 2 + Math.cos(a) * r;
      const y = w / 2 + Math.sin(a) * r;
      const g = 0.8 + rnd() * 0.45;
      const silver = rnd() < 0.3;
      ctx.fillStyle = silver ? `rgb(${(128 * g) | 0},${(136 * g) | 0},${(108 * g) | 0})` : `rgb(${(92 * g) | 0},${(106 * g) | 0},${(66 * g) | 0})`;
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.02, w * 0.011, rnd() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const t = toTexture(c, { repeat: false });
  t.premultiplyAlpha = false;
  return t;
}

// Bark for olive trunks: gnarled, fissured grey-brown.
export function bark({ seed = 71, size = 256 } = {}) {
  const n = new Noise2D(seed);
  const tmp = [0, 0, 0];
  const { c, bc } = paint(S(size), S(size), (u, v, x, y, out) => {
    const r = n.ridged(u * 6, v * 2, 4, 6);
    const f = n.fbm(u * 20, v * 6, 3, 20) * 0.5 + 0.5;
    mix3([118, 110, 96], [58, 52, 44], Math.min(1, r * 0.8 + f * 0.3), tmp);
    out[0] = tmp[0];
    out[1] = tmp[1];
    out[2] = tmp[2];
    out[3] = clamp255(r * 255);
  }, true);
  return { map: toTexture(c), bump: toTexture(bc, { srgb: false }) };
}

// ------------------------------------------------------------------- artworks
// Original abstract compositions painted procedurally so the villa carries
// its own art collection. Each returns a texture for a canvas of w x h.
export function artwork(kind, seed = 1) {
  const W = S(768);
  const H = S(576);
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  const n = new Noise2D(seed);
  const texturize = (alpha = 0.06) => {
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const k = n.noise(x * 0.35, y * 0.35) * 255 * alpha + n.fbm(x / W * 8, y / H * 8, 3) * 255 * alpha;
        d[i] = clamp255(d[i] + k);
        d[i + 1] = clamp255(d[i + 1] + k);
        d[i + 2] = clamp255(d[i + 2] + k);
      }
    }
    ctx.putImageData(img, 0, 0);
  };
  if (kind === 'fields') {
    // Layered colour fields in ochre and terracotta.
    ctx.fillStyle = '#d9c8aa';
    ctx.fillRect(0, 0, W, H);
    const bands = [['#b4643e', 0.08, 0.42], ['#d8a25e', 0.5, 0.3], ['#3f3a33', 0.84, 0.08]];
    for (const [col, y, h] of bands) {
      ctx.fillStyle = col;
      ctx.filter = 'blur(6px)';
      ctx.globalAlpha = 0.92;
      ctx.fillRect(W * 0.07, H * y, W * 0.86, H * h);
    }
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    texturize(0.07);
  } else if (kind === 'gesture') {
    // Large sumi-like gestural strokes on raw linen.
    ctx.fillStyle = '#e8e0d1';
    ctx.fillRect(0, 0, W, H);
    for (let s = 0; s < 3; s++) {
      ctx.strokeStyle = s === 2 ? 'rgba(150,110,70,0.85)' : 'rgba(34,30,28,0.92)';
      ctx.lineCap = 'round';
      let x = W * (0.15 + rnd() * 0.2);
      let y = H * (0.25 + rnd() * 0.5);
      for (let i = 0; i < 60; i++) {
        const nx = x + W * 0.012 + n.noise(i * 0.1, s) * W * 0.01;
        const ny = y + n.noise(i * 0.08, s + 4) * H * 0.03;
        ctx.lineWidth = W * (0.05 - i * 0.0006) * (s === 2 ? 0.4 : 1);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        x = nx;
        y = ny;
      }
    }
    texturize(0.05);
  } else if (kind === 'horizon') {
    // Quiet seascape abstraction: two fields split by a horizon line.
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#c9cfcc');
    g.addColorStop(0.55, '#e6dccb');
    g.addColorStop(0.56, '#6f7c7a');
    g.addColorStop(1, '#3f4b4b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    texturize(0.08);
  } else if (kind === 'circles') {
    ctx.fillStyle = '#efe7d8';
    ctx.fillRect(0, 0, W, H);
    const cols = ['#c27a4a', '#5d6248', '#2f2b27', '#d9b37c'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = cols[i];
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(W * (0.25 + i * 0.17), H * (0.5 + (rnd() - 0.5) * 0.2), H * (0.18 + rnd() * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    texturize(0.06);
  } else if (kind === 'lines') {
    // Fine graphite line drawing — a contour study.
    ctx.fillStyle = '#f1ebe0';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(40,36,32,0.75)';
    ctx.lineWidth = Math.max(1, W * 0.0018);
    for (let k = 0; k < 46; k++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const y = H * 0.12 + k * H * 0.017 + n.fbm(x / W * 2.2, k * 0.05, 3) * H * 0.25;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    texturize(0.03);
  } else if (kind === 'olive') {
    // Monochrome olive-green field with a single bronze arc.
    ctx.fillStyle = '#4f533c';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#b08a5a';
    ctx.lineWidth = W * 0.025;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 1.05, H * 0.62, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    texturize(0.07);
  }
  return toTexture(c, { repeat: false });
}

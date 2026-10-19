// Small, dependency-free noise toolkit used by the procedural texture and
// terrain generators. All functions are deterministic for a given seed.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;

// Periodic 2D value-gradient noise. `period` makes the noise tile, which keeps
// generated textures seamless when repeated across large architectural planes.
export class Noise2D {
  constructor(seed = 1) {
    const rnd = mulberry32(seed);
    this.perm = new Uint16Array(512);
    this.gx = new Float32Array(256);
    this.gy = new Float32Array(256);
    const p = [];
    for (let i = 0; i < 256; i++) {
      p.push(i);
      const a = rnd() * Math.PI * 2;
      this.gx[i] = Math.cos(a);
      this.gy[i] = Math.sin(a);
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  grad(ix, iy, x, y) {
    const h = this.perm[(this.perm[ix & 255] + iy) & 511];
    return this.gx[h] * x + this.gy[h] * y;
  }

  // Returns roughly [-1, 1].
  noise(x, y, period = 0) {
    let x0 = Math.floor(x);
    let y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    let x1 = x0 + 1;
    let y1 = y0 + 1;
    if (period > 0) {
      x0 = ((x0 % period) + period) % period;
      y0 = ((y0 % period) + period) % period;
      x1 = ((x1 % period) + period) % period;
      y1 = ((y1 % period) + period) % period;
    }
    const u = fade(fx);
    const v = fade(fy);
    const n00 = this.grad(x0, y0, fx, fy);
    const n10 = this.grad(x1, y0, fx - 1, fy);
    const n01 = this.grad(x0, y1, fx, fy - 1);
    const n11 = this.grad(x1, y1, fx - 1, fy - 1);
    return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v) * 1.414;
  }

  fbm(x, y, octaves = 4, period = 0, gain = 0.5, lacunarity = 2) {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * this.noise(x * freq, y * freq, period ? period * freq : 0);
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm;
  }

  ridged(x, y, octaves = 4, period = 0) {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      const n = 1 - Math.abs(this.noise(x * freq, y * freq, period ? period * freq : 0));
      sum += amp * n * n;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / norm;
  }
}

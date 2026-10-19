import * as THREE from 'three';

// The authored camera journey through the villa. Each keyframe is a camera
// position and a point of interest; `w` is how much scroll it takes to reach
// it from the previous keyframe; `time` drives the sun (0 afternoon → 1
// golden hour); `exp` is the photographic exposure for the shot.
//
// Positions were laid out against the floor plan in ../world/plan.js and are
// verified against every wall/furniture collider by tools/check-path.mjs.

const K = (pos, tgt, w, extra = {}) => ({ pos: new THREE.Vector3(...pos), tgt: new THREE.Vector3(...tgt), w, ...extra });

export const KEYFRAMES = [
  // ---------------------------------------------------- hero → arrival
  K([-76, 9.5, 33], [10, 5.5, 8], 0, { id: 'hero', time: 0.0, exp: 1.000, shadow: 85, fov: 36 }),
  K([-70, 7.0, 18], [-14, 3.0, 0], 1.3, { time: 0.0, exp: 1.000, shadow: 70, fov: 40 }),
  K([-64.5, 3.4, 5], [-24, 2.0, -1.5], 1.4, { time: 0.02, exp: 1.000, shadow: 55, fov: 44 }),
  K([-58, 1.9, -1.2], [-23, 2.2, -1.5], 1.2, { id: 'arrival', time: 0.03, exp: 1.000, shadow: 45, fov: 46 }),
  K([-46, 1.7, -1.35], [-23, 2.0, -1.5], 1.2, { time: 0.04, exp: 1.000, shadow: 40, fov: 46 }),
  K([-34, 1.65, -1.6], [-23, 1.9, -1.5], 1.2, { time: 0.05, exp: 1.000, shadow: 30, fov: 48 }),
  K([-26.6, 1.55, -0.9], [-23.1, 1.4, -1.5], 1.0, { id: 'door', time: 0.06, exp: 1.022, shadow: 22, fov: 46 }),
  K([-25.1, 1.6, -1.45], [-21.5, 1.8, -1.5], 0.8, { time: 0.06, exp: 1.067, shadow: 22 }),
  K([-23.6, 1.62, -1.5], [-19, 2.4, -1.5], 0.8, { id: 'threshold', time: 0.07, exp: 1.135, shadow: 22 }),
  // ---------------------------------------------------- entrance hall
  K([-21.4, 1.62, -1.6], [-19.6, 5.4, -1.6], 1.0, { id: 'hall', time: 0.08, exp: 1.202, shadow: 22 }),
  K([-20.6, 1.62, -0.6], [-19.5, 2.0, -5.0], 1.0, { time: 0.09, exp: 1.202, shadow: 22 }),
  K([-18.6, 1.62, -1.3], [-10, 1.5, 2.5], 1.0, { time: 0.1, exp: 1.180, shadow: 24 }),
  // ---------------------------------------------------- living
  K([-15.2, 1.62, -2.8], [-8, 1.2, 3], 1.0, { time: 0.11, exp: 1.157, shadow: 26 }),
  K([-12.4, 1.7, -4.3], [-6.5, 1.0, 10], 1.2, { id: 'living', time: 0.12, exp: 1.135, shadow: 28 }),
  K([-8.5, 1.75, -4.45], [-6, 1.1, 14], 1.4, { time: 0.13, exp: 1.135, shadow: 28 }),
  K([-4.4, 1.65, -4.6], [2, 1.2, -3.0], 1.0, { time: 0.14, exp: 1.180, shadow: 24 }),
  // ---------------------------------------------------- kitchen
  K([-1.9, 1.62, -4.75], [2.5, 1.2, -2.5], 0.9, { time: 0.15, exp: 1.202, shadow: 22 }),
  K([-0.85, 1.3, -2.3], [3.5, 0.92, -2.3], 1.0, { id: 'kitchen', time: 0.16, exp: 1.202, shadow: 20 }),
  K([-0.4, 1.55, -0.4], [3.0, 1.3, -3.8], 0.9, { time: 0.17, exp: 1.202, shadow: 22 }),
  // ---------------------------------------------------- dining
  K([2.6, 1.62, 1.6], [8.4, 1.0, 1.5], 1.0, { time: 0.18, exp: 1.180, shadow: 24 }),
  K([6.1, 1.6, 4.7], [8.6, 0.9, 0.6], 1.0, { id: 'dining', time: 0.19, exp: 1.180, shadow: 24 }),
  K([6.0, 1.62, 0.6], [10.5, 1.5, 2.5], 1.0, { time: 0.2, exp: 1.202, shadow: 22 }),
  // ---------------------------------------------------- corridor
  K([7.2, 1.62, -2.6], [11.8, 1.6, -5.0], 0.9, { time: 0.21, exp: 1.225, shadow: 22 }),
  K([10.0, 1.62, -4.9], [16, 1.6, -5.0], 0.8, { time: 0.22, exp: 1.248, shadow: 22 }),
  K([13.6, 1.62, -5.0], [18, 1.5, -4.6], 0.9, { time: 0.23, exp: 1.225, shadow: 22 }),
  // ---------------------------------------------------- master bedroom
  K([16.0, 1.62, -4.6], [16.2, 1.5, 0.0], 0.7, { time: 0.24, exp: 1.248, shadow: 22 }),
  K([16.15, 1.62, -2.6], [19.5, 0.9, -2.6], 0.8, { time: 0.25, exp: 1.248, shadow: 22 }),
  K([16.9, 1.62, 0.9], [19.6, 0.8, -2.4], 1.0, { id: 'master', time: 0.26, exp: 1.225, shadow: 22 }),
  K([19.4, 1.62, 3.2], [19.8, 1.25, 14], 1.2, { time: 0.27, exp: 1.157, shadow: 26 }),
  K([22.4, 1.62, 1.0], [25.5, 1.5, 0.6], 0.9, { time: 0.28, exp: 1.225, shadow: 22 }),
  // ---------------------------------------------------- dressing
  K([24.6, 1.62, 0.85], [27.5, 1.6, -2.5], 0.8, { time: 0.29, exp: 1.270, shadow: 20 }),
  K([25.7, 1.62, 0.2], [26.25, 1.0, 3.6], 0.9, { id: 'dressing', time: 0.3, exp: 1.270, shadow: 20 }),
  K([27.6, 1.62, -0.2], [31.5, 1.3, 2.5], 0.8, { time: 0.31, exp: 1.248, shadow: 20 }),
  // ---------------------------------------------------- spa
  K([29.6, 1.62, 0.3], [32.0, 0.6, 4.0], 0.9, { time: 0.32, exp: 1.225, shadow: 22 }),
  K([30.9, 1.65, 1.4], [33, 1.0, 8], 1.0, { id: 'spa', time: 0.33, exp: 1.180, shadow: 24 }),
  K([30.3, 1.62, -1.6], [32.4, 1.6, -3.9], 0.9, { time: 0.34, exp: 1.248, shadow: 22 }),
  K([29.5, 1.62, -3.3], [29.5, 1.6, -6], 0.6, { time: 0.35, exp: 1.248, shadow: 22 }),
  // ---------------------------------------------------- corridor → guest
  K([30.4, 1.62, -5.0], [36, 1.6, -4.6], 0.7, { time: 0.36, exp: 1.248, shadow: 22 }),
  K([35.4, 1.62, -5.0], [37.5, 1.5, -2.0], 0.8, { time: 0.37, exp: 1.248, shadow: 22 }),
  K([36.3, 1.62, -3.4], [36.2, 0.9, 1.6], 0.7, { time: 0.38, exp: 1.248, shadow: 22 }),
  K([37.6, 1.62, -1.6], [35.6, 0.9, 1.8], 0.9, { id: 'guest', time: 0.39, exp: 1.225, shadow: 22 }),
  K([38.7, 1.62, -0.6], [36.5, 1.2, 5.5], 0.9, { time: 0.4, exp: 1.202, shadow: 24 }),
  K([38.6, 1.62, -1.9], [40.4, 1.3, -2.2], 0.7, { time: 0.41, exp: 1.248, shadow: 22 }),
  K([37.2, 1.62, -3.0], [36.0, 1.6, -6], 0.7, { time: 0.42, exp: 1.248, shadow: 22 }),
  K([36.2, 1.62, -4.7], [42, 1.7, -5.0], 0.6, { time: 0.43, exp: 1.248, shadow: 22 }),
  // ---------------------------------------------------- stair gallery
  K([40.6, 1.62, -5.0], [45, 2.0, -3.0], 0.8, { time: 0.44, exp: 1.225, shadow: 24 }),
  K([43.2, 1.62, -4.6], [46.5, 3.6, -1], 0.8, { time: 0.45, exp: 1.202, shadow: 26 }),
  K([44.2, 2.4, -1.6], [47.0, 6.8, 1.0], 1.2, { id: 'gallery', time: 0.46, exp: 1.180, shadow: 26 }),
  K([44.5, 2.9, 1.6], [46.8, 2.0, -3.5], 1.0, { time: 0.48, exp: 1.180, shadow: 26 }),
  K([44.0, 1.7, 3.9], [43.6, 1.4, 12], 1.0, { time: 0.5, exp: 1.113, shadow: 28 }),
  // ---------------------------------------------------- outdoor living
  K([43.5, 1.65, 6.6], [40, 1.5, 11], 0.8, { id: 'slider', time: 0.53, exp: 1.036, shadow: 30 }),
  K([42.4, 1.65, 9.8], [36, 1.4, 12.5], 0.9, { time: 0.56, exp: 1.000, shadow: 30 }),
  K([37.2, 1.65, 10.1], [28, 1.0, 13], 1.0, { id: 'outdoor', time: 0.6, exp: 1.000, shadow: 32 }),
  K([30.5, 1.7, 9.6], [20, 0.8, 13], 1.0, { time: 0.64, exp: 1.000, shadow: 34 }),
  K([21.5, 1.75, 9.4], [0, 0.4, 13], 1.0, { time: 0.68, exp: 1.000, shadow: 36 }),
  K([12.0, 1.9, 8.6], [-2, 0.3, 16], 1.2, { id: 'pool', time: 0.74, exp: 1.000, shadow: 38 }),
  K([7.5, 4.6, 15.2], [-6, 0.5, 40], 1.3, { time: 0.82, exp: 1.000, shadow: 50, fov: 50 }),
  // ---------------------------------------------------- golden-hour finale
  K([26, 10, 38], [0, 4.0, 2], 1.6, { id: 'finale', time: 0.92, exp: 1.000, shadow: 70, fov: 44 }),
  K([40, 20, 98], [0, 3, 2], 1.6, { id: 'end', time: 1.0, exp: 1.000, shadow: 90, fov: 34 }),
];

// Precompute scroll stops and an unwrapped yaw/pitch for each keyframe.
let acc = 0;
for (const k of KEYFRAMES) {
  acc += k.w;
  k.acc = acc;
}
const total = acc;
let prevYaw = null;
for (const k of KEYFRAMES) {
  k.at = k.acc / total;
  if (k.fov === undefined) k.fov = 54;
  const d = k.tgt.clone().sub(k.pos).normalize();
  let yaw = Math.atan2(-d.x, -d.z);
  if (prevYaw !== null) {
    while (yaw - prevYaw > Math.PI) yaw -= Math.PI * 2;
    while (yaw - prevYaw < -Math.PI) yaw += Math.PI * 2;
  }
  prevYaw = yaw;
  k.yaw = yaw;
  k.pitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
}

export const TOTAL_WEIGHT = total;
export const kfIndex = (id) => KEYFRAMES.findIndex((k) => k.id === id);
export const kfAt = (id) => KEYFRAMES[kfIndex(id)].at;

const posCurve = new THREE.CatmullRomCurve3(KEYFRAMES.map((k) => k.pos), false, 'centripetal', 0.5);
const n = KEYFRAMES.length;

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function scalar(key, i, t) {
  const g = (j) => KEYFRAMES[Math.max(0, Math.min(n - 1, j))][key];
  return catmull(g(i - 1), g(i), g(i + 1), g(i + 2), t);
}

// Find segment for a progress value in [0, 1].
export function segmentAt(p) {
  p = THREE.MathUtils.clamp(p, 0, 1);
  let i = 0;
  while (i < n - 2 && KEYFRAMES[i + 1].at < p) i++;
  const a = KEYFRAMES[i].at;
  const b = KEYFRAMES[i + 1].at;
  return { i, t: b > a ? (p - a) / (b - a) : 0 };
}

const _pos = new THREE.Vector3();
export function sample(p, out = {}) {
  const { i, t } = segmentAt(p);
  posCurve.getPoint((i + t) / (n - 1), _pos);
  out.pos = (out.pos || new THREE.Vector3()).copy(_pos);
  out.yaw = scalar('yaw', i, t);
  out.pitch = scalar('pitch', i, t);
  const lin = (k) => THREE.MathUtils.lerp(KEYFRAMES[i][k], KEYFRAMES[i + 1][k], t);
  out.time = lin('time');
  out.exp = lin('exp');
  out.shadow = lin('shadow');
  out.fov = lin('fov');
  out.index = i;
  out.t = t;
  return out;
}

// Smoothstep of progress between two keyframe ids (used for doors etc.).
export function between(p, idA, idB) {
  const a = kfAt(idA);
  const b = kfAt(idB);
  return THREE.MathUtils.smoothstep(p, a, b);
}

import * as THREE from 'three';
import { Noise2D, mulberry32 } from '../lib/noise.js';
import { mergeCards, makeFurniture } from './furniture.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Hillside site, coastline, sea, vegetation and terrace furnishings.

export const SEA = -55;
const noise = new Noise2D(404);
const ss = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function heightAt(x, z) {
  // Coastline bends south into a headland to the east and a lower one west.
  const coastZ = 130 + 420 * ss(380, 1300, x) + 220 * ss(-420, -1200, x);
  const k = 0.453 - 0.33 * ss(60, 380, Math.abs(x));
  let south = SEA + k * (coastZ - z);
  if (south < SEA) south = SEA - Math.min(30, (SEA - south) * 1.4);
  // Plateau around the villa (flat, gently rising behind it).
  const n = Math.max(0, -z - 26);
  const north = -0.12 + n * 0.17 + n * n * 0.0021;
  const siteW = 1 - ss(110, 200, Math.abs(x - 5));
  let site;
  if (z < 16.3) site = north;
  else site = Math.min(south, -3.95 - (z - 16.3) * 0.28);
  let h = THREE.MathUtils.lerp(south, site, siteW);
  // Natural undulation away from the built area.
  const wild = 1 - siteW * (z < 18 && z > -40 ? 1 : 0.35);
  h += (noise.fbm(x / 140, z / 140, 5) * 22 + noise.fbm(x / 30, z / 30, 3) * 2.5) * wild * (h > SEA ? 1 : 0.4);
  // Local carves under paving and water features.
  if (x > -29.5 && x < 50 && z > 6.5 && z < 15.85) h = -2.2;
  if (x > -56 && x < -27.5 && z > 2.0 && z < 3.6) h = -0.5;
  return h;
}

function axisSamples(lo, hi, dense0, dense1, step, extra) {
  const set = new Set();
  for (let v = dense0; v <= dense1; v += step) set.add(+v.toFixed(3));
  let s = step;
  for (let v = dense0; v > lo; ) {
    s *= 1.18;
    v -= s;
    set.add(+Math.max(lo, v).toFixed(3));
  }
  s = step;
  for (let v = dense1; v < hi; ) {
    s *= 1.18;
    v += s;
    set.add(+Math.min(hi, v).toFixed(3));
  }
  for (const e of extra) set.add(e);
  return [...set].sort((a, b) => a - b);
}

export function buildTerrain(M) {
  const xs = axisSamples(-2600, 3200, -140, 150, 1.6, [-29.5, -30, 50, 50.5, -56, -27.5]);
  const zs = axisSamples(-2200, 2600, -70, 40, 1.0, [6.5, 15.85, 16.3, 16.45, 2.0, 3.6]);
  const nx = xs.length;
  const nz = zs.length;
  const pos = new Float32Array(nx * nz * 3);
  const col = new Float32Array(nx * nz * 3);
  const uv = new Float32Array(nx * nz * 2);
  const c = new THREE.Color();
  const dry = new THREE.Color(0.95, 0.88, 0.74);
  const green = new THREE.Color(0.7, 0.71, 0.56);
  const rock = new THREE.Color(0.88, 0.84, 0.78);
  const beach = new THREE.Color(0.95, 0.9, 0.8);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = xs[i];
      const z = zs[j];
      const h = heightAt(x, z);
      const k = (j * nx + i);
      pos.set([x, h, z], k * 3);
      uv.set([x / 14, z / 14], k * 2);
      const slope = Math.abs(heightAt(x + 2, z) - heightAt(x - 2, z)) + Math.abs(heightAt(x, z + 2) - heightAt(x, z - 2));
      const v = noise.fbm(x / 60 + 3, z / 60, 3) * 0.5 + 0.5;
      c.copy(green).lerp(dry, v);
      c.lerp(rock, ss(1.2, 3.2, slope));
      if (h < SEA + 3 && h > SEA - 4) c.lerp(beach, 0.6);
      col.set([c.r, c.g, c.b], k * 3);
    }
  }
  const idx = [];
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const d = a + nx;
      const e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = M.ground.clone();
  mat.vertexColors = true;
  const mesh = new THREE.Mesh(g, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  return mesh;
}

export function buildSea(M) {
  const n = M.waterNormals.clone();
  n.needsUpdate = true;
  n.repeat.set(900, 900);
  const n2 = M.waterNormals.clone();
  n2.needsUpdate = true;
  n2.repeat.set(2400, 2400);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x1f4d5c, roughness: 0.12, metalness: 0, normalMap: n, normalScale: new THREE.Vector2(0.35, 0.35),
    clearcoat: 1, clearcoatRoughness: 0.06, clearcoatNormalMap: n2, clearcoatNormalScale: new THREE.Vector2(0.5, 0.5),
    envMapIntensity: 1.0,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, SEA, 20000);
  mesh.receiveShadow = false;
  mesh.name = 'sea';
  return { mesh, mat, normals: [n, n2] };
}

// --------------------------------------------------------------- vegetation

// Gnarled olive: twisted multi-stem trunk, spreading limbs, silver canopy of
// alpha leaf cards. Returns { trunk, canopy } geometries.
function oliveGeometry(seed, scale = 1, cardsPerEnd = 26) {
  const rnd = mulberry32(seed);
  const parts = [];
  const cards = [];
  const tube = (pts, r0, r1, radial = 7) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const tg = new THREE.TubeGeometry(curve, Math.max(6, pts.length * 4), 1, radial, false);
    const p = tg.attributes.position;
    const segs = tg.parameters.tubularSegments;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const center = curve.getPoint(t);
      const r = THREE.MathUtils.lerp(r0, r1, t) * (1 + 0.18 * Math.sin(t * 17 + seed));
      for (let k = 0; k <= radial; k++) {
        const idx = i * (radial + 1) + k;
        const v = new THREE.Vector3(p.getX(idx), p.getY(idx), p.getZ(idx)).sub(center);
        v.multiplyScalar(r);
        p.setXYZ(idx, center.x + v.x, center.y + v.y, center.z + v.z);
      }
    }
    tg.computeVertexNormals();
    parts.push(tg);
    return curve;
  };
  const stems = 2 + Math.floor(rnd() * 2);
  const ends = [];
  for (let s = 0; s < stems; s++) {
    const a = (s / stems) * Math.PI * 2 + rnd();
    const lean = 0.25 + rnd() * 0.35;
    const h = (1.4 + rnd() * 0.6) * scale;
    const p0 = new THREE.Vector3(Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08);
    const p1 = new THREE.Vector3(Math.cos(a) * lean * 0.4 + (rnd() - 0.5) * 0.3, h * 0.45, Math.sin(a) * lean * 0.4);
    const p2 = new THREE.Vector3(Math.cos(a) * lean * 0.9, h, Math.sin(a) * lean * 0.9);
    tube([p0, p1, p2], 0.2 * scale, 0.1 * scale, 8);
    // Limbs.
    const limbs = 2 + Math.floor(rnd() * 2);
    for (let l = 0; l < limbs; l++) {
      const b = a + (rnd() - 0.5) * 2.2;
      const len = (1.3 + rnd() * 1.0) * scale;
      const q1 = p2.clone().add(new THREE.Vector3(Math.cos(b) * len * 0.5, len * 0.45, Math.sin(b) * len * 0.5));
      const q2 = p2.clone().add(new THREE.Vector3(Math.cos(b) * len, len * 0.75, Math.sin(b) * len));
      tube([p2.clone(), q1, q2], 0.09 * scale, 0.025 * scale, 6);
      ends.push(q1, q2);
    }
  }
  // Canopy clusters around limb ends.
  const center = new THREE.Vector3();
  ends.forEach((e) => center.add(e));
  center.divideScalar(ends.length);
  for (const e of ends) {
    for (let i = 0; i < cardsPerEnd; i++) {
      const size = (0.75 + rnd() * 0.5) * scale;
      const card = new THREE.PlaneGeometry(size, size);
      card.rotateX((rnd() - 0.5) * 1.8);
      card.rotateY(rnd() * Math.PI * 2);
      const r = (0.3 + rnd() * 0.75) * scale;
      const a = rnd() * Math.PI * 2;
      const y = (rnd() - 0.35) * 0.9 * scale;
      card.translate(e.x + Math.cos(a) * r, e.y + y, e.z + Math.sin(a) * r);
      cards.push(card);
    }
  }
  const trunk = mergeGeometries(parts.map((p) => p.toNonIndexed()));
  const canopy = mergeCards(cards, center.clone().setY(center.y - 0.6 * scale));
  return { trunk, canopy };
}

function cypressGeometry(seed, h = 9) {
  const rnd = mulberry32(seed);
  const cards = [];
  const n = Math.round(h * 26);
  for (let i = 0; i < n; i++) {
    const t = rnd();
    const y = 0.4 + t * h;
    const prof = Math.sin(Math.min(1, t * 1.15) * Math.PI) * (t < 0.15 ? 0.85 + t : 1);
    const r = (0.15 + 0.62 * Math.pow(prof, 0.8)) * (0.6 + rnd() * 0.5);
    const a = rnd() * Math.PI * 2;
    const card = new THREE.PlaneGeometry(0.7, 1.1);
    card.rotateY(a + Math.PI / 2);
    card.rotateX((rnd() - 0.5) * 0.5);
    card.translate(Math.cos(a) * r, y, Math.sin(a) * r);
    cards.push(card);
  }
  const canopy = mergeCards(cards, new THREE.Vector3(0, h * 0.5, 0));
  const core = new THREE.LatheGeometry([
    new THREE.Vector2(0.05, 0), new THREE.Vector2(0.4, 0.6), new THREE.Vector2(0.55, h * 0.3),
    new THREE.Vector2(0.48, h * 0.65), new THREE.Vector2(0.22, h * 0.9), new THREE.Vector2(0.02, h * 1.02),
  ], 10);
  return { canopy, core };
}

function bushGeometry(kind, seed) {
  const rnd = mulberry32(seed);
  const cards = [];
  if (kind === 'shrub') {
    for (let i = 0; i < 40; i++) {
      const a = rnd() * Math.PI * 2;
      const r = rnd() * 0.45;
      const card = new THREE.PlaneGeometry(0.7, 0.7);
      card.rotateX((rnd() - 0.5) * 2);
      card.rotateY(rnd() * 6.28);
      card.translate(Math.cos(a) * r, 0.35 + rnd() * 0.4, Math.sin(a) * r);
      cards.push(card);
    }
    return mergeCards(cards, new THREE.Vector3(0, 0.2, 0));
  }
  // Lavender & grass: crossed upright cards.
  const h = kind === 'grass' ? 0.9 : 0.6;
  for (let i = 0; i < 3; i++) {
    const card = new THREE.PlaneGeometry(0.75, h);
    card.translate(0, h / 2, 0);
    card.rotateY((i / 3) * Math.PI + rnd() * 0.3);
    cards.push(card);
  }
  return mergeCards(cards, new THREE.Vector3(0, -0.3, 0));
}

function instanced(geo, mat, transforms, { cast = true, depth = null, receive = true } = {}) {
  const m = new THREE.InstancedMesh(geo, mat, transforms.length);
  const o = new THREE.Object3D();
  transforms.forEach((t, i) => {
    o.position.set(t.x, t.y, t.z);
    o.rotation.set(0, t.r || 0, 0);
    o.scale.setScalar(t.s || 1);
    if (t.sy) o.scale.y = t.sy * (t.s || 1);
    o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
  });
  m.castShadow = cast;
  m.receiveShadow = receive;
  if (depth) m.customDepthMaterial = depth;
  m.computeBoundingSphere();
  return m;
}

export function buildVegetation(M, B, { quality = 1 } = {}) {
  const group = new THREE.Group();
  group.name = 'vegetation';
  const rnd = mulberry32(77);
  const ground = (x, z, y) => (y !== undefined ? y : heightAt(x, z));

  // ---- olive trees (4 variants)
  const olivePos = [
    // approach
    [-54, -7.4], [-48, -7.2], [-42, -7.5], [-36, -7.2], [-30.5, -7.4],
    [-52, 6.2], [-44, 6.0], [-36, 6.3],
    // west lawn & sun deck
    [-40, 11], [-58, 12], [-68, -2], [-80, 9], [-92, -14], [-70, -20], [-26.6, 14.8, -0.03],
    // north garden of the bedroom wing
    [16, -9.3, -0.06], [24.5, -9.6, -0.06], [33, -9.1, -0.06], [39.5, -9.5, -0.06],
    // north of public wing
    [-8, -12], [2, -15], [-18, -16],
    // terraces
    [21.8, 15.0, -0.03], [33.6, 14.6, -0.03],
    // east lawn
    [56, 4], [62, -8], [68, 12], [78, -2], [90, 10], [84, -18],
    // below the terrace, on the hillside
    [-30, 26], [-8, 30], [12, 24], [30, 31], [48, 25], [-55, 33], [66, 35], [5, 46], [-20, 52], [40, 50],
  ];
  const oliveVariants = [0, 1, 2, 3].map((v) => oliveGeometry(100 + v * 17, 1));
  const oliveT = [[], [], [], []];
  olivePos.forEach(([x, z, y], i) => {
    const t = { x, z, y: ground(x, z, y) - 0.05, r: rnd() * Math.PI * 2, s: 0.95 + rnd() * 0.45 };
    oliveT[i % 4].push(t);
  });
  oliveVariants.forEach((g, v) => {
    if (!oliveT[v].length) return;
    group.add(instanced(g.trunk, M.bark, oliveT[v]));
    group.add(instanced(g.canopy, M.oliveLeaf, oliveT[v], { depth: M.oliveLeafDepth }));
  });
  // Olive groves on the terraced slopes behind the villa and below it.
  const groveG = [oliveGeometry(301, 1.0, 15), oliveGeometry(302, 0.95, 15)];
  const groveT = [[], []];
  let gi = 0;
  for (let z = -48; z > -150; z -= 8.5) {
    for (let x = -150; x < 165; x += 8 + rnd() * 2) {
      if (rnd() < 0.18) continue;
      const xx = x + (rnd() - 0.5) * 2;
      const zz = z + (rnd() - 0.5) * 1.5;
      groveT[gi++ % 2].push({ x: xx, z: zz, y: heightAt(xx, zz) - 0.05, r: rnd() * 6.28, s: 0.8 + rnd() * 0.3 });
    }
  }
  for (let z = 24; z < 70; z += 9) {
    for (let x = -120; x < 130; x += 9 + rnd() * 3) {
      if (rnd() < 0.45) continue;
      const xx = x + (rnd() - 0.5) * 3;
      const y = heightAt(xx, z);
      if (y < SEA + 4) continue;
      groveT[gi++ % 2].push({ x: xx, z, y: y - 0.05, r: rnd() * 6.28, s: 0.8 + rnd() * 0.3 });
    }
  }
  groveG.forEach((g, v) => {
    group.add(instanced(g.trunk, M.bark, groveT[v], { cast: false }));
    group.add(instanced(g.canopy, M.oliveLeaf, groveT[v], { cast: false }));
  });
  // Register trunks as camera obstacles.
  for (const list of oliveT) for (const t of list) B.collider(t.x - 0.6, t.x + 0.6, t.y, t.y + 2.2, t.z - 0.6, t.z + 0.6, 'olive');

  // ---- cypress
  const cyp = [cypressGeometry(5, 9), cypressGeometry(6, 11)];
  const cypT = [[], []];
  const addCyp = (x, z, s = 1, y) => cypT[cypT[0].length <= cypT[1].length ? 0 : 1].push({ x, z, y: ground(x, z, y), r: rnd() * 6, s });
  addCyp(-24.6, -6.0, 0.95, -0.12);
  addCyp(-24.6, 3.4, 1.0, -0.12);
  for (let x = -40; x <= 70; x += 4.2) addCyp(x + (rnd() - 0.5), -21 - rnd() * 2, 0.85 + rnd() * 0.35);
  for (const [x, z] of [[-62, -6], [-64, -3], [74, 16], [77, 19]]) addCyp(x, z, 0.9 + rnd() * 0.3);
  cyp.forEach((g, v) => {
    if (!cypT[v].length) return;
    group.add(instanced(g.core, M.cypressSolid, cypT[v]));
    group.add(instanced(g.canopy, M.cypressLeaf, cypT[v], { depth: M.cypressLeafDepth }));
  });

  // ---- shrubs, lavender, grasses
  const shrubG = bushGeometry('shrub', 3);
  const lavG = bushGeometry('lavender', 4);
  const grassG = bushGeometry('grass', 5);
  const shrubs = [];
  const lav = [];
  const grass = [];
  // Planters in front of the bedroom wing.
  for (const [a, b, tall] of [[24.2, 28.3, false], [28.7, 34.8, true], [35.2, 41.8, true]]) {
    for (let x = a + 0.35; x < b - 0.3; x += 0.55) {
      lav.push({ x, z: 7.1 + (rnd() - 0.5) * 0.15, y: 0.55, r: rnd() * 6, s: 0.8 + rnd() * 0.3 });
      if (tall) grass.push({ x: x + 0.25, z: 7.7 + (rnd() - 0.5) * 0.2, y: 0.55, r: rnd() * 6, s: 0.75 + rnd() * 0.25 });
      else lav.push({ x: x + 0.25, z: 7.7 + (rnd() - 0.5) * 0.2, y: 0.55, r: rnd() * 6, s: 0.8 + rnd() * 0.3 });
    }
  }
  for (let x = 15.45; x < 23.6; x += 0.42) lav.push({ x, z: 8.5 + (rnd() - 0.5) * 0.1, y: 0.42, r: rnd() * 6, s: 0.62 + rnd() * 0.15 });
  // Approach beds between the stepping stones and the rill / wall.
  for (let x = -57; x < -31; x += 0.6) {
    lav.push({ x, z: -4.2 + (rnd() - 0.5) * 0.5, r: rnd() * 6, s: 0.9 + rnd() * 0.3, y: -0.12 });
    lav.push({ x: x + 0.3, z: -3.4 + (rnd() - 0.5) * 0.4, r: rnd() * 6, s: 0.8 + rnd() * 0.3, y: -0.12 });
    grass.push({ x, z: 4.7 + (rnd() - 0.5) * 0.6, r: rnd() * 6, s: 0.9 + rnd() * 0.4, y: -0.12 });
  }
  // North garden ground cover.
  for (let i = 0; i < 70; i++) {
    const x = 11.6 + rnd() * 30.4;
    const z = -11.6 + rnd() * 4.6;
    (i % 3 ? lav : shrubs).push({ x, z, y: -0.06, r: rnd() * 6, s: 0.6 + rnd() * 0.5 });
  }
  // Foundation planting around the villa and sun deck edges.
  for (let x = -16; x < 11; x += 1.4) shrubs.push({ x, z: -7.2 + (rnd() - 0.5) * 0.4, y: -0.12, r: rnd() * 6, s: 0.8 + rnd() * 0.5 });
  // Wild hillside scatter.
  const scatter = Math.round(900 * quality);
  for (let i = 0; i < scatter; i++) {
    const x = -140 + rnd() * 300;
    const z = 18 + rnd() * 90;
    const y = heightAt(x, z);
    if (y < SEA + 1) continue;
    (i % 2 ? shrubs : grass).push({ x, z, y, r: rnd() * 6, s: 0.8 + rnd() * 1.2 });
  }
  for (let i = 0; i < 400 * quality; i++) {
    const x = -160 + rnd() * 340;
    const z = -26 - rnd() * 70;
    shrubs.push({ x, z, y: heightAt(x, z), r: rnd() * 6, s: 0.8 + rnd() * 1.4 });
  }
  for (let i = 0; i < 220 * quality; i++) {
    const x = (rnd() > 0.5 ? -1 : 1) * (60 + rnd() * 90) + 5;
    const z = -20 + rnd() * 36;
    grass.push({ x, z, y: heightAt(x, z), r: rnd() * 6, s: 0.8 + rnd() * 0.5 });
  }
  group.add(instanced(shrubG, M.shrubLeaf, shrubs, { depth: M.shrubLeafDepth }));
  group.add(instanced(lavG, M.lavender, lav, { depth: M.lavenderDepth }));
  group.add(instanced(grassG, M.grass, grass, { depth: M.grassDepth, cast: false }));
  return group;
}

// ---------------------------------------------------------- terrace living
export function furnishOutdoors(B, M) {
  const F = makeFurniture(B, M);
  const lights = [];
  // Sun deck west of the pool.
  for (const x of [-24.2, -22.0, -19.8]) {
    B.place(F.sunLounger(), x, 12.4, 0, { name: 'lounger' });
    B.contact(x, 12.45, 1.0, 2.3, 0.45, { y: -0.025, rect: true });
  }
  B.place(F.parasol(), -17.6, 12.2, 0, { name: 'parasol' });
  B.place(F.sideTable({ mat: M.teak, size: 0.4, h: 0.4 }), -23.1, 13.8, 0, { name: 'side' });
  // Master suite terrace.
  for (const [x, r] of [[17.2, 0.25], [18.6, -0.15]]) B.place(F.loungeChair({ mat: M.cushionOut, frame: M.teak }), x, 7.2, r, { name: 'terrace-chair', y: 0.02 });
  B.place(F.sideTable({ mat: M.travSlabHoned, size: 0.4, h: 0.42 }), 17.9, 7.75, 0, { name: 'side', y: 0.02 });
  // Pool's east end.
  for (const x of [16.2, 18.2]) {
    B.place(F.sunLounger(), x, 12.6, 0, { name: 'lounger' });
    B.contact(x, 12.65, 1.0, 2.3, 0.45, { y: -0.025, rect: true });
  }
  B.place(F.parasol(), 20.2, 12.0, 0, { name: 'parasol' });
  // Outdoor lounge.
  B.place(F.rug({ w: 5.2, d: 4.0, mat: M.rug2 }), 28.2, 12.8, 0, { collide: false, y: -0.03 });
  B.place(F.outdoorSofa({ len: 3.0 }), 28.2, 11.5, 0, { name: 'outdoor-sofa', y: -0.03 });
  B.place(F.outdoorSofa({ len: 2.2 }), 25.9, 13.2, Math.PI / 2, { name: 'outdoor-sofa', y: -0.03 });
  B.place(F.outdoorSofa({ len: 2.2 }), 30.5, 13.2, -Math.PI / 2, { name: 'outdoor-sofa', y: -0.03 });
  B.place(F.drum({ r: 0.5, h: 0.32, mat: M.travSlabHoned }), 28.2, 13.2, 0, { name: 'table', y: -0.03 });
  B.contact(28.2, 12.6, 5.6, 4.0, 0.35, { y: -0.02 });
  B.place(F.bowl({ r: 0.2, mat: M.terracotta }), 28.2, 13.2, 0, { y: 0.29, collide: false });
  // Covered dining pergola: bronze posts, oak slat roof.
  const px = [36.8, 41.5, 46.2];
  const pz = [8.6, 14.6];
  for (const x of px) for (const z of pz) B.box(M.bronzeDark, x - 0.09, x + 0.09, -0.03, 2.95, z - 0.09, z + 0.09, { name: 'post' });
  for (const z of pz) B.box(M.bronzeDark, 36.6, 46.4, 2.85, 3.05, z - 0.08, z + 0.08, { collide: false });
  for (const x of px) B.box(M.bronzeDark, x - 0.08, x + 0.08, 2.85, 3.05, 8.5, 14.7, { collide: false });
  for (let x = 36.7; x < 46.3; x += 0.24) B.box(M.teak, x, x + 0.06, 3.05, 3.17, 8.4, 14.8, { collide: false, grain: 'z' });
  const table = new THREE.Group();
  B.rbox(M.teak, 3.2, 0.06, 1.15, 0.01, 0, 0.74, 0, table);
  for (const s of [-1, 1]) B.rbox(M.travSlabHoned, 0.6, 0.71, 0.34, 0.01, s * 1.0, 0.355, 0, table);
  B.place(table, 41.5, 12.6, 0, { name: 'outdoor-table', y: -0.03 });
  B.contact(41.5, 12.6, 4.2, 2.6, 0.4, { y: -0.02, rect: true });
  const chairs = [[40.4, 11.75, 0], [41.5, 11.75, 0], [42.6, 11.75, 0], [40.4, 13.45, Math.PI], [41.5, 13.45, Math.PI], [42.6, 13.45, Math.PI], [39.5, 12.6, Math.PI / 2], [43.5, 12.6, -Math.PI / 2]];
  for (const [x, z, r] of chairs) B.place(F.diningChair({ seat: M.cushionOut, frame: M.teak }), x, z, r, { name: 'outdoor-chair', y: -0.03 });
  const settings = new THREE.Group();
  for (const [x, z, r] of chairs) {
    F.plate(settings, x + Math.sin(r) * 0.42, 0.74, z + Math.cos(r) * 0.42);
    F.wineGlass(settings, x + Math.sin(r) * 0.42 + 0.18, 0.74, z + Math.cos(r) * 0.42 - 0.12);
  }
  settings.position.y = -0.03;
  B.root.add(settings);
  B.place(F.vase({ h: 0.34, r: 0.12, mat: M.terracotta }), 41.5, 12.6, 0, { y: 0.71, collide: false });
  // Lantern pendants under the pergola.
  for (const x of [40.3, 42.7]) F.pendant(B.root, x, 12.6, 2.85, 1.7, 'globe');
  lights.push({ pos: new THREE.Vector3(41.5, 2.2, 12.6), intensity: 3, color: new THREE.Color(0xffc890), room: 'outdoor', dusk: true });
  // Bollards along the approach and terrace (glow at golden hour).
  const bollards = [];
  for (let x = -56; x <= -32; x += 4) bollards.push([x, -3.1]);
  for (let x = -28; x <= 48; x += 6) if (x < -15 || x > 15) bollards.push([x, 15.5]);
  for (const [x, z] of bollards) {
    const g = new THREE.Group();
    B.rbox(M.bronzeDark, 0.14, 0.62, 0.14, 0.02, 0, 0.31, 0, g);
    B.rbox(M.ledExt, 0.1, 0.04, 0.02, 0.005, 0, 0.5, 0.07, g, { cast: false });
    B.place(g, x, z, 0, { collide: false, y: -0.03 });
  }
  return { lights };
}

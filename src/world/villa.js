import * as THREE from 'three';
import { H, EXT, INT, P } from './plan.js';

// Builds the villa's architectural shell: slabs, walls, glazing, roofs,
// skylights, doors, the cantilevered stair, terraces and the infinity pool.
// Returns handles to the animated elements (entrance doors, gallery slider)
// and the water materials.

export function buildVilla(B, M) {
  const anim = {};
  const S = 0.04; // stone cladding skin thickness

  M.travPave = M.travFloor.clone();
  M.travPave.roughness = 0.82;
  M.travPave.envMapIntensity = 1;
  M.travPave.userData = { ...M.travFloor.userData, interior: false };

  // Exterior wall = plaster core + stone skin on the outside face.
  // side: which direction is outside ('-x', '+x', '-z', '+z').
  const ext = (axis, side, a0, a1, c, y0, y1, openings = [], opts = {}) => {
    const inner = opts.inner || M.plaster;
    const outer = opts.outer || M.travClad;
    const sign = side[0] === '-' ? -1 : 1;
    // Core sits from c (inner face) outward by EXT - S, skin beyond that.
    const coreA = c;
    const coreB = c + sign * (EXT - S);
    const skinB = c + sign * EXT;
    const lo = (p, q) => [Math.min(p, q), Math.max(p, q)];
    const [k0, k1] = lo(coreA, coreB);
    const [s0, s1] = lo(coreB, skinB);
    if (axis === 'x') {
      B.wallX(inner, a0, a1, (k0 + k1) / 2, y0, y1, k1 - k0, openings, opts);
      B.wallX(outer, a0 - (opts.extendSkin || 0), a1 + (opts.extendSkin || 0), (s0 + s1) / 2, y0, y1, s1 - s0, openings, { ...opts, collide: false });
    } else {
      B.wallZ(inner, a0, a1, (k0 + k1) / 2, y0, y1, k1 - k0, openings, opts);
      B.wallZ(outer, a0 - (opts.extendSkin || 0), a1 + (opts.extendSkin || 0), (s0 + s1) / 2, y0, y1, s1 - s0, openings, { ...opts, collide: false });
    }
  };

  // ------------------------------------------------------------------ slabs
  B.box(M.concrete, -23.35, 48.35, -0.7, -0.02, -6.35, 6.35, { name: 'slab', collide: false });
  // Floor finishes per zone.
  const floor = (mat, x0, x1, z0, z1) => B.box(mat, x0, x1, -0.02, 0, z0, z1, { collide: false, cast: false });
  floor(M.travFloor, -23, -16, -5, 2); // hall
  floor(M.travFloor, -16, 11, -6, 6.1); // living + kitchen + dining
  floor(M.travFloor, 11, 42, -6, -4); // corridor
  floor(M.travFloor, 11, 15, -4, 6); // powder / linen
  floor(M.oakFloor, 15, 28.5, -4, 6.1); // master + dressing
  floor(M.spaStone, 28.5, 35, -4, 6.1); // spa
  floor(M.oakFloor, 35, 42, -4, 6.1); // guest
  floor(M.travFloor, 42, 48, -6, 6.1); // gallery

  // ------------------------------------------------------------ entrance hall
  const hallIn = M.travCladInt;
  // West facade: a full-height portal — pivot doors beneath a glazed
  // transom that reveals the double-height hall, framed by two stone fins.
  const portalTop = 6.6;
  ext('z', '-x', -5.35, 2.35, -23, 0, H.hall, [{ a: P.door.z0, b: P.door.z1, y0: 0, y1: portalTop }], { inner: hallIn, name: 'hall-west' });
  glassPane(B, M, 'z', P.door.z0, P.door.z1, -23.2, P.door.h + 0.08, portalTop);
  B.box(M.bronzeDark, -23.3, -23.1, P.door.h, P.door.h + 0.08, P.door.z0, P.door.z1, { collide: false });
  for (const z of [P.door.z0, P.door.z1]) B.box(M.bronze, -23.36, -23.0, 0, portalTop, z - 0.02, z + 0.02, { collide: false, cast: false });
  B.box(M.bronze, -23.36, -23.0, portalTop - 0.04, portalTop, P.door.z0, P.door.z1, { collide: false, cast: false });
  B.box(M.travClad, -24.75, -23.35, 0, H.hall, -3.6, -3.25, { name: 'fin' });
  B.box(M.travClad, -24.75, -23.35, 0, H.hall, 0.25, 0.6, { name: 'fin' });
  ext('x', '-z', -23.35, -15.85, -5, 0, H.hall, [], { inner: hallIn, name: 'hall-north' });
  ext('x', '+z', -23.35, -15.85, 2, 0, H.hall, [{ a: -21.6, b: -20.4, y0: 0.0, y1: 6.4 }], { inner: hallIn, name: 'hall-south' });
  // East side opens to the living room; above the living roof it becomes facade.
  B.wallZ(hallIn, -5, 2, -16, 0, H.public, 0.3, [{ a: P.hallOpening.z0, b: P.hallOpening.z1, y0: 0, y1: P.hallOpening.h }], { name: 'hall-east' });
  B.box(hallIn, -16.15, -15.85, H.public, H.hall, -5.35, 2.35, { collide: false });
  B.box(M.travClad, -15.85, -15.81, H.publicRoof, H.hall, -5.35, 2.35, { collide: false });
  // Roof with a skylight slot washing the north wall.
  const hr = [-23.35, -15.81, H.hall, H.hallRoof, -5.35, 2.35];
  B.box(M.fascia, hr[0], hr[1], hr[2], hr[3], -4.1, hr[5], { collide: false });
  B.box(M.fascia, hr[0], hr[1], hr[2], hr[3], hr[4], -4.85, { collide: false });
  B.box(M.fascia, hr[0], -22.85, hr[2], hr[3], -4.85, -4.1, { collide: false });
  B.box(M.fascia, -16.15, hr[1], hr[2], hr[3], -4.85, -4.1, { collide: false });
  skylight(B, M, -22.85, -16.15, -4.85, -4.1, H.hallRoof - 0.06);
  // Slot window glazing.
  glassZ(B, M, -21.6, -20.4, 2.18, 0, 6.4);
  // Cantilevered canopy blade carried on the fins, with a light slot.
  B.box(M.fascia, -27.6, -23.35, H.hall, H.hall + 0.28, -4.2, 1.2, { name: 'canopy' });
  B.box(M.ledExt, -27.4, -24.8, H.hall - 0.01, H.hall, -1.56, -1.44, { collide: false, cast: false });

  // Pivoting walnut entrance doors (two leaves, hinged at the outer edges).
  anim.doors = buildEntranceDoors(B, M);

  // ------------------------------------------------------------ public wing
  // North wall (living + kitchen/dining).
  ext('x', '-z', -16.35, 11.35, -6, 0, H.public, [], { name: 'public-north' });
  // West: short solid return north of the hall, glass corner south of it.
  ext('z', '-x', -6.35, -5, -16, 0, H.public, []);
  B.box(M.plaster, -16.15, -15.85, 0, H.public, 2, 2.35, {});
  glassX_Z(B, M, 'z', 2.35, 6.0, -16.12, 0, H.public);
  // South facade: continuous frameless glass with slim bronze mullions.
  glassFacade(B, M, -16.0, 11.0, 6.05, H.public, [-12.6, -9.2, -5.8, -2.4, 1.0, 4.4, 7.8]);
  // East partition to the private wing (with the corridor opening).
  B.wallZ(M.plaster, -6, 6, 11, 0, H.public, INT, [{ a: P.corridorDoorKD.z0, b: P.corridorDoorKD.z1, y0: 0, y1: H.corridor }], { name: 'kd-east' });
  B.box(M.travClad, 11.075, 11.35, H.private, H.publicRoof, -6.35, 7.0, { collide: false });
  // Roof slab with a generous southern overhang that shades the glass.
  B.box(M.fascia, -16.35, 11.35, H.public, H.publicRoof, -6.35, 8.6, { name: 'public-roof', collide: false });
  B.box(M.fascia, -16.35, -15.85, H.public, H.publicRoof, 2.35, 8.6, { collide: false });

  // Fireplace partition: monolithic travertine with a long firebox.
  const fp = P.partition;
  B.box(M.travSlabHoned, fp.x0, fp.x1, 0, H.public, fp.z0, -1.25, { name: 'fireplace' });
  B.box(M.travSlabHoned, fp.x0, fp.x1, 0, H.public, 1.25, fp.z1, { name: 'fireplace' });
  B.box(M.travSlabHoned, fp.x0, fp.x1, 0, 0.42, -1.25, 1.25, { name: 'fireplace' });
  B.box(M.travSlabHoned, fp.x0, fp.x1, 1.05, H.public, -1.25, 1.25, { name: 'fireplace' });
  B.box(M.firebox, fp.x0 + 0.12, fp.x1, 0.42, 1.05, -1.25, 1.25, { collide: false });
  // Projecting stone hearth bench.
  B.box(M.travSlabHoned, fp.x0 - 0.45, fp.x0, 0, 0.32, -2.6, 2.4, { name: 'hearth' });

  // ------------------------------------------------------------ private wing
  // Corridor north facade: full-height glass to the walled olive garden.
  glassFacade(B, M, 11.0, 42.0, -6.05, H.corridor, [14.1, 17.2, 20.3, 23.4, 26.5, 29.6, 32.7, 35.8, 38.9], true);
  B.box(M.travClad, 11.0, 42.0, H.corridor, H.privateRoof, -6.35, -6.0, { collide: false });
  B.box(M.ceiling, 11.0, 42.0, H.corridor, H.private, -6.0, -4.0, { collide: false, cast: false });
  // Corridor / rooms partition with doors.
  const doorOps = [P.powderDoor, P.masterDoor, P.spaDoor, P.guestDoor].map(([a, b]) => ({ a, b, y0: 0, y1: H.door }));
  B.wallX(M.plaster, 11.0, 42.0, -4, 0, H.private, INT, doorOps, { name: 'corridor-south' });
  // Room partitions.
  B.wallZ(M.plaster, -4, 6, 15, 0, H.private, INT, [], { name: 'master-west' });
  B.wallZ(M.plaster, -4, 6, 24, 0, H.private, INT, [{ a: P.masterToDressing[0], b: P.masterToDressing[1], y0: 0, y1: H.door }], { name: 'master-east' });
  B.wallZ(M.plaster, -4, 6, 28.5, 0, H.private, INT, [{ a: P.dressingToSpa[0], b: P.dressingToSpa[1], y0: 0, y1: H.door }], { name: 'dressing-east' });
  B.wallZ(M.spaStone, -4, 6, 35, 0, H.private, INT, [], { name: 'spa-east' });
  // Gallery west wall: full height, with the corridor opening below and the
  // roof-terrace door at bridge level.
  B.wallZ(M.plaster, -6, 6, 42, 0, H.private, INT, [{ a: -5.85, b: -4.15, y0: 0, y1: H.corridor }], { name: 'gallery-west' });
  B.box(M.plaster, 41.925, 42.075, H.private, H.gallery, -6.0, 6.0, { collide: false });
  B.box(M.travClad, 41.65, 41.925, H.privateRoof, H.gallery, -6.35, 6.35, { collide: false });
  // Small powder-room block between public and private wings.
  ext('x', '+z', 11.0, 15.0, 6, 0, H.private, [], { name: 'powder-south' });
  // South facade.
  glassFacade(B, M, 15.0, 24.0, 6.05, H.private, [18.0, 21.0]);
  ext('x', '+z', 24.0, 28.5, 6, 0, H.private, [{ a: 25.9, b: 26.6, y0: 0.25, y1: 2.95 }], { name: 'dressing-south' });
  glassZ(B, M, 25.9, 26.6, 6.2, 0.25, 2.95, 'x');
  glassFacade(B, M, 28.5, 35.0, 6.05, H.private, [31.75]);
  glassFacade(B, M, 35.0, 42.0, 6.05, H.private, [38.5]);
  // Fascia above glazing + roof slab with overhang.
  B.box(M.fascia, 11.0, 42.0, H.private, H.privateRoof, -6.35, 7.6, { collide: false });
  B.box(M.ceiling, 11.0, 15.0, H.private - 0.02, H.private, -4.0, 6.0, { collide: false, cast: false });

  // ------------------------------------------------------------ stair gallery
  ext('x', '-z', 42.0, 48.35, -6, 0, H.gallery, [], { inner: M.travCladInt, name: 'gallery-north' });
  ext('z', '+x', -6.35, 6.35, 48, 0, H.gallery, [], { inner: M.travCladInt, name: 'gallery-east' });
  // Full-height glazing with a large sliding panel onto the terrace.
  B.box(M.bronzeDark, 42.0, 48.0, 3.38, 3.46, 6.0, 6.12, { collide: false });
  glassPane(B, M, 'x', 42.05, 47.95, 6.06, 3.46, H.gallery);
  glassPane(B, M, 'x', 45.0, 47.95, 6.06, 0, 3.38);
  frame(B, M, 'x', 45.0, 6.06, 0, 3.38);
  frame(B, M, 'x', 47.95, 6.06, 0, H.gallery);
  B.box(M.bronzeDark, 42.0, 48.0, 0, 0.04, 6.0, 6.18, { collide: false, cast: false });
  anim.slider = buildSlider(B, M);
  // Roof with the stair light well.
  const gr = [41.65, 48.35, H.gallery, H.galleryRoof];
  B.box(M.fascia, gr[0], 46.2, gr[2], gr[3], -6.35, 6.35, { collide: false });
  B.box(M.fascia, 46.2, gr[1], gr[2], gr[3], -6.35, -5.9, { collide: false });
  B.box(M.fascia, 46.2, gr[1], gr[2], gr[3], 5.9, 6.35, { collide: false });
  B.box(M.fascia, 47.9, gr[1], gr[2], gr[3], -5.9, 5.9, { collide: false });
  skylight(B, M, 46.2, 47.9, -5.9, 5.9, H.galleryRoof - 0.06);
  buildStair(B, M);
  // Bridge to the roof terrace door.
  B.box(M.oak, 42.075, 46.7, H.privateRoof - 0.22, H.privateRoof, -5.85, -4.65, { name: 'bridge' });
  glassPane(B, M, 'x', 42.1, 46.7, -4.62, H.privateRoof, H.privateRoof + 1.05);
  B.box(M.bronze, 42.1, 46.7, H.privateRoof + 1.03, H.privateRoof + 1.07, -4.66, -4.58, { collide: false });
  glassPane(B, M, 'z', -5.85, -4.65, 41.88, H.privateRoof, 6.2);
  // Ceiling wash at the top of the light well.
  B.box(M.ceiling, 42.0, 46.2, H.gallery - 0.02, H.gallery, -6, 6, { collide: false, cast: false });

  // ------------------------------------------------------------ roof terrace
  // Over the guest suite: travertine deck, glass balustrade, planters.
  B.box(M.travPave, 35.0, 41.65, H.privateRoof, H.privateRoof + 0.06, -6.0, 7.4, { collide: false });
  glassPane(B, M, 'x', 35.0, 41.65, 7.45, H.privateRoof + 0.06, H.privateRoof + 1.1);
  glassPane(B, M, 'z', -6.0, 7.45, 35.0, H.privateRoof + 0.06, H.privateRoof + 1.1);
  B.box(M.render, 35.2, 41.4, H.privateRoof, H.privateRoof + 0.5, -5.9, -5.2, { collide: false });

  // Window light: soft area sources standing in for daylight through each
  // glazed opening, so rooms fall off naturally away from the glass.
  // [cx, cy, cz, width, height, look-at x, y, z, strength]
  anim.windows = [
    [-9, 2.1, 5.9, 13.6, 4.0, -9, 1.6, 0, 1.0],
    [4.5, 2.1, 5.9, 12.8, 4.0, 4.5, 1.6, 0, 1.0],
    [-15.9, 2.1, 4.1, 3.6, 4.0, -10, 1.6, 4.1, 0.8],
    [-21.0, 3.2, 1.9, 1.2, 6.2, -21.0, 2.0, -3, 0.9],
    [-19.5, 6.9, -4.45, 6.6, 0.75, -19.5, 0, -4.2, 1.2],
    [-23.1, 5.1, -1.5, 2.6, 2.9, -18, 3.0, -1.5, 0.8],
    [18.5, 1.5, -5.9, 15, 2.9, 18.5, 1.4, -3, 0.7],
    [33.5, 1.5, -5.9, 15, 2.9, 33.5, 1.4, -3, 0.7],
    [19.5, 1.6, 5.9, 8.8, 3.1, 19.5, 1.4, 0, 1.0],
    [26.25, 1.6, 5.9, 0.7, 2.7, 26.25, 1.4, 0, 0.8],
    [31.75, 1.6, 5.9, 6.4, 3.1, 31.75, 1.4, 0, 1.0],
    [38.5, 1.6, 5.9, 6.8, 3.1, 38.5, 1.4, 0, 1.0],
    [45.0, 3.7, 5.9, 5.8, 7.2, 45.0, 3.0, 0, 1.0],
    [47.05, 7.3, 0, 1.6, 11.6, 47.05, 0, 0, 1.3],
  ];

  // --------------------------------------------------------------- terraces
  buildTerraces(B, M);
  anim.pool = buildPool(B, M);
  return anim;
}

// ------------------------------------------------------------------ helpers

function skylight(B, M, x0, x1, z0, z1, y) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
  g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, M.glass);
  m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  B.root.add(m);
  // Bronze curb.
  B.box(M.bronzeDark, x0, x1, y - 0.02, y, z0 - 0.02, z0, { collide: false, cast: false });
  B.box(M.bronzeDark, x0, x1, y - 0.02, y, z1, z1 + 0.02, { collide: false, cast: false });
}

function glassPane(B, M, axis, a0, a1, c, y0, y1) {
  const w = a1 - a0;
  const g = new THREE.PlaneGeometry(w, y1 - y0);
  const m = new THREE.Mesh(g, M.glass);
  if (axis === 'x') {
    m.position.set((a0 + a1) / 2, (y0 + y1) / 2, c);
  } else {
    m.rotation.y = Math.PI / 2;
    m.position.set(c, (y0 + y1) / 2, (a0 + a1) / 2);
  }
  m.renderOrder = 2;
  B.root.add(m);
  // Glass is a collider for the camera path (we must not pass through it).
  if (axis === 'x') B.collider(a0, a1, y0, y1, c - 0.02, c + 0.02, 'glass');
  else B.collider(c - 0.02, c + 0.02, y0, y1, a0, a1, 'glass');
  return m;
}

function frame(B, M, axis, at, c, y0, y1) {
  if (axis === 'x') B.box(M.bronzeDark, at - 0.03, at + 0.03, y0, y1, c - 0.06, c + 0.06, { collide: false });
  else B.box(M.bronzeDark, c - 0.06, c + 0.06, y0, y1, at - 0.03, at + 0.03, { collide: false });
}

// Glazing set into an opening of a wall that runs along X (pane faces z).
function glassZ(B, M, x0, x1, z, y0, y1) {
  glassPane(B, M, 'x', x0, x1, z, y0, y1);
}

function glassX_Z(B, M, axis, a0, a1, c, y0, y1) {
  glassPane(B, M, axis, a0, a1, c, y0, y1);
  B.box(M.bronzeDark, c - 0.05, c + 0.05, y0, y0 + 0.04, a0, a1, { collide: false, cast: false });
}

function glassFacade(B, M, x0, x1, z, h, mullions, north = false) {
  glassPane(B, M, 'x', x0, x1, z, 0.04, h);
  B.box(M.bronzeDark, x0, x1, 0, 0.04, z - 0.07, z + 0.07, { collide: false, cast: false });
  B.box(M.bronzeDark, x0, x1, h - 0.05, h, z - 0.07, z + 0.07, { collide: false });
  for (const mx of mullions) frame(B, M, 'x', mx, z, 0.04, h - 0.05);
  if (north) return;
}

function buildEntranceDoors(B, M) {
  const leaves = [];
  const { z0, z1, h } = P.door;
  const w = (z1 - z0) / 2;
  const x = -23.2;
  const make = (hingeZ, dir) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0, hingeZ);
    pivot.userData.dynamic = true;
    const leaf = new THREE.Group();
    pivot.add(leaf);
    // Walnut slab with vertical grain and a deep bronze reveal.
    const zc = dir * (w / 2);
    B.rbox(M.walnutV, 0.09, h - 0.02, w - 0.02, 0.006, 0, h / 2, zc, leaf, { grain: 'z', tile: 1.6 });
    // Inlaid bronze line and long pull handle (both faces).
    for (const s of [-1, 1]) {
      B.rbox(M.bronze, 0.004, h - 0.4, 0.012, 0.001, s * 0.046, h / 2, dir * 0.08, leaf, { cast: false });
      const hz = dir * (w - 0.16);
      B.rbox(M.bronze, 0.03, 1.9, 0.03, 0.012, s * 0.1, 1.45, hz, leaf);
      B.rbox(M.bronze, 0.06, 0.03, 0.03, 0.01, s * 0.065, 0.58, hz, leaf);
      B.rbox(M.bronze, 0.06, 0.03, 0.03, 0.01, s * 0.065, 2.32, hz, leaf);
    }
    B.root.add(pivot);
    leaves.push({ pivot, dir });
  };
  make(z0, 1); // north leaf: extends toward +z when closed
  make(z1, -1); // south leaf
  // Threshold + frame reveal.
  B.box(M.bronzeDark, -23.35, -23.0, 0, 0.02, z0, z1, { collide: false, cast: false });
  return {
    leaves,
    set(open) {
      // open: 0 closed → 1 open (≈ 84°). Leaves swing into the hall (+x).
      const a = open * THREE.MathUtils.degToRad(84);
      leaves[0].pivot.rotation.y = a;
      leaves[1].pivot.rotation.y = -a;
    },
  };
}

function buildSlider(B, M) {
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const { x0, x1 } = P.gallerySlider;
  const w = x1 - x0;
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.34), M.glass);
  pane.position.set(w / 2, 1.71, 0);
  pane.renderOrder = 2;
  g.add(pane);
  B.rbox(M.bronzeDark, 0.05, 3.38, 0.06, 0.005, 0.025, 1.69, 0, g);
  B.rbox(M.bronzeDark, 0.05, 3.38, 0.06, 0.005, w - 0.025, 1.69, 0, g);
  B.rbox(M.bronze, 0.025, 1.2, 0.03, 0.01, w - 0.12, 1.1, -0.05, g);
  g.position.set(x0, 0, 5.96);
  B.root.add(g);
  return {
    group: g,
    set(open) {
      g.position.x = x0 + open * (w - 0.1);
    },
  };
}

function buildStair(B, M) {
  // 21 risers to the bridge level; treads cantilever from the east wall.
  const risers = 21;
  const rise = H.privateRoof / risers;
  const going = 0.3;
  const zTop = -2.0;
  const x0 = 46.7;
  const x1 = 48.0; // treads are built into the stone wall
  for (let k = 1; k < risers; k++) {
    const y = k * rise;
    const za = zTop + (risers - k - 1) * going;
    const zb = za + going + 0.02;
    B.box(M.oak, x0, x1, y - 0.12, y, za, zb, { name: 'stair', grain: 'x', tile: 1.2 });
    // Recessed step light in the wall above each tread.
    B.box(M.ledSoft, x1 - 0.012, x1, y + 0.06, y + 0.08, za + 0.06, zb - 0.06, { collide: false, cast: false });
  }
  // Top landing along the east wall, joining the bridge.
  B.box(M.oak, x0, x1, H.privateRoof - 0.22, H.privateRoof, -5.85, zTop, { name: 'landing' });
  // Bronze handrail on stand-offs from the stone wall.
  const rail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(47.9, 1.0, 4.3),
    new THREE.Vector3(47.9, H.privateRoof + 0.95, zTop - 0.2),
  ]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(rail, 8, 0.022, 10), M.bronze);
  tube.castShadow = true;
  B.root.add(tube);
  // Frameless glass balustrade on the open side of the landing.
  const g = new THREE.Mesh(new THREE.PlaneGeometry(zTop + 4.62, 1.0), M.glass);
  g.rotation.y = Math.PI / 2;
  g.position.set(x0 - 0.03, H.privateRoof + 0.5, (-4.62 + zTop) / 2);
  g.renderOrder = 2;
  B.root.add(g);
}

function buildTerraces(B, M) {
  const y0 = -0.4;
  const top = -0.03;
  const pave = (x0, x1, z0, z1) => B.box(M.travPave, x0, x1, y0, top, z0, z1, { collide: false, cast: false });
  // South terrace along the whole facade.
  pave(-30, 50.5, 6.1, 9.4);
  // Sun deck west of the pool and lounge terrace east of it.
  pave(-30, -14.0, 9.4, 15.9);
  pave(14.0, 50.5, 9.4, 15.9);
  // Entry forecourt and the stepping-stone approach.
  pave(-31, -23.35, -4.6, 1.8);
  for (let x = -31.5, i = 0; x > -58; x -= 1.45, i++) {
    B.box(M.travPave, x - 1.25, x, y0, top, -2.6, -0.4, { collide: false, cast: false });
  }
  // Terrace edge: stone retaining wall dropping to the hillside.
  B.box(M.stoneWall, -75, 85, -4.2, -0.03, 15.9, 16.4, { name: 'retaining', collide: false });
  B.box(M.travSlabHoned, -30, -14.0, -0.03, 0.02, 15.85, 16.45, { collide: false });
  B.box(M.travSlabHoned, 14.0, 50.5, -0.03, 0.02, 15.85, 16.45, { collide: false });
  // Low glass balustrade where the terrace isn't the pool edge.
  for (const [a, b] of [[-30, -14.2], [14.2, 50.5]]) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 1.0), M.glass);
    g.position.set((a + b) / 2, 0.52, 16.2);
    g.renderOrder = 2;
    B.root.add(g);
    B.box(M.bronzeDark, a, b, 0.0, 0.04, 16.14, 16.26, { collide: false, cast: false });
  }
  // Raised planters giving the bedroom wing privacy from the terrace.
  for (const [a, b] of [[24.2, 28.3], [28.7, 34.8], [35.2, 41.8]]) {
    B.box(M.render, a, b, -0.03, 0.55, 6.7, 8.1, { name: 'planter', collide: false });
    B.box(M.gravel, a + 0.08, b - 0.08, 0.5, 0.56, 6.78, 8.02, { collide: false, cast: false });
  }
  // The master suite's private terrace: teak deck behind a low lavender bed.
  B.box(M.teak, 15.2, 23.8, -0.03, 0.02, 6.15, 8.25, { collide: false, cast: false, grain: 'z' });
  for (let x = 15.25; x < 23.8; x += 0.16) B.box(M.charcoal, x, x + 0.008, 0.019, 0.021, 6.15, 8.25, { collide: false, cast: false });
  B.box(M.render, 15.2, 23.8, -0.03, 0.42, 8.25, 8.75, { name: 'planter-low', collide: false });
  B.box(M.gravel, 15.28, 23.72, 0.38, 0.43, 8.33, 8.67, { collide: false, cast: false });
  // North walled garden beside the corridor.
  B.box(M.gravel, 11, 42.4, -0.4, -0.06, -12.0, -6.35, { collide: false, cast: false });
  B.box(M.stoneWall, 10.6, 42.4, -0.4, 2.3, -12.4, -12.0, { name: 'garden-wall', collide: false });
  B.box(M.stoneWall, 10.6, 11.0, -0.4, 2.3, -12.0, -6.35, { collide: false });
  B.box(M.stoneWall, 42.4, 42.8, -0.4, 2.3, -12.4, -6.35, { collide: false });
  // Approach: long low stone wall on the north side, water rill on the south.
  B.box(M.stoneWall, -58, -27, -0.4, 0.95, -5.6, -5.1, { collide: false });
  B.box(M.travSlabHoned, -58.05, -26.95, 0.95, 1.0, -5.65, -5.05, { collide: false });
  B.box(M.travSlabHoned, -56, -27.5, -0.4, -0.02, 1.6, 2.0, { collide: false, cast: false });
  B.box(M.travSlabHoned, -56, -27.5, -0.4, -0.02, 3.6, 4.0, { collide: false, cast: false });
  B.box(M.travSlabHoned, -56.4, -56, -0.4, -0.02, 1.6, 4.0, { collide: false, cast: false });
  B.box(M.travSlabHoned, -27.5, -27.1, -0.4, -0.02, 1.6, 4.0, { collide: false, cast: false });
  B.box(M.stoneDark, -56, -27.5, -0.7, -0.42, 2.0, 3.6, { collide: false, cast: false });
}

function buildPool(B, M) {
  const { x0, x1, z0, z1, water } = P.pool;
  const depth = -1.6;
  const tiles = M.poolTiles;
  tiles.envMapIntensity = 0.6;
  // Basin.
  B.box(tiles, x0, x1, depth - 0.2, depth, z0, z1, { collide: false, cast: false });
  B.box(tiles, x0 - 0.3, x0, depth - 0.2, -0.03, z0 - 0.3, z1, { collide: false });
  B.box(tiles, x1, x1 + 0.3, depth - 0.2, -0.03, z0 - 0.3, z1, { collide: false });
  B.box(tiles, x0, x1, depth - 0.2, -0.03, z0 - 0.3, z0, { collide: false });
  // Infinity edge: wall top sits at the water line so the surface spills.
  B.box(M.stoneDark, x0 - 0.3, x1 + 0.3, depth - 0.2, water - 0.005, z1, z1 + 0.15, { collide: false });
  // Catch basin beyond the edge.
  B.box(M.stoneDark, x0 - 0.3, x1 + 0.3, -1.1, -0.62, z1 + 0.15, 15.85, { collide: false, cast: false });
  // Entry steps at the west end.
  for (let i = 0; i < 3; i++) {
    B.box(tiles, x0, x0 + 1.6 - i * 0.45, depth, -0.35 - i * 0.38, z0, z1, { collide: false, cast: false });
  }
  // Coping.
  B.box(M.travSlabHoned, x0 - 0.45, x1 + 0.45, -0.1, -0.02, z0 - 0.45, z0, { collide: false, cast: false });
  B.box(M.travSlabHoned, x0 - 0.45, x0, -0.1, -0.02, z0, z1 + 0.15, { collide: false, cast: false });
  B.box(M.travSlabHoned, x1, x1 + 0.45, -0.1, -0.02, z0, z1 + 0.15, { collide: false, cast: false });
  // Underwater lights.
  const lights = [];
  for (let x = x0 + 2.5; x < x1 - 1; x += 4.5) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), M.ledExt);
    disc.position.set(x, -0.55, z0 + 0.005);
    B.root.add(disc);
    lights.push(disc);
  }

  // Water surfaces: physical material with animated normal map, reflecting
  // the sky environment and the sun.
  const n = M.waterNormals;
  const water1 = n.clone();
  water1.needsUpdate = true;
  water1.repeat.set(5, 1);
  const water2 = n.clone();
  water2.needsUpdate = true;
  water2.repeat.set(9, 2);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x6fb3b1, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.62,
    normalMap: water1, normalScale: new THREE.Vector2(0.18, 0.18), envMapIntensity: 1.1,
    clearcoat: 1, clearcoatRoughness: 0.03, clearcoatNormalMap: water2, clearcoatNormalScale: new THREE.Vector2(0.12, 0.12),
    depthWrite: false,
  });
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0 + 0.15), mat);
  surf.rotation.x = -Math.PI / 2;
  surf.position.set((x0 + x1) / 2, water, (z0 + z1 + 0.15) / 2);
  surf.receiveShadow = true;
  surf.renderOrder = 3;
  surf.userData.dynamic = true;
  B.root.add(surf);
  const catchSurf = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 0.6, 15.85 - z1 - 0.15), mat);
  catchSurf.rotation.x = -Math.PI / 2;
  catchSurf.position.set((x0 + x1) / 2, -0.66, (z1 + 0.15 + 15.85) / 2);
  catchSurf.userData.dynamic = true;
  B.root.add(catchSurf);
  // Thin sheet of spilling water over the infinity edge.
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 0.6, 0.6), new THREE.MeshPhysicalMaterial({ color: 0x9cc8c4, roughness: 0.05, transparent: true, opacity: 0.45, depthWrite: false }));
  spill.position.set((x0 + x1) / 2, -0.37, z1 + 0.16);
  B.root.add(spill);
  // Approach rill water.
  const rill = new THREE.Mesh(new THREE.PlaneGeometry(28.5, 1.6), mat);
  rill.rotation.x = -Math.PI / 2;
  rill.position.set(-41.75, -0.1, 2.8);
  rill.userData.dynamic = true;
  B.root.add(rill);
  return { mat, normals: [water1, water2], lights };
}

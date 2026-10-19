import * as THREE from 'three';
import { makeFurniture } from './furniture.js';
import { H, P } from './plan.js';

// Furnishes every room. Returns the interior fill-light rig (positions the
// renderer's light pool draws from) and animated elements (fire).

export function furnish(B, M) {
  const F = makeFurniture(B, M);
  const root = B.root;
  const lights = [];
  const anim = {};
  const L = (x, y, z, intensity, color = 0xffd2a0, room = null) => lights.push({ pos: new THREE.Vector3(x, y, z), intensity, color: new THREE.Color(color), room });
  const place = (g, x, z, r = 0, o = {}) => B.place(g, x, z, r, o);
  const onWall = (g, x, y, z, rotY) => {
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    root.add(g);
    return g;
  };
  const cove = (x0, x1, z0, z1, y) => {
    // Perimeter shadow-gap cove light just below the ceiling.
    const t = 0.03;
    B.box(M.ledSoft, x0, x1, y - 0.02, y, z0, z0 + t, { collide: false, cast: false });
    B.box(M.ledSoft, x0, x1, y - 0.02, y, z1 - t, z1, { collide: false, cast: false });
    B.box(M.ledSoft, x0, x0 + t, y - 0.02, y, z0, z1, { collide: false, cast: false });
    B.box(M.ledSoft, x1 - t, x1, y - 0.02, y, z0, z1, { collide: false, cast: false });
  };

  // =============================================================== HALL
  {
    // Console: travertine slab on two monolithic legs, beneath a large canvas.
    const c = new THREE.Group();
    B.rbox(M.travSlab, 2.8, 0.07, 0.46, 0.008, 0, 0.835, 0, c);
    B.rbox(M.travSlabHoned, 0.32, 0.8, 0.4, 0.006, -0.95, 0.4, 0, c);
    B.rbox(M.travSlabHoned, 0.32, 0.8, 0.4, 0.006, 0.95, 0.4, 0, c);
    place(c, -19.5, -4.74, 0, { name: 'console' });
    B.contact(-19.5, -4.7, 3.2, 0.9, 0.45, { rect: true });
    place(F.vase({ h: 0.5, r: 0.15 }), -20.4, -4.74, 0, { y: 0.87, collide: false });
    place(F.bowl({ r: 0.22 }), -19.2, -4.72, 0, { y: 0.87, collide: false });
    place(F.books({ n: 3 }), -18.55, -4.72, 0.3, { y: 0.87, collide: false });
    onWall(F.art({ w: 2.4, h: 1.7, mat: M.art.gesture }), -19.5, 2.55, -4.99, 0);
    // Cascade pendant: hand-blown globes at staggered heights.
    for (let i = 0; i < 13; i++) {
      const a = i * 2.39996;
      const r = 0.25 + (i % 5) * 0.2;
      F.pendant(root, -19.6 + Math.cos(a) * r, -1.4 + Math.sin(a) * r, H.hall, 3.7 + ((i * 7) % 11) / 11 * 2.2, 'globe');
    }
    L(-19.6, 4.2, -1.4, 9, 0xffd7a6, 'hall');
    L(-19.5, 2.2, -3.6, 3, 0xffe2c0, 'hall');
    // Stone ring sculpture before the slot window.
    place(F.sculptureRing(), -20.95, 1.15, 0.3, { name: 'sculpture' });
    B.contact(-20.95, 1.15, 0.9, 0.9, 0.5, { rect: true });
    // Oak bench against the west wall.
    place(F.bench({ len: 1.4, seat: M.boucle }), -22.72, 1.05, Math.PI / 2, { name: 'bench' });
    // Indoor olive in a stone planter.
    place(F.plant({ h: 3.4, potR: 0.45 }), -17.1, -4.1, 0, { name: 'plant' });
    B.contact(-17.1, -4.1, 1.4, 1.4, 0.5);
    // Round wool rug.
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.014, 64), M.rug2);
    rug.position.set(-19.6, 0.007, -1.4);
    rug.receiveShadow = true;
    root.add(rug);
  }

  // ============================================================= LIVING
  {
    place(F.rug({ w: 7.5, d: 5.8 }), -7.95, -0.6, 0, { collide: false });
    place(F.sofa({ len: 3.4 }), -8.3, -2.65, 0, { name: 'sofa-b' });
    B.contact(-8.3, -2.6, 3.8, 1.4, 0.6, { rect: true, y: 0.02 });
    place(F.sofa({ len: 3.0, cushions: 3 }), -10.75, 0.0, Math.PI / 2, { name: 'sofa-a' });
    B.contact(-10.7, 0, 1.4, 3.4, 0.6, { rect: true, y: 0.02 });
    place(F.drum({ r: 0.58, h: 0.34 }), -8.0, -0.45, 0, { name: 'coffee' });
    place(F.drum({ r: 0.38, h: 0.27, mat: M.walnut }), -7.05, 0.25, 0, { name: 'coffee2' });
    B.contact(-7.7, -0.2, 2.2, 1.9, 0.45, { y: 0.02 });
    place(F.books({ n: 3, w: 0.32, d: 0.24 }), -8.2, -0.5, 0.4, { y: 0.34, collide: false });
    place(F.bowl({ r: 0.18, h: 0.08, mat: M.ceramicDark }), -7.75, -0.25, 0, { y: 0.34, collide: false });
    place(F.vase({ h: 0.3, r: 0.1, branches: false, mat: M.terracotta }), -7.05, 0.25, 0, { y: 0.27, collide: false });
    place(F.tubChair(), -5.3, 1.0, -Math.PI / 2 - 0.35, { name: 'tub-chair' });
    B.contact(-5.3, 1.0, 1.3, 1.3, 0.5, { y: 0.02 });
    place(F.sideTable({ size: 0.46 }), -10.7, -2.6, 0, { name: 'side' });
    place(F.tableLamp(), -10.7, -2.6, 0, { y: 0.52, collide: false });
    L(-10.7, 1.2, -2.6, 1.6, 0xffc58a, 'living');
    // Credenza + canvas on the north wall.
    place(F.credenza({ len: 3.4, top: M.travSlab }), -13.2, -5.74, 0, { name: 'credenza' });
    B.contact(-13.2, -5.72, 3.8, 0.8, 0.45, { rect: true });
    onWall(F.art({ w: 2.6, h: 1.6, mat: M.art.fields }), -13.2, 2.25, -5.99, 0);
    place(F.vase({ h: 0.55, r: 0.15, mat: M.ceramicDark }), -14.4, -5.74, 0, { y: 0.74, collide: false });
    place(F.bowl({ r: 0.2 }), -12.3, -5.72, 0, { y: 0.74, collide: false });
    onWall(F.art({ w: 1.7, h: 2.2, mat: M.art.horizon }), -5.4, 2.0, -5.99, 0);
    // Reading corner by the west glass.
    place(F.loungeChair(), -14.6, 3.7, 2.6, { name: 'lounge-1' });
    place(F.loungeChair({ mat: M.linenOlive }), -13.1, 4.85, 2.9, { name: 'lounge-2' });
    place(F.sideTable({ mat: M.travSlab, size: 0.42, h: 0.45 }), -14.1, 4.9, 0, { name: 'side2' });
    B.contact(-13.9, 4.3, 2.4, 2.2, 0.4);
    place(F.floorLamp(), -15.4, 3.0, 0, { name: 'floor-lamp' });
    L(-15.2, 1.4, 3.0, 1.4, 0xffc58a, 'living');
    place(F.plant({ h: 2.6 }), -15.45, -5.45, 0, { name: 'plant' });
    B.contact(-15.45, -5.45, 1.1, 1.1, 0.5);
    // Hearth styling and the fire itself.
    place(F.books({ n: 4, w: 0.3, d: 0.22 }), -2.6, -2.1, 0.1, { y: 0.32, collide: false });
    place(F.sculptureBronze({ h: 0.5 }), -2.58, 1.85, 0.4, { y: 0.32, collide: false });
    for (let i = 0; i < 3; i++) {
      const log = B.cyl(M.log, 0.07, 0.08, 1.6, -2.0, 0.5 + (i === 2 ? 0.1 : 0), -0.1 + (i - 1) * 0.12, root, { seg: 10 });
      log.rotation.x = Math.PI / 2;
      log.rotation.z = 0.06 * i;
    }
    const fire = new THREE.Group();
    fire.userData.dynamic = true;
    const flames = [];
    for (let i = 0; i < 7; i++) {
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.4), M.fire);
      fl.position.set(-2.05, 0.68, -0.85 + i * 0.28);
      fl.rotation.y = -Math.PI / 2;
      fl.userData.phase = i * 1.7;
      fire.add(fl);
      flames.push(fl);
    }
    root.add(fire);
    anim.fire = flames;
    L(-2.9, 0.9, 0, 2.2, 0xff8a3c, 'living');
    // Oak slat raft ceiling with a perimeter cove.
    for (let x = -13.4; x <= -4.6; x += 0.18) B.box(M.oak, x, x + 0.05, H.public - 0.12, H.public - 0.02, -4.0, 3.0, { collide: false, cast: false, grain: 'z' });
    B.box(M.charcoal, -13.5, -4.5, H.public - 0.01, H.public, -4.05, 3.05, { collide: false, cast: false });
    B.box(M.ceiling, -16, -2, H.public - 0.005, H.public, -6, 6.05, { collide: false, cast: false });
    cove(-15.9, -2.45, -5.95, 5.9, H.public - 0.02);
    L(-9, 3.6, 0, 6, 0xffe0bc, 'living');
    L(-13.5, 3.2, -3.5, 3, 0xffe0bc, 'living');
  }

  // ============================================================ KITCHEN
  {
    const wallZ = -6;
    const d = 0.65;
    // Tall pantry / refrigeration.
    const tall = (x0, x1, ovens = false) => {
      const g = new THREE.Group();
      const w = x1 - x0;
      B.rbox(M.walnutV, w, 2.7, d, 0.006, 0, 1.35, 0, g, { grain: 'z' });
      const n = Math.max(1, Math.round(w / 0.6));
      for (let i = 1; i < n; i++) B.rbox(M.charcoal, 0.006, 2.6, 0.01, 0.001, -w / 2 + (w / n) * i, 1.35, d / 2, g, { cast: false });
      if (ovens) {
        B.rbox(M.blackGlass, w - 0.1, 0.58, 0.02, 0.01, 0, 1.2, d / 2 + 0.005, g, { cast: false });
        B.rbox(M.blackGlass, w - 0.1, 0.46, 0.02, 0.01, 0, 1.78, d / 2 + 0.005, g, { cast: false });
        B.rbox(M.bronze, w - 0.3, 0.02, 0.03, 0.008, 0, 1.47, d / 2 + 0.03, g);
      }
      place(g, (x0 + x1) / 2, wallZ + d / 2, 0, { name: 'tall-unit' });
    };
    tall(-1.2, 0.9);
    tall(3.9, 5.2, true);
    // Base run, marble top, full-height marble splash, floating shelf, hood.
    const base = new THREE.Group();
    B.rbox(M.walnutV, 3.0, 0.82, 0.62, 0.004, 0, 0.49, 0, base, { grain: 'z' });
    B.rbox(M.charcoal, 2.9, 0.08, 0.5, 0.004, 0, 0.04, -0.04, base);
    B.rbox(M.marble, 3.02, 0.04, 0.66, 0.004, 0, 0.92, 0.01, base, { tile: 2.2 });
    B.rbox(M.blackGlass, 0.8, 0.008, 0.5, 0.004, -0.2, 0.944, 0.02, base, { cast: false });
    place(base, 2.4, wallZ + 0.32, 0, { name: 'base-run' });
    B.box(M.marble, 0.9, 3.9, 0.94, 2.7, wallZ, wallZ + 0.02, { collide: false, tile: 2.2 });
    B.box(M.ceiling, 1.65, 2.75, 2.2, H.public, wallZ, wallZ + 0.55, { name: 'hood' });
    B.box(M.ledWarm, 1.7, 2.7, 2.19, 2.2, wallZ + 0.42, wallZ + 0.44, { collide: false, cast: false });
    B.box(M.walnut, 3.0, 3.85, 1.7, 1.74, wallZ + 0.02, wallZ + 0.3, { collide: false });
    place(F.bowl({ r: 0.12, h: 0.07, mat: M.ceramicMatte }), 3.2, wallZ + 0.15, 0, { y: 1.74, collide: false });
    place(F.vase({ h: 0.22, r: 0.07, branches: false, mat: M.terracotta }), 3.55, wallZ + 0.15, 0, { y: 1.74, collide: false });
    place(F.vase({ h: 0.3, r: 0.09, branches: false, mat: M.ceramicDark }), 3.5, wallZ + 0.25, 0, { y: 0.94, collide: false });
    // The island.
    place(F.island({ len: 4.6 }), 2.3, -2.3, 0, { name: 'island' });
    B.contact(2.3, -2.3, 5.2, 1.9, 0.6, { rect: true });
    const lemons = F.bowl({ r: 0.22, h: 0.1, mat: M.ceramicMatte });
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), M.lemon);
      s.scale.set(1, 0.85, 0.85);
      s.position.set(Math.cos(i * 2.4) * 0.09 * (i ? 1 : 0), 0.09 + (i === 0 ? 0.03 : 0), Math.sin(i * 2.4) * 0.09 * (i ? 1 : 0));
      s.castShadow = true;
      lemons.add(s);
    }
    place(lemons, 0.95, -2.15, 0, { y: 0.94, collide: false });
    const board = new THREE.Group();
    B.rbox(M.oak, 0.55, 0.025, 0.32, 0.01, 0, 0.0125, 0, board);
    B.lathe(M.drinkGlass, [[0, 0], [0.035, 0], [0.035, 0.18], [0.012, 0.24], [0.012, 0.28], [0, 0.28]], 0.18, 0.025, -0.06, board, { seg: 20 });
    place(board, 2.0, -2.0, 0.2, { y: 0.94, collide: false });
    for (let i = 0; i < 4; i++) {
      place(F.barStool(), 0.85 + i * 1.0, -1.15, Math.PI, { name: 'stool' });
      B.contact(0.85 + i * 1.0, -1.15, 0.7, 0.7, 0.45);
    }
    for (const x of [0.9, 2.3, 3.7]) F.pendant(root, x, -2.3, H.public, 1.98, 'alabaster');
    L(2.3, 2.4, -2.3, 5, 0xffd5a8, 'kitchen');
    L(2.4, 2.1, -5.2, 1.6, 0xffd5a8, 'kitchen');
    // Pantry and wine wall on the back of the fireplace partition.
    const pantry = new THREE.Group();
    B.rbox(M.walnutV, 0.6, 2.6, 4.3, 0.006, 0, 1.3, 0, pantry, { grain: 'z' });
    B.rbox(M.charcoal, 0.02, 1.4, 1.5, 0.004, 0.3, 1.5, 0.9, pantry, { cast: false });
    for (let r = 0; r < 5; r++) {
      for (let k = 0; k < 9; k++) {
        const b = B.cyl(M.greenery, 0.036, 0.036, 0.3, 0.2, 0.9 + r * 0.26, 0.25 + k * 0.15, pantry, { seg: 10, cast: false });
        b.rotation.z = Math.PI / 2;
      }
    }
    B.rbox(M.ledWarm, 0.02, 0.01, 1.5, 0.002, 0.25, 2.2, 0.9, pantry, { cast: false });
    place(pantry, -1.35, 0.25, 0, { name: 'pantry' });
    // Indoor olive tree framing the dining view.
    place(F.plant({ h: 3.2, potR: 0.5 }), 0.3, 4.5, 0, { name: 'plant' });
    B.contact(0.3, 4.5, 1.6, 1.6, 0.5);
    B.box(M.ceiling, -2, 11, H.public - 0.005, H.public, -6, 6.05, { collide: false, cast: false });
    cove(-1.6, 10.9, -5.95, 5.9, H.public - 0.02);
  }

  // ============================================================= DINING
  {
    place(F.rug({ w: 3.2, d: 4.6, mat: M.rug2 }), 8.4, 1.3, 0, { collide: false });
    place(F.diningTable({ len: 3.0 }), 8.4, 1.3, 0, { name: 'dining-table' });
    B.contact(8.4, 1.3, 1.9, 3.6, 0.5, { rect: true, y: 0.02 });
    const chairs = [
      [7.25, 0.3, Math.PI / 2], [7.25, 1.3, Math.PI / 2], [7.25, 2.3, Math.PI / 2],
      [9.55, 0.3, -Math.PI / 2], [9.55, 1.3, -Math.PI / 2], [9.55, 2.3, -Math.PI / 2],
      [8.4, -0.75, 0], [8.4, 3.35, Math.PI],
    ];
    const t = new THREE.Group();
    for (const [x, z, r] of chairs) {
      place(F.diningChair(), x, z, r, { name: 'chair' });
      B.contact(x, z, 0.75, 0.75, 0.4, { y: 0.02 });
      // Place setting in front of each chair.
      const dx = Math.sin(r) * 0.42;
      const dz = Math.cos(r) * 0.42;
      F.plate(t, x + dx, 0.75, z + dz);
      F.wineGlass(t, x + dx + Math.cos(r) * 0.2, 0.75, z + dz - Math.sin(r) * 0.2 + dz * 0.25);
    }
    B.rbox(M.linenOlive, 0.36, 0.006, 2.7, 0.002, 8.4, 0.753, 1.3, t, { cast: false });
    for (const z of [0.7, 1.9]) F.candle(t, 8.4, 0.756, z, 0.24);
    root.add(t);
    place(F.vase({ h: 0.32, r: 0.11, mat: M.ceramicMatte }), 8.4, 1.3, 0, { y: 0.756, collide: false });
    // Statement pendant: linear bronze spine with alabaster drums.
    B.box(M.bronze, 8.37, 8.43, 2.2, 2.24, -0.2, 2.8, { collide: false });
    for (const z of [-0.1, 2.7]) B.box(M.bronze, 8.395, 8.405, 2.24, H.public, z - 0.005, z + 0.005, { collide: false, cast: false });
    for (let i = 0; i < 7; i++) {
      const z = -0.05 + i * 0.45;
      B.cyl(M.alabaster, 0.12, 0.12, 0.3, 8.4, 2.04, z, root, { seg: 28, cast: false });
      B.cyl(M.bronze, 0.004, 0.004, 0.06, 8.4, 2.2, z, root, { seg: 6, cast: false });
    }
    L(8.4, 1.8, 1.3, 4.5, 0xffd2a0, 'dining');
    // Sideboard and canvas on the east wall.
    place(F.credenza({ len: 3.2, depth: 0.46, top: M.travSlab }), 10.68, 2.1, -Math.PI / 2, { name: 'sideboard' });
    B.contact(10.68, 2.1, 0.8, 3.6, 0.45, { rect: true });
    onWall(F.art({ w: 1.9, h: 1.3, mat: M.art.circles }), 10.92, 1.95, 2.1, -Math.PI / 2);
    place(F.vase({ h: 0.6, r: 0.16, mat: M.ceramicDark }), 10.7, 0.9, 0, { y: 0.74, collide: false });
    place(F.bowl({ r: 0.2, mat: M.terracotta }), 10.7, 3.2, 0, { y: 0.74, collide: false });
  }

  // =========================================================== CORRIDOR
  {
    const art = [[19.6, M.art.lines, 1.6, 1.1], [25.8, M.art.olive, 1.1, 1.5], [32.6, M.art.horizon, 1.4, 1.0], [39.4, M.art.fields, 1.3, 0.9]];
    for (const [x, mat, w, h] of art) onWall(F.art({ w, h, mat }), x, 1.7, -4.075, Math.PI);
    place(F.bench({ len: 2.2, d: 0.4, h: 0.42, seat: M.travSlabHoned, frame: M.walnut }), 22.4, -4.3, 0, { name: 'bench' });
    place(F.vase({ h: 0.38, r: 0.13, mat: M.ceramicDark, branches: false }), 23.1, -4.3, 0, { y: 0.42, collide: false });
    B.box(M.ledSoft, 11.2, 41.8, H.corridor - 0.012, H.corridor - 0.002, -5.06, -4.94, { collide: false, cast: false });
    for (const x of [14, 22, 30, 38]) L(x, 2.5, -5, 1.4, 0xffe0bc, 'corridor');
    // Door leaves (flush walnut, full height). Open ones swing into rooms.
    const leaf = (x0, x1, hingeAtStart, open) => {
      const w = x1 - x0;
      const g = new THREE.Group();
      B.rbox(M.walnutV, w - 0.02, H.door - 0.02, 0.05, 0.004, (hingeAtStart ? 1 : -1) * (w / 2), H.door / 2, 0, g, { grain: 'z' });
      B.rbox(M.bronze, 0.02, 0.6, 0.03, 0.008, (hingeAtStart ? 1 : -1) * (w - 0.12), 1.05, 0.04, g);
      B.rbox(M.bronze, 0.02, 0.6, 0.03, 0.008, (hingeAtStart ? 1 : -1) * (w - 0.12), 1.05, -0.04, g);
      g.position.set(hingeAtStart ? x0 : x1, 0, -4);
      g.rotation.y = open ? (hingeAtStart ? -Math.PI / 2 : Math.PI / 2) : 0;
      root.add(g);
      B.colliderFrom(g, 'door-leaf');
    };
    leaf(...P.powderDoor, true, false);
    leaf(...P.masterDoor, true, true);
    leaf(...P.spaDoor, false, true);
    leaf(...P.guestDoor, true, true);
  }

  // ============================================================= MASTER
  {
    B.box(M.walnutV, 16.7, 22.3, 0, 2.6, -3.925, -3.895, { collide: false, grain: 'z' });
    const hb = new THREE.Group();
    B.rbox(M.boucle, 3.8, 1.15, 0.12, 0.05, 0, 0.925, 0, hb, { seg: 4 });
    for (let i = 0; i < 5; i++) B.rbox(M.boucle, 0.03, 1.1, 0.02, 0.01, -1.52 + i * 0.76, 0.925, 0.06, hb, { cast: false });
    place(hb, 19.5, -3.835, 0, { name: 'headboard' });
    place(F.bed({ w: 2.0, l: 2.15 }), 19.5, -2.7, 0, { name: 'bed' });
    B.contact(19.5, -2.6, 2.6, 2.7, 0.55, { rect: true, y: 0.02 });
    place(F.rug({ w: 4.2, d: 3.4, mat: M.rug }), 19.5, -1.45, 0, { collide: false });
    for (const x of [17.85, 21.15]) {
      place(F.nightstand(), x, -3.68, 0, { name: 'nightstand' });
      F.pendant(root, x, -3.55, H.private, 1.05, 'globe');
      L(x, 1.1, -3.4, 0.9, 0xffc58a, 'master');
    }
    place(F.books({ n: 2 }), 17.75, -3.68, 0.2, { y: 0.66, collide: false });
    place(F.vase({ h: 0.24, r: 0.07, mat: M.ceramicMatte, branches: false }), 21.3, -3.7, 0, { y: 0.66, collide: false });
    place(F.bench({ len: 1.6, seat: M.linenSand }), 19.5, -1.12, 0, { name: 'bench' });
    // Lounge by the window, turned toward the sea.
    place(F.tubChair({ mat: M.boucle }), 16.4, 4.3, 0.55, { name: 'chair' });
    place(F.tubChair({ mat: M.velvetOlive }), 17.75, 4.95, 0.15, { name: 'chair' });
    place(F.sideTable({ mat: M.travSlab, size: 0.4, h: 0.45 }), 17.0, 5.4, 0, { name: 'side' });
    B.contact(17.0, 4.7, 2.4, 1.9, 0.4);
    place(F.floorLamp({ h: 1.55 }), 15.45, 5.4, 0, { name: 'floor-lamp' });
    onWall(F.art({ w: 1.5, h: 1.9, mat: M.art.olive }), 15.08, 1.65, 0.6, Math.PI / 2);
    place(F.credenza({ len: 2.2, depth: 0.45, h: 0.6, top: M.travSlab }), 15.32, 0.6, Math.PI / 2, { name: 'credenza' });
    place(F.plant({ h: 2.2, potR: 0.3 }), 23.3, 5.35, 0, { name: 'plant' });
    B.box(M.ceiling, 15, 24, H.private - 0.005, H.private, -4, 6.05, { collide: false, cast: false });
    cove(15.1, 23.9, -3.9, 5.9, H.private - 0.02);
    L(19.5, 2.6, 0.5, 3.5, 0xffd8b0, 'master');
  }

  // =========================================================== DRESSING
  {
    const x0 = 24.075;
    const x1 = 28.425;
    // West wall: two runs either side of the bedroom opening.
    const run = (side, z0, z1, kinds) => {
      const n = kinds.length;
      const w = (z1 - z0) / n;
      kinds.forEach((k, i) => {
        const g = F.wardrobe({ w: w - 0.01, kind: k });
        const z = z0 + w * (i + 0.5);
        if (side === 'w') place(g, x0 + 0.3, z, Math.PI / 2, { name: 'wardrobe' });
        else place(g, x1 - 0.3, z, -Math.PI / 2, { name: 'wardrobe' });
      });
    };
    run('w', -3.92, -0.05, ['hang', 'shelf', 'hang']);
    run('w', 1.85, 5.92, ['shelf', 'hang', 'hang']);
    run('e', -3.92, -1.1, ['hang', 'shelf']);
    run('e', 0.75, 5.92, ['hang', 'shelf', 'hang']);
    // Island: walnut with bronze-glass display top.
    const isl = new THREE.Group();
    B.rbox(M.walnut, 1.3, 0.82, 2.0, 0.01, 0, 0.41, 0, isl);
    B.rbox(M.leatherDark, 1.24, 0.02, 0.9, 0.004, 0, 0.83, -0.5, isl, { cast: false });
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), M.glassBronze);
    gl.rotation.x = -Math.PI / 2;
    gl.position.set(0, 0.84, 0.48);
    isl.add(gl);
    for (let i = 0; i < 5; i++) B.rbox(M.brass, 0.1, 0.02, 0.06, 0.008, -0.4 + i * 0.2, 0.74, 0.48, isl, { cast: false });
    place(isl, 26.25, 2.95, 0, { name: 'dressing-island' });
    B.contact(26.25, 2.95, 1.8, 2.5, 0.5, { rect: true });
    place(F.drum({ r: 0.32, h: 0.42, mat: M.leather }), 26.25, 4.95, 0, { name: 'pouf' });
    B.box(M.mirror, 24.6, 25.75, 0.08, 2.6, 5.97, 5.99, { collide: false, cast: false });
    B.box(M.oakFloor, 24.075, 28.425, 0, 0.0, -4, 6, { collide: false });
    B.box(M.ceiling, 24, 28.5, H.private - 0.005, H.private, -4, 6, { collide: false, cast: false });
    B.box(M.ledSoft, 24.8, 27.7, H.private - 0.02, H.private - 0.005, 0.9, 1.0, { collide: false, cast: false });
    L(26.25, 2.4, 0.5, 2.4, 0xffd6a8, 'dressing');
    L(26.25, 1.6, 3.6, 1.2, 0xffd6a8, 'dressing');
  }

  // ================================================================ SPA
  {
    // Stone lining on the north and west walls.
    B.box(M.spaStone, 28.575, 35, 0, H.private, -3.925, -3.9, { collide: false });
    B.box(M.spaStone, 28.575, 28.6, 0, H.private, -3.9, P.dressingToSpa[0], { collide: false });
    B.box(M.spaStone, 28.575, 28.6, 0, H.private, P.dressingToSpa[1], 6, { collide: false });
    B.box(M.spaStone, 28.575, 28.6, H.door, H.private, P.dressingToSpa[0], P.dressingToSpa[1], { collide: false });
    place(F.bath(), 31.9, 3.9, 0, { name: 'bath' });
    B.contact(31.9, 3.9, 2.3, 1.3, 0.55);
    const filler = new THREE.CatmullRomCurve3([
      new THREE.Vector3(30.75, 0, 3.9), new THREE.Vector3(30.75, 0.95, 3.9),
      new THREE.Vector3(30.82, 1.05, 3.9), new THREE.Vector3(30.95, 0.95, 3.9),
    ]);
    const fm = new THREE.Mesh(new THREE.TubeGeometry(filler, 24, 0.018, 12), M.bronze);
    fm.castShadow = true;
    root.add(fm);
    B.collider(30.7, 30.8, 0, 1.0, 3.85, 3.95, 'filler');
    // Floating vanity, vessel basins, wall taps and backlit mirrors.
    const v = new THREE.Group();
    B.rbox(M.walnut, 3.6, 0.42, 0.52, 0.006, 0, 0.62, 0, v);
    B.rbox(M.spaStone, 3.64, 0.04, 0.55, 0.004, 0, 0.85, 0.005, v, { tile: 2.6 });
    for (const x of [-0.9, 0.9]) {
      F.vesselBasin(v, x, 0.87, 0.02);
      B.rbox(M.bronze, 0.02, 0.02, 0.2, 0.006, x, 1.2, -0.16, v);
      const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.46, 64), M.mirror);
      mirror.position.set(x, 1.72, -0.245);
      v.add(mirror);
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.5, 64), M.ledWarm);
      halo.position.set(x, 1.72, -0.25);
      v.add(halo);
    }
    place(v, 32.4, -3.64, 0, { name: 'vanity' });
    B.contact(32.4, -3.55, 4, 0.9, 0.35, { rect: true });
    // Walk-in shower with frameless screen and rain head.
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.6), M.glassShower);
    sg.rotation.y = Math.PI / 2;
    sg.position.set(33.4, 1.3, 0.0);
    sg.renderOrder = 2;
    root.add(sg);
    B.collider(33.38, 33.42, 0, 2.6, -1.6, 1.6, 'shower-glass');
    B.box(M.bronze, 33.38, 33.42, 0, 0.03, -1.6, 1.6, { collide: false, cast: false });
    B.box(M.spaStone, 34.5, 34.925, 0, 0.45, -1.4, 0.4, { name: 'shower-bench' });
    B.cyl(M.bronze, 0.22, 0.22, 0.012, 34.15, H.private - 0.1, 0.3, root, { seg: 40 });
    B.cyl(M.bronze, 0.008, 0.008, 0.1, 34.15, H.private - 0.05, 0.3, root, { seg: 6 });
    B.box(M.ledWarm, 34.88, 34.9, 0.6, 2.6, -1.0, -0.96, { collide: false, cast: false });
    // Towel ladder, teak stool, branch arrangement.
    const lad = new THREE.Group();
    for (const s of [-1, 1]) B.rbox(M.bronze, 0.02, 1.8, 0.02, 0.006, s * 0.22, 0.9, 0, lad);
    for (let i = 0; i < 4; i++) B.rbox(M.bronze, 0.44, 0.016, 0.016, 0.006, 0, 0.4 + i * 0.4, 0, lad);
    B.rbox(M.towel, 0.4, 0.62, 0.03, 0.012, 0, 1.25, 0.02, lad, { cast: true });
    B.rbox(M.towelOlive, 0.36, 0.42, 0.03, 0.012, 0, 0.62, 0.03, lad, { cast: true });
    lad.rotation.x = -0.12;
    place(lad, 29.1, 5.6, Math.PI, { name: 'ladder' });
    place(F.drum({ r: 0.2, h: 0.45, mat: M.teak }), 30.2, 4.9, 0, { name: 'stool' });
    place(F.vase({ h: 0.7, r: 0.18, mat: M.ceramicMatte }), 34.4, 5.35, 0, { name: 'vase' });
    B.box(M.ceiling, 28.5, 35, H.private - 0.005, H.private, -4, 6, { collide: false, cast: false });
    cove(28.65, 34.9, -3.85, 5.9, H.private - 0.02);
    L(31.7, 2.5, 1.2, 2.6, 0xffdcb4, 'spa');
    L(32.4, 1.8, -3.1, 1.4, 0xffd0a0, 'spa');
  }

  // ============================================================== GUEST
  {
    // Spa stone wall is plastered on the guest side; oak slat feature wall.
    B.box(M.plaster, 35.075, 35.09, 0, H.private, -4, 6, { collide: false });
    for (let z = -0.55; z < 3.8; z += 0.07) B.box(M.oakV, 35.09, 35.13, 0, 2.8, z, z + 0.045, { collide: false, grain: 'z' });
    B.box(M.ledSoft, 35.13, 35.15, 2.78, 2.8, -0.55, 3.8, { collide: false, cast: false });
    const hb = new THREE.Group();
    B.rbox(M.velvetOlive, 0.12, 1.0, 2.3, 0.05, 0, 0.82, 0, hb, { seg: 4 });
    place(hb, 35.2, 1.6, 0, { name: 'headboard' });
    place(F.bed({ w: 1.8, l: 2.1, frame: M.linenCharcoal, throwMat: M.linenSand }), 36.35, 1.6, Math.PI / 2, { name: 'bed' });
    B.contact(36.4, 1.6, 2.5, 2.3, 0.55, { rect: true, y: 0.02 });
    place(F.rug({ w: 3.2, d: 3.6, mat: M.rug2 }), 37.0, 1.6, 0, { collide: false });
    for (const z of [0.2, 3.0]) {
      place(F.nightstand({ mat: M.oak }), 35.38, z, Math.PI / 2, { name: 'nightstand' });
      place(F.tableLamp({ base: M.ceramicDark, h: 0.52 }), 35.38, z, 0, { y: 0.66, collide: false });
      L(35.6, 1.3, z, 0.9, 0xffc58a, 'guest');
    }
    place(F.bench({ len: 1.4, seat: M.linenOlive }), 37.75, 1.6, Math.PI / 2, { name: 'bench' });
    place(F.loungeChair({ mat: M.linen }), 40.7, 4.4, -2.2, { name: 'chair' });
    place(F.floorLamp(), 41.4, 5.3, 0, { name: 'lamp' });
    // Ensuite: walls and a walnut door, slightly ajar.
    B.wallZ(M.plaster, -4, -0.5, 40, 0, H.private, 0.12, [{ a: -2.6, b: -1.6, y0: 0, y1: 2.4 }], { name: 'ensuite' });
    B.wallX(M.plaster, 40, 42, -0.5, 0, H.private, 0.12, [], { name: 'ensuite' });
    const ed = new THREE.Group();
    B.rbox(M.walnutV, 0.04, 2.38, 0.98, 0.004, 0, 1.19, 0.49, ed, { grain: 'z' });
    B.rbox(M.bronze, 0.03, 0.4, 0.02, 0.006, -0.04, 1.05, 0.88, ed);
    ed.position.set(39.98, 0, -2.6);
    ed.rotation.y = 0.35;
    root.add(ed);
    B.colliderFrom(ed, 'ensuite-door');
    B.box(M.spaStone, 40.06, 42, 0, 0.01, -4, -0.56, { collide: false });
    B.box(M.ledWarm, 40.2, 41.8, H.private - 0.03, H.private - 0.01, -3.0, -2.95, { collide: false, cast: false });
    place(F.credenza({ len: 1.9, depth: 0.45, h: 0.72, mat: M.oak, top: M.travSlab }), 38.85, -3.68, 0, { name: 'dresser' });
    onWall(F.art({ w: 1.3, h: 0.95, mat: M.art.lines }), 38.85, 1.75, -3.92, 0);
    place(F.vase({ h: 0.4, r: 0.11, mat: M.terracotta }), 39.5, -3.68, 0, { y: 0.72, collide: false });
    B.box(M.ceiling, 35, 42, H.private - 0.005, H.private, -4, 6, { collide: false, cast: false });
    L(38.4, 2.6, 1.4, 3, 0xffd8b0, 'guest');
  }

  // ============================================================ GALLERY
  {
    place(F.sculptureBronze({ h: 1.7 }), 43.0, 1.4, 0.6, { name: 'bronze' });
    B.contact(43.0, 1.4, 1.2, 1.2, 0.5);
    onWall(F.art({ w: 2.0, h: 2.8, mat: M.art.horizon, frame: null }), 42.08, 2.2, -1.6, Math.PI / 2);
    place(F.bench({ len: 2.6, d: 0.44, h: 0.42, seat: M.travSlabHoned, frame: M.travSlabHoned }), 42.35, 3.9, Math.PI / 2, { name: 'bench' });
    place(F.plant({ h: 3.6, potR: 0.55 }), 45.6, 4.95, 0, { name: 'gallery-olive' });
    B.contact(45.6, 4.95, 1.7, 1.7, 0.5);
    L(45.0, 5.5, 0.0, 6, 0xffe2c0, 'gallery');
    L(44.0, 2.0, 2.5, 2, 0xffe2c0, 'gallery');
  }

  // Interior pool light used by the dusk finale.
  return { lights, anim };
}

import * as THREE from 'three';

// Parametric furniture. Every factory returns a THREE.Group built around a
// local origin on the floor (y = 0), facing +z unless noted. Proportions are
// taken from real contract furniture so the rooms read at the right scale.

export function makeFurniture(B, M) {
  const F = {};
  const G = () => new THREE.Group();
  const rb = (g, mat, w, h, d, r, x, y, z, o) => B.rbox(mat, w, h, d, r, x, y, z, g, o);

  // Deep lounge sofa: recessed plinth, seat and back cushions, low arms.
  F.sofa = ({ len = 3.2, depth = 1.05, mat = M.linen, arms = true, cushions = 3, accent = M.linenSand } = {}) => {
    const g = G();
    const armW = arms ? 0.22 : 0;
    rb(g, M.charcoal, len - 0.2, 0.1, depth - 0.2, 0.01, 0, 0.05, 0);
    rb(g, mat, len, 0.2, depth, 0.05, 0, 0.2, 0);
    const inner = len - armW * 2;
    const cw = inner / cushions;
    for (let i = 0; i < cushions; i++) {
      const x = -inner / 2 + cw * (i + 0.5);
      rb(g, mat, cw - 0.015, 0.16, depth - 0.3, 0.07, x, 0.37, 0.12);
      rb(g, mat, cw - 0.02, 0.44, 0.24, 0.1, x, 0.6, -depth / 2 + 0.2, { seg: 4 });
    }
    rb(g, mat, len, 0.36, 0.16, 0.06, 0, 0.48, -depth / 2 + 0.08);
    if (arms) {
      rb(g, mat, armW, 0.34, depth, 0.07, -len / 2 + armW / 2, 0.47, 0);
      rb(g, mat, armW, 0.34, depth, 0.07, len / 2 - armW / 2, 0.47, 0);
    }
    // Scatter cushions.
    const c1 = rb(g, accent, 0.5, 0.42, 0.14, 0.07, -inner / 2 + 0.4, 0.66, -depth / 2 + 0.42, { seg: 4 });
    c1.rotation.z = 0.08;
    c1.rotation.x = -0.25;
    const c2 = rb(g, M.linenOlive, 0.45, 0.4, 0.13, 0.07, inner / 2 - 0.42, 0.65, -depth / 2 + 0.42, { seg: 4 });
    c2.rotation.z = -0.1;
    c2.rotation.x = -0.25;
    return g;
  };

  // Sculptural lounge chair: rounded tub in bouclé on a walnut plinth.
  F.tubChair = ({ mat = M.boucle } = {}) => {
    const g = G();
    const base = B.lathe(mat, [[0, 0.06], [0.38, 0.06], [0.42, 0.2], [0.42, 0.42], [0.4, 0.44], [0, 0.44]], 0, 0, 0, g, { seg: 40 });
    base.scale.set(1, 1, 0.95);
    const back = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.11, 18, 40, Math.PI * 1.15), mat);
    back.rotation.x = Math.PI / 2;
    back.rotation.z = Math.PI + (Math.PI - Math.PI * 1.15) / 2;
    back.position.set(0, 0.62, -0.04);
    back.scale.set(1.1, 1, 2.0);
    back.castShadow = back.receiveShadow = true;
    g.add(back);
    rb(g, mat, 0.62, 0.12, 0.56, 0.06, 0, 0.48, 0.04);
    B.cyl(M.walnut, 0.3, 0.32, 0.06, 0, 0.03, 0, g);
    return g;
  };

  // Low lounge chair with oak frame and loose linen cushions.
  F.loungeChair = ({ mat = M.linenSand, frame = M.oak } = {}) => {
    const g = G();
    for (const s of [-1, 1]) {
      rb(g, frame, 0.05, 0.5, 0.86, 0.02, s * 0.36, 0.25, 0);
      rb(g, frame, 0.05, 0.05, 0.8, 0.02, s * 0.36, 0.52, 0.02);
    }
    rb(g, frame, 0.72, 0.04, 0.7, 0.01, 0, 0.18, 0.03);
    rb(g, mat, 0.68, 0.14, 0.72, 0.06, 0, 0.27, 0.04);
    const back = rb(g, mat, 0.66, 0.56, 0.16, 0.07, 0, 0.56, -0.32);
    back.rotation.x = -0.28;
    return g;
  };

  F.drum = ({ r = 0.55, h = 0.34, mat = M.travSlab } = {}) => {
    const g = G();
    B.lathe(mat, [[0, 0], [r - 0.02, 0], [r, 0.02], [r, h - 0.02], [r - 0.02, h], [0, h]], 0, 0, 0, g, { seg: 64 });
    return g;
  };

  F.sideTable = ({ mat = M.walnut, size = 0.48, h = 0.52 } = {}) => {
    const g = G();
    rb(g, mat, size, 0.04, size, 0.01, 0, h - 0.02, 0);
    B.cyl(mat, 0.07, 0.09, h - 0.04, 0, (h - 0.04) / 2, 0, g, { seg: 20 });
    B.cyl(mat, 0.2, 0.2, 0.025, 0, 0.0125, 0, g, { seg: 32 });
    return g;
  };

  F.tableLamp = ({ base = M.ceramicMatte, h = 0.62 } = {}) => {
    const g = G();
    B.lathe(base, [[0, 0], [0.08, 0], [0.12, 0.08], [0.11, 0.22], [0.05, 0.32], [0.02, 0.34], [0, 0.34]], 0, 0, 0, g, { seg: 32 });
    B.cyl(M.brass, 0.008, 0.008, h - 0.36, 0, 0.34 + (h - 0.36) / 2, 0, g, { seg: 8 });
    B.cyl(M.shade, 0.16, 0.2, 0.26, 0, h - 0.06, 0, g, { seg: 40, open: true, cast: false });
    B.cyl(M.bulb, 0.03, 0.03, 0.06, 0, h - 0.1, 0, g, { seg: 12, cast: false });
    return g;
  };

  F.floorLamp = ({ h = 1.6 } = {}) => {
    const g = G();
    B.cyl(M.bronzeDark, 0.16, 0.17, 0.03, 0, 0.015, 0, g, { seg: 32 });
    B.cyl(M.bronze, 0.012, 0.012, h - 0.2, 0, (h - 0.2) / 2, 0, g, { seg: 8 });
    B.cyl(M.shade, 0.2, 0.24, 0.3, 0, h - 0.1, 0, g, { seg: 40, open: true, cast: false });
    B.cyl(M.bulb, 0.03, 0.03, 0.06, 0, h - 0.14, 0, g, { seg: 12, cast: false });
    return g;
  };

  // Fluted walnut credenza on a recessed plinth.
  F.credenza = ({ len = 3.2, depth = 0.48, h = 0.74, mat = M.walnut, top = null } = {}) => {
    const g = G();
    rb(g, M.charcoal, len - 0.1, 0.08, depth - 0.08, 0.005, 0, 0.04, 0);
    rb(g, mat, len, h - 0.08 - (top ? 0.03 : 0), depth, 0.008, 0, 0.08 + (h - 0.08 - (top ? 0.03 : 0)) / 2, 0);
    if (top) rb(g, top, len + 0.02, 0.03, depth + 0.02, 0.004, 0, h - 0.015, 0);
    const n = Math.floor(len / 0.045);
    for (let i = 0; i < n; i++) {
      const x = -len / 2 + 0.03 + i * (len - 0.06) / (n - 1);
      B.cyl(mat, 0.012, 0.012, h - 0.18, x, 0.08 + (h - 0.18) / 2 + 0.03, depth / 2 + 0.002, g, { seg: 6, cast: false });
    }
    return g;
  };

  F.rug = ({ w, d, mat = M.rug, h = 0.014 } = {}) => {
    const g = G();
    const m = rb(g, mat, w, h, d, 0.004, 0, h / 2, 0, { cast: false });
    // Rug textures are painted for one rug: map 0..1 across the piece.
    const uv = m.geometry.attributes.uv;
    const pos = m.geometry.attributes.position;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, pos.getX(i) / w + 0.5, pos.getZ(i) / d + 0.5);
    }
    return g;
  };

  // Stretched canvas with a thin oak tray frame, hung on a wall (faces +z).
  F.art = ({ w, h, mat, frame = M.oak } = {}) => {
    const g = G();
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    plane.position.set(0, 0, 0.042);
    plane.receiveShadow = true;
    g.add(plane);
    rb(g, M.paper, w, h, 0.04, 0.003, 0, 0, 0.02, { cast: false });
    if (frame) {
      const t = 0.025;
      rb(g, frame, w + 0.06, t, 0.06, 0.003, 0, h / 2 + 0.03 - t / 2, 0.03, { cast: false });
      rb(g, frame, w + 0.06, t, 0.06, 0.003, 0, -h / 2 - 0.03 + t / 2, 0.03, { cast: false });
      rb(g, frame, t, h + 0.06, 0.06, 0.003, w / 2 + 0.03 - t / 2, 0, 0.03, { cast: false });
      rb(g, frame, t, h + 0.06, 0.06, 0.003, -w / 2 - 0.03 + t / 2, 0, 0.03, { cast: false });
    }
    return g;
  };

  F.vase = ({ h = 0.45, r = 0.14, mat = M.ceramicMatte, branches = true } = {}) => {
    const g = G();
    B.lathe(mat, [[0, 0], [r * 0.6, 0], [r, h * 0.35], [r * 0.85, h * 0.75], [r * 0.45, h * 0.95], [r * 0.5, h], [r * 0.4, h], [0, h * 0.2]], 0, 0, 0, g, { seg: 36 });
    if (branches) F.branches(g, h, 0.9);
    return g;
  };

  // Olive branches: thin curved stems with clustered leaf cards.
  F.branches = (g, y0, size = 1) => {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.3;
      const lean = 0.18 + (i % 2) * 0.12;
      const len = (0.7 + (i % 3) * 0.18) * size;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, y0 - 0.1, 0),
        new THREE.Vector3(Math.cos(a) * lean * 0.3, y0 + len * 0.55, Math.sin(a) * lean * 0.3),
        new THREE.Vector3(Math.cos(a) * lean, y0 + len, Math.sin(a) * lean),
      );
      const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 6, 0.006, 5), M.bark);
      stem.castShadow = true;
      g.add(stem);
      for (let k = 0; k < 4; k++) {
        const p = curve.getPoint(0.45 + k * 0.17);
        const card = new THREE.Mesh(new THREE.PlaneGeometry(0.32 * size, 0.32 * size), M.oliveLeaf);
        card.position.copy(p);
        card.rotation.set(Math.random() * 0.6, a + k, Math.random() * 0.8);
        card.castShadow = true;
        card.customDepthMaterial = M.oliveLeafDepth;
        g.add(card);
      }
    }
  };

  F.bowl = ({ r = 0.2, h = 0.09, mat = M.ceramic } = {}) => {
    const g = G();
    B.lathe(mat, [[0, 0], [r * 0.45, 0], [r * 0.9, h * 0.6], [r, h], [r * 0.95, h], [r * 0.82, h * 0.55], [0, h * 0.18]], 0, 0, 0, g, { seg: 40 });
    return g;
  };

  F.books = ({ n = 3, w = 0.26, d = 0.2 } = {}) => {
    const g = G();
    const mats = [M.book2, M.book1, M.book3, M.paper];
    let y = 0;
    for (let i = 0; i < n; i++) {
      const h = 0.025 + (i % 2) * 0.012;
      const b = rb(g, mats[i % mats.length], w - i * 0.015, h, d - i * 0.01, 0.003, 0, y + h / 2, 0, { cast: false });
      b.rotation.y = (i - 1) * 0.06;
      y += h;
    }
    return g;
  };

  // Indoor olive / ficus in a stone planter.
  F.plant = ({ h = 2.4, pot = M.travSlabHoned, potR = 0.36 } = {}) => {
    const g = G();
    B.lathe(pot, [[0, 0], [potR * 0.82, 0], [potR, potR * 1.3], [potR * 0.96, potR * 1.4], [0, potR * 1.3]], 0, 0, 0, g, { seg: 40 });
    const trunk = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, potR * 1.2, 0),
      new THREE.Vector3(0.08, h * 0.4, 0.05),
      new THREE.Vector3(-0.05, h * 0.65, -0.04),
      new THREE.Vector3(0.04, h * 0.8, 0),
    ]);
    const t = new THREE.Mesh(new THREE.TubeGeometry(trunk, 12, 0.035, 7), M.bark);
    t.castShadow = true;
    g.add(t);
    const leaves = [];
    for (let i = 0; i < 70; i++) {
      const a = i * 2.39996;
      const rr = 0.25 + ((i * 37) % 11) / 11 * 0.45;
      const y = h * 0.62 + ((i * 53) % 17) / 17 * h * 0.36;
      const card = new THREE.PlaneGeometry(0.42, 0.42);
      card.rotateX(((i * 13) % 7) / 7 * 1.4 - 0.7);
      card.rotateY(a);
      card.translate(Math.cos(a) * rr, y, Math.sin(a) * rr);
      leaves.push(card);
    }
    const merged = mergeCards(leaves);
    const m = new THREE.Mesh(merged, M.oliveLeaf);
    m.castShadow = true;
    m.customDepthMaterial = M.oliveLeafDepth;
    g.add(m);
    return g;
  };

  F.bed = ({ w = 2.0, l = 2.15, frame = M.linenSand, duvet = M.linenWhite, throwMat = M.linenOlive, baseH = 0.3 } = {}) => {
    const g = G();
    // Bed faces +z; headboard side at z = -l/2.
    rb(g, M.charcoal, w - 0.2, 0.08, l - 0.2, 0.01, 0, 0.04, 0);
    rb(g, frame, w, baseH - 0.08, l, 0.04, 0, 0.08 + (baseH - 0.08) / 2, 0);
    rb(g, M.linenWhite, w - 0.06, 0.24, l - 0.06, 0.06, 0, baseH + 0.12, 0);
    // Duvet: slightly oversize, folded back at the top.
    rb(g, duvet, w + 0.06, 0.09, l - 0.4, 0.045, 0, baseH + 0.26, 0.2, { seg: 4 });
    rb(g, duvet, w + 0.04, 0.05, 0.3, 0.025, 0, baseH + 0.31, -l / 2 + 0.62, { seg: 3 });
    // Throw across the foot.
    rb(g, throwMat, w + 0.1, 0.04, 0.6, 0.02, 0, baseH + 0.32, l / 2 - 0.42, { seg: 3 });
    // Pillows: two sleeping, two euro, one bolster.
    for (const s of [-1, 1]) {
      const p = rb(g, M.linenWhite, 0.72, 0.16, 0.42, 0.08, s * 0.42, baseH + 0.36, -l / 2 + 0.3, { seg: 4 });
      p.rotation.x = -0.2;
      const e = rb(g, M.linenSand, 0.62, 0.52, 0.16, 0.08, s * 0.38, baseH + 0.5, -l / 2 + 0.14, { seg: 4 });
      e.rotation.x = -0.18;
    }
    const bol = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.8, 6, 16), throwMat);
    bol.rotation.z = Math.PI / 2;
    bol.position.set(0, baseH + 0.42, -l / 2 + 0.52);
    bol.castShadow = true;
    g.add(bol);
    return g;
  };

  F.nightstand = ({ mat = M.walnut } = {}) => {
    const g = G();
    rb(g, mat, 0.58, 0.28, 0.4, 0.01, 0, 0.52, 0);
    rb(g, M.brass, 0.18, 0.012, 0.012, 0.004, 0, 0.52, 0.205, { cast: false });
    return g;
  };

  F.bench = ({ len = 1.6, d = 0.45, h = 0.45, seat = M.leather, frame = M.oak } = {}) => {
    const g = G();
    rb(g, seat, len, 0.1, d, 0.04, 0, h - 0.05, 0);
    for (const s of [-1, 1]) rb(g, frame, 0.05, h - 0.1, d - 0.04, 0.01, s * (len / 2 - 0.1), (h - 0.1) / 2, 0);
    rb(g, frame, len - 0.2, 0.04, 0.04, 0.01, 0, 0.12, 0);
    return g;
  };

  F.diningChair = ({ seat = M.linenSand, frame = M.oak } = {}) => {
    const g = G();
    for (const [x, z] of [[-0.21, 0.2], [0.21, 0.2], [-0.21, -0.2], [0.21, -0.2]]) {
      const leg = rb(g, frame, 0.04, 0.44, 0.04, 0.012, x, 0.22, z);
      leg.rotation.z = x > 0 ? -0.04 : 0.04;
    }
    rb(g, seat, 0.5, 0.08, 0.5, 0.035, 0, 0.47, 0.01);
    const back = rb(g, seat, 0.48, 0.36, 0.07, 0.03, 0, 0.75, -0.23);
    back.rotation.x = -0.12;
    rb(g, frame, 0.04, 0.42, 0.04, 0.012, -0.21, 0.66, -0.22);
    rb(g, frame, 0.04, 0.42, 0.04, 0.012, 0.21, 0.66, -0.22);
    return g;
  };

  F.barStool = () => {
    const g = G();
    B.lathe(M.walnut, [[0, 0], [0.2, 0], [0.2, 0.02], [0.03, 0.05], [0.03, 0.6], [0, 0.6]], 0, 0, 0, g, { seg: 32 });
    B.lathe(M.leather, [[0, 0.6], [0.2, 0.6], [0.22, 0.66], [0.2, 0.7], [0, 0.69]], 0, 0, 0, g, { seg: 32 });
    rb(g, M.leather, 0.38, 0.16, 0.05, 0.02, 0, 0.8, -0.18);
    B.lathe(M.bronze, [[0.16, 0.25], [0.17, 0.25], [0.17, 0.27], [0.16, 0.27]], 0, 0, 0, g, { seg: 32 });
    return g;
  };

  // Hanging pendant: rod from the ceiling + a body.
  F.pendant = (parent, x, z, ceiling, bottom, kind = 'alabaster') => {
    const g = G();
    const len = ceiling - bottom;
    if (kind === 'alabaster') {
      B.cyl(M.alabaster, 0.15, 0.15, 0.36, 0, bottom + 0.18, 0, g, { seg: 32, cast: false });
      B.cyl(M.bronze, 0.152, 0.152, 0.02, 0, bottom + 0.37, 0, g, { seg: 32 });
      B.cyl(M.bronze, 0.006, 0.006, len - 0.38, 0, bottom + 0.38 + (len - 0.38) / 2, 0, g, { seg: 6, cast: false });
    } else if (kind === 'globe') {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 20), M.globe);
      s.position.y = bottom + 0.13;
      g.add(s);
      B.cyl(M.brass, 0.02, 0.02, 0.04, 0, bottom + 0.27, 0, g, { seg: 12 });
      B.cyl(M.brass, 0.004, 0.004, len - 0.28, 0, bottom + 0.28 + (len - 0.28) / 2, 0, g, { seg: 6, cast: false });
    }
    B.cyl(M.bronze, 0.05, 0.05, 0.015, 0, ceiling - 0.008, 0, g, { seg: 20, cast: false });
    g.position.set(x, 0, z);
    parent.add(g);
    return g;
  };

  F.island = ({ len = 4.6, d = 1.3, h = 0.94 } = {}) => {
    const g = G();
    const t = 0.05;
    // Book-matched marble top and waterfall ends.
    rb(g, M.marble, len, t, d, 0.006, 0, h - t / 2, 0, { tile: 2.2 });
    rb(g, M.marble, t, h - t, d, 0.006, -len / 2 + t / 2, (h - t) / 2, 0, { tile: 2.2 });
    rb(g, M.marble, t, h - t, d, 0.006, len / 2 - t / 2, (h - t) / 2, 0, { tile: 2.2 });
    // Recessed fluted walnut body.
    rb(g, M.walnut, len - 2 * t - 0.02, h - t - 0.1, d - 0.16, 0.005, 0, 0.1 + (h - t - 0.1) / 2, 0);
    rb(g, M.charcoal, len - 2 * t - 0.1, 0.1, d - 0.26, 0.005, 0, 0.05, 0);
    const n = Math.floor((len - 0.2) / 0.05);
    for (const s of [-1, 1]) {
      for (let i = 0; i < n; i++) {
        const x = -len / 2 + 0.12 + i * (len - 0.24) / (n - 1);
        B.cyl(M.walnut, 0.016, 0.016, h - t - 0.12, x, 0.1 + (h - t - 0.12) / 2, s * (d / 2 - 0.08), g, { seg: 6, cast: false });
      }
    }
    // Under-mounted sink and sculptural bronze tap.
    rb(g, M.stoneDark, 0.72, 0.012, 0.42, 0.04, len / 2 - 1.1, h + 0.001, -0.12, { cast: false });
    const tapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(len / 2 - 1.1, h, -0.42),
      new THREE.Vector3(len / 2 - 1.1, h + 0.34, -0.42),
      new THREE.Vector3(len / 2 - 1.1, h + 0.42, -0.3),
      new THREE.Vector3(len / 2 - 1.1, h + 0.33, -0.16),
    ]);
    const tap = new THREE.Mesh(new THREE.TubeGeometry(tapCurve, 24, 0.014, 12), M.bronze);
    tap.castShadow = true;
    g.add(tap);
    B.cyl(M.bronze, 0.026, 0.026, 0.02, len / 2 - 1.1, h + 0.01, -0.42, g, { seg: 20 });
    return g;
  };

  F.diningTable = ({ len = 3.0, w = 1.1, h = 0.75 } = {}) => {
    const g = G();
    // Long axis along z.
    rb(g, M.oak, w, 0.06, len, 0.012, 0, h - 0.03, 0, { grain: 'z' });
    for (const s of [-1, 1]) {
      rb(g, M.travSlabHoned, 0.36, h - 0.06, 0.7, 0.02, 0, (h - 0.06) / 2, s * (len / 2 - 0.55));
    }
    return g;
  };

  F.plate = (g, x, y, z) => {
    B.lathe(M.ceramic, [[0, 0], [0.1, 0], [0.135, 0.012], [0.14, 0.016], [0.13, 0.016], [0.1, 0.006], [0, 0.006]], x, y, z, g, { seg: 32, cast: false });
  };

  F.wineGlass = (g, x, y, z) => {
    B.lathe(M.drinkGlass, [[0, 0], [0.035, 0], [0.036, 0.004], [0.005, 0.01], [0.004, 0.09], [0.035, 0.12], [0.04, 0.17], [0.036, 0.2], [0.034, 0.2], [0.037, 0.17], [0.03, 0.125], [0, 0.11]], x, y, z, g, { seg: 24, cast: false });
  };

  F.candle = (g, x, y, z, h = 0.3) => {
    B.lathe(M.bronze, [[0, 0], [0.04, 0], [0.04, 0.01], [0.012, 0.03], [0.012, 0.09], [0.022, 0.1], [0, 0.1]], x, y, z, g, { seg: 20 });
    B.cyl(M.ceramicMatte, 0.011, 0.011, h, x, y + 0.1 + h / 2, z, g, { seg: 12 });
    B.cyl(M.bulb, 0.004, 0.006, 0.02, x, y + 0.1 + h + 0.012, z, g, { seg: 8, cast: false });
  };

  // Freestanding oval bath (long axis along x).
  F.bath = ({ len = 1.8, w = 0.86, h = 0.58 } = {}) => {
    const g = G();
    const r = w / 2;
    const outer = B.lathe(M.resin, [[0, 0], [r * 0.82, 0], [r * 0.95, h * 0.5], [r, h - 0.02], [r - 0.01, h], [r - 0.05, h], [r - 0.06, h - 0.04], [r - 0.08, 0.2], [0, 0.14]], 0, 0, 0, g, { seg: 64 });
    outer.scale.set(len / w, 1, 1);
    const water = new THREE.Mesh(new THREE.CircleGeometry(r - 0.075, 48), new THREE.MeshPhysicalMaterial({ color: 0xcfe2df, roughness: 0.02, transparent: true, opacity: 0.55, depthWrite: false }));
    water.rotation.x = -Math.PI / 2;
    water.scale.set(len / w * 0.98, 1, 1);
    water.position.y = h - 0.12;
    g.add(water);
    return g;
  };

  F.vesselBasin = (g, x, y, z) => {
    B.lathe(M.ceramic, [[0, 0], [0.12, 0], [0.2, 0.08], [0.21, 0.13], [0.2, 0.13], [0.18, 0.05], [0, 0.03]], x, y, z, g, { seg: 40 });
  };

  // Stone-shelled tall wardrobe module with bronze glass doors, lit rail and
  // hanging garments. Faces +z, width w.
  F.wardrobe = ({ w = 1.2, h = 2.9, d = 0.6, kind = 'hang' } = {}) => {
    const g = G();
    rb(g, M.walnut, w, h, 0.03, 0.002, 0, h / 2, -d / 2 + 0.015);
    rb(g, M.walnut, 0.03, h, d, 0.002, -w / 2 + 0.015, h / 2, 0);
    rb(g, M.walnut, 0.03, h, d, 0.002, w / 2 - 0.015, h / 2, 0);
    rb(g, M.walnut, w, 0.03, d, 0.002, 0, h - 0.015, 0);
    rb(g, M.walnut, w, 0.12, d, 0.002, 0, 0.06, 0);
    // Light strip under the top.
    rb(g, M.ledWarm, w - 0.08, 0.01, 0.02, 0.002, 0, h - 0.04, d / 2 - 0.08, { cast: false });
    const palette = [M.linenWhite, M.linenSand, M.linenCharcoal, M.linenOlive, M.boucle, M.linen];
    if (kind === 'hang') {
      B.cyl(M.brass, 0.01, 0.01, w - 0.06, 0, h - 0.3, 0, g, { seg: 8 }).rotation.z = Math.PI / 2;
      const n = Math.floor(w / 0.09);
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + 0.08 + i * (w - 0.16) / (n - 1);
        const len = 0.9 + ((i * 7) % 5) * 0.12;
        rb(g, palette[(i * 5) % palette.length], 0.03, len, d - 0.14, 0.012, x, h - 0.32 - len / 2, 0, { cast: false });
      }
      // Drawers beneath.
      for (let k = 0; k < 2; k++) rb(g, M.walnut, w - 0.07, 0.24, d - 0.04, 0.006, 0, 0.26 + k * 0.26, 0.01);
    } else {
      // Shelving: folded knitwear, boxes, shoes.
      for (let k = 0; k < 7; k++) {
        const y = 0.3 + k * 0.36;
        rb(g, M.walnut, w - 0.06, 0.025, d - 0.04, 0.004, 0, y, 0);
        for (let i = 0; i < 3; i++) {
          const pm = palette[(k + i * 2) % palette.length];
          rb(g, pm, (w - 0.2) / 3 - 0.04, 0.08 + (k % 3) * 0.04, d - 0.22, 0.02, -w / 2 + 0.1 + (i + 0.5) * (w - 0.2) / 3, y + 0.06 + (k % 3) * 0.02, -0.02, { cast: false });
        }
      }
    }
    // Bronze glass doors.
    const door = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.16), M.glassBronze);
    door.position.set(0, (h - 0.16) / 2 + 0.13, d / 2 - 0.01);
    door.renderOrder = 2;
    g.add(door);
    rb(g, M.bronze, 0.012, 0.8, 0.02, 0.005, w / 2 - 0.07, 1.15, d / 2 + 0.01);
    return g;
  };

  F.sculptureRing = () => {
    const g = G();
    rb(g, M.travSlabHoned, 0.5, 0.82, 0.5, 0.01, 0, 0.41, 0);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.13, 32, 64), M.stoneDark);
    ring.position.y = 0.82 + 0.47;
    ring.castShadow = ring.receiveShadow = true;
    g.add(ring);
    return g;
  };

  F.sculptureBronze = ({ h = 1.5 } = {}) => {
    const g = G();
    rb(g, M.travSlabHoned, 0.6, 0.38, 0.6, 0.01, 0, 0.19, 0);
    const geo = new THREE.SphereGeometry(0.32, 64, 48);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const tw = y * 3.2;
      const r = 0.6 + 0.4 * Math.sin(y * 4 + 1);
      p.setXYZ(i, (x * Math.cos(tw) - z * Math.sin(tw)) * r * 0.9, y * (h / 0.64), (x * Math.sin(tw) + z * Math.cos(tw)) * r * 0.55);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, M.bronze);
    m.position.y = 0.38 + h / 2;
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return g;
  };

  // Teak sun lounger with cushion (faces +z, backrest at -z).
  F.sunLounger = () => {
    const g = G();
    rb(g, M.teak, 0.72, 0.06, 1.95, 0.02, 0, 0.3, 0.05);
    for (const [x, z] of [[-0.3, 0.9], [0.3, 0.9], [-0.3, -0.7], [0.3, -0.7]]) rb(g, M.teak, 0.06, 0.28, 0.06, 0.01, x, 0.14, z);
    rb(g, M.cushionOut, 0.68, 0.08, 1.3, 0.035, 0, 0.37, 0.35);
    const back = rb(g, M.cushionOut, 0.68, 0.08, 0.72, 0.035, 0, 0.55, -0.62);
    back.rotation.x = 0.55;
    const towel = rb(g, M.towelOlive, 0.5, 0.02, 0.5, 0.01, 0, 0.42, 0.55, { cast: false });
    towel.rotation.y = 0.2;
    return g;
  };

  F.parasol = () => {
    const g = G();
    rb(g, M.travSlabHoned, 0.5, 0.12, 0.5, 0.01, 0, 0.06, 0);
    B.cyl(M.teak, 0.025, 0.025, 2.5, 0, 1.25, 0, g, { seg: 10 });
    const canopy = B.lathe(M.cushionOut, [[0, 2.62], [1.3, 2.25], [1.32, 2.2], [0, 2.56]], 0, 0, 0, g, { seg: 8 });
    canopy.material = M.cushionOut;
    return g;
  };

  F.outdoorSofa = ({ len = 2.6 } = {}) => {
    const g = G();
    rb(g, M.teak, len, 0.3, 0.95, 0.02, 0, 0.15, 0);
    rb(g, M.cushionOut, len - 0.08, 0.16, 0.8, 0.06, 0, 0.38, 0.05);
    rb(g, M.cushionOut, len - 0.08, 0.42, 0.2, 0.08, 0, 0.6, -0.36);
    rb(g, M.linenOlive, 0.48, 0.4, 0.13, 0.07, -len / 2 + 0.4, 0.62, -0.18).rotation.x = -0.25;
    return g;
  };

  return F;
}

// Merge plane cards into one geometry (normals bent outward for soft,
// volumetric canopy shading).
export function mergeCards(geos, center = null) {
  let count = 0;
  for (const g of geos) count += g.attributes.position.count;
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const idx = [];
  let off = 0;
  const c = new THREE.Vector3();
  if (center) c.copy(center);
  else {
    const b = new THREE.Box3();
    for (const g of geos) {
      g.computeBoundingBox();
      b.union(g.boundingBox);
    }
    b.getCenter(c);
  }
  const v = new THREE.Vector3();
  for (const g of geos) {
    const p = g.attributes.position;
    const u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i), p.getY(i), p.getZ(i));
      pos.set([v.x, v.y, v.z], (off + i) * 3);
      v.sub(c).normalize();
      nor.set([v.x, v.y * 0.8 + 0.2, v.z], (off + i) * 3);
      uv.set([u.getX(i), u.getY(i)], (off + i) * 2);
    }
    const gi = g.index.array;
    for (let i = 0; i < gi.length; i++) idx.push(gi[i] + off);
    off += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(idx);
  out.computeBoundingSphere();
  return out;
}

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Box-project UVs from vertex positions so that textures keep a constant
// real-world scale (material.userData.tile metres per texture repeat).
// `grain` chooses the axis wood grain / stone banding runs along on
// horizontal faces: 'x' or 'z'.
export function projectUV(geo, tile = 1, grain = 'x', offset = [0, 0, 0]) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + offset[0];
    const y = pos.getY(i) + offset[1];
    const z = pos.getZ(i) + offset[2];
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    let u, v;
    if (ay >= ax && ay >= az) {
      if (grain === 'x') { u = x; v = z; } else { u = z; v = x; }
    } else if (ax >= az) {
      u = z; v = y;
    } else {
      u = x; v = y;
    }
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

export class Builder {
  constructor(root) {
    this.root = root;
    this.colliders = [];
    this.contactMats = {};
    this.contactTex = null;
    this.rectTex = null;
  }

  tileOf(mat) {
    return (mat.userData && mat.userData.tile) || 1;
  }

  // Axis-aligned architectural box from world extents.
  box(mat, x0, x1, y0, y1, z0, z1, opts = {}) {
    const w = x1 - x0;
    const h = y1 - y0;
    const d = z1 - z0;
    if (w <= 0.0001 || h <= 0.0001 || d <= 0.0001) return null;
    const geo = new THREE.BoxGeometry(w, h, d);
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const cz = (z0 + z1) / 2;
    projectUV(geo, opts.tile || this.tileOf(mat), opts.grain || mat.userData.grain || 'x', [cx, cy, cz]);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(cx, cy, cz);
    m.castShadow = opts.cast !== false;
    m.receiveShadow = opts.receive !== false;
    if (opts.name) m.name = opts.name;
    (opts.parent || this.root).add(m);
    if (opts.collide !== false) this.collider(x0, x1, y0, y1, z0, z1, opts.name || 'box');
    return m;
  }

  collider(x0, x1, y0, y1, z0, z1, name = 'obj') {
    this.colliders.push({ min: [x0, y0, z0], max: [x1, y1, z1], name });
  }

  // Register the world AABB of an already placed object.
  colliderFrom(obj, name, shrink = 0) {
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    if (b.isEmpty()) return;
    this.collider(b.min.x + shrink, b.max.x - shrink, b.min.y, b.max.y, b.min.z + shrink, b.max.z - shrink, name || obj.name || 'furniture');
  }

  // Wall running along X at depth z (centre line), from x0 to x1, with
  // rectangular openings [{a, b, y0, y1}] measured along X.
  wallX(mat, x0, x1, z, y0, y1, t, openings = [], opts = {}) {
    this._wall(mat, x0, x1, y0, y1, openings, (a, b, ya, yb) =>
      this.box(mat, a, b, ya, yb, z - t / 2, z + t / 2, opts));
  }

  wallZ(mat, z0, z1, x, y0, y1, t, openings = [], opts = {}) {
    this._wall(mat, z0, z1, y0, y1, openings, (a, b, ya, yb) =>
      this.box(mat, x - t / 2, x + t / 2, ya, yb, a, b, opts));
  }

  _wall(mat, s0, s1, y0, y1, openings, emit) {
    const ops = [...openings].sort((p, q) => p.a - q.a);
    let cursor = s0;
    for (const o of ops) {
      if (o.a > cursor) emit(cursor, o.a, y0, y1);
      const oy0 = o.y0 ?? y0;
      const oy1 = o.y1 ?? y1;
      if (oy0 > y0) emit(o.a, o.b, y0, oy0);
      if (oy1 < y1) emit(o.a, o.b, oy1, y1);
      cursor = Math.max(cursor, o.b);
    }
    if (cursor < s1) emit(cursor, s1, y0, y1);
  }

  // Rounded box in a local group (furniture). Centre-based.
  rbox(mat, w, h, d, r, x, y, z, parent, opts = {}) {
    const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    const geo = rr > 0.004 ? new RoundedBoxGeometry(w, h, d, opts.seg || 2, rr) : new THREE.BoxGeometry(w, h, d);
    projectUV(geo, opts.tile || this.tileOf(mat), opts.grain || mat.userData.grain || 'x', [x, y, z]);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = opts.cast !== false;
    m.receiveShadow = opts.receive !== false;
    parent.add(m);
    return m;
  }

  cyl(mat, rTop, rBot, h, x, y, z, parent, opts = {}) {
    const geo = new THREE.CylinderGeometry(rTop, rBot, h, opts.seg || 40, 1, opts.open || false);
    projectUV(geo, opts.tile || this.tileOf(mat), 'x', [x, y, z]);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = opts.cast !== false;
    m.receiveShadow = opts.receive !== false;
    parent.add(m);
    return m;
  }

  lathe(mat, profile, x, y, z, parent, opts = {}) {
    const pts = profile.map(([r, h]) => new THREE.Vector2(r, h));
    const geo = new THREE.LatheGeometry(pts, opts.seg || 48);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = opts.cast !== false;
    m.receiveShadow = opts.receive !== false;
    parent.add(m);
    return m;
  }

  // Place a furniture group in the world and register its collider.
  place(group, x, z, rotY = 0, opts = {}) {
    group.position.set(x, opts.y || 0, z);
    group.rotation.y = rotY;
    (opts.parent || this.root).add(group);
    if (opts.collide !== false) this.colliderFrom(group, opts.name || group.name);
    return group;
  }

  // Soft contact shadow decal on a floor (approximates ambient occlusion
  // under furniture, which real-time shadow maps miss indoors).
  // rect = true uses a blurred rectangle instead of a radial falloff.
  contact(x, z, w, d, opacity = 0.5, { y = 0.004, rotY = 0, rect = false, parent } = {}) {
    const geo = new THREE.PlaneGeometry(w, d);
    geo.rotateX(-Math.PI / 2);
    const key = `${Math.round(opacity * 20)}|${rect}`;
    if (!this.contactMats[key]) {
      this.contactMats[key] = new THREE.MeshBasicMaterial({
        color: 0x000000,
        alphaMap: rect ? this.rectTex : this.contactTex,
        transparent: true,
        opacity: Math.round(opacity * 20) / 20,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
    }
    const m = new THREE.Mesh(geo, this.contactMats[key]);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.renderOrder = 1;
    m.castShadow = false;
    m.receiveShadow = false;
    (parent || this.root).add(m);
    return m;
  }
}

// Merge every static mesh under `root` by material (and shadow flags) into
// spatial cells. This collapses thousands of furniture/architecture pieces
// into a few hundred draw calls while keeping frustum culling effective.
export function mergeStatic(root, cell = 26) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  const victims = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.dynamic) return;
    let p = o.parent;
    while (p && p !== root) {
      if (p.userData.dynamic) return;
      p = p.parent;
    }
    const mat = o.material;
    if (Array.isArray(mat)) return;
    const c = new THREE.Vector3();
    o.geometry.computeBoundingBox();
    o.geometry.boundingBox.getCenter(c);
    c.applyMatrix4(o.matrixWorld);
    const key = `${mat.uuid}|${o.castShadow}|${o.receiveShadow}|${o.renderOrder}|${Math.floor(c.x / cell)}|${Math.floor(c.z / cell)}`;
    if (!buckets.has(key)) buckets.set(key, { mat, cast: o.castShadow, receive: o.receiveShadow, order: o.renderOrder, geos: [] });
    let g = o.geometry.clone();
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    }
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    if (g.index) g = g.toNonIndexed();
    g.applyMatrix4(o.matrixWorld);
    g.morphAttributes = {};
    buckets.get(key).geos.push(g);
    victims.push(o);
  });
  for (const v of victims) v.removeFromParent();
  const merged = new THREE.Group();
  merged.name = 'static-merged';
  let count = 0;
  for (const b of buckets.values()) {
    const g = b.geos.length === 1 ? b.geos[0] : mergeGeometries(b.geos, false);
    if (!g) continue;
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, b.mat);
    m.castShadow = b.cast;
    m.receiveShadow = b.receive;
    m.renderOrder = b.order;
    m.matrixAutoUpdate = false;
    merged.add(m);
    count++;
  }
  root.add(merged);
  return { meshes: count, merged: victims.length };
}

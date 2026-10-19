import * as THREE from 'three';
import * as T from './textures.js';

// The villa's material palette: warm ivory, travertine, walnut, oak, soft
// charcoal, muted bronze and a deep olive accent.

function std(params, tile = 1, extra = {}) {
  const m = new THREE.MeshStandardMaterial(params);
  m.userData.tile = tile;
  Object.assign(m.userData, extra);
  return m;
}

export async function createMaterials(onStep = async () => {}) {
  const M = {};
  const tex = {};

  // Large-format travertine floor tiles (texture = 2.4 m square, 1.2 x 0.6 tiles).
  tex.travFloor = T.travertine({ seed: 3, joints: true, tileW: 2, tileH: 4 });
  M.travFloor = std({ map: tex.travFloor.map, bumpMap: tex.travFloor.bump, bumpScale: 0.6, roughness: 0.48, color: 0xffffff }, 2.4, { grain: 'x' });
  await onStep('Travertine');

  tex.travClad = T.travertine({ seed: 8, joints: true, tileW: 2, tileH: 3, tone: [226, 211, 186], vein: [190, 170, 140] });
  M.travClad = std({ map: tex.travClad.map, bumpMap: tex.travClad.bump, bumpScale: 1.2, roughness: 0.78 }, 3.0);
  M.travCladInt = std({ map: tex.travClad.map, bumpMap: tex.travClad.bump, bumpScale: 0.8, roughness: 0.62 }, 3.0);

  tex.travSlab = T.travertine({ seed: 12, joints: false, size: 768 });
  M.travSlab = std({ map: tex.travSlab.map, bumpMap: tex.travSlab.bump, bumpScale: 0.5, roughness: 0.4 }, 1.4);
  M.travSlabHoned = std({ map: tex.travSlab.map, bumpMap: tex.travSlab.bump, bumpScale: 0.9, roughness: 0.7 }, 1.4);

  tex.spaStone = T.travertine({ seed: 19, joints: true, tileW: 1, tileH: 2, tone: [214, 204, 188], vein: [168, 152, 130], size: 1024 });
  M.spaStone = std({ map: tex.spaStone.map, bumpMap: tex.spaStone.bump, bumpScale: 0.4, roughness: 0.32 }, 2.6);
  await onStep('Stone');

  tex.marble = T.marble({ seed: 11 });
  M.marble = new THREE.MeshPhysicalMaterial({ map: tex.marble.map, bumpMap: tex.marble.bump, bumpScale: 0.2, roughness: 0.18, clearcoat: 0.35, clearcoatRoughness: 0.2 });
  M.marble.userData.tile = 2.2;
  await onStep('Marble');

  tex.plaster = T.mottled({ seed: 7, base: [236, 229, 216], amp: 6, scale: 5 });
  M.plaster = std({ map: tex.plaster.map, bumpMap: tex.plaster.bump, bumpScale: 0.25, roughness: 0.94 }, 3.2);
  tex.ceiling = T.mottled({ seed: 9, base: [240, 236, 228], amp: 3, scale: 4 });
  M.ceiling = std({ map: tex.ceiling.map, roughness: 0.96 }, 3.2);
  tex.concrete = T.mottled({ seed: 15, base: [204, 196, 182], amp: 14, scale: 9, grain: 8 });
  M.concrete = std({ map: tex.concrete.map, bumpMap: tex.concrete.bump, bumpScale: 0.6, roughness: 0.86 }, 2.4);
  M.fascia = std({ map: tex.concrete.map, roughness: 0.8, color: 0xf2ece2 }, 2.4);
  await onStep('Plaster');

  tex.oakFloor = T.woodPlanks({ seed: 5, planks: 10 });
  M.oakFloor = std({ map: tex.oakFloor.map, bumpMap: tex.oakFloor.bump, bumpScale: 0.5, roughness: 0.58 }, 2.2, { grain: 'x' });
  tex.oak = T.woodGrain({ seed: 24, light: [200, 166, 124], dark: [166, 130, 92], figure: 7 });
  M.oak = std({ map: tex.oak.map, bumpMap: tex.oak.bump, bumpScale: 0.3, roughness: 0.55 }, 1.0);
  tex.walnut = T.woodGrain({ seed: 21, figure: 9 });
  M.walnut = std({ map: tex.walnut.map, bumpMap: tex.walnut.bump, bumpScale: 0.3, roughness: 0.42 }, 1.2);
  // Vertical-grain veneer (doors, wall panels, tall joinery).
  const rot = (t) => {
    const r = t.clone();
    r.center.set(0.5, 0.5);
    r.rotation = Math.PI / 2;
    r.needsUpdate = true;
    return r;
  };
  M.walnutV = std({ map: rot(tex.walnut.map), bumpMap: rot(tex.walnut.bump), bumpScale: 0.3, roughness: 0.42 }, 1.2, { grain: 'z' });
  M.oakV = std({ map: rot(tex.oak.map), bumpMap: rot(tex.oak.bump), bumpScale: 0.3, roughness: 0.55 }, 1.0, { grain: 'z' });
  M.teak = std({ map: tex.oak.map, roughness: 0.75, color: 0xb59a7c }, 1.0);
  await onStep('Timber');

  tex.linen = T.fabric({ seed: 13, base: [228, 220, 206] });
  M.linen = std({ map: tex.linen.map, bumpMap: tex.linen.bump, bumpScale: 0.4, roughness: 0.96 }, 0.5);
  M.linenWhite = std({ map: tex.linen.map, bumpMap: tex.linen.bump, bumpScale: 0.3, roughness: 0.95, color: 0xfffaf2 }, 0.5);
  M.linenSand = std({ map: tex.linen.map, bumpMap: tex.linen.bump, bumpScale: 0.4, roughness: 0.96, color: 0xd6c3a5 }, 0.5);
  M.linenOlive = std({ map: tex.linen.map, bumpMap: tex.linen.bump, bumpScale: 0.4, roughness: 0.96, color: 0x8f9470 }, 0.5);
  M.linenCharcoal = std({ map: tex.linen.map, bumpMap: tex.linen.bump, bumpScale: 0.4, roughness: 0.96, color: 0x77716a }, 0.5);
  tex.boucle = T.fabric({ seed: 33, base: [232, 226, 214], weave: 60, amp: 26, slub: 0.9 });
  M.boucle = std({ map: tex.boucle.map, bumpMap: tex.boucle.bump, bumpScale: 1.0, roughness: 1 }, 0.4);
  M.velvetOlive = std({ map: tex.boucle.map, roughness: 0.8, color: 0x6f7552 }, 0.4);
  M.leather = std({ color: 0x8a5a3a, roughness: 0.45 });
  M.leatherDark = std({ color: 0x3d2c22, roughness: 0.5 });
  await onStep('Textiles');

  tex.rug = T.rug({});
  M.rug = std({ map: tex.rug.map, bumpMap: tex.rug.bump, bumpScale: 0.8, roughness: 1 });
  tex.rug2 = T.rug({ base: [196, 186, 168], border: [120, 112, 96], seed: 37, borderWidth: 0.04 });
  M.rug2 = std({ map: tex.rug2.map, bumpMap: tex.rug2.bump, bumpScale: 0.8, roughness: 1 });

  M.bronze = std({ color: 0x8c6a48, metalness: 1, roughness: 0.32 });
  M.bronzeDark = std({ color: 0x4a3a2c, metalness: 0.9, roughness: 0.4 });
  M.brass = std({ color: 0xc19a62, metalness: 1, roughness: 0.25 });
  M.charcoal = std({ color: 0x34312d, roughness: 0.6 });
  M.charcoalMetal = std({ color: 0x2a2826, metalness: 0.7, roughness: 0.45 });
  M.blackGlass = new THREE.MeshPhysicalMaterial({ color: 0x0e0d0c, roughness: 0.08, metalness: 0, clearcoat: 1 });
  M.ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf4efe6, roughness: 0.25, clearcoat: 0.6 });
  M.ceramicMatte = std({ color: 0xe9e1d3, roughness: 0.85 });
  M.ceramicDark = std({ color: 0x3b3631, roughness: 0.7 });
  M.terracotta = std({ color: 0xb0704a, roughness: 0.85 });
  M.stoneDark = std({ map: tex.travSlab.map, color: 0x6f675d, roughness: 0.5 }, 1.2);
  M.paper = std({ color: 0xf2ece0, roughness: 0.9 });
  M.book1 = std({ color: 0x8e7f6a, roughness: 0.8 });
  M.book2 = std({ color: 0xd8cdb8, roughness: 0.8 });
  M.book3 = std({ color: 0x55594a, roughness: 0.8 });
  M.lemon = std({ color: 0xe8c040, roughness: 0.55 });
  M.greenery = std({ color: 0x5d6b45, roughness: 0.8 });
  M.firebox = std({ color: 0x1b1918, roughness: 0.9 });
  M.log = std({ color: 0x5b4a3a, roughness: 0.95 });
  M.mirror = std({ color: 0xdfe3e2, metalness: 1, roughness: 0.03 });
  M.resin = new THREE.MeshPhysicalMaterial({ color: 0xf5f1ea, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  M.towel = std({ map: tex.boucle.map, roughness: 1, color: 0xf0e9dc }, 0.3);
  M.towelOlive = std({ map: tex.boucle.map, roughness: 1, color: 0x9a9b78 }, 0.3);
  await onStep('Fittings');

  // Glazing: thin, slightly green architectural glass. Reflections come from
  // the sky environment map; transmission is faked with low opacity.
  M.glass = new THREE.MeshPhysicalMaterial({
    color: 0xd6e2de, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.16,
    envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false, specularIntensity: 1, ior: 1.52,
  });
  M.glassFrosted = new THREE.MeshPhysicalMaterial({ color: 0xeeeeea, roughness: 0.6, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  M.glassShower = new THREE.MeshPhysicalMaterial({ color: 0xe8efee, roughness: 0.02, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.4 });
  M.glassBronze = new THREE.MeshPhysicalMaterial({ color: 0x7a5d3e, roughness: 0.1, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide });
  M.drinkGlass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, transparent: true, opacity: 0.25, depthWrite: false });

  // Light sources: emissive surfaces bloom gently in post-processing.
  M.ledWarm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.78, 0.52).multiplyScalar(4.5) });
  M.ledSoft = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.82, 0.6).multiplyScalar(2.2) });
  M.ledExt = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.78, 0.52).multiplyScalar(0.6) });
  M.ledExt.userData.base = new THREE.Color(1.0, 0.76, 0.5);
  M.bulb = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.8, 0.55).multiplyScalar(6) });
  M.shade = new THREE.MeshStandardMaterial({ color: 0xf3e7d2, roughness: 0.9, emissive: new THREE.Color(1.0, 0.78, 0.5), emissiveIntensity: 0.9, side: THREE.DoubleSide });
  M.alabaster = new THREE.MeshStandardMaterial({ color: 0xf5ead8, roughness: 0.6, emissive: new THREE.Color(1.0, 0.8, 0.56), emissiveIntensity: 1.2 });
  M.globe = new THREE.MeshPhysicalMaterial({ color: 0xfff4e4, roughness: 0.25, emissive: new THREE.Color(1.0, 0.82, 0.6), emissiveIntensity: 1.6, transmission: 0, clearcoat: 1 });
  M.fire = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.45, 0.12).multiplyScalar(3), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  M.skylight = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.98, 0.95).multiplyScalar(1.8) });

  // Exterior.
  tex.stoneWall = T.stoneWall({});
  M.stoneWall = std({ map: tex.stoneWall.map, bumpMap: tex.stoneWall.bump, bumpScale: 2.5, roughness: 0.92 }, 3.0);
  tex.gravel = T.gravel({});
  M.gravel = std({ map: tex.gravel.map, roughness: 1 }, 2.0);
  tex.ground = T.groundTexture({});
  M.ground = std({ map: tex.ground.map, roughness: 1 }, 14);
  tex.poolTiles = T.poolTiles({});
  M.poolTiles = std({ map: tex.poolTiles.map, roughness: 0.3 }, 1.6);
  M.render = std({ map: tex.plaster.map, roughness: 0.92, color: 0xefe6d6 }, 3.0);
  M.cushionOut = std({ map: tex.linen.map, bumpMap: tex.linen.bump, bumpScale: 0.4, roughness: 0.96, color: 0xeee4d2 }, 0.5);
  await onStep('Landscape');

  tex.bark = T.bark({});
  M.bark = std({ map: tex.bark.map, bumpMap: tex.bark.bump, bumpScale: 2, roughness: 0.95 }, 1.2);
  const leaf = (kind, seed, color = 0xffffff) => {
    const t = T.leafCard({ kind, seed });
    const m = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.85, color });
    m.userData.leafTex = t;
    return m;
  };
  M.oliveLeaf = leaf('olive', 61);
  M.cypressLeaf = leaf('cypress', 63);
  M.lavender = leaf('lavender', 65);
  M.grass = leaf('grass', 67);
  M.shrubLeaf = leaf('shrub', 69);
  for (const k of ['oliveLeaf', 'cypressLeaf', 'lavender', 'grass', 'shrubLeaf']) {
    M[k + 'Depth'] = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: M[k].map, alphaTest: 0.4 });
  }
  M.foliageSolid = std({ color: 0x4f5c3c, roughness: 0.9 });
  M.cypressSolid = std({ color: 0x2c3a26, roughness: 0.95 });
  await onStep('Foliage');

  // Original artworks.
  M.art = {};
  for (const [k, seed] of [['fields', 3], ['gesture', 5], ['horizon', 7], ['circles', 9], ['lines', 11], ['olive', 13]]) {
    M.art[k] = new THREE.MeshStandardMaterial({ map: T.artwork(k, seed), roughness: 0.9 });
  }
  await onStep('Art collection');

  // Interior finishes receive slightly less sky light: the environment map
  // stands in for bounce light, which is weaker under a roof.
  for (const k of ['travFloor', 'plaster', 'ceiling', 'oakFloor', 'oak', 'walnut', 'walnutV', 'linen', 'linenWhite', 'linenSand', 'linenOlive', 'linenCharcoal', 'boucle', 'rug', 'rug2', 'spaStone', 'travCladInt', 'velvetOlive', 'travSlab', 'travSlabHoned', 'marble', 'leather', 'leatherDark', 'towel', 'towelOlive', 'ceramicMatte']) {
    M[k].envMapIntensity = 0.42;
    M[k].userData.interior = true;
  }

  M.contactTex = T.contactShadow();
  M.softRectTex = T.softRect();
  M.waterNormals = T.waterNormals({});
  return M;
}

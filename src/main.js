import './style.css';
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/300-italic.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/jost/300.css';
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { configureTextures } from './lib/textures.js';
import { createMaterials } from './lib/materials.js';
import { Builder, mergeStatic } from './lib/geo.js';
import { buildVilla } from './world/villa.js';
import { furnish } from './world/interiors.js';
import { buildTerrain, buildSea, buildVegetation, furnishOutdoors, heightAt } from './world/landscape.js';
import { Environment } from './world/environment.js';
import { roomAt } from './world/plan.js';
import { KEYFRAMES, TOTAL_WEIGHT, sample, kfAt, kfIndex } from './journey/path.js';
import { UI } from './ui/ui.js';

gsap.registerPlugin(ScrollTrigger);

const params = new URLSearchParams(location.search);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('reduced');
const coarse = window.matchMedia('(pointer: coarse)').matches;
const small = Math.min(window.innerWidth, window.innerHeight) < 700;
const LOW = params.get('q') === 'low' || ((coarse || small) && params.get('q') !== 'high');
const ULTRA = params.get('q') === 'ultra';
const Q = {
  // Ultra renders at the display's native resolution (e.g. full 4K).
  pixelRatio: Math.min(window.devicePixelRatio || 1, LOW ? 1.35 : ULTRA ? 3 : 1.75),
  shadow: LOW ? 2048 : ULTRA ? 8192 : 4096,
  ao: !LOW && params.get('ao') !== '0',
  bloom: params.get('bloom') !== '0',
  textures: LOW ? 0.5 : 1,
  vegetation: LOW ? 0.45 : 1,
  samples: LOW ? 2 : 4,
};

// Journey targets used by the room selector and locator ticks.
const NAV = {
  hall: kfAt('hall'), living: kfAt('living'), kitchen: kfAt('kitchen'), dining: kfAt('dining'),
  master: kfAt('master'), dressing: kfAt('dressing'), spa: kfAt('spa'), guest: kfAt('guest'),
  gallery: kfAt('gallery'), outdoor: kfAt('outdoor'), arrival: kfAt('arrival'), restart: 0,
};

const tick = () => new Promise((r) => requestAnimationFrame(() => r()));
const EXPOSURE = 0.62;
const WINDOW = 3.2;

// GTAO that ignores glass, water, decals and alpha-tested foliage (which the
// stock pass would otherwise render as solid quads).
class VillaGTAOPass extends GTAOPass {
  _overrideVisibility() {
    const cache = this._visibilityCache;
    this.scene.traverse((o) => {
      if (!o.visible) return;
      const m = o.material;
      if (o.isPoints || o.isLine || o.userData.noAO || (m && !Array.isArray(m) && (m.transparent || m.alphaTest > 0 || m.isShaderMaterial))) {
        o.visible = false;
        cache.push(o);
      }
    });
  }
}

async function main() {
  const ui = new UI({ onNavigate: navigate, reducedMotion, navTargets: NAV });
  const journey = document.getElementById('journey');
  const vhPerUnit = LOW ? 46 : 55;
  journey.style.height = `${Math.round(TOTAL_WEIGHT * vhPerUnit + 100)}vh`;

  // ------------------------------------------------------------ renderer
  const canvas = document.getElementById('scene');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  } catch (err) {
    ui.showError('WebGL is not available on this device.');
    throw err;
  }
  renderer.setPixelRatio(Q.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = false;
  configureTextures({ anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()), quality: Q.textures });

  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.08, 20000);
  camera.rotation.order = 'YXZ';

  // ------------------------------------------------------------- build
  const steps = ['Travertine', 'Stone', 'Marble', 'Plaster', 'Timber', 'Textiles', 'Fittings', 'Landscape', 'Foliage', 'Art collection'];
  const phrases = {
    Travertine: 'Laying travertine', Stone: 'Cutting stone', Marble: 'Book-matching marble', Plaster: 'Finishing limewash walls',
    Timber: 'Selecting oak and walnut', Textiles: 'Weaving linen', Fittings: 'Casting bronze fittings', Landscape: 'Shaping the hillside',
    Foliage: 'Planting olive trees', 'Art collection': 'Hanging the art collection',
  };
  let done = 0;
  const total = steps.length + 6;
  const step = async (label) => {
    done++;
    ui.setLoading(done / total, phrases[label] || label);
    await tick();
  };
  ui.setLoading(0.02, 'Preparing the residence');
  await tick();
  const M = await createMaterials(step);

  const villa = new THREE.Group();
  villa.name = 'villa';
  scene.add(villa);
  const B = new Builder(villa);
  B.contactTex = M.contactTex;
  B.rectTex = M.softRectTex;
  const anim = buildVilla(B, M);
  await step('Raising the walls');
  const interior = furnish(B, M);
  await step('Furnishing the rooms');
  const outdoor = furnishOutdoors(B, M);
  const stats = mergeStatic(villa);
  await step('Composing the terraces');

  const terrain = buildTerrain(M);
  scene.add(terrain);
  const sea = buildSea(M);
  scene.add(sea.mesh);
  scene.add(buildVegetation(M, B, { quality: Q.vegetation }));
  await step('Planting the garden');

  const env = new Environment(renderer, scene, { shadowSize: Q.shadow });
  env.sky.userData.noAO = true;
  await step('Setting the sun');

  // Light pool: a handful of point lights reassigned to the room fixtures
  // nearest the camera, so shader cost stays constant across the villa.
  const fixtures = [...interior.lights, ...outdoor.lights];
  const POOL = LOW ? 4 : 6;
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const l = new THREE.PointLight(0xffffff, 0, 16, 2);
    scene.add(l);
    pool.push(l);
  }

  // Window-light pool: area lights placed on the glazing nearest the camera.
  RectAreaLightUniformsLib.init();
  const windows = anim.windows.map(([x, y, z, w, h, tx, ty, tz, k]) => ({
    pos: new THREE.Vector3(x, y, z), w, h, target: new THREE.Vector3(tx, ty, tz), k,
  }));
  const WPOOL = LOW ? 2 : 3;
  const wpool = [];
  for (let i = 0; i < WPOOL; i++) {
    const l = new THREE.RectAreaLight(0xffffff, 0, 1, 1);
    scene.add(l);
    wpool.push(l);
  }
  const daylight = new THREE.Color(0xe4ecf2);
  const golden = new THREE.Color(0xffc48a);
  const winColor = new THREE.Color();

  // ---------------------------------------------------------- post
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: Q.samples });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(Q.pixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;
  if (Q.ao) {
    gtao = new VillaGTAOPass(scene, camera, window.innerWidth, window.innerHeight);
    gtao.blendIntensity = 0.85;
    gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.5, thickness: 1.2, scale: 1.0, samples: 12 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    composer.addPass(gtao);
  }
  let bloom = null;
  if (Q.bloom) {
    bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.2, 0.35, 3.2);
    composer.addPass(bloom);
  }
  composer.addPass(new OutputPass());

  // ---------------------------------------------------------- scroll
  let lenis = null;
  if (!reducedMotion) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.85, touchMultiplier: 1.4, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  let targetP = 0;
  ScrollTrigger.create({
    trigger: journey, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => { targetP = self.progress; },
  });
  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
  ui.onPanel = (open) => (open ? lenis?.stop() : lenis?.start());

  function navigate(id) {
    const p = NAV[id] ?? 0;
    const y = p * maxScroll();
    if (reducedMotion || !lenis) {
      window.scrollTo(0, y);
      // Jump the camera directly — no long cinematic transit.
      progress = targetP = p;
      return;
    }
    const dist = Math.abs(y - window.scrollY) / window.innerHeight;
    lenis.start();
    lenis.scrollTo(y, { duration: Math.min(6, 1.6 + dist * 0.06), easing: (t) => 1 - Math.pow(1 - t, 3) });
  }

  // ------------------------------------------------------------ frame
  let progress = 0;
  if (params.has('p')) {
    progress = targetP = parseFloat(params.get('p'));
    requestAnimationFrame(() => window.scrollTo(0, progress * maxScroll()));
  }
  const s = {};
  const clock = new THREE.Clock();
  let exposure = 1;
  let elapsed = 0;
  const camPos = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const doorStart = kfAt('door');
  const doorEnd = KEYFRAMES[kfIndex('door') + 1].at;
  const sliderStart = KEYFRAMES[kfIndex('slider') - 2].at;
  const sliderEnd = KEYFRAMES[kfIndex('slider') - 1].at;
  const heroEnd = KEYFRAMES[1].at * 0.7;
  const finaleStart = kfAt('finale');
  const ledExtBase = M.ledExt.userData.base;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    ScrollTrigger.refresh();
  }
  window.addEventListener('resize', resize);

  // Frame-time watchdog: shed AO, then resolution, on slow GPUs.
  let slowFrames = 0;
  let watch = 0;

  function frame() {
    const dt = Math.min(0.1, clock.getDelta());
    elapsed += dt;
    // Additional camera inertia on top of smooth scrolling.
    const k = reducedMotion ? 30 : 5.5;
    progress += (targetP - progress) * (1 - Math.exp(-dt * k));
    if (Math.abs(targetP - progress) < 1e-6) progress = targetP;
    sample(progress, s);

    // Camera: authored path + an almost imperceptible handheld breath.
    camPos.copy(s.pos);
    let yaw = s.yaw;
    let pitch = s.pitch;
    if (!reducedMotion) {
      const still = 1 - Math.min(1, Math.abs(targetP - progress) * 400);
      const b = 0.5 + 0.5 * still;
      camPos.x += Math.sin(elapsed * 0.31) * 0.025 * b;
      camPos.y += Math.sin(elapsed * 0.43 + 1) * 0.018 * b;
      yaw += Math.sin(elapsed * 0.21) * 0.0035 * b;
      pitch += Math.sin(elapsed * 0.27 + 2) * 0.002 * b;
    }
    camera.position.copy(camPos);
    camera.rotation.set(pitch, yaw, 0);
    // FOV: authored per shot, widened on portrait screens.
    let fov = s.fov;
    const aspect = camera.aspect;
    if (aspect < 1.25) {
      const h = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) * 1.5);
      fov = Math.min(82, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(h / 2) / aspect)));
    }
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    // Architecture that responds to the visitor.
    anim.doors.set(THREE.MathUtils.smoothstep(progress, doorStart, doorEnd + (doorEnd - doorStart) * 0.4));
    anim.slider.set(THREE.MathUtils.smoothstep(progress, sliderStart, sliderEnd));

    // Light: time of day, exposure, shadows.
    env.setTime(s.time);
    exposure += (s.exp - exposure) * (1 - Math.exp(-dt * 3));
    renderer.toneMappingExposure = exposure * EXPOSURE;
    camera.getWorldDirection(fwd);
    tmp.copy(camPos).addScaledVector(fwd, s.shadow * 0.45);
    tmp.y = 0;
    env.fitShadow(tmp, s.shadow);

    // Exterior lighting comes up toward golden hour.
    const dusk = THREE.MathUtils.smoothstep(s.time, 0.55, 1.0);
    M.ledExt.color.copy(ledExtBase).multiplyScalar(0.4 + dusk * 5);

    // Light pool.
    const ranked = fixtures
      .map((f) => ({ f, d: f.pos.distanceTo(camPos) }))
      .sort((a, b) => a.d - b.d);
    for (let i = 0; i < POOL; i++) {
      const r = ranked[i];
      const l = pool[i];
      const fade = 1 - THREE.MathUtils.smoothstep(r.d, 9, 15);
      l.position.copy(r.f.pos);
      l.color.copy(r.f.color);
      l.intensity = r.f.intensity * fade * (r.f.dusk ? 0.3 + dusk : 1) * 4;
    }

    // Window light.
    winColor.copy(daylight).lerp(golden, THREE.MathUtils.smoothstep(s.time, 0.4, 1));
    const wr = windows
      .map((w) => ({ w, d: Math.max(0, w.pos.distanceTo(camPos) - Math.max(w.w, w.h) * 0.35) }))
      .sort((a, b) => a.d - b.d);
    for (let i = 0; i < WPOOL; i++) {
      const { w, d } = wr[i];
      const l = wpool[i];
      l.position.copy(w.pos);
      l.width = w.w;
      l.height = w.h;
      const vertical = Math.abs(w.target.y - w.pos.y) > Math.max(Math.abs(w.target.x - w.pos.x), Math.abs(w.target.z - w.pos.z)) * 3;
      l.up.set(0, vertical ? 0 : 1, vertical ? 1 : 0);
      l.lookAt(w.target);
      l.color.copy(winColor);
      l.intensity = w.k * WINDOW * (1 - THREE.MathUtils.smoothstep(d, 8, 16)) * (1 - 0.5 * dusk);
    }

    // Water and fire.
    for (const t of anim.pool.normals) t.offset.set(elapsed * 0.012, elapsed * 0.008);
    anim.pool.normals[1].offset.set(-elapsed * 0.009, elapsed * 0.013);
    sea.normals[0].offset.set(elapsed * 0.0015, elapsed * 0.001);
    sea.normals[1].offset.set(-elapsed * 0.001, elapsed * 0.0018);
    for (const f of interior.anim.fire) {
      const ph = f.userData.phase;
      const fl = 0.75 + 0.25 * Math.sin(elapsed * 7 + ph) * Math.sin(elapsed * 3.1 + ph * 2);
      f.scale.set(0.9 + 0.1 * Math.sin(elapsed * 5 + ph), fl, 1);
      f.position.y = 0.48 + fl * 0.2;
    }

    // Where is the visitor? Labels follow the camera's actual position.
    const room = roomAt(camPos.x, camPos.z);
    let state;
    if (progress < heroEnd) state = 'hero';
    else if (room && camPos.y < 4.5) state = room.id;
    else if (progress < kfAt('threshold')) state = 'arrival';
    else if (progress >= finaleStart - 0.005) state = 'finale';
    else state = 'outdoor';
    const hero = 1 - THREE.MathUtils.smoothstep(progress, 0, heroEnd);
    const finale = THREE.MathUtils.smoothstep(progress, finaleStart + (1 - finaleStart) * 0.35, 0.995);
    ui.update({ progress, state, hero, finale });

    renderer.info.reset();
    composer.render(dt);

    // Adaptive quality.
    if (elapsed > 3 && watch < 400) {
      watch++;
      if (dt > 0.045) slowFrames++;
      if (watch === 120 && slowFrames > 70) {
        if (gtao) {
          gtao.enabled = false;
          gtao = null;
        } else if (renderer.getPixelRatio() > 1) {
          renderer.setPixelRatio(1);
          composer.setPixelRatio(1);
          resize();
        }
        watch = 0;
        slowFrames = 0;
      }
    }
  }

  // Compile shaders up front to avoid hitches mid-journey.
  ui.setLoading(0.94, 'Lighting the residence');
  await tick();
  sample(progress, s);
  camera.position.copy(s.pos);
  camera.rotation.set(s.pitch, s.yaw, 0);
  try {
    await renderer.compileAsync(scene, camera);
  } catch (e) {
    renderer.compile(scene, camera);
  }
  frame();
  ui.setLoading(1, 'Welcome');
  ui.hideLoader();
  renderer.setAnimationLoop(frame);

  // Test / QA hooks.
  window.__villa = {
    colliders: B.colliders, KEYFRAMES, sample, stats, heightAt, roomAt,
    setProgress: (p) => { progress = targetP = p; },
    getState: () => ({ progress, target: targetP, camera: camera.position.toArray(), state: ui.current, room: roomAt(camera.position.x, camera.position.z)?.id ?? null }),
    renderInfo: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, programs: renderer.info.programs.length }),
    navigate,
    // Deterministic single-frame render for automated screenshots.
    renderAt: (p) => {
      renderer.setAnimationLoop(null);
      progress = targetP = p;
      sample(p, s);
      exposure = s.exp;
      const t0 = performance.now();
      frame();
      return performance.now() - t0;
    },
    resume: () => renderer.setAnimationLoop(frame),
    ready: true,
  };
}

main().catch((err) => {
  console.error(err);
  const t = document.getElementById('loader-text');
  if (t) t.textContent = 'This experience needs WebGL 2 — please try a current browser.';
});

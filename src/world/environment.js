import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

// Sky dome, sun, hemisphere fill and an environment map generated from the
// sky itself (so reflections in glass, water and stone match the light).

export class Environment {
  constructor(renderer, scene, { shadowSize = 4096 } = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.sky = new Sky();
    this.sky.scale.setScalar(45000);
    this.sky.material.depthWrite = false;
    scene.add(this.sky);
    const u = this.sky.material.uniforms;
    u.turbidity.value = 3.2;
    u.rayleigh.value = 1.1;
    u.mieCoefficient.value = 0.004;
    u.mieDirectionalG.value = 0.82;

    this.sun = new THREE.DirectionalLight(0xffe4c4, 3.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(shadowSize, shadowSize);
    this.sun.shadow.bias = -0.00025;
    this.sun.shadow.normalBias = 0.035;
    const cam = this.sun.shadow.camera;
    cam.near = 1;
    cam.far = 400;
    scene.add(this.sun, this.sun.target);

    this.hemi = new THREE.HemisphereLight(0xdfe8f0, 0x8a7a62, 0.35);
    scene.add(this.hemi);

    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.envScene = new THREE.Scene();
    this.envSky = new Sky();
    this.envSky.scale.setScalar(1000);
    Object.assign(this.envSky.material.uniforms.turbidity, u.turbidity);
    this.envScene.add(this.envSky);
    // A warm ground plane inside the env scene so lower hemisphere
    // reflections pick up the landscape rather than the sky's underside.
    const groundEnv = new THREE.Mesh(new THREE.CircleGeometry(900, 32), new THREE.MeshBasicMaterial({ color: 0x5a5244, side: THREE.DoubleSide }));
    groundEnv.rotation.x = -Math.PI / 2;
    groundEnv.position.y = -10;
    this.envScene.add(groundEnv);
    this.groundEnv = groundEnv;
    this.envRT = null;
    this.lastEnvKey = '';

    this.sunDir = new THREE.Vector3();
    this.fog = new THREE.FogExp2(0xd9d4c8, 0.00011);
    scene.fog = this.fog;
    this.setTime(0);
  }

  // t: 0 = late afternoon, 1 = golden hour.
  setTime(t) {
    const elev = THREE.MathUtils.lerp(30, 6.5, t);
    const azim = THREE.MathUtils.lerp(50, 36, t); // degrees south of west
    const phi = THREE.MathUtils.degToRad(90 - elev);
    const az = THREE.MathUtils.degToRad(azim);
    // West = -x, south = +z.
    this.sunDir.set(-Math.cos(az), 0, Math.sin(az)).multiplyScalar(Math.sin(phi));
    this.sunDir.y = Math.cos(phi);
    this.sunDir.normalize();
    const u = this.sky.material.uniforms;
    u.sunPosition.value.copy(this.sunDir);
    u.turbidity.value = THREE.MathUtils.lerp(2.2, 6.0, t);
    u.rayleigh.value = THREE.MathUtils.lerp(1.4, 2.6, t);
    u.mieCoefficient.value = THREE.MathUtils.lerp(0.003, 0.006, t);
    u.mieDirectionalG.value = THREE.MathUtils.lerp(0.74, 0.86, t);
    const eu = this.envSky.material.uniforms;
    for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) eu[k].value = u[k].value;
    eu.sunPosition.value.copy(this.sunDir);

    const warm = new THREE.Color(0xffe6c8).lerp(new THREE.Color(0xffa45e), t);
    this.sun.color.copy(warm);
    this.sun.intensity = THREE.MathUtils.lerp(3.4, 2.6, t);
    this.hemi.intensity = THREE.MathUtils.lerp(0.35, 0.22, t);
    this.hemi.color.set(0xdfe8f0).lerp(new THREE.Color(0xf2c9a0), t);
    this.fog.color.set(0xd8d6cc).lerp(new THREE.Color(0xe9c39a), t);
    this.groundEnv.material.color.set(0x5a5244).lerp(new THREE.Color(0x4a3a2a), t);
    this.time = t;
    const key = (Math.round(t * 25) / 25).toFixed(2);
    if (key !== this.lastEnvKey) {
      this.lastEnvKey = key;
      this.updateEnv();
    }
  }

  updateEnv() {
    const rt = this.pmrem.fromScene(this.envScene, 0, 0.1, 2000, { size: 256 });
    if (this.envRT) this.envRT.dispose();
    this.envRT = rt;
    this.scene.environment = rt.texture;
  }

  // Keep the shadow frustum tight around what the camera is looking at.
  fitShadow(focus, radius) {
    const cam = this.sun.shadow.camera;
    const size = this.sun.shadow.mapSize.x;
    // Snap the focus to shadow texels to avoid shimmering while moving.
    const texel = (radius * 2) / size;
    const lightSpace = new THREE.Matrix4().lookAt(new THREE.Vector3(), this.sunDir.clone().negate(), new THREE.Vector3(0, 1, 0));
    const inv = lightSpace.clone().invert();
    const f = focus.clone().applyMatrix4(inv);
    f.x = Math.round(f.x / texel) * texel;
    f.y = Math.round(f.y / texel) * texel;
    f.applyMatrix4(lightSpace);
    cam.left = -radius;
    cam.right = radius;
    cam.top = radius;
    cam.bottom = -radius;
    cam.updateProjectionMatrix();
    this.sun.position.copy(f).addScaledVector(this.sunDir, 160);
    this.sun.target.position.copy(f);
    this.sun.target.updateMatrixWorld();
  }
}

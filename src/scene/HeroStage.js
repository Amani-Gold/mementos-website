import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/*
 * HeroStage — a dark, cinematic product-render stage dedicated to the hero
 * album. Separate from the light collections Stage so the two scenes never
 * fight over theme. Rich near-black graded backdrop, a warm key light from the
 * upper right, a cool rim for edge separation, and a soft contact shadow — the
 * mood of the reference: dramatic, dimensional, luxurious.
 */
export class HeroStage {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true, // transparent so the CSS backdrop gradient shows through
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();

    // Perspective for a 3/4 hero framing; album is shifted in object space.
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(0, 0.35, 6.2);
    this.camera.lookAt(0, -0.1, 0);

    this._buildEnvironment();
    this._buildLights();
    this._buildShadowCatcher();

    this.resize();
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
  }

  _buildEnvironment() {
    // Dim the room env so reflections read on the foil/board without lifting
    // the whole scene to daylight. Reflections only — not the background.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(env, 0.02).texture;
    this.scene.environmentIntensity = 0.35;
    env.dispose?.();
    pmrem.dispose();
  }

  _buildLights() {
    // Low ambient base so the blacks stay rich.
    this.scene.add(new THREE.HemisphereLight('#3a3026', '#050403', 0.35));

    // Warm key light — dramatic, from the upper right, casts the shadow.
    const key = new THREE.DirectionalLight('#ffe6c2', 3.1);
    key.position.set(5.5, 7, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    key.shadow.bias = -0.0004;
    key.shadow.radius = 7;
    this.scene.add(key);
    this.key = key;

    // Cool rim/back light for premium edge separation against the dark.
    const rim = new THREE.DirectionalLight('#bcd2ff', 1.1);
    rim.position.set(-4, 3.5, -5);
    this.scene.add(rim);

    // Soft warm fill so shadow sides aren't crushed to pure black.
    const fill = new THREE.DirectionalLight('#ffd9a8', 0.5);
    fill.position.set(-3.5, 1.5, 4);
    this.scene.add(fill);
  }

  _buildShadowCatcher() {
    // Invisible ground that only receives the album's contact shadow, so the
    // album reads as floating over a soft pool of shadow (like the reference).
    const geo = new THREE.PlaneGeometry(40, 40);
    const mat = new THREE.ShadowMaterial({ opacity: 0.5 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.35;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.ground = ground;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
  }
}

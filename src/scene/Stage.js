import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/*
 * The Stage owns the renderer, camera, lighting and the soft studio
 * environment that gives the foil its metallic reflections. Everything is
 * tuned for a bright, warm, light-mode product film — no dark mode.
 */
export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f2ece1');

    // Soft, warm distance fog keeps the seamless-backdrop feel.
    this.scene.fog = new THREE.Fog('#f2ece1', 9, 22);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(0, 1.6, 6);

    this._buildEnvironment();
    this._buildLights();
    this._buildBackdrop();

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  _buildEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(env, 0.04).texture;
    env.dispose?.();
    pmrem.dispose();
  }

  _buildLights() {
    // Gentle ambient base
    this.scene.add(new THREE.HemisphereLight('#fff6e8', '#c2b39a', 0.36));

    // Key light — soft window light from upper left, casts the shadow
    const key = new THREE.DirectionalLight('#fff3e0', 2.7);
    key.position.set(-4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    key.shadow.bias = -0.0002;
    key.shadow.radius = 2.5;
    this.scene.add(key);
    this.key = key;

    // Warm fill from the right to lift shadows
    const fill = new THREE.DirectionalLight('#ffe9cf', 0.45);
    fill.position.set(5, 3, 4);
    this.scene.add(fill);

    // Subtle rim/back light for separation
    const rim = new THREE.DirectionalLight('#ffffff', 0.6);
    rim.position.set(2, 5, -6);
    this.scene.add(rim);
  }

  _buildBackdrop() {
    // Large soft ground that receives the album's contact shadow.
    const geo = new THREE.PlaneGeometry(60, 60);
    const mat = new THREE.MeshStandardMaterial({
      color: '#e9dfcd',
      roughness: 0.88,
      metalness: 0,
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.001;
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
}

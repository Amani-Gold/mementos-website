import * as THREE from 'three';

/*
 * An elegant light-mode Earth with thin gold shipping arcs rising between
 * points. No courier branding, planes or trucks — a calm, premium suggestion
 * of worldwide delivery. The globe texture is generated procedurally (seamless
 * 3D value-noise continents) in a warm ivory-land / soft-blue-ocean palette.
 */

// --- seamless 3D value noise ---
function hash(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
const smoothstep = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = smoothstep(xf), v = smoothstep(yf), w = smoothstep(zf);
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  const x00 = mix(c(0, 0, 0), c(1, 0, 0), u);
  const x10 = mix(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = mix(c(0, 0, 1), c(1, 0, 1), u);
  const x11 = mix(c(0, 1, 1), c(1, 1, 1), u);
  return mix(mix(x00, x10, v), mix(x01, x11, v), w);
}
function fbm(x, y, z) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < 5; i++) {
    s += a * vnoise(x * f, y * f, z * f);
    f *= 2;
    a *= 0.5;
  }
  return s;
}

function earthTexture() {
  const w = 1024, h = 512;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  const img = x.createImageData(w, h);
  const d = img.data;
  const ocean = [205, 219, 224]; // soft pale blue-grey
  const oceanDeep = [183, 203, 211];
  const land = [221, 205, 178]; // warm ivory sand
  const landHi = [233, 220, 196];
  const coast = [198, 178, 146];
  const ice = [243, 240, 233];
  const freq = 2.4;

  for (let j = 0; j < h; j++) {
    const lat = (j / h) * Math.PI - Math.PI / 2;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let i = 0; i < w; i++) {
      const lon = (i / w) * 2 * Math.PI;
      const dx = cl * Math.cos(lon), dy = sl, dz = cl * Math.sin(lon);
      let n = fbm(dx * freq + 1.3, dy * freq + 4.7, dz * freq + 9.1);
      // bias toward more ocean
      const e = n - 0.52;
      let col;
      if (e > 0.0) {
        const t = Math.min(1, e * 4);
        col = [mix(coast[0], landHi[0], t), mix(land[1], landHi[1], t), mix(land[2], landHi[2], t)];
      } else {
        const t = Math.min(1, -e * 5);
        col = [mix(ocean[0], oceanDeep[0], t), mix(ocean[1], oceanDeep[1], t), mix(ocean[2], oceanDeep[2], t)];
      }
      // polar ice
      const polar = Math.max(0, Math.abs(j / h - 0.5) * 2 - 0.82) / 0.18;
      if (polar > 0) col = [mix(col[0], ice[0], polar), mix(col[1], ice[1], polar), mix(col[2], ice[2], polar)];
      const o = (j * w + i) * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function createWorldMap(radius = 2) {
  const group = new THREE.Group();

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 96, 96),
    new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.92, metalness: 0, envMapIntensity: 0.5 }),
  );
  earth.castShadow = true;
  earth.receiveShadow = true;
  group.add(earth);

  // gold shipping arcs over the surface
  const goldMat = new THREE.MeshStandardMaterial({ color: '#c8a25c', metalness: 1, roughness: 0.3, envMapIntensity: 1.2 });
  const endDotMat = new THREE.MeshStandardMaterial({ color: '#d8b673', emissive: '#7a5a22', emissiveIntensity: 0.4, metalness: 1, roughness: 0.3 });
  const randPt = () => {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    return new THREE.Vector3(r * Math.cos(th), u, r * Math.sin(th)).multiplyScalar(radius);
  };
  for (let i = 0; i < 6; i++) {
    const a = randPt();
    let b = randPt();
    while (b.distanceTo(a) < radius) b = randPt();
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(radius * 1.4);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.012, 8, false), goldMat));
    for (const p of [a, b]) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), endDotMat);
      dot.position.copy(p);
      group.add(dot);
    }
  }

  group.userData.dots = earth; // rotate the earth on scroll
  group.visible = false;
  return { group };
}

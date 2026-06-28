import * as THREE from 'three';

/*
 * An elegant light-mode "worldwide" scene: a soft dot-globe with thin gold
 * shipping arcs rising between points. No courier branding, planes or trucks —
 * just a calm, premium suggestion of global delivery.
 */
function discTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.beginPath();
  x.arc(32, 32, 32, 0, Math.PI * 2);
  x.fill();
  const t = new THREE.CanvasTexture(c);
  return t;
}

export function createWorldMap(radius = 2) {
  const group = new THREE.Group();
  const disc = discTexture();

  // --- dot globe (fibonacci sphere) ---
  const N = 900;
  const pos = new Float32Array(N * 3);
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const v = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(radius);
    v.toArray(pos, i * 3);
    pts.push(v);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dots = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: '#8a6f57',
      size: 0.055,
      map: disc,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  group.add(dots);

  // a soft solid core so back dots don't read through too strongly
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.985, 48, 48),
    new THREE.MeshStandardMaterial({ color: '#f3ece1', roughness: 1, metalness: 0 }),
  );
  group.add(core);

  // --- gold shipping arcs ---
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#c8a25c',
    metalness: 1,
    roughness: 0.3,
    envMapIntensity: 1.2,
  });
  const endDotMat = new THREE.MeshStandardMaterial({
    color: '#d8b673',
    emissive: '#7a5a22',
    emissiveIntensity: 0.4,
    metalness: 1,
    roughness: 0.3,
  });
  const arcs = [];
  const pick = () => pts[Math.floor(Math.random() * pts.length)].clone();
  for (let i = 0; i < 6; i++) {
    const a = pick();
    let b = pick();
    while (b.distanceTo(a) < radius) b = pick();
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(radius * 1.45);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.012, 8, false), goldMat);
    tube.userData.curve = curve;
    group.add(tube);
    arcs.push(tube);
    for (const p of [a, b]) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), endDotMat);
      dot.position.copy(p);
      group.add(dot);
    }
  }

  group.userData.dots = dots;
  group.visible = false;
  return { group };
}

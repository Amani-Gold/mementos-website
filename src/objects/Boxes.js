import * as THREE from 'three';
import { linenMaterialSet, coverTextures } from '../materials/textures.js';

/*
 * Procedural Mementos Studio presentation boxes, built to the real collection
 * constructions (references: Collections/ + reference frames):
 *   Standard – slim linen clamshell with a flat foiled lid
 *   Luxury   – deeper hinged linen box with a gold clasp
 *   Sliding  – linen slipcase the album slides into (open front, thumb notch)
 *   Pocket   – linen tray with a clear acrylic window lid
 * Plus a branded shipping Mailer. Colours sampled from the references.
 */

const COLORS = {
  standard: '#b6a08d',
  luxury: '#92644b',
  sliding: '#c7ae9f',
  pocket: '#a47f69',
  mailer: '#efe7da',
};

function linenMat(hex, repeat = 2) {
  const set = linenMaterialSet(hex, { repeat });
  return new THREE.MeshStandardMaterial({
    map: set.map,
    bumpMap: set.bumpMap,
    bumpScale: 0.004,
    roughness: set.roughness,
    metalness: 0,
    envMapIntensity: 0.7,
  });
}

const ivory = () => new THREE.MeshStandardMaterial({ color: '#e9e0cf', roughness: 0.85, metalness: 0 });
const gold = () =>
  new THREE.MeshStandardMaterial({ color: '#c8a25c', metalness: 1, roughness: 0.32, envMapIntensity: 1.2 });

/* Dark walnut wood with a subtle vertical grain. */
function woodMat() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#3a241a';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 2) {
    const v = 26 + Math.round(Math.random() * 26 + 18 * Math.sin(i * 0.12));
    x.fillStyle = `rgb(${v + 24},${v + 8},${v})`;
    x.globalAlpha = 0.25 + Math.random() * 0.2;
    x.fillRect(i, 0, 1, 256);
  }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.45, metalness: 0, envMapIntensity: 0.8 });
}

const woodEngraveMat = () =>
  new THREE.MeshStandardMaterial({ color: '#1c0f07', roughness: 0.6, metalness: 0 });

/*
 * Rounded-edge box. Real fabric-wrapped board has a soft radiused edge where
 * the linen turns the corner, and that edge catches a thin highlight — it is
 * the single biggest thing separating a photographed box from a CG one, so
 * every single-material part is built with a chamfer rather than hard 90°
 * corners. Falls back to a plain box if the radius would be degenerate.
 */
function roundedBoxGeo(w, h, d, r) {
  r = Math.min(r, w / 2.2, h / 2.2, d / 2.2);
  if (!(r > 0.0005)) return new THREE.BoxGeometry(w, h, d);
  const hw = w / 2 - r;
  const hh = h / 2 - r;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, -h / 2);
  shape.lineTo(hw, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -hh);
  shape.lineTo(w / 2, hh);
  shape.quadraticCurveTo(w / 2, h / 2, hw, h / 2);
  shape.lineTo(-hw, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, hh);
  shape.lineTo(-w / 2, -hh);
  shape.quadraticCurveTo(-w / 2, -h / 2, -hw, -h / 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, d - r * 2),
    bevelEnabled: true,
    bevelSize: r,
    bevelThickness: r,
    bevelSegments: 2,
    curveSegments: 3,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

function solidBox(w, h, d, mat) {
  const m = new THREE.Mesh(roundedBoxGeo(w, h, d, Math.min(w, h, d) * 0.09), mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/* A rectangular frame border (4 bars) in the XY plane, thickness in Z. */
function frameXY(w, h, bar, depth, mat) {
  const g = new THREE.Group();
  const top = solidBox(w, bar, depth, mat); top.position.y = h / 2 - bar / 2;
  const bot = solidBox(w, bar, depth, mat); bot.position.y = -h / 2 + bar / 2;
  const left = solidBox(bar, h - bar * 2, depth, mat); left.position.x = -w / 2 + bar / 2;
  const right = solidBox(bar, h - bar * 2, depth, mat); right.position.x = w / 2 - bar / 2;
  g.add(top, bot, left, right);
  return g;
}

/* A solid, closed picture frame (one piece) with a rectangular window. */
function pictureFrame(outer, bar, depth, mat) {
  const o = outer / 2;
  const inn = outer / 2 - bar;
  const shape = new THREE.Shape();
  shape.moveTo(-o, -o);
  shape.lineTo(o, -o);
  shape.lineTo(o, o);
  shape.lineTo(-o, o);
  shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-inn, -inn);
  hole.lineTo(-inn, inn);
  hole.lineTo(inn, inn);
  hole.lineTo(inn, -inn);
  hole.closePath();
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function acrylicMat() {
  // Clear acrylic via transparency + reflection (no transmission, so it stays
  // light and renders reliably on software GL too).
  return new THREE.MeshPhysicalMaterial({
    color: '#eef1f2',
    metalness: 0,
    roughness: 0.06,
    transparent: true,
    opacity: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.4,
  });
}

/* A shallow tray (open top): bottom + 4 walls, linen outside / ivory inside. */
function tray(w, h, d, hex, wall = 0.06) {
  const g = new THREE.Group();
  const ext = linenMat(hex);
  const inn = ivory();
  g.add(solidBox(w, wall, d, ext)).children[0].position.y = wall / 2;
  const mkWall = (ww, dd, x, z) => {
    const wall1 = solidBox(ww, h, dd, ext);
    wall1.position.set(x, h / 2, z);
    g.add(wall1);
  };
  mkWall(w, wall, 0, d / 2 - wall / 2);
  mkWall(w, wall, 0, -d / 2 + wall / 2);
  mkWall(wall, d, w / 2 - wall / 2, 0);
  mkWall(wall, d, -w / 2 + wall / 2, 0);
  // inner floor liner
  const liner = solidBox(w - wall * 2, 0.01, d - wall * 2, inn);
  liner.position.y = wall + 0.005;
  g.add(liner);
  return g;
}

export function createBoxes(albumSize = 1.7) {
  const S = albumSize + 0.22; // box footprint
  const group = new THREE.Group();
  const boxes = {};

  // --- Standard: slim clamshell, foiled lid + foiled album inside ---
  {
    const b = new THREE.Group();
    const base = tray(S, 0.16, S, COLORS.standard);
    b.add(base);

    // the album seated inside, gold foil names on the cover
    const albCov = coverTextures({ baseHex: '#d8c4a6', foil: 'gold' });
    const albMat = new THREE.MeshStandardMaterial({
      map: albCov.map, metalnessMap: albCov.metalnessMap, roughnessMap: albCov.roughnessMap,
      bumpMap: albCov.bumpMap, bumpScale: 0.006, metalness: 1, roughness: 1, envMapIntensity: 1.15,
    });
    const albEdge = linenMat('#d8c4a6');
    const inAlbum = new THREE.Mesh(
      new THREE.BoxGeometry(S - 0.14, 0.1, S - 0.14),
      [albEdge, albEdge, albMat, ivory(), albEdge, albEdge],
    );
    inAlbum.position.set(0, 0.16 - 0.05, 0);
    inAlbum.castShadow = true;
    b.add(inAlbum);

    // hinged lid: linen with its own gold foil names, opens to reveal the album
    const lidCov = coverTextures({ baseHex: COLORS.standard, foil: 'gold' });
    const lidTop = new THREE.MeshStandardMaterial({
      map: lidCov.map, metalnessMap: lidCov.metalnessMap, roughnessMap: lidCov.roughnessMap,
      bumpMap: lidCov.bumpMap, bumpScale: 0.006, metalness: 1, roughness: 1, envMapIntensity: 1.15,
    });
    const lidSide = linenMat(COLORS.standard);
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.16, -S / 2); // hinge at back top edge
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(S + 0.02, 0.05, S + 0.02),
      [lidSide, lidSide, lidTop, ivory(), lidSide, lidSide],
    );
    lid.position.set(0, 0.025, S / 2); // extend forward from hinge
    lid.castShadow = true;
    lidPivot.add(lid);
    lidPivot.rotation.x = -1.25; // open
    b.add(lidPivot);
    b.userData.lid = lidPivot;

    boxes.standard = b;
    group.add(b);
  }

  // --- Luxury: deep hinged box, dark engraved wood plate on the lid ---
  {
    const b = new THREE.Group();
    const base = tray(S, 0.3, S, COLORS.luxury);
    b.add(base);

    // album seated inside the base (foil cover up), revealed when the lid opens
    const cov = coverTextures({ baseHex: '#d8c4a6', foil: 'gold' });
    const coverMat = new THREE.MeshStandardMaterial({
      map: cov.map, metalnessMap: cov.metalnessMap, roughnessMap: cov.roughnessMap,
      bumpMap: cov.bumpMap, bumpScale: 0.006, metalness: 1, roughness: 1, envMapIntensity: 1.15,
    });
    const edge = linenMat('#d8c4a6');
    const inAlbum = new THREE.Mesh(
      new THREE.BoxGeometry(S - 0.18, 0.14, S - 0.18),
      [edge, edge, coverMat, ivory(), edge, edge],
    );
    inAlbum.position.set(0, 0.13, 0);
    inAlbum.castShadow = true;
    b.add(inAlbum);
    b.userData.album = inAlbum;

    // hinged lid (hinge at back edge)
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.3, -S / 2);
    const lid = solidBox(S + 0.02, 0.05, S + 0.02, linenMat(COLORS.luxury));
    lid.position.set(0, 0.025, S / 2);
    // dark engraved wood plate inset on the lid top
    const wood = solidBox(S * 0.66, 0.03, S * 0.66, woodMat());
    wood.position.set(0, 0.065, S / 2);
    const engrave = solidBox(S * 0.34, 0.004, S * 0.16, woodEngraveMat());
    engrave.position.set(0, 0.082, S / 2);
    const stamp = solidBox(S * 0.2, 0.002, S * 0.2, gold());
    stamp.position.set(0, -0.002, S / 2); // inside-lid emblem (faces down when open)
    lidPivot.add(lid, wood, engrave, stamp);
    lidPivot.rotation.x = 0; // closed: presents the wood plate on top
    b.add(lidPivot);

    const clasp = solidBox(0.16, 0.1, 0.04, gold());
    clasp.position.set(0, 0.28, S / 2 + 0.01);
    b.add(clasp);

    b.userData.lid = lidPivot;
    boxes.luxury = b;
    group.add(b);
  }

  // --- Sliding: linen box with a framed acrylic top window ---
  {
    const b = new THREE.Group();
    const h = 0.22;
    b.add(tray(S, h, S, COLORS.sliding));

    // the album resting inside, foil cover facing up, seen through the window
    const cov = coverTextures({ baseHex: '#d8c4a6', foil: 'gold' });
    const coverMat = new THREE.MeshStandardMaterial({
      map: cov.map,
      metalnessMap: cov.metalnessMap,
      roughnessMap: cov.roughnessMap,
      bumpMap: cov.bumpMap,
      bumpScale: 0.006,
      metalness: 1,
      roughness: 1,
      envMapIntensity: 1.15,
    });
    const edge = linenMat('#d8c4a6');
    const insideAlbum = new THREE.Mesh(
      new THREE.BoxGeometry(S - 0.14, 0.07, S - 0.14),
      [edge, edge, coverMat, ivory(), edge, edge], // +y face = foil cover
    );
    insideAlbum.position.set(0, h - 0.05, 0);
    b.add(insideAlbum);

    // fixed linen frame = the window opening (stays put)
    const frame = frameXY(S, S, 0.1, 0.06, linenMat(COLORS.sliding));
    frame.rotation.x = -Math.PI / 2; // lay flat -> XZ
    frame.position.y = h + 0.03;
    b.add(frame);

    // only the transparent acrylic sheet slides within the frame
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(S - 0.16, 0.02, S - 0.16), acrylicMat());
    sheet.position.set(S * 0.42, h + 0.035, 0); // slid open toward +x
    b.add(sheet);
    b.userData.lid = sheet;

    boxes.sliding = b;
    group.add(b);
  }

  // --- Pocket: a STANDING acrylic frame displaying the album upright ---
  {
    const b = new THREE.Group();
    const fw = S * 0.92; // frame face size

    // linen foot the frame stands in
    const foot = solidBox(fw * 0.9, 0.07, 0.42, linenMat(COLORS.pocket));
    foot.position.y = 0.035;
    b.add(foot);

    const cy = 0.07 + fw / 2; // vertical centre of the upright frame

    // the album, shown upright inside the acrylic (foil cover faces the viewer)
    const cov = coverTextures({ baseHex: '#d8c4a6', foil: 'gold' });
    const coverMat = new THREE.MeshStandardMaterial({
      map: cov.map,
      metalnessMap: cov.metalnessMap,
      roughnessMap: cov.roughnessMap,
      bumpMap: cov.bumpMap,
      bumpScale: 0.006,
      metalness: 1,
      roughness: 1,
      envMapIntensity: 1.15,
    });
    const back = ivory();
    const edge = linenMat('#d8c4a6');
    const inner = new THREE.Mesh(
      new THREE.BoxGeometry(fw * 0.82, fw * 0.82, 0.06),
      [edge, edge, edge, edge, coverMat, back], // +z face = foil cover
    );
    inner.position.set(0, cy, 0);
    inner.castShadow = true;
    b.add(inner);

    // clear acrylic slab encasing it (standing upright)
    const acrylic = new THREE.Mesh(new THREE.BoxGeometry(fw, fw, 0.14), acrylicMat());
    acrylic.position.set(0, cy, 0);
    b.add(acrylic);

    // linen frame border, OPEN on the right side so the album slides in
    const fmat = linenMat(COLORS.pocket);
    const outer = fw + 0.16;
    const bar = 0.13;
    const fd = 0.2;
    const o = outer / 2;
    const top = solidBox(outer, bar, fd, fmat);
    top.position.set(0, cy + o - bar / 2, 0);
    const bottom = solidBox(outer, bar, fd, fmat);
    bottom.position.set(0, cy - o + bar / 2, 0);
    const left = solidBox(bar, outer - bar * 2, fd, fmat); // only the LEFT upright
    left.position.set(-o + bar / 2, cy, 0);
    top.castShadow = bottom.castShadow = left.castShadow = true;
    b.add(top, bottom, left);

    boxes.pocket = b;
    group.add(b);
  }

  // Arrange the four in a row, centred, resting on the ground.
  const order = ['standard', 'luxury', 'sliding', 'pocket'];
  const gap = S + 0.7;
  order.forEach((k, i) => {
    boxes[k].position.set((i - (order.length - 1) / 2) * gap, 0, 0);
  });

  group.visible = false;
  return { group, boxes, footprint: S };
}

/* A branded shipping mailer (white box with logo + fold flaps). */
export function createMailer(albumSize = 1.7) {
  const S = albumSize + 0.3;
  const group = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ color: COLORS.mailer, roughness: 0.95, metalness: 0 });
  group.add(tray(S, 0.34, S, COLORS.mailer, 0.05));

  // two top flaps that fold closed
  const mkFlap = (sign) => {
    const pivot = new THREE.Group();
    pivot.position.set(0, 0.34, (sign * S) / 2 - 0.025);
    const flap = solidBox(S, 0.03, S / 2, paper);
    flap.position.set(0, 0, (-sign * S) / 4);
    pivot.add(flap);
    pivot.rotation.x = sign * 1.3; // open
    group.add(pivot);
    return pivot;
  };
  group.userData.flapA = mkFlap(1);
  group.userData.flapB = mkFlap(-1);

  group.visible = false;
  return { group, footprint: S };
}

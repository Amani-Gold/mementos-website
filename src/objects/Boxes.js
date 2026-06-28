import * as THREE from 'three';
import { linenMaterialSet } from '../materials/textures.js';

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

function solidBox(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = m.receiveShadow = true;
  return m;
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

  // --- Standard: slim clamshell, flat foiled lid ---
  {
    const b = new THREE.Group();
    const base = tray(S, 0.16, S, COLORS.standard);
    b.add(base);
    const lid = solidBox(S + 0.02, 0.05, S + 0.02, linenMat(COLORS.standard));
    lid.position.y = 0.16 + 0.025;
    // small foil emblem on lid
    const em = solidBox(S * 0.34, 0.002, S * 0.16, gold());
    em.position.set(0, 0.16 + 0.051, 0);
    b.add(lid, em);
    boxes.standard = b;
    group.add(b);
  }

  // --- Luxury: deep hinged box + gold clasp ---
  {
    const b = new THREE.Group();
    const base = tray(S, 0.3, S, COLORS.luxury);
    b.add(base);
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.3, -S / 2); // hinge at back edge
    const lid = solidBox(S + 0.02, 0.05, S + 0.02, linenMat(COLORS.luxury));
    lid.position.set(0, 0.025, S / 2); // extend forward from hinge
    const stamp = solidBox(S * 0.2, 0.002, S * 0.2, gold());
    stamp.position.set(0, -0.002, S / 2); // inside-lid emblem (faces down when open)
    lidPivot.add(lid, stamp);
    lidPivot.rotation.x = -0.5; // ajar
    b.add(lidPivot);
    const clasp = solidBox(0.16, 0.1, 0.04, gold());
    clasp.position.set(0, 0.28, S / 2 + 0.01);
    b.add(clasp);
    b.userData.lid = lidPivot;
    boxes.luxury = b;
    group.add(b);
  }

  // --- Sliding: linen slipcase (open front + thumb notch) ---
  {
    const b = new THREE.Group();
    const ext = linenMat(COLORS.sliding);
    const w = S + 0.08, h = 0.22, d = S + 0.08, t = 0.05;
    // top, bottom, two sides, back — front open
    const top = solidBox(w, t, d, ext); top.position.set(0, h - t / 2, 0);
    const bot = solidBox(w, t, d, ext); bot.position.set(0, t / 2, 0);
    const left = solidBox(t, h, d, ext); left.position.set(-w / 2 + t / 2, h / 2, 0);
    const right = solidBox(t, h, d, ext); right.position.set(w / 2 - t / 2, h / 2, 0);
    const back = solidBox(w, h, t, ext); back.position.set(0, h / 2, -d / 2 + t / 2);
    b.add(top, bot, left, right, back);
    boxes.sliding = b;
    group.add(b);
  }

  // --- Pocket: tray with clear acrylic window lid ---
  {
    const b = new THREE.Group();
    b.add(tray(S, 0.18, S, COLORS.pocket));
    const acrylic = new THREE.Mesh(
      new THREE.BoxGeometry(S - 0.04, 0.02, S - 0.04),
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0.05,
        transmission: 0.9,
        transparent: true,
        opacity: 0.5,
        thickness: 0.02,
        ior: 1.45,
        envMapIntensity: 1,
      }),
    );
    acrylic.position.y = 0.18 + 0.03;
    b.add(acrylic);
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

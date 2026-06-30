import * as THREE from 'three';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v) => v * v * (3 - 2 * v);
const seg = (s, a, b) => smooth(clamp((s - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;

/*
 * One scroll progress (0..1) drives the whole film. We work in a "section
 * coordinate" s = progress * (PANELS - 1), so s === the index of the panel
 * currently filling the viewport. Every camera key and stage range is keyed to
 * that index, which keeps the 3D state locked to the copy on screen.
 *
 *  0 hero  1 opening  2 flip  3 print  4 layflat  5 closing
 *  6 chamois  7 linen  8 foiling  9 collections  10 slide-in
 *  11 packaging  12 mailer  13 worldwide map  14 CTA
 */
export const PANELS = 15;

const CAM_KEYS = [
  { at: 0.0, pos: [2.4, 2.5, 5.2], tgt: [0.7, 1.1, 0] },
  { at: 1.0, pos: [1.5, 3.0, 4.6], tgt: [0.4, 0.65, 0] },
  { at: 1.7, pos: [0, 4.2, 3.6], tgt: [0, 0.3, 0] },
  { at: 2.3, pos: [0, 4.5, 3.3], tgt: [0, 0.25, 0] },
  { at: 2.8, pos: [-0.5, 2.7, 2.8], tgt: [-0.55, 0.3, 0] },
  { at: 3.2, pos: [-0.9, 1.7, 2.0], tgt: [-0.85, 0.24, 0] },
  { at: 4.0, pos: [0, 5.0, 2.0], tgt: [0, 0.24, 0] },
  { at: 5.0, pos: [1.4, 1.6, 3.0], tgt: [0.8, 0.3, 0] },
  { at: 6.0, pos: [1.3, 1.25, 3.1], tgt: [0.85, 0.24, 0] },
  { at: 7.0, pos: [0.95, 1.15, 3.2], tgt: [0.85, 0.24, 0] },
  { at: 8.0, pos: [1.1, 0.95, 2.6], tgt: [0.85, 0.2, 0.02] },
  { at: 9.0, pos: [0, 3.6, 8.4], tgt: [0, 0.2, 0] },
  { at: 10.0, pos: [2.7, 1.9, 4.3], tgt: [0, 0.35, 0] },
  { at: 11.0, pos: [2.4, 2.2, 4.0], tgt: [0, 0.42, 0] },
  { at: 12.0, pos: [2.3, 2.0, 3.9], tgt: [0, 0.32, 0] },
  { at: 13.0, pos: [0, 1.7, 7.6], tgt: [0, 1.35, 0] },
  { at: 14.0, pos: [2.3, 2.3, 4.9], tgt: [0.6, 1.0, 0] },
];

const _pos = new THREE.Vector3();
const _tgt = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

function sampleCamera(s) {
  let i = 0;
  while (i < CAM_KEYS.length - 1 && s > CAM_KEYS[i + 1].at) i++;
  const k0 = CAM_KEYS[i];
  const k1 = CAM_KEYS[Math.min(i + 1, CAM_KEYS.length - 1)];
  const span = k1.at - k0.at || 1;
  const t = smooth(clamp((s - k0.at) / span));
  _pos.copy(_a.fromArray(k0.pos)).lerp(_b.fromArray(k1.pos), t);
  _tgt.copy(_a.fromArray(k0.tgt)).lerp(_b.fromArray(k1.tgt), t);
}

function setStage(s, { album, boxes, mailer, worldMap }) {
  boxes.group.visible = false;
  mailer.group.visible = false;
  worldMap.group.visible = false;
  album.root.visible = true;
  album.root.position.x = 0;
  album.root.position.z = 0;

  const S = boxes.footprint;
  const gap = S + 0.7;
  const order = ['standard', 'luxury', 'sliding', 'pocket'];
  const rowX = (i) => (i - (order.length - 1) / 2) * gap;
  const only = (name) => order.forEach((k) => (boxes.boxes[k].visible = k === name));
  const all = () => order.forEach((k) => (boxes.boxes[k].visible = true));

  if (s < 8.6) return; // album story

  if (s < 9.6) {
    // Collections row — each box presents its identity
    album.root.visible = false;
    boxes.group.visible = true;
    all();
    order.forEach((k, i) => boxes.boxes[k].position.set(rowX(i), 0, 0));
    boxes.boxes.luxury.userData.lid.rotation.x = 0; // wood plate presented
    boxes.boxes.sliding.userData.lid.position.x = S * 0.42; // window slid open
    return;
  }

  if (s < 10.6) {
    // Sliding: the window lid slides open to reveal the album
    boxes.group.visible = true;
    only('sliding');
    boxes.boxes.sliding.position.set(0, 0, 0);
    album.root.visible = false;
    const t = seg(s, 9.6, 10.5);
    boxes.boxes.sliding.userData.lid.position.x = lerp(0, S * 0.42, t);
    return;
  }

  if (s < 11.6) {
    // Luxury: present the wood plate, then the lid opens to reveal the album
    boxes.group.visible = true;
    only('luxury');
    boxes.boxes.luxury.position.set(0, 0, 0);
    album.root.visible = false;
    const t = seg(s, 10.6, 11.5);
    boxes.boxes.luxury.userData.lid.rotation.x = lerp(0, -1.4, t);
    return;
  }

  if (s < 12.6) {
    mailer.group.visible = true;
    mailer.group.position.set(0, 0, 0);
    const t = seg(s, 11.6, 12.5);
    mailer.group.userData.flapA.rotation.x = lerp(1.3, 0, t);
    mailer.group.userData.flapB.rotation.x = lerp(-1.3, 0, t);
    album.root.visible = t < 0.6;
    album.root.position.set(0, 0.06, 0);
    return;
  }

  if (s < 13.6) {
    album.root.visible = false;
    worldMap.group.visible = true;
    worldMap.group.userData.dots.rotation.y = s * 0.6;
    return;
  }

  // CTA — finished album returns, closed
  album.root.visible = true;
}

export function applyJourney(p, sets) {
  const s = clamp(p) * (PANELS - 1);
  sampleCamera(s);
  sets.camera.position.copy(_pos);
  sets.camera.lookAt(_tgt);

  const open = seg(s, 1.0, 1.8);
  const close = seg(s, 4.6, 5.4);
  const cover = open * (1 - close);
  const flip = seg(s, 1.9, 2.9);
  const layflat = seg(s, 3.6, 4.4) * (1 - close);
  const lift = 1 - seg(s, 0.0, 0.8);
  const spin = s < 1.0 ? (s - 0.5) * 0.45 : 0;

  sets.album.update({ cover, flip, layflat, lift, spin });
  if (sets.boxes && sets.mailer && sets.worldMap) setStage(s, sets);
}

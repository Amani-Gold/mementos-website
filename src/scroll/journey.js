import * as THREE from 'three';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v) => v * v * (3 - 2 * v);
const seg = (s, a, b) => smooth(clamp((s - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;

/*
 * The 3D journey now covers ONLY the collections region — the hero album flip
 * is the DOM/CSS album (src/album/flipAlbum.js), so the WebGL album story was
 * removed to avoid a duplicate flip. One scroll progress (0..1) is mapped to a
 * "section coordinate" s = progress * (PANELS - 1), where s === the index of
 * the .panel currently filling the viewport.
 *
 *   0 collections row   1 sliding opens   2 luxury lid lifts
 *   3 mailer packs      4 worldwide globe
 */
export const PANELS = 5;

const CAM_KEYS = [
  { at: 0.0, pos: [0, 3.2, 11.2], tgt: [0, 0.3, 0] }, // the four boxes, presented
  { at: 1.0, pos: [2.4, 1.7, 4.7], tgt: [0, 0.5, 0] }, // sliding
  { at: 2.0, pos: [2.3, 1.9, 4.5], tgt: [0, 0.7, 0] }, // luxury
  { at: 3.0, pos: [2.3, 1.9, 4.4], tgt: [0, 0.6, 0] }, // mailer
  { at: 3.65, pos: [2.3, 1.9, 4.4], tgt: [0, 0.6, 0] }, // …hold while it folds shut
  { at: 4.0, pos: [0, 3.0, 8.4], tgt: [0, 2.6, 0] }, // worldwide globe
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

const ORDER = ['standard', 'luxury', 'sliding', 'pocket'];

function setStage(s, { album, boxes, mailer, worldMap }) {
  const S = boxes.footprint;
  const gap = S + 0.5;
  const rowX = (i) => (i - (ORDER.length - 1) / 2) * gap;
  const only = (name) => ORDER.forEach((k) => (boxes.boxes[k].visible = k === name));
  const all = () => ORDER.forEach((k) => (boxes.boxes[k].visible = true));

  // default: everything hidden, album closed & parked (hero handles the album)
  boxes.group.visible = false;
  mailer.group.visible = false;
  worldMap.group.visible = false;
  if (album) album.root.visible = false;

  if (s < 0.7) {
    // Collections row — each box presents its identity
    boxes.group.visible = true;
    all();
    ORDER.forEach((k, i) => boxes.boxes[k].position.set(rowX(i), 0, 0));
    boxes.boxes.luxury.userData.lid.rotation.x = 0; // wood plate presented
    boxes.boxes.standard.userData.lid.rotation.x = -0.16; // foiled lid, barely ajar
    boxes.boxes.sliding.userData.lid.position.x = S * 0.16; // hint the slide
    return;
  }

  if (s < 1.7) {
    // Sliding: the slipcase lid slides open
    boxes.group.visible = true;
    only('sliding');
    boxes.boxes.sliding.position.set(0, 0, 0);
    const t = seg(s, 0.8, 1.6);
    boxes.boxes.sliding.userData.lid.position.x = lerp(0, S * 0.42, t);
    return;
  }

  if (s < 2.7) {
    // Luxury: present the wood plate, then the lid opens to reveal the album
    boxes.group.visible = true;
    only('luxury');
    boxes.boxes.luxury.position.set(0, 0, 0);
    const t = seg(s, 1.8, 2.6);
    boxes.boxes.luxury.userData.lid.rotation.x = lerp(0, -1.4, t);
    return;
  }

  if (s < 3.7) {
    // Mailer folds shut around the album
    mailer.group.visible = true;
    mailer.group.position.set(0, 0, 0);
    const t = seg(s, 2.8, 3.6);
    // the lid folds down from wide open onto the box
    mailer.group.userData.flapA.rotation.x = lerp(-2.25, 0, t);
    return;
  }

  // Worldwide — textured globe with slowly rotating shipping dots
  worldMap.group.visible = true;
  worldMap.group.userData.dots.rotation.y = s * 0.6;
}

export function applyJourney(p, sets) {
  const s = clamp(p) * (PANELS - 1);
  sampleCamera(s);
  sets.camera.position.copy(_pos);
  sets.camera.lookAt(_tgt);

  // album is DOM-driven now; keep the WebGL album closed if it is ever shown
  if (sets.album) sets.album.update({ cover: 0, flip: 0, layflat: 0, lift: 0, spin: 0 });
  if (sets.boxes && sets.mailer && sets.worldMap) setStage(s, sets);
}

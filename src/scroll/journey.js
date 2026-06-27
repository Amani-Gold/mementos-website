import * as THREE from 'three';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v) => v * v * (3 - 2 * v);
const range = (p, a, b) => smooth(clamp((p - a) / (b - a)));

/*
 * Maps a single scroll progress value (0..1 across the whole story) to the
 * camera framing and the album's open/flip/layflat state. One continuous
 * cinematic move — hero, opening, page-flipping, print close-up, layflat.
 */
const CAM_KEYS = [
  { at: 0.0, pos: [2.5, 2.7, 5.4], tgt: [0.7, 1.2, 0] },
  { at: 0.13, pos: [1.6, 3.2, 4.8], tgt: [0.45, 0.72, 0] },
  { at: 0.26, pos: [0.0, 4.4, 3.6], tgt: [0.0, 0.3, 0] },
  { at: 0.42, pos: [0.0, 4.7, 3.3], tgt: [0.0, 0.25, 0] },
  { at: 0.55, pos: [-0.5, 2.8, 2.9], tgt: [-0.55, 0.32, 0] },
  { at: 0.62, pos: [-0.9, 1.8, 2.1], tgt: [-0.85, 0.24, 0] },
  { at: 0.73, pos: [0.0, 4.6, 3.3], tgt: [0.0, 0.3, 0] },
  { at: 0.82, pos: [0.0, 5.2, 1.7], tgt: [0.0, 0.24, 0] },
  { at: 0.9, pos: [1.5, 1.7, 3.0], tgt: [0.85, 0.3, 0] },
  { at: 1.0, pos: [1.2, 0.85, 1.95], tgt: [0.85, 0.18, 0.05] },
];

const _pos = new THREE.Vector3();
const _tgt = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

function sampleCamera(p) {
  let i = 0;
  while (i < CAM_KEYS.length - 1 && p > CAM_KEYS[i + 1].at) i++;
  const k0 = CAM_KEYS[i];
  const k1 = CAM_KEYS[Math.min(i + 1, CAM_KEYS.length - 1)];
  const span = k1.at - k0.at || 1;
  const t = smooth(clamp((p - k0.at) / span));
  _pos.copy(_a.fromArray(k0.pos)).lerp(_b.fromArray(k1.pos), t);
  _tgt.copy(_a.fromArray(k0.tgt)).lerp(_b.fromArray(k1.tgt), t);
}

export function applyJourney(p, { camera, album }) {
  sampleCamera(p);
  camera.position.copy(_pos);
  camera.lookAt(_tgt);

  const open = range(p, 0.13, 0.26);
  const close = range(p, 0.88, 1.0); // re-close for the finished-album beauty
  const cover = open * (1 - close);
  const flip = range(p, 0.26, 0.55);
  const layflat = range(p, 0.66, 0.8);
  const lift = 1 - range(p, 0.0, 0.16);
  const spin = p < 0.13 ? (p / 0.13 - 0.5) * 0.45 : 0;

  album.update({ cover, flip, layflat, lift, spin });
}

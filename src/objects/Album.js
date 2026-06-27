import * as THREE from 'three';
import {
  coverTextures,
  linenMaterialSet,
  pageEdgeTexture,
  spreadTexture,
} from '../materials/textures.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v) => v * v * (3 - 2 * v);
const PI = Math.PI;

/*
 * A handcrafted square photo album, built procedurally so its proportions,
 * page thickness and foil match the Mementos Studio references exactly.
 *
 * Spine runs along +Z at x = 0. The open album shows one 2:1 spread split
 * across the two square pages (left half / right half). Turning a page lifts
 * the current right page (showing the outgoing spread's right half) and lays
 * down the next spread's left half, revealing the next spread beneath — the
 * real "book" logic, driven entirely by scroll.
 */
export class Album {
  constructor({
    size = 1.7,
    blockHeight = 0.17,
    coverThickness = 0.05,
    overhang = 0.045,
    baseHex = '#d8c4a6',
  } = {}) {
    this.size = size;
    this.blockHeight = blockHeight;
    this.coverThickness = coverThickness;
    this.ready = false;
    this._idx = {};

    this.root = new THREE.Group();

    const linen = linenMaterialSet(baseHex, { repeat: 2 });
    this._linenMat = () =>
      new THREE.MeshStandardMaterial({
        map: linen.map,
        bumpMap: linen.bumpMap,
        bumpScale: 0.004,
        roughness: linen.roughness,
        metalness: 0,
        envMapIntensity: 0.7,
      });
    this._ivory = new THREE.MeshStandardMaterial({ color: '#efe7d6', roughness: 0.85, metalness: 0 });
    const edgeTex = pageEdgeTexture();
    this._edgeMat = () =>
      new THREE.MeshStandardMaterial({
        map: edgeTex.clone(),
        roughness: 0.55,
        metalness: 0,
        envMapIntensity: 0.5,
      });

    // Fallback content until the real spreads load.
    this._fallback = spreadTexture(0);

    this._buildBackCover(overhang);
    this._buildBlocks();
    this._buildLeaf();
    this._buildFrontCover(overhang, baseHex);

    this.update({ cover: 0, flip: 0, layflat: 0, lift: 0, spin: 0 });
  }

  _spreadMat(tex) {
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0, envMapIntensity: 0.4 });
  }

  _buildBackCover(overhang) {
    const s = this.size + overhang * 2;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, this.coverThickness, s), this._linenMat());
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.position.set(this.size / 2 - overhang, -this.coverThickness / 2, 0);
    this.root.add(mesh);
  }

  _buildBlocks() {
    const { size, blockHeight } = this;
    const mk = (sign) => {
      const mats = [
        this._edgeMat(), this._edgeMat(),
        this._spreadMat(this._fallback), // +y top page
        this._edgeMat(), this._edgeMat(), this._edgeMat(),
      ];
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, blockHeight, size), mats);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.position.set(sign * size * 0.5, blockHeight / 2, 0);
      return mesh;
    };
    this.rightBlock = mk(1);
    this.leftBlock = mk(-1);
    this.root.add(this.rightBlock, this.leftBlock);
  }

  _buildLeaf() {
    const { size } = this;
    const leafThk = 0.009;
    const geo = new THREE.BoxGeometry(size, leafThk, size, 60, 1, 8);
    geo.translate(size / 2, 0, 0); // left edge at the spine
    const mats = [
      this._edgeMat(), this._edgeMat(),
      this._spreadMat(this._fallback), // +y front (outgoing right page)
      this._spreadMat(this._fallback), // -y back (incoming left page)
      this._edgeMat(), this._edgeMat(),
    ];
    const mesh = new THREE.Mesh(geo, mats);
    mesh.castShadow = true;
    const pivot = new THREE.Group();
    pivot.position.set(0, this.blockHeight + 0.012, 0);
    pivot.add(mesh);
    pivot.userData.geo = geo;
    pivot.userData.base = geo.attributes.position.array.slice();
    pivot.userData.mesh = mesh;
    this.leaf = pivot;
    this.root.add(pivot);
  }

  _buildFrontCover(overhang, baseHex) {
    const s = this.size + overhang * 2;
    const geo = new THREE.BoxGeometry(s, this.coverThickness, s);
    geo.translate(s / 2 - overhang, 0, 0);

    const cov = coverTextures({ baseHex, foil: 'gold' });
    const foilMat = new THREE.MeshStandardMaterial({
      map: cov.map,
      metalnessMap: cov.metalnessMap,
      roughnessMap: cov.roughnessMap,
      bumpMap: cov.bumpMap,
      bumpScale: 0.006,
      metalness: 1,
      roughness: 1,
      envMapIntensity: 1.15,
    });
    const mats = [
      this._linenMat(), this._linenMat(),
      foilMat, this._ivory,
      this._linenMat(), this._linenMat(),
    ];
    const mesh = new THREE.Mesh(geo, mats);
    mesh.castShadow = mesh.receiveShadow = true;
    const pivot = new THREE.Group();
    pivot.position.set(0, this.blockHeight + 0.02 + this.coverThickness / 2, 0);
    pivot.add(mesh);
    this.frontCover = pivot;
    this.root.add(pivot);
  }

  /* Load the real 2:1 spreads and pre-split each into left/right half textures. */
  async loadSpreads(urls) {
    const loader = new THREE.TextureLoader();
    const imgs = await Promise.all(
      urls.map((u) => loader.loadAsync(u).catch(() => null)),
    );
    const ok = imgs.filter(Boolean);
    if (!ok.length) return;

    this.left = [];
    this.right = [];
    for (const t of ok) {
      const img = t.image;
      const W = img.width;
      const H = img.height;
      const hw = Math.floor(W / 2);
      const make = (sx) => {
        const c = document.createElement('canvas');
        c.width = hw;
        c.height = H;
        c.getContext('2d').drawImage(img, sx, 0, hw, H, 0, 0, hw, H);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        return tex;
      };
      this.left.push(make(0));
      this.right.push(make(W - hw));
    }
    this.nSpreads = ok.length;
    this.TURNS = Math.min(7, this.nSpreads - 1);
    this.hero = 0; // spread used for the layflat panorama
    this.ready = true;
    this._idx = {};
  }

  _setMap(mesh, slot, tex, key) {
    if (this._idx[key] === tex) return;
    this._idx[key] = tex;
    mesh.material[slot].map = tex;
    mesh.material[slot].needsUpdate = true;
  }

  _bendLeaf(active, lift) {
    const geo = this.leaf.userData.geo;
    const base = this.leaf.userData.base;
    const pos = geo.attributes.position.array;
    const s = this.size;
    for (let i = 0; i < pos.length; i += 3) {
      const x = base[i];
      const z = base[i + 2];
      const t = clamp(x / s); // 0 spine -> 1 free edge
      const u = z / (s * 0.5);
      // A flexible sheet: a broad bow plus a stronger curl-over at the free
      // edge so it reads as paper bending, not a board pivoting.
      const curl = active * (0.4 * Math.sin(t * PI) + 0.3 * t * t + 0.3 * Math.pow(t, 3));
      // Gravity drags the leading edge to trail behind the turn.
      const sag = -lift * s * 0.16 * Math.pow(t, 1.9);
      // Outer corners relax a touch more than the centre line.
      const corner = active * 0.16 * t * (u * u);
      pos[i] = base[i];
      pos[i + 1] = base[i + 1] + curl + sag - corner;
      pos[i + 2] = base[i + 2];
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  }

  update({ cover = 0, flip = 0, layflat = 0, lift = 0, spin = 0 }) {
    const co = smooth(clamp(cover));
    this.root.position.y = lift * 0.18;
    this.root.rotation.y = spin;

    this.frontCover.rotation.z = co * PI;
    this.frontCover.visible = co < 0.999 || layflat < 0.001;

    const open = co;
    this.leftBlock.scale.y = Math.max(0.001, open);
    this.leftBlock.position.y = (this.blockHeight / 2) * this.leftBlock.scale.y;
    this.leftBlock.visible = open > 0.02;

    if (!this.ready) {
      this.leaf.visible = false;
      return;
    }

    const lay = clamp(layflat);
    if (lay > 0.5) {
      // Layflat panorama: a single full spread reading across both pages.
      this._setMap(this.leftBlock, 2, this.left[this.hero], 'L');
      this._setMap(this.rightBlock, 2, this.right[this.hero], 'R');
      this.leaf.visible = false;
      return;
    }

    const N = this.TURNS;
    const f = clamp(flip) * N;
    let c = Math.floor(f);
    if (c >= N) c = N; // fully turned
    const frac = clamp(f - c);
    const turning = frac > 0.001 && frac < 0.999 && c < N;
    const next = Math.min(c + 1, this.nSpreads - 1);

    // Blocks: left page holds the current spread; right page reveals the next
    // one beneath as soon as a turn begins.
    this._setMap(this.leftBlock, 2, this.left[Math.min(c, this.nSpreads - 1)], 'L');
    this._setMap(this.rightBlock, 2, this.right[turning ? next : Math.min(c, this.nSpreads - 1)], 'R');

    // The turning leaf carries the outgoing right page (front) and the
    // incoming left page (back).
    this.leaf.visible = open > 0.05 && turning;
    if (turning) {
      this._setMap(this.leaf.userData.mesh, 2, this.right[c], 'lf');
      this._setMap(this.leaf.userData.mesh, 3, this.left[next], 'lb');
      this.leaf.rotation.z = smooth(frac) * PI;
      // No bend: pages turn as flat, rigid sheets.
      this._bendLeaf(0, 0);
    }
  }
}

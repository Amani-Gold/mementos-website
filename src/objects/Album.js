import * as THREE from 'three';
import {
  chamoisMaterialSet,
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
    this._buildSpine();
    this._applyCover(this.coverState); // colour the spine now that it exists

    this.update({ cover: 0, flip: 0, layflat: 0, lift: 0, spin: 0 });
  }

  _spreadMat(tex) {
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0, envMapIntensity: 0.4 });
  }

  _buildBackCover(overhang) {
    this._overhang = overhang;
    const s = this.size + overhang * 2;
    this.backCoverMat = this._linenMat();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, this.coverThickness, s), this.backCoverMat);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.position.set(this.size / 2 - overhang, -this.coverThickness / 2, 0);
    this.root.add(mesh);
  }

  _buildSpine() {
    const o = this._overhang;
    const depth = this.size + o * 2;
    const height = this.blockHeight + this.coverThickness * 2;
    const w = 0.06;
    this.spineMat = this._linenMat();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, height, depth), this.spineMat);
    mesh.castShadow = mesh.receiveShadow = true;
    // wraps the binding edge at the spine (x = 0)
    mesh.position.set(-o + w / 2 - 0.005, height / 2 - this.coverThickness, 0);
    this.spine = mesh;
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

    const foilMat = new THREE.MeshStandardMaterial({
      bumpScale: 0.006,
      metalness: 1,
      roughness: 1,
      envMapIntensity: 1.15,
    });
    this.coverFoilMat = foilMat;
    const side = [this._linenMat(), this._linenMat(), this._linenMat(), this._linenMat()];
    this.coverSideMats = side;

    // material order: +x, -x, +y(top/foil), -y(inside), +z, -z
    const mats = [side[0], side[1], foilMat, this._ivory, side[2], side[3]];
    const mesh = new THREE.Mesh(geo, mats);
    mesh.castShadow = mesh.receiveShadow = true;
    const pivot = new THREE.Group();
    // Seat the cover almost flush on the page block so the photo top never
    // peeks past the overhang at low camera angles.
    pivot.position.set(0, this.blockHeight + this.coverThickness / 2 + 0.004, 0);
    pivot.add(mesh);
    this.frontCover = pivot;
    this.root.add(pivot);

    this.coverState = { weave: 'linen', hex: baseHex, foil: 'gold' };
    this._applyCover(this.coverState);
  }

  /* Rebuild the cover's foil + linen/chamois faces for a new material/colour. */
  _applyCover({ weave, hex, foil }) {
    const cov = coverTextures({ baseHex: hex, foil, weave });
    const fm = this.coverFoilMat;
    [fm.map, fm.metalnessMap, fm.roughnessMap, fm.bumpMap].forEach((t) => t && t.dispose());
    fm.map = cov.map;
    fm.metalnessMap = cov.metalnessMap;
    fm.roughnessMap = cov.roughnessMap;
    fm.bumpMap = cov.bumpMap;
    fm.needsUpdate = true;

    const set = weave === 'chamois' ? chamoisMaterialSet(hex, { repeat: 2 }) : linenMaterialSet(hex, { repeat: 2 });
    // Recolour every linen/chamois body face: front cover sides, back cover
    // and spine — so the whole album reads as one material/colour.
    const body = [...this.coverSideMats, this.backCoverMat, this.spineMat].filter(Boolean);
    for (const m of body) {
      m.map && m.map.dispose();
      m.bumpMap && m.bumpMap.dispose();
      m.map = set.map.clone();
      m.bumpMap = set.bumpMap.clone();
      m.roughness = set.roughness;
      m.needsUpdate = true;
    }
  }

  /* Public: change cover material / colour / foil (merges with current state). */
  setCover(partial) {
    this.coverState = { ...this.coverState, ...partial };
    this._applyCover(this.coverState);
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
    // The wrapped spine only belongs to the closed book.
    if (this.spine) this.spine.visible = co < 0.12;

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

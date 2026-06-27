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
 * Layout: spine runs along +Z at x = 0. Pages and covers extend toward +x
 * when closed, and flip about the spine (rotation around the Z axis) to lay
 * open toward -x. Everything rests on the ground (y = 0 at the base).
 */
export class Album {
  constructor({
    size = 1.7, // square page edge (width == depth)
    blockHeight = 0.17, // thick page block
    coverThickness = 0.05,
    overhang = 0.045,
    nLeaves = 6,
    baseHex = '#d8c4a6',
  } = {}) {
    this.size = size;
    this.blockHeight = blockHeight;
    this.coverThickness = coverThickness;
    this.nLeaves = nLeaves;

    this.root = new THREE.Group();

    const linen = linenMaterialSet(baseHex, { repeat: 2 });
    const linenMat = () =>
      new THREE.MeshStandardMaterial({
        map: linen.map,
        bumpMap: linen.bumpMap,
        bumpScale: 0.004,
        roughness: linen.roughness,
        metalness: 0,
        envMapIntensity: 0.7,
      });

    const ivory = new THREE.MeshStandardMaterial({
      color: '#efe7d6',
      roughness: 0.85,
      metalness: 0,
    });
    const edgeTex = pageEdgeTexture();
    const edgeMat = () =>
      new THREE.MeshStandardMaterial({
        map: edgeTex.clone(),
        roughness: 0.55,
        metalness: 0,
        envMapIntensity: 0.5,
      });

    this._linenMat = linenMat;
    this._ivory = ivory;
    this._edgeMat = edgeMat;

    this.spreads = [];
    for (let i = 0; i <= nLeaves + 1; i++) this.spreads.push(spreadTexture(i));

    this._buildBackCover(overhang);
    this._buildBlocks();
    this._buildLeaves();
    this._buildFrontCover(overhang, baseHex);

    this.update({ cover: 0, flip: 0, layflat: 0, lift: 0, spin: 0 });
  }

  _spreadMat(tex) {
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.6,
      metalness: 0,
      envMapIntensity: 0.4,
    });
  }

  _buildBackCover(overhang) {
    const s = this.size + overhang * 2;
    const geo = new THREE.BoxGeometry(s, this.coverThickness, s);
    const m = this._linenMat();
    const mesh = new THREE.Mesh(geo, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // left edge near spine; centre offset so it spans roughly x[-o, size+o]
    mesh.position.set(this.size / 2 - overhang, -this.coverThickness / 2, 0);
    this.backCover = mesh;
    this.root.add(mesh);
  }

  _buildBlocks() {
    const { size, blockHeight } = this;
    const mk = (sign, tex) => {
      const geo = new THREE.BoxGeometry(size, blockHeight, size);
      const mats = [
        this._edgeMat(), // +x fore-edge
        this._edgeMat(), // -x spine side
        this._spreadMat(tex), // +y top (the visible page)
        this._edgeMat(), // -y bottom
        this._edgeMat(), // +z head
        this._edgeMat(), // -z tail
      ];
      const mesh = new THREE.Mesh(geo, mats);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(sign * size * 0.5, blockHeight / 2, 0);
      return mesh;
    };
    this.rightBlock = mk(1, this.spreads[this.nLeaves + 1]);
    this.leftBlock = mk(-1, this.spreads[0]);
    this.root.add(this.rightBlock, this.leftBlock);
  }

  _buildLeaves() {
    const { size, nLeaves } = this;
    const leafThk = 0.009;
    this.leaves = [];
    const topY = this.blockHeight;
    for (let i = 0; i < nLeaves; i++) {
      const geo = new THREE.BoxGeometry(size, leafThk, size, 44, 1, 6);
      geo.translate(size / 2, 0, 0); // left edge at spine (x = 0)
      const front = this.spreads[i + 1];
      const back = this.spreads[i + 2] || this.spreads[i];
      const mats = [
        this._edgeMat(),
        this._edgeMat(),
        this._spreadMat(front), // top = right-reading page
        this._spreadMat(back), // bottom = becomes left page once flipped
        this._edgeMat(),
        this._edgeMat(),
      ];
      const mesh = new THREE.Mesh(geo, mats);
      mesh.castShadow = true;
      const pivot = new THREE.Group();
      pivot.position.set(0, topY + (i + 1) * leafThk, 0);
      pivot.add(mesh);
      pivot.userData.base = geo.attributes.position.array.slice();
      pivot.userData.geo = geo;
      pivot.userData.index = i;
      this.leaves.push(pivot);
      this.root.add(pivot);
    }
  }

  _buildFrontCover(overhang, baseHex) {
    const s = this.size + overhang * 2;
    const geo = new THREE.BoxGeometry(s, this.coverThickness, s);
    geo.translate(s / 2 - overhang, 0, 0); // left edge ~ spine

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
    this.coverFoilMat = foilMat;

    const mats = [
      this._linenMat(),
      this._linenMat(),
      foilMat, // +y outside (foil)
      this._ivory, // -y inside
      this._linenMat(),
      this._linenMat(),
    ];
    const mesh = new THREE.Mesh(geo, mats);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const pivot = new THREE.Group();
    // sits on top of the page block when closed
    pivot.position.set(0, this.blockHeight + 0.012 * this.nLeaves + this.coverThickness / 2 + 0.004, 0);
    pivot.add(mesh);
    this.frontCover = pivot;
    this.root.add(pivot);
  }

  /*
   * Bend a leaf so it reads as a flexible sheet of paper rather than a rigid
   * board. The curvature is weighted toward the free edge (a soft C-curve), a
   * gravity droop sags the leading edge while the page is lifted, and a faint
   * resting curl keeps even the stacked pages from looking perfectly flat. A
   * gentle cross-curve lets the outer corners relax too.
   */
  _bendLeaf(pivot, active, rest, lift) {
    const geo = pivot.userData.geo;
    const base = pivot.userData.base;
    const pos = geo.attributes.position.array;
    const s = this.size;
    for (let i = 0; i < pos.length; i += 3) {
      const x = base[i];
      const z = base[i + 2];
      const t = clamp(x / s); // 0 at spine -> 1 at fore-edge
      const u = z / (s * 0.5); // -1..1 across head/tail

      // Active turn: C-curve concentrated toward the free edge.
      const curl = active * (0.5 * Math.sin(t * PI) + 0.5 * t * t);
      // Gravity sag of the leading edge while the page is in the air.
      const sag = -lift * s * 0.16 * Math.pow(t, 1.7);
      // Faint resting relaxation so a flat page still has life.
      const relax = rest * (t * t);
      // Corners droop a touch more than the centre.
      const corner = (active * 0.18 + rest) * t * (u * u);

      pos[i] = base[i];
      pos[i + 1] = base[i + 1] + curl + sag + relax - corner;
      pos[i + 2] = base[i + 2];
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  }

  /*
   * Drive the whole album from normalized controls:
   *   cover   0..1  front cover lifts & swings open, left side reveals
   *   flip    0..1  pages turn right -> left, one after another
   *   layflat 0..1  settle perfectly flat for the panorama
   *   lift    0..1  gentle hover (hero)
   *   spin    radians  slow turntable rotation
   */
  update({ cover = 0, flip = 0, layflat = 0, lift = 0, spin = 0 }) {
    const co = smooth(clamp(cover));

    // Gentle float + turntable
    this.root.position.y = lift * 0.18;
    this.root.rotation.y = spin;

    // Front cover swings open about the spine (0 -> PI to the left)
    this.frontCover.rotation.z = co * PI;
    this.frontCover.visible = co < 0.999 || layflat < 0.001;

    // Left side grows in as the book opens
    const open = co;
    this.leftBlock.scale.y = Math.max(0.001, open);
    this.leftBlock.position.y = (this.blockHeight / 2) * this.leftBlock.scale.y;
    this.leftBlock.visible = open > 0.02;

    // Pages — overlapping cascade so turns flow into one another.
    const n = this.nLeaves;
    const spacing = 0.78; // <1 lets the next page begin before the last lands
    for (let i = 0; i < n; i++) {
      const pivot = this.leaves[i];
      let local = clamp(flip * (n * spacing + 1) - i * spacing);
      if (layflat > 0.001) local = 1; // all turned for the panorama
      const angle = smooth(local) * PI;
      pivot.rotation.z = angle;
      // Once fully laid flat, retire the leaves so the panorama reads clean.
      pivot.visible = open > 0.05 && layflat < 0.55;

      const turning = local > 0.001 && local < 0.999;
      // Active bend peaks mid-turn; lift (gravity sag) follows how airborne it is.
      const active = turning ? Math.sin(local * PI) * this.size * 0.34 : 0;
      const lift = turning ? Math.sin(local * PI) : 0;
      // Topmost resting pages relax slightly more than those buried in the stack.
      const rest = this.size * 0.02 * (turning ? 0 : 1 - i / n);
      this._bendLeaf(pivot, active, rest, lift);
    }

    // Layflat panorama: a wide spread reading continuously across both pages.
    if (layflat > 0.001 && !this._panoramaSet) {
      this.leftBlock.material[2].map = spreadTexture(50, { panorama: true, half: 'left' });
      this.leftBlock.material[2].needsUpdate = true;
      this.rightBlock.material[2].map = spreadTexture(50, { panorama: true, half: 'right' });
      this.rightBlock.material[2].needsUpdate = true;
      this._panoramaSet = true;
    }
  }
}

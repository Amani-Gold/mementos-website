import * as THREE from 'three';

/*
 * AlbumBook — a real, rigid, handcrafted luxury album built as 3D geometry.
 *
 *   • Rigid front / back covers (BoxGeometry) with true board thickness and a
 *     fabric+foil surface, hinged at the spine.
 *   • A solid page block (left + right) with striped fore-edges → the visible
 *     thickness of a stack of mounted album sheets.
 *   • A persistent spine that is the real pivot for opening and every flip.
 *   • Turning leaves are thin two-sided pages: a real printed spread half on
 *     BOTH faces, gently curled as they turn — never blank, never duplicated,
 *     revealed by geometry/occlusion (no opacity fades).
 *
 * Local space: the open book lies in the XY plane, +Z up, spine along Y at X=0.
 * A page spans one unit square; open, the book is 2×1. The whole group is then
 * tilted into the hero's 3/4 framing by the caller / setLayout().
 *
 * Drive it with setState(p), p∈[0,1]: cover opens, then pages flip quickly.
 */

const PAGE = 1.0; // square page: width = height = 1 unit
const HALF = PAGE / 2;
const BOARD = 0.055; // cover board thickness
const OVERW = 1.04; // cover overhang (width factor vs page)
const OVERH = 1.06; // cover overhang (height factor)
const SHEET_T = 0.004; // one turning sheet thickness

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (t) => t * t * (3 - 2 * t);

export class AlbumBook {
  /**
   * @param {object} o
   * @param {string} o.base           asset base URL
   * @param {Array<{img:string}>} o.spreads  full 2:1 spread images
   * @param {string} o.coverFabric    cover fabric image url
   * @param {object} o.coverNames     { line1, amp, line2, date }
   */
  constructor(o) {
    this.base = o.base || '/';
    this.spreads = o.spreads;
    this.N = o.spreads.length;
    this.coverFabric = o.coverFabric;
    this.coverNames = o.coverNames || {};

    this.root = new THREE.Group();
    this._tex = new THREE.TextureLoader();
    this._disposables = [];

    this.ready = this._build();
  }

  /* ---- texture helpers ---------------------------------------------------- */

  _loadHalf(url, side) {
    // A page is square, spreads are 2:1 → sample the left or right half.
    const t = this._tex.load(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.repeat.set(0.5, 1);
    t.offset.set(side === 'left' ? 0 : 0.5, 0);
    t.anisotropy = 8;
    this._disposables.push(t);
    return t;
  }

  async _coverTexture() {
    // Compose the cover: real fabric photo + hand-pressed gold foil script.
    const size = 1024;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');

    // fabric base
    await new Promise((res) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // cover-fill the square
        const s = Math.max(size / img.width, size / img.height);
        const w = img.width * s;
        const h = img.height * s;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        res();
      };
      img.onerror = () => {
        ctx.fillStyle = '#c9c2b6';
        ctx.fillRect(0, 0, size, size);
        res();
      };
      img.src = this.coverFabric;
    });

    // gold foil script — wait for the display font if present
    try {
      await document.fonts.ready;
    } catch (e) {
      /* ignore */
    }
    const nm = this.coverNames;
    const line1 = nm.line1 || 'Aysha';
    const amp = nm.amp || '&';
    const line2 = nm.line2 || 'Alfonse';
    const date = (nm.date || 'Oct 4, 2024').toUpperCase();

    const gold = ctx.createLinearGradient(0, size * 0.34, 0, size * 0.66);
    gold.addColorStop(0, '#f6e4b0');
    gold.addColorStop(0.5, '#c9a25f');
    gold.addColorStop(1, '#e9cf95');

    ctx.textAlign = 'center';
    ctx.fillStyle = gold;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    const script = "'Pinyon Script', 'Snell Roundhand', cursive";
    ctx.font = `150px ${script}`;
    ctx.fillText(line1, size / 2, size * 0.44);
    ctx.font = `78px ${script}`;
    ctx.fillText(amp, size / 2, size * 0.53);
    ctx.font = `150px ${script}`;
    ctx.fillText(line2, size / 2, size * 0.64);

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#d8bd82';
    ctx.font = "600 30px 'Jost', system-ui, sans-serif";
    // simple letter-spacing
    const ls = 8;
    const total = date.split('').reduce((w, ch) => w + ctx.measureText(ch).width + ls, -ls);
    let x = size / 2 - total / 2;
    ctx.textAlign = 'left';
    for (const ch of date) {
      ctx.fillText(ch, x, size * 0.75);
      x += ctx.measureText(ch).width + ls;
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    this._disposables.push(tex);
    return tex;
  }

  _fabricMap() {
    const t = this._tex.load(this.coverFabric);
    t.colorSpace = THREE.SRGBColorSpace;
    this._disposables.push(t);
    return t;
  }

  /* ---- geometry ----------------------------------------------------------- */

  async _build() {
    const S = this.spreads.map((s) => ({
      left: this._loadHalf(s.img, 'left'),
      right: this._loadHalf(s.img, 'right'),
    }));
    this.S = S;

    const paper = (map) =>
      new THREE.MeshStandardMaterial({ map, roughness: 0.82, metalness: 0.0 });
    const fabric = (map) =>
      new THREE.MeshStandardMaterial({ map, roughness: 0.78, metalness: 0.02, color: 0xffffff });

    // page-edge stripe texture for the fore-edges of the page block
    const edge = this._edgeTexture();

    /* back cover — under the right page stack, sits at the very bottom */
    const backCoverW = PAGE + (OVERW - 1) * PAGE;
    this.back = new THREE.Mesh(
      new THREE.BoxGeometry(backCoverW, PAGE * OVERH, BOARD),
      fabric(this._fabricMap()),
    );
    this.back.position.set(HALF - (OVERW - 1) * PAGE * 0.5, 0, -0.085);
    this.back.castShadow = this.back.receiveShadow = true;
    this.root.add(this.back);

    /* page blocks — left (turned) and right (unturned) */
    const blockMat = [
      edge, edge, edge, edge,
      new THREE.MeshStandardMaterial({ color: 0xefe7d6, roughness: 0.9 }), // top
      new THREE.MeshStandardMaterial({ color: 0xe7dcc5, roughness: 0.9 }), // bottom
    ];
    this.rightBlock = new THREE.Mesh(new THREE.BoxGeometry(PAGE, PAGE, 0.14), blockMat);
    this.rightBlock.castShadow = this.rightBlock.receiveShadow = true;
    this.rightBlock.position.set(HALF, 0, -0.01);
    this.root.add(this.rightBlock);

    this.leftBlock = new THREE.Mesh(new THREE.BoxGeometry(PAGE, PAGE, 0.02), blockMat.map((m) => m));
    this.leftBlock.castShadow = this.leftBlock.receiveShadow = true;
    this.leftBlock.position.set(-HALF, 0, -0.05);
    this.leftBlock.visible = false;
    this.root.add(this.leftBlock);

    /* base pages (the settled spread under the active leaf) */
    const planeGeo = new THREE.PlaneGeometry(PAGE, PAGE);
    this.baseRight = new THREE.Mesh(planeGeo, paper(S[0].right));
    this.baseRight.position.set(HALF, 0, 0.062);
    this.baseRight.receiveShadow = true;
    this.root.add(this.baseRight);

    this.baseLeft = new THREE.Mesh(planeGeo, paper(S[0].left));
    this.baseLeft.position.set(-HALF, 0, 0.056);
    this.baseLeft.receiveShadow = true;
    this.baseLeft.visible = false;
    this.root.add(this.baseLeft);

    /* spine — always visible, bridges the covers at X≈0 */
    const spineMat = new THREE.MeshStandardMaterial({
      map: this._fabricMap(),
      roughness: 0.8,
      metalness: 0.02,
      color: 0xb8b0a2,
    });
    this.spine = new THREE.Mesh(new THREE.BoxGeometry(0.09, PAGE * OVERH, 0.19), spineMat);
    this.spine.position.set(0, 0, -0.05);
    this.spine.castShadow = true;
    this.root.add(this.spine);

    /* front cover — rigid board, hinged at spine (pivot at X=0) */
    this.coverPivot = new THREE.Group();
    this.coverPivot.position.set(0, 0, 0.075);
    this.root.add(this.coverPivot);

    const coverW = PAGE + (OVERW - 1) * PAGE;
    const coverOutside = await this._coverTexture();
    const coverMat = [
      new THREE.MeshStandardMaterial({ color: 0x6b6357, roughness: 0.7 }), // +x edge
      new THREE.MeshStandardMaterial({ color: 0x6b6357, roughness: 0.7 }), // -x (spine) edge
      new THREE.MeshStandardMaterial({ color: 0x6b6357, roughness: 0.7 }), // +y
      new THREE.MeshStandardMaterial({ color: 0x6b6357, roughness: 0.7 }), // -y
      fabric(coverOutside), // +z outside (up when closed)
      paper(S[0].left), // -z inside (up when open = first spread left)
    ];
    this.cover = new THREE.Mesh(
      new THREE.BoxGeometry(coverW, PAGE * OVERH, BOARD),
      coverMat,
    );
    // mesh offset so its inner edge sits on the pivot (spans x:0..coverW-ish)
    this.cover.position.set(coverW / 2 - (OVERW - 1) * PAGE * 0.5, 0, 0);
    this.cover.castShadow = this.cover.receiveShadow = true;
    this.coverPivot.add(this.cover);

    /* active turning leaf — two thin curled pages, front + back */
    this.leafPivot = new THREE.Group();
    this.leafPivot.position.set(0, 0, 0.07);
    this.root.add(this.leafPivot);

    this.leafSegs = 18;
    const lg1 = new THREE.PlaneGeometry(PAGE, PAGE, this.leafSegs, 1);
    lg1.translate(HALF, 0, 0); // hinge at x=0
    const lg2 = lg1.clone();
    this.leafFrontMat = paper(S[0].right);
    this.leafBackMat = paper(S[0].left);
    this.leafFront = new THREE.Mesh(lg1, this.leafFrontMat);
    this.leafBack = new THREE.Mesh(lg2, this.leafBackMat);
    this.leafBack.rotation.y = Math.PI; // faces -z
    this.leafBack.position.z = -0.001;
    this.leafFront.castShadow = this.leafBack.castShadow = true;
    this.leafPivot.add(this.leafFront, this.leafBack);
    this.leafPivot.visible = false;
    this._lg1 = lg1;
    this._lg2 = lg2;
    this._baseZ = this._lg1.attributes.position.array.slice();

    this.setLayout(window.innerWidth, window.innerHeight);
    this.setState(0);
    return true;
  }

  _edgeTexture() {
    const cv = document.createElement('canvas');
    cv.width = 8;
    cv.height = 128;
    const ctx = cv.getContext('2d');
    for (let y = 0; y < 128; y++) {
      const v = y % 3 === 0 ? '#d9c9a6' : y % 3 === 1 ? '#f2ead6' : '#e7dcc5';
      ctx.fillStyle = v;
      ctx.fillRect(0, y, 8, 1);
    }
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 40);
    t.colorSpace = THREE.SRGBColorSpace;
    this._disposables.push(t);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 });
  }

  /* ---- responsive framing ------------------------------------------------- */

  setLayout(vw, vh) {
    const portrait = vw < 900;
    if (portrait) {
      // centered, a bit lower, smaller — copy stacks above on mobile
      this.root.position.set(0, -0.35, 0);
      this.root.scale.setScalar(0.92);
      this.root.rotation.set(-0.52, -0.12, 0.02);
    } else {
      // pushed to the right so the hero copy + story rail sit clear on the left
      this.root.position.set(0.78, -0.02, 0);
      this.root.scale.setScalar(1.12);
      this.root.rotation.set(-0.5, -0.16, 0.02);
    }
  }

  /* ---- animation state ---------------------------------------------------- */

  // proportion of scroll spent opening the cover vs. flipping pages
  get COVER() {
    return 0.2;
  }

  _setLeafTextures(fromRight, toLeft) {
    if (this.leafFrontMat.map !== fromRight) {
      this.leafFrontMat.map = fromRight;
      this.leafFrontMat.needsUpdate = true;
    }
    if (this.leafBackMat.map !== toLeft) {
      this.leafBackMat.map = toLeft;
      this.leafBackMat.needsUpdate = true;
    }
  }

  _setBase(mesh, map) {
    if (mesh.material.map !== map) {
      mesh.material.map = map;
      mesh.material.needsUpdate = true;
    }
  }

  _curl(turn) {
    // Gentle taco curl that peaks mid-turn, flat at the ends.
    const bend = Math.sin(clamp(turn, 0, 1) * Math.PI) * 0.16;
    const p1 = this._lg1.attributes.position;
    const p2 = this._lg2.attributes.position;
    const base = this._baseZ;
    for (let i = 0; i < p1.count; i++) {
      const x = base[i * 3]; // 0..1 across the page
      const u = clamp(x / PAGE, 0, 1);
      const z = Math.sin(u * Math.PI) * bend;
      p1.array[i * 3 + 2] = z;
      p2.array[i * 3 + 2] = z;
    }
    p1.needsUpdate = true;
    p2.needsUpdate = true;
    this._lg1.computeVertexNormals();
    this._lg2.computeVertexNormals();
  }

  setState(p) {
    p = clamp(p, 0, 1);
    const N = this.N;
    const C = this.COVER;
    let phase = 0;

    if (p < C) {
      /* Scene 1→2→3: cover opens from the spine, first spread revealed. */
      const t = easeInOut(clamp(p / C, 0, 1));
      this.coverPivot.rotation.y = -t * Math.PI;
      this.leafPivot.visible = false;
      this._setBase(this.baseRight, this.S[0].right);
      // the right page is revealed only as the cover lifts off it; the left
      // page appears once the cover has swung past upright.
      this.baseRight.visible = t > 0.12;
      this.baseLeft.visible = t > 0.55;
      this._setBase(this.baseLeft, this.S[0].left);
      this.leftBlock.visible = false;
      this._resizeBlocks(0);
      phase = 0;
    } else {
      /* Scene 4: fast, elegant page-flip sequence. */
      this.coverPivot.rotation.y = -Math.PI;
      this.baseLeft.visible = true;
      this.baseRight.visible = true;

      const flips = N - 1; // spread 0→1→…→N-1
      const span = (1 - C) / flips;
      const q = p - C;
      let j = Math.floor(q / span);
      j = clamp(j, 0, flips - 1);
      const local = clamp((q - j * span) / span, 0, 1);

      const from = j; // current spread index
      const to = j + 1;
      const TURN_PORTION = 0.72; // rest of the segment is a short readable hold
      const turn = local < TURN_PORTION ? easeInOut(local / TURN_PORTION) : 1;

      this._setBase(this.baseLeft, this.S[from].left);
      this._setBase(this.baseRight, this.S[to].right);
      this._setLeafTextures(this.S[from].right, this.S[to].left);

      this.leafPivot.visible = true;
      this.leafPivot.rotation.y = -turn * Math.PI;
      this._curl(turn);

      // page block thickness shifts from right → left as we progress
      const progressed = (j + turn) / flips;
      this._resizeBlocks(progressed);
      phase = to;
    }

    this._phase = phase;
    return phase;
  }

  _resizeBlocks(progressed) {
    // progressed 0..1 across the whole book → how much of the block is on the left
    const total = 0.14;
    const rightT = Math.max(0.008, total * (1 - progressed));
    const leftT = Math.max(0.006, total * progressed);
    this.rightBlock.scale.z = rightT / 0.14;
    this.rightBlock.position.z = -0.01 + (rightT - 0.14) / 2 + 0.062 - 0.062;
    this.leftBlock.visible = progressed > 0.02;
    this.leftBlock.scale.z = leftT / 0.02;
    this.leftBlock.position.z = -0.05 + (leftT - 0.02) / 2;
    // keep tops roughly under the base pages
    this.rightBlock.position.z = 0.055 - rightT / 2;
    this.leftBlock.position.z = 0.05 - leftT / 2;
  }

  dispose() {
    this._disposables.forEach((d) => d.dispose && d.dispose());
    this.root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => m.dispose && m.dispose());
    });
  }
}

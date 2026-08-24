import * as THREE from 'three';
import { loadImage } from '../data/assets.js';

/*
 * AlbumBook — a real, rigid, handcrafted luxury album.
 * =========================================================================
 * PAGE-STACK ENGINE (rebuilt from zero)
 *
 * The album is modelled as a physical structure of discrete objects, each with
 * exactly one role. Nothing is reused, nothing swaps textures, nothing fades.
 *
 *   back cover  →  right page-bulk  →  last page  →  LEAF[L-1..0]  →  front cover
 *
 * LEAVES. Each leaf is ONE rigid box (real thickness) that exists for the whole
 * animation and owns FIXED textures for its life:
 *     leaf j  front (+z, up on the right) = spread[j].right
 *             back  (-z, up on the left)  = spread[j+1].left
 * So leaf j turning is exactly the transition spread j → spread j+1. Because a
 * leaf's textures never change, the whole class of "wrong image on the wrong
 * side / duplicated photo / blank page / cover texture as a page" bugs cannot
 * occur by construction.
 *
 * DEPTH SLOTS. Every leaf has its own reserved z slot in each stack:
 *     right (unflipped): zR(j) = R_TOP - j*SHEET   (leaf 0 on top)
 *     left  (flipped):   zL(j) = L_BASE + j*SHEET  (leaf 0 at the bottom —
 *                        later leaves land on top of earlier ones, as in a
 *                        real book)
 * Slots are strictly separated by SHEET > leaf thickness, so resting pages can
 * never intersect or z-fight.
 *
 * ONE AT A TIME. Scroll is partitioned into disjoint segments, one per leaf, so
 * exactly one leaf is ever mid-turn; every other leaf is locked at rest in its
 * own slot. A turning leaf flies along lerp(zR → zL) plus a lift arc that
 * carries it above BOTH stacks, so it physically cannot cut through anything.
 * Each segment ends with a hold, so a turn always completes before the next
 * begins.
 *
 * RIGIDITY. Leaves are boxes and never deform — a mounted album board turning,
 * not a floppy magazine page. The hinge is the spine line (x = 0) for the
 * covers and every leaf alike.
 * ========================================================================= */

/* ---- physical constants (album units: page = 1×1, square) --------------- */
const PAGE = 1.0;
const HALF = PAGE / 2;
const BOARD = 0.05; // cover board thickness
const OVERW = 1.04; // cover overhang across
const OVERH = 1.06; // cover overhang up/down
const LEAF_T = 0.012; // one mounted leaf's thickness
const SHEET = 0.018; // depth reserved per leaf (> LEAF_T ⇒ never touching)

/* depth layout (z, +z = out of the open book) */
const BOARD_TOP = -0.065; // top surface of the cover boards when open
const R_TOP = 0.048; // topmost unflipped leaf (leaf 0) on the right
const L_BASE = -0.012; // first landed leaf (leaf 0) on the left
const LAST_PAGE_Z = -0.026; // the static bottom page on the right
const BULK_R = 0.03; // right page-bulk thickness
const BULK_L = 0.045; // left page-bulk thickness (when fully flipped)
const COVER_Z_CLOSED = 0.085; // front cover sits above the whole right stack
const COVER_Z_OPEN = -0.09; // …and settles under the left stack when open
const LIFT = 0.075; // apex of a turning leaf's flight arc

/* ---- timing ------------------------------------------------------------- */
const COVER_SPAN = 0.18; // share of scroll spent opening the cover
const TURN_SHARE = 0.74; // share of each leaf's segment spent turning
//                          the remaining 0.26 is the hold between flips

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class AlbumBook {
  /**
   * Preload and validate the spreads, then build the album.
   *
   * Building only from images that are already known to decode is what stops
   * the album ever appearing as blank pages: any spread that 404s or is
   * blocked is dropped, and if that would leave too few to bind a book we fall
   * back to the bundled artwork rather than rendering an empty one.
   *
   * @param {object} o  as the constructor, plus `spreadFallback`
   * @returns {Promise<AlbumBook|null>} null only if no artwork at all resolves
   */
  static async create(o) {
    const urls = (o.spreads || []).map((s) => s.img);
    const loaded = await Promise.all(urls.map((u, i) => loadImage(u, `Album spread ${i + 1}`, true)));
    let usable = urls.filter((_, i) => loaded[i]);

    if (usable.length < 2) {
      // eslint-disable-next-line no-console
      console.error(
        `[Mementos] only ${usable.length} of ${urls.length} album spreads could be loaded; ` +
          'falling back to the bundled artwork so the album is never blank.',
      );
      const fb = await loadImage(o.spreadFallback, 'Bundled fallback spread', true);
      if (fb) usable = [o.spreadFallback, o.spreadFallback];
    }
    if (usable.length < 2) {
      // eslint-disable-next-line no-console
      console.error('[Mementos] no album artwork could be loaded at all — showing the static hero image.');
      return null;
    }

    const book = new AlbumBook({ ...o, spreads: usable.map((img) => ({ img })) });
    await book.ready;
    return book;
  }

  /**
   * @param {object} o
   * @param {string} o.base                    asset base URL
   * @param {Array<{img:string}>} o.spreads    full 2:1 spread images
   * @param {string} o.coverFabric             cover fabric image url
   * @param {string} o.coverFoil               foil lockup artwork (alpha mask)
   * @param {object} o.coverNames              { line1, amp, line2 } fallback
   */
  constructor(o) {
    this.base = o.base || '/';
    this.spreads = o.spreads;
    this.N = o.spreads.length; // spreads
    this.L = Math.max(1, this.N - 1); // leaves (one per spread transition)
    this.coverFabric = o.coverFabric;
    this.coverFoil = o.coverFoil;
    this.coverNames = o.coverNames || {};

    this.root = new THREE.Group();
    this._tex = new THREE.TextureLoader();
    // Some WordPress hosts serve media/plugin assets from a different origin
    // (a CDN, an offload plugin, a "static.*" subdomain) than the page
    // itself. Without this, a cross-origin image loads fine for on-screen
    // <img> use but WebGL refuses to upload it as a texture, which silently
    // leaves the mesh's default (black) — exactly the "empty pages" symptom.
    this._tex.setCrossOrigin('anonymous');
    this._disposables = [];
    this.leaves = [];

    this.ready = this._build();
  }

  /* ---------------------------------------------------------------------- */
  /* textures                                                               */
  /* ---------------------------------------------------------------------- */

  /**
   * A page material showing one half of a 2:1 spread.
   *
   * The material starts with a plain warm-paper colour and no map; the
   * texture is swapped in only once it has actually loaded. This is
   * deliberate: a `map` sampled from an image that hasn't arrived (or never
   * will, e.g. a 404, or a CORS-blocked cross-origin host) renders as solid
   * black, which is exactly the "empty pages" failure mode — starting from a
   * real fallback colour means a load failure shows a plain page instead.
   *
   * No mirroring is applied to either face. A BoxGeometry's -z face already
   * runs its U axis in the -x direction, and a leaf reaches the left stack via
   * a 180° Y rotation which reverses x again — the two cancel, so the plain
   * half maps the right way round on both the right and the left page.
   */
  _pageMaterial(url, side) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xf0e8d5, roughness: 0.84, metalness: 0 });
    // Spreads are preloaded and validated before the album is built (see
    // AlbumBook.create), so by here the URL is one we already know decodes.
    // The warm paper colour remains only as a belt-and-braces base beneath the
    // photo — a page can never render as a black plane.
    const tex = this._tex.load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      t.repeat.set(0.5, 1);
      t.offset.set(side === 'left' ? 0 : 0.5, 0);
      t.anisotropy = 8;
      mat.map = t;
      mat.color.set(0xffffff); // let the photo read true-colour once it is up
      mat.needsUpdate = true;
    });
    this._disposables.push(tex);
    return mat;
  }

  _fabricMap() {
    const t = this._tex.load(this.coverFabric);
    t.colorSpace = THREE.SRGBColorSpace;
    this._disposables.push(t);
    return t;
  }

  /** Striped page fore-edge — reads as a stack of thick mounted sheets. */
  _edgeMaterial(repeatY) {
    const cv = document.createElement('canvas');
    cv.width = 4;
    cv.height = 96;
    const ctx = cv.getContext('2d');
    for (let y = 0; y < 96; y++) {
      ctx.fillStyle = y % 3 === 0 ? '#d6c6a3' : y % 3 === 1 ? '#f3ebd8' : '#e6dbc4';
      ctx.fillRect(0, y, 4, 1);
    }
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, repeatY || 30);
    t.colorSpace = THREE.SRGBColorSpace;
    this._disposables.push(t);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.86 });
  }

  /**
   * Cover surface maps.
   *
   * The foil is REAL METAL, not a painted gradient: the script drives a
   * metalness/roughness map (metallic + smooth on the glyphs, matte fabric
   * everywhere else) and a bump map for the pressed emboss. It therefore
   * catches the studio environment and the key light, and its highlight
   * travels across the lettering as the album turns — which is what makes
   * stamped foil read as foil.
   *
   * The artwork itself is the studio's own foil lockup, unwarped from the
   * product photograph, so the lettering is the real thing rather than a
   * lookalike typeface. If it cannot be loaded we fall back to setting the
   * names in a script face.
   *
   * @returns {{map:THREE.Texture, orm:THREE.Texture, bump:THREE.Texture}}
   */
  async _coverMaps() {
    const S = 1024;
    const load = (src) =>
      new Promise((res) => {
        if (!src) return res(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = src;
      });

    const [fabric, foil] = await Promise.all([load(this.coverFabric), load(this.coverFoil)]);

    /* --- albedo: fabric, with the foil tinted gold on top ---------------- */
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    if (fabric) {
      const k = Math.max(S / fabric.width, S / fabric.height);
      ctx.drawImage(fabric, (S - fabric.width * k) / 2, (S - fabric.height * k) / 2,
        fabric.width * k, fabric.height * k);
    } else {
      ctx.fillStyle = '#c9c2b6';
      ctx.fillRect(0, 0, S, S);
    }

    // the glyph coverage, however we obtained it, on its own canvas
    const mk = document.createElement('canvas');
    mk.width = mk.height = S;
    const mc = mk.getContext('2d');
    if (foil) {
      mc.drawImage(foil, 0, 0, S, S);
    } else {
      try {
        await document.fonts.ready;
      } catch (e) {
        /* fonts are optional */
      }
      const nm = this.coverNames;
      const script = "'Pinyon Script', 'Snell Roundhand', cursive";
      mc.fillStyle = '#fff';
      mc.textAlign = 'center';
      mc.font = `152px ${script}`;
      mc.fillText(nm.line1 || 'Aysha', S / 2, S * 0.46);
      mc.font = `80px ${script}`;
      mc.fillText(nm.amp || '&', S / 2, S * 0.55);
      mc.font = `152px ${script}`;
      mc.fillText(nm.line2 || 'Alfonse', S / 2, S * 0.66);
    }

    // tint the glyphs gold and lay them over the fabric
    const tint = document.createElement('canvas');
    tint.width = tint.height = S;
    const tc = tint.getContext('2d');
    tc.drawImage(mk, 0, 0);
    tc.globalCompositeOperation = 'source-in';
    const grd = tc.createLinearGradient(0, S * 0.36, 0, S * 0.68);
    grd.addColorStop(0, '#f4dda2');
    grd.addColorStop(0.5, '#caa25c');
    grd.addColorStop(1, '#eacf92');
    tc.fillStyle = grd;
    tc.fillRect(0, 0, S, S);
    ctx.drawImage(tint, 0, 0);

    /* --- ORM: G = roughness, B = metalness (three multiplies by these) --- */
    const orm = document.createElement('canvas');
    orm.width = orm.height = S;
    const oc = orm.getContext('2d');
    oc.fillStyle = 'rgb(0,222,0)'; // matte fabric: rough ~0.87, metal 0
    oc.fillRect(0, 0, S, S);
    const foilOrm = document.createElement('canvas');
    foilOrm.width = foilOrm.height = S;
    const fc = foilOrm.getContext('2d');
    fc.drawImage(mk, 0, 0);
    fc.globalCompositeOperation = 'source-in';
    fc.fillStyle = 'rgb(0,64,255)'; // foil: rough ~0.25, metal 1
    fc.fillRect(0, 0, S, S);
    oc.drawImage(foilOrm, 0, 0);

    /* --- bump: the pressed emboss --------------------------------------- */
    const bump = document.createElement('canvas');
    bump.width = bump.height = S;
    const bc = bump.getContext('2d');
    bc.fillStyle = '#000';
    bc.fillRect(0, 0, S, S);
    bc.drawImage(mk, 0, 0);

    const mkTex = (canvas, srgb) => {
      const t = new THREE.CanvasTexture(canvas);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      this._disposables.push(t);
      return t;
    };
    return { map: mkTex(cv, true), orm: mkTex(orm, false), bump: mkTex(bump, false) };
  }

  /* ---------------------------------------------------------------------- */
  /* structure                                                              */
  /* ---------------------------------------------------------------------- */

  zR(j) {
    return R_TOP - j * SHEET;
  }
  zL(j) {
    return L_BASE + j * SHEET;
  }

  async _build() {
    const S = this.spreads;
    const fabric = (map) =>
      new THREE.MeshStandardMaterial({ map, roughness: 0.78, metalness: 0.02, color: 0xffffff });
    const coverW = PAGE + (OVERW - 1) * PAGE;
    const coverH = PAGE * OVERH;
    // covers overhang outward from the spine, not across it
    const coverOffsetX = coverW / 2 - (OVERW - 1) * PAGE * 0.5;

    /* 1. BACK COVER — under the right stack, its own object. */
    this.backCover = new THREE.Mesh(
      new THREE.BoxGeometry(coverW, coverH, BOARD),
      fabric(this._fabricMap()),
    );
    this.backCover.position.set(coverOffsetX, 0, BOARD_TOP - BOARD / 2);
    this.backCover.castShadow = this.backCover.receiveShadow = true;
    this.root.add(this.backCover);

    /* 2. RIGHT PAGE-BULK — the body of unmodelled sheets, striped fore-edges. */
    const bulkFace = new THREE.MeshStandardMaterial({ color: 0xf0e8d5, roughness: 0.9 });
    this.bulkR = new THREE.Mesh(new THREE.BoxGeometry(PAGE, PAGE, BULK_R), [
      this._edgeMaterial(10),
      this._edgeMaterial(10),
      this._edgeMaterial(10),
      this._edgeMaterial(10),
      bulkFace,
      bulkFace,
    ]);
    this.bulkR.position.set(HALF, 0, BOARD_TOP + BULK_R / 2);
    this.bulkR.castShadow = this.bulkR.receiveShadow = true;
    this.root.add(this.bulkR);

    /* 3. LAST PAGE — the static page revealed on the right at the very end. */
    this.lastPage = new THREE.Mesh(new THREE.BoxGeometry(PAGE, PAGE, LEAF_T), [
      this._edgeMaterial(6),
      this._edgeMaterial(6),
      this._edgeMaterial(6),
      this._edgeMaterial(6),
      this._pageMaterial(S[this.N - 1].img, 'right'),
      bulkFace,
    ]);
    this.lastPage.position.set(HALF, 0, LAST_PAGE_Z);
    this.lastPage.castShadow = this.lastPage.receiveShadow = true;
    this.root.add(this.lastPage);

    /* 4. LEAVES — one rigid box per spread transition, fixed textures, own
     *    pivot at the spine and own depth slot in each stack. */
    for (let j = 0; j < this.L; j++) {
      const pivot = new THREE.Group(); // hinge exactly on the spine line
      pivot.position.set(0, 0, this.zR(j));

      const geo = new THREE.BoxGeometry(PAGE, PAGE, LEAF_T);
      geo.translate(HALF, 0, 0); // page spans x∈[0,1] from the hinge

      const mats = [
        this._edgeMaterial(6), // +x fore-edge
        this._edgeMaterial(6), // -x (spine side)
        this._edgeMaterial(6), // +y
        this._edgeMaterial(6), // -y
        this._pageMaterial(S[j].img, 'right'), // +z front — face-up on the right
        this._pageMaterial(S[j + 1].img, 'left'), // -z back — face-up once landed left
      ];
      const mesh = new THREE.Mesh(geo, mats);
      mesh.castShadow = mesh.receiveShadow = true;
      pivot.add(mesh);
      this.root.add(pivot);
      this.leaves.push({ pivot, mesh });
    }

    /* 5. LEFT PAGE-BULK — grows as leaves land, sits above the front cover and
     *    below every landed leaf. */
    this.bulkL = new THREE.Mesh(new THREE.BoxGeometry(PAGE, PAGE, BULK_L), [
      this._edgeMaterial(12),
      this._edgeMaterial(12),
      this._edgeMaterial(12),
      this._edgeMaterial(12),
      bulkFace,
      bulkFace,
    ]);
    this.bulkL.position.set(-HALF, 0, BOARD_TOP + BULK_L / 2);
    this.bulkL.castShadow = this.bulkL.receiveShadow = true;
    this.bulkL.visible = false;
    this.root.add(this.bulkL);

    /* 6. SPINE — always visible, the binding at x=0 and the true pivot line. */
    this.spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, coverH, 1),
      new THREE.MeshStandardMaterial({
        map: this._fabricMap(),
        roughness: 0.8,
        metalness: 0.02,
        color: 0xb4aca0,
      }),
    );
    this.spine.castShadow = true;
    this.root.add(this.spine);

    /* 7. FRONT COVER — rigid board hinged on the spine; its inside face is the
     *    first spread's left page, so opening reveals a real printed page. */
    this.coverPivot = new THREE.Group();
    this.coverPivot.position.set(0, 0, COVER_Z_CLOSED);
    this.root.add(this.coverPivot);

    const cm = await this._coverMaps();
    const boardEdge = new THREE.MeshStandardMaterial({ color: 0x6a6257, roughness: 0.7 });
    // metalness/roughness come from the ORM map, so the foil is genuinely
    // metallic and the surrounding fabric stays matte on the SAME surface
    const coverFace = new THREE.MeshStandardMaterial({
      map: cm.map,
      metalnessMap: cm.orm,
      roughnessMap: cm.orm,
      metalness: 1,
      roughness: 1,
      bumpMap: cm.bump,
      bumpScale: 0.0035,
      // the hero environment is deliberately dim for the dark mood, and metal
      // is lit almost entirely by reflections — so the foil needs the env
      // pushed well above 1 to read as bright stamped gold
      envMapIntensity: 3.4,
    });
    this.cover = new THREE.Mesh(new THREE.BoxGeometry(coverW, coverH, BOARD), [
      boardEdge,
      boardEdge,
      boardEdge,
      boardEdge,
      coverFace, // +z outside — up when closed
      this._pageMaterial(S[0].img, 'left'), // -z inside — face-up when open
    ]);
    this.cover.position.set(coverOffsetX, 0, 0);
    this.cover.castShadow = this.cover.receiveShadow = true;
    this.coverPivot.add(this.cover);

    this.setLayout(window.innerWidth, window.innerHeight);
    this.setState(0);
    return true;
  }

  /* ---------------------------------------------------------------------- */
  /* framing                                                                */
  /* ---------------------------------------------------------------------- */

  setLayout(vw) {
    if (vw < 900) {
      // Phone/tablet: centred, and scaled from the container width rather than
      // a fixed value so the open 2:1 spread still fits inside a ~390px screen
      // instead of running past its edges. Clamped so it neither overflows on
      // the narrowest phones nor shrinks to nothing on a large tablet.
      const s = clamp(vw / 780, 0.52, 0.9);
      // Sit in the lower half: on a phone the hero copy stacks to the top of
      // the overlay, so a centred album would sit behind the headline and the
      // call-to-action buttons.
      this.root.position.set(0, -0.95, 0);
      this.root.scale.setScalar(s);
      this.root.rotation.set(-0.36, -0.1, 0.02);
    } else {
      // pushed right so the hero copy and story rail stay clear on the left;
      // stood up toward the viewer with enough yaw to read the board thickness
      this.root.position.set(0.82, -0.04, 0);
      this.root.scale.setScalar(1.14);
      this.root.rotation.set(-0.24, -0.26, 0.02);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* state — one leaf turning at a time, everything else locked at rest      */
  /* ---------------------------------------------------------------------- */

  /** Park leaf j at rest: unflipped on the right, or landed on the left. */
  _rest(j, flipped) {
    const lf = this.leaves[j];
    lf.pivot.rotation.y = flipped ? -Math.PI : 0;
    lf.pivot.position.z = flipped ? this.zL(j) : this.zR(j);
  }

  /**
   * Bulk split + spine depth.
   *
   * `landed` is the count of FULLY landed leaves — deliberately discrete, not a
   * continuous fraction. A bulk block's blank top face is only ever safe when a
   * landed leaf is sitting directly on top of it; growing it mid-flight would
   * expose that blank face over the cover's printed inside page.
   */
  _shape(landed, openT) {
    const f = landed / this.L;

    const tR = BULK_R * (1 - f);
    this.bulkR.visible = tR > 0.002;
    this.bulkR.scale.z = Math.max(0.001, tR / BULK_R);
    this.bulkR.position.z = BOARD_TOP + tR / 2;

    const tL = BULK_L * f;
    this.bulkL.visible = tL > 0.002;
    this.bulkL.scale.z = Math.max(0.001, tL / BULK_L);
    this.bulkL.position.z = BOARD_TOP + tL / 2;

    // the binding is deep while closed and flattens as the album opens, so it
    // stays clear of the pages at the gutter instead of poking through them
    this.spine.scale.z = 0.225 - openT * 0.146;
    this.spine.position.z = -0.0025 - openT * 0.073;
  }

  setState(p) {
    p = clamp(p, 0, 1);
    const L = this.L;

    /* --- Scene 1→3: the cover opens from the spine ---------------------- */
    if (p < COVER_SPAN) {
      const t = easeInOut(clamp(p / COVER_SPAN, 0, 1));
      this.coverPivot.rotation.y = -t * Math.PI;
      // the cover lifts over the spine and settles UNDER the left stack
      this.coverPivot.position.z =
        COVER_Z_CLOSED + (COVER_Z_OPEN - COVER_Z_CLOSED) * t + Math.sin(t * Math.PI) * 0.05;
      for (let j = 0; j < L; j++) this._rest(j, false);
      this._shape(0, t);
      this._phase = 0;
      return 0;
    }

    /* --- Scene 4: leaves turn one at a time ----------------------------- */
    this.coverPivot.rotation.y = -Math.PI;
    this.coverPivot.position.z = COVER_Z_OPEN;

    const span = (1 - COVER_SPAN) / L; // one disjoint segment per leaf
    const q = p - COVER_SPAN;
    const active = clamp(Math.floor(q / span), 0, L - 1);
    const local = clamp((q - active * span) / span, 0, 1);
    // turn completes inside the segment; the tail is the hold between flips
    const turn = local >= TURN_SHARE ? 1 : easeInOut(local / TURN_SHARE);

    for (let j = 0; j < L; j++) {
      if (j < active) this._rest(j, true); // already landed on the left
      else if (j > active) this._rest(j, false); // still waiting on the right
      else {
        // the single active leaf: rotate about the spine and fly from its right
        // slot to its left slot, lifted above BOTH stacks so it cannot cut
        // through any resting page
        const lf = this.leaves[j];
        lf.pivot.rotation.y = -turn * Math.PI;
        lf.pivot.position.z =
          this.zR(j) + (this.zL(j) - this.zR(j)) * turn + Math.sin(turn * Math.PI) * LIFT;
      }
    }

    // only leaves that have completed their turn count toward the left bulk
    this._shape(active + (turn >= 1 ? 1 : 0), 1);

    /* --- Scene 5: final open state is simply the last leaf landed -------- */
    const phase = active + (turn >= 1 ? 1 : 0);
    this._phase = phase;
    return phase;
  }

  dispose() {
    this._disposables.forEach((d) => d.dispose && d.dispose());
    this.root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => m.dispose && m.dispose());
    });
  }
}

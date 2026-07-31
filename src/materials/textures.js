import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Canvas-based texture factory.
 * Everything the album needs is generated procedurally so the build is
 * self-contained: woven linen, metallic foil personalization, the cream
 * page-edge block, and printed photo spreads. These are tuned to match the
 * Mementos Studio reference renders (warm sand linen, gold foil script).
 * ------------------------------------------------------------------ */

const TAU = Math.PI * 2;

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function tex(canvas, { repeat = 1, srgb = false } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/* Draw a believable woven-linen field onto ctx (color + visible weave). */
function paintLinen(ctx, size, baseHex) {
  const { r, g, b } = hexToRgb(baseHex);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Fine fibre noise
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    d[i] = Math.max(0, Math.min(255, r + n));
    d[i + 1] = Math.max(0, Math.min(255, g + n));
    d[i + 2] = Math.max(0, Math.min(255, b + n));
  }
  ctx.putImageData(img, 0, 0);

  // Plain-weave: alternating warp (vertical) and weft (horizontal) threads,
  // each thread a touch lighter on top and darker in the valley — the visible
  // crosshatch that reads as linen.
  const step = Math.max(3, Math.round(size / 200));
  ctx.globalAlpha = 0.14;
  for (let x = 0; x < size; x += step) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, 0, Math.max(1, step * 0.45), size);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + step * 0.5, 0, Math.max(1, step * 0.5), size);
  }
  for (let y = 0; y < size; y += step) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, y, size, Math.max(1, step * 0.45));
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, y + step * 0.5, size, Math.max(1, step * 0.5));
  }
  ctx.globalAlpha = 1;

  // Occasional slubs (natural thicker threads) for an organic linen feel
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 90; i++) {
    const horiz = Math.random() > 0.5;
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
    const len = size * (0.04 + Math.random() * 0.12);
    if (horiz) ctx.fillRect(Math.random() * size, Math.random() * size, len, step);
    else ctx.fillRect(Math.random() * size, Math.random() * size, step, len);
  }
  ctx.globalAlpha = 1;
}

/* Grayscale weave used as bump (height) for the linen. */
function paintLinenBump(ctx, size) {
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  const step = Math.max(2, Math.round(size / 256));
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const up = (x / step + y / step) % 2 === 0;
      ctx.fillStyle = up ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
      ctx.fillRect(x, y, step, step);
    }
  }
}

/* A standalone linen material set (used for spine, box, etc.). */
export function linenMaterialSet(baseHex, { repeat = 1, roughness = 0.9 } = {}) {
  const size = 1024;
  const colC = canvas(size);
  paintLinen(colC.getContext('2d'), size, baseHex);
  const bumpC = canvas(size);
  paintLinenBump(bumpC.getContext('2d'), size);
  return {
    map: tex(colC, { repeat, srgb: true }),
    bumpMap: tex(bumpC, { repeat }),
    roughness,
  };
}

/*
 * Soft-touch chamois (microfibre suede). NOT leather, NOT linen: no woven
 * grid — instead a fine velvety grain with a faint directional nap sheen.
 */
function paintChamois(ctx, size, baseHex) {
  const { r, g, b } = hexToRgb(baseHex);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // very fine velvet grain (NO weave grid)
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 9;
    d[i] = Math.max(0, Math.min(255, r + n));
    d[i + 1] = Math.max(0, Math.min(255, g + n));
    d[i + 2] = Math.max(0, Math.min(255, b + n));
  }
  ctx.putImageData(img, 0, 0);

  // soft mottled nap (the cloudy suede look): large blurred light/dark blobs
  ctx.filter = `blur(${Math.round(size / 60)}px)`;
  for (let i = 0; i < 120; i++) {
    ctx.globalAlpha = 0.03 + Math.random() * 0.04;
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
    const rr = size * (0.03 + Math.random() * 0.07);
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, rr, 0, TAU);
    ctx.fill();
  }
  ctx.filter = 'none';
  ctx.globalAlpha = 1;

  // faint directional brushing for the suede sheen
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * size;
    ctx.fillStyle = i % 2 ? '#ffffff' : '#000000';
    ctx.fillRect(0, y, size, 1 + Math.random() * 2);
  }
  ctx.globalAlpha = 1;
}

function paintChamoisBump(ctx, size) {
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 40 + 128;
    d[i] = d[i + 1] = d[i + 2] = n;
  }
  ctx.putImageData(img, 0, 0);
}

/* A standalone chamois material set. */
export function chamoisMaterialSet(baseHex, { repeat = 1, roughness = 0.94 } = {}) {
  const size = 1024;
  const colC = canvas(size);
  paintChamois(colC.getContext('2d'), size, baseHex);
  const bumpC = canvas(size);
  paintChamoisBump(bumpC.getContext('2d'), size);
  return {
    map: tex(colC, { repeat, srgb: true }),
    bumpMap: tex(bumpC, { repeat }),
    roughness,
  };
}

/*
 * Album cover: woven linen with metallic foil personalization.
 * Returns color/metalness/roughness/bump maps so a single MeshStandardMaterial
 * renders matte linen with a true metallic, environment-reflecting foil.
 */
/*
 * The studio's real foil lockup, unwarped from the product photograph. It is
 * loaded once and shared by every box lid and album cover, so the foiling on
 * the 3D boxes is the same artwork that is actually stamped on the products
 * rather than a lookalike typeface. Maps built before it arrives are repainted
 * and flagged for upload as soon as it does.
 */
let FOIL_IMG = null;
const FOIL_READY = (() => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const cfg = window.MEMENTOS || {};
  const base = cfg.assetBase || (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/';
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => { FOIL_IMG = img; res(img); };
    img.onerror = () => res(null);
    img.src = cfg.coverFoil || `${base}foil-script.png`;
  });
})();

export function coverTextures({
  baseHex = '#d8c4a6',
  foil = 'gold', // 'gold' | 'silver' | 'black'
  weave = 'linen', // 'linen' | 'chamois'
  name = 'Aysha & Alfonse',
  date = 'Oct 4, 2024',
  showLogo = false,
} = {}) {
  const size = 1024;
  const foilAlbedo = { gold: '#c8a25c', silver: '#cfd2d6', black: '#2a2620' }[foil] || '#c8a25c';
  const paintBase = weave === 'chamois' ? paintChamois : paintLinen;
  const paintBump = weave === 'chamois' ? paintChamoisBump : paintLinenBump;

  const colC = canvas(size);
  const colX = colC.getContext('2d');
  paintBase(colX, size, baseHex);

  const metC = canvas(size);
  const metX = metC.getContext('2d');
  metX.fillStyle = '#000'; // linen = dielectric
  metX.fillRect(0, 0, size, size);

  const rghC = canvas(size);
  const rghX = rghC.getContext('2d');
  rghX.fillStyle = '#d8d8d8'; // linen rough ~0.85
  rghX.fillRect(0, 0, size, size);

  const bmpC = canvas(size);
  const bmpX = bmpC.getContext('2d');
  paintBump(bmpX, size);

  // --- Personalization, drawn identically into every map ---
  const cx = size / 2;
  const drawText = (ctx, fill) => {
    ctx.fillStyle = fill;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const names = name.split('&').map((s) => s.trim());
    ctx.font = `italic 500 ${size * 0.135}px 'Cormorant Garamond', serif`;
    if (names.length === 2) {
      ctx.fillText(names[0], cx, size * 0.45);
      ctx.font = `italic 500 ${size * 0.07}px 'Cormorant Garamond', serif`;
      ctx.fillText('&', cx, size * 0.545);
      ctx.font = `italic 500 ${size * 0.135}px 'Cormorant Garamond', serif`;
      ctx.fillText(names[1], cx, size * 0.64);
    } else {
      ctx.fillText(name, cx, size * 0.5);
    }
    ctx.font = `400 ${size * 0.032}px 'Cormorant Garamond', serif`;
    ctx.fillText(date.toUpperCase(), cx, size * 0.72);

    if (showLogo) {
      ctx.font = `500 ${size * 0.03}px 'Inter', sans-serif`;
      ctx.fillText('MEMENTOS STUDIO', cx, size * 0.82);
    }
  };

  // Stamp the artwork if we have it, else set the names in type.
  const stamp = (ctx, fill) => {
    if (!FOIL_IMG) return drawText(ctx, fill);
    const w = size * 0.56;
    const h = (FOIL_IMG.height / FOIL_IMG.width) * w;
    const off = canvas(size);
    const oc = off.getContext('2d');
    oc.drawImage(FOIL_IMG, (size - w) / 2, size * 0.5 - h / 2, w, h);
    oc.globalCompositeOperation = 'source-in';
    oc.fillStyle = fill;
    oc.fillRect(0, 0, size, size);
    ctx.drawImage(off, 0, 0);
  };

  const paintAll = () => {
    paintBase(colX, size, baseHex);
    metX.fillStyle = '#000'; metX.fillRect(0, 0, size, size);
    rghX.fillStyle = '#d8d8d8'; rghX.fillRect(0, 0, size, size);
    paintBump(bmpX, size);

    stamp(colX, foilAlbedo); // foil colour in albedo
    stamp(metX, foil === 'black' ? '#202020' : '#ffffff'); // metallic where foil
    stamp(rghX, foil === 'black' ? '#666666' : '#3a3a3a'); // foil is smoother than linen

    // Deboss: the foil sits in a slightly pressed well
    bmpX.save();
    bmpX.shadowColor = 'rgba(0,0,0,0.6)';
    bmpX.shadowBlur = size * 0.012;
    stamp(bmpX, 'rgba(120,120,120,1)');
    bmpX.restore();
  };
  paintAll();

  const maps = {
    map: tex(colC, { srgb: true }),
    metalnessMap: tex(metC),
    roughnessMap: tex(rghC),
    bumpMap: tex(bmpC),
  };
  // repaint with the real artwork once it lands
  FOIL_READY.then((img) => {
    if (!img) return;
    paintAll();
    Object.values(maps).forEach((t) => { t.needsUpdate = true; });
  });
  return maps;
}

/* The cream page-edge block (seen on the sides of the closed album). */
export function pageEdgeTexture() {
  const w = 1024;
  const h = 128;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  const grad = x.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#fbf7f0');
  grad.addColorStop(0.5, '#efe7d8');
  grad.addColorStop(1, '#fbf7f0');
  x.fillStyle = grad;
  x.fillRect(0, 0, w, h);
  // fine page striations
  x.globalAlpha = 0.5;
  for (let i = 0; i < w; i += 2) {
    x.strokeStyle = i % 4 ? 'rgba(180,168,148,0.5)' : 'rgba(255,255,255,0.6)';
    x.beginPath();
    x.moveTo(i + 0.5, 0);
    x.lineTo(i + 0.5, h);
    x.stroke();
  }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/*
 * A printed photo spread. We do not embed the real reference photographs;
 * instead each spread is an elegant, warm editorial layout (soft gradient
 * imagery inside a print border) so every page turn shows something different.
 */
const SPREAD_PALETTES = [
  ['#caa98a', '#7d5a3f', '#3a2a1d'],
  ['#bcae97', '#6e7257', '#2f3326'],
  ['#c9b7a3', '#9a7d63', '#4a3625'],
  ['#b9c2c4', '#6d7e82', '#2c3a3d'],
  ['#cdb39a', '#86614a', '#3a241a'],
  ['#d3c3ad', '#8d7a64', '#473726'],
];

export function spreadTexture(index = 0, { panorama = false, half = null } = {}) {
  const w = panorama ? 2048 : 1536;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  const pal = SPREAD_PALETTES[index % SPREAD_PALETTES.length];

  // paper
  x.fillStyle = '#fbf8f2';
  x.fillRect(0, 0, w, h);

  const border = Math.round(h * 0.06);
  const drawPhoto = (px, py, pw, ph, seed) => {
    // soft cinematic gradient "image"
    const g = x.createRadialGradient(
      px + pw * (0.35 + 0.3 * Math.sin(seed)),
      py + ph * 0.4,
      ph * 0.1,
      px + pw * 0.5,
      py + ph * 0.5,
      pw * 0.8,
    );
    g.addColorStop(0, pal[0]);
    g.addColorStop(0.55, pal[1]);
    g.addColorStop(1, pal[2]);
    x.fillStyle = g;
    x.fillRect(px, py, pw, ph);
    // gentle bokeh
    for (let i = 0; i < 26; i++) {
      const r = (8 + Math.random() * 34) * (h / 1024);
      x.globalAlpha = 0.05 + Math.random() * 0.12;
      x.fillStyle = i % 2 ? '#fff7e8' : pal[0];
      x.beginPath();
      x.arc(px + Math.random() * pw, py + Math.random() * ph * 0.8, r, 0, TAU);
      x.fill();
    }
    x.globalAlpha = 1;
    // vignette
    const v = x.createRadialGradient(
      px + pw / 2, py + ph / 2, ph * 0.2,
      px + pw / 2, py + ph / 2, pw * 0.7,
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.32)');
    x.fillStyle = v;
    x.fillRect(px, py, pw, ph);
  };

  if (panorama) {
    drawPhoto(border, border, w - border * 2, h - border * 2, index + 1);
  } else {
    const gap = border;
    const pw = (w - border * 2 - gap) / 2;
    const ph = h - border * 2;
    drawPhoto(border, border, pw, ph, index + 1);
    drawPhoto(border + pw + gap, border, pw, ph, index + 3.3);
  }

  let out = c;
  if (half) {
    out = document.createElement('canvas');
    out.width = w / 2;
    out.height = h;
    const sx = half === 'right' ? w / 2 : 0;
    out.getContext('2d').drawImage(c, sx, 0, w / 2, h, 0, 0, w / 2, h);
  }

  const t = new THREE.CanvasTexture(out);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* Ensure web fonts are ready before any text is rasterised into a canvas. */
export async function ensureFonts() {
  if (!document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load("500 48px 'Cormorant Garamond'"),
      document.fonts.load("italic 500 48px 'Cormorant Garamond'"),
      document.fonts.load("400 24px 'Inter'"),
    ]);
    await document.fonts.ready;
  } catch (e) {
    /* fall back to default serif */
  }
}

/* =========================================================================
 * Branded shipping mailer
 * =========================================================================
 * Printed artwork for the Mementos Studio mailer, matching the real packaging:
 * the "rs" mark with the stacked MEMENTOS STUDIO wordmark, the brand line, a
 * thank-you message on the front wall, and a faint diagonal watermark lattice
 * of the mark across every printed panel.
 * ====================================================================== */

const MAILER_PAPER = '#f6f1e9';
const MAILER_INK = '#9d7952';

/** The rounded-square "rs" monogram, drawn at (x,y) with the given size. */
function drawMark(ctx, x, y, size, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.115;
  ctx.lineJoin = 'round';
  const r = size * 0.3;
  const o = ctx.lineWidth / 2;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x + o, y + o, size - o * 2, size - o * 2, r);
  } else {
    ctx.rect(x + o, y + o, size - o * 2, size - o * 2);
  }
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${size * 0.5}px 'Jost', 'Futura', system-ui, sans-serif`;
  ctx.fillText('rs', x + size / 2, y + size * 0.54);
  ctx.restore();
}

/** A small heart glyph, used as the brand's sign-off. */
function drawHeart(ctx, cx, cy, s, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.35);
  ctx.bezierCurveTo(cx - s * 0.9, cy - s * 0.25, cx - s * 0.35, cy - s * 0.8, cx, cy - s * 0.28);
  ctx.bezierCurveTo(cx + s * 0.35, cy - s * 0.8, cx + s * 0.9, cy - s * 0.25, cx, cy + s * 0.35);
  ctx.fill();
  ctx.restore();
}

/** Letter-spaced uppercase line, centred on cx. */
function spacedLine(ctx, text, cx, y, px, spacing, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `500 ${px}px 'Jost', system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  let w = -spacing;
  for (const ch of text) w += ctx.measureText(ch).width + spacing;
  let x = cx - w / 2;
  for (const ch of text) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }
  ctx.restore();
}

/** Warm paper base + the faint diagonal watermark lattice. */
function paintMailerPaper(ctx, size) {
  ctx.fillStyle = MAILER_PAPER;
  ctx.fillRect(0, 0, size, size);

  // subtle paper tooth
  for (let i = 0; i < size * 26; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(160,140,115,0.05)';
    ctx.fillRect(x, y, 1.3, 1.3);
  }

  // diagonal lattice of marks + sparkles
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.translate(-size, -size);
  const step = size * 0.13;
  const m = size * 0.036;
  for (let gy = 0; gy < size * 2; gy += step) {
    for (let gx = 0; gx < size * 2; gx += step) {
      const odd = Math.round(gy / step) % 2;
      const px = gx + (odd ? step / 2 : 0);
      drawMark(ctx, px, gy, m, MAILER_INK, 0.085);
      drawHeart(ctx, px + step * 0.5, gy + m * 0.5, m * 0.3, MAILER_INK, 0.07);
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = MAILER_INK;
      ctx.beginPath();
      ctx.arc(px + step * 0.25, gy + step * 0.55, m * 0.06, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

/**
 * @returns {{brand:THREE.Texture, thanks:THREE.Texture, plain:THREE.Texture}}
 *   brand  — the full lockup (mark + wordmark + brand line + heart)
 *   thanks — the thank-you message for the front wall
 *   plain  — watermark only, for the remaining printed panels
 */
export function mailerTextures({
  wordmark = ['MEMENTOS', 'STUDIO'],
  tagline = ['WHERE MOMENTS BECOME', 'TIMELESS TREASURES.'],
  thanks = ['THANK YOU FOR TRUSTING US', 'WITH YOUR MEMORIES.'],
} = {}) {
  const size = 1024;

  /* --- full brand lockup --------------------------------------------- */
  const bc = canvas(size);
  const b = bc.getContext('2d');
  paintMailerPaper(b, size);

  const markS = size * 0.115;
  const wmPx = size * 0.075;
  b.font = `600 ${wmPx}px 'Jost', system-ui, sans-serif`;
  const wmW = Math.max(b.measureText(wordmark[0]).width, b.measureText(wordmark[1] || '').width);
  const gap = size * 0.032;
  const total = markS + gap + wmW;
  const left = (size - total) / 2;
  const midY = size * 0.34;

  drawMark(b, left, midY - markS / 2, markS, MAILER_INK);
  b.fillStyle = MAILER_INK;
  b.textAlign = 'left';
  b.textBaseline = 'middle';
  b.font = `600 ${wmPx}px 'Jost', system-ui, sans-serif`;
  b.fillText(wordmark[0], left + markS + gap, midY - wmPx * 0.52);
  if (wordmark[1]) b.fillText(wordmark[1], left + markS + gap, midY + wmPx * 0.52);

  spacedLine(b, tagline[0], size / 2, size * 0.46, size * 0.031, size * 0.006, MAILER_INK);
  if (tagline[1]) spacedLine(b, tagline[1], size / 2, size * 0.505, size * 0.031, size * 0.006, MAILER_INK);
  drawHeart(b, size / 2, size * 0.565, size * 0.026, MAILER_INK);

  /* --- thank-you panel (front wall) -----------------------------------
     The wall is a wide, short strip, so this panel is drawn at that aspect
     rather than square — a square texture stretched onto it would crop and
     distort the message. */
  const tw = 2048;
  const th = 420;
  const tc = document.createElement('canvas');
  tc.width = tw;
  tc.height = th;
  const t = tc.getContext('2d');
  paintMailerPaper(t, tw); // fills generously; the strip crops it
  t.save();
  t.beginPath();
  t.rect(0, 0, tw, th);
  t.clip();
  spacedLine(t, thanks[0], tw / 2, th * 0.36, th * 0.15, th * 0.032, MAILER_INK);
  if (thanks[1]) spacedLine(t, thanks[1], tw / 2, th * 0.6, th * 0.15, th * 0.032, MAILER_INK);
  drawHeart(t, tw / 2, th * 0.85, th * 0.1, MAILER_INK);
  t.restore();

  /* --- watermark only -------------------------------------------------- */
  const pc = canvas(size);
  paintMailerPaper(pc.getContext('2d'), size);

  return {
    brand: tex(bc, { srgb: true }),
    thanks: tex(tc, { srgb: true }),
    plain: tex(pc, { srgb: true }),
  };
}

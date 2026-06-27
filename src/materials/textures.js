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

/* Draw a believable woven-linen field onto ctx (color + subtle weave). */
function paintLinen(ctx, size, baseHex) {
  const { r, g, b } = hexToRgb(baseHex);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Cloth slubs / large tonal variation
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    d[i] = Math.max(0, Math.min(255, r + n));
    d[i + 1] = Math.max(0, Math.min(255, g + n));
    d[i + 2] = Math.max(0, Math.min(255, b + n));
  }
  ctx.putImageData(img, 0, 0);

  // Woven thread lines (warp + weft) — fine and low contrast
  ctx.globalAlpha = 0.06;
  const step = Math.max(2, Math.round(size / 256));
  for (let x = 0; x < size; x += step) {
    ctx.fillStyle = x % (step * 2) ? '#ffffff' : '#000000';
    ctx.fillRect(x, 0, 1, size);
  }
  for (let y = 0; y < size; y += step) {
    ctx.fillStyle = y % (step * 2) ? '#000000' : '#ffffff';
    ctx.fillRect(0, y, size, 1);
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
 * Album cover: woven linen with metallic foil personalization.
 * Returns color/metalness/roughness/bump maps so a single MeshStandardMaterial
 * renders matte linen with a true metallic, environment-reflecting foil.
 */
export function coverTextures({
  baseHex = '#d8c4a6',
  foil = 'gold', // 'gold' | 'silver' | 'black'
  name = 'Aysha & Alfonse',
  date = 'Oct 4, 2024',
  showLogo = false,
} = {}) {
  const size = 1024;
  const foilAlbedo = { gold: '#c8a25c', silver: '#cfd2d6', black: '#2a2620' }[foil] || '#c8a25c';

  const colC = canvas(size);
  const colX = colC.getContext('2d');
  paintLinen(colX, size, baseHex);

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
  paintLinenBump(bmpX, size);

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

  drawText(colX, foilAlbedo); // foil colour in albedo
  drawText(metX, foil === 'black' ? '#202020' : '#ffffff'); // metallic where foil (black foil less metallic)
  drawText(rghX, foil === 'black' ? '#666666' : '#3a3a3a'); // foil is smoother than linen

  // Deboss: the foil sits in a slightly pressed well -> darken bump around text
  bmpX.save();
  bmpX.shadowColor = 'rgba(0,0,0,0.6)';
  bmpX.shadowBlur = size * 0.012;
  drawText(bmpX, 'rgba(120,120,120,1)');
  bmpX.restore();

  return {
    map: tex(colC, { srgb: true }),
    metalnessMap: tex(metC),
    roughnessMap: tex(rghC),
    bumpMap: tex(bmpC),
  };
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

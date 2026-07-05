/*
 * flipAlbum.js — Mementos Studio hero album + material configurator
 * =========================================================================
 * 1. initFlipAlbum()   — scroll-pinned CSS-3D album. The album is SQUARE when
 *                        closed (front cover = one square page-face on the
 *                        right, hinged at the centre spine) and opens to a 2:1
 *                        layflat spread as the cover swings left. Base pages +
 *                        chrome fade in only as the cover opens, so the closed
 *                        state reads as a clean square album, never a wide
 *                        landscape panel.
 * 2. initFinishPicker() — luxury material configurator. Recolours a real album
 *                        cutout (luminance-preserving hue swap, so weave,
 *                        highlights and shadows survive), draws metallic foil
 *                        (gold/silver/black) on the cover, and drives textured
 *                        material swatches with live material + foil labels.
 * ========================================================================= */

import { CHAMOIS, LINEN, FOILS } from '../data/swatches.js';

const BASE = import.meta.env.BASE_URL || '/';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1);
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

/* -------------------------------------------------------------------------
 * 1. Square scroll-driven layflat album
 * ---------------------------------------------------------------------- */
export function initFlipAlbum(opts = {}) {
  const onPhase = opts.onPhase || null;

  const enc = (n) => `${BASE}Spreads/web/spread${n}.webp`;
  // Dark, full-bleed spreads only — spreads matted on white (01) or with large
  // bright windows (02) are skipped so no empty-looking white page ever appears.
  const SPREADS = [
    { img: enc('06'), cap: 'Before everything began' },
    { img: enc('03'), cap: 'A closer look' },
    { img: enc('07'), cap: 'Every detail in its place' },
    { img: enc('08'), cap: 'The two of them' },
    { img: enc('09'), cap: 'And the family became one' },
  ];
  const N = SPREADS.length;

  const $ = (id) => document.getElementById(id);
  const stage = $('flipStage');
  const album = document.querySelector('#albumScroll .album');
  const thickness = $('flipThickness');
  const baseLeft = $('flipBaseLeft');
  const baseRight = $('flipBaseRight');
  const leaf = $('flipLeaf');
  const leafFront = $('flipLeafFront');
  const leafBack = $('flipLeafBack');
  const leafFrontShade = $('flipLeafFrontShade');
  const leafBackShade = $('flipLeafBackShade');
  const cover = $('flipCover');
  const sweep = $('flipSweep');
  const capTxt = $('flipCapTxt');
  const ticks = $('flipTicks');
  const scrollSection = $('albumScroll');
  const chrome = document.querySelector('#albumScroll .chrome');
  const blockEdge = document.querySelector('#albumScroll .block-edge');
  const spread = document.querySelector('#albumScroll .spread'); // faded group
  if (!stage || !scrollSection) return null;

  // page-thickness stack (square page block on the right, behind the cover)
  [7, 5, 3].forEach((d) => {
    const el = document.createElement('div');
    el.className = 'layer';
    el.style.left = 500 - d + 'px';
    el.style.top = d + 4 + 'px';
    el.style.width = 500 + d * 2 + 'px';
    el.style.height = '500px';
    thickness.appendChild(el);
  });
  if (ticks) for (let i = 0; i < N; i++) ticks.appendChild(document.createElement('b'));
  const tickEls = ticks ? ticks.querySelectorAll('b') : [];

  SPREADS.forEach((s) => {
    const im = new Image();
    im.src = s.img;
  });

  // The inside of the front cover shows the FIRST spread's left page, so opening
  // the cover physically reveals a printed page (not a blank/branded endpaper).
  const coverBack = document.querySelector('#flipCover .back');
  if (coverBack) coverBack.style.backgroundImage = 'url("' + SPREADS[0].img + '")';

  const COVER = 0.22; // more scroll for a slow, heavy open
  const TURN = (1 - COVER) / (N - 1);
  const TURN_MOVE = 0.62; // more of each segment spent turning = slower flip

  function state(p) {
    if (p < COVER) {
      const cp = easeInOutCubic(clamp(p / COVER, 0, 1));
      return { open: cp, coverRot: -cp * 178, cur: 0, turning: false, from: 0, to: 0, leafRot: 0, leafShadow: 0 };
    }
    const q = p - COVER;
    const segi = Math.min(N - 2, Math.floor(q / TURN));
    const local = (q - segi * TURN) / TURN;
    const from = segi;
    const to = segi + 1;
    if (local < TURN_MOVE) {
      const lp = easeInOutCubic(clamp(local / TURN_MOVE, 0, 1));
      return { open: 1, coverRot: -178, cur: from, turning: true, from, to, leafRot: -lp * 180, leafShadow: lp };
    }
    return { open: 1, coverRot: -178, cur: to, turning: false, from: to, to, leafRot: -180, leafShadow: 1 };
  }

  let lastPhaseKey = '';
  let curCaption = -1;
  function render(p) {
    const s = state(p);

    // Cover swings from the centre spine; hide once flat-open.
    if (s.coverRot > -177.5) {
      cover.style.display = 'block';
      cover.style.transform = 'rotateY(' + s.coverRot + 'deg)';
    } else {
      cover.style.display = 'none';
    }

    // No opacity fade — the spread is revealed PHYSICALLY by the cover rotating
    // away (occlusion). The right page sits under the closed cover and is
    // uncovered as the cover lifts. The LEFT page is the cover's own inside face
    // while it rotates; the flat left page only takes over once the cover is
    // fully open (hidden), so the same photo is never drawn twice at once.
    const coverStillMoving = s.coverRot > -177.5; // cover element still visible
    const showLeftPage = !coverStillMoving; // flat left page only after cover is gone
    baseLeft.style.display = showLeftPage ? 'block' : 'none';
    if (chrome) chrome.style.display = showLeftPage ? 'block' : 'none';
    // full-width page-block edge belongs to the fully-open spread; when closed or
    // opening, only the right square's block (.album::after) shows.
    if (blockEdge) blockEdge.style.display = showLeftPage ? 'block' : 'none';

    const baseSpread = s.turning ? s.from : s.cur;
    baseLeft.style.backgroundImage = 'url("' + SPREADS[baseSpread].img + '")';
    const rightSpread = s.turning ? s.to : s.cur;
    baseRight.style.backgroundImage = 'url("' + SPREADS[rightSpread].img + '")';

    if (s.turning) {
      leaf.style.display = 'block';
      leaf.style.transform = 'rotateY(' + s.leafRot + 'deg)';
      leafFront.style.backgroundImage = 'url("' + SPREADS[s.from].img + '")';
      leafBack.style.backgroundImage = 'url("' + SPREADS[s.to].img + '")';
      leafFront.style.opacity = s.leafRot > -90 ? 1 : 0;
      leafBack.style.opacity = s.leafRot <= -90 ? 1 : 0;
      leafFrontShade.style.background =
        'linear-gradient(90deg, rgba(20,12,8,' + (0.05 + s.leafShadow * 0.35) + ') 0%, rgba(20,12,8,0) 32%)';
      leafBackShade.style.background =
        'linear-gradient(270deg, rgba(20,12,8,' + (0.05 + (1 - s.leafShadow) * 0.35) + ') 0%, rgba(20,12,8,0) 32%)';
    } else {
      leaf.style.display = 'none';
    }

    if (sweep) sweep.style.transform = 'rotate(14deg) translateX(' + (p * 1400 - 260) + 'px)';

    const capIdx = s.turning ? -1 : s.cur;
    if (capIdx !== curCaption) {
      curCaption = capIdx;
      if (capTxt) {
        if (capIdx >= 0) {
          capTxt.textContent = SPREADS[capIdx].cap;
          capTxt.parentNode.style.opacity = 1;
        } else capTxt.parentNode.style.opacity = 0;
      }
    }
    if (capTxt) capTxt.parentNode.style.opacity = showLeftPage && !s.turning ? 1 : 0;

    for (let i = 0; i < tickEls.length; i++) {
      tickEls[i].className = i === s.cur && !s.turning ? 'on' : '';
    }

    const key = s.cur + ':' + (s.turning ? 1 : 0);
    if (onPhase && key !== lastPhaseKey) {
      lastPhaseKey = key;
      onPhase(s.cur, s.turning, p);
    }
  }

  let target = 0;
  let current = 0;
  let rafId = null;
  function computeTarget() {
    const rect = scrollSection.getBoundingClientRect();
    const scrollable = scrollSection.offsetHeight - window.innerHeight;
    if (scrollable <= 0) {
      target = 0;
      return;
    }
    target = clamp(-rect.top / scrollable, 0, 1);
  }
  function tick() {
    current = lerp(current, target, 0.09); // heavier, slower settle
    if (Math.abs(current - target) < 0.0002) current = target;
    render(current);
    if (Math.abs(current - target) > 0.00005) rafId = requestAnimationFrame(tick);
    else {
      rafId = null;
      render(target);
    }
  }
  function kick() {
    if (rafId == null) rafId = requestAnimationFrame(tick);
  }
  function onScroll() {
    computeTarget();
    kick();
  }
  function fit() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let f = Math.min(vw / 1240, vh / 980);
    f = Math.max(0.34, f);
    stage.style.setProperty('--fit', f);
  }

  // more travel per turn for a slower, premium page-flip
  scrollSection.style.minHeight = 170 + (N - 1) * 190 + 'vh';

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    fit();
    computeTarget();
    render(current);
  });
  fit();
  computeTarget();
  render(0);
  kick();
  return { render, spreadCount: N };
}

/* -------------------------------------------------------------------------
 * 2. Material configurator — recolour the cutout, metallic foil, textures
 * ---------------------------------------------------------------------- */
export function initFinishPicker() {
  const W = 1254;
  const H = 1254;
  const K = 1.08;
  const CUTOUT = `${BASE}mockups/album-mockup-transparent.png`;
  const FA = [404, 167];
  const FB = [1184, 267];
  const FD = [132, 784];

  const canvas = document.getElementById('albumCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const loading = document.getElementById('canvasLoading');
  const matLabel = document.getElementById('matLabel');
  const foilLabel = document.getElementById('foilLabel');
  const gridC = document.getElementById('swChamois');
  const gridL = document.getElementById('swLinen');
  const gridF = document.getElementById('swFoil');
  const wrap = document.querySelector('.album-canvas-wrap');

  const FOIL = {
    gold: { base: '#c2a367', hi: '#f0dca6', lo: '#8f6f39', shadow: 'rgba(60,40,18,0.40)' },
    silver: { base: '#c9ccd0', hi: '#ffffff', lo: '#8f969d', shadow: 'rgba(40,46,52,0.34)' },
    black: { base: '#2a2622', hi: '#5c554c', lo: '#141210', shadow: 'rgba(255,248,236,0.14)' },
  };
  let foilCode = 'gold';

  const rgb2hsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0; const l = (mx + mn) / 2; const d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  };
  const hsl2rgb = (h, s, l) => {
    h /= 360;
    const f = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    let r, g, b;
    if (s === 0) r = g = b = l;
    else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3);
    }
    return [r * 255, g * 255, b * 255];
  };
  const hex2rgb = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  let baseData = null, maskIdx = null, maskY = null, Ymean = 0, workImg = null, ready = false;

  function drawFoil() {
    if (document.fonts && document.fonts.load) {
      document.fonts.load('120px "Pinyon Script"').then(drawFoilNow, drawFoilNow);
    } else drawFoilNow();
  }
  function drawFoilNow() {
    const ux = FB[0] - FA[0], uy = FB[1] - FA[1], vx = FD[0] - FA[0], vy = FD[1] - FA[1];
    const ul = Math.hypot(ux, uy), vl = Math.hypot(vx, vy);
    const un = [ux / ul, uy / ul], vn = [vx / vl, vy / vl];
    const cx = (FB[0] + FD[0]) / 2, cy = (FB[1] + FD[1]) / 2;
    const F = FOIL[foilCode];
    ctx.save();
    ctx.setTransform(un[0], un[1], vn[0], vn[1], cx, cy);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Metallic fill: a vertical gradient across each glyph run, plus a soft
    // emboss shadow underneath so the foil reads as pressed into the cover.
    function metal(txt, size, ly, font) {
      ctx.font = font || size + 'px "Pinyon Script", cursive';
      // emboss / debossed shadow
      ctx.fillStyle = F.shadow;
      ctx.fillText(txt, foilCode === 'black' ? -1.5 : 2, ly + 2);
      // metallic gradient body
      const g = ctx.createLinearGradient(0, ly - size * 0.5, 0, ly + size * 0.5);
      g.addColorStop(0, F.hi);
      g.addColorStop(0.45, F.base);
      g.addColorStop(0.55, F.base);
      g.addColorStop(1, F.lo);
      ctx.fillStyle = g;
      ctx.fillText(txt, 0, ly);
    }
    metal('Aysha', 116, -70);
    metal('&', 60, 2);
    metal('Alfonse', 116, 74);
    metal('OCT 4, 2024', 24, 152, '500 24px "Jost", sans-serif');
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function buildMask() {
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    workImg = ctx.createImageData(W, H);
    const mIdx = [], ys = [];
    let sum = 0;
    for (let p = 0; p < W * H; p++) {
      const i = p * 4;
      if (d[i + 3] < 40) continue;
      const hsl = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      const s = hsl[1];
      const Y = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      // keep the white page block + deepest seams: only recolour the coloured
      // cover linen (chroma gate) that is not near-white (page edges).
      if (Y < 0.4 || s < 0.11) continue;
      mIdx.push(p); ys.push(Y); sum += Y;
    }
    baseData = new Uint8ClampedArray(d);
    maskIdx = new Int32Array(mIdx);
    maskY = new Float32Array(ys);
    Ymean = sum / mIdx.length;
    ready = true;
    ctx.putImageData(img, 0, 0);
    drawFoil();
  }

  let lastTarget = null;
  function paint(rgb) {
    const hsl = rgb2hsl(rgb[0], rgb[1], rgb[2]);
    const th = hsl[0], ts = hsl[1], tl = hsl[2];
    const d = workImg.data;
    d.set(baseData);
    for (let k = 0; k < maskIdx.length; k++) {
      const i = maskIdx[k] * 4;
      let nl = tl + (maskY[k] - Ymean) * K;
      if (nl < 0.03) nl = 0.03;
      else if (nl > 0.97) nl = 0.97;
      const c = hsl2rgb(th, ts, nl);
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
    }
    ctx.putImageData(workImg, 0, 0);
    drawFoil();
  }
  // Smooth, premium transition: brief soft fade on the preview when it updates.
  function applyTarget(rgb) {
    if (!ready) return;
    lastTarget = rgb;
    if (wrap) {
      wrap.classList.remove('is-updating');
      // force reflow so the animation restarts every pick
      void wrap.offsetWidth;
      wrap.classList.add('is-updating');
    }
    paint(rgb);
  }

  const flipFront = document.querySelector('#flipCover .front');
  const shade = (rgb, f) => {
    const g = (c) => Math.max(0, Math.min(255, Math.round(f >= 1 ? c + (255 - c) * (f - 1) : c * f)));
    return 'rgb(' + g(rgb[0]) + ',' + g(rgb[1]) + ',' + g(rgb[2]) + ')';
  };
  function tintFlipCover(rgb) {
    if (!flipFront) return;
    flipFront.style.setProperty('--flip-a', shade(rgb, 1.14));
    flipFront.style.setProperty('--flip-b', shade(rgb, 0.92));
    flipFront.style.setProperty('--flip-c', shade(rgb, 0.6));
  }

  let selMat = null;
  function makeMaterialSwatch(item, kind, grid) {
    const rgb = hex2rgb(item.hex);
    const b = document.createElement('button');
    b.className = 'swatch swatch--material';
    b.type = 'button';
    b.setAttribute('aria-label', kind + ' ' + item.code);
    b.setAttribute('aria-pressed', 'false');
    b.style.backgroundImage = `url("${BASE}swatches/${item.code}.jpg")`;
    // subtle tint wash matched to the sampled colour keeps texture but reads true
    b.style.setProperty('--sw', item.hex);
    grid.appendChild(b);
    b.addEventListener('click', () => {
      if (!ready) return;
      applyTarget(rgb);
      tintFlipCover(rgb);
      if (matLabel) matLabel.textContent = `${kind} · ${item.code}`;
      if (selMat) selMat.setAttribute('aria-pressed', 'false');
      selMat = b;
      b.setAttribute('aria-pressed', 'true');
    });
    return b;
  }

  let selFoil = null;
  function makeFoilSwatch(item, grid) {
    const b = document.createElement('button');
    b.className = 'swatch swatch--foil';
    b.type = 'button';
    b.setAttribute('aria-label', 'Foil ' + item.label);
    b.setAttribute('aria-pressed', item.code === foilCode ? 'true' : 'false');
    b.style.background = item.chip;
    grid.appendChild(b);
    if (item.code === foilCode) selFoil = b;
    b.addEventListener('click', () => {
      foilCode = item.code;
      if (selFoil) selFoil.setAttribute('aria-pressed', 'false');
      selFoil = b;
      b.setAttribute('aria-pressed', 'true');
      if (ready) {
        if (wrap) { wrap.classList.remove('is-updating'); void wrap.offsetWidth; wrap.classList.add('is-updating'); }
        if (lastTarget) paint(lastTarget);
        else drawFoil();
      }
      if (foilLabel) foilLabel.textContent = `${item.label} foil`;
    });
    return b;
  }

  const album = new Image();
  album.onload = function () {
    ctx.drawImage(album, 0, 0, W, H);
    if (loading) loading.style.display = 'none';
    setTimeout(function () {
      buildMask();
      CHAMOIS.forEach((it) => makeMaterialSwatch(it, 'Chamois', gridC));
      LINEN.forEach((it) => makeMaterialSwatch(it, 'Linen', gridL));
      if (gridF) FOILS.forEach((it) => makeFoilSwatch(it, gridF));
      // sensible default so the preview never looks unset (the hero flip cover
      // keeps its own rich default until the user actively picks a material)
      if (CHAMOIS[0]) {
        const rgb0 = hex2rgb(CHAMOIS[0].hex);
        paint(rgb0);
        if (matLabel) matLabel.textContent = `Chamois · ${CHAMOIS[0].code}`;
        if (foilLabel) foilLabel.textContent = 'Gold foil';
        selMat = gridC.querySelector('.swatch');
        if (selMat) selMat.setAttribute('aria-pressed', 'true');
        lastTarget = rgb0;
      }
    }, 30);
  };
  album.onerror = function () {
    if (loading) loading.textContent = 'Album image not found';
  };
  album.src = CUTOUT;
}

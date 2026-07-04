/*
 * flipAlbum.js — Mementos Studio hero album
 * =========================================================================
 * Ported (logic unchanged) from branch `album-page-flip-animation-qrgpu8`
 * (`album-experience.html`). Two pieces:
 *
 *   1. initFlipAlbum()   — scroll-pinned CSS-3D album that opens its cover and
 *                          turns real photo spreads. Pure DOM/CSS, no WebGL,
 *                          no GSAP. A sticky pin gives the scroll travel; the
 *                          normalised progress is lerp-smoothed for a buttery
 *                          scrub.
 *   2. initFinishPicker() — the finish/material picker. Recolours a real album
 *                          cutout on a <canvas> (luminance-preserving hue swap)
 *                          and draws the gold foil on top. Extended here with a
 *                          third, parallel swatch group — FOIL (Gold/Silver/
 *                          Black) — that re-draws the foil in the chosen metal.
 *
 * Swatch targets come from the pre-sampled hexes in src/data/swatches.js, so we
 * never need to serve the full-res Chamois/Linen photo folders just to sample a
 * colour. Picking a material also tints the hero flip-album cover.
 * ========================================================================= */

import { CHAMOIS, LINEN, FOILS } from '../data/swatches.js';

const BASE = import.meta.env.BASE_URL || '/';

/* -------------------------------------------------------------------------
 * 1. Scroll-driven layflat album (flip mechanics from the reference sample)
 * ---------------------------------------------------------------------- */
export function initFlipAlbum(opts = {}) {
  const onPhase = opts.onPhase || null; // (currentSpread, turning, progress) => void

  // 2:1 open spreads (left page + right page), web-optimised WebP.
  const enc = (n) => `${BASE}Spreads/web/spread${n}.webp`;
  const SPREADS = [
    { img: enc('01'), cap: 'Before everything began' },
    { img: enc('03'), cap: 'A closer look' },
    { img: enc('05'), cap: 'Every detail in its place' },
    { img: enc('07'), cap: 'The two of them' },
    { img: enc('09'), cap: 'And the family became one' },
  ];
  const N = SPREADS.length;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1);
  const lerp = (a, b, t) => a + (b - a) * t;

  const $ = (id) => document.getElementById(id);
  const stage = $('flipStage');
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
  if (!stage || !scrollSection) return null;

  // page-thickness stack + ticks
  [6, 4, 2].forEach((d) => {
    const el = document.createElement('div');
    el.className = 'layer';
    el.style.left = -d + 'px';
    el.style.top = d + 4 + 'px';
    el.style.width = 1000 + d * 2 + 'px';
    el.style.height = '500px';
    thickness.appendChild(el);
  });
  if (ticks) for (let i = 0; i < N; i++) ticks.appendChild(document.createElement('b'));
  const tickEls = ticks ? ticks.querySelectorAll('b') : [];

  // preload so faces never flash empty
  SPREADS.forEach((s) => {
    const im = new Image();
    im.src = s.img;
  });

  const COVER = 0.16;
  const TURN = (1 - COVER) / (N - 1);
  const TURN_MOVE = 0.68;

  function state(p) {
    if (p < COVER) {
      const cp = easeInOutCubic(clamp(p / COVER, 0, 1));
      return { coverRot: -cp * 168, cur: 0, turning: false, from: 0, to: 0, leafRot: 0, leafShadow: 0 };
    }
    const q = p - COVER;
    const segi = Math.min(N - 2, Math.floor(q / TURN));
    const local = (q - segi * TURN) / TURN;
    const from = segi;
    const to = segi + 1;
    if (local < TURN_MOVE) {
      const lp = easeInOutCubic(clamp(local / TURN_MOVE, 0, 1));
      return { coverRot: -168, cur: from, turning: true, from, to, leafRot: -lp * 180, leafShadow: lp };
    }
    return { coverRot: -168, cur: to, turning: false, from: to, to, leafRot: -180, leafShadow: 1 };
  }

  let curCaption = -1;
  let lastPhaseKey = '';
  function render(p) {
    const s = state(p);

    if (s.coverRot > -167.9) {
      cover.style.display = 'block';
      cover.style.transform = 'rotateY(' + s.coverRot + 'deg)';
    } else {
      cover.style.display = 'none';
    }

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
    if (capTxt) capTxt.parentNode.style.opacity = s.turning ? 0 : 1;

    for (let i = 0; i < tickEls.length; i++) {
      tickEls[i].className = i === s.cur && !s.turning ? 'on' : '';
    }

    // notify listeners (drives the hero "THE STORY" rail)
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
    current = lerp(current, target, 0.14);
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

  // scale scroll travel to spread count
  scrollSection.style.minHeight = 120 + (N - 1) * 120 + 'vh';

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
 * 2. Finish picker — recolour the real album cutout per swatch + foil group
 * ---------------------------------------------------------------------- */
export function initFinishPicker() {
  const W = 1254;
  const H = 1254;
  const K = 1.08; // shading contrast for the retint
  const CUTOUT = `${BASE}mockups/album-mockup-transparent.png`;

  // front-cover plane (handoff zone corners) — used to place the foil
  const FA = [404, 167];
  const FB = [1184, 267];
  const FD = [132, 784];

  const canvas = document.getElementById('albumCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const loading = document.getElementById('canvasLoading');
  const label = document.getElementById('finishLabel');
  const gridC = document.getElementById('swChamois');
  const gridL = document.getElementById('swLinen');
  const gridF = document.getElementById('swFoil');

  // ---- foil state (parallel swatch group) ----
  const FOIL_COLORS = { gold: '#c2a367', silver: '#cfd2d4', black: '#2a2622' };
  const FOIL_SHADOW = { gold: 'rgba(60,40,24,0.35)', silver: 'rgba(40,44,48,0.30)', black: 'rgba(0,0,0,0.30)' };
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
    const FOIL = FOIL_COLORS[foilCode];
    const SHADOW = FOIL_SHADOW[foilCode];
    ctx.save();
    ctx.setTransform(un[0], un[1], vn[0], vn[1], cx, cy);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    function script(txt, size, ly) {
      ctx.font = size + 'px "Pinyon Script", cursive';
      ctx.fillStyle = SHADOW;
      ctx.fillText(txt, 2, ly + 2);
      ctx.fillStyle = FOIL;
      ctx.fillText(txt, 0, ly);
    }
    script('Aysha', 116, -70);
    script('&', 60, 2);
    script('Alfonse', 116, 74);
    ctx.font = '500 24px "Jost", sans-serif';
    ctx.fillStyle = SHADOW;
    ctx.fillText('OCT 4, 2024', 1.5, 153.5);
    ctx.fillStyle = FOIL;
    ctx.fillText('OCT 4, 2024', 0, 152);
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
  function applyTarget(rgb) {
    if (!ready) return;
    lastTarget = rgb;
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
    drawFoil(); // foil re-drawn on top in the current metal
  }

  // carry the picked finish into the hero flip-album cover
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

  let selected = null;
  function selectSwatch(btn) {
    if (selected) selected.setAttribute('aria-pressed', 'false');
    selected = btn;
    btn.setAttribute('aria-pressed', 'true');
  }

  function makeMaterialSwatch(item, kind, grid) {
    const rgb = hex2rgb(item.hex);
    const b = document.createElement('button');
    b.className = 'swatch';
    b.type = 'button';
    b.setAttribute('aria-label', kind + ' ' + item.code);
    b.setAttribute('aria-pressed', 'false');
    b.style.background = item.hex;
    grid.appendChild(b);
    b.addEventListener('click', () => {
      if (!ready) return;
      applyTarget(rgb);
      tintFlipCover(rgb);
      if (label) label.textContent = kind + ' · ' + item.code;
      selectSwatch(b);
    });
    return b;
  }

  function makeFoilSwatch(item, grid) {
    const b = document.createElement('button');
    b.className = 'swatch swatch--foil';
    b.type = 'button';
    b.setAttribute('aria-label', 'Foil ' + item.label);
    b.setAttribute('aria-pressed', item.code === foilCode ? 'true' : 'false');
    b.style.background = item.chip;
    grid.appendChild(b);
    b.addEventListener('click', () => {
      foilCode = item.code;
      grid.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      if (ready) {
        if (lastTarget) applyTarget(lastTarget);
        else drawFoil();
      }
      if (label) label.textContent = item.label + ' foil';
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
    }, 30);
  };
  album.onerror = function () {
    if (loading) loading.textContent = 'Album image not found';
  };
  album.src = CUTOUT;
}

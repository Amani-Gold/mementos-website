import { HeroStage } from '../scene/HeroStage.js';
import { AlbumBook } from '../objects/AlbumBook.js';
import { pinToViewport } from '../utils/pinToViewport.js';

/*
 * heroAlbum.js — boots the WebGL hero album and drives it from scroll.
 *
 * The album is real 3D geometry (AlbumBook) in a dark cinematic stage
 * (HeroStage). Scroll progress through the tall #albumScroll section maps to
 * the album's open→flip timeline. Rendering is gated to when the hero is on
 * screen. Degrades to a static fallback if WebGL is unavailable or the user
 * prefers reduced motion.
 */

const CFG = (typeof window !== 'undefined' && window.MEMENTOS) || {};
const BASE = CFG.assetBase || (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Smoothing time constant, in ms, for the scroll→album follow. */
const EASE_TAU = 90;

function defaultSpreads() {
  const enc = (n) => `${BASE}Spreads/web/spread${n}.webp`;
  return [
    { img: enc('06') },
    { img: enc('03') },
    { img: enc('07') },
    { img: enc('08') },
    { img: enc('09') },
  ];
}

export function initHeroAlbum(opts = {}) {
  const onPhase = opts.onPhase || null;
  const canvas = document.getElementById('heroStage');
  const section = document.getElementById('albumScroll');
  const fallback = document.getElementById('heroFallback');
  if (!section) return null;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cfgSpreads = Array.isArray(CFG.spreads)
    ? CFG.spreads.filter((s) => s && s.img).map((s) => ({ img: s.img }))
    : [];
  const spreads = cfgSpreads.length >= 2 ? cfgSpreads : defaultSpreads();

  // WebGL support / opt-out → show the static fallback and stop.
  const glOK = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) {
      return false;
    }
  })();
  if (!canvas || !glOK) {
    if (fallback) fallback.hidden = false;
    return null;
  }

  // Hold the album inside the hero and re-assert that against theme CSS —
  // see pinToViewport.js. The canvas sits in the already-sticky `.pin`, so
  // absolute positioning pins it for the length of the hero and leaves it
  // behind at the end instead of following the reader into the next section.
  // z-index 2 matches .hero-stage3d in styles.css.
  pinToViewport(canvas, 2, 'absolute');

  let stage, album;
  try {
    stage = new HeroStage(canvas);
    album = new AlbumBook({
      base: BASE,
      spreads,
      coverFabric: `${BASE}cover-fabric.jpg`,
      coverFoil: CFG.coverFoil || `${BASE}foil-script.png`,
      coverNames: CFG.coverNames || {},
    });
    stage.scene.add(album.root);
  } catch (e) {
    if (fallback) fallback.hidden = false;
    return null;
  }

  /*
   * Scroll progress: the .pin is sticky inside the tall section, so the
   * section's top travels 0 → -(height - viewport) as we scroll through it.
   *
   * `data-flip-tail` ends the album's timeline before the end of the section:
   * at a tail of 0.88 the last page has finished turning 88% of the way down,
   * and the remaining 12% is a hold with the album finished and still pinned.
   * That hold is what guarantees the flipping is over before the sticky pin
   * lets go, so the page never starts moving on mid-turn.
   */
  function progress() {
    const r = section.getBoundingClientRect();
    const range = r.height - window.innerHeight;
    if (range <= 0) return 0;
    const tail = parseFloat(section.dataset.flipTail) || 1;
    return clamp(-r.top / range / tail, 0, 1);
  }

  let visible = true;
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      canvas.classList.toggle('is-visible', visible);
    },
    { rootMargin: '5% 0px 5% 0px' },
  );
  io.observe(section);

  let lastPhase = -1;
  let shown = 0;
  let target = 0;

  album.ready.then(() => {
    canvas.classList.add('is-visible');
    album.setLayout(window.innerWidth, window.innerHeight);

    if (prefersReduced) {
      // Land on a settled, open hero state; no animation.
      const phase = album.setState(0.34);
      if (onPhase) onPhase(phase);
      stage.render();
    }

    window.addEventListener('resize', () => album.setLayout(window.innerWidth, window.innerHeight));

    target = shown = progress();
    tick();
  });

  let lastFrame = 0;
  function tick(ts) {
    const now = ts || performance.now();
    // Time-based, not per-frame: a fixed fraction per frame is really a
    // fraction per *frame rate*, so on a slow device the album fell steadily
    // further behind the scroll and was still turning pages after the page
    // had moved on. Smoothing against elapsed time keeps the same unhurried
    // feel at 60fps and still catches up when frames are scarce.
    const dt = lastFrame ? Math.min(120, now - lastFrame) : 16;
    lastFrame = now;

    target = progress();
    shown += (target - shown) * (prefersReduced ? 1 : 1 - Math.exp(-dt / EASE_TAU));
    if (Math.abs(target - shown) < 0.002) shown = target;
    if (visible) {
      const phase = album.setState(shown);
      if (phase !== lastPhase) {
        lastPhase = phase;
        if (onPhase) onPhase(phase);
      }
      stage.render();
    }
    requestAnimationFrame(tick);
  }

  return { stage, album };
}

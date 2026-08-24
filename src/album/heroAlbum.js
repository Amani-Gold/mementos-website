import { HeroStage } from '../scene/HeroStage.js';
import { AlbumBook } from '../objects/AlbumBook.js';
import { ALBUM_ASSETS, BASE } from '../data/assets.js';

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
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function initHeroAlbum(opts = {}) {
  const onPhase = opts.onPhase || null;
  const canvas = document.getElementById('heroStage');
  const section = document.getElementById('albumScroll');
  const fallback = document.getElementById('heroFallback');
  if (!section) return null;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Show the static hero image only once we know it actually decodes —
  // otherwise a broken-image icon would be a worse placeholder than the dark
  // hero on its own, which still reads correctly with the copy over it.
  const showFallback = (show) => {
    if (!fallback) return;
    if (!show) {
      fallback.hidden = true;
      return;
    }
    if (fallback.complete && fallback.naturalWidth > 0) {
      fallback.hidden = false;
      return;
    }
    fallback.addEventListener('load', () => { fallback.hidden = false; }, { once: true });
    fallback.addEventListener(
      'error',
      () => {
        fallback.hidden = true;
        console.error('[Mementos] the static hero image could not be loaded either:', fallback.currentSrc || fallback.src);
      },
      { once: true },
    );
    // kick the load if the element was never rendered while hidden
    if (!fallback.complete) fallback.hidden = false;
  };


  const cfgSpreads = Array.isArray(CFG.spreads)
    ? CFG.spreads.filter((s) => s && s.img).map((s) => ({ img: s.img }))
    : [];
  const spreads =
    cfgSpreads.length >= 2 ? cfgSpreads : ALBUM_ASSETS.spreads.map((img) => ({ img }));

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
    showFallback(true);
    return null;
  }

  let stage;
  try {
    stage = new HeroStage(canvas);
  } catch (e) {
    console.error('[Mementos] could not start the hero renderer:', e);
    showFallback(true);
    return null;
  }

  // Scroll progress: the .pin is sticky inside the tall section, so the
  // section's top travels 0 → -(height - viewport) as we scroll through it.
  function progress() {
    const r = section.getBoundingClientRect();
    const range = r.height - window.innerHeight;
    if (range <= 0) return 0;
    return clamp(-r.top / range, 0, 1);
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
  let album = null;

  // Frame the album from the CANVAS's own width, not the window's, so the
  // composition is derived from the container it actually renders into.
  const layout = () => album && album.setLayout(canvas.clientWidth || window.innerWidth);

  // Preload + validate the artwork BEFORE building the album, so it is never
  // shown mid-load with untextured pages. Until then the static hero image
  // stands in, and it stays if nothing at all could be loaded.
  showFallback(true);

  AlbumBook.create({
    base: BASE,
    spreads,
    spreadFallback: ALBUM_ASSETS.spreadFallback,
    coverFabric: ALBUM_ASSETS.coverFabric,
    coverFoil: ALBUM_ASSETS.coverFoil,
    coverNames: CFG.coverNames || {},
  }).then((book) => {
    if (!book) return; // nothing loaded — leave the static image in place
    album = book;
    stage.scene.add(album.root);

    showFallback(false);
    canvas.classList.add('is-visible');
    layout();

    if (prefersReduced) {
      // Land on a settled, open hero state; no animation.
      const phase = album.setState(0.34);
      if (onPhase) onPhase(phase);
      stage.render();
    }

    window.addEventListener('resize', layout);
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(layout).observe(canvas);
    }

    target = shown = progress();
    tick();
  });

  function tick() {
    target = progress();
    // ease toward the target for a premium, non-jittery feel
    shown += (target - shown) * (prefersReduced ? 1 : 0.14);
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

  // `album` is populated asynchronously once the artwork has been validated,
  // so expose the stage plus a getter rather than a value captured too early.
  return { stage, getAlbum: () => album };
}

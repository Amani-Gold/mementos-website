import { HeroStage } from '../scene/HeroStage.js';
import { AlbumBook } from '../objects/AlbumBook.js';

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

  let stage, album;
  try {
    stage = new HeroStage(canvas);
    album = new AlbumBook({
      base: BASE,
      spreads,
      coverFabric: `${BASE}cover-fabric.jpg`,
      coverNames: CFG.coverNames || {},
    });
    stage.scene.add(album.root);
  } catch (e) {
    if (fallback) fallback.hidden = false;
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

  return { stage, album };
}

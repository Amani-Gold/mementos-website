import './styles.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Stage } from './scene/Stage.js';
import { Album } from './objects/Album.js';
import { createBoxes, createMailer } from './objects/Boxes.js';
import { createWorldMap } from './objects/WorldMap.js';
import { ensureFonts } from './materials/textures.js';
import { applyJourney, PANELS } from './scroll/journey.js';
import { initFinishPicker } from './album/flipAlbum.js';
import { initHeroAlbum } from './album/heroAlbum.js';
import { pinToViewport } from './utils/pinToViewport.js';

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* -------------------------------------------------------------------------
 * Contact details — swap these for the real ones in one place.
 * ---------------------------------------------------------------------- */
const CFG = (typeof window !== 'undefined' && window.MEMENTOS) || {};
export const CONTACT = Object.assign(
  {
    whatsapp: '97300000000', // wa.me number, digits only, no + or spaces
    email: 'hello@mementos-studio.com',
    instagram: 'https://instagram.com/',
  },
  CFG.contact || {},
);

/* =========================================================================
 * A. Homepage interactions — nav, mobile drawer, smooth scroll, gallery,
 *    testimonials, the hero flip album + finish picker. All dependency-light
 *    and independent of WebGL, so the page is usable even if 3D fails.
 * ====================================================================== */
function initHomepage() {
  // Contact links
  document.querySelectorAll('[data-wa]').forEach((a) => {
    a.href = `https://wa.me/${CONTACT.whatsapp}`;
  });
  document.querySelectorAll('[data-mail]').forEach((a) => {
    a.href = `mailto:${CONTACT.email}`;
  });
  document.querySelectorAll('[data-ig]').forEach((a) => {
    a.href = CONTACT.instagram;
  });

  // Sticky nav darkens once past the hero
  const nav = document.getElementById('nav');
  const onScrollNav = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 60);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  // Mobile drawer
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('drawer');
  const closeDrawer = () => {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  };
  const openDrawer = () => {
    if (!drawer) return;
    drawer.classList.add('is-open');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
  };
  if (burger && drawer) {
    burger.addEventListener('click', () =>
      drawer.classList.contains('is-open') ? closeDrawer() : openDrawer(),
    );
    drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeDrawer));
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) closeDrawer();
    });
    window.addEventListener('keydown', (e) => e.key === 'Escape' && closeDrawer());
  }

  // Smooth anchor scroll with nav offset
  const navH = 74;
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  // Active nav link by section in view
  const navLinks = [...document.querySelectorAll('.nav__links a[href^="#"]')];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (sections.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          navLinks.forEach((a) =>
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id),
          );
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => io.observe(s));
  }

  // The WebGL hero album + the "THE STORY" rail sync
  const steps = [...document.querySelectorAll('.story-rail .story-step')];
  initHeroAlbum({
    onPhase: (cur) => {
      const i = Math.min(steps.length - 1, cur);
      steps.forEach((st, k) => st.classList.toggle('is-active', k === i));
    },
  });
  if (steps[0]) steps[0].classList.add('is-active');

  // Finish / material / foil picker
  initFinishPicker();

  // Testimonials slider
  initTestimonials();

  // Gallery lightbox
  initLightbox();
}

function initTestimonials() {
  const items = [...document.querySelectorAll('.tstm')];
  if (items.length < 2) return;
  let idx = 0;
  const show = (n) => {
    idx = (n + items.length) % items.length;
    items.forEach((it, i) => it.classList.toggle('is-active', i === idx));
  };
  document.querySelector('.tstm-prev')?.addEventListener('click', () => show(idx - 1));
  document.querySelector('.tstm-next')?.addEventListener('click', () => show(idx + 1));
  show(0);
}

function initLightbox() {
  const box = document.getElementById('lightbox');
  if (!box) return;
  const img = box.querySelector('img');
  document.querySelectorAll('.gallery__item img').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      img.src = thumb.currentSrc || thumb.src;
      img.alt = thumb.alt;
      box.classList.add('is-open');
      document.body.classList.add('no-scroll');
    });
  });
  const close = () => {
    box.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  };
  box.addEventListener('click', close);
  window.addEventListener('keydown', (e) => e.key === 'Escape' && close());
}

/* =========================================================================
 * B. WebGL — the 3D collections region only. The fixed canvas fades in when
 *    the region is in view and pauses rendering otherwise.
 * ====================================================================== */
async function bootWebGL() {
  const canvas = document.getElementById('stage');
  const region = document.getElementById('collections3d');
  if (!canvas || !region) return;

  // See pinToViewport.js / the matching call in heroAlbum.js. z-index 0
  // matches .stage3d in styles.css.
  pinToViewport(canvas, 0);

  const stage = new Stage(canvas);
  const album = new Album();
  stage.scene.add(album.root);

  const boxes = createBoxes(album.size);
  const mailer = createMailer(album.size);
  const worldMap = createWorldMap(2);
  worldMap.group.position.y = 2.7;
  stage.scene.add(boxes.group, mailer.group, worldMap.group);

  const sets = { camera: stage.camera, album, boxes, mailer, worldMap };
  window.__sets = sets;

  const panelEls = [...region.querySelectorAll('.panel')];
  function currentProgress() {
    // viewport-relative reference so it is robust to the region's offsetParent
    const mid = window.innerHeight / 2;
    for (let i = 0; i < panelEls.length; i++) {
      const r = panelEls[i].getBoundingClientRect();
      if (mid < r.bottom || i === panelEls.length - 1) {
        const frac = Math.min(1, Math.max(0, (mid - r.top) / r.height));
        return (i + frac) / (PANELS - 1);
      }
    }
    return 1;
  }

  let progress = currentProgress();
  applyJourney(progress, sets);

  // Reveal each panel's copy as it enters the viewport
  region.querySelectorAll('.panel .copy').forEach((copy) => {
    gsap.set(copy, { opacity: 0, y: 26 });
    gsap.to(copy, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      ease: 'power2.out',
      scrollTrigger: { trigger: copy.closest('.panel'), start: 'top 70%' },
    });
  });

  // Show the canvas only while the 3D region is on screen
  let stageVisible = false;
  const io = new IntersectionObserver(
    (entries) => {
      stageVisible = entries[0].isIntersecting;
      canvas.classList.toggle('is-visible', stageVisible);
    },
    { rootMargin: '10% 0px 10% 0px' },
  );
  io.observe(region);

  let shown = progress;
  function tick() {
    progress = currentProgress();
    shown += (progress - shown) * (prefersReduced ? 1 : 0.1);
    if (stageVisible) {
      applyJourney(shown, sets);
      stage.render();
    }
    requestAnimationFrame(tick);
  }
  tick();

  requestAnimationFrame(() => ScrollTrigger.refresh());
}

/* =========================================================================
 * Boot
 * ====================================================================== */
async function boot() {
  const loader = document.getElementById('loader');
  const bar = loader ? loader.querySelector('.loader__bar i') : null;
  if (bar) bar.style.width = '35%';

  initHomepage();

  // Hide the loader quickly — the DOM homepage is ready now. Fonts + WebGL are
  // progressive enhancement and continue loading behind the scenes, so a blocked
  // font network never keeps the veil up.
  if (bar) bar.style.width = '100%';
  setTimeout(() => loader && loader.classList.add('is-done'), 500);

  try {
    await ensureFonts();
    await bootWebGL();
  } catch (err) {
    console.warn('3D scene unavailable:', err);
  }
}

boot();

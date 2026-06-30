import './styles.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Stage } from './scene/Stage.js';
import { Album } from './objects/Album.js';
import { createBoxes, createMailer } from './objects/Boxes.js';
import { createWorldMap } from './objects/WorldMap.js';
import { ensureFonts } from './materials/textures.js';
import { applyJourney, PANELS } from './scroll/journey.js';
import { initSwatches } from './ui/swatches.js';

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function boot() {
  const canvas = document.getElementById('stage');
  const loader = document.getElementById('loader');
  const bar = loader.querySelector('.loader__bar i');

  bar.style.width = '35%';
  await ensureFonts();
  bar.style.width = '65%';

  const stage = new Stage(canvas);
  const album = new Album();
  stage.scene.add(album.root);

  // Milestone 3 sets — boxes, shipping mailer, worldwide globe.
  const boxes = createBoxes(album.size);
  const mailer = createMailer(album.size);
  const worldMap = createWorldMap(2);
  worldMap.group.position.y = 2.7; // float fully above the ground (no clipping)
  stage.scene.add(boxes.group, mailer.group, worldMap.group);

  // Real Mementos Studio spreads (2:1, split into page halves at runtime).
  const SPREADS = Array.from(
    { length: 10 },
    (_, i) => `${import.meta.env.BASE_URL}spreads/spread-${String(i + 1).padStart(2, '0')}.jpg`,
  );
  await album.loadSpreads(SPREADS);
  initSwatches(album);
  bar.style.width = '100%';

  const sets = { camera: stage.camera, album, boxes, mailer, worldMap };
  window.__album = album; // debug handles
  window.__sets = sets;

  // Section coordinate derived from real panel geometry (robust to panels that
  // aren't exactly one viewport tall). progress = section / (PANELS - 1).
  const panelEls = [...document.querySelectorAll('.panel')];
  function currentProgress() {
    const mid = window.scrollY + window.innerHeight / 2;
    let i = 0;
    for (; i < panelEls.length; i++) {
      const top = panelEls[i].offsetTop;
      const h = panelEls[i].offsetHeight;
      if (mid < top + h || i === panelEls.length - 1) {
        const frac = Math.min(1, Math.max(0, (mid - top) / h));
        return (i + frac) / (PANELS - 1);
      }
    }
    return 1;
  }

  let progress = currentProgress();
  window.__P = currentProgress; // debug: returns progress; *14 = section

  // Initial framing before any scroll.
  applyJourney(progress, sets);

  // Reveal each panel's copy as it enters the viewport.
  document.querySelectorAll('.panel .copy').forEach((copy) => {
    gsap.to(copy, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: copy.closest('.panel'), start: 'top 65%' },
    });
  });

  // Nav darkens slightly once past the hero.
  ScrollTrigger.create({
    trigger: '.story',
    start: 'top top-=40',
    onToggle: (self) => document.getElementById('nav').classList.toggle('is-scrolled', self.isActive),
  });

  // Render loop. GSAP scrub already gives the calm, heavy feel, so keep only a
  // light follow here to avoid compounding lag.
  const raw = location.search.includes('raw');
  let shown = progress;
  function tick() {
    if (!window.__freeze) {
      progress = currentProgress();
      // Single, calm smoothing pass.
      shown += (progress - shown) * (prefersReduced || raw ? 1 : 0.1);
      applyJourney(shown, sets);
    }
    stage.render();
    requestAnimationFrame(tick);
  }
  tick();

  requestAnimationFrame(() => {
    loader.classList.add('is-done');
    ScrollTrigger.refresh();
  });
}

boot();

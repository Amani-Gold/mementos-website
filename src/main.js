import './styles.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Stage } from './scene/Stage.js';
import { Album } from './objects/Album.js';
import { ensureFonts } from './materials/textures.js';
import { applyJourney } from './scroll/journey.js';

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

  // Real Mementos Studio spreads (2:1, split into page halves at runtime).
  const SPREADS = Array.from(
    { length: 10 },
    (_, i) => `${import.meta.env.BASE_URL}spreads/spread-${String(i + 1).padStart(2, '0')}.jpg`,
  );
  await album.loadSpreads(SPREADS);
  bar.style.width = '100%';

  let progress = 0;

  // Initial framing before any scroll.
  applyJourney(0, { camera: stage.camera, album });

  // Master scroll timeline: one scrubbed progress across the whole story.
  ScrollTrigger.create({
    trigger: '.story',
    start: 'top top',
    end: 'bottom bottom',
    scrub: prefersReduced ? false : 1,
    onUpdate: (self) => {
      progress = self.progress;
    },
  });

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
  let shown = 0;
  function tick() {
    shown += (progress - shown) * 0.22;
    applyJourney(prefersReduced ? progress : shown, { camera: stage.camera, album });
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

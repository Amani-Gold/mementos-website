import { chromium } from 'playwright-core';

/*
 * Does the album finish flipping before the hero lets go?
 *
 * Scrolls the hero with real wheel events at a human-ish speed and samples the
 * album's own driver (window.__mementosHero) plus where the sticky pin is.
 * The pin releases when the section's bottom reaches the bottom of the
 * viewport; at that instant the album must already be on its last page.
 */

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.U || 'http://localhost:4180/home/';
const STEP = Number(process.env.STEP || 240);   // px per wheel tick
const PAUSE = Number(process.env.PAUSE || 45);  // ms between ticks

const VW = Number(process.env.VW || 1440);
const VH = Number(process.env.VH || 900);

const b = await chromium.launch({
  executablePath: EXE,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
await p.goto(URL, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);

const info = await p.evaluate(() => {
  const s = document.getElementById('albumScroll').getBoundingClientRect();
  return {
    sectionVh: +(s.height / innerHeight).toFixed(2),
    tail: document.getElementById('albumScroll').dataset.flipTail || '(none)',
    flips: window.__mementosHero ? window.__mementosHero.flips : '(no hook)',
  };
});
console.log('hero:', JSON.stringify(info));

let releasedAt = null;
const samples = [];
await p.mouse.move(700, 450);

for (let i = 0; i < 400; i++) {
  await p.mouse.wheel(0, STEP);
  await p.waitForTimeout(PAUSE);
  const s = await p.evaluate(() => {
    const sec = document.getElementById('albumScroll').getBoundingClientRect();
    const h = window.__mementosHero;
    return {
      y: Math.round(scrollY),
      // how far past the pin we are: 0 while pinned, >0 once released
      released: Math.max(0, Math.round(innerHeight - sec.bottom)),
      raw: h ? +h.raw.toFixed(3) : null,
      eased: h ? +h.eased.toFixed(3) : null,
      phase: h ? h.phase : null,
      flips: h ? h.flips : null,
    };
  });
  samples.push(s);
  if (s.released > 0 && releasedAt === null) releasedAt = s;
  if (s.released > 400) break;
}

const last = samples[samples.length - 1];
console.log('at the moment the pin released:', JSON.stringify(releasedAt));
console.log('final sample:', JSON.stringify(last));

const seen = [...new Set(samples.map((s) => s.phase).filter((x) => x !== null))].sort((a, b) => a - b);
console.log('phases seen while scrolling:', seen.join(', '));

if (releasedAt) {
  // phase counts completed turns, so phase === flips means the last page has
  // finished turning; eased is then inside the hold at the end of the section.
  const done = releasedAt.phase === releasedAt.flips && releasedAt.eased >= 0.99;
  console.log(done
    ? `PASS — all ${releasedAt.flips} flips complete at release (eased ${releasedAt.eased})`
    : `FAIL — released on phase ${releasedAt.phase}/${releasedAt.flips}, eased ${releasedAt.eased}`);
} else {
  console.log('INCONCLUSIVE — never scrolled past the hero');
}
await b.close();

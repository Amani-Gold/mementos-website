import { chromium } from 'playwright-core';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const path = process.env.PAGE || '/home/';
const vw = Number(process.env.VW || 1440);
const vh = Number(process.env.VH || 900);

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });

const failed = [];
page.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().replace('http://localhost:4180', '')); });
page.on('requestfailed', (r) => failed.push('ERR ' + r.url().replace('http://localhost:4180', '')));
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

await page.goto('http://localhost:4180' + path, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);

const r1 = await page.evaluate(() => {
  const cfg = window.MEMENTOS;
  const out = { hasConfig: !!cfg, assetBase: cfg && cfg.assetBase };
  const ac = document.getElementById('albumCanvas');
  if (ac) {
    const c = ac.getContext('2d');
    try {
      const d = c.getImageData(0, 0, ac.width, ac.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4 * 499) if (d[i] > 10) n++;
      out.previewPaintedSamples = n;
    } catch (e) { out.previewPaintedSamples = 'unreadable'; }
  }
  out.loadingText = (document.getElementById('canvasLoading') || {}).textContent;
  out.loadingVisible = document.getElementById('canvasLoading') ? getComputedStyle(document.getElementById('canvasLoading')).display !== 'none' : null;
  out.notFoundOnPage = /not found/i.test(document.body.innerText);
  out.panels = document.querySelectorAll('#collections3d .panel').length;
  out.overflowPx = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return out;
});

// scroll through the hero so the album builds and flips, then into the 3D story
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
await page.waitForTimeout(2500);
const heroShot = await page.evaluate(() => {
  const c = document.getElementById('heroStage');
  if (!c) return null;
  const b = c.getBoundingClientRect();
  return { w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top), pos: getComputedStyle(c).position, z: getComputedStyle(c).zIndex };
});

const sets = await page.evaluate(() => {
  const s = window.__sets;
  if (!s) return 'no __sets';
  return { hasWorldMap: !!s.worldMap, hasBoxes: !!s.boxes, hasMailer: !!s.mailer, hasAlbum: !!s.album };
});

console.log(JSON.stringify({ page: path, ...r1, heroShot, sets }, null, 1));
console.log('failed requests:', failed.length ? [...new Set(failed)].slice(0, 12) : 'none');
console.log('console errors:', errs.length ? [...new Set(errs)].slice(0, 6) : 'none');

await page.screenshot({ path: process.env.SHOT || '/tmp/wp.png' });
await browser.close();

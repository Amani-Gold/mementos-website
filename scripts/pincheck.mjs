import { chromium } from 'playwright-core';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'http://localhost:4180/home/';

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const fails = [];
  const doc = await page.evaluate(() => document.body.scrollHeight);
  const steps = 26;

  for (let i = 0; i <= steps; i++) {
    const y = Math.round((doc - vp.height) * (i / steps));
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(160);
    const r = await page.evaluate(() => {
      const vis = (el) => {
        if (!el) return null;
        const s = getComputedStyle(el);
        if (s.opacity === '0' || s.display === 'none' || s.visibility === 'hidden') return null;
        const b = el.getBoundingClientRect();
        return b.width && b.height ? { top: b.top, bottom: b.bottom, op: s.opacity, pos: s.position } : null;
      };
      const overlap = (a, b) => a && b && a.top < b.bottom && b.top < a.bottom;
      const hero = vis(document.getElementById('heroStage'));
      const stage = vis(document.getElementById('stage'));
      const out = { y: window.scrollY, bad: [] };
      // the hero album must never be drawn over anything after the hero section
      for (const sel of ['.trust', '.collections', '#collections3d', '.finish']) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const b = el.getBoundingClientRect();
        if (overlap(hero, { top: b.top, bottom: b.bottom })) out.bad.push('hero over ' + sel);
      }
      // the 3D story canvas must stay inside its own section
      const s3 = document.getElementById('collections3d');
      if (stage && s3) {
        const b = s3.getBoundingClientRect();
        if (stage.top < b.top - 1 || stage.bottom > b.bottom + 1) out.bad.push('stage outside #collections3d');
      }
      return out;
    });
    if (r.bad.length) fails.push(`y=${r.y}: ${r.bad.join(', ')}`);
  }

  // the hero album must still render inside the hero
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  await page.waitForTimeout(1200);
  const heroLive = await page.evaluate(() => {
    const c = document.getElementById('heroStage');
    const b = c.getBoundingClientRect();
    return { opacity: getComputedStyle(c).opacity, pos: getComputedStyle(c).position, top: Math.round(b.top), h: Math.round(b.height) };
  });

  // a collection card must be clickable, not covered by a canvas
  await page.evaluate(() => {
    const card = document.querySelector('.col-card .explore');
    if (!card) return;
    const y = card.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2;
    window.scrollTo({ top: y, behavior: 'instant' });
  });
  await page.waitForTimeout(1200);
  const hit = await page.evaluate(() => {
    const card = document.querySelector('.col-card .explore');
    if (!card) return 'no card';
    const b = card.getBoundingClientRect();
    const x = b.left + b.width / 2, y = b.top + b.height / 2;
    if (y < 0 || y > innerHeight) return 'off-screen y=' + Math.round(y);
    const el = document.elementFromPoint(x, y);
    if (!el) return 'nothing at point';
    return card.contains(el) || el === card ? 'card link on top' : 'COVERED BY <' + el.tagName + ' class="' + el.className + '">';
  });

  console.log(`${vp.width}x${vp.height}  hero:`, JSON.stringify(heroLive), '| card hit:', hit);
  console.log('  overlaps:', fails.length ? fails.slice(0, 6) : 'none across 27 scroll positions');
  await page.close();
}
await browser.close();

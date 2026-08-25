import { chromium } from 'playwright-core';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'http://localhost:4173/';

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  await page.waitForTimeout(2500);

  const r = await page.evaluate(() => {
    const out = {};
    const hero = document.getElementById('heroStage');
    out.heroCanvas = !!hero && hero.clientWidth > 0 && hero.clientHeight > 0;
    out.heroVisible = hero ? getComputedStyle(hero).opacity : 'n/a';
    out.album = !!(window.__mementosAlbum || true);
    const ac = document.getElementById('albumCanvas');
    if (ac) {
      const c = ac.getContext('2d');
      let painted = 0;
      try {
        const d = c.getImageData(0, 0, ac.width, ac.height).data;
        for (let i = 3; i < d.length; i += 4 * 997) if (d[i] > 10) painted++;
        out.configuratorPainted = painted;
      } catch (e) { out.configuratorPainted = 'unreadable: ' + e.message; }
    }
    out.overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    out.errorText = document.body.innerText.includes('NOT FOUND');
    return out;
  });
  console.log(vp.width, JSON.stringify(r));
  console.log('  errors:', errors.length ? errors.slice(0, 4) : 'none');
  await page.close();
}
await browser.close();

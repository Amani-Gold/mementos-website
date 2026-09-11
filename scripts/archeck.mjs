import { chromium } from 'playwright-core';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b = await chromium.launch({
  executablePath: EXE,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:4180/ar/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(5000);

  const r = await p.evaluate(() => {
    const root = document.querySelector('.mementos-root');
    const out = {
      dir: root.getAttribute('dir'),
      lang: root.getAttribute('lang'),
      computedDir: getComputedStyle(root).direction,
      overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      toggles: document.querySelectorAll('.mm-lang').length,
      activeToggle: (document.querySelector('.mm-lang a[aria-current="true"]') || {}).textContent,
      otherHref: (document.querySelector('.mm-lang a[aria-current="false"]') || {}).getAttribute('href'),
    };
    // a few known Arabic strings must be present
    const t = document.body.innerText;
    out.hasArabicHeadline = t.includes('تستحقّ');
    out.hasArabicNav = t.includes('المجموعات');
    out.hasArabicFooterHeading = t.includes('تواصل معنا');
    out.leftoverEnglish = ['Skip to content', 'Live Preview', 'Loading album', 'For Photographers', 'Explore ']
      .filter((s) => t.includes(s));
    // direction-sensitive bits
    const wa = document.querySelector('.wa-float');
    const waBox = wa.getBoundingClientRect();
    out.waOnLeft = waBox.left < window.innerWidth / 2;
    const first = document.querySelector('.trust__item');
    out.trustBorderLeft = getComputedStyle(first).borderLeftWidth;
    out.trustBorderRight = getComputedStyle(first).borderRightWidth;
    return out;
  });

  // the configurator label must be translated by the companion script
  await p.evaluate(() => document.getElementById('materials').scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(2500);
  const labels = await p.evaluate(() => {
    const pick = (sel) => (document.querySelector(sel) || {}).textContent;
    return { mat: pick('#matLabel'), foil: pick('#foilLabel') };
  });
  // click a linen swatch, then a silver foil, and re-read
  const after = await p.evaluate(async () => {
    const linen = document.querySelectorAll('#swLinen .swatch');
    if (linen[1]) linen[1].click();
    const foils = document.querySelectorAll('#swFoil .swatch');
    if (foils[1]) foils[1].click();
    await new Promise((r) => setTimeout(r, 800));
    return {
      mat: document.getElementById('matLabel').textContent,
      foil: document.getElementById('foilLabel').textContent,
    };
  });

  console.log(vp.width, JSON.stringify(r, null, 1));
  console.log('  labels on load:', JSON.stringify(labels), '→ after picking:', JSON.stringify(after));
  console.log('  page errors:', errs.length ? errs.slice(0, 3) : 'none');
  await p.screenshot({ path: `/tmp/ar_${vp.width}.png` });
  await p.close();
}
await b.close();

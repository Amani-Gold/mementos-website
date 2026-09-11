import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for (const [label, path, vw, vh] of [['AR 1440','/ar161/',1440,900], ['AR 390','/ar161/',390,844], ['EN 1440','/en161/',1440,900]]) {
  const p = await b.newPage({ viewport: { width: vw, height: vh } });
  const errs = []; const bad = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('response', r => { if (r.status() >= 400) bad.push(r.status()+' '+r.url().replace('http://localhost:4180','')); });
  await p.goto('http://localhost:4180'+path, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(5500);
  const r = await p.evaluate(() => {
    const root = document.querySelector('.mementos-root');
    const t = document.body.innerText;
    const shop = [...document.querySelectorAll('.cta-row a')].map(a => a.textContent.trim()+' -> '+a.getAttribute('href'));
    const partner = document.querySelector('.photographers a.btn');
    return {
      dir: root.getAttribute('dir') || '(none)',
      lang: root.getAttribute('lang') || '(none)',
      enLinks: document.querySelectorAll('.mm-lang').length,
      ctaButtons: shop,
      partner: partner ? partner.textContent.trim()+' -> '+partner.getAttribute('href') : null,
      overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      matLabel: (document.getElementById('matLabel')||{}).textContent,
      arabicSeen: /تستحقّ/.test(t),
    };
  });
  console.log(label, JSON.stringify(r, null, 1));
  console.log('  404s:', bad.length ? bad.slice(0,4) : 'none', '| errors:', errs.length ? errs.slice(0,2) : 'none');
  await p.screenshot({ path: `/tmp/v161_${label.replace(' ','_')}.png` });
  await p.close();
}
await b.close();

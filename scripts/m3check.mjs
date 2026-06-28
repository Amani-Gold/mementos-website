import { chromium } from 'playwright-core';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = '/tmp/claude-0/-home-user-mementos-website/3a6adb7e-5525-5c5c-8d37-fc3ff4e2e196/scratchpad/shots';
const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 690 } });
const errors = [];
page.on('pageerror', (e) => errors.push('EXC: ' + e.message));
await page.goto('http://localhost:4173/?raw', { waitUntil: 'networkidle' });
await page.waitForFunction(() => typeof window.__P === 'function' && !!window.__sets, { timeout: 20000 });
await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'));
await page.waitForTimeout(600);

const names = ['collections', 'slidein', 'packaging', 'mailer', 'map', 'cta'];
for (let k = 0; k < names.length; k++) {
  const dp = 9 + k; // data-panel 9..14
  await page.evaluate((d) => {
    const el = document.querySelector(`[data-panel="${d}"]`);
    window.scrollTo(0, el.offsetTop); // instant (bypass smooth)
  }, dp);
  await page.waitForTimeout(700);
  const st = await page.evaluate(() => {
    const s = window.__sets;
    return {
      sec: +(window.__P() * 14).toFixed(1),
      album: s.album.root.visible,
      boxes: s.boxes.group.visible,
      mailer: s.mailer.group.visible,
      map: s.worldMap.group.visible,
    };
  });
  console.log(names[k], JSON.stringify(st));
  await page.screenshot({ path: `${OUT}/m3_${names[k]}.jpg`, type: 'jpeg', quality: 60 });
}
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();

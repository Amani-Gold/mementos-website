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
await page.waitForTimeout(1500);

async function shoot(panelId, code, name) {
  await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'center' }), panelId);
  await page.waitForTimeout(900);
  if (code) {
    await page.evaluate((c) => document.querySelector(`[data-code="${c}"]`)?.click(), code);
    await page.waitForTimeout(700);
  }
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 62 });
  const st = await page.evaluate(() => ({
    cover: +window.__album.frontCover.rotation.z.toFixed(2),
    spine: window.__album.spine.visible,
    leftVis: window.__album.leftBlock.visible,
  }));
  console.log(name, JSON.stringify(st));
}

await shoot('chamois', 'MS08', 'mat_chamois');
await shoot('linen', 'LN02', 'mat_linen');
await shoot('foiling', 'silver', 'mat_foil');
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();

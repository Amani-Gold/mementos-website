import { chromium } from 'playwright-core';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.SHOOT_URL || 'http://localhost:4173/';
const OUT = process.env.SHOOT_OUT || '/tmp/claude-0/-home-user-mementos-website/3a6adb7e-5525-5c5c-8d37-fc3ff4e2e196/scratchpad/shots';
const fracs = (process.env.SHOOT_FRACS || '0,0.12,0.25,0.42,0.55,0.72,0.9,1').split(',').map(Number);

const fs = await import('node:fs');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: EXE,
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
  ],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 690 }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text()); });
page.on('pageerror', (e) => console.log('PAGE EXCEPTION:', e.message));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const height = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
for (let i = 0; i < fracs.length; i++) {
  const f = fracs[i];
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(height * f));
  await page.waitForTimeout(2200);
  const name = `${OUT}/shot_${String(i).padStart(2, '0')}_${f}.jpg`;
  await page.screenshot({ path: name, type: 'jpeg', quality: 62 });
  console.log('saved', name);
}

await browser.close();
console.log('done');

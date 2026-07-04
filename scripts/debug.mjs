import { chromium } from 'playwright-core';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 690 } });
await page.goto('http://localhost:4173/?raw', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const H = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
for (const f of [0.5, 0.66, 0.72, 0.83]) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(H * f));
  await page.waitForTimeout(700);
  const s = await page.evaluate(() => {
    const a = window.__album;
    return {
      scrollFrac: +(window.scrollY / (document.body.scrollHeight - window.innerHeight)).toFixed(3),
      coverRotZ: +a.frontCover.rotation.z.toFixed(3),
      leftVisible: a.leftBlock.visible,
      spineVisible: a.spine?.visible,
      leftScaleY: +a.leftBlock.scale.y.toFixed(3),
    };
  });
  console.log(`f=${f}`, JSON.stringify(s));
}
await browser.close();

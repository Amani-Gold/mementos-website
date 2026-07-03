import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1100, height: 690 } });
await p.goto('http://localhost:4173/?raw', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
for (const sel of ['collections', '10', '11', '12', '13', 'contact']) {
  await p.evaluate((s) => {
    const el = document.getElementById(s) || document.querySelector(`[data-panel="${s}"]`);
    el.scrollIntoView({ block: 'center' });
  }, sel);
  await p.waitForTimeout(500);
  const info = await p.evaluate(() => ({
    sec: +(window.__P() * 14).toFixed(2),
    scrollY: Math.round(window.scrollY),
    max: Math.round(document.body.scrollHeight - window.innerHeight),
  }));
  console.log(sel, JSON.stringify(info));
}
await b.close();

import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1100, height: 690 } });
await p.goto('http://localhost:4173/?raw', { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
const d = await p.evaluate(() => {
  const els = [...document.querySelectorAll('.panel')];
  return { count: els.length, vh: window.innerHeight, rows: els.map((e,i)=>`${i} dp=${e.dataset.panel} top=${e.offsetTop} h=${e.offsetHeight}`) };
});
console.log('count', d.count, 'vh', d.vh);
console.log(d.rows.join('\n'));
await b.close();

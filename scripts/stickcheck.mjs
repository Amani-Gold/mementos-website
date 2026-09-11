import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pages = process.env.PAGES ? process.env.PAGES.split(',') : ['home','t_htmlbody','t_bodyonly','t_wrapper','t_main'];
for (const name of pages) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`http://localhost:4180/${name}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(4000);
  const rows = [];
  // sample only inside the section's sticky range, so "left behind at the end"
  // is not mistaken for "never pinned"
  const range = await p.evaluate(() => {
    const s = document.getElementById('albumScroll').getBoundingClientRect();
    return { top: s.top + scrollY, end: s.top + scrollY + s.height - innerHeight };
  });
  for (const f of [0, 0.25, 0.5, 0.75, 0.98]) {
    const y = Math.round(range.top + (range.end - range.top) * f);
    await p.evaluate((yy) => window.scrollTo({top: yy, behavior:'instant'}), y);
    await p.waitForTimeout(300);
    rows.push(await p.evaluate(() => Math.round(document.querySelector('#albumScroll .pin').getBoundingClientRect().top)));
  }
  const pinned = rows.every((t) => Math.abs(t) <= 2);
  console.log(name.padEnd(14), pinned ? 'PINNED  ' : 'NOT PINNED', 'pin.top at 0/25/50/75/98%:', rows.join(', '));
  await p.close();
}
await b.close();

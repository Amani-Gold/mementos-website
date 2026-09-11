import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:4180/home/', {waitUntil:'domcontentloaded'});
await p.waitForTimeout(5000);

const hero = await p.evaluate(() => {
  const s = document.getElementById('albumScroll').getBoundingClientRect();
  return { top: s.top + scrollY, h: s.height, vh: innerHeight };
});
for (const [name, f] of [['a_hero_open', 0.25], ['b_hero_flip', 0.55], ['c_hero_end', 0.95]]) {
  await p.evaluate((y) => scrollTo(0, y), hero.top + (hero.h - hero.vh) * f);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `/tmp/${name}.png` });
}
// boundary: hero end + collections start
await p.evaluate((y) => scrollTo(0, y), hero.top + hero.h - 300);
await p.waitForTimeout(2000);
await p.screenshot({ path: '/tmp/d_boundary.png' });

const s3 = await p.evaluate(() => {
  const s = document.getElementById('collections3d').getBoundingClientRect();
  return { top: s.top + scrollY, h: s.height, vh: innerHeight };
});
await p.evaluate((y) => scrollTo(0, y), s3.top + (s3.h - s3.vh) * 0.35);
await p.waitForTimeout(2500);
await p.screenshot({ path: '/tmp/e_story.png' });
await p.evaluate((y) => scrollTo(0, y), s3.top + (s3.h - s3.vh));
await p.waitForTimeout(2500);
await p.screenshot({ path: '/tmp/f_world.png' });
console.log('done');
await b.close();

import { chromium } from 'playwright-core';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = '/tmp/claude-0/-home-user-mementos-website/3a6adb7e-5525-5c5c-8d37-fc3ff4e2e196/scratchpad/boxshots';
const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 690 } });
await page.goto('http://localhost:4173/?raw', { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__sets, { timeout: 20000 });
await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'));
await page.addStyleTag({ content: '.copy{opacity:1!important;transform:none!important}' });
await page.waitForTimeout(700);

// data-panel -> name. Sample slightly past the panel top so animations progress.
const shots = [
  ['10', 'sec_slidein', 0.55],
  ['11', 'sec_packaging', 0.6],
  ['12', 'sec_mailer', 0.6],
  ['14', 'sec_cta', 0.4],
];
for (const [dp, name, frac] of shots) {
  await page.evaluate(({ d, frac }) => {
    const el = document.querySelector(`[data-panel="${d}"]`);
    window.scrollTo(0, el.offsetTop + el.offsetHeight * frac);
  }, { d: dp, frac });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 60 });
  console.log('shot', name);
}
await browser.close();

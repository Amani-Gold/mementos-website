import { chromium } from 'playwright-core';
import fs from 'node:fs';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = '/tmp/claude-0/-home-user-mementos-website/3a6adb7e-5525-5c5c-8d37-fc3ff4e2e196/scratchpad/boxshots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 760 } });
await page.goto('http://localhost:4173/?raw', { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__sets, { timeout: 20000 });

// box -> [camPos, camTgt, lidLuxury?]
const views = {
  standard: [[1.25, 1.0, 2.0], [0, 0.12, 0]],
  luxury: [[1.5, 1.25, 2.4], [0, 0.28, 0]],
  sliding: [[1.25, 1.05, 2.1], [0, 0.16, 0]],
  pocket: [[1.7, 1.45, 3.1], [0, 0.95, 0]],
};

for (const [name, [cp, ct]] of Object.entries(views)) {
  await page.evaluate(({ name, cp, ct }) => {
    window.__freeze = true;
    const { boxes, camera, album, mailer, worldMap } = window.__sets;
    album.root.visible = false; mailer.group.visible = false; worldMap.group.visible = false;
    boxes.group.visible = true;
    ['standard', 'luxury', 'sliding', 'pocket'].forEach((k) => (boxes.boxes[k].visible = k === name));
    boxes.boxes[name].position.set(0, 0, 0);
    if (name === 'luxury') boxes.boxes.luxury.userData.lid.rotation.x = -1.15;
    if (name === 'sliding') boxes.boxes.sliding.userData.lid.position.x = boxes.footprint * 0.45;
    camera.position.set(cp[0], cp[1], cp[2]);
    camera.lookAt(ct[0], ct[1], ct[2]);
    camera.updateProjectionMatrix();
  }, { name, cp, ct });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/close_${name}.jpg`, type: 'jpeg', quality: 64 });
  console.log('close', name);
}
await browser.close();

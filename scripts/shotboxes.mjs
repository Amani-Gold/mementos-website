import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = '/tmp/claude-0/-home-user-mementos-website/3a6adb7e-5525-5c5c-8d37-fc3ff4e2e196/scratchpad/boxshots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 900, height: 620 }, deviceScaleFactor: 1 });
await page.goto('http://localhost:4173/?raw', { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__sets, { timeout: 20000 });

async function frame(setup) {
  await page.evaluate((code) => {
    window.__freeze = true;
    const s = window.__sets;
    const { boxes, camera, album, mailer, worldMap } = s;
    album.root.visible = false;
    mailer.group.visible = false;
    worldMap.group.visible = false;
    boxes.group.visible = false;
    // eslint-disable-next-line no-eval
    eval(code);
    camera.updateProjectionMatrix();
  }, setup);
  await page.waitForTimeout(350);
}

const order = ['standard', 'luxury', 'sliding', 'pocket'];

// individual boxes
for (const name of order) {
  await frame(`
    boxes.group.visible = true;
    ['standard','luxury','sliding','pocket'].forEach(k => boxes.boxes[k].visible = (k==='${name}'));
    boxes.boxes['${name}'].position.set(0,0,0);
    if ('${name}'==='luxury') boxes.boxes.luxury.userData.lid.rotation.x = -1.0;
    camera.position.set(1.9, 1.5, 3.1); camera.lookAt(0, 0.18, 0);
  `);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 58 });
  console.log('shot', name);
}

// the full row
await frame(`
  boxes.group.visible = true;
  const ord=['standard','luxury','sliding','pocket'];
  const S=boxes.footprint, gap=S+0.7;
  ord.forEach((k,i)=>{ boxes.boxes[k].visible=true; boxes.boxes[k].position.set((i-1.5)*gap,0,0); });
  boxes.boxes.luxury.userData.lid.rotation.x=-1.0;
  camera.position.set(0,3.4,8.4); camera.lookAt(0,0.2,0);
`);
await page.screenshot({ path: `${OUT}/row.jpg`, type: 'jpeg', quality: 58 });
console.log('shot row');

// mailer
await frame(`
  mailer.group.visible = true; mailer.group.position.set(0,0,0);
  mailer.group.userData.flapA.rotation.x = 1.0; mailer.group.userData.flapB.rotation.x = -1.0;
  camera.position.set(2.0,1.7,3.5); camera.lookAt(0,0.2,0);
`);
await page.screenshot({ path: `${OUT}/mailer.jpg`, type: 'jpeg', quality: 58 });
console.log('shot mailer');

// globe
await frame(`
  worldMap.group.visible = true;
  camera.position.set(0,1.7,7.4); camera.lookAt(0,1.5,0);
`);
await page.screenshot({ path: `${OUT}/globe.jpg`, type: 'jpeg', quality: 58 });
console.log('shot globe');

await browser.close();
console.log('done');

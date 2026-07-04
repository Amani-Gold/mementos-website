import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = '/tmp/claude-0/-home-user-mementos-website/3a6adb7e-5525-5c5c-8d37-fc3ff4e2e196/scratchpad/crops';
fs.mkdirSync(OUT, { recursive: true });
const SW = '/tmp/claude-0/-home-user-mementos-website/3a6adb7e-5525-5c5c-8d37-fc3ff4e2e196/scratchpad/swatches';

// candidate fabric patches (relative box on the cover, away from foil text)
const jobs = [
  { file: `${SW}/chamois/MS01.jpg`, name: 'chamois', box: [0.30, 0.30, 0.20, 0.20] },
  { file: `${SW}/linen/LN01.png`, name: 'linen', box: [0.30, 0.28, 0.20, 0.20] },
];

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 300, height: 300 } });

for (const j of jobs) {
  const b64 = fs.readFileSync(j.file).toString('base64');
  const mime = j.file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const out = await page.evaluate(
    async ({ src, box }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const W = img.naturalWidth, H = img.naturalHeight;
      const [rx, ry, rw, rh] = box;
      const sx = Math.floor(rx * W), sy = Math.floor(ry * H);
      const sw = Math.floor(rw * W), sh = Math.floor(rh * H);
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const x = c.getContext('2d');
      x.drawImage(img, sx, sy, sw, sh, 0, 0, 512, 512);
      return c.toDataURL('image/jpeg', 0.7);
    },
    { src: `data:${mime};base64,${b64}`, box: j.box },
  );
  const data = out.split(',')[1];
  fs.writeFileSync(`${OUT}/${j.name}.jpg`, Buffer.from(data, 'base64'));
  console.log('cropped', j.name);
}
await browser.close();

import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIR = process.argv[2];
const files = fs.readdirSync(DIR).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });

for (const f of files) {
  const b64 = fs.readFileSync(`${DIR}/${f}`).toString('base64');
  const mime = /\.png$/i.test(f) ? 'image/png' : 'image/jpeg';
  const hex = await page.evaluate(
    async ({ src }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const W = img.naturalWidth, H = img.naturalHeight;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      // Sample a grid of small patches over the cover area, skipping the very
      // centre (foil text) and outer 18% (background / shadow). Take the median
      // patch per channel so foil and highlights don't skew the colour.
      const pts = [];
      for (let px = 0.25; px <= 0.75; px += 0.1) {
        for (let py = 0.25; py <= 0.75; py += 0.1) {
          if (Math.abs(px - 0.5) < 0.08 && Math.abs(py - 0.5) < 0.12) continue; // skip foil
          const d = x.getImageData(Math.floor(px * W), Math.floor(py * H), 8, 8).data;
          let r = 0, g = 0, b = 0, n = 0;
          for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
          pts.push([r / n, g / n, b / n]);
        }
      }
      const med = (k) => {
        const s = pts.map((p) => p[k]).sort((a, b) => a - b);
        return Math.round(s[Math.floor(s.length / 2)]);
      };
      const r = med(0), g = med(1), b = med(2);
      return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
    },
    { src: `data:${mime};base64,${b64}` },
  );
  console.log(`${f}\t${hex}`);
}
await browser.close();

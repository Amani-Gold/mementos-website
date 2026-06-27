import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIR = process.argv[2];
const files = fs.readdirSync(DIR).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 600, height: 600 } });

const out = [];
for (const f of files) {
  const b64 = fs.readFileSync(`${DIR}/${f}`).toString('base64');
  const mime = /\.png$/i.test(f) ? 'image/png' : 'image/jpeg';
  const res = await page.evaluate(
    async ({ src }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      // sample a central patch (the cover) and take the median-ish average
      const x0 = Math.floor(W * 0.4);
      const y0 = Math.floor(H * 0.4);
      const d = x.getImageData(x0, y0, Math.floor(W * 0.2), Math.floor(H * 0.2)).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
      const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
      return { W, H, hex };
    },
    { src: `data:${mime};base64,${b64}` },
  );
  out.push({ file: f, ...res });
  console.log(`${f}\t${res.W}x${res.H}\t${res.hex}`);
}
fs.writeFileSync(`${DIR}/colors.json`, JSON.stringify(out, null, 2));
await browser.close();

import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIR = process.argv[2];
const files = fs.readdirSync(DIR).filter((f) => /^sp_\d+\.jpg$/.test(f)).sort();

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 900, height: 460 } });

for (const f of files) {
  const b64 = fs.readFileSync(`${DIR}/${f}`).toString('base64');
  await page.setContent(
    `<body style="margin:0;background:#eee"><img style="width:100%;display:block" src="data:image/jpeg;base64,${b64}"></body>`,
  );
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${DIR}/th_${f}`, type: 'jpeg', quality: 60 });
  console.log('thumb', f);
}
await browser.close();

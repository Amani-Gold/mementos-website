import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox']});
const p = await b.newPage();
p.on('pageerror', e=>console.log('EXC:', e.message, '\nSTACK:', e.stack));
await p.goto('http://localhost:4174/',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
await b.close();

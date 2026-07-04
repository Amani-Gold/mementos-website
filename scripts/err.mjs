import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox']});
const p = await b.newPage();
p.on('pageerror', e=>console.log('EXC:', e.message));
p.on('console', m=>{ if(m.type()==='error') console.log('CERR:', m.text()); });
await p.goto('http://localhost:4173/?raw',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
console.log('hasSets', await p.evaluate(()=>!!window.__sets));
await b.close();

import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for (const [label,url] of [['fixed','http://localhost:4180/home/'],['control','http://localhost:4180/control/']]) {
  const p = await b.newPage({viewport:{width:1440,height:900}});
  await p.goto(url, {waitUntil:'domcontentloaded'});
  await p.waitForTimeout(4000);
  console.log(label, JSON.stringify(await p.evaluate(()=>{
    const c=document.getElementById('stage'), sec=document.getElementById('collections3d');
    const cs=getComputedStyle(c);
    const p0=document.querySelector('#collections3d .panel');
    return { vh: innerHeight, svh: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--x')) || null,
      canvasH: c.getBoundingClientRect().height, marginBottom: cs.marginBottom, height: cs.height, position: cs.position,
      secTop: Math.round(sec.getBoundingClientRect().top+scrollY),
      panel0Top: Math.round(p0.getBoundingClientRect().top+scrollY),
      secH: Math.round(sec.getBoundingClientRect().height), docH: document.documentElement.scrollHeight };
  })));
  await p.close();
}
await b.close();

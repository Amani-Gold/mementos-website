import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:4180/home/', {waitUntil:'domcontentloaded'});
await p.waitForTimeout(5000);
const s3 = await p.evaluate(() => { const s=document.getElementById('collections3d').getBoundingClientRect(); return {top:s.top+scrollY,h:s.height,vh:innerHeight}; });
await p.evaluate((y)=>scrollTo(0,y), s3.top + (s3.h - s3.vh));
await p.waitForTimeout(7000);
console.log(JSON.stringify(await p.evaluate(()=>{
  const s=window.__sets;
  const stage=document.getElementById('stage').getBoundingClientRect();
  const sec=document.getElementById('collections3d').getBoundingClientRect();
  return { world: s.worldMap.group.visible, mailer: s.mailer.group.visible, boxes: s.boxes.group.visible,
           stageTop: Math.round(stage.top), stageBottom: Math.round(stage.bottom),
           secTop: Math.round(sec.top), secBottom: Math.round(sec.bottom) };
})));
await p.screenshot({path:'/tmp/g_world_settled.png'});
await b.close();

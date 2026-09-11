import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await b.newPage({viewport:{width:1440,height:900}});
await p.goto((process.env.P||'http://localhost:4180/home/'), {waitUntil:'domcontentloaded'});
await p.waitForTimeout(5000);
const target = await p.evaluate(() => { const s=document.getElementById('collections3d').getBoundingClientRect(); return s.top+scrollY+s.height-innerHeight; });
await p.evaluate((y)=>window.scrollTo({top:y,behavior:'instant'}), target);
await p.waitForTimeout(6000);
console.log(JSON.stringify(await p.evaluate(()=>{
  const panels=[...document.querySelectorAll('#collections3d .panel')].map(el=>{const r=el.getBoundingClientRect();return {top:Math.round(r.top),h:Math.round(r.height)};});
  const c=document.getElementById('stage').getBoundingClientRect();
  const sec=document.getElementById('collections3d').getBoundingClientRect();
  const s=window.__sets;
  return {scrollY:Math.round(scrollY), panels, canvas:{top:Math.round(c.top),h:Math.round(c.height)},
    sec:{top:Math.round(sec.top),h:Math.round(sec.height)},
    positions:{world:s.worldMap.group.position.y.toFixed(2), mailer:s.mailer.group.position.y.toFixed(2), boxes:s.boxes.group.position.y.toFixed(2)},
    vis:{world:s.worldMap.group.visible,mailer:s.mailer.group.visible,boxes:s.boxes.group.visible},
    cam:{y:s.camera.position.y.toFixed(2), z:s.camera.position.z.toFixed(2)}};
}), null, 1));
await b.close();

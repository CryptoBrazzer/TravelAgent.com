const {chromium}=require('playwright');const PNG=require('pngjs').PNG;
function lum(r,g,b){const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)}
function ratio(a,b){const L=Math.max(a,b),M=Math.min(a,b);return (L+0.05)/(M+0.05)}
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  let worstAll=99, fails=0;
  for(const W of [1440,390]){
    const c=await b.newContext({viewport:{width:W,height:900},deviceScaleFactor:1,isMobile:W<600,hasTouch:W<600});
    await c.addInitScript(()=>{try{localStorage.setItem('escape.consent.v1',JSON.stringify({necessary:true,at:Date.now()}))}catch(e){}});
    const p=await c.newPage();
    await p.goto('http://127.0.0.1:8900/',{waitUntil:'networkidle'});
    await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,35));}});
    await p.waitForTimeout(1800);
    await p.addStyleTag({content:'#cookie,.cookie{display:none!important}.rv{opacity:1!important;transform:none!important}'});
    // every section that carries a full-bleed photograph, plus the CTA
    const secs=await p.$$('.section--photo, .cta');
    for(const sec of secs){
      await sec.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
      const name=await sec.evaluate(e=>e.id||e.className.replace(/\s+/g,'.').slice(0,34));
      const boxes=await sec.evaluate(e=>{
        const out=[];
        e.querySelectorAll('h2,h3,p,.eyebrow,.src,.status,.lead,b,small,span').forEach(el=>{
          if(el.closest('svg,.device,.ui,figure'))return;
          if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1))return;
          const cs=getComputedStyle(el);
          if(cs.backgroundColor!=='rgba(0, 0, 0, 0)'||cs.backgroundImage!=='none')return;
          const r=el.getBoundingClientRect();
          if(r.width<8||r.height<8||r.top<70||r.bottom>898)return;
          el.setAttribute('data-cx','1');
          out.push({t:el.textContent.trim().slice(0,30),color:cs.color.match(/[\d.]+/g).slice(0,3).map(Number),
            fs:parseFloat(cs.fontSize),fw:+cs.fontWeight||400,
            x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)});
        });
        return out;
      });
      if(!boxes.length){continue}
      const st=await p.addStyleTag({content:'[data-cx]{visibility:hidden!important}'});
      await p.waitForTimeout(350);
      const png=PNG.sync.read(await p.screenshot());
      await p.evaluate(el=>el.remove(), st);
      await p.evaluate(()=>document.querySelectorAll('[data-cx]').forEach(e=>e.removeAttribute('data-cx')));
      for(const bx of boxes){
        let worst=99,bg=null;
        for(let y=Math.max(0,bx.y);y<Math.min(png.height-1,bx.y+bx.h);y+=2)
          for(let x=Math.max(0,bx.x);x<Math.min(png.width-1,bx.x+bx.w);x+=3){
            const i=(png.width*y+x)<<2;
            const cr=ratio(lum(...bx.color),lum(png.data[i],png.data[i+1],png.data[i+2]));
            if(cr<worst){worst=cr;bg=[png.data[i],png.data[i+1],png.data[i+2]]}
          }
        const need=(bx.fs>=24||(bx.fs>=18.66&&bx.fw>=700))?3:4.5;
        if(worst<worstAll) worstAll=worst;
        if(worst<need){fails++;console.log(`  ✗ ${W}px ${name}  ${worst.toFixed(2)}:1 (нужно ${need}) ${Math.round(bx.fs)}px  rgb(${bx.color}) на rgb(${bg})  «${bx.t}»`)}
      }
      console.log(`${W}px  ${name}: ${boxes.length} текстовых блоков проверено`);
    }
    await c.close();
  }
  console.log(`\nнарушений: ${fails}; худший запас по всем фото-секциям: ${worstAll.toFixed(2)}:1`);
  await b.close();
})();

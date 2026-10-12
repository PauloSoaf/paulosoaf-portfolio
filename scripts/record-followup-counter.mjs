import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300", output = "docs/qa/CreativeFollowup";
await mkdir(`${output}/videos`, { recursive:true }); await mkdir(`${output}/screenshots`, { recursive:true });
const browser = await chromium.launch({args:["--enable-unsafe-swiftshader"]});
try {
  for (const width of [1440,390]) {
    const height=width===390?844:900;
    const context=await browser.newContext({viewport:{width,height},hasTouch:width===390,isMobile:width===390,reducedMotion:"no-preference",recordVideo:{dir:"docs/report/CreativeFollowup/recordings",size:{width,height}}});
    const page=await context.newPage(); await page.goto(`${origin}/pt?heroDebug=1`);
    await page.waitForFunction(()=>document.querySelector("[data-hero-art]")?.getAttribute("data-hero-state")==="ready");
    await page.locator(".carousel-controls").evaluate(el=>el.scrollIntoView({block:"center",behavior:"smooth"})); await page.waitForTimeout(1500);
    await page.locator(".filmstrip-button").first().click();
    await page.getByRole("button",{name:"Reproduzir automaticamente",exact:true}).click();
    await page.locator("header a").first().evaluate(el=>el.focus({preventScroll:true})); await page.mouse.move(0,0);
    await page.waitForFunction(()=>document.querySelector("[data-carousel]")?.getAttribute("data-auto")==="true");
    await page.evaluate(()=>{
      const timer=document.querySelector("[data-countdown]"); window.counterEvidence=[];
      const record=()=>window.counterEvidence.push({seconds:Number(timer.dataset.countdown),timeMs:performance.now(),project:document.querySelector("[data-carousel]").dataset.selectedIndex});
      record(); new MutationObserver(record).observe(timer,{attributes:true,attributeFilter:["data-countdown"]});
    });
    await page.screenshot({path:`${output}/screenshots/countdown-${width}-start.png`});
    await page.waitForFunction(()=>window.counterEvidence.some(entry=>entry.seconds===0));
    await page.waitForTimeout(300);
    const sequence=await page.evaluate(()=>window.counterEvidence);
    if (![7,6,5,4,3,2,1,0].every(number=>sequence.some(entry=>entry.seconds===number))) throw new Error("Incomplete native countdown");
    await writeFile(`${output}/countdown-${width}.json`,JSON.stringify({nativeClock:true,sequence},null,2)+"\n");
    const video=page.video(); await context.close(); await video.saveAs(`${output}/videos/countdown-${width}.webm`);
    console.log({width,seconds:sequence.map(entry=>entry.seconds)});
  }
} finally {await browser.close();}

import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { open, settle, sample } from "./lib/workstation-p02.mjs";

const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3300";
const output = process.env.QA_LIVE_OUTPUT ?? "docs/report/Workstation/LiveExperience/visual";
mkdirSync(output, { recursive: true });
// Last two cases emulate the CSS area/DPR of 1920×1080 at 125% and 200% zoom.
// This is layout emulation, not a claim of testing Chrome's visible zoom menu.
const allCases = [[360,800,1],[390,844,1],[768,1024,1],[1024,768,1],[1280,720,1],[1366,768,1],[1440,900,1],[1920,1080,1],[2119,1304,1],[2560,1440,1],[2880,1800,1],[3840,2160,1],[1536,864,1.25],[960,540,2]];
const selectedWidths = process.env.QA_LIVE_WIDTHS?.split(",").map(Number);
const cases = allCases.filter(([width]) => !selectedWidths || selectedWidths.includes(width));
const evidence = { base: "eb6501683598438587e68ffaf952af942a19dec2", sourceHead: execFileSync("git", ["rev-parse","HEAD"], { encoding:"utf8" }).trim(), origin, cases: [], failures: [] };
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
try {
 for (const theme of ["dark", "light"]) for (const [width,height,dpr] of cases) {
  if (theme === "light" && ![390,1440,2119,2880].includes(width)) continue;
  const context = await browser.newContext({ viewport:{width,height}, deviceScaleFactor:dpr, reducedMotion:"no-preference" });
  await context.addCookies([{ name:"ps-theme", value:theme, url:origin }]);
  const page = await context.newPage(), errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", e => { if (e.type() === "error" && /hydration|hydrated|React error|Maximum update/.test(e.text())) errors.push(e.text()); });
  try {
   await open(page,origin);
   for (const section of ["work","about"]) {
    if(width<1024) await page.locator('header button[aria-controls]').click();
    await page.locator(`header nav a[href="/pt#${section}"]:visible`).click();
    await settle(page);
    if (section === "work") await page.locator(".filmstrip-button").first().click();
    if(width<1024) {
     await page.screenshot({path:`${output}/${width}-${theme}-${section}-navigation.png`});
     await page.locator(`[data-workstation-section-anchor="${section}"]`).evaluate(n=>n.scrollIntoView({block:"center",behavior:"instant"}));
    }
    await page.mouse.move(8,100); await settle(page);
    let liveSite = null;
    if (section === "work") {
     try {
      const frame = page.frameLocator('iframe[data-project-site="nutriopus"]');
      await frame.locator("h1").filter({hasText:/\S/}).waitFor({timeout:20000});
      await frame.locator("body").evaluate(async () => {
       await document.fonts.ready;
       await Promise.allSettled([...document.images].filter(image => {
        const rect = image.getBoundingClientRect(); return rect.width > 24 && rect.height > 24 && rect.top < innerHeight && rect.bottom > 0;
       }).map(image => image.decode()));
      });
      // Observe the external site's own intro; never finish or replace its animation.
      await page.waitForTimeout(1800);
      liveSite = true;
     } catch { liveSite = false; }
    }
    const result = await sample(page);
    const geometry = await page.evaluate(section=>{
     const host=document.querySelector("[data-workstation]");
     const points=host.dataset.hull.split(";").map(p=>p.split(",").map(Number));
     const bounds={left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};
     const left=document.querySelector(section==="work"?'[data-carousel]':'#about .journey-navigation').getBoundingClientRect();
     const station=document.querySelector(`[data-workstation-section-anchor="${section}"]`).getBoundingClientRect();
     return {bounds,station:{left:station.left,top:station.top,width:station.width,height:station.height},headerBottom:document.getElementById("top").getBoundingClientRect().bottom,
      intersectsCopy:bounds.right>left.left && bounds.left<left.right && bounds.bottom>left.top && bounds.top<left.bottom,
      frameWidth:document.querySelector(".workstation-projected-screen").getBoundingClientRect().width,
      detailsInNotebook:!!document.querySelector("[data-notebook-journey] .journey-panel"),draftBadges:[...document.querySelectorAll('[data-editorial="status"]')].filter(n=>/Rascunho|Draft|Borrador/.test(n.textContent)).length};
    },section);
    const record={width,height,dpr,theme,section,liveSite,...geometry,alignmentErrorPx:result.alignmentErrorPx,overflow:result.overflow,canvases:result.canvases,errors};
    evidence.cases.push(record);
    if (result.overflow || result.canvases!==1 || result.alignmentErrorPx>1 || geometry.draftBadges || errors.length || geometry.intersectsCopy || geometry.bounds.left<0 || geometry.bounds.right>width || geometry.bounds.top<geometry.headerBottom-1 || geometry.bounds.bottom>height+1 || (section==="about"&&!geometry.detailsInNotebook)) evidence.failures.push(record);
    await page.screenshot({path:`${output}/${width}-${theme}-${section}.png`});
    console.log(JSON.stringify({width,height,theme,section,screenWidth:Math.round(geometry.frameWidth),bounds:geometry.bounds,overlap:geometry.intersectsCopy,errors}));
   }
  }catch(error){evidence.failures.push({width,height,theme,error:String(error)});console.log(String(error));}
  finally { await context.close(); writeFileSync(`${output}/evidence.json`,JSON.stringify(evidence,null,2)); }
 }
} finally {await browser.close()}
if (evidence.failures.length) process.exitCode=1;

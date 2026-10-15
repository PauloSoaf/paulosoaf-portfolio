import { expect, test } from "@playwright/test";
test.use({ reducedMotion:"no-preference", viewport:{width:1440,height:900}, launchOptions:{args:["--enable-unsafe-swiftshader"]} });

test("countdown reaches zero at the real deadline, selects a new project, freezes on hover and resumes remaining time",async({page})=>{
  await page.goto("/pt#work"); const carousel=page.locator("[data-carousel]"), timer=page.getByRole("timer");
  await expect(carousel).toHaveAttribute("data-enhanced","true"); await page.locator(".carousel-stage").scrollIntoViewIfNeeded();
  await page.locator(".carousel-stage").focus(); await expect(carousel).toHaveAttribute("data-auto","false");
  await page.locator(".filmstrip-button").first().click();
  const clockStart = new Date("2026-10-14T12:00:00Z");
  await page.clock.install({ time: clockStart }); await page.clock.pauseAt(new Date(clockStart.getTime() + 1000));
  await page.getByRole("button",{name:"Reproduzir automaticamente",exact:true}).click();
  await page.locator("#hero-title").evaluate(el=>{(el as HTMLElement).tabIndex=-1;(el as HTMLElement).focus({preventScroll:true});}); await page.mouse.move(0,0);
  await expect(carousel).toHaveAttribute("data-auto","true"); await expect(timer).toHaveAttribute("data-countdown","7");
  for(let second=6;second>=1;second--){await page.clock.runFor(1000); await expect(timer).toHaveAttribute("data-countdown",String(second));}
  await page.clock.runFor(1000); await expect(timer).toHaveAttribute("data-countdown","0"); await expect(carousel).toHaveAttribute("data-selected-index","1");
  await page.clock.runFor(100); await expect(timer).toHaveAttribute("data-countdown","7");
  await page.clock.runFor(2000); await expect(timer).toHaveAttribute("data-countdown","5");
  await page.locator(".carousel-stage").hover(); await expect(carousel).toHaveAttribute("data-auto","false");
  await page.clock.runFor(9000); await expect(timer).toHaveAttribute("data-countdown","5");
  await page.mouse.move(0,0); await page.clock.runFor(4900); await expect(carousel).toHaveAttribute("data-selected-index","2");
});

test("direct project selectors change actual content and preserve manual navigation in reduced motion",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"}); await page.goto("/pt#work");
  await page.getByRole("button",{name:"Selecionar projeto: ChessInReact",exact:true}).click();
  await expect(page.locator('[data-carousel]')).toHaveAttribute("data-selected-index","4");
  await expect(page.locator('.carousel-slide[data-active="true"] h3')).toHaveText("ChessInReact");
  await expect(page.getByRole("timer")).toHaveText("—"); await expect(page.locator("canvas")).toHaveCount(0);
  await page.locator("#expertise .spotlight-card").first().hover();
  const symbol = await page.locator(".expertise-symbol path").first().evaluate(el => ({ offset:getComputedStyle(el).strokeDashoffset, duration:parseFloat(getComputedStyle(el).transitionDuration) }));
  expect(symbol.offset).toBe("0px"); expect(symbol.duration).toBeLessThanOrEqual(.00001);
  await page.locator("#services .spotlight-card").first().hover();
  expect(await page.locator(".service-emblem").first().evaluate(el => getComputedStyle(el).transform)).toBe("none");
  await page.getByRole("link",{name:"Explorar projetos",exact:true}).hover();
  expect(await page.getByRole("link",{name:"Explorar projetos",exact:true}).evaluate(el => getComputedStyle(el,"::before").transform)).toBe("none");
});

test("reveal begins deeper in the viewport and remains visibly in progress after 400ms",async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,"connection",{value:{saveData:true},configurable:true}));
  await page.goto("/pt"); const heading=page.locator("#expertise-title");
  await expect(heading).toHaveAttribute("data-motion-state","ready");
  await heading.evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top-innerHeight+40,behavior:"instant"}));
  await page.waitForTimeout(200); await expect(heading).toHaveAttribute("data-motion-state","ready");
  await page.mouse.wheel(0,280); await expect(heading).toHaveAttribute("data-motion-state","running");
  await page.waitForTimeout(400);
  const state=await heading.evaluate(el=>({duration:el.getAnimations()[0]?.effect?.getTiming().duration,translate:new DOMMatrix(getComputedStyle(el).transform).m42,opacity:Number(getComputedStyle(el).opacity)}));
  expect(state.duration).toBe(1100); expect(state.translate).toBeGreaterThan(3); expect(state.opacity).toBeLessThan(1);
  await expect(heading).toHaveAttribute("data-motion-state","finished");
});

test("one real canvas follows all five sections with changing sizes, and global pause freezes it",async({page})=>{
  await page.goto("/pt?heroDebug=1"); const art=page.locator("[data-hero-art]"), companion=page.locator("[data-spatial-companion]");
  await expect(art).toHaveAttribute("data-hero-state","ready",{timeout:30000}); const canvas=await page.locator("canvas").elementHandle(), widths:number[]=[];
  for(const id of ["work","about","expertise","services","contact"]){
    await page.locator('#'+id).evaluate(el=>el.scrollIntoView({block:"start",behavior:"instant"}));
    await expect(companion).toHaveAttribute("data-spatial-section",id); await expect(companion).toBeInViewport();
    widths.push((await companion.boundingBox())!.width); expect(await canvas!.evaluate(el=>el===document.querySelector("canvas"))).toBe(true);
    await expect(art).toHaveAttribute("data-hero-state","ready");
  }
  expect(Math.max(...widths)-Math.min(...widths)).toBeGreaterThan(60);
  await page.getByRole("button",{name:"Pausar movimento",exact:true}).click(); await page.waitForTimeout(150);
  const frames=await art.getAttribute("data-hero-frames"); await page.waitForTimeout(400); expect(await art.getAttribute("data-hero-frames")).toBe(frames);
  await page.getByRole("button",{name:"Usar arte estática",exact:true}).click(); await expect(page.locator("canvas")).toHaveCount(0);
});

test("spotlight cards respond to the pointer and existing CTAs keep real destinations",async({page})=>{
  await page.goto("/pt#expertise"); const card=page.locator('[data-spotlight]').first(); await card.hover({position:{x:70,y:100}});
  await expect.poll(()=>card.evaluate(el=>(el as HTMLElement).style.getPropertyValue("--spot-x"))).not.toBe("");
  await expect(card.locator(".expertise-symbol")).toBeVisible();
  await page.getByRole("link",{name:"Conversar sobre um projeto",exact:true}).click(); await expect(page).toHaveURL(/#contact$/);
});

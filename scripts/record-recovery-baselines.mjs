// Run against each historical version before edits. Saves native, real-time recordings.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const origin = process.argv[2], name = process.argv[3];
if (!origin || !name) throw new Error('Usage: node scripts/record-recovery-baselines.mjs <origin> <before-s03|before-s03-5>');
(async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  for (const width of [1440, 390]) {
    const output = 'docs/qa/CreativeRecovery'; await mkdir(output + '/videos', { recursive: true }); await mkdir(output + '/screenshots', { recursive: true });
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'no-preference', isMobile: width === 390, hasTouch: width === 390, recordVideo: { dir: 'docs/report/CreativeRecovery/recordings', size: { width, height: width === 390 ? 844 : 900 } } });
    const page = await context.newPage(); await page.goto(origin + '/pt?heroDebug=1'); await page.waitForTimeout(2200);
    await page.screenshot({ path: `${output}/screenshots/${name}-${width}-opening.png` });
    const scroll = async (selector) => {
      for (let step = 0; step < 65; step++) {
        const top = await page.locator(selector).evaluate(el => el.getBoundingClientRect().top);
        if (Math.abs(top - 160) < 110) break;
        await page.mouse.wheel(0, Math.sign(top - 160) * Math.min(160, Math.abs(top - 160))); await page.waitForTimeout(80);
      }
      await page.waitForTimeout(550);
    };
    await scroll('[data-hero-art]'); await page.mouse.move(width * .85, 420); await page.waitForTimeout(650);
    await scroll('#work'); await page.locator('.carousel-next').click(); await page.waitForTimeout(650);
    await page.screenshot({ path: `${output}/screenshots/${name}-${width}-work.png` });
    await scroll('#about'); if (width === 1440) { await page.getByRole('tab').nth(1).click(); await page.waitForTimeout(600); await page.getByRole('tab').nth(2).click(); }
    await page.screenshot({ path: `${output}/screenshots/${name}-${width}-about.png` });
    for (const selector of ['#expertise', '#services', '#contact']) await scroll(selector);
    await page.waitForTimeout(650); const video = page.video(); await context.close(); await video.saveAs(`${output}/videos/${name}-${width}.webm`);
    console.log(name, width, 'complete navigation recorded');
  }
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });

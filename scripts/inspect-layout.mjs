import { chromium } from "playwright";

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:3200/${process.argv[2] ?? "pt"}`);
  await page.evaluate(() => document.fonts.ready);
  if (process.argv[3] === "zoom") await page.addStyleTag({ content: "html { font-size: 200%; }" });
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    console.log(width, await page.evaluate(() => ({
      total: document.documentElement.scrollWidth,
      items: [...document.querySelectorAll("body *")].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.right > innerWidth + 1 && getComputedStyle(element).display !== "none";
      }).slice(0, 12).map((element) => ({
        tag: element.tagName, text: element.textContent.slice(0, 65),
        class: element.className, right: element.getBoundingClientRect().right,
      })),
    })));
  }
} finally {
  await browser.close();
}

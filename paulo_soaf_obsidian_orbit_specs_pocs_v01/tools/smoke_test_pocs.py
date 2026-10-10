import asyncio, pathlib, base64
from playwright.async_api import async_playwright
root=pathlib.Path(__file__).resolve().parents[1]
html=(root/'pocs/preview/index.html').read_text();css=(root/'pocs/preview/styles.css').read_text().replace("@import url('');",'');js=(root/'pocs/preview/scripts.js').read_text()
html=html.replace('<link rel="stylesheet" href="styles.css"/>','<style>'+css+'</style>').replace('<script src="scripts.js" defer></script>','<script>'+js+'</script>')
for fn in ['procedural-orb.svg','chess.svg','iot.svg']:
 html=html.replace('../../assets/illustrations/'+fn,'data:image/svg+xml;base64,'+base64.b64encode((root/'assets/illustrations'/fn).read_bytes()).decode())
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for w,h in [(1440,900),(390,844)]:
   page=await browser.new_page(viewport={'width':w,'height':h})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   await page.set_content(html,wait_until='load')
   assert await page.locator('.project-card').count()==3
   assert (await page.locator('#carousel-counter').inner_text())=='01 / 03'
   await page.locator('#next').click()
   assert (await page.locator('#carousel-counter').inner_text())=='02 / 03'
   await page.locator('#play').click()
   assert 'Retomar' in (await page.locator('#play').inner_text())
   await page.locator('.timeline-choice[data-step="2"]').click()
   assert 'Produtos & mundos digitais' == await page.locator('#exp-title').inner_text()
   await page.locator('#fallback-btn').click()
   assert await page.locator('.hero').evaluate('(e)=>e.classList.contains("is-fallback")')
   await page.locator('.universe-node[data-node="1"]').click()
   assert 'xadrez' in (await page.locator('#explore-summary').inner_text()).lower()
   sw=await page.evaluate('document.documentElement.scrollWidth')
   assert sw<=w, f'horizontal overflow width {w}: {sw}'
   assert errors==[], errors
   print('PASS: responsive and interactions at',w,'x',h)
   await page.close()
  await browser.close()
asyncio.run(main())

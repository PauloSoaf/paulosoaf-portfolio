import asyncio, pathlib, base64
from playwright.async_api import async_playwright
root=pathlib.Path(__file__).resolve().parents[1]
html=(root/'pocs/preview/index.html').read_text()
css=(root/'pocs/preview/styles.css').read_text().replace("@import url('');",'')
js=(root/'pocs/preview/scripts.js').read_text()
html=html.replace('<link rel="stylesheet" href="styles.css"/>','<style>'+css+'</style>')
html=html.replace('<script src="scripts.js" defer></script>','<script>'+js+'</script>')
for fn in ['procedural-orb.svg','chess.svg','iot.svg']:
 data=base64.b64encode((root/'assets/illustrations'/fn).read_bytes()).decode()
 html=html.replace('../../assets/illustrations/'+fn, 'data:image/svg+xml;base64,'+data)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
  cases=[('01-hero-desktop.png',1440,900,'#hero'),('02-projects-desktop.png',1440,900,'#work'),('03-timeline-desktop.png',1440,900,'#about'),('04-explore-desktop.png',1440,900,'#explore'),('05-hero-mobile.png',390,844,'#hero'),('06-projects-mobile.png',390,844,'#work')]
  for fn,w,h,target in cases:
   page=await b.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   await page.set_content(html,wait_until='load')
   await page.wait_for_timeout(200)
   await page.locator(target).screenshot(path=str(root/'assets/mockups'/fn),animations='disabled',timeout=10000)
   print(fn, 'errors',errors,'scrollWidth',await page.evaluate('document.documentElement.scrollWidth'),'viewport',w)
   await page.close()
  await b.close()
asyncio.run(main())

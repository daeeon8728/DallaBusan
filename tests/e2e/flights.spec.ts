import {test,expect} from './fixtures.js';
import {TravelToolFrameSchema} from '@trip-fit/domain';
test.beforeEach(async({context})=>{
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(['127.0.0.1','localhost'].includes(url.hostname)||url.protocol==='data:')return route.continue();
  if(route.request().resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"/>'});
  return route.fulfill({contentType:'text/html',body:'<html><body>Official flight search mock: Busan</body></html>'});
 });
});
test('home opens a dedicated flight tab, defers partner content and preserves entry on reload',async({page,request},info)=>{
 const providerRequests:string[]=[];page.on('request',r=>{if(r.resourceType()==='document'&&!['127.0.0.1','localhost'].includes(new URL(r.url()).hostname))providerRequests.push(r.url());});
 await page.goto('/?locale=en');await page.getByTestId('flights-link').click();
 await expect(page).toHaveURL(/\/travel-tools\?.*section=flights/);
 const section=page.getByTestId('flight-tools');await expect(section).toBeVisible();
 await expect(page.getByTestId('stay-comparison')).toHaveCount(0);await expect(page.getByTestId('experience-tools')).toHaveCount(0);
 await expect(page.locator('iframe')).toHaveCount(0);expect(providerRequests).toEqual([]);
 await expect(section).toContainText('Preset dates are examples');
 await page.reload();await expect(section).toBeVisible();
 const source=TravelToolFrameSchema.parse(await(await request.get('/api/travel-tools/flight-search?locale=en')).json());
 await section.getByRole('button',{name:'Open tool',exact:true}).click();
 await expect(section.locator('iframe')).toHaveAttribute('src',source.url);
 await expect(section.locator('iframe')).toHaveAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
 await expect(section.getByRole('link',{name:'Open with partner'})).toHaveAttribute('rel','sponsored noopener noreferrer');
 expect(providerRequests).toEqual([source.url]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await section.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('flights.png'),animations:'disabled'});
 await section.getByRole('button',{name:'Close tool',exact:true}).click();await expect(page.locator('iframe')).toHaveCount(0);
});
test('five UI languages disclose English fallback and failed frame metadata can retry',async({page})=>{
 await page.goto('/travel-tools?section=flights&locale=en');
 const section=page.getByTestId('flight-tools');
 for(const locale of ['ko','ja','zh-CN','zh-TW','en']){
  await page.locator('.language-select select').selectOption(locale);await expect(section).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang',locale);await expect(page).toHaveURL(/section=flights/);
  await expect(page.locator('iframe')).toHaveCount(0);
 }
 await page.route('**/api/travel-tools/flight-search?*',route=>route.fulfill({status:503,body:'{}'}));
 await section.getByRole('button',{name:'Open tool',exact:true}).click();await expect(section.getByRole('alert')).toBeVisible();
 await expect(page.locator('iframe')).toHaveCount(0);
 await page.unroute('**/api/travel-tools/flight-search?*');await section.getByRole('button',{name:'Try again'}).click();
 await expect(section.locator('iframe')).toBeVisible();
 await page.getByRole('button',{name:'Find a stay',exact:true}).click();await expect(section).toHaveCount(0);await expect(page).not.toHaveURL(/section=flights/);
 await expect(page.getByTestId('shared-stay-search')).toBeVisible();
});

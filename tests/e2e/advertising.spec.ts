import {test,expect} from './fixtures.js';
import {ADVERTISING} from '../../apps/web/src/config/advertising.js';
test.beforeEach(async({context})=>{
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(['127.0.0.1','localhost'].includes(url.hostname)||url.protocol==='data:')return route.continue();if(route.request().resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"/>'});return route.fulfill({body:'/* External mock */'});});
});
test('serves the generated seller declaration and one account meta tag without installing advertising trackers',async({page,request})=>{
 const response=await request.get('/ads.txt');expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('text/plain');expect((await response.text()).trim()).toBe('google.com, pub-9707649247569634, DIRECT, f08c47fec0942fa0');
 const requests:string[]=[];page.on('request',r=>{if(/pagead2\.googlesyndication\.com|doubleclick\.net/.test(r.url()))requests.push(r.url());});
 await page.goto('/?locale=en');await expect(page.getByTestId('offer-card').first()).toBeVisible();await expect(page.locator('meta[name="google-adsense-account"]')).toHaveCount(1);await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute('content',ADVERTISING.publisherId);await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);expect(requests).toEqual([]);
});
test('keeps one future manual placement out of unapproved details and preserves content width and navigation',async({page})=>{
 const requests:string[]=[];page.on('request',r=>{if(r.url().includes('adsbygoogle.js'))requests.push(r.url());});
 for(const path of ['/places/gwangalli','/food/2899','/courses/fa01','/cart','/saved']){
  await page.goto(path+'?locale=en');await expect(page.locator('main h1')).toBeVisible();await expect(page.getByTestId('detail-advertisement')).toHaveCount(0);await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);await expect(page.locator('.header-nav a')).toHaveCount(6);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect(requests).toEqual([]);
});

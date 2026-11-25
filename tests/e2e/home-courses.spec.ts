import {test,expect} from './fixtures.js';
test.beforeEach(async({context})=>{
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(['127.0.0.1','localhost'].includes(url.hostname)||url.protocol==='data:')return route.continue();
  if(url.hostname==='tiles.openfreemap.org')return route.fulfill({json:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#e4f0f0'}}]}});
  if(route.request().resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#93b6bb"/></svg>'});
  return route.abort();
 });
});
test('home shows courses before search, promotions and products, with usable category choices',async({page},info)=>{
 const errors:string[]=[],mapLoads:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url().includes('maplibre-gl-worker')||request.url().includes('tiles.openfreemap.org'))mapLoads.push(request.url());});
 await page.goto('/');
 const home=page.getByTestId('home-courses');await expect(home.getByTestId('home-course-card')).toHaveCount(3);
 await expect(page.getByRole('heading',{level:1})).toHaveText('Your Busan day starts here.');
 const hero=await home.boundingBox(),search=await page.locator('.home-secondary-search').boundingBox();
 if(!hero||!search)throw Error('Missing home sections');expect(hero.y).toBeLessThan(search.y);
 await home.getByRole('button',{name:'Friends',exact:true}).click();await expect(home.getByTestId('home-course-card')).toHaveCount(3);
 await expect(home.getByTestId('home-course-card').first()).toContainText('Friends');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('home-courses.png'),animations:'disabled'});
 expect(mapLoads).toEqual([]);expect(errors).toEqual([]);
 await home.getByTestId('home-course-card').first().click();await expect(page).toHaveURL(/\/courses\/fr01\?locale=en/);
});
test('course shows genuinely related products and opens the existing product dialog',async({page})=>{
 await page.goto('/courses/fa01?locale=en');
 const section=page.getByTestId('course-bookings');await expect(section.locator('.offer-card')).toHaveCount(3);
 await expect(section).toContainText('Lotte World Adventure Busan');await expect(section).toContainText('not a bundled tour');
 await section.locator('.offer-card h3 button').first().click();await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('home works in all five languages and can retry a failed course load',async({page})=>{
 await page.route('**/api/courses?*',route=>route.fulfill({status:503,body:'{}'}));
 await page.goto('/?locale=en');const home=page.getByTestId('home-courses');
 await expect(home.getByRole('alert')).toBeVisible();await page.unroute('**/api/courses?*');await home.getByRole('button',{name:'Try again'}).click();
 await expect(home.getByTestId('home-course-card')).toHaveCount(3);
 for(const locale of ['ko','ja','zh-CN','zh-TW','en']){
  await page.locator('.language-select select').selectOption(locale);
  await expect(home.getByTestId('home-course-card')).toHaveCount(3);await expect(page.locator('html')).toHaveAttribute('lang',locale);
 }
 await page.reload();await expect(home.getByTestId('home-course-card')).toHaveCount(3);
});

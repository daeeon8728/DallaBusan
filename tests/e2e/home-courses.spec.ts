import {test,expect} from './fixtures.js';
import {exchangeFixture} from '../fixtures/exchange.js';
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
 const home=page.getByTestId('home-courses');await expect(home.getByTestId('home-course-card')).toHaveCount(4);
 await expect(page.getByRole('heading',{level:1})).toHaveText('Your Busan day starts here.');
 await page.screenshot({path:info.outputPath('home-personas.png'),animations:'disabled'});
 const hero=await home.boundingBox(),search=await page.locator('.home-secondary-search').boundingBox();
 if(!hero||!search)throw Error('Missing home sections');expect(hero.y).toBeLessThan(search.y);
 await home.getByRole('button',{name:'Family 42',exact:true}).click();await expect(home.getByTestId('home-course-card')).toHaveCount(6);
 await expect(home.getByRole('button',{name:'Family 42',exact:true})).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('home-courses.png'),animations:'disabled'});
 expect(mapLoads).toEqual([]);expect(errors).toEqual([]);
 await home.getByTestId('home-course-card').first().click();await expect(page).toHaveURL(/\/courses\/fa01\?locale=en/);
});
test('course shows genuinely related products and opens the existing product dialog',async({page})=>{
 await page.goto('/courses/fa01?locale=en');
 const section=page.getByTestId('course-bookings');await expect(section.locator('.offer-card')).toHaveCount(3);
 await expect(section).toContainText('Lotte World Adventure Busan');await expect(section).toContainText('Each item is a separate reservation');
 await section.locator('.offer-card h3 button').first().click();await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('home works in all five languages and can retry a failed course load',async({page})=>{
 await page.route('**/api/courses?*',route=>route.fulfill({status:503,body:'{}'}));
 await page.goto('/?locale=en');const home=page.getByTestId('home-courses');
 await expect(home.getByRole('alert')).toBeVisible();await page.unroute('**/api/courses?*');await home.getByRole('button',{name:'Try again'}).click();
 await expect(home.getByTestId('home-course-card')).toHaveCount(4);
 for(const locale of ['ko','ja','zh-CN','zh-TW','en']){
  await page.locator('.language-select select').selectOption(locale);
  await expect(home.getByTestId('home-course-card')).toHaveCount(4);await expect(page.locator('html')).toHaveAttribute('lang',locale);
 await expect(home.getByTestId('home-course-categories').getByRole('button')).toHaveCount(6);await expect(home.getByRole('button',{name:'First-Timer',exact:true})).toHaveCount(0);
 }
 await page.reload();await expect(home.getByTestId('home-course-card')).toHaveCount(4);
});

test('only the original five categories remain and all 150 courses are reachable',async({page})=>{
 await page.goto('/?locale=en');const home=page.getByTestId('home-courses');await expect(home.getByTestId('home-course-categories').getByRole('button')).toHaveCount(6);for(const name of ['First-Timer','No Car','Couples','1-Day Trip'])await expect(home.getByRole('button',{name,exact:true})).toHaveCount(0);
 await home.getByRole('button',{name:'dallaBusan 21',exact:true}).click();await expect(home.getByTestId('home-course-card')).toHaveCount(6);await expect(home.locator('[href*="edit-"]')).toHaveCount(3);await home.locator('header').getByRole('link').click();await expect(page).toHaveURL(/category=dallabusan/);await expect(page.getByTestId('course-card')).toHaveCount(21);await page.reload();await expect(page.getByTestId('course-card')).toHaveCount(21);await page.locator('.course-categories a').first().click();await expect(page.getByTestId('course-card')).toHaveCount(150);await expect(page.locator('.course-persona-link')).toHaveCount(0);await page.locator('a[href^="/courses/edit-001?"]').click();await expect(page.getByRole('heading',{level:1})).toHaveText('Steps, Stories & Cinema');await expect(page.locator('.course-stops>li')).toHaveCount(3);await expect(page.locator('.leaflet-marker-icon')).toHaveCount(3);
});

test('bundle and spot choices use the existing five currencies and booking links are fresh and sponsored',async({page},info)=>{
 await page.route('**/api/exchange-rates',route=>route.fulfill({json:exchangeFixture()}));
 await page.goto('/courses/fa04?locale=en');const bundle=page.getByTestId('course-bundle'),spots=page.getByTestId('course-spot-items');
 await expect(bundle.getByTestId('offer-card')).toHaveCount(1);await expect(spots.getByTestId('offer-card').first()).toBeVisible();
 for(const [locale,currency] of [['ko','KRW'],['ja','JPY'],['zh-CN','CNY'],['zh-TW','TWD'],['en','USD']]){
 await page.locator('.language-select select').selectOption(locale??'en');
 await expect(bundle.getByTestId('display-price')).toHaveAttribute('data-price-currency',currency??'USD');await expect(spots.getByTestId('display-price').first()).toHaveAttribute('data-price-currency',currency??'USD');
 }
 await bundle.locator('.course-commerce-cta').click();const dialog=page.getByRole('dialog');await expect(dialog.locator('.booking-link')).toHaveText(/Find a guided tour visiting this stop/);
 await expect(dialog.locator('.booking-link')).toHaveAttribute('target','_blank');await expect(dialog.locator('.booking-link')).toHaveAttribute('rel','sponsored noopener noreferrer');
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
 await page.getByTestId('course-bookings').evaluate(element=>element.scrollIntoView({block:'start'}));await page.screenshot({path:info.outputPath('course-commerce.png'),animations:'disabled'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.route('**/api/offers/b-74132?*',route=>route.fulfill({status:503,body:'{}'}));await bundle.locator('.course-commerce-cta').click();await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();await expect(page.getByRole('dialog').locator('.booking-link')).toHaveCount(0);
});
test('commerce can retry and never carries a previous course or language into the new view',async({page})=>{
 await page.route('**/api/courses/fa02/offers?*',route=>route.fulfill({status:503,body:'{}'}));await page.goto('/courses/fa02?locale=en');const bookings=page.getByTestId('course-bookings');await expect(bookings.getByRole('alert')).toBeVisible();await page.unroute('**/api/courses/fa02/offers?*');await bookings.getByRole('button',{name:'Try again'}).click();await expect(page.getByTestId('course-bundle').getByTestId('offer-card')).toHaveCount(1);
 await page.goto('/courses/fo01?locale=en');await expect(page.getByTestId('course-bundle')).toContainText('No reviewed tour bundle');await expect(page.getByTestId('course-bookings').getByTestId('offer-card')).toHaveCount(0);
});

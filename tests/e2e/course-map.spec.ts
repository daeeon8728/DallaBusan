import {test,expect} from './fixtures.js';
import {CourseDetailSchema} from '@trip-fit/domain';
test.beforeEach(async({context})=>{
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(['localhost','127.0.0.1'].includes(url.hostname)||url.protocol==='data:')return route.continue();if(route.request().resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e1eded"/><path d="M0 125L256 155M95 0L185 256" stroke="#b8d1d4" stroke-width="6"/></svg>'});return route.fulfill({body:'External mock'});});
});
test('draws the road route and numbered stops, supports selection and full-route reset without external routing',async({page},testInfo)=>{
 const errors:string[]=[],routing:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',r=>{if(r.url().includes('routing.openstreetmap.de'))routing.push(r.url());});
 await page.goto('/courses/fa01?locale=en');const map=page.getByTestId('course-map');await expect(map).toBeVisible();await expect(map.locator('.course-map-pin')).toHaveCount(3);await expect(map.locator('path.leaflet-interactive')).toHaveCount(1);
 await expect(page.locator('.course-stops>li')).toHaveCount(3);await expect(page.locator('.course-stop-photo img')).toHaveCount(3);await expect(page.locator('.course-stop-facts')).toContainText(['Opening hours','Source menu','Opening hours']);
 await map.locator('.course-map-pin').first().click();await expect(page.locator('.course-stops>li').first()).toHaveAttribute('data-selected','true');
 await page.getByRole('button',{name:'Show full route'}).click();await expect(map.locator('.course-map-pin.is-active')).toHaveCount(0);
 await page.getByRole('button',{name:'Show on map',exact:true}).nth(1).click();await expect(map.locator('.course-map-pin.is-active')).toHaveCount(1);await expect(page.locator('.course-stops>li').nth(1)).toHaveAttribute('data-selected','true');
 await expect(page.locator('.course-transfer a')).toHaveCount(2);await expect(page.locator('.course-transfer a').first()).toHaveAttribute('href',/travelmode=driving/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Show full route'}).click();await map.scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath('course-road-map.png'),animations:'disabled'});
 expect(routing).toEqual([]);expect(errors).toEqual([]);
});
test('tile failures can retry and keep stop details available',async({page})=>{
 let fail=true;await page.route('https://tile.openstreetmap.org/**',route=>fail?route.fulfill({status:503,body:'Unavailable'}):route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"/>'}));
 await page.goto('/courses/fo10?locale=en');await expect(page.getByText('The basemap could not load.',{exact:false})).toBeVisible();await expect(page.locator('.course-stops>li')).toHaveCount(3);fail=false;await page.getByRole('button',{name:'Reload basemap'}).click();await expect(page.getByText('The basemap could not load.',{exact:false})).toHaveCount(0);
});
test('reference routes never bridge missing middle coordinates and localized maps preserve existing pages',async({page,request})=>{
 const input:unknown=await(await request.get('/api/courses/fa01?locale=ja')).json();const detail=CourseDetailSchema.parse(input);if(detail.course.steps[1])detail.course.steps[1].coordinates=null;
 detail.course.route={...detail.course.route,status:'reference',geometry:[],legs:[],distanceMeters:null,durationSeconds:null,collectedAt:null};
 await page.route('**/api/courses/fa01?locale=ja',route=>route.fulfill({json:detail}));await page.goto('/courses/fa01?locale=ja');const map=page.getByTestId('course-map');await expect(map.locator('.course-map-pin')).toHaveCount(2);await expect(map.locator('path.leaflet-interactive')).toHaveCount(0);await expect(page.getByRole('heading',{name:'コースを地図で確認'})).toBeVisible();await expect(page.getByText('参考地点のみ',{exact:false})).toBeVisible();
 await expect(page.locator('.header-nav a[href^="/search"]')).toHaveCount(1);await expect(page.locator('.header-nav a[href^="/recommended"]')).toHaveCount(1);
});

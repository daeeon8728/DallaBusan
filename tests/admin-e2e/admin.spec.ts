import {test,expect} from '@playwright/test';
import {AdminStateSchema,EMPTY_ADMIN_DOCUMENT} from '@trip-fit/domain';
import {z} from 'zod';
test.beforeEach(async({context})=>{
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname==='127.0.0.1')return route.continue();if(route.request().resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#a4bdbc"/></svg>'});return route.abort();});
 await context.addInitScript(()=>sessionStorage.setItem('dallabusan:recommendation-session:v1','closed'));
});
test('separate admin login, live content publishing, home layout and draft recovery',async({page,context},info)=>{
 const errors:string[]=[],scripts:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.resourceType()==='script')scripts.push(r.url());});page.on('dialog',d=>d.accept());
 await page.goto('/admin');await expect(page.getByRole('heading',{name:'콘텐츠 관리',exact:true})).toBeVisible();
 await page.getByLabel('관리자 비밀번호').fill('browser-test-only-password');await page.getByRole('button',{name:'로그인',exact:true}).click();await expect(page.getByRole('heading',{name:'대시보드',exact:true})).toBeVisible({timeout:15000});
 const initialHistory=AdminStateSchema.parse(await (await context.request.get('/api/admin/state')).json()).history.length;
 expect(scripts.some(s=>s.includes('googletagmanager')||s.includes('adsbygoogle'))).toBe(false);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('admin-dashboard.png'),fullPage:true});
 await page.getByRole('navigation',{name:'관리자 메뉴'}).getByRole('button',{name:'코스 관리'}).click();await page.getByRole('button',{name:'+ 새 코스',exact:true}).click();
 for(const [locale,title]of [['en','Owner made Busan course'],['ko','운영자 부산 코스'],['ja','釜山の新しいコース'],['zh-CN','釜山新路线'],['zh-TW','釜山新路線']]){
  if(!locale||!title)throw Error('Missing locale');const field=page.locator('fieldset').filter({has:page.locator('legend').filter({hasText:'코스 제목'})});await field.getByRole('button',{name:locale,exact:true}).click();await field.locator('textarea').fill(title);
 }
 await page.locator('.admin-place-results button').nth(0).click();await page.locator('.admin-place-results button').nth(1).click();await expect(page.locator('.admin-stops li')).toHaveCount(2);
 await page.getByRole('button',{name:'초안 저장',exact:true}).click();await expect(page.getByRole('status')).toContainText('초안을 저장');await page.getByRole('button',{name:'검증',exact:true}).click();await expect(page.getByRole('status')).toContainText('게시 검증을 통과');await page.getByRole('button',{name:'게시하기',exact:true}).click();await expect(page.getByRole('status')).toContainText('게시했습니다');
 await page.getByRole('navigation',{name:'관리자 메뉴'}).getByRole('button',{name:'화면 배치'}).click();
 const title=page.locator('fieldset').filter({has:page.locator('legend').filter({hasText:'홈 추천 코스 제목'})});await title.locator('textarea').fill('A new Busan collection');await page.getByRole('button',{name:'검색 · 여행 준비 위로',exact:true}).click();
 await page.getByRole('button',{name:'초안 저장',exact:true}).click();await expect(page.getByRole('status')).toContainText('초안을 저장');await page.getByRole('button',{name:'게시하기',exact:true}).click();await expect(page.getByRole('status')).toContainText('게시했습니다');
 await page.screenshot({path:info.outputPath('admin-layout.png'),fullPage:true});
 const publicPage=await context.newPage();await publicPage.goto('/?locale=en');await expect(publicPage.getByRole('heading',{name:'A new Busan collection',exact:true})).toBeVisible();const search=await publicPage.locator('.home-secondary-search').boundingBox(),courses=await publicPage.getByTestId('home-courses').boundingBox();if(!search||!courses)throw Error('Missing sections');expect(search.y).toBeLessThan(courses.y);await publicPage.goto('/courses?locale=en');await expect(publicPage.getByText('Owner made Busan course',{exact:true})).toBeVisible();await publicPage.close();
 await page.getByRole('navigation',{name:'관리자 메뉴'}).getByRole('button',{name:'게시 이력 · 백업'}).click();await expect(page.locator('.admin-history-row')).toHaveCount(Math.min(20,initialHistory+2));
 // Reset only the temporary test server, preserving the owner's real storage.
 const session=z.object({csrf:z.string()}).parse(await (await context.request.get('/api/admin/session')).json());const current=AdminStateSchema.parse(await (await context.request.get('/api/admin/state')).json());let response=await context.request.put('/api/admin/draft',{headers:{origin:'http://127.0.0.1:4320','x-csrf-token':session.csrf},data:{revision:current.revision,document:EMPTY_ADMIN_DOCUMENT}});expect(response.ok()).toBe(true);const next=AdminStateSchema.parse(await response.json());response=await context.request.post('/api/admin/publish',{headers:{origin:'http://127.0.0.1:4320','x-csrf-token':session.csrf},data:{revision:next.revision}});expect(response.ok()).toBe(true);
 expect(errors).toEqual([]);
});

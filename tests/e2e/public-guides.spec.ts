import { expect, test } from './fixtures.js';
import { GuideListSchema } from '@trip-fit/domain';
test.beforeEach(async({context})=>{
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(['127.0.0.1','localhost'].includes(url.hostname)||url.protocol==='data:')return route.continue();
    if(route.request().resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#93baaa"/></svg>'});
    return route.abort();
  });
});
test('restaurant tab shows actual menu/hours and opens a directly addressable detail',async({page},testInfo)=>{
  await page.goto('/?locale=ko');await page.getByRole('link',{name:'맛집 찾기',exact:true}).click();
  await expect(page).toHaveURL(/\/food\?locale=ko/);await expect(page.getByRole('heading',{level:1,name:'맛집 찾기'})).toBeVisible();
  await expect(page.getByTestId('public-guide-card')).toHaveCount(12);
  const first=page.getByTestId('public-guide-card').first();await expect(first).toContainText('만드리곤드레밥');await expect(first).toContainText('10:00-20:00');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('food-list.png'),fullPage:false,animations:'disabled'});
  await first.getByRole('link').click();await expect(page).toHaveURL(/\/food\/70/);
  await expect(page.getByRole('heading',{level:1,name:'만드리곤드레밥'})).toBeVisible();
  await expect(page.locator('.public-guide-facts')).toContainText('돌솥곤드레정식');await expect(page.locator('.public-guide-facts')).toContainText('051-941-3669');
  await page.reload();await expect(page.getByRole('heading',{level:1,name:'만드리곤드레밥'})).toBeVisible();
  await page.goBack();await expect(page.getByRole('heading',{level:1,name:'맛집 찾기'})).toBeVisible();
});
test('restaurant name/menu searches, district, page and history persist',async({page})=>{
  await page.goto('/food?locale=ko');await expect(page.getByTestId('public-guide-card')).toHaveCount(12);
  await page.getByRole('button',{name:'다음 →',exact:true}).click();await expect(page).toHaveURL(/page=2/);await page.reload();await expect(page.locator('.pagination')).toContainText('2 /');
  await page.getByRole('searchbox').fill('돌솥곤드레정식');await page.locator('.public-guide-search').getByRole('button').click();
  await expect(page.getByTestId('public-guide-card').first()).toContainText('만드리곤드레밥');await expect(page.getByRole('status')).toContainText('검색 결과');
  await page.reload();await expect(page.getByRole('searchbox')).toHaveValue('돌솥곤드레정식');
  await page.getByTestId('public-guide-card').first().getByRole('link').click();await page.goBack();await expect(page.getByRole('searchbox')).toHaveValue('돌솥곤드레정식');
  await page.getByRole('button',{name:'검색 초기화',exact:true}).click();await page.locator('.public-guide-filters select').first().selectOption('강서구');await expect(page).toHaveURL(/district=/);await expect(page.getByTestId('public-guide-card').first()).toContainText('강서구');
  await page.getByRole('searchbox').fill('NO_MATCH_123456789');await page.locator('.public-guide-search').getByRole('button').click();await expect(page.getByText('검색 결과가 없습니다.',{exact:true})).toBeVisible();
});
test('themed travel has separate filters, detailed public story and explicit unknown hours',async({page},testInfo)=>{
  await page.goto('/recommended?locale=ko');await expect(page.getByRole('heading',{level:1,name:'추천여행'})).toBeVisible();await expect(page.getByTestId('public-guide-card')).toHaveCount(12);
  await page.getByLabel('테마',{exact:true}).selectOption({label:'도보여행'});await expect(page).toHaveURL(/category=/);
  await page.getByTestId('public-guide-card').first().getByRole('link').click();await expect(page).toHaveURL(/\/courses\/inspiration\/58/);
  await expect(page.getByRole('heading',{level:1})).toContainText('초량이바구길');await expect(page.locator('.public-guide-facts')).toContainText('찾아가는 방법');
  await expect(page.locator('.public-guide-facts')).toContainText('공공 정보에 등록되지 않았습니다.');expect(await page.locator('.public-guide-story script').count()).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('recommended-detail.png'),fullPage:false,animations:'disabled'});
});
test('both tabs use the five actual API languages and retain them on reload',async({page})=>{
  for(const kind of ['food','recommended']){
    await page.goto('/'+kind+'?locale=en');await expect(page.getByTestId('public-guide-card')).toHaveCount(12);
    for(const locale of ['ja','zh-CN','zh-TW','ko','en']){
      await page.locator('.language-select select').selectOption(locale);
      await expect(page.locator('html')).toHaveAttribute('lang',locale);await expect(page).toHaveURL(new RegExp('locale='+locale));
      await expect(page.locator('.public-guide-grid')).toHaveAttribute('aria-busy','false');await expect(page.getByTestId('public-guide-card').first().locator('.public-guide-card-body')).toHaveAttribute('lang',locale);
    }
    await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page.getByTestId('public-guide-card')).toHaveCount(12);
  }
});
test('failed searches retain inputs/results, retry recovers and absent details are explicit',async({page})=>{
  await page.goto('/food?locale=ko');await expect(page.getByTestId('public-guide-card')).toHaveCount(12);
  await page.route('**/api/guides/food?**',route=>route.fulfill({status:503,body:'{}'}));
  await page.getByRole('searchbox').fill('만드리');await page.locator('.public-guide-search').getByRole('button').click();
  await expect(page.getByRole('alert')).toContainText('마지막 성공 목록');await expect(page.getByRole('searchbox')).toHaveValue('만드리');await expect(page.getByTestId('public-guide-card')).toHaveCount(12);await expect(page.getByRole('status')).toContainText('이전 검색 결과');
  await page.unroute('**/api/guides/food?**');await page.getByRole('button',{name:'다시 불러오기',exact:true}).click();await expect(page.getByTestId('public-guide-card')).toHaveCount(1);
  await page.goto('/recommended/999999999999?locale=ko');await expect(page.getByRole('heading',{level:1,name:'요청한 정보를 찾을 수 없습니다.'})).toBeVisible();
});
test('late responses do not replace the current language and images fail honestly',async({page,request})=>{
  const data=GuideListSchema.parse(await (await request.get('/api/guides/food?locale=ko')).json());
  await page.route('**/api/guides/food?**',async route=>{
    if(new URL(route.request().url()).searchParams.get('locale')==='ko'){await new Promise(resolve=>setTimeout(resolve,300));await route.fulfill({json:data});}else await route.continue();
  });
  await page.route('https://www.visitbusan.net/**',route=>route.abort());
  await page.goto('/food?locale=ko');await page.locator('.language-select select').selectOption('en');
  await expect(page.getByTestId('public-guide-card').first().locator('.public-guide-card-body')).toHaveAttribute('lang','en');
  await page.waitForTimeout(400);await expect(page.getByTestId('public-guide-card').first().locator('.public-guide-card-body')).toHaveAttribute('lang','en');await expect(page.getByText('Official photo unavailable.').first()).toBeVisible();
});

import { DestinationDetailSchema } from '@trip-fit/domain';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (['127.0.0.1','localhost'].includes(url.hostname) || url.protocol === 'data:') return route.continue();
    if (route.request().resourceType() === 'image') return route.fulfill({ contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#8dc6d8"/></svg>' });
    return route.fulfill({ contentType:'text/html',body:'<title>External booking test</title>' });
  });
});

test('separate search includes monthly guides and the complete destination booking flow', async ({page,context},testInfo) => {
  await page.goto('/search?locale=ko');
  await expect(page.getByRole('heading',{level:1,name:'관광지 검색'})).toBeVisible();
  const banner = page.getByTestId('monthly-destinations');
  await expect(banner.getByRole('link').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('search-destinations.png'),fullPage:false,animations:'disabled'});
  await banner.locator('a[href^="/places/gamcheon"]').click();
  await expect(page).toHaveURL(/\/places\/gamcheon/);
  await expect(page.getByRole('heading',{level:1,name:'감천문화마을'})).toBeVisible();
  await expect(page.getByText('부산광역시 사하구 감내2로 203',{exact:true})).toBeVisible();
  await expect(page.getByText('휴무 안내',{exact:true})).toBeVisible();
  expect(await page.getByTestId('related-tour').getByTestId('offer-card').count()).toBeGreaterThan(3);
  await expect(page.getByTestId('related-ticket').getByTestId('offer-card')).toHaveCount(0);
  await expect(page.getByTestId('related-stay').getByText('남포동 · Nampo-dong',{exact:true})).toBeVisible();
  await expect(page.getByText(/도보권을 의미하지 않습니다/)).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('gamcheon-guide.png'),fullPage:false,animations:'disabled'});
  await page.getByTestId('related-tour').getByRole('button',{name:'상품 보기',exact:true}).first().click();
  const link = page.getByRole('dialog').getByRole('link',{name:'예약 사이트로 이동'});
  await expect(link).toHaveAttribute('rel','sponsored noopener noreferrer');
  const popupPromise = context.waitForEvent('page');
  await link.click(); const popup = await popupPromise;
  await expect(popup).toHaveTitle('External booking test');
  await popup.close();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('search filters survive refresh, and back/forward restores the query', async ({page}) => {
  await page.goto('/search?q=감천&category=tour&locale=ko');
  await expect(page.getByRole('searchbox')).toHaveValue('감천');
  await expect(page.locator('.offer-grid').last()).toHaveAttribute('aria-busy','false');
  expect((await page.getByTestId('offer-card').allTextContents()).every(text => text.includes('감천'))).toBe(true);
  await page.reload();
  await expect(page.getByRole('group').getByRole('button',{name:/하루 투어/})).toHaveAttribute('aria-pressed','true');
  await page.getByTestId('monthly-destinations').locator('a[href^="/places/gamcheon"]').click();
  await expect(page.getByRole('heading',{level:1,name:'감천문화마을'})).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('searchbox')).toHaveValue('감천');
  await expect(page.getByRole('group').getByRole('button',{name:/하루 투어/})).toHaveAttribute('aria-pressed','true');
  await page.goForward();
  await expect(page.getByRole('heading',{level:1,name:'감천문화마을'})).toBeVisible();
});

test('deep linked destination switches five languages and retains language on reload', async ({page}) => {
  await page.goto('/places/gamcheon?locale=en');
  await expect(page.getByRole('heading',{level:1,name:'Gamcheon Culture Village'})).toBeVisible();
  for (const [locale,name] of [['ja','甘川文化村'],['zh-CN','甘川文化村'],['zh-TW','甘川文化村'],['ko','감천문화마을'],['en','Gamcheon Culture Village']]) {
    if (!locale || !name) throw Error('Missing locale test value');
    await page.getByRole('combobox').first().selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    await expect(page.getByRole('heading',{level:1,name})).toBeVisible();
    await expect(page).toHaveURL(new RegExp('locale='+locale));
  }
  await page.reload();
  await expect(page.getByRole('heading',{level:1,name:'Gamcheon Culture Village'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('destination failure retries, missing pages and empty related groups are explicit', async ({page}) => {
  await page.route('**/api/destinations/gamcheon?**',route => route.fulfill({status:503,body:'{}'}));
  await page.goto('/places/gamcheon?locale=ko');
  await expect(page.getByRole('alert')).toContainText('명소 정보를 불러오지 못했습니다.');
  await page.unroute('**/api/destinations/gamcheon?**');
  await page.getByRole('button',{name:'다시 불러오기',exact:true}).click();
  await expect(page.getByRole('heading',{level:1,name:'감천문화마을'})).toBeVisible();
  await page.goto('/places/missing-place?locale=ko');
  await expect(page.getByRole('heading',{level:1,name:'명소를 찾을 수 없습니다.'})).toBeVisible();
  await page.goto('/places/gwangalli?locale=ko');
  await expect(page.getByTestId('related-stay').getByText('검수된 관련 상품을 준비하고 있습니다.')).toBeVisible();
  await expect(page.getByTestId('related-stay').getByTestId('offer-card')).toHaveCount(0);
});

test('all imported tourism records are searchable, paginated and filterable by linked offers', async ({page}) => {
  await page.goto('/search?locale=ko');
  const results=page.getByTestId('destination-results');
  await expect(results.getByTestId('destination-result')).toHaveCount(6);
  await expect(results.getByRole('status')).toContainText('전체 220개');
  const first=await results.getByTestId('destination-result').first().locator('h3').innerText();
  await results.getByRole('button',{name:'다음 관광정보',exact:true}).click();
  await expect(results.locator('.destination-results-grid')).toHaveAttribute('aria-busy','false');
  expect(await results.getByTestId('destination-result').first().locator('h3').innerText()).not.toBe(first);
  await results.getByRole('checkbox').check();
  await expect(results.locator('.destination-results-grid')).toHaveAttribute('aria-busy','false');
  await expect(results.getByRole('status')).toContainText('13개 관광정보');
  await results.getByRole('checkbox').uncheck();
  await page.getByRole('searchbox').fill('범어사');
  await page.getByRole('button',{name:'검색',exact:true}).click();
  // Full source-text search also finds four nearby attractions mentioning the temple.
  await expect(results.getByTestId('destination-result')).toHaveCount(5);
  await results.getByRole('link').filter({has:page.getByRole('heading',{name:'범어사',exact:true})}).click();
  await expect(page.getByRole('heading',{level:1,name:'범어사',exact:true})).toBeVisible();
  await expect(page.getByText('부산광역시 금정구 범어사로 250',{exact:true})).toBeVisible();
  await expect(page.getByTestId('related-experience').getByTestId('offer-card')).toHaveCount(0);
  await expect(page.locator('.source-status')).toBeVisible();
  await expect(page.locator('.destination-page > .destination-photo img')).toHaveAttribute('src',/^https:/);
});

test('place aliases find related affiliate stays and a missing source language is explicitly machine translated', async ({page}) => {
  await page.goto('/search?q=Gamcheon&category=stay&locale=ko');
  await expect(page.getByTestId('offer-card')).toHaveCount(1);
  await expect(page.getByTestId('offer-card').locator('h3')).toContainText('아벤트리');
  await expect(page.getByTestId('destination-results').getByText('감천문화마을',{exact:true})).toBeVisible();
  await page.goto('/places/busan-783?locale=ko');
  await expect(page.locator('.destination-facts .translated-note')).toContainText('자동 번역');
  await expect(page.locator('.destination-facts dd[lang="ko"]').first()).toBeVisible();
  const localized=DestinationDetailSchema.parse(await(await page.request.get('/api/destinations/busan-783?locale=ko')).json());
  expect(localized.destination).toMatchObject({locale:'ko',translationFallback:false,contentTranslation:'machine'});
  await expect(page.getByTestId('related-stay').getByTestId('offer-card')).toHaveCount(0);
});

test('failed tourism search retains previous records and recovers on retry', async ({page}) => {
  await page.goto('/search?locale=ko');
  const results=page.getByTestId('destination-results');
  await expect(results.getByTestId('destination-result')).toHaveCount(6);
  await page.route('**/api/destinations?**',async route=>{
    if(new URL(route.request().url()).searchParams.get('q')==='범어사')return route.fulfill({status:503,body:'{}'});
    return route.continue();
  });
  await page.getByRole('searchbox').fill('범어사');
  await page.getByRole('button',{name:'검색',exact:true}).click();
  await expect(results.getByRole('alert')).toBeVisible();
  await expect(results.getByTestId('destination-result')).toHaveCount(6);
  await expect(results.getByRole('status')).toHaveText('이전 조회 관광정보');
  await expect(page.getByRole('searchbox')).toHaveValue('범어사');
  await page.unroute('**/api/destinations?**');
  await results.getByRole('button',{name:'다시 불러오기',exact:true}).click();
  await expect(results.getByRole('alert')).toHaveCount(0);
  await expect(results.getByTestId('destination-result')).toHaveCount(5);
  await expect(results.getByRole('heading',{name:'범어사',exact:true})).toBeVisible();
});

test('product titles follow the language selector, with original titles available in details',async({page})=>{
  await page.goto('/search?locale=ko');
  const first=page.getByTestId('offer-card').first();
  await expect(first.locator('h3')).toContainText('부산');
  const original=await first.locator('h3').innerText();
  for(const [locale,fragment]of [['en','Busan'],['ja','釜山'],['zh-CN','釜山'],['zh-TW','釜山']]){
    if(!locale||!fragment)throw Error('missing locale');
    await page.getByRole('combobox').first().selectOption(locale);
    await expect(first.locator('h3')).toContainText(fragment);
    await expect(first.locator('h3')).not.toHaveText(original);
    await expect(first.locator('.translated-note')).toBeVisible();
  }
  await page.getByRole('combobox').first().selectOption('en');
  await expect(first.locator('h3')).toContainText('Busan');
  await first.locator('h3 button').click();
  const dialog=page.getByRole('dialog');
  await dialog.locator('.original-title summary').click();
  await expect(dialog.locator('.original-title p[lang="ko"]')).toHaveText(original);
  await page.keyboard.press('Escape');
  await page.getByRole('combobox').first().selectOption('ko');
  await expect(first.locator('h3')).toHaveText(original);
  await expect(first.locator('.translated-note')).toHaveCount(0);
});

test('tourism details include visit information and exact seller photographs with attribution',async({page})=>{
  await page.goto('/places/gamcheon?locale=en');
  await expect(page.getByRole('heading',{level:1,name:'Gamcheon Culture Village'})).toBeVisible();
  await expect(page.locator('.visit-info')).toContainText('Opening hours');
  await expect(page.locator('.visit-info')).toContainText('Getting there');
  const cards=page.getByTestId('offer-card');
  await expect(cards).toHaveCount(17);
  const urls=await cards.locator('img').evaluateAll(images=>images.map(image=>image.getAttribute('src')));
  const input:unknown=await(await page.request.get('/api/destinations/gamcheon?locale=en')).json();
  const detail=DestinationDetailSchema.parse(input);
  const rendered=await cards.evaluateAll(nodes=>nodes.map(node=>({id:node.getAttribute('data-offer-id'),src:node.querySelector('img')?.getAttribute('src')})));
  expect(rendered.sort((a,b)=>(a.id??'').localeCompare(b.id??''))).toEqual(detail.related.map(link=>({id:link.offer.id,src:link.offer.image.url})).sort((a,b)=>a.id.localeCompare(b.id)));
  await expect(cards.locator('.image-label')).toHaveCount(0);
  expect(urls.every(url=>url&&!url.startsWith('/review-assets/'))).toBe(true);
  await expect(cards.first().locator('h3')).not.toContainText('부산');
  const credit=cards.filter({has:page.locator('.photo-credit a')}).first().locator('.photo-credit');
  await credit.locator('summary').click();
  await expect(credit.getByRole('link',{name:'Photo source'})).toHaveAttribute('href',/^https:/);
  await expect(credit.getByRole('link',{name:'Photo source'})).toHaveAttribute('rel','sponsored noopener noreferrer');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('failed product images show a neutral placeholder instead of an unrelated beach',async({page})=>{
  await page.route('**/*',async route=>{
    if(route.request().resourceType()==='image')return route.abort();
    return route.fallback();
  });
  await page.goto('/search?locale=ko');
  const first=page.getByTestId('offer-card').first();
  await expect(first.locator('.offer-photo-placeholder')).toBeVisible();
  await expect(first.locator('img')).toHaveCount(0);
  await expect(first.locator('.offer-photo-placeholder')).toContainText('사진을 불러오지 못했습니다');
});

test('full tourism story expands and raw facility information stays separate from product prices',async({page})=>{
  await page.goto('/places/busan-402?locale=ko');
  await expect(page.locator('.visit-info')).toContainText('운영시간');
  await expect(page.locator('.visit-info')).toContainText('051-508-3122');
  await expect(page.locator('.visit-info')).toContainText('무료');
  const story=page.locator('.place-story');
  await expect(story.locator('.destination-description')).not.toBeVisible();
  await story.locator('summary').click();
  await expect(story.locator('.destination-description')).toBeVisible();
  expect((await story.locator('.destination-description').innerText()).length).toBeGreaterThan(600);
  await expect(page.getByText('시설 안내 원문입니다. 아래 제휴 상품의 판매가와 다를 수 있습니다.',{exact:true})).toBeVisible();
});

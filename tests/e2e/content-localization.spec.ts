import { test,expect } from '@playwright/test';
import { OffersResponseSchema } from '@trip-fit/domain';
test.beforeEach(async({context})=>{await context.route('**/*',route=>{const url=new URL(route.request().url());if(['127.0.0.1','localhost'].includes(url.hostname)||url.protocol==='data:')return route.continue();return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#bad3dc"/></svg>'});});});
test('foreign products, attraction gaps and restaurant gaps show the requested language',async({page},testInfo)=>{
 for(const locale of ['en','ja','zh-CN','zh-TW']){
  await page.goto('/?locale='+locale);const first=page.getByTestId('offer-card').first();await expect(first).toBeVisible();expect(await first.innerText()).not.toMatch(/[가-힣]/);await first.locator('.text-action').click();await expect(page.getByRole('dialog').locator('h2')).not.toContainText(/[가-힣]/);await page.getByRole('dialog').locator('.close-dialog').click();
  await page.goto('/places/busan-2753?locale='+locale);await expect(page.locator('h1')).toBeVisible();expect(await page.locator('.destination-page').innerText()).not.toMatch(/[가-힣]/);
  await page.goto('/food/1065?locale='+locale);await expect(page.locator('h1')).toBeVisible();await expect(page.locator('h1')).toHaveAttribute('lang',locale);expect(await page.locator('h1').innerText()).not.toMatch(/[가-힣]/);expect(await page.locator('.public-guide-facts').innerText()).not.toMatch(/[가-힣]/);await expect(page.locator('.public-guide-detail-heading .translated-note')).toBeVisible();
 }
 await page.goto('/food/2381?locale=zh-TW');await expect(page.locator('h1')).toHaveText('Gogihyeong');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('localized-food.png'),fullPage:true});
});
test('a stale localized product DTO resolves its dialog in the requested language',async({page})=>{
 await page.route('**/api/offers?*',async route=>{const url=new URL(route.request().url());if(url.searchParams.get('locale')!=='en')return route.continue();const response=await route.fetch();const list=OffersResponseSchema.parse(await response.json());await route.fulfill({json:{...list,items:list.items.map(item=>({...item,title:item.originalTitle,titleLocale:item.originalTitleLocale,localizationStatus:'fallback'}))}});});
 await page.goto('/?locale=en');const first=page.getByTestId('offer-card').first();await expect(first).toBeVisible();await expect(page.locator('.offer-grid')).toHaveAttribute('aria-busy','false');await first.locator('.text-action').click();await expect(page.getByRole('dialog').locator('h2')).toBeVisible();await expect(page.getByRole('dialog').locator('h2')).not.toContainText(/[가-힣]/);
});

import { test, expect } from '@playwright/test';
import { loadGuideSnapshot } from '../../apps/server/src/config/guides.js';
import { loadFoodVisibility } from '../../apps/server/src/config/food-visibility.js';
import { loadFoodPhotoOverrides } from '../../apps/server/src/config/food-photos.js';
const snapshot=loadGuideSnapshot('food');if(!snapshot)throw new Error('Missing food source');
const photos=loadFoodPhotoOverrides(snapshot,loadFoodVisibility(snapshot));
test.beforeEach(async({context})=>{await context.route('**/*',route=>{const url=new URL(route.request().url());if(['127.0.0.1','localhost'].includes(url.hostname)||url.protocol==='data:')return route.continue();if(route.request().resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#bad3dc"/></svg>'});return route.abort();});});
test('renders reviewed photos in list and detail in five languages, retaining honest missing-photo and failure states',async({page})=>{
  for(const locale of ['ko','en','ja','zh-CN','zh-TW']){
    await page.goto('/food?q='+encodeURIComponent('초필살돼지구이')+'&locale='+locale);
    const card=page.getByTestId('public-guide-card').filter({has:page.locator('a[href="/food/1548?locale='+locale+'"]')});
    await expect(card.locator('img')).toHaveAttribute('src',photos.get('1548')??'');
    for(const id of ['1548','1580','1625','1639','1612']){
      await page.goto('/food/'+id+'?locale='+locale);
      await expect(page.locator('.public-guide-detail > .public-guide-photo img')).toHaveAttribute('src',photos.get(id)??'');
    }
    await page.reload();await expect(page.locator('.public-guide-detail > .public-guide-photo img')).toBeVisible();
  }
  await page.goto('/food/1591?locale=en');await expect(page.locator('.public-guide-placeholder')).toBeVisible();
  await page.route(photos.get('1612')??'',route=>route.abort());await page.goto('/food/1612?locale=en');
  await expect(page.locator('.public-guide-placeholder')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

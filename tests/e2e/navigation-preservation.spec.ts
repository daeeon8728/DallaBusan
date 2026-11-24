import { test, expect } from './fixtures.js';

test.beforeEach(async({context})=>{
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(['localhost','127.0.0.1'].includes(url.hostname)||url.protocol==='data:')return route.continue();
    if(route.request().resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#8dc6d8"/></svg>'});
    return route.fulfill({contentType:'text/html',body:'External source mock'});
  });
});

test('adding courses preserves all six visible navigation entries and both public information pages in five languages',async({page},info)=>{
  for(const locale of ['en','ko','ja','zh-CN','zh-TW']){
    await page.goto('/search?locale='+locale);
    const nav=page.locator('.header-nav');
    expect(await nav.locator('a').evaluateAll(nodes=>nodes.map(node=>new URL(node.getAttribute('href')??'',window.location.origin).pathname))).toEqual(['/','/search','/courses','/food','/recommended','/saved']);
    for(const path of ['/search','/courses','/food','/recommended']){
      const link=nav.locator('a[href^="'+path+'?"]'); await expect(link).toBeVisible(); await expect(link).toBeInViewport();
    }
    await expect(page.getByTestId('destination-result')).toHaveCount(6);
    await expect(page.getByTestId('monthly-destinations').locator('a')).toHaveCount(2);
    await page.getByTestId('recommended-nav').click();
    await expect(page).toHaveURL(new RegExp('/recommended\\?locale='+locale));
    await expect(page.getByTestId('recommended-nav')).toHaveAttribute('aria-current','page');
    await expect(page.getByTestId('courses-nav')).not.toHaveAttribute('aria-current','page');
    await expect(page.getByTestId('public-guide-card')).toHaveCount(12);
    await page.reload(); await expect(page.getByTestId('public-guide-card')).toHaveCount(12);
    await page.getByTestId('courses-nav').click(); await expect(page.getByTestId('course-card')).toHaveCount(40);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.goto('/search?locale=en'); await expect(page.getByTestId('destination-result')).toHaveCount(6);
  await page.screenshot({path:info.outputPath('restored-attraction-search.png'),animations:'disabled'});
});

test('restored attraction banner still reaches place information and the independent inspiration detail keeps its original URL',async({page})=>{
  await page.goto('/search?locale=en');
  await page.getByTestId('monthly-destinations').locator('a[href^="/places/gamcheon"]').click();
  await expect(page).toHaveURL(/\/places\/gamcheon/); await expect(page.getByRole('heading',{level:1})).toHaveText('Gamcheon Culture Village');
  await expect(page.locator('.destination-facts')).toBeVisible(); await expect(page.locator('.related-offers')).toBeVisible();
  await page.getByTestId('recommended-nav').click(); await expect(page.getByTestId('public-guide-card')).toHaveCount(12);
  await page.getByTestId('public-guide-card').first().getByRole('link').click();
  await expect(page).toHaveURL(/\/recommended\/\d+/); await expect(page.locator('.public-guide-facts')).toBeVisible();
  await page.reload(); await expect(page.locator('.public-guide-facts')).toBeVisible();
  await page.goBack(); await expect(page).toHaveURL(/\/recommended\?locale=en/); await expect(page.getByTestId('public-guide-card')).toHaveCount(12);
});

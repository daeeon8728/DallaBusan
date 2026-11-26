import { test, expect } from '@playwright/test';
import { CoursesResponseSchema } from '@trip-fit/domain';

test.beforeEach(async ({ context,page }) => {
  await page.route('https://www.googletagmanager.com/**',route=>route.fulfill({contentType:'application/javascript',body:'/* Analytics mock. */'}));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['127.0.0.1','localhost'].includes(url.hostname) || url.protocol === 'data:') return route.continue();
    if (route.request().resourceType() === 'image') return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#8dc6d8"/></svg>'});
    return route.fulfill({status:200,body:'External source mock'});
  });
});

test('first English visit uses corrected collage and two working buttons; Close persists only this tab', async ({page,context},testInfo) => {
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const dialog = page.getByTestId('course-popup');
  await expect(dialog).toBeVisible(); await expect(dialog.locator('footer button')).toHaveCount(2);
  await expect(dialog.locator('img')).toHaveAttribute('src','/campaigns/course-popup-v2.png');
  await expect(dialog.getByRole('button',{name:'Close',exact:true})).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('recommendation-popup.png'),animations:'disabled'});
  await dialog.getByRole('button',{name:'Close',exact:true}).click();
  await expect(dialog).not.toBeVisible(); await page.reload(); await expect(page.getByTestId('offer-card').first()).toBeVisible();
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('dallabusan:recommendation-day:v1'))).toBeNull();
  const fresh = await context.newPage(); await fresh.goto('/'); await expect(fresh.getByTestId('course-popup')).toBeVisible();
  await fresh.close(); expect(errors).toEqual([]);
});

test('daily suppression survives another tab/reload and expires at the next local day', async ({page,context}) => {
  const now = new Date(2026,10,24,23,58);
  await page.clock.setFixedTime(now); await page.goto('/');
  await page.getByTestId('course-popup').getByRole('button',{name:'Don’t show today'}).click();
  await page.reload(); await expect(page.getByTestId('offer-card').first()).toBeVisible(); await expect(page.getByTestId('course-popup')).not.toBeVisible();
  const other = await context.newPage(); await other.clock.setFixedTime(now); await other.goto('/');
  await expect(other.getByTestId('offer-card').first()).toBeVisible(); await expect(other.getByTestId('course-popup')).not.toBeVisible(); await other.close();
  await page.clock.setFixedTime(new Date(2026,10,25,0,1)); await page.reload(); await expect(page.getByTestId('course-popup')).toBeVisible();
});

test('blocked daily storage reports failure and Escape/keyboard close remain usable', async ({page}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key:string,value:string) {
      if(key==='dallabusan:recommendation-day:v1')throw new DOMException('Denied','SecurityError');
      original.call(this,key,value);
    };
  });
  await page.goto('/'); const popup=page.getByTestId('course-popup'); await expect(popup).toBeVisible();
  await popup.getByRole('button',{name:'Don’t show today'}).click(); await expect(popup).not.toBeVisible();
  await expect(page.locator('.popup-storage-notice')).toContainText('Could not save');
  await page.reload(); await expect(page.getByTestId('offer-card').first()).toBeVisible(); await expect(popup).not.toBeVisible();
  await page.evaluate(()=>sessionStorage.clear()); await page.reload(); await expect(popup).toBeVisible();
  await page.keyboard.press('Escape'); await expect(popup).not.toBeVisible(); expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
});

test('all original categories contain original and added ideas, support URL refresh/back and source detail links', async ({page,request},testInfo) => {
  await page.goto('/courses?locale=en'); await expect(page.getByTestId('course-card')).toHaveCount(150);
  const nav=page.locator('.header-nav'); const links=await nav.locator('a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')?.split('?')[0]));
  expect(links.indexOf('/courses')).toBe(links.indexOf('/search')+1); expect(links.indexOf('/food')).toBe(links.indexOf('/courses')+1);
  for(const [category,count] of [['family',42],['date',44],['food',23],['dallabusan',21]] as const) {
    await page.locator('.course-categories a[href*="category='+category+'"]').click();
    await expect(page.getByTestId('course-card')).toHaveCount(count); await expect(page).toHaveURL(new RegExp('category='+category));
    await page.reload(); await expect(page.getByTestId('course-card')).toHaveCount(count);
  }
  await page.goBack(); await expect(page).toHaveURL(/category=food/); await expect(page.getByTestId('course-card')).toHaveCount(23);
  await page.goto('/courses/fa04?locale=en'); await expect(page.locator('.course-stops>li')).toHaveCount(4);
  await expect(page.locator('.course-warning').filter({hasText:'not validated'})).toHaveCount(1);
  await page.locator('.course-stops a[href^="/food/2899"]').filter({hasText:/^Place details ↗$/}).click(); await expect(page).toHaveURL(/\/food\/2899/); await expect(page.locator('.public-guide-facts')).toBeVisible();
  await page.goBack(); await expect(page).toHaveURL(/\/courses\/fa04/);
  for(const locale of ['ja','zh-CN','zh-TW','ko','en']) {
    await page.locator('.language-select select').selectOption(locale);
    const r=await request.get('/api/courses?locale='+locale), input:unknown=await r.json(), data=CoursesResponseSchema.parse(input);
    await expect(page.getByRole('heading',{level:1})).toHaveText(data.items.find(x=>x.id==='fa04')?.title??'missing');
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
  }
  await page.goto('/courses?category=family&locale=en'); await expect(page.getByTestId('course-card')).toHaveCount(42);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('courses-family.png'),animations:'disabled'});
});

test('popup opens courses while the original destination and inspiration pages remain independent', async ({page}) => {
  await page.goto('/'); await expect(page.getByTestId('course-popup')).toBeVisible();
  await expect(page.getByTestId('monthly-destinations').locator('a')).toHaveCount(2);
  await page.getByTestId('course-popup').getByRole('link',{name:/Family/}).click();
  await expect(page).toHaveURL(/\/courses\?category=family/); await expect(page.getByTestId('course-card')).toHaveCount(42);
  await expect(page.getByTestId('monthly-destinations')).toHaveCount(0);
  await page.getByTestId('recommended-nav').click(); await expect(page).toHaveURL(/\/recommended\?locale=en/);
  await expect(page.getByTestId('public-guide-card')).toHaveCount(12);
  await page.getByTestId('public-guide-card').first().getByRole('link').click(); await expect(page).toHaveURL(/\/recommended\/\d+/);
  await page.goto('/courses/inspiration/58?locale=ja'); await expect(page).toHaveURL(/\/recommended\/58\?locale=ja/);
  await page.goto('/search?locale=en'); await expect(page.getByTestId('destination-results')).toBeVisible();
  await expect(page.getByTestId('monthly-destinations').locator('a')).toHaveCount(2);
});

test('family parking is informational and course failure retries without fabricating content', async ({page}) => {
  await page.goto('/courses/fa01?locale=en');
  await expect(page.locator('.course-warning')).toHaveCount(2);
  await page.getByTestId('nearby-parking').first().locator('summary').click(); await expect(page.locator('.parking-notice')).toBeVisible();
  await page.route('**/api/courses?*',route=>route.fulfill({status:503,json:{error:'Unavailable'}}));
  await page.goto('/courses?locale=en'); await expect(page.locator('.courses-page [role="alert"]')).toContainText('could not be loaded');
  await expect(page.getByTestId('course-card')).toHaveCount(0); await page.unroute('**/api/courses?*');
  await page.locator('.courses-page').getByRole('button',{name:'Try again'}).click(); await expect(page.getByTestId('course-card')).toHaveCount(150);
  await page.goto('/courses/fa99?locale=en'); await expect(page.getByRole('heading',{level:1})).toHaveText('This course idea is unavailable.');
});

test('Google ownership file is served verbatim as a public asset', async ({request}) => {
  const response=await request.get('/googlebf1f839e8f4debc5.html'); expect(response.status()).toBe(200);
  expect((await response.text()).trim()).toBe('google-site-verification: googlebf1f839e8f4debc5.html');
});

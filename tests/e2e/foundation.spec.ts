import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page, context }) => {
  // Product image requests and affiliate navigations never hit real providers in CI.
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.protocol === 'data:') return route.continue();
    if (route.request().resourceType() === 'image') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#8dc6d8"/></svg>' });
    return route.fulfill({ contentType: 'text/html', body: '<title>External booking test</title><p>External booking test</p>' });
  });
  await page.goto('/');
  await expect(page.getByTestId('offer-card').first()).toBeVisible();
});

test('built catalog renders responsively and switches all five languages', async ({ page, request }, testInfo) => {
  expect((await request.get('/api/health')).status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('부산');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByTestId('offer-card')).toHaveCount(24);
  await expect(page.getByRole('button', { name: /일정 만들기/ })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('catalog-home.png'), fullPage: false, animations: 'disabled' });
  for (const locale of ['en', 'ja', 'zh-CN', 'zh-TW', 'ko']) {
    await page.getByRole('combobox', { name: /언어|Language|言語|语言|語言/ }).selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByTestId('offer-card').first()).toBeVisible();
  }
  const invalid = await request.get('/api/offers?locale=invalid');
  expect(invalid.status()).toBe(400);
});

test('search, provider filter, empty state and reset work', async ({ page, request }) => {
  await page.getByRole('searchbox').fill('아쿠아리움');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await expect(page.locator('.offer-grid')).toHaveAttribute('aria-busy', 'false');
  const cards = page.getByTestId('offer-card');
  await expect(cards.first()).toBeVisible();
  expect((await cards.allTextContents()).every(text => text.includes('아쿠아리움'))).toBe(true);
  const json: { providers: Array<{ id: string; displayName: string }> } = await (await request.get('/api/offers')).json();
  const provider = json.providers[0]; if (!provider) throw new Error('Test catalog is missing a provider');
  await page.getByRole('combobox', { name: '예약 사이트' }).selectOption(provider.id);
  await expect(page.locator('.offer-grid')).toHaveAttribute('aria-busy', 'false');
  expect((await cards.locator('.provider-name').allTextContents()).every(name => name === provider.displayName)).toBe(true);
  await page.getByRole('searchbox').fill('no-such-test-product');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await expect(page.getByText('조건에 맞는 상품이 없어요.')).toBeVisible();
  await page.getByRole('button', { name: /^필터 초기화/ }).first().click();
  await expect(cards).toHaveCount(24);
  await expect(page.getByRole('searchbox')).toHaveValue('');
});

test('categories, pagination and identical searches do not get stuck', async ({ page }) => {
  await page.getByRole('group').getByRole('button', { name: /하루 투어/ }).click();
  await expect(page.locator('.offer-grid')).toHaveAttribute('aria-busy', 'false');
  expect((await page.locator('.card-meta').allTextContents()).every(text => text.includes('하루 투어'))).toBe(true);
  const first = await page.getByTestId('offer-card').first().locator('h3').innerText();
  await page.getByRole('button', { name: '다음 →' }).click();
  await expect(page.locator('.offer-grid')).toHaveAttribute('aria-busy', 'false');
  expect(await page.getByTestId('offer-card').first().locator('h3').innerText()).not.toBe(first);
  await page.getByRole('searchbox').fill('요트');
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: '검색', exact: true }).click();
    await expect(page.locator('.offer-grid')).toHaveAttribute('aria-busy', 'false');
  }
});

test('details support Escape and booking opens a mocked external tab', async ({ page, context }) => {
  const card = page.getByTestId('offer-card').first();
  const details = card.getByRole('button', { name: '상품 보기', exact: true });
  await details.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const booking = dialog.getByRole('link', { name: '예약 사이트로 이동' });
  await expect(booking).toHaveAttribute('rel', 'sponsored noopener noreferrer');
  await expect(booking).toHaveAttribute('target', '_blank');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(details).toBeFocused();
  await details.click();
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('dialog').getByRole('link', { name: '예약 사이트로 이동' }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveTitle('External booking test');
  await popup.close();
  await page.getByRole('button', { name: '닫기', exact: true }).click();
});

test('failed reload retains search and previous results, then retries', async ({ page }) => {
  const count = await page.getByTestId('offer-card').count();
  await page.route('**/api/offers?**', route => route.fulfill({ status: 503, body: '{}' }));
  await page.getByRole('searchbox').fill('요트');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('offer-card')).toHaveCount(count);
  await expect(page.getByRole('searchbox')).toHaveValue('요트');
  await page.unroute('**/api/offers?**');
  await page.getByRole('button', { name: '다시 불러오기', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('.offer-grid')).toHaveAttribute('aria-busy', 'false');
  expect((await page.getByTestId('offer-card').allTextContents()).every(text => text.includes('요트'))).toBe(true);
});

test('unknown prices remain explicit and old responses cannot replace a newer search', async ({ page, request }) => {
  const response = await request.get('/api/offers?category=stay&limit=48');
  const stays: { items: Array<{ id: string; referencePrice: unknown }> } = await response.json();
  const unknown = stays.items.find(offer => offer.referencePrice === null);
  if (!unknown) throw new Error('Test catalog needs an unknown-price hotel');
  await page.getByRole('group').getByRole('button', { name: /부산 숙소/ }).click();
  await expect(page.locator('.offer-grid')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByText('판매처에서 가격 확인').first()).toBeVisible();
  await page.getByRole('button', { name: /^필터 초기화/ }).first().click();
  await expect(page.locator('.offer-grid')).toHaveAttribute('aria-busy', 'false');
  const baseline = await (await request.get('/api/offers?category=stay')).json();
  await page.route('**/api/offers?**', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('q') === 'slow-test') {
      await new Promise(resolve => setTimeout(resolve, 350));
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(baseline) });
    }
    return route.continue();
  });
  await page.getByRole('searchbox').fill('slow-test');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await page.getByRole('searchbox').fill('아쿠아리움');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await expect(page.locator('.offer-grid')).toHaveAttribute('aria-busy', 'false');
  await expect.poll(async () => (await page.getByTestId('offer-card').allTextContents()).every(text => text.includes('아쿠아리움'))).toBe(true);
});

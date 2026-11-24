import { test as base } from '@playwright/test';
export { expect } from '@playwright/test';
// Catalog regressions exercise a returning tab. First-visit behavior has its own suite.
export const test = base.extend<{ returningVisitor: void }>({
  returningVisitor: [async ({ page }, use) => {
    await page.route('https://www.googletagmanager.com/**',route=>route.fulfill({contentType:'application/javascript',body:'/* Analytics disabled in catalog regression tests. */'}));
    await page.addInitScript(() => sessionStorage.setItem('dallabusan:recommendation-session:v1', 'closed'));
    await use();
  }, { auto: true }],
});

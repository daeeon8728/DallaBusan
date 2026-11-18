import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // Bound Chromium concurrency for reliable full-page capture on Windows.
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:4317', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:4317/api/health',
    env: { NODE_ENV: 'test', HOST: '127.0.0.1', PORT: '4317', DATABASE_PATH: ':memory:' },
    reuseExistingServer: false,
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 360, height: 800 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
  ],
});


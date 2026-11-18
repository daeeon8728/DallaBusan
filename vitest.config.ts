import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@trip-fit/domain': fileURLToPath(new URL('./packages/domain/src/index.ts', import.meta.url)) } },
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'] },
});

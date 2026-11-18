import { afterEach, describe, expect, it } from 'vitest';
import { HealthResponseSchema } from '@trip-fit/domain';
import { buildApp } from '../../apps/server/src/app.js';
import { loadServerConfig } from '../../apps/server/src/config/env.js';

describe('foundation API', () => {
  const apps: ReturnType<typeof buildApp>[] = [];
  afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });

  it('serves only the public health contract without provider credentials', async () => {
    const app = buildApp(loadServerConfig({ NODE_ENV: 'test' }));
    apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    const payload: unknown = response.json();
    expect(HealthResponseSchema.parse(payload)).toEqual({ status: 'ok', service: 'trip-fit-api', stage: 1 });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('does not pretend unimplemented API routes are successful', async () => {
    const app = buildApp(loadServerConfig({ NODE_ENV: 'test' }));
    apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/api/trips', headers: { accept: 'text/html' } });
    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/json');
  });
});

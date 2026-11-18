import { describe, expect, it } from 'vitest';
import { DEFAULT_CURRENCY_BY_LOCALE, HealthResponseSchema, LocaleSchema, SUPPORTED_LOCALES } from '@trip-fit/domain';
import { loadServerConfig } from '../../apps/server/src/config/env.js';
import { inspectSource } from '../../scripts/check-provider-boundaries.js';

describe('shared contracts', () => {
  it.each(SUPPORTED_LOCALES)('accepts supported locale %s and its currency', (locale) => {
    expect(LocaleSchema.parse(locale)).toBe(locale);
    expect(DEFAULT_CURRENCY_BY_LOCALE[locale]).toMatch(/^[A-Z]{3}$/);
  });
  it('rejects unknown locales rather than silently choosing an API', () => {
    expect(LocaleSchema.safeParse('unsupported').success).toBe(false);
  });
  it('rejects unexpected fields in public health data', () => {
    expect(HealthResponseSchema.safeParse({
      status: 'ok', service: 'trip-fit-api', stage: 1, privateValue: 'not-public',
    }).success).toBe(false);
  });
});

describe('server configuration', () => {
  it('starts locally without provider credentials and ignores unrelated environment data', () => {
    expect(loadServerConfig({ UNRELATED: 'value' })).toEqual({
      NODE_ENV: 'development', HOST: '127.0.0.1', PORT: 3001,
    });
  });
  it.each(['', '0', '65536', 'abc', '1.5'])('rejects invalid port %j', (PORT) => {
    expect(() => loadServerConfig({ PORT })).toThrow('Invalid server configuration: PORT');
  });
  it('does not include invalid environment values in validation messages', () => {
    expect(() => loadServerConfig({ NODE_ENV: 'sensitive-invalid-value' })).toThrow('Invalid server configuration: NODE_ENV');
  });
  it('allows the public read-only catalog in production without an authentication bypass', () => {
    expect(loadServerConfig({ NODE_ENV: 'production' }).NODE_ENV).toBe('production');
  });
});

describe('provider architecture boundaries', () => {
  it('allows a pure domain import', () => {
    expect(inspectSource('packages/domain/src/example.ts', "import { z } from 'zod';")).toEqual([]);
  });
  it('rejects UI imports from domain', () => {
    expect(inspectSource('packages/domain/src/example.ts', "import { useState } from 'react';")).not.toEqual([]);
  });
  it('rejects server imports from web', () => {
    expect(inspectSource('apps/web/src/example.ts', "import config from '../../server/src/config/providers.js';")).not.toEqual([]);
  });
  it('rejects direct environment access from services', () => {
    expect(inspectSource('apps/server/src/services/example.ts', 'const value = process.env.KEY;')).not.toEqual([]);
  });
  it('rejects fixed provider selection inside business logic', () => {
    expect(inspectSource('apps/server/src/services/example.ts', "const provider = 'PROVIDER_A';")).not.toEqual([]);
  });
});

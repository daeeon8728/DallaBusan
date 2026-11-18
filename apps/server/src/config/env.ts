import { PARKING_API_SOURCE } from './parking.js';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().trim().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
});

export type ServerConfig = Readonly<z.infer<typeof ServerEnvSchema>>;

// Only this configuration boundary reads process.env. Never serialize the input.
export function loadServerConfig(
  source: Readonly<Record<string, string | undefined>> = process.env,
): ServerConfig {
  const result = ServerEnvSchema.safeParse({
    NODE_ENV: source.NODE_ENV, HOST: source.HOST, PORT: source.PORT,
  });
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error('Invalid server configuration: ' + fields);
  }
  // Public read-only catalog has no authentication or state-changing routes.
  return Object.freeze(result.data);
}

export function loadDatabaseConfig(source: Readonly<Record<string, string | undefined>> = process.env) {
  const filename = z.string().trim().min(1).parse(source.DATABASE_PATH?.trim() || 'var/trip-fit.sqlite');
  return { filename: filename === ':memory:' ? filename : resolve(fileURLToPath(new URL('../../../../', import.meta.url)), filename) };
}

const AttractionEnvSchema = z.object({
  ATTRACTION_SERVICE_KEY: z.string().trim().default(''),
  ATTRACTION_TIMEOUT_MS: z.coerce.number().int().min(1).max(30000).default(10000),
  ATTRACTION_CACHE_TTL_MS: z.coerce.number().int().min(1).max(86400000).default(3600000),
  ATTRACTION_MAX_PAGES: z.coerce.number().int().min(1).max(100).default(20),
});
export interface AttractionConfig {
  readonly serviceKey: string | null; readonly timeoutMs: number; readonly cacheTtlMs: number;
  readonly maxPages: number; readonly pageSize: number; readonly maxResponseBytes: number;
}
export function loadAttractionConfig(source: Readonly<Record<string, string | undefined>> = process.env): AttractionConfig {
  const result = AttractionEnvSchema.safeParse({
    ATTRACTION_SERVICE_KEY: source.ATTRACTION_SERVICE_KEY,
    ATTRACTION_TIMEOUT_MS: source.ATTRACTION_TIMEOUT_MS,
    ATTRACTION_CACHE_TTL_MS: source.ATTRACTION_CACHE_TTL_MS,
    ATTRACTION_MAX_PAGES: source.ATTRACTION_MAX_PAGES,
  });
  if (!result.success) throw new Error('Invalid attraction configuration');
  return Object.freeze({
    serviceKey: result.data.ATTRACTION_SERVICE_KEY || null,
    timeoutMs: result.data.ATTRACTION_TIMEOUT_MS, cacheTtlMs: result.data.ATTRACTION_CACHE_TTL_MS,
    maxPages: result.data.ATTRACTION_MAX_PAGES, pageSize: 100, maxResponseBytes: 2000000,
  });
}

export interface GuideApiConfig {
  readonly serviceKey: string | null; readonly timeoutMs: number; readonly maxPages: number;
  readonly pageSize: number; readonly maxResponseBytes: number;
}
export function loadGuideApiConfig(kind: 'food' | 'recommended', source: Readonly<Record<string, string | undefined>> = process.env): GuideApiConfig {
  const raw = kind === 'food' ? source.FOOD_SERVICE_KEY : source.RECOMMENDED_SERVICE_KEY;
  const key = z.string().trim().max(1000).safeParse(raw ?? '');
  if (!key.success) throw new Error('Invalid public guide configuration');
  return Object.freeze({ serviceKey: key.data || null, timeoutMs: 15000, maxPages: 20, pageSize: 100, maxResponseBytes: 4000000 });
}

export interface ParkingApiConfig extends GuideApiConfig {
  readonly baseUrl: string; readonly operation: string;
}
// CLI collection configuration. Never exposed through a public route.
export function loadParkingApiConfig(source: Readonly<Record<string, string | undefined>> = process.env): ParkingApiConfig {
  const settings = z.object({timeoutMs:z.coerce.number().int().min(1).max(30000).default(15000),maxPages:z.coerce.number().int().min(1).max(100).default(100),pageSize:z.coerce.number().int().min(1).max(100).default(100)}).safeParse({timeoutMs:source.PARKING_TIMEOUT_MS?.trim()||undefined,maxPages:source.PARKING_MAX_PAGES?.trim()||undefined,pageSize:source.PARKING_PAGE_SIZE?.trim()||undefined});
  const key = z.string().trim().max(1000).safeParse(source.PARKING_SERVICE_KEY ?? '');
  if (!key.success || !settings.success) throw new Error('Invalid parking configuration');
  return Object.freeze({ serviceKey: key.data || null, baseUrl: PARKING_API_SOURCE.baseUrl,
    operation: PARKING_API_SOURCE.operation, ...settings.data, maxResponseBytes: 4000000 });
}

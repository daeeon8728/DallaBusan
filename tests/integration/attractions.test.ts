import { afterEach, describe, expect, it, vi } from 'vitest';
import { openDatabase, migrate } from '../../apps/server/src/db/client.js';
import { createCatalogRepository } from '../../apps/server/src/db/repositories.js';
import { createAttractionCache, MappingFileSchema, storeAttractionRecords } from '../../apps/server/src/db/attractions.js';
import { importAttractions } from '../../apps/server/src/services/import-attractions.js';
import { parseAttractionPage, AttractionRecordSchema, type AttractionRecord } from '../../apps/server/src/providers/attraction/parse.js';
import { AttractionError } from '../../apps/server/src/providers/attraction/errors.js';
import { type PageRequest, type PageResult } from '../../apps/server/src/providers/attraction/client.js';
import { createCatalogService } from '../../apps/server/src/services/catalog.js';
import { buildApp } from '../../apps/server/src/app.js';
import { loadServerConfig } from '../../apps/server/src/config/env.js';

const fetchedAt = '2026-11-10T00:00:00.000Z';
const record: AttractionRecord = AttractionRecordSchema.parse({
  sourceId: '999999', title: 'Test only', originalTitle: 'Test original', districtRaw: null, addressRaw: null,
  coordinates: { lat: 35.16, lng: 129.06 }, imageUrl: 'https://example.test/test.jpg',
  descriptionRaw: '<p>Test only description</p>', holidayInfoRaw: 'Unreviewed holiday text', warnings: [],
});
const mappings = MappingFileSchema.parse({ mappings: [] });
function page(pageNo: number, total: number, records = [record]): PageResult {
  return {
    page: { pageNo, numOfRows: 1, totalCount: total, records, receivedCount: records.length, rejectedCount: 0 },
    fetchedAt, freshness: 'live', failure: null,
  };
}
describe('public data collection and reviewed merge', () => {
  const databases: ReturnType<typeof openDatabase>[] = [];
  const setup = () => { const db = openDatabase(':memory:'); databases.push(db); migrate(db); return db; };
  afterEach(() => { databases.splice(0).forEach(db => db.close()); });
  it('migrates repeatably and persists a locale-scoped cache', () => {
    const db = setup(); expect(migrate(db)).toBe(0);
    const cache = createAttractionCache(db); const result = page(1, 1);
    cache.set('ko:1', { page: result.page, fetchedAt });
    expect(createAttractionCache(db).get('ko:1')?.page.records).toHaveLength(1);
    expect(cache.get('en:1')).toBeNull();
  });
  it('keeps cross-language IDs separate, never publishes unlicensed images, and repeats idempotently', () => {
    const db = setup();
    for (const locale of ['ko', 'en', 'ko'] as const) storeAttractionRecords(db, locale, [record], fetchedAt, mappings);
    expect(db.prepare('SELECT COUNT(*) AS n FROM places').get()?.n).toBe(2);
    const repo = createCatalogRepository(db);
    const place = repo.getPlace('busan-api:ko:999999');
    expect(place?.regionId).toBe('unreviewed'); expect(place?.provenance.status).toBe('unverified');
    expect(repo.getTranslation('busan-api:ko:999999', 'ko')?.image).toBeNull();
    expect(repo.getTranslation('busan-api:ko:999999', 'en')).toBeNull();
    expect(db.prepare('SELECT COUNT(*) AS n FROM attraction_records').get()?.n).toBe(2);
  });
  it('merges explicit canonical mappings and preserves field-level reviews and last good coordinates', () => {
    const db = setup(); const repo = createCatalogRepository(db);
    const reviewed = { source: 'local', sourceUrl: null, retrievedAt: fetchedAt, reviewedAt: fetchedAt, status: 'verified' } as const;
    const pending = { ...reviewed, source: 'public-api', status: 'unverified', reviewedAt: null } as const;
    repo.putPlace({ id: 'canonical-test', category: 'attraction', regionId: 'reviewed-region', coordinates: { lat: 35.2, lng: 129.1 }, durationMinutes: 60, provenance: reviewed, fieldSources: {} });
    repo.putTranslation({
      placeId: 'canonical-test', locale: 'en', title: 'Reviewed title', description: 'Old unreviewed description',
      holidayInfoRaw: 'Reviewed holiday', image: null, provenance: reviewed, fieldSources: { description: pending },
    });
    const explicit = MappingFileSchema.parse({ mappings: [{ locale: 'en', sourceId: record.sourceId, placeId: 'canonical-test', reviewedAt: fetchedAt }] });
    storeAttractionRecords(db, 'en', [record], fetchedAt, explicit);
    expect(repo.getPlace('canonical-test')?.coordinates).toEqual({ lat: 35.2, lng: 129.1 });
    const translation = repo.getTranslation('canonical-test', 'en');
    expect(translation?.title).toBe('Reviewed title');
    expect(translation?.description).toBe(record.descriptionRaw);
    expect(translation?.holidayInfoRaw).toBe('Reviewed holiday');
    storeAttractionRecords(db, 'ko', [record], fetchedAt, mappings);
    storeAttractionRecords(db, 'ko', [{ ...record, coordinates: null }], fetchedAt, mappings);
    expect(repo.getPlace('busan-api:ko:999999')?.coordinates).toEqual(record.coordinates);
  });
  it('refreshes reviewed public-source records without changing reviewed fields', () => {
    const db = setup(); const repo = createCatalogRepository(db);
    const reviewed = { source: 'public-api', sourceUrl: null, retrievedAt: fetchedAt, reviewedAt: fetchedAt, status: 'verified' } as const;
    const place = { id: 'public-reviewed-test', category: 'attraction', regionId: 'reviewed-region', coordinates: { lat: 35.2, lng: 129.1 }, durationMinutes: 60, provenance: reviewed, fieldSources: {} } as const;
    repo.putPlace(place);
    const explicit = MappingFileSchema.parse({ mappings: [{ locale: 'ko', sourceId: record.sourceId, placeId: place.id, reviewedAt: fetchedAt }] });
    storeAttractionRecords(db, 'ko', [record], fetchedAt, explicit);
    expect(repo.getPlace(place.id)?.coordinates).toEqual(place.coordinates);
    expect(() => repo.putPlace({ ...place, coordinates: record.coordinates })).toThrow('cannot overwrite');
    expect(repo.getTranslation(place.id, 'ko')?.image).toBeNull();
  });
  it('orders the requested language before unrelated fallback records', () => {
    const db = setup();
    storeAttractionRecords(db, 'en', [{ ...record, title: 'English test' }], fetchedAt, mappings);
    storeAttractionRecords(db, 'ko', [{ ...record, title: 'Korean test' }], fetchedAt, mappings);
    const result = createCatalogService(db, true, 1000).list({ locale: 'ko', page: 1, limit: 1, q: '' });
    expect(result.items[0]?.locale).toBe('ko');
    expect(result.items[0]?.translationFallback).toBe(false);
  });
  it('rolls back an entire page when a reviewed mapping is dangling', () => {
    const db = setup();
    const explicit = MappingFileSchema.parse({ mappings: [{ locale: 'ko', sourceId: '2', placeId: 'missing', reviewedAt: fetchedAt }] });
    expect(() => storeAttractionRecords(db, 'ko', [record, { ...record, sourceId: '2' }], fetchedAt, explicit)).toThrow('absent place');
    expect(db.prepare('SELECT COUNT(*) AS n FROM places').get()?.n).toBe(0);
    expect(db.prepare('SELECT COUNT(*) AS n FROM attraction_records').get()?.n).toBe(0);
  });
  it('rejects duplicate canonical source mappings', () => {
    const value = { locale: 'ko', sourceId: '1', placeId: 'reviewed-test', reviewedAt: fetchedAt };
    expect(() => MappingFileSchema.parse({ mappings: [value, value] })).toThrow('Duplicate');
  });
});
describe('pagination and partial failures', () => {
  it('collects all pages and reports a late failure without clearing earlier data', async () => {
    const save = vi.fn();
    const good = { getPage: async (request: PageRequest) => page(request.pageNo, 2, [{ ...record, sourceId: String(request.pageNo) }]) };
    expect((await importAttractions(good, 'ko', { maxPages: 2, pageSize: 1 }, save)).status).toBe('complete');
    expect(save).toHaveBeenCalledTimes(2);
    const broken = { getPage: async (request: PageRequest) => { if (request.pageNo === 2) throw new AttractionError('http'); return page(1, 2); } };
    const result = await importAttractions(broken, 'ko', { maxPages: 3, pageSize: 1 }, save);
    expect(result).toMatchObject({ status: 'partial', records: 1, reason: 'http' });
  });
  it.each(['duplicate', 'empty', 'changed', 'limit', 'stale'] as const)('stops boundedly on %s', async problem => {
    const getPage = vi.fn(async (request: PageRequest): Promise<PageResult> => {
      if (problem === 'empty' && request.pageNo === 2) return page(2, 3, []);
      if (problem === 'changed' && request.pageNo === 2) return page(2, 4);
      if (problem === 'stale') return { ...page(1, 3), freshness: 'stale', failure: 'network' };
      return page(request.pageNo, 3);
    });
    const result = await importAttractions({ getPage }, 'ko', { maxPages: problem === 'limit' ? 1 : 5, pageSize: 1 }, vi.fn());
    expect(result.status).not.toBe('complete'); expect(result.reason).not.toBeNull();
    expect(getPage.mock.calls.length).toBeLessThanOrEqual(2);
  });
  it('reports skipped malformed records as partial, not a complete import', async () => {
    const parsed = parseAttractionPage({ getAttractionKr: { header: { code: '00' }, pageNo: 1, numOfRows: 100, totalCount: 2, item: [{ UC_SEQ: null }, { UC_SEQ: '1', TITLE: 'Test' }] } }, 'ko');
    const result = await importAttractions({ getPage: async () => ({ page: parsed, fetchedAt, freshness: 'live', failure: null }) }, 'ko', { maxPages: 1, pageSize: 100 }, vi.fn());
    expect(result).toMatchObject({ status: 'partial', rejected: 1, reason: 'rejected-records' });
  });
});
describe('read-only catalog HTTP API', () => {
  it('validates query, marks fallback/staleness, excludes secrets and leaves unreviewed data ineligible', async () => {
    const db = openDatabase(':memory:'); migrate(db);
    storeAttractionRecords(db, 'ko', [record], fetchedAt, mappings);
    const catalog = createCatalogService(db, false, 1000, () => Date.parse(fetchedAt) + 2000);
    const app = buildApp(loadServerConfig({ NODE_ENV: 'test' }), undefined, catalog);
    try {
      const response = await app.inject('/api/places?locale=en&limit=10');
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ total: 1, items: [{ translationFallback: true, stale: true, image: null, eligibleForPlanning: false, locale: 'ko' }] });
      expect(response.body).not.toContain('serviceKey');
      expect((await app.inject('/api/places?locale=bad')).statusCode).toBe(400);
      expect((await app.inject('/api/places?limit=100000')).statusCode).toBe(400);
      expect((await app.inject('/api/places?q=%25')).json()).toMatchObject({ total: 0, items: [] });
      expect((await app.inject('/api/catalog/status')).json()).toMatchObject({ provider: 'unconfigured', lastImport: null });
    } finally { await app.close(); db.close(); }
  });
});

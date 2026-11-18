import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { SUPPORTED_LOCALES, type Locale } from '@trip-fit/domain';
import { loadAttractionConfig } from '../../apps/server/src/config/env.js';
import { createAttractionClient, type AttractionCache, type CachedPage } from '../../apps/server/src/providers/attraction/client.js';
import { parseAttractionPage } from '../../apps/server/src/providers/attraction/parse.js';
import { attractionEndpoint } from '../../apps/server/src/providers/attraction/locales.js';
import { AttractionError } from '../../apps/server/src/providers/attraction/errors.js';

function fixture(locale: Locale): unknown {
  const input: unknown = JSON.parse(readFileSync(new URL('../fixtures/attraction/' + locale + '.json', import.meta.url), 'utf8'));
  return input;
}
function envelope(item: unknown, totalCount = 1) {
  return { getAttractionKr: { header: { code: '00' }, pageNo: 1, numOfRows: 100, totalCount, item } };
}
const row = { UC_SEQ: '999999', MAIN_TITLE: 'Test only', TITLE: 'Localized test only', LAT: '35.16', LNG: '129.06', HLDY_INFO: '<p>Unstructured test text</p>' };
function cache(): AttractionCache {
  const entries = new Map<string, CachedPage>();
  return { get: key => entries.get(key) ?? null, set: (key, value) => { entries.set(key, value); } };
}
const config = loadAttractionConfig({ ATTRACTION_SERVICE_KEY: 'TEST_KEY+/=' });
const request = { locale: 'ko', pageNo: 1, numOfRows: 100 } as const;
const success = () => new Response(JSON.stringify(fixture('ko')), { headers: { 'Content-Type': 'text/plain' } });

describe('attraction response contract', () => {
  it.each(SUPPORTED_LOCALES)('parses the %s fixture and localized TITLE', locale => {
    const page = parseAttractionPage(fixture(locale), locale);
    expect(page.records).toHaveLength(1);
    expect(page.records[0]?.title).not.toBe('테스트 원문');
    expect(page.records[0]?.coordinates).toEqual({ lat: 35.16, lng: 129.06 });
    expect(page.records[0]?.descriptionRaw).toContain('<p>');
  });
  it('parses the actual optional ADDR1 contract without fabricating an address', () => {
    expect(parseAttractionPage(envelope({ ...row, ADDR1: '  Test-only address  ' }), 'ko').records[0]?.addressRaw).toBe('Test-only address');
    expect(parseAttractionPage(envelope(row), 'ko').records[0]?.addressRaw).toBeNull();
  });
  it('accepts singleton and explicit empty result shapes', () => {
    expect(parseAttractionPage(envelope(row), 'ko').records).toHaveLength(1);
    for (const item of [[], null, undefined, '']) expect(parseAttractionPage(envelope(item, 0), 'ko').records).toEqual([]);
  });
  it.each(['', ' ', null, 'NaN', 'Infinity', true, '0', '91', '37.5'])('does not fabricate Busan coordinates from %j', LAT => {
    expect(parseAttractionPage(envelope({ ...row, LAT }), 'ko').records[0]?.coordinates).toBeNull();
  });
  it('keeps holiday text unstructured and rejects executable image URLs', () => {
    const value = parseAttractionPage(envelope({ ...row, MAIN_IMG_NORMAL: 'javascript:alert(1)' }), 'ko').records[0];
    expect(value?.holidayInfoRaw).toBe(row.HLDY_INFO);
    expect(value?.imageUrl).toBeNull();
    expect(value?.warnings).toContain('invalid-image');
  });
  it('counts malformed rows without discarding valid records', () => {
    const page = parseAttractionPage(envelope([row, { ...row, UC_SEQ: null }], 2), 'ko');
    expect(page.receivedCount).toBe(2); expect(page.rejectedCount).toBe(1);
  });
  it('rejects business failures, gateway errors, wrong endpoint and unknown locale', () => {
    expect(() => parseAttractionPage({ getAttractionKr: { header: { code: '30' } } }, 'ko')).toThrow('authentication');
    expect(() => parseAttractionPage({ OpenAPI_ServiceResponse: {} }, 'ko')).toThrow('authentication');
    expect(() => parseAttractionPage(fixture('ko'), 'en')).toThrow('invalid-response');
    expect(() => attractionEndpoint('../invalid')).toThrow();
  });
});
describe('bounded requests, cache and error recovery', () => {
  it.each(SUPPORTED_LOCALES)('routes %s through the allowlist and JSON parameters', async locale => {
    const fetcher = vi.fn<typeof fetch>(async url => {
      const actual = new URL(String(url));
      expect(actual.pathname.endsWith('/' + attractionEndpoint(locale))).toBe(true);
      expect(actual.searchParams.get('ServiceKey')).toBe('TEST_KEY+/=');
      expect(actual.searchParams.get('resultType')).toBe('json');
      return new Response(JSON.stringify(fixture(locale)));
    });
    const client = createAttractionClient(config, cache(), fetcher);
    await client.getPage({ ...request, locale }); expect(fetcher).toHaveBeenCalledOnce();
  });
  it('decodes an already encoded key once and blocks redirects', async () => {
    const fetcher = vi.fn<typeof fetch>(async (url, init) => {
      expect(new URL(String(url)).searchParams.get('ServiceKey')).toBe('TEST_KEY+/=');
      expect(init?.redirect).toBe('error'); return success();
    });
    await createAttractionClient({ ...config, serviceKey: 'TEST_KEY%2B%2F%3D' }, cache(), fetcher).getPage(request);
  });
  it('never sends a request with missing or invalid credentials', async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(createAttractionClient({ ...config, serviceKey: null }, cache(), fetcher).getPage(request)).rejects.toThrow('unconfigured');
    await expect(createAttractionClient({ ...config, serviceKey: '%ZZ' }, cache(), fetcher).getPage(request)).rejects.toThrow('invalid-key');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('uses fresh cache, separates locale and retains stale success on outage', async () => {
    let clock = Date.now(); const store = cache(); let fail = false;
    const fetcher = vi.fn<typeof fetch>(async url => {
      if (fail) throw new Error('native exception containing TEST_KEY');
      const locale = String(url).includes('getAttractionEn') ? 'en' : 'ko';
      return new Response(JSON.stringify(fixture(locale)));
    });
    const client = createAttractionClient(config, store, fetcher, () => clock);
    expect((await client.getPage(request)).freshness).toBe('live');
    expect((await client.getPage(request)).freshness).toBe('cache');
    await client.getPage({ ...request, locale: 'en' });
    expect(fetcher).toHaveBeenCalledTimes(2);
    clock += config.cacheTtlMs + 1; fail = true;
    const result = await client.getPage(request);
    expect(result.freshness).toBe('stale'); expect(result.failure).toBe('network');
    expect(fetcher).toHaveBeenCalledTimes(4);
  });
  it('retries a 5xx once and never retries 429', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(success());
    await createAttractionClient(config, cache(), fetcher).getPage(request);
    expect(fetcher).toHaveBeenCalledTimes(2);
    const limited = vi.fn<typeof fetch>(async () => new Response('', { status: 429, headers: { 'Retry-After': '60' } }));
    await expect(createAttractionClient(config, cache(), limited).getPage(request)).rejects.toMatchObject({ code: 'rate-limited', retryAfterSeconds: 60 });
    expect(limited).toHaveBeenCalledOnce();
  });
  it('rejects XML authentication error without logging or reflecting upstream body', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response('<OpenAPI_ServiceResponse><returnReasonCode>30</returnReasonCode><errMsg>TEST_KEY</errMsg></OpenAPI_ServiceResponse>'));
    try { await createAttractionClient(config, cache(), fetcher).getPage(request); throw new Error('Expected error'); }
    catch (error) { expect(error).toBeInstanceOf(AttractionError); expect(String(error)).not.toContain('TEST_KEY'); }
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it('rejects a mismatched page number and oversized body', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => success());
    await expect(createAttractionClient(config, cache(), fetcher).getPage({ ...request, pageNo: 2 })).rejects.toThrow('invalid-response');
    await expect(createAttractionClient({ ...config, maxResponseBytes: 10 }, cache(), fetcher).getPage(request)).rejects.toThrow('too-large');
  });
  it('enforces timeout and caller cancellation without leaking native errors', async () => {
    const fetcher = vi.fn<typeof fetch>(async (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('TEST_KEY')), { once: true });
    }));
    await expect(createAttractionClient({ ...config, timeoutMs: 5 }, cache(), fetcher).getPage(request)).rejects.toThrow('timeout');
    expect(fetcher).toHaveBeenCalledTimes(2);
    const controller = new AbortController(); controller.abort();
    await expect(createAttractionClient(config, cache(), fetcher).getPage(request, controller.signal)).rejects.toThrow('aborted');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

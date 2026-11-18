import { z } from 'zod';
import { LocaleSchema, type Locale } from '@trip-fit/domain';
import type { AttractionConfig } from '../../config/env.js';
import { AttractionError } from './errors.js';
import { ATTRACTION_BASE_URL, attractionEndpoint } from './locales.js';
import { AttractionPageSchema, parseAttractionPage } from './parse.js';

export const CachedPageSchema = z.strictObject({
  page: AttractionPageSchema, fetchedAt: z.iso.datetime(),
});
export type CachedPage = z.infer<typeof CachedPageSchema>;
export interface AttractionCache {
  get(key: string): CachedPage | null;
  set(key: string, value: CachedPage): void;
}
export interface PageRequest { locale: Locale; pageNo: number; numOfRows: number; sourceId?: string | undefined }
export interface PageResult extends CachedPage {
  freshness: 'live' | 'cache' | 'stale'; failure: AttractionError['code'] | null;
}
const RequestSchema = z.strictObject({
  locale: LocaleSchema, pageNo: z.number().int().min(1).max(1000),
  numOfRows: z.number().int().min(1).max(100), sourceId: z.string().regex(/^\d{1,20}$/).optional(),
});
function requestUrl(request: PageRequest, key: string) {
  const url = new URL(attractionEndpoint(request.locale), ATTRACTION_BASE_URL);
  let decoded = key;
  try { if (key.includes('%')) decoded = decodeURIComponent(key); }
  catch { throw new AttractionError('invalid-key'); }
  if (!/^[A-Za-z0-9+/=._-]+$/.test(decoded)) throw new AttractionError('invalid-key');
  url.search = new URLSearchParams({
    ServiceKey: decoded, resultType: 'json', pageNo: String(request.pageNo), numOfRows: String(request.numOfRows),
    ...(request.sourceId ? { UC_SEQ: request.sourceId } : {}),
  }).toString();
  return url;
}
async function boundedText(response: Response, maxBytes: number) {
  const declared = Number(response.headers.get('content-length'));
  if (declared > maxBytes) { await response.body?.cancel(); throw new AttractionError('too-large'); }
  if (!response.body) throw new AttractionError('invalid-response');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = ''; let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new AttractionError('too-large'); }
      result += decoder.decode(chunk.value, { stream: true });
    }
    return result + decoder.decode();
  } finally { reader.releaseLock(); }
}
export function createAttractionClient(
  config: AttractionConfig, cache: AttractionCache,
  fetcher: typeof fetch = fetch, now: () => number = Date.now,
) {
  async function download(request: PageRequest, signal?: AbortSignal): Promise<CachedPage> {
    if (!config.serviceKey) throw new AttractionError('unconfigured');
    const url = requestUrl(request, config.serviceKey);
    for (let attempt = 0; attempt <= 1; attempt++) {
      const timeout = AbortSignal.timeout(config.timeoutMs);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
      try {
        const response = await fetcher(url, { signal: combined, redirect: 'error', headers: { Accept: 'application/json' } });
        if (!response.ok) {
          await response.body?.cancel();
          const retryAfter = response.headers.get('retry-after');
          const seconds = retryAfter && /^\d+$/.test(retryAfter)
            ? Number(retryAfter) : retryAfter ? Math.max(0, Math.ceil((Date.parse(retryAfter) - now()) / 1000)) : null;
          throw new AttractionError(response.status === 429 ? 'rate-limited'
            : [401, 403].includes(response.status) ? 'authentication' : 'http',
          response.status >= 500, Number.isFinite(seconds) ? seconds : null);
        }
        const text = await boundedText(response, config.maxResponseBytes);
        combined.throwIfAborted();
        // The actual service returns JSON with text/plain Content-Type.
        let input: unknown;
        try { input = JSON.parse(text); } catch {
          const auth = /<returnReasonCode>\s*(30|31|32)\s*<\/returnReasonCode>/.test(text);
          throw new AttractionError(auth ? 'authentication' : 'invalid-response');
        }
        const page = parseAttractionPage(input, request.locale);
        if (page.pageNo !== request.pageNo || page.numOfRows !== request.numOfRows || page.receivedCount > request.numOfRows)
          throw new AttractionError('invalid-response');
        return { page, fetchedAt: new Date(now()).toISOString() };
      } catch (error) {
        if (signal?.aborted) throw new AttractionError('aborted');
        const safe = error instanceof AttractionError ? error
          : new AttractionError(timeout.aborted ? 'timeout' : 'network', true);
        if (!safe.retryable || attempt === 1) throw safe;
      }
    }
    throw new AttractionError('network');
  }
  return {
    async getPage(input: PageRequest, signal?: AbortSignal): Promise<PageResult> {
      const request = RequestSchema.parse(input);
      if (signal?.aborted) throw new AttractionError('aborted');
      const key = JSON.stringify([request.locale, request.pageNo, request.numOfRows, request.sourceId ?? null]);
      const cached = cache.get(key);
      if (cached && now() >= Date.parse(cached.fetchedAt) && now() - Date.parse(cached.fetchedAt) < config.cacheTtlMs)
        return { ...cached, freshness: 'cache', failure: null };
      try {
        const result = await download(request, signal);
        if (signal?.aborted) throw new AttractionError('aborted');
        cache.set(key, result);
        return { ...result, freshness: 'live', failure: null };
      } catch (error) {
        if (cached && error instanceof AttractionError && error.code !== 'aborted')
          return { ...cached, freshness: 'stale', failure: error.code };
        throw error;
      }
    },
  };
}

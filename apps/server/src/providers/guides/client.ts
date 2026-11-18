import { GuideKindSchema, LocaleSchema, type GuideKind, type Locale } from '@trip-fit/domain';
import type { GuideApiConfig } from '../../config/env.js';
import { GUIDE_SOURCES, guideEndpoint } from '../../config/guides.js';
import { GuideApiError, parseGuidePage } from './parse.js';
async function readBounded(response: Response, maxBytes: number) {
  if (Number(response.headers.get('content-length')) > maxBytes) { await response.body?.cancel(); throw new GuideApiError('too-large'); }
  if (!response.body) throw new GuideApiError('invalid-response');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let text = ''; let size = 0;
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new GuideApiError('too-large'); }
      text += decoder.decode(part.value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}
export function createGuideClient(config: GuideApiConfig, fetcher: typeof fetch = fetch) {
  return { async getPage(kind: GuideKind, locale: Locale, pageNo: number, signal?: AbortSignal) {
    GuideKindSchema.parse(kind); LocaleSchema.parse(locale);
    if (!Number.isInteger(pageNo) || pageNo < 1 || pageNo > config.maxPages) throw new GuideApiError('incomplete');
    if (!config.serviceKey) throw new GuideApiError('unconfigured');
    let key = config.serviceKey;
    try { if (key.includes('%')) key = decodeURIComponent(key); } catch { throw new GuideApiError('invalid-key'); }
    if (!/^[A-Za-z0-9+/=._-]+$/.test(key)) throw new GuideApiError('invalid-key');
    const url = new URL(guideEndpoint(kind,locale), GUIDE_SOURCES[kind].baseUrl);
    url.search = new URLSearchParams({ ServiceKey: key, resultType: 'json', pageNo: String(pageNo), numOfRows: String(config.pageSize) }).toString();
    const timeout = AbortSignal.timeout(config.timeoutMs); const combined = signal ? AbortSignal.any([signal,timeout]) : timeout;
    try {
      combined.throwIfAborted();
      const response = await fetcher(url, { signal: combined, redirect: 'error', headers: { Accept: 'application/json' } });
      if (!response.ok) {
        await response.body?.cancel();
        throw new GuideApiError(response.status === 429 ? 'rate-limited' : [401,403].includes(response.status) ? 'authentication' : 'http');
      }
      const text = await readBounded(response,config.maxResponseBytes); combined.throwIfAborted();
      let input: unknown;
      try { input = JSON.parse(text); } catch {
        throw new GuideApiError(/<returnReasonCode>\s*(30|31|32)\s*<\/returnReasonCode>/.test(text) ? 'authentication' : 'invalid-response');
      }
      const page = parseGuidePage(input,kind,locale);
      if (page.pageNo !== pageNo || page.numOfRows !== config.pageSize || page.receivedCount > config.pageSize) throw new GuideApiError('invalid-response');
      return page;
    } catch (error) {
      if (signal?.aborted) throw new GuideApiError('aborted');
      if (error instanceof GuideApiError) throw error;
      throw new GuideApiError(timeout.aborted ? 'timeout' : 'network');
    }
  } };
}

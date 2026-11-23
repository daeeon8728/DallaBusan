import { z } from 'zod';
import { CurrencySchema, ExchangeRatesSchema, type ExchangeRates } from '@trip-fit/domain';
import { EXCHANGE_CONFIG } from '../config/exchange.js';
const RowsSchema = z.array(z.object({ base: z.literal('USD'), quote: CurrencySchema.exclude(['USD']), date: z.iso.date(), rate: z.number().finite().positive().max(1e12) })).length(4);
export function parseExchangeResponse(raw: unknown, now: number): ExchangeRates {
  const rows = RowsSchema.parse(raw);
  const today = new Date(now).toISOString().slice(0, 10);
  if (rows.some(row => row.date > today || now - Date.parse(row.date + 'T00:00:00Z') > EXCHANGE_CONFIG.maxRateAgeMs)) throw new Error('Outdated exchange rates');
  return ExchangeRatesSchema.parse({ source: 'Frankfurter', base: 'USD', fetchedAt: new Date(now).toISOString(), stale: false,
    rates: [{ currency: 'USD', rate: '1', date: today }, ...rows.map(row => ({ currency: row.quote, rate: String(row.rate), date: row.date }))] });
}
export function createExchangeService(fetcher: typeof fetch = fetch, clock: () => number = Date.now) {
  let cached: ExchangeRates | null = null;
  let pending: Promise<ExchangeRates | null> | null = null;
  let retryAfter = 0;
  function fallback(): ExchangeRates | null {
    const now = clock();
    return cached && now - Date.parse(cached.fetchedAt) <= EXCHANGE_CONFIG.maxCacheMs && cached.rates.every(row => now - Date.parse(row.date + 'T00:00:00Z') <= EXCHANGE_CONFIG.maxRateAgeMs)
      ? { ...cached, stale: true } : null;
  }
  async function refresh() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXCHANGE_CONFIG.timeoutMs);
    try {
      const response = await fetcher(EXCHANGE_CONFIG.url, { signal: controller.signal, redirect: 'error', headers: { Accept: 'application/json' } });
      if (!response.ok || !response.body || Number(response.headers.get('content-length') ?? 0) > EXCHANGE_CONFIG.maxBytes) throw new Error('Exchange fetch failed');
      const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
      try {
        while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > EXCHANGE_CONFIG.maxBytes) throw new Error('Exchange response too large'); chunks.push(part.value); }
      } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
      cached = parseExchangeResponse(JSON.parse(Buffer.concat(chunks).toString('utf8')), clock());
      retryAfter = 0; return cached;
    } catch { retryAfter = clock() + EXCHANGE_CONFIG.retryMs; return fallback(); }
    finally { clearTimeout(timeout); }
  }
  return { async get(): Promise<ExchangeRates | null> {
    if (cached && clock() - Date.parse(cached.fetchedAt) < EXCHANGE_CONFIG.ttlMs) return cached;
    if (pending) return pending;
    if (clock() < retryAfter) return fallback();
    pending = refresh();
    try { return await pending; } finally { pending = null; }
  } };
}
export type ExchangeService = ReturnType<typeof createExchangeService>;

// Fixed public, keyless reference-rate source. No user-supplied destination URLs.
export const EXCHANGE_CONFIG = Object.freeze({
  url: 'https://api.frankfurter.dev/v2/rates?base=USD&quotes=KRW,JPY,CNY,TWD',
  timeoutMs: 8000, maxBytes: 16384, ttlMs: 3600000, retryMs: 60000, maxCacheMs: 86400000, maxRateAgeMs: 7 * 86400000,
});

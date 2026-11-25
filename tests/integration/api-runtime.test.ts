import { OffersResponseSchema, PromotionsResponseSchema } from '@trip-fit/domain';
import { afterEach,beforeEach,describe, expect, it, vi } from 'vitest';
import { createRuntimeApp } from '../../apps/server/src/runtime.js';

vi.mock('@fastify/static', () => {
  throw new Error('API-only runtime must not load the standalone static server');
});

describe('API-only runtime dependency boundary', () => {
  beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-11-23T03:00:00Z'));});
  afterEach(()=>vi.useRealTimers());
  it('serves catalog and promotions without importing the static server plugin', async () => {

    const app = await createRuntimeApp({ readOnlySnapshot: true });
    try {
      const offers = await app.inject('/api/offers?locale=en');
      const promotions = await app.inject('/api/promotions?locale=en');
      expect(offers.statusCode).toBe(200);
      expect(promotions.statusCode).toBe(200);
      const offerBody: unknown = offers.json();
      const promotionBody: unknown = promotions.json();
      expect(OffersResponseSchema.parse(offerBody).total).toBe(402);
      expect(PromotionsResponseSchema.parse(promotionBody).items).toHaveLength(3);
    } finally {
      await app.close();
    }
  });
});

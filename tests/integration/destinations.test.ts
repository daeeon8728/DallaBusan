import { describe, expect, it } from 'vitest';
import { loadDestinationConfig } from '../../apps/server/src/config/destinations.js';
import { loadOfferCatalogConfig } from '../../apps/server/src/config/offers.js';
import { createDestinationService } from '../../apps/server/src/services/destinations.js';
import { createOfferService } from '../../apps/server/src/services/offers.js';
import { loadServerConfig } from '../../apps/server/src/config/env.js';
import { buildApp } from '../../apps/server/src/app.js';

function fixture() {
  const config = loadDestinationConfig();
  const offers = createOfferService(loadOfferCatalogConfig(), () => '2026-11-11');
  return { config, offers };
}
describe('reviewed destination guides and affiliate relations', () => {
  it('publishes all API source groups and reviewed affiliate mappings', () => {
    const { config, offers } = fixture();
    const service = createDestinationService(config, offers, () => '2026-11');
    expect(service.list('ko').featured).toHaveLength(2);
    expect(service.list('ko').catalogTotal).toBe(220);
    expect(service.get('gamcheon','ko')?.related).toHaveLength(17);
    expect(service.get('gwangalli','ko')?.related).toHaveLength(5);
    const detail = service.get('gamcheon','ko');
    expect(detail?.destination.address).toContain('감내2로 203');
    expect(detail?.related.find(link => link.relationship === 'stay')?.areaLabel).toContain('남포동');
    expect(JSON.stringify(detail)).not.toMatch(/evidenceUrl|featuredSlugs|sourceId|allowedHosts|serviceKey/);
  });
  it.each(['ko','en','ja','zh-CN','zh-TW'] as const)('uses the reviewed API translation for %s', locale => {
    const { config, offers } = fixture();
    const item = createDestinationService(config,offers).get('gamcheon',locale)?.destination;
    expect(item?.locale).toBe(locale);
    expect(item?.translationFallback).toBe(false);
    expect(item?.description.length).toBeGreaterThan(40);
  });
  it('falls back explicitly without merging unreviewed language identities', () => {
    const { config, offers } = fixture();
    const item = config.destinations[0]; if (!item) throw Error('Missing destination');
    item.translations = item.translations.filter(text => text.locale === 'ko');
    const detail = createDestinationService(config,offers).get(item.slug,'en');
    expect(detail?.destination.locale).toBe('ko');
    expect(detail?.destination.translationFallback).toBe(true);
  });
  it('stops monthly claims outside the curated month, retaining ordinary guides', () => {
    const { config, offers } = fixture();
    const result = createDestinationService(config,offers,() => '2026-12').list('en');
    expect(result.featured).toEqual([]);
    expect(result.items).toHaveLength(12);
    expect(result.catalogTotal).toBe(220);
  });
  it('does not publish expired or disabled affiliate offers in destination details', () => {
    const { config } = fixture();
    const catalog = loadOfferCatalogConfig();
    const hotel = catalog.offers.find(offer => offer.id === 'b-282525'); if (!hotel) throw Error('Missing hotel');
    hotel.expiresOn = '2026-11-10';
    const detail = createDestinationService(config,createOfferService(catalog,() => '2026-11-11')).get('gamcheon','ko');
    expect(detail?.related.some(link => link.offer.id === hotel.id)).toBe(false);
    const activeProvider = catalog.providers.find(provider => provider.id === hotel.providerId);
    if (!activeProvider) throw Error('Missing provider');
    activeProvider.enabled = false;
    expect(createDestinationService(config,createOfferService(catalog)).get('gamcheon','ko')?.related.every(link => link.offer.provider.id !== activeProvider.id)).toBe(true);
  });
  it('rejects duplicate destinations, translations and unrelated stay classifications', () => {
    const { config, offers } = fixture();
    const item = config.destinations[0]; if (!item) throw Error('Missing destination');
    config.destinations.push(item);
    expect(() => createDestinationService(config,offers)).toThrow();
    config.destinations.pop();
    const text = item.translations[0]; if (!text) throw Error('Missing translation');
    item.translations.push(text);
    expect(() => createDestinationService(config,offers)).toThrow();
    item.translations.pop();
    const link = item.related.find(link=>{const offer=offers.get(link.offerId);return offer&&offer.category!=='stay';}); if (!link) throw Error('Missing active non-stay relation');
    link.relationship = 'stay'; link.areaLabel = 'Test-only invalid area';
    expect(() => createDestinationService(config,offers)).toThrow();
  });
  it('returns strict, read-only public API contracts and safe missing responses', async () => {
    const { config, offers } = fixture();
    const service = createDestinationService(config,offers,() => '2026-11');
    const app = buildApp(loadServerConfig({NODE_ENV:'test'}),undefined,undefined,offers,service);
    try {
      const response = await app.inject('/api/destinations?locale=en');
      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBe('no-store');
      expect((await app.inject('/api/destinations?locale=bad')).statusCode).toBe(400);
      expect((await app.inject('/api/destinations?url=https://example.test')).statusCode).toBe(400);
      expect((await app.inject('/api/destinations/absent?locale=ko')).statusCode).toBe(404);
      expect((await app.inject('/api/destinations/gamcheon?locale=ja')).json().destination.locale).toBe('ja');
      expect((await app.inject({method:'POST',url:'/api/destinations',payload:{}})).statusCode).toBe(404);
    } finally { await app.close(); }
  });
});

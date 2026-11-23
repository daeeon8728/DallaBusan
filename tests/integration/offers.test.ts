import { describe, expect, it } from 'vitest';
import { OfferQuerySchema } from '@trip-fit/domain';
import { OfferCatalogConfigSchema, loadOfferCatalogConfig } from '../../apps/server/src/config/offers.js';
import { createOfferService } from '../../apps/server/src/services/offers.js';
import { buildApp } from '../../apps/server/src/app.js';
import { loadServerConfig } from '../../apps/server/src/config/env.js';

function fixture() {
  return OfferCatalogConfigSchema.parse({
    checkedOn: '2026-11-10', contactEmail: 'contact@example.test',
    providers: [{
      id: 'PROVIDER_TEST', displayName: 'Test Booking', enabled: true, approvalStatus: 'approved', websiteApproval: 'unverified',
      allowedHosts: ['booking.example.test'], sourceHosts: ['source.example.test'], pathPrefixes: ['/products/'],
      requiredQuery: { ref: 'verified' }, destinationQuery: null, destinationHosts: [],
    }],
    offers: [{
      id: 'test-ticket', externalId: 'ticket-1', providerId: 'PROVIDER_TEST', title: 'Test-only 부산 티켓',
      titleLocale: 'ko', category: 'ticket', scope: 'busan',
      href: 'https://booking.example.test/products/one?ref=verified', sourceUrl: 'https://source.example.test/item/one',
      price: { amount: '10000', currency: 'KRW' }, image: { url: '/review-assets/gwangalli.jpg', kind: 'destination', credit: 'Test-only credit' },
      checkedOn: '2026-11-10', expiresOn: null, linkEvidence: 'portal-generated', priority: 1,
    }], directories: [],
  });
}
function service(config = fixture()) { return createOfferService(config, () => '2026-11-10'); }
describe('affiliate destination and public data boundary', () => {
  it('loads the actual four-provider catalog and validates every published link', () => {
    const config = loadOfferCatalogConfig(); const offers = service(config);
    const result = offers.list(OfferQuerySchema.parse({ limit: 48 }));
    expect(result.catalogTotal).toBe(402);
    expect(result.providers).toHaveLength(4);
    expect(new Set(config.offers.map(offer => offer.id)).size).toBe(config.offers.length);
    expect(result.items.every(offer => offer.href.startsWith('https:'))).toBe(true);
  });
  it.each([
    'https://booking.example.test.evil.test/products/one?ref=verified',
    'https://booking.example.test@evil.test/products/one?ref=verified',
    'http://booking.example.test/products/one?ref=verified',
    'https://booking.example.test/products/one?ref=wrong',
    'https://booking.example.test/products/one?ref=verified&ref=wrong',
    'https://booking.example.test/elsewhere?ref=verified',
    'https://booking.example.test/products/one?ref=verified#unreviewed',
  ])('rejects an unapproved booking destination: %s', href => {
    const config = fixture(); const offer = config.offers[0]; if (!offer) throw new Error('Missing test data');
    offer.href = href; expect(() => service(config)).toThrow();
  });
  it('rejects unknown and inactive providers without publishing their links', () => {
    const config = fixture(); const provider = config.providers[0]; if (!provider) throw new Error('Missing test data');
    provider.approvalStatus = 'pending'; expect(service(config).list(OfferQuerySchema.parse({})).items).toEqual([]);
    provider.approvalStatus = 'approved'; provider.enabled = false;
    expect(service(config).list(OfferQuerySchema.parse({})).providers).toEqual([]);
    config.providers = []; expect(() => service(config)).toThrow('provider is missing');
  });
  it('validates nested redirect targets and original product evidence', () => {
    const config = fixture(); const provider = config.providers[0]; const offer = config.offers[0];
    if (!provider || !offer) throw new Error('Missing test data');
    provider.destinationQuery = 'destination'; provider.destinationHosts = ['source.example.test'];
    offer.href += '&destination=' + encodeURIComponent('https://source.example.test/item/one');
    expect(service(config).get(offer.id)?.id).toBe(offer.id);
    offer.href = offer.href.replace('source.example.test', 'evil.example.test');
    expect(() => service(config)).toThrow('nested destination');
    provider.destinationQuery = null; offer.href = 'https://booking.example.test/products/one?ref=verified';
    offer.sourceUrl = 'https://other.example.test/item/one'; expect(() => service(config)).toThrow('evidence');
  });
  it('excludes server configuration and credentials from public DTOs', () => {
    const result = JSON.stringify(service().list(OfferQuerySchema.parse({})));
    for (const privateField of ['allowedHosts', 'requiredQuery', 'websiteApproval', 'priority', 'API_KEY', 'serviceKey'])
      expect(result).not.toContain(privateField);
    expect(result).toContain('Test Booking');
    expect(service().list(OfferQuerySchema.parse({})).items[0]).not.toHaveProperty('sourceUrl');
    expect(result).not.toContain('https://source.example.test/item/one');
  });
  it('accepts a new provider through configuration without changing the engine', () => {
    const config = fixture(); const provider = config.providers[0]; const offer = config.offers[0];
    if (!provider || !offer) throw new Error('Missing test data');
    config.providers.push({ ...provider, id: 'PROVIDER_EXTRA', displayName: 'Another Test Provider' });
    config.offers.push({ ...offer, id: 'test-extra', externalId: 'extra', providerId: 'PROVIDER_EXTRA' });
    const result = service(config).list(OfferQuerySchema.parse({ provider: 'PROVIDER_EXTRA' }));
    expect(result.total).toBe(1); expect(result.items[0]?.provider.displayName).toBe('Another Test Provider');
  });
  it('rejects duplicate identities and an unapproved local image path', () => {
    const config = fixture(); const provider = config.providers[0]; const offer = config.offers[0];
    if (!provider || !offer) throw new Error('Missing test data');
    config.providers.push(provider); expect(() => service(config)).toThrow('Duplicate');
    config.providers.pop(); offer.image.url = '/review-assets/../../private';
    expect(() => service(config)).toThrow();
  });
});
describe('catalog filtering, prices and expiry', () => {
  it('hides expired products, including detail access, without pretending they are free', () => {
    const config = fixture(); const offer = config.offers[0]; if (!offer) throw new Error('Missing test data');
    offer.price = null; expect(service(config).get(offer.id)?.referencePrice).toBeNull();
    offer.expiresOn = '2026-11-09';
    expect(service(config).list(OfferQuerySchema.parse({}))).toMatchObject({ total: 0, catalogTotal: 0, pages: 0 });
    expect(service(config).get(offer.id)).toBeNull();
  });
  it('keeps original currency and observed date when the UI language changes', () => {
    const offers = service();
    const ko = offers.list(OfferQuerySchema.parse({ locale: 'ko' })).items[0];
    const en = offers.list(OfferQuerySchema.parse({ locale: 'en' })).items[0];
    expect(en?.referencePrice).toEqual(ko?.referencePrice);
    expect(en?.referencePrice).toMatchObject({ currency: 'KRW', amount: '10000', observedOn: '2026-11-10' });
  });
  it('combines search/provider/category/scope and returns consistent paginated counts', () => {
    const offers = service(loadOfferCatalogConfig());
    const first = offers.list(OfferQuerySchema.parse({ q: '부산', category: 'ticket', limit: 3 }));
    const second = offers.list(OfferQuerySchema.parse({ q: '부산', category: 'ticket', limit: 3, page: 2 }));
    expect(first.total).toBeGreaterThan(3); expect(first.items).toHaveLength(3);
    expect(second.total).toBe(first.total);
    expect(first.items.every(offer => offer.category === 'ticket')).toBe(true);
    expect(first.items.map(offer => offer.id).some(id => second.items.some(offer => offer.id === id))).toBe(false);
    expect(offers.list(OfferQuerySchema.parse({ q: 'no-matching-synthetic-keyword' })).items).toEqual([]);
    expect(offers.list(OfferQuerySchema.parse({ page: 999 })).items).toEqual([]);
  });
  it.each([{ locale: 'invalid' }, { limit: 0 }, { limit: 10000 }, { page: 0 }, { category: 'invented' }, { q: 'x'.repeat(101) }])('rejects invalid query %j', query => {
    expect(OfferQuerySchema.safeParse(query).success).toBe(false);
  });
  it('is deterministic for an unchanged source snapshot', () => {
    const config = loadOfferCatalogConfig(); const query = OfferQuerySchema.parse({});
    expect(service(config).list(query)).toEqual(service(config).list(query));
  });
});
describe('read-only offers HTTP API', () => {
  it('serves validated data and rejects invalid requests or state-changing routes', async () => {
    const app = buildApp(loadServerConfig({ NODE_ENV: 'test' }), undefined, undefined, service());
    try {
      const response = await app.inject('/api/offers?locale=en');
      expect(response.statusCode).toBe(200); expect(response.headers['cache-control']).toBe('no-store');
      expect(response.json()).toMatchObject({ total: 1, items: [{ titleLocale: 'ko', provider: { displayName: 'Test Booking' } }] });
      expect((await app.inject('/api/offers/test-ticket')).statusCode).toBe(200);
      expect((await app.inject('/api/offers/missing')).statusCode).toBe(404);
      expect((await app.inject('/api/offers?limit=100000')).statusCode).toBe(400);
      expect((await app.inject({ method: 'POST', url: '/api/offers', payload: { url: 'https://evil.example.test' } })).statusCode).toBe(404);
      expect((await app.inject('/api/trips')).statusCode).toBe(404);
    } finally { await app.close(); }
  });
  it('pauses an individually disabled product without removing other providers',()=>{
    const config=fixture(); const item=config.offers[0];if(!item)throw Error('Missing fixture');
    item.enabled=false;expect(service(config).get(item.id)).toBeNull();expect(service(config).list(OfferQuerySchema.parse({})).total).toBe(0);
  });

});

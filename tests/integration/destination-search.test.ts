import { describe, expect, it } from 'vitest';
import { DestinationQuerySchema, OfferQuerySchema } from '@trip-fit/domain';
import { loadDestinationConfig, DestinationConfigSchema } from '../../apps/server/src/config/destinations.js';
import { loadOfferCatalogConfig } from '../../apps/server/src/config/offers.js';
import { createDestinationService } from '../../apps/server/src/services/destinations.js';
import { createOfferService } from '../../apps/server/src/services/offers.js';
import { publishDestinationSnapshot } from '../../apps/server/src/services/publish-destinations.js';
import { buildApp } from '../../apps/server/src/app.js';
import { loadServerConfig } from '../../apps/server/src/config/env.js';
import { AttractionRecordSchema } from '../../apps/server/src/providers/attraction/parse.js';

function services() {
  const offers = createOfferService(loadOfferCatalogConfig(), () => '2026-11-11');
  const config = loadDestinationConfig();
  return { config, offers, destinations: createDestinationService(config,offers,() => '2026-11') };
}
describe('complete public API tourism search', () => {
  it('paginates every source group without duplicating language rows', () => {
    const {destinations} = services();
    const slugs = [];
    for(let page=1;page<=5;page++) slugs.push(...destinations.list('ko',{page,limit:48}).items.map(item => item.slug));
    expect(slugs).toHaveLength(220);
    expect(new Set(slugs).size).toBe(220);
    expect(destinations.list('ko',{page:1000}).items).toEqual([]);
  });
  it('searches Korean aliases across languages, supports spacing and linked-only filters', () => {
    const {destinations} = services();
    expect(destinations.list('en',{q:'감천 문화 마을'}).items.some(item => item.slug === 'gamcheon')).toBe(true);
    expect(destinations.list('ko',{q:'Gamcheon'}).items.some(item => item.slug === 'gamcheon')).toBe(true);
    const linked = destinations.list('ko',{linked:'linked',limit:48});
    expect(linked.total).toBe(25);
    expect(linked.items.every(item => item.relatedOfferCount>0)).toBe(true);
    expect(destinations.list('ko',{q:'not-a-real-tourism-place'}).total).toBe(0);
    expect(destinations.list('ko',{q:'범어사'}).items.some(item => item.slug==='busan-402')).toBe(true);
  });
  it('expands affiliate search through reviewed relations while retaining provider/category filters', async () => {
    const {destinations,offers} = services();
    const app=buildApp(loadServerConfig({NODE_ENV:'test'}),undefined,undefined,offers,destinations);
    try {
      const result = (await app.inject('/api/offers?q=Gamcheon&limit=48')).json();
      expect(result.items.some((item: {id:string})=>item.id==='b-282525')).toBe(true);
      const onlyStay = (await app.inject('/api/offers?q=감천&category=stay')).json();
      expect(onlyStay.items).toHaveLength(1);
      const provider=onlyStay.items[0].provider.id;
      const filtered=(await app.inject('/api/offers?q=감천&category=tour&provider='+provider)).json();
      expect(filtered.items.every((item:{category:string;provider:{id:string}})=>item.category==='tour'&&item.provider.id===provider)).toBe(true);
      expect(offers.list(OfferQuerySchema.parse({q:'Gamcheon'})).items.some(item=>item.id==='b-282525')).toBe(false);
    } finally {await app.close();}
  });
  it('exposes source status, real addresses and unknown photo/translation states honestly', () => {
    const {destinations,config}=services();
    expect(config.destinations.filter(item=>item.address)).toHaveLength(220);
    const beomeosa=destinations.get('busan-402','ko')?.destination;
    expect(beomeosa?.address).toContain('범어사로 250');
    expect(beomeosa?.reviewStatus).toBe('source');
    expect(beomeosa?.reviewedOn).toBeNull();
    expect(beomeosa?.image?.url).toMatch(/^https:/);
    expect(beomeosa?.image?.licenseUrl).toBeTruthy();
    const foreign=destinations.get('busan-783','ko')?.destination;
    expect(foreign?.translationFallback).toBe(true);
    expect(foreign?.locale).toBe('ja');
    expect(foreign?.address).toBeTruthy();
    expect(foreign?.addressLocale).toBe('ja');
    expect(DestinationQuerySchema.safeParse({limit:49}).success).toBe(false);
  });
});

const emptyConfig = () => DestinationConfigSchema.parse({month:'2026-11',featuredSlugs:[],destinations:[]});
const curation = { reviewedOn:'2026-11-11',identityPolicy:'Test only',entries:[] };
function source(locale='ko') {
  return {locale,record:AttractionRecordSchema.parse({
    sourceId:'900001',title:'Test-only tourism description',originalTitle:'Test-only place',
    districtRaw:'Test-only district',coordinates:{lat:35.16,lng:129.16},imageUrl:null,
    addressRaw:'Test-only street address',descriptionRaw:'<p>Test-only text</p>',holidayInfoRaw:null,warnings:[],
  }),fetchedAt:'2026-11-11T00:00:00.000Z'};
}
describe('safe public snapshot export',()=>{
  it('preserves all locales with corroborated identity, strips markup and leaves review/photos unapproved',()=>{
    const result=publishDestinationSnapshot([source(),source('en')],emptyConfig(),curation);
    expect(result.coverage.sourceLanguageRecords).toBe(2);
    expect(result.config.destinations).toHaveLength(1);
    const item=result.config.destinations[0];
    expect(item?.translations).toHaveLength(2);
    expect(item?.address).toBe('Test-only street address');
    expect(item?.reviewedOn).toBeNull();
    expect(item?.image).toBeNull();
    expect(item?.translations[0]?.description).toBe('Test-only text');
  });
  it('rejects empty exports, duplicate locale rows and coordinate/title identity conflicts',()=>{
    expect(()=>publishDestinationSnapshot([],emptyConfig(),curation)).toThrow();
    expect(()=>publishDestinationSnapshot([source(),source()],emptyConfig(),curation)).toThrow();
    const en=source('en');en.record.coordinates={lat:35.2,lng:129.2};
    expect(()=>publishDestinationSnapshot([source(),en],emptyConfig(),curation)).toThrow('identity');
    en.record.coordinates=source().record.coordinates;en.record.originalTitle='A different test-only place';
    expect(()=>publishDestinationSnapshot([source(),en],emptyConfig(),curation)).toThrow('identity');
  });
  it('does not merge different source IDs even if their titles match',()=>{
    const second=source();second.record.sourceId='900002';
    expect(publishDestinationSnapshot([source(),second],emptyConfig(),curation).config.destinations).toHaveLength(2);
  });
});

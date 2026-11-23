import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES, PromotionsResponseSchema } from '@trip-fit/domain';
import { loadOfferCatalogConfig } from '../../apps/server/src/config/offers.js';
import { loadPromotionCatalog } from '../../apps/server/src/config/promotions.js';
import { createOfferService } from '../../apps/server/src/services/offers.js';
import { createPromotionService } from '../../apps/server/src/services/promotions.js';
import { buildApp } from '../../apps/server/src/app.js';
const time=new Date('2026-11-23T03:00:00Z');
function setup(){const catalog=loadOfferCatalogConfig(),config=loadPromotionCatalog(),offers=createOfferService(catalog,()=> '2026-11-23');return {catalog,config,offers};}
describe('reviewed promotion publication',()=>{
  it('shows the three verified campaigns in five languages and preserves source dates, coupon terms and original prices',()=>{
    const {catalog,config,offers}=setup(),before=JSON.stringify(catalog),service=createPromotionService(config,catalog,offers,()=>time);
    for(const locale of SUPPORTED_LOCALES){const data=service.list(locale);expect(data.items).toHaveLength(3);expect(data.locale).toBe(locale);for(const item of data.items){expect(item.title).toBe(config.items.find(raw=>raw.id===item.id)?.texts[locale].title);expect(item.expiresAt).toBe('2026-11-25T15:00:00Z');}expect(data.items.find(item=>item.code)?.conditions).toContain('100');expect(data.items.find(item=>item.code)?.benefit).toContain('20');}
    expect(JSON.stringify(catalog)).toBe(before);expect(offers.get('e-11186')?.referencePrice?.amount).toBe(catalog.offers.find(offer=>offer.id==='e-11186')?.price?.amount);
  });
  it('hides future, expired, disabled, pending and stale campaigns without extending their verified life',()=>{
    for(const change of [{startsOn:'2026-11-24'},{startsOn:'2026-11-01',endsOn:'2026-11-22',checkedOn:'2026-11-20',reviewExpiresAt:'2026-11-22T00:00:00Z'},{enabled:false},{approvalStatus:'pending'},{reviewExpiresAt:'2026-11-23T02:59:59Z'}] as const){const {catalog,config,offers}=setup();config.items=config.items.map(item=>({...item,...change}));expect(createPromotionService(config,catalog,offers,()=>time).list('en').items).toHaveLength(0);}
    const {catalog,config,offers}=setup();expect(createPromotionService(config,catalog,offers,()=>new Date('2026-11-26T00:00:00Z')).list('en').items).toHaveLength(0);
  });
  it('rejects wrong affiliate tracking and a different nested booking destination',()=>{
    for(const suffix of ['bad-tracking','wrong-destination']){const {catalog,config,offers}=setup();const item=config.items.find(item=>item.target.kind==='affiliate');if(!item||item.target.kind!=='affiliate')throw Error('Missing target');const provider=catalog.providers.find(provider=>provider.id===item.providerId);if(!provider)throw Error('Missing provider');const url=new URL(item.target.href);if(suffix==='bad-tracking'){const key=Object.keys(provider.requiredQuery)[0];if(!key)throw Error('Missing attribution');url.searchParams.set(key,'wrong');}else item.target.bookingSourceUrl='https://www.klook.com/en-US/activity/999';item.target.href=url.href;expect(()=>createPromotionService(config,catalog,offers,()=>time)).toThrow();}
  });
  it('requires an official provider evidence host and a short review expiry',()=>{
    const {catalog,config,offers}=setup();const first=config.items[0];if(!first)throw Error('Missing promotion');first.sourceUrl='https://example.test/claim';expect(()=>createPromotionService(config,catalog,offers,()=>time)).toThrow('evidence');first.sourceUrl=loadPromotionCatalog().items[0]?.sourceUrl??'';first.reviewExpiresAt='2027-12-31T00:00:00Z';expect(()=>createPromotionService(config,catalog,offers,()=>time)).toThrow('review period');
  });
  it('pins product identity and removes offers whose product or provider is no longer public',()=>{
    const {catalog,config,offers}=setup();const item=config.items.find(item=>item.target.kind==='offer');if(!item||item.target.kind!=='offer')throw Error('Missing product');item.target.externalId='changed';expect(()=>createPromotionService(config,catalog,offers,()=>time)).toThrow('identity changed');
    const fresh=setup();const coupon=fresh.config.items.find(item=>item.target.kind==='offer');if(!coupon||coupon.target.kind!=='offer')throw Error('Missing target');const target=coupon.target;const product=fresh.catalog.offers.find(offer=>offer.id===target.offerId);if(!product)throw Error('Missing raw');product.enabled=false;const svc=createPromotionService(fresh.config,fresh.catalog,createOfferService(fresh.catalog),()=>time);expect(svc.list('en').items.some(item=>item.id===coupon.id)).toBe(false);
  });
  it('supports a neutral additional registry entry without core source changes',()=>{
    const {catalog,config}=setup();const base=config.items.find(item=>item.target.kind==='offer');if(!base||base.target.kind!=='offer')throw Error('Missing sample');const old=base.target;const source=catalog.offers.find(item=>item.id===old.offerId),provider=catalog.providers.find(item=>item.id===base.providerId);if(!source||!provider)throw Error('Missing sample');const id='PROVIDER_EXTENSION';catalog.providers.push({...provider,id,displayName:'Extra',localizedDisplayNames:{}});catalog.offers.push({...source,id:'extension-offer',providerId:id});config.items=[{...base,id:'extension-promo',providerId:id,target:{...old,offerId:'extension-offer'}}];expect(createPromotionService(config,catalog,createOfferService(catalog),()=>time).list('en').items[0]?.provider.displayName).toBe('Extra');
  });
  it('does not use a general promotion to bypass restricted foreign-booking eligibility',()=>{
    const {catalog,config}=setup();const item=config.items.find(item=>item.target.kind==='catalog'),restricted=catalog.providers.find(provider=>provider.bookingPolicy!=='open');if(!item||!restricted)throw Error('Missing fixture');config.items=[{...item,providerId:restricted.id,sourceUrl:'https://'+restricted.sourceHosts[0]+'/promotions'}];expect(createPromotionService(config,catalog,createOfferService(catalog),()=>time).list('en').items).toHaveLength(0);
  });
  it('serves English by default, rejects unexpected input and exposes only public DTOs',async()=>{
    const {catalog,config,offers}=setup();const app=buildApp({NODE_ENV:'test',HOST:'127.0.0.1',PORT:3001},undefined,undefined,undefined,undefined,undefined,undefined,undefined,createPromotionService(config,catalog,offers,()=>time));
    try{const response=await app.inject('/api/promotions');expect(response.statusCode).toBe(200);expect(response.headers['cache-control']).toBe('no-store');expect(PromotionsResponseSchema.parse(response.json()).locale).toBe('en');expect(response.body).not.toMatch(/sourceHosts|reviewExpiresAt|evidence|approvalStatus|partnerId/);expect((await app.inject('/api/promotions?locale=invalid')).statusCode).toBe(400);expect((await app.inject('/api/promotions?url=https://example.test')).statusCode).toBe(400);}finally{await app.close();}
  });
});

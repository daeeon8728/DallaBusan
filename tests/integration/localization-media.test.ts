import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { OfferQuerySchema, SafeHttpsSchema } from '@trip-fit/domain';
import { loadOfferCatalogConfig, validateProductImageSources } from '../../apps/server/src/config/offers.js';
import { loadDestinationConfig } from '../../apps/server/src/config/destinations.js';
import { createOfferService } from '../../apps/server/src/services/offers.js';
import { createDestinationService } from '../../apps/server/src/services/destinations.js';
import { publishDestinationSnapshot } from '../../apps/server/src/services/publish-destinations.js';
import { AttractionRecordSchema, parseAttractionPage } from '../../apps/server/src/providers/attraction/parse.js';
import { buildApp } from '../../apps/server/src/app.js';
import { loadServerConfig } from '../../apps/server/src/config/env.js';

describe('editorial product translations and verified media', () => {
  it.each(['en','ja','zh-CN','zh-TW'] as const)('translates all published titles into %s, preserving the original and affiliate target', locale => {
    const config=loadOfferCatalogConfig(); const service=createOfferService(config,()=> '2026-11-12');
    const originals=new Map(config.offers.map(offer=>[offer.id,offer]));
    const items=Array.from({length:service.list(OfferQuerySchema.parse({locale,limit:48})).pages},(_,i)=>service.list(OfferQuerySchema.parse({locale,page:i+1,limit:48})).items).flat();
    expect(items).toHaveLength(402);
    for(const item of items){
      expect(item.titleLocale).toBe(locale);expect(item.localizationStatus).toBe(item.originalTitleLocale===locale?'original':'translated');
      expect(item.title).toBe(item.originalTitleLocale===locale?item.originalTitle:originals.get(item.id)?.localizedTitles[locale]);expect(item.originalTitle).toBe(originals.get(item.id)?.title);
      expect(item.href).toBe(originals.get(item.id)?.localizedHrefs[locale]??originals.get(item.id)?.href);expect(service.get(item.id,locale)?.title).toBe(item.title);
    }
    expect(service.list(OfferQuerySchema.parse({locale,q:'Gamcheon'})).total).toBeGreaterThan(10);
  });
  it('falls back explicitly if a product has no reviewed translation', () => {
    const config=loadOfferCatalogConfig();const offer=config.offers.find(item=>config.providers.find(provider=>provider.id===item.providerId)?.bookingPolicy==='open');if(!offer)throw Error('missing offer');
    offer.localizedTitles={};const item=createOfferService(config).get(offer.id,'en');
    expect(item?.localizationStatus).toBe('fallback');expect(item?.titleLocale).toBe('ko');expect(item?.title).toBe(offer.title);
  });
  it('uses the exact seller images in related groups and preserves their affiliate source', () => {
    const config=loadOfferCatalogConfig(),service=createOfferService(config);
    const destinations=createDestinationService(loadDestinationConfig(),service);
    for(const slug of ['gamcheon','gwangalli']){
      const detail=destinations.get(slug,'en');if(!detail)throw Error('missing destination');
      expect(detail.related.every(x=>x.offer.image.kind==='product'&&x.offer.image.sourceUrl===x.offer.href)).toBe(true);
      expect(detail.related.every(x=>x.offer.localizationStatus==='translated')).toBe(true);
    }
    for(const offer of config.offers.filter(item=>item.enabled)){
      expect(offer.image.credit.length).toBeGreaterThan(3);
      expect(offer.image.url).not.toMatch(/\.svg$/);
      expect(offer.image.url).not.toMatch(/^\/review-assets\/(gwangalli|gamcheon)\.jpg$/);
      expect(offer.image.kind).toBe('product');
      expect(offer.image.sourceUrl).toBe(offer.href);
      expect(offer.image.licenseUrl).toBeNull();
    }
    expect(loadDestinationConfig().destinations.every(x=>x.image)).toBe(true);
  });
  it('rejects a product image URL that does not match the captured product identity',()=>{
    const config=loadOfferCatalogConfig();const raw:unknown=JSON.parse(readFileSync(new URL('../../config/catalog/product-image-sources.json',import.meta.url),'utf8'));
    expect(()=>validateProductImageSources(config,raw)).not.toThrow();
    const offer=config.offers.find(item=>item.enabled);if(!offer)throw Error('Missing published product');
    offer.image.url='https://unmatched.example.test/another-product.jpg';
    expect(()=>validateProductImageSources(config,raw)).toThrow('Product image');
  });
  it('validates locale on product detail requests', async () => {
    const app=buildApp(loadServerConfig({NODE_ENV:'test'}),undefined,undefined,createOfferService(loadOfferCatalogConfig()));
    try{
      expect((await app.inject('/api/offers/b-74132?locale=en')).json().localizationStatus).toBe('translated');
      expect((await app.inject('/api/offers/b-74132?locale=invalid')).statusCode).toBe(400);
      expect((await app.inject('/api/offers/b-74132?url=https://example.test')).statusCode).toBe(400);
    }finally{await app.close();}
  });
});
describe('richer public tourism information', () => {
  it('parses optional visit information without inventing missing values', () => {
    const row={UC_SEQ:'999',MAIN_TITLE:'Test',TITLE:'Test',LAT:'35.1',LNG:'129.1',MAIN_IMG_THUMB:'https://example.test/thumb.jpg',CNTCT_TEL:' 123 ',HOMEPAGE_URL:'not a valid url',TRFC_INFO:'Bus 1',USAGE_DAY_WEEK_AND_TIME:'09:00–18:00',USAGE_AMOUNT:'See official options'};
    const record=parseAttractionPage({getAttractionKr:{header:{code:'00'},pageNo:1,numOfRows:10,totalCount:1,item:[row]}},'ko').records[0];
    expect(record?.imageThumbUrl).toBe('https://example.test/thumb.jpg');expect(record?.contactRaw).toBe('123');
    expect(record?.hoursRaw).toBe('09:00–18:00');expect(record?.transportRaw).toBe('Bus 1');
    const snapshot=publishDestinationSnapshot([{locale:'ko',record,fetchedAt:'2026-11-12T00:00:00Z'}],{month:'2026-11',featuredSlugs:[],destinations:[]},{reviewedOn:'2026-11-12',identityPolicy:'test explicit source identity',entries:[]});
    expect(snapshot.config.destinations[0]?.translations[0]?.homepage).toBeNull();
    expect(snapshot.config.destinations[0]?.translations[0]?.fees).toBe('See official options');
    expect(AttractionRecordSchema.parse({sourceId:'1',title:'Test',originalTitle:'Test',districtRaw:null,addressRaw:null,coordinates:null,imageUrl:null,descriptionRaw:'',holidayInfoRaw:null,warnings:[]}).hoursRaw).toBeNull();
  });
  it.each(['not a url','javascript:alert(1)','http://example.test','https://user:pass@example.test'])('rejects unsafe URLs without throwing during safeParse: %s',url=>{
    expect(SafeHttpsSchema.safeParse(url).success).toBe(false);
  });
  it('publishes full description and actual visit metadata in the selected source language', () => {
    const service=createDestinationService(loadDestinationConfig(),createOfferService(loadOfferCatalogConfig()));
    const detail=service.get('busan-402','en');
    expect(detail?.content.length).toBeGreaterThanOrEqual(detail?.destination.description.length??0);
    expect(detail?.visitInfo.transport).toBeTruthy();expect(detail?.visitInfo.contact).toBeTruthy();
    expect(detail?.destination.locale).toBe('en');
  });
});

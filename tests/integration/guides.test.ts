import { describe, expect, it } from 'vitest';
import { GuideDetailSchema, GuideListSchema, GuideQuerySchema, SUPPORTED_LOCALES } from '@trip-fit/domain';
import { loadGuideSnapshot } from '../../apps/server/src/config/guides.js';
import { createGuideService } from '../../apps/server/src/services/guides.js';
import { buildApp } from '../../apps/server/src/app.js';
const service=createGuideService({food:loadGuideSnapshot('food'),recommended:loadGuideSnapshot('recommended')});
describe('restaurant and theme search API',()=>{
  for(const kind of ['food','recommended'] as const) for(const locale of SUPPORTED_LOCALES) it(kind+' lists actual '+locale+' records with source information',()=>{
    const result=GuideListSchema.parse(service.list(kind,GuideQuerySchema.parse({locale})));
    expect(result.availableTotal).toBeGreaterThan(200);expect(result.items).toHaveLength(12);expect(result.items.every(item=>item.locale===locale)).toBe(true);
    expect(result.source.url).toMatch(/^https:\/\/www.data.go.kr\/data\//);expect(JSON.stringify(result)).not.toMatch(/ServiceKey|serviceKey|SERVICE_KEY/);
  });
  it('filters names/menus/districts/themes and bounds list pages',()=>{
    const all=GuideListSchema.parse(service.list('food',GuideQuerySchema.parse({})));
    const first=all.items[0];if(!first)throw Error('Missing actual restaurant');
    const searched=GuideListSchema.parse(service.list('food',GuideQuerySchema.parse({q:first.name})));
    expect(searched.items.some(item=>item.id===first.id)).toBe(true);
    if(first.district){const filtered=GuideListSchema.parse(service.list('food',GuideQuerySchema.parse({district:first.district})));expect(filtered.total).toBeGreaterThan(0);expect(filtered.items.every(item=>item.district===first.district)).toBe(true);}
    const themed=GuideListSchema.parse(service.list('recommended',GuideQuerySchema.parse({})));const category=themed.categories[0];if(!category)throw Error('Missing actual theme');
    expect(GuideListSchema.parse(service.list('recommended',GuideQuerySchema.parse({category}))).items.every(item=>item.category===category)).toBe(true);
    const empty=GuideListSchema.parse(service.list('food',GuideQuerySchema.parse({q:'NO_MATCH_1234567',page:999})));expect(empty).toMatchObject({items:[],total:0,page:1,pages:0});
  });
  it('marks Korean fallback only on the matching source ID, with distinct source namespaces',()=>{
    const korean=loadGuideSnapshot('food')?.languages.find(group=>group.locale==='ko')?.records;
    const traditional=loadGuideSnapshot('food')?.languages.find(group=>group.locale==='zh-TW')?.records;
    const missing=korean?.find(row=>!traditional?.some(other=>other.id===row.id));if(!missing)throw Error('Expected actual missing translation');
    const detail=GuideDetailSchema.parse(service.get('food',missing.id,'zh-TW'));expect(detail.item).toMatchObject({id:missing.id,locale:'ko',translationFallback:true,name:missing.name});
    expect(service.get('recommended','999999999999','ko')).toBeNull();
  });
  it('validates public inputs and distinguishes unavailable from missing records',async()=>{
    const app=buildApp({NODE_ENV:'test',HOST:'127.0.0.1',PORT:3001},undefined,undefined,undefined,undefined,service);
    try {
      expect((await app.inject('/api/guides/food?locale=en')).statusCode).toBe(200);
      expect((await app.inject('/api/guides/food?locale=fr')).statusCode).toBe(400);
      expect((await app.inject('/api/guides/food?url=https://invalid.test')).statusCode).toBe(400);
      expect((await app.inject('/api/guides/food/999999999999?locale=ko')).statusCode).toBe(404);
      expect((await app.inject('/api/guides/food/70?locale=ko&extra=1')).statusCode).toBe(400);
      expect((await app.inject({method:'POST',url:'/api/guides/food'})).statusCode).toBe(404);
    } finally {await app.close();}
    const absent=buildApp({NODE_ENV:'test',HOST:'127.0.0.1',PORT:3001},undefined,undefined,undefined,undefined,createGuideService({}));
    try {expect((await absent.inject('/api/guides/food')).statusCode).toBe(503);expect((await absent.inject('/api/guides/recommended/58')).statusCode).toBe(503);}finally{await absent.close();}
  });
});

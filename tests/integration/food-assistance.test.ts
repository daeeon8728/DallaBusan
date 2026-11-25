import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { FoodAssistanceSchema, SUPPORTED_LOCALES } from '@trip-fit/domain';
import { createRuntimeApp } from '../../apps/server/src/runtime.js';
import { loadFoodAssistanceConfig } from '../../apps/server/src/config/food-assistance.js';
import { loadGuideSnapshot } from '../../apps/server/src/config/guides.js';
import { loadFoodVisibility } from '../../apps/server/src/config/food-visibility.js';
import { createGuideService } from '../../apps/server/src/services/guides.js';
import { createFoodAssistanceService } from '../../apps/server/src/services/food-assistance.js';

describe('source-pinned restaurant alternatives and Korean cards',()=>{
 let app:FastifyInstance;
 beforeAll(async()=>{app=await createRuntimeApp({readOnlySnapshot:true});});
 afterAll(async()=>{await app?.close();});
 for(const locale of SUPPORTED_LOCALES)it('serves '+locale+' explanations, Korean identity and public source dates',async()=>{
   const response=await app.inject('/api/food-assistance/1516?locale='+locale);
   expect(response.statusCode).toBe(200);
   const value=FoodAssistanceSchema.parse(response.json());
   expect(value.locale).toBe(locale);expect(value.localCard?.name).toBe('부광돼지국밥');
   expect(value.localCard?.dishes[0]?.korean).toBe('돼지국밥');
   expect(value.alternatives.length).toBeGreaterThan(0);
   expect(value.alternatives.every(row=>row.item.id!=='1516'&&row.straightLineMeters>=25&&row.straightLineMeters<=2500)).toBe(true);
   if(locale!=='ko')expect(value.localCard?.dishes[0]?.label).not.toMatch(/[가-힣]/);
   expect(value.source.collectedAt).toContain('2026-11-12');
   expect(JSON.stringify(value)).not.toMatch(/fingerprint|serviceKey|bookingUrl|waitingMinutes/);
 });
 it('withholds changed menu, identity and excluded candidates, without changing the source',()=>{
   const source=loadGuideSnapshot('food');if(!source)throw Error('Missing source');
   const config=loadFoodAssistanceConfig(),policy=loadFoodVisibility(source);
   const guides=createGuideService({food:source},undefined,policy);
   const configCopy=structuredClone(config);
   const member=configCopy.groups.flatMap(group=>group.members).find(row=>row.id==='1516');
   if(!member)throw Error('Missing member');member.fingerprint='0'.repeat(64);
   const service=createFoodAssistanceService(configCopy,source,guides);
   expect(service.get('1516','ko')).toMatchObject({group:null,alternatives:[],localCard:{dishes:[]}});
   expect(service.get('1618','ko')?.alternatives.some(row=>row.item.id==='1516')).toBe(false);
   expect(createFoodAssistanceService(config,source,{...guides,get:(kind,id,locale)=>id==='1618'?null:guides.get(kind,id,locale)}).get('1516','ko')?.alternatives.some(row=>row.item.id==='1618')).toBe(false);
   expect(source.languages.find(group=>group.locale==='ko')?.records.find(row=>row.id==='1516')?.menu).toContain('돼지국밥');
 });
 it('fails closed on menu changes even when older identity checks would have passed',()=>{
   const source=loadGuideSnapshot('food');if(!source)throw Error('Missing source');
   const changed=structuredClone(source),row=changed.languages.find(group=>group.locale==='ko')?.records.find(row=>row.id==='1516');
   if(!row)throw Error('Missing row');row.menu='Changed menu';
   const service=createFoodAssistanceService(loadFoodAssistanceConfig(),changed,createGuideService({food:changed}));
   expect(service.get('1516','ko')?.localCard?.dishes).toEqual([]);
   expect(service.get('1618','ko')?.alternatives.some(row=>row.item.id==='1516')).toBe(false);
 });
 it('does not cross reviewed water-separated areas or fabricate alternatives for unmatched places',async()=>{
   const value=FoodAssistanceSchema.parse((await app.inject('/api/food-assistance/1516')).json());
   expect(value.alternatives.some(row=>row.item.id==='1837')).toBe(false);
   const empty=FoodAssistanceSchema.parse((await app.inject('/api/food-assistance/70')).json());
   expect(empty.alternatives).toEqual([]);expect(empty.localCard?.dishes).toEqual([]);
   expect(empty.localCard?.address).toBeTruthy();
   expect(FoodAssistanceSchema.parse((await app.inject('/api/food-assistance/2261')).json()).localCard).toBeNull();
   const visibility=loadGuideSnapshot('food');if(!visibility)throw Error('Missing source');
   const excluded=[...loadFoodVisibility(visibility).excludedIds][0];if(!excluded)throw Error('Missing excluded ID');
   expect((await app.inject('/api/food-assistance/'+excluded)).statusCode).toBe(404);
 });
 it('validates query, namespace and course membership before exposing next-stop context',async()=>{
   for(const url of ['/api/food-assistance/x','/api/food-assistance/1516?locale=fr','/api/food-assistance/1516?url=https://invalid.test','/api/food-assistance/1516?course=../../x'])
     expect((await app.inject(url)).statusCode).toBe(400);
   expect((await app.inject('/api/food-assistance/999999999')).statusCode).toBe(404);
   const value=FoodAssistanceSchema.parse((await app.inject('/api/food-assistance/204?locale=en&course=fa06')).json());
   expect(value.context).toMatchObject({id:'fa06'});expect(value.context?.nextName).toBeTruthy();
   expect(value.alternatives.some(row=>row.nextStraightLineMeters!==null)).toBe(true);
   expect(FoodAssistanceSchema.parse((await app.inject('/api/food-assistance/1516?course=fa06')).json()).context).toBeNull();
   expect((await app.inject('/api/food-assistance/204')).headers['cache-control']).toBe('no-store');
 });
});

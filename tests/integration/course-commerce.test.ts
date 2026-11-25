import {afterAll,beforeAll,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {CourseOffersSchema,CourseDetailSchema,DestinationDetailSchema,CoursesResponseSchema,CoursePersonaSchema,LocaleSchema} from '@trip-fit/domain';
import {createRuntimeApp} from '../../apps/server/src/runtime.js';
import {loadCourseCatalog} from '../../apps/server/src/config/courses.js';
import {loadCourseCommerce,selectCourseCommerce,CourseCommerceConfigSchema} from '../../apps/server/src/config/course-commerce.js';
import {loadOfferCatalogConfig} from '../../apps/server/src/config/offers.js';
import {createOfferService} from '../../apps/server/src/services/offers.js';
import {createCourseService} from '../../apps/server/src/services/courses.js';
import {createDestinationService} from '../../apps/server/src/services/destinations.js';
import {loadDestinationConfig} from '../../apps/server/src/config/destinations.js';
import {createGuideService} from '../../apps/server/src/services/guides.js';
import {loadGuideSnapshot} from '../../apps/server/src/config/guides.js';
let app:FastifyInstance;
beforeAll(async()=>{app=await createRuntimeApp({readOnlySnapshot:true});});
afterAll(async()=>{await app?.close();});
it('filters each persona in every language and combines it with category without changing routes',async()=>{
 for(const locale of LocaleSchema.options){
 const all=CoursesResponseSchema.parse((await app.inject('/api/courses?locale='+locale)).json());
 expect(all.items.filter(row=>row.featured)).toHaveLength(4);
 for(const persona of CoursePersonaSchema.options){
 const list=CoursesResponseSchema.parse((await app.inject('/api/courses?locale='+locale+'&persona='+persona)).json());
 expect(list.items.length).toBeGreaterThan(0);expect(list.items.map(row=>row.id)).toEqual(all.items.filter(row=>row.personaTag.includes(persona)).map(row=>row.id));
 if(persona==='no-car')expect(list.items.every(row=>row.route.mode==='walking')).toBe(true);
 }
 expect(all.items.every(row=>row.duration.length>4&&row.route.status==='road-route')).toBe(true);
 }
 const combined=CoursesResponseSchema.parse((await app.inject('/api/courses?category=date&persona=no-car')).json());expect(combined.items.length).toBeGreaterThan(0);expect(combined.items.every(row=>row.category==='date'&&row.route.mode==='walking')).toBe(true);
 expect((await app.inject('/api/courses?persona=invalid')).statusCode).toBe(400);
});
it('resolves four real bundles from current reviewed links, preserves original price and never publishes demos',async()=>{
 for(const locale of LocaleSchema.options)for(const id of ['fa02','fa04','da01','da05']){
 const response=await app.inject('/api/courses/'+id+'/offers?locale='+locale);const data=CourseOffersSchema.parse(response.json());
 expect(data.affiliateBundle).not.toBeNull();const bundle=data.affiliateBundle;if(!bundle)throw Error('Missing bundle');
 expect(bundle.affiliateUrl).toBe(bundle.offer.href);expect(bundle.provider).toBe(bundle.offer.provider.id);expect(bundle.offer.category).toBe('tour');
 const place=DestinationDetailSchema.parse((await app.inject('/api/destinations/'+bundle.destinationId+'?locale='+locale)).json());expect(place.related.some(row=>row.offer.id===bundle.offer.id&&row.relationship==='tour')).toBe(true);
 expect(bundle.basePriceKRW).toBe(bundle.offer.referencePrice?.currency==='KRW'?Number(bundle.offer.referencePrice.amount):null);
 expect(data.affiliateItems.every(row=>row.kind==='stay'?row.offer.category==='stay':row.offer.category!=='stay'&&row.offer.category!=='tour')).toBe(true);
 expect(new Set(data.affiliateItems.map(row=>row.offer.id)).size).toBe(data.affiliateItems.length);
 expect(response.body).not.toContain('example.test');expect(response.body).not.toContain('demo-');
 const detail=await app.inject('/api/courses/'+id+'?locale='+locale);expect(detail.headers['cache-control']).toBe('no-store');
 expect(CourseDetailSchema.parse(detail.json()).course.affiliateBundle).toEqual(bundle);
 }
});
it('withholds stale source identities, changed stop order and expired bundle reviews without hiding individual options',()=>{
 const courses=loadCourseCatalog(),offers=loadOfferCatalogConfig();
 const config=CourseCommerceConfigSchema.parse(JSON.parse(readFileSync('config/catalog/course-commerce.json','utf8')));
 expect(selectCourseCommerce(config,courses,offers)).toHaveLength(4);
 const changed=structuredClone(courses);const first=changed.items.find(row=>row.id===config.items[0]?.courseId);if(!first)throw Error('No course');first.steps.reverse();expect(selectCourseCommerce(config,changed,offers)).toHaveLength(3);
 const modified=structuredClone(offers);const offer=modified.offers.find(row=>row.id===config.items[0]?.offerId);if(!offer)throw Error('No offer');offer.title+=' changed';expect(selectCourseCommerce(config,courses,modified)).toHaveLength(3);
 const duplicate=config.items[0];if(!duplicate)throw Error('Missing commerce rule');expect(()=>selectCourseCommerce({...config,items:[...config.items,duplicate]},courses,offers)).toThrow('Duplicate');
 const serviceOffers=createOfferService(offers),destinations=createDestinationService(loadDestinationConfig(),serviceOffers),guides=createGuideService({food:loadGuideSnapshot('food'),recommended:null});
 const service=createCourseService(courses,destinations,guides,undefined,undefined,loadCourseCommerce(courses,offers),()=> '2026-12-03',serviceOffers);
 expect(service.offers('fa04','en')?.affiliateBundle).toBeNull();expect(service.offers('fa04','en')?.affiliateItems.length).toBeGreaterThan(0);
 const hidden=structuredClone(offers);const target=hidden.offers.find(row=>row.id===config.items[0]?.offerId);if(!target)throw Error('No target');target.enabled=false;
 const filteredOffers=createOfferService(hidden),filtered=createCourseService(courses,createDestinationService(loadDestinationConfig(),filteredOffers),guides,undefined,undefined,config.items,()=> '2026-11-25',filteredOffers);
 expect(filtered.offers(config.items[0]?.courseId??'','en')?.affiliateBundle).toBeNull();
});
it('only uses reviewed stays at the actual final stop and follows provider priority / verified property grouping',()=>{
 const courses=structuredClone(loadCourseCatalog()),offers=createOfferService(loadOfferCatalogConfig()),guides=createGuideService({food:loadGuideSnapshot('food'),recommended:null});
 const first=courses.items[0];if(!first)throw Error('No course');first.steps=[{kind:'destination',id:'busan-373',stayMinutes:45}];
 const service=createCourseService(courses,createDestinationService(loadDestinationConfig(),offers),guides,undefined,undefined,[],undefined,offers);
 const stays=service.offers(first.id,'en')?.affiliateItems.filter(row=>row.kind==='stay')??[];
 expect(stays.length).toBeGreaterThan(0);expect(stays.every(row=>row.destinationId==='busan-373'&&row.areaLabel)).toBe(true);
 const expected=offers.selectForDisplay(loadDestinationConfig().destinations.find(row=>row.slug==='busan-373')?.related.filter(row=>row.relationship==='stay').map(row=>row.offerId)??[],'en').slice(0,3);
 expect(stays.map(row=>row.offer.id)).toEqual(expected.map(row=>row.id));
 expect(service.offers('fa04','en')?.affiliateItems.some(row=>row.kind==='stay')).toBe(false);
});
it('keeps four requested mock shapes isolated and non-bookable',()=>{
 const price=z.number().nonnegative();const link=z.string().url().refine(url=>new URL(url).hostname==='booking.example.test');
 const fields={provider:z.string(),basePriceKRW:price,affiliateUrl:link};
 const mock=z.strictObject({environment:z.literal('test-only'),bookable:z.literal(false),items:z.array(z.strictObject({id:z.string(),title:z.string(),personaTag:z.array(CoursePersonaSchema),duration:z.string(),affiliateBundle:z.strictObject({...fields,title:z.string(),badgeText:z.string(),persuasionCopy:z.string()}),affiliateItems:z.array(z.strictObject({...fields,spotName:z.string(),productTitle:z.string()}))})).length(4)}).parse(JSON.parse(readFileSync('tests/fixtures/course-commerce-demo.json','utf8')));
 expect(mock.bookable).toBe(false);
});

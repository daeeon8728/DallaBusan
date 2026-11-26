import {afterAll,beforeAll,expect,it,vi} from 'vitest';
import type {FastifyInstance} from 'fastify';
import {MapLinksSchema,LocaleSchema,CourseDetailSchema} from '@trip-fit/domain';
import {createRuntimeApp} from '../../apps/server/src/runtime.js';
import {createMapLinkService} from '../../apps/server/src/services/map-links.js';
import {createDestinationService} from '../../apps/server/src/services/destinations.js';
import {loadDestinationConfig} from '../../apps/server/src/config/destinations.js';
import {createOfferService} from '../../apps/server/src/services/offers.js';
import {loadOfferCatalogConfig} from '../../apps/server/src/config/offers.js';
import {createGuideService} from '../../apps/server/src/services/guides.js';
import {loadMapLinkConfig} from '../../apps/server/src/config/map-links.js';
let app:FastifyInstance;beforeAll(async()=>{app=await createRuntimeApp({readOnlySnapshot:true});});afterAll(async()=>{await app?.close();});
it('exports the current course in order without keys or external HTTP calls in five languages',async()=>{
 for(const locale of LocaleSchema.options){const course=CourseDetailSchema.parse((await app.inject('/api/courses/fa01?locale='+locale)).json()).course,places=course.steps.map(s=>s.kind+':'+s.id).join(',');const response=await app.inject('/api/map-links?'+new URLSearchParams({locale,places,mode:'driving'}));expect(response.statusCode).toBe(200);const data=MapLinksSchema.parse(response.json());expect(data.stops.map(s=>s.name)).toEqual(course.steps.map(s=>s.name));expect(data.embedEnabled).toBe(false);expect(data.legs).toHaveLength(course.steps.length-1);const first=data.parts[0];if(!first)throw Error('No route');const url=new URL(first.url);expect(url.origin).toBe('https://www.google.com');expect(url.searchParams.get('api')).toBe('1');expect(url.searchParams.get('travelmode')).toBe('driving');expect(url.searchParams.has('key')).toBe(false);expect(url.searchParams.get('origin')).toBe(course.steps[0]?.coordinates?.lat+','+course.steps[0]?.coordinates?.lng);}
});
it('splits up to twelve stops without dropping any and exports transit one leg at a time',async()=>{
 const source=CourseDetailSchema.parse((await app.inject('/api/courses/fa01?locale=en')).json()).course;const places=source.steps.slice(0,3).map(s=>s.kind+':'+s.id).join(',');const data=MapLinksSchema.parse((await app.inject('/api/map-links?'+new URLSearchParams({places,mode:'transit'}))).json());expect(data.parts).toHaveLength(2);expect(data.parts.map(p=>[p.from,p.to])).toEqual([[1,2],[2,3]]);expect(data.parts.every(p=>!new URL(p.url).searchParams.has('waypoints'))).toBe(true);
 const destinations=createDestinationService(loadDestinationConfig(),createOfferService(loadOfferCatalogConfig())),refs=loadDestinationConfig().destinations.slice(0,12).map(d=>({kind:'destination' as const,id:d.slug})),anchors=new Map(refs.map((r,i)=>['destination:'+r.id,{status:'available' as const,coordinates:{lat:35.1+i*.001,lng:129.1}}]));const service=createMapLinkService({embedKey:'test-only-restricted-browser-key'},destinations,createGuideService({}),anchors);const full=service.links(refs,'en','recommended');if(!full)throw Error('Missing data');expect(full.parts.map(p=>[p.from,p.to])).toEqual([[1,5],[5,9],[9,12]]);expect(full.legs).toHaveLength(11);for(const row of full.parts){expect(row.url.length).toBeLessThanOrEqual(2048);expect((new URL(row.url).searchParams.get('waypoints')??'').split('|').length).toBeLessThanOrEqual(3);}expect(full.stops[0]?.embedUrl).toContain('/maps/embed/v1/place?');expect(full.embedEnabled).toBe(true);
 anchors.delete('destination:'+refs[5]?.id);const missing=service.links(refs,'en','recommended');expect(missing?.missingCoordinates).toBe(true);expect(missing?.parts).toEqual([]);expect(missing?.legs).toEqual([]);expect(missing?.stops).toHaveLength(12);
});
it('rejects unknown places, arbitrary URLs, duplicate and oversized routes, and invalid keys',async()=>{for(const places of ['url:https://evil.test','destination:busan-373,destination:busan-373',Array.from({length:13},(_,i)=>'food:'+i).join(',')])expect((await app.inject('/api/map-links?'+new URLSearchParams({places}))).statusCode).toBe(400);expect((await app.inject('/api/map-links?places=food:missing')).statusCode).toBe(404);expect(loadMapLinkConfig({GOOGLE_MAPS_EMBED_API_KEY:'secret\ninvalid'}).embedKey).toBeNull();});
it('uses transit legs by default and isolates regression servers from a real environment key',async()=>{
 const path='/api/map-links?places=destination:busan-373,destination:busan-1422&locale=en';
 const current=MapLinksSchema.parse((await app.inject(path)).json());expect(current.mode).toBe('transit');expect(new URL(current.parts[0]?.url??'').searchParams.get('travelmode')).toBe('transit');
 vi.stubEnv('GOOGLE_MAPS_EMBED_API_KEY','test-only-browser-key-at-least-thirty-characters');
 let isolated:FastifyInstance|undefined,injected:FastifyInstance|undefined;
 try{isolated=await createRuntimeApp({readOnlySnapshot:true});expect(MapLinksSchema.parse((await isolated.inject(path)).json()).embedEnabled).toBe(false);injected=await createRuntimeApp({readOnlySnapshot:true,mapLinkConfig:{embedKey:'test-only-explicit-key'}});expect(MapLinksSchema.parse((await injected.inject(path)).json()).embedEnabled).toBe(true);}finally{await isolated?.close();await injected?.close();vi.unstubAllEnvs();}
});

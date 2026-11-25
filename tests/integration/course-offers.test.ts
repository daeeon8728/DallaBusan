import {beforeAll,afterAll,it,expect} from 'vitest';
import type {FastifyInstance} from 'fastify';
import {CourseOffersSchema,DestinationDetailSchema,CourseDetailSchema,LocaleSchema} from '@trip-fit/domain';
import {createRuntimeApp} from '../../apps/server/src/runtime.js';
let app:FastifyInstance;
beforeAll(async()=>{app=await createRuntimeApp({readOnlySnapshot:true});});
afterAll(async()=>{await app?.close();});
it('uses current reviewed destination relationships and excludes stays, duplicates and unrelated offers',async()=>{
 for(const locale of LocaleSchema.options){
  const response=await app.inject('/api/courses/fa01/offers?locale='+locale);
  expect(response.statusCode).toBe(200);expect(response.headers['cache-control']).toBe('no-store');
  const value=CourseOffersSchema.parse(response.json());
  const course=CourseDetailSchema.parse((await app.inject('/api/courses/fa01?locale='+locale)).json()).course;
  expect(value.items.length).toBeGreaterThan(0);
  expect(new Set(value.items.map(item=>item.offer.id)).size).toBe(value.items.length);
  for(const item of value.items){
   expect(course.steps.some(step=>step.kind==='destination'&&step.id===item.destinationId)).toBe(true);
   const destination=DestinationDetailSchema.parse((await app.inject('/api/destinations/'+item.destinationId+'?locale='+locale)).json());
   expect(destination.related.some(row=>row.relationship===item.relationship&&row.offer.id===item.offer.id)).toBe(true);
   expect(item.offer.category).not.toBe('stay');
  }
 }
});
it('returns explicit empty or missing states and rejects injected query parameters',async()=>{
 expect(CourseOffersSchema.parse((await app.inject('/api/courses/fo01/offers')).json()).items).toEqual([]);
 expect((await app.inject('/api/courses/fa99/offers')).statusCode).toBe(404);
 expect((await app.inject('/api/courses/invalid/offers')).statusCode).toBe(400);
 expect((await app.inject('/api/courses/fa01/offers?locale=fr')).statusCode).toBe(400);
 expect((await app.inject('/api/courses/fa01/offers?url=https://invalid.test')).statusCode).toBe(400);
});

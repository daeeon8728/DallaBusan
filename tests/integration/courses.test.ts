import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CoursesResponseSchema, CourseDetailSchema, LocaleSchema } from '@trip-fit/domain';
import type { FastifyInstance } from 'fastify';
import { createRuntimeApp } from '../../apps/server/src/runtime.js';
import { loadCourseCatalog, loadCourseSourceRows, selectSourceCheckedCourses } from '../../apps/server/src/config/courses.js';
import { createCourseService } from '../../apps/server/src/services/courses.js';
import { loadDestinationConfig } from '../../apps/server/src/config/destinations.js';
import { createDestinationService } from '../../apps/server/src/services/destinations.js';
import { createOfferService } from '../../apps/server/src/services/offers.js';
import { loadOfferCatalogConfig } from '../../apps/server/src/config/offers.js';
import { createGuideService } from '../../apps/server/src/services/guides.js';
import { loadGuideSnapshot } from '../../apps/server/src/config/guides.js';

describe('source-linked editorial course previews', () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await createRuntimeApp({ readOnlySnapshot: true }); });
  afterAll(async () => { await app?.close(); });
  it('serves fifty ideas in five languages with ten per category and pending checks', async () => {
    for (const locale of LocaleSchema.options) {
      const r = await app.inject('/api/courses?locale='+locale); expect(r.statusCode).toBe(200);
      const input: unknown = r.json(), data = CoursesResponseSchema.parse(input);
      expect(data.total).toBe(50); expect(data.items).toHaveLength(50); expect(data.counts).toEqual({family:10,date:10,friends:10,food:10,dallabusan:10});
      expect(new Set(data.items.map(x=>x.id)).size).toBe(50);
      for (const item of data.items) {
        expect(item.locale).toBe(locale); expect(item.status).toBe('editorial-idea'); expect(item.routeCheck).toBe('pending'); expect(item.fieldValidation).toBe('not-performed');
        expect(item.steps.every(step=>step.kind!=='note'&&step.coordinates!==null)).toBe(true);
        expect(item.route.status).toBe('road-route');expect(item.route).not.toHaveProperty('geometry');expect(item.intro.length).toBeGreaterThan(10);
        expect(item).not.toHaveProperty('travelMinutes'); expect(item).not.toHaveProperty('award'); expect(item).not.toHaveProperty('bookingUrl');
        for(const step of item.steps) if(step.kind==='note') { expect(step.href).toBeNull(); expect(step.id).toBeNull(); } else {
          expect(step.href).toMatch(/^\/(places|food)\//); expect(step.id).not.toBeNull(); expect(step.sourceUrl).toMatch(/^https?:/);
        }
      }
      if (locale!=='ko') for(const item of data.items) expect(item.title).not.toMatch(/[가-힣]/);
    }
  });
  it('withholds every affected idea after a source fingerprint changes or its namespace is missing', () => {
    const config = loadCourseCatalog(), rows = loadCourseSourceRows(), ref = config.sources[0];
    if (!ref) throw Error('Missing source');
    const key = ref.kind+':'+ref.id;
    rows.set(key,{changed:true});
    const affected = config.items.filter(item=>item.steps.some(step=>step.kind===ref.kind&&'id' in step&&step.id===ref.id)).map(x=>x.id);
    expect(affected.length).toBeGreaterThan(0);
    const checked = selectSourceCheckedCourses(config,rows);
    expect(checked.items.some(item=>affected.includes(item.id))).toBe(false);
    rows.delete(key);
    expect(selectSourceCheckedCourses(config,rows).items).toEqual(checked.items);
    const duplicate=structuredClone(config); const first=duplicate.items[0]; if(!first)throw Error('No course'); duplicate.items.push(first);
    expect(()=>selectSourceCheckedCourses(duplicate,rows)).toThrow('Duplicate course');
  });
  it('filters categories, resolves source details and validates missing/invalid requests', async () => {
    const list: unknown = (await app.inject('/api/courses?category=food')).json(); expect(CoursesResponseSchema.parse(list).items).toHaveLength(10);
    const detail: unknown = (await app.inject('/api/courses/fa01?locale=en')).json(), course = CourseDetailSchema.parse(detail).course;
    expect(course.steps[0]?.href).toBe('/places/busan-1310');
    expect(course.route.geometry.length).toBeGreaterThan(1);expect(course.route.legs).toHaveLength(course.steps.length-1);expect(course.steps[1]?.menu).not.toBeNull();
    expect(course.steps.every(step=>step.stayMinutes>=10&&step.description!==null)).toBe(true);
    for(const path of ['/api/courses?locale=invalid','/api/courses?category=invalid','/api/courses/invalid']) expect((await app.inject(path)).statusCode).toBe(400);
    expect((await app.inject('/api/courses/fa99')).statusCode).toBe(404);
    const incomplete: unknown = (await app.inject('/api/courses/fo10')).json();
    expect(CourseDetailSchema.parse(incomplete).course.steps.some(step=>step.kind==='note')).toBe(false);
    expect(CourseDetailSchema.parse(incomplete).course.steps.some(step=>step.id==='959'&&step.kind==='food')).toBe(true);
  });
  it('withholds an entire course when a linked stop cannot be resolved instead of skipping it', () => {
    const config = structuredClone(loadCourseCatalog()), first = config.items[0]; if (!first) throw Error('No course');
    first.steps.push({kind:'food',id:'missing-place',stayMinutes:45});
    const service = createCourseService(config,createDestinationService(loadDestinationConfig(),createOfferService(loadOfferCatalogConfig())),createGuideService({food:loadGuideSnapshot('food'),recommended:null}));
    expect(service.get(first.id,'en')).toBeNull(); expect(service.list('en').items.some(x=>x.id===first.id)).toBe(false);
  });
  it('adds ten distinct friends sequences with specific five-language guidance and all route legs', async()=>{
    const catalog=loadCourseCatalog(),friends=catalog.items.filter(item=>item.category==='friends');
    expect(friends).toHaveLength(10);
    const sequences=catalog.items.map(item=>JSON.stringify(item.steps.map(step=>step.kind+':'+('id' in step?step.id:''))));
    expect(new Set(sequences).size).toBe(catalog.items.length);
    for(const locale of LocaleSchema.options){
      const filtered=CoursesResponseSchema.parse((await app.inject('/api/courses?category=friends&locale='+locale)).json());
      expect(filtered.items).toHaveLength(10);expect(filtered.total).toBe(50);
      for(const item of friends){
        const result=await app.inject('/api/courses/'+item.id+'?locale='+locale);expect(result.statusCode).toBe(200);
        const course=CourseDetailSchema.parse(result.json()).course;
        expect(course.category).toBe('friends');expect(course.intro.length).toBeGreaterThan(20);expect(course.tips.length).toBeGreaterThan(15);
        expect(course.steps.every(step=>step.id&&step.coordinates&&step.image&&step.href)).toBe(true);
        expect(course.route.legs).toHaveLength(course.steps.length-1);expect(course.route.status).toBe('road-route');
        if(locale==='en'&&item.id==='fr09'){const meal=course.steps.find(step=>step.kind==='food'&&step.id==='1108');expect(meal?.description).toBe('');expect(meal?.menu).toBeTruthy();}
      }
    }
  });

});

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
  it('serves forty ideas in five languages with ten per category and pending checks', async () => {
    for (const locale of LocaleSchema.options) {
      const r = await app.inject('/api/courses?locale='+locale); expect(r.statusCode).toBe(200);
      const input: unknown = r.json(), data = CoursesResponseSchema.parse(input);
      expect(data.total).toBe(40); expect(data.items).toHaveLength(40); expect(data.counts).toEqual({family:10,date:10,food:10,dallabusan:10});
      expect(new Set(data.items.map(x=>x.id)).size).toBe(40);
      for (const item of data.items) {
        expect(item.locale).toBe(locale); expect(item.status).toBe('editorial-idea'); expect(item.routeCheck).toBe('pending'); expect(item.fieldValidation).toBe('not-performed');
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
    for(const path of ['/api/courses?locale=invalid','/api/courses?category=invalid','/api/courses/invalid']) expect((await app.inject(path)).statusCode).toBe(400);
    expect((await app.inject('/api/courses/fa99')).statusCode).toBe(404);
    const incomplete: unknown = (await app.inject('/api/courses/fo10')).json();
    expect(CourseDetailSchema.parse(incomplete).course.steps.at(-1)?.name).toContain('not selected');
  });
  it('withholds an entire course when a linked stop cannot be resolved instead of skipping it', () => {
    const config = structuredClone(loadCourseCatalog()), first = config.items[0]; if (!first) throw Error('No course');
    first.steps.push({kind:'food',id:'missing-place'});
    const service = createCourseService(config,createDestinationService(loadDestinationConfig(),createOfferService(loadOfferCatalogConfig())),createGuideService({food:loadGuideSnapshot('food'),recommended:null}));
    expect(service.get(first.id,'en')).toBeNull(); expect(service.list('en').items.some(x=>x.id===first.id)).toBe(false);
  });
});

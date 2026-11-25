import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {SafeHttpsSchema} from '@trip-fit/domain';
import {offerRecommendationFingerprint} from './offer-recommendations.js';
import type {OfferCatalogConfig} from './offers.js';
import type {CourseCatalog} from './courses.js';
export const CourseCommerceConfigSchema=z.strictObject({version:z.literal(1),evidenceStatus:z.literal('assistant-source-evidence'),items:z.array(z.strictObject({courseId:z.string(),offerId:z.string(),destinationId:z.string(),sourceHash:z.string().regex(/^[a-f0-9]{64}$/),courseHash:z.string().regex(/^[a-f0-9]{64}$/),evidenceUrl:SafeHttpsSchema,evidenceExcerpt:z.string().min(1),reviewedOn:z.iso.date(),reviewExpiresOn:z.iso.date(),coverage:z.literal('selected-stop-options-only')}))});
export type CourseCommerceConfig=z.infer<typeof CourseCommerceConfigSchema>;
export function courseCommerceFingerprint(course:CourseCatalog['items'][number]){return createHash('sha256').update(JSON.stringify([course.mode,course.steps])).digest('hex');}
export function selectCourseCommerce(input:CourseCommerceConfig,courses:CourseCatalog,offers:OfferCatalogConfig){
 if(new Set(input.items.map(item=>item.courseId)).size!==input.items.length)throw Error('Duplicate course commerce identity');
 return input.items.filter(item=>{const course=courses.items.find(row=>row.id===item.courseId),offer=offers.offers.find(row=>row.id===item.offerId);return course&&offer&&offer.category==='tour'&&course.steps.some(step=>step.kind==='destination'&&step.id===item.destinationId)&&courseCommerceFingerprint(course)===item.courseHash&&offerRecommendationFingerprint(offer)===item.sourceHash&&offer.sourceUrl===item.evidenceUrl;});
}
export function loadCourseCommerce(courses:CourseCatalog,offers:OfferCatalogConfig){const input:unknown=JSON.parse(readFileSync(new URL('../../../../config/catalog/course-commerce.json',import.meta.url),'utf8'));return selectCourseCommerce(CourseCommerceConfigSchema.parse(input),courses,offers);}

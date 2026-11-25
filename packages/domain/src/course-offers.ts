import {CourseAffiliateBundleSchema,CourseAffiliateItemSchema} from './course-commerce.js';
import {z} from 'zod';
import {LocaleSchema} from './schemas.js';
import {PublicOfferSchema} from './offers.js';
export const CourseOffersSchema=z.strictObject({
 affiliateBundle:CourseAffiliateBundleSchema.nullable().default(null),affiliateItems:z.array(CourseAffiliateItemSchema).default([]),
 locale:LocaleSchema,courseId:z.string(),items:z.array(z.strictObject({
  destinationId:z.string(),destinationName:z.string(),relationship:z.enum(['tour','ticket','experience']),offer:PublicOfferSchema,
 })).max(12),
});

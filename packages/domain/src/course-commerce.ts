import {z} from 'zod';
import {PublicOfferSchema} from './offers.js';
export const CoursePersonaSchema=z.enum(['first-timer','no-car','couples','day-trip']);
const Fields={provider:z.string().min(1),basePriceKRW:z.number().nonnegative().nullable(),affiliateUrl:z.string().url(),offer:PublicOfferSchema};
export const CourseAffiliateBundleSchema=z.strictObject({...Fields,title:z.string(),badgeText:z.string(),persuasionCopy:z.string(),destinationId:z.string(),spotName:z.string()});
export const CourseAffiliateItemSchema=z.strictObject({...Fields,spotName:z.string(),productTitle:z.string(),destinationId:z.string(),kind:z.enum(['spot','stay']),areaLabel:z.string().nullable()});
export type CoursePersona=z.infer<typeof CoursePersonaSchema>;
